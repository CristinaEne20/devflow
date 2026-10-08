import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { EMPTY_FILTERS } from "@/lib/filters";
import { getIssueDetail, listBoardIssues, listParentCandidates } from "@/lib/queries/issues";
import { getProjectByKey } from "@/lib/queries/projects";
import { searchIssues } from "@/lib/queries/search";
import { makeIssue, makeProject, makeUser, resetDb } from "./helpers";

beforeEach(resetDb);

async function populated() {
  const alice = await makeUser("Alice");
  const project = await makeProject("TST");
  const epic = await makeIssue(project, alice.id, { type: "EPIC", title: "Login revamp", position: 3 });
  const bug = await makeIssue(project, alice.id, {
    type: "BUG",
    title: "Crash on save",
    assigneeId: alice.id,
    parentId: epic.id,
    position: 1,
  });
  const subtask = await makeIssue(project, alice.id, { type: "SUBTASK", title: "Write test", position: 2 });
  return { alice, project, epic, bug, subtask };
}

describe("listBoardIssues", () => {
  it("returns project issues ordered by position with assignee and parent", async () => {
    const { project, alice } = await populated();
    const issues = await listBoardIssues(project.id, EMPTY_FILTERS);
    expect(issues.map((i) => i.key)).toEqual(["TST-2", "TST-3", "TST-1"]);
    expect(issues[0]).toMatchObject({
      assignee: { id: alice.id, name: "Alice" },
      parent: { key: "TST-1", type: "EPIC" },
    });
  });

  it("applies assignee, unassigned, type and text filters", async () => {
    const { project, alice } = await populated();
    const keys = async (filters: Partial<typeof EMPTY_FILTERS>) =>
      (await listBoardIssues(project.id, { ...EMPTY_FILTERS, ...filters })).map((i) => i.key);

    expect(await keys({ assigneeIds: [alice.id] })).toEqual(["TST-2"]);
    expect(await keys({ includeUnassigned: true })).toEqual(["TST-3", "TST-1"]);
    expect(await keys({ types: ["EPIC", "SUBTASK"] })).toEqual(["TST-3", "TST-1"]);
    expect(await keys({ q: "CRASH" })).toEqual(["TST-2"]);
    expect(await keys({ q: "tst-3" })).toEqual(["TST-3"]);
  });
});

describe("getIssueDetail", () => {
  it("resolves keys case-insensitively and includes relations", async () => {
    const { project, alice, epic } = await populated();
    await db.comment.create({ data: { issueId: epic.id, authorId: alice.id, content: "First!" } });

    const detail = await getIssueDetail(project.id, " tst-1 ");
    expect(detail).toMatchObject({
      key: "TST-1",
      reporter: { name: "Alice" },
      children: [{ key: "TST-2" }],
      comments: [{ content: "First!", author: { name: "Alice" } }],
    });
  });

  it("returns null for unknown keys or keys from another project", async () => {
    const { project } = await populated();
    const other = await makeProject("OTH");
    expect(await getIssueDetail(project.id, "TST-99")).toBeNull();
    expect(await getIssueDetail(other.id, "TST-1")).toBeNull();
  });
});

describe("listParentCandidates", () => {
  it("excludes subtasks", async () => {
    const { project } = await populated();
    expect((await listParentCandidates(project.id)).map((i) => i.key)).toEqual(["TST-1", "TST-2"]);
  });
});

describe("getProjectByKey", () => {
  it("is case-insensitive", async () => {
    await makeProject("DEV");
    await expect(getProjectByKey("dev")).resolves.toMatchObject({ key: "DEV" });
    await expect(getProjectByKey("nope")).resolves.toBeNull();
  });
});

describe("searchIssues", () => {
  it("matches titles and key prefixes across projects", async () => {
    await populated();
    const results = await searchIssues("login");
    expect(results.map((r) => r.key)).toEqual(["TST-1"]);
    expect(results[0]?.project).toEqual({ key: "TST", name: "TST project" });
    expect((await searchIssues("tst-2")).map((r) => r.key)).toEqual(["TST-2"]);
  });

  it("returns nothing for a blank query", async () => {
    await populated();
    expect(await searchIssues("   ")).toEqual([]);
  });
});

describe("control characters in user-supplied text", () => {
  it("never reach Postgres (which rejects NUL bytes)", async () => {
    const { project } = await populated();
    await expect(getIssueDetail(project.id, "TST-1\u0000")).resolves.toMatchObject({ key: "TST-1" });
    await expect(getIssueDetail(project.id, "\u0000")).resolves.toBeNull();
    await expect(getProjectByKey("\u0000")).resolves.toBeNull();
    await expect(searchIssues("log\u0000in")).resolves.toHaveLength(1);
  });
});
