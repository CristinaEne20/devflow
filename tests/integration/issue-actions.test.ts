import { beforeEach, describe, expect, it } from "vitest";
import { createIssue, deleteIssue, moveIssue, updateIssue } from "@/actions/issue-actions";
import { db } from "@/lib/db";
import { actAs, columnKeys, makeIssue, makeProject, makeUser, resetDb } from "./helpers";

beforeEach(resetDb);

async function setup() {
  const user = await makeUser("Reporter");
  const project = await makeProject("TST");
  actAs(user.id);
  return { user, project };
}

const newIssue = (projectId: string, overrides: Record<string, unknown> = {}) => ({
  projectId,
  title: "Write docs",
  type: "TASK" as const,
  status: "TODO" as const,
  priority: "MEDIUM" as const,
  assigneeId: null,
  storyPoints: null,
  parentId: null,
  ...overrides,
});

describe("createIssue", () => {
  it("assigns sequential keys and the current user as reporter", async () => {
    const { user, project } = await setup();
    await expect(createIssue(newIssue(project.id))).resolves.toEqual({ ok: true, data: { key: "TST-1" } });
    await expect(createIssue(newIssue(project.id))).resolves.toEqual({ ok: true, data: { key: "TST-2" } });

    const issue = await db.issue.findUniqueOrThrow({ where: { key: "TST-2" } });
    expect(issue.reporterId).toBe(user.id);
    expect(issue.number).toBe(2);
  });

  it("appends new issues to the bottom of their column", async () => {
    const { user, project } = await setup();
    await makeIssue(project, user.id, { status: "TODO", position: 5000 });
    await createIssue(newIssue(project.id));
    expect(await columnKeys(project.id, "TODO")).toEqual(["TST-1", "TST-2"]);
  });

  it("hands out unique numbers under concurrency", async () => {
    const { project } = await setup();
    const results = await Promise.all(Array.from({ length: 5 }, () => createIssue(newIssue(project.id))));
    const keys = results.map((result) => (result.ok ? result.data.key : result.error)).sort();
    expect(keys).toEqual(["TST-1", "TST-2", "TST-3", "TST-4", "TST-5"]);
  });

  it("enforces the issue hierarchy", async () => {
    const { project } = await setup();
    const result = await createIssue(newIssue(project.id, { type: "SUBTASK" }));
    expect(result).toEqual({ ok: false, error: "A subtask must have a parent issue" });
    expect(await db.issue.count()).toBe(0);
  });

  it("returns field errors for invalid input", async () => {
    const { project } = await setup();
    const result = await createIssue(newIssue(project.id, { title: "" }));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.fieldErrors?.title).toEqual(["Title is required"]);
  });

  it("rejects unknown assignees", async () => {
    const { project } = await setup();
    await expect(createIssue(newIssue(project.id, { assigneeId: "nobody" }))).resolves.toEqual({
      ok: false,
      error: "Assignee not found",
    });
  });
});

describe("updateIssue", () => {
  it("updates simple fields", async () => {
    const { user, project } = await setup();
    const issue = await makeIssue(project, user.id);
    const result = await updateIssue({ id: issue.id, patch: { title: "Renamed", priority: "CRITICAL" } });
    expect(result).toEqual({ ok: true, data: { key: issue.key } });
    await expect(db.issue.findUniqueOrThrow({ where: { id: issue.id } })).resolves.toMatchObject({
      title: "Renamed",
      priority: "CRITICAL",
    });
  });

  it("moves an issue to the bottom of the new column when its status changes", async () => {
    const { user, project } = await setup();
    await makeIssue(project, user.id, { status: "DONE", position: 100 });
    await makeIssue(project, user.id, { status: "DONE", position: 200 });
    const moving = await makeIssue(project, user.id, { status: "TODO", position: 1 });

    await updateIssue({ id: moving.id, patch: { status: "DONE" } });
    expect(await columnKeys(project.id, "DONE")).toEqual(["TST-1", "TST-2", "TST-3"]);
  });

  it("rejects a type change that would invalidate existing children", async () => {
    const { user, project } = await setup();
    const epic = await makeIssue(project, user.id, { type: "EPIC" });
    await makeIssue(project, user.id, { type: "STORY", parentId: epic.id });

    const result = await updateIssue({ id: epic.id, patch: { type: "TASK" } });
    expect(result).toEqual({
      ok: false,
      error: "Can't change type: existing child issues wouldn't be valid under the new type",
    });
    await expect(db.issue.findUniqueOrThrow({ where: { id: epic.id } })).resolves.toMatchObject({ type: "EPIC" });
  });

  it("validates a new parent", async () => {
    const { user, project } = await setup();
    const story = await makeIssue(project, user.id, { type: "STORY" });
    const task = await makeIssue(project, user.id, { type: "TASK" });
    await expect(updateIssue({ id: task.id, patch: { parentId: story.id } })).resolves.toEqual({
      ok: false,
      error: "Only epics can be the parent of a story, task, or bug",
    });
    await expect(updateIssue({ id: task.id, patch: { parentId: task.id } })).resolves.toEqual({
      ok: false,
      error: "An issue cannot be its own parent",
    });
  });

  it("converts a task into a subtask when type and parent change together", async () => {
    const { user, project } = await setup();
    const story = await makeIssue(project, user.id, { type: "STORY" });
    const task = await makeIssue(project, user.id, { type: "TASK" });
    const result = await updateIssue({ id: task.id, patch: { type: "SUBTASK", parentId: story.id } });
    expect(result.ok).toBe(true);
    await expect(db.issue.findUniqueOrThrow({ where: { id: task.id } })).resolves.toMatchObject({
      type: "SUBTASK",
      parentId: story.id,
    });
  });

  it("drops a parent the new type can't have when only the type changes", async () => {
    const { user, project } = await setup();
    const epic = await makeIssue(project, user.id, { type: "EPIC" });
    const story = await makeIssue(project, user.id, { type: "STORY", parentId: epic.id });
    const subtask = await makeIssue(project, user.id, { type: "SUBTASK", parentId: story.id });

    await expect(updateIssue({ id: subtask.id, patch: { type: "TASK" } })).resolves.toMatchObject({ ok: true });
    await expect(db.issue.findUniqueOrThrow({ where: { id: subtask.id } })).resolves.toMatchObject({
      type: "TASK",
      parentId: null,
    });

    await expect(updateIssue({ id: story.id, patch: { type: "BUG" } })).resolves.toMatchObject({ ok: true });
    await expect(db.issue.findUniqueOrThrow({ where: { id: story.id } })).resolves.toMatchObject({
      type: "BUG",
      parentId: epic.id,
    });
  });

  it("still requires a parent when converting to a subtask", async () => {
    const { user, project } = await setup();
    const epic = await makeIssue(project, user.id, { type: "EPIC" });
    const task = await makeIssue(project, user.id, { type: "TASK", parentId: epic.id });
    await expect(updateIssue({ id: task.id, patch: { type: "SUBTASK" } })).resolves.toEqual({
      ok: false,
      error: "A subtask must have a parent issue",
    });
  });

  it("returns not found for unknown issues and rejects empty patches", async () => {
    await setup();
    await expect(updateIssue({ id: "missing", patch: { title: "x" } })).resolves.toEqual({
      ok: false,
      error: "Issue not found",
    });
    const empty = await updateIssue({ id: "missing", patch: {} });
    expect(empty.ok).toBe(false);
  });
});

