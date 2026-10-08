import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { stripControlChars, toIssueWhere, type BoardFilters } from "@/lib/filters";
import { userSummarySelect } from "@/lib/queries/users";

const issueParentSelect = { id: true, key: true, title: true, type: true } satisfies Prisma.IssueSelect;

export type IssueParent = Prisma.IssueGetPayload<{ select: typeof issueParentSelect }>;
export type ParentCandidate = IssueParent;

const boardIssueSelect = {
  id: true,
  key: true,
  title: true,
  type: true,
  status: true,
  priority: true,
  storyPoints: true,
  position: true,
  assignee: { select: userSummarySelect },
  parent: { select: issueParentSelect },
} satisfies Prisma.IssueSelect;

export type BoardIssue = Prisma.IssueGetPayload<{ select: typeof boardIssueSelect }>;

const issueDetailSelect = {
  id: true,
  key: true,
  title: true,
  description: true,
  type: true,
  status: true,
  priority: true,
  storyPoints: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  reporter: { select: userSummarySelect },
  assignee: { select: userSummarySelect },
  parent: { select: issueParentSelect },
  children: {
    select: { id: true, key: true, title: true, type: true, status: true },
    orderBy: { number: "asc" },
  },
  comments: {
    select: { id: true, content: true, createdAt: true, author: { select: userSummarySelect } },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.IssueSelect;

export type IssueDetail = Prisma.IssueGetPayload<{ select: typeof issueDetailSelect }>;
export type ChildIssue = IssueDetail["children"][number];
export type CommentView = IssueDetail["comments"][number];

export async function listBoardIssues(projectId: string, filters: BoardFilters): Promise<BoardIssue[]> {
  return db.issue.findMany({
    where: toIssueWhere(projectId, filters),
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: boardIssueSelect,
  });
}

/** Looks up an issue by key within a project; keys from the URL are normalized. */
export async function getIssueDetail(projectId: string, issueKey: string): Promise<IssueDetail | null> {
  return db.issue.findFirst({
    where: { projectId, key: stripControlChars(issueKey).trim().toUpperCase() },
    select: issueDetailSelect,
  });
}

/** Issues that can parent something (every type except subtasks). */
export async function listParentCandidates(projectId: string): Promise<ParentCandidate[]> {
  return db.issue.findMany({
    where: { projectId, type: { not: "SUBTASK" } },
    orderBy: { number: "asc" },
    select: issueParentSelect,
  });
}
