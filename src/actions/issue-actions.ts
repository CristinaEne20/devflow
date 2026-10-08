"use server";

import type { Prisma } from "@/generated/prisma/client";
import { DomainError, runAction, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import type { IssueStatus } from "@/lib/domain";
import { needsRebalance, positionBetween, positionForIndex } from "@/lib/position";
import { revalidateProject } from "@/lib/revalidate";
import {
  createIssueSchema,
  deleteIssueSchema,
  moveIssueSchema,
  updateIssueSchema,
  validateHierarchy,
  type CreateIssueInput,
  type DeleteIssueInput,
  type MoveIssueInput,
  type UpdateIssueInput,
} from "@/lib/validation";

type Tx = Prisma.TransactionClient;

const columnOrder = [{ position: "asc" }, { createdAt: "asc" }] satisfies Prisma.IssueOrderByWithRelationInput[];

async function bottomPosition(tx: Tx, projectId: string, status: IssueStatus, excludeId?: string) {
  const last = await tx.issue.findFirst({
    where: { projectId, status, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return positionBetween(last?.position ?? null, null);
}

async function loadParent(tx: Tx, parentId: string | null) {
  if (!parentId) return null;
  const parent = await tx.issue.findUnique({ where: { id: parentId }, select: { type: true, projectId: true } });
  if (!parent) throw new DomainError("Parent issue not found");
  return parent;
}

async function assertAssigneeExists(tx: Tx, assigneeId: string | null | undefined) {
  if (!assigneeId) return;
  const user = await tx.user.findUnique({ where: { id: assigneeId }, select: { id: true } });
  if (!user) throw new DomainError("Assignee not found");
}

/** Renumbers a column evenly, inserting `movedId` directly after `beforeId` (or first). */
async function rebalanceColumn(
  tx: Tx,
  projectId: string,
  status: IssueStatus,
  movedId: string,
  beforeId: string | null,
) {
  const others = await tx.issue.findMany({
    where: { projectId, status, NOT: { id: movedId } },
    orderBy: columnOrder,
    select: { id: true },
  });
  const ids = others.map((issue) => issue.id);
  ids.splice(beforeId ? ids.indexOf(beforeId) + 1 : 0, 0, movedId);

  for (const [index, id] of ids.entries()) {
    await tx.issue.update({
      where: { id },
      data: { position: positionForIndex(index), ...(id === movedId ? { status } : {}) },
    });
  }
}

export async function createIssue(input: CreateIssueInput): Promise<ActionResult<{ key: string }>> {
  return runAction(async () => {
    const data = createIssueSchema.parse(input);
    const reporter = await getCurrentUser();

    const issue = await db.$transaction(async (tx) => {
      const exists = await tx.project.findUnique({ where: { id: data.projectId }, select: { id: true } });
      if (!exists) throw new DomainError("Project not found");

      const hierarchyError = validateHierarchy(data.type, await loadParent(tx, data.parentId), data.projectId);
      if (hierarchyError) throw new DomainError(hierarchyError);
      await assertAssigneeExists(tx, data.assigneeId);

      // Incrementing the counter row-locks the project, so concurrent creates
      // are serialized and each gets a unique number.
      const project = await tx.project.update({
        where: { id: data.projectId },
        data: { issueCounter: { increment: 1 } },
        select: { key: true, issueCounter: true },
      });

      return tx.issue.create({
        data: {
          projectId: data.projectId,
          number: project.issueCounter,
          key: `${project.key}-${project.issueCounter}`,
          title: data.title,
          description: data.description ?? null,
          type: data.type,
          status: data.status,
          priority: data.priority,
          storyPoints: data.storyPoints,
          assigneeId: data.assigneeId,
          parentId: data.parentId,
          reporterId: reporter.id,
          position: await bottomPosition(tx, data.projectId, data.status),
        },
        select: { key: true },
      });
    });

    revalidateProject();
    return { key: issue.key };
  });
}

export async function updateIssue(input: UpdateIssueInput): Promise<ActionResult<{ key: string }>> {
  return runAction(async () => {
    const { id, patch } = updateIssueSchema.parse(input);

    const issue = await db.$transaction(async (tx) => {
      const current = await tx.issue.findUnique({
        where: { id },
        select: { projectId: true, type: true, status: true, parentId: true, children: { select: { type: true } } },
      });
      if (!current) throw new DomainError("Issue not found");

      let parentId = patch.parentId;
      if (patch.type !== undefined || patch.parentId !== undefined) {
        const nextType = patch.type ?? current.type;
        const nextParentId = patch.parentId === undefined ? current.parentId : patch.parentId;
        if (nextParentId === id) throw new DomainError("An issue cannot be its own parent");

        let parent = await loadParent(tx, nextParentId);
        // Changing only the type drops a parent the new type can't have (e.g. Subtask → Task).
        if (patch.parentId === undefined && parent && validateHierarchy(nextType, parent, current.projectId)) {
          parent = null;
          parentId = null;
        }

        const hierarchyError = validateHierarchy(nextType, parent, current.projectId);
        if (hierarchyError) throw new DomainError(hierarchyError);

        const asParent = { type: nextType, projectId: current.projectId };
        if (current.children.some((child) => validateHierarchy(child.type, asParent, current.projectId) !== null)) {
          throw new DomainError("Can't change type: existing child issues wouldn't be valid under the new type");
        }
      }

      await assertAssigneeExists(tx, patch.assigneeId);

      // A status change from the drawer (not a drag) appends to the new column.
      const position =
        patch.status !== undefined && patch.status !== current.status
          ? await bottomPosition(tx, current.projectId, patch.status, id)
          : undefined;

      return tx.issue.update({
        where: { id },
        data: { ...patch, parentId, position },
        select: { key: true },
      });
    });

    revalidateProject();
    return { key: issue.key };
  });
}

export async function moveIssue(input: MoveIssueInput): Promise<ActionResult> {
  return runAction(async () => {
    const { issueId, toStatus, beforeId, afterId } = moveIssueSchema.parse(input);

    await db.$transaction(async (tx) => {
      const issue = await tx.issue.findUnique({ where: { id: issueId }, select: { projectId: true } });
      if (!issue) throw new DomainError("Issue not found");

      // Neighbors are re-read from the database: client positions are never trusted.
      const neighborIds = [beforeId, afterId].filter((value): value is string => value !== null);
      const neighbors = await tx.issue.findMany({
        where: { id: { in: neighborIds }, projectId: issue.projectId, status: toStatus, NOT: { id: issueId } },
        select: { id: true, position: true },
      });
      const before = beforeId ? neighbors.find((n) => n.id === beforeId) : undefined;
      const after = afterId ? neighbors.find((n) => n.id === afterId) : undefined;
      const isStale = (beforeId !== null && !before) || (afterId !== null && !after);

      if (isStale) {
        // The client's view of the column is out of date; append instead of failing the drop.
        await tx.issue.update({
          where: { id: issueId },
          data: { status: toStatus, position: await bottomPosition(tx, issue.projectId, toStatus, issueId) },
        });
      } else {
        const beforePosition = before?.position ?? null;
        const afterPosition = after?.position ?? null;
        if (needsRebalance(beforePosition, afterPosition)) {
          await rebalanceColumn(tx, issue.projectId, toStatus, issueId, beforeId);
        } else {
          await tx.issue.update({
            where: { id: issueId },
            data: { status: toStatus, position: positionBetween(beforePosition, afterPosition) },
          });
        }
      }
    });

    revalidateProject();
  });
}

export async function deleteIssue(input: DeleteIssueInput): Promise<ActionResult> {
  return runAction(async () => {
    const { id } = deleteIssueSchema.parse(input);
    const issue = await db.issue.findUnique({ where: { id }, select: { id: true } });
    if (!issue) throw new DomainError("Issue not found");

    // Comments cascade; children are orphaned (onDelete: SetNull) rather than deleted.
    await db.issue.delete({ where: { id } });
    revalidateProject();
  });
}