describe("moveIssue", () => {
  it("places an issue between its new neighbors and updates status", async () => {
    const { user, project } = await setup();
    const a = await makeIssue(project, user.id, { status: "IN_PROGRESS", position: 1024 });
    const b = await makeIssue(project, user.id, { status: "IN_PROGRESS", position: 2048 });
    const moving = await makeIssue(project, user.id, { status: "TODO", position: 1024 });

    await expect(
      moveIssue({ issueId: moving.id, toStatus: "IN_PROGRESS", beforeId: a.id, afterId: b.id }),
    ).resolves.toEqual({ ok: true, data: undefined });
    expect(await columnKeys(project.id, "IN_PROGRESS")).toEqual(["TST-1", "TST-3", "TST-2"]);
    expect(await columnKeys(project.id, "TODO")).toEqual([]);
  });

  it("moves to the top of a column", async () => {
    const { user, project } = await setup();
    const a = await makeIssue(project, user.id, { status: "TODO", position: 1024 });
    const moving = await makeIssue(project, user.id, { status: "TODO", position: 2048 });
    await moveIssue({ issueId: moving.id, toStatus: "TODO", beforeId: null, afterId: a.id });
    expect(await columnKeys(project.id, "TODO")).toEqual(["TST-2", "TST-1"]);
  });

  it("appends to the bottom when a neighbor is stale (moved or deleted elsewhere)", async () => {
    const { user, project } = await setup();
    await makeIssue(project, user.id, { status: "DONE", position: 1024 });
    const elsewhere = await makeIssue(project, user.id, { status: "TODO", position: 1024 });
    const moving = await makeIssue(project, user.id, { status: "BACKLOG", position: 1024 });

    const result = await moveIssue({ issueId: moving.id, toStatus: "DONE", beforeId: null, afterId: elsewhere.id });
    expect(result.ok).toBe(true);
    expect(await columnKeys(project.id, "DONE")).toEqual(["TST-1", "TST-3"]);
  });

  it("renumbers the column when neighbors are too close to split", async () => {
    const { user, project } = await setup();
    const a = await makeIssue(project, user.id, { status: "TODO", position: 1 });
    const b = await makeIssue(project, user.id, { status: "TODO", position: 1 + 1e-9 });
    const moving = await makeIssue(project, user.id, { status: "BACKLOG", position: 1 });

    await moveIssue({ issueId: moving.id, toStatus: "TODO", beforeId: a.id, afterId: b.id });
    expect(await columnKeys(project.id, "TODO")).toEqual(["TST-1", "TST-3", "TST-2"]);
    const positions = await db.issue.findMany({
      where: { projectId: project.id, status: "TODO" },
      orderBy: { position: "asc" },
      select: { position: true },
    });
    expect(positions.map((p) => p.position)).toEqual([1024, 2048, 3072]);
  });

  it("returns not found for unknown issues", async () => {
    await setup();
    await expect(moveIssue({ issueId: "missing", toStatus: "DONE", beforeId: null, afterId: null })).resolves.toEqual(
      { ok: false, error: "Issue not found" },
    );
  });
});

describe("deleteIssue", () => {
  it("deletes comments with the issue and orphans its children", async () => {
    const { user, project } = await setup();
    const epic = await makeIssue(project, user.id, { type: "EPIC" });
    const story = await makeIssue(project, user.id, { type: "STORY", parentId: epic.id });
    await db.comment.create({ data: { issueId: epic.id, authorId: user.id, content: "Hi" } });

    await expect(deleteIssue({ id: epic.id })).resolves.toEqual({ ok: true, data: undefined });
    expect(await db.comment.count()).toBe(0);
    await expect(db.issue.findUniqueOrThrow({ where: { id: story.id } })).resolves.toMatchObject({ parentId: null });
  });
});
