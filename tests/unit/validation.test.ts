import { describe, expect, it } from "vitest";
import type { IssueType } from "@/lib/domain";
import {
  addCommentSchema,
  canBeParentOf,
  createIssueSchema,
  issuePatchSchema,
  updateProjectSchema,
  validateHierarchy,
} from "@/lib/validation";

const baseIssue = {
  projectId: "p1",
  title: "Fix login",
  type: "TASK",
  status: "TODO",
  priority: "MEDIUM",
  assigneeId: null,
  storyPoints: null,
  parentId: null,
} as const;

describe("createIssueSchema", () => {
  it("trims the title and turns a blank description into null", () => {
    const parsed = createIssueSchema.parse({ ...baseIssue, title: "  Fix login  ", description: "   " });
    expect(parsed.title).toBe("Fix login");
    expect(parsed.description).toBeNull();
  });

  it("requires a title", () => {
    const result = createIssueSchema.safeParse({ ...baseIssue, title: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Title is required");
  });

  it.each([101, -1, 2.5, Number.NaN])("rejects story points %s", (storyPoints) => {
    expect(createIssueSchema.safeParse({ ...baseIssue, storyPoints }).success).toBe(false);
  });

  it("rejects unknown enum values", () => {
    expect(createIssueSchema.safeParse({ ...baseIssue, status: "ARCHIVED" }).success).toBe(false);
  });
});

describe("issuePatchSchema", () => {
  it("rejects an empty patch", () => {
    expect(issuePatchSchema.safeParse({}).success).toBe(false);
    expect(issuePatchSchema.safeParse({ title: undefined }).success).toBe(false);
  });

  it("accepts a single field", () => {
    expect(issuePatchSchema.parse({ status: "DONE" })).toEqual({ status: "DONE" });
  });

  it("allows clearing nullable fields", () => {
    expect(issuePatchSchema.parse({ assigneeId: null })).toEqual({ assigneeId: null });
  });
});

describe("addCommentSchema", () => {
  it("rejects whitespace-only comments", () => {
    expect(addCommentSchema.safeParse({ issueId: "i1", content: "  \n " }).success).toBe(false);
  });
});

describe("updateProjectSchema", () => {
  it("requires a name and normalizes an empty description", () => {
    expect(updateProjectSchema.safeParse({ projectId: "p1", name: "", description: null }).success).toBe(false);
    expect(updateProjectSchema.parse({ projectId: "p1", name: " DevFlow ", description: "" })).toEqual({
      projectId: "p1",
      name: "DevFlow",
      description: null,
    });
  });
});

describe("validateHierarchy", () => {
  const parent = (type: IssueType, projectId = "p1") => ({ type, projectId });

  it("forbids a parent on epics", () => {
    expect(validateHierarchy("EPIC", null, "p1")).toBeNull();
    expect(validateHierarchy("EPIC", parent("EPIC"), "p1")).toBe("Epics cannot have a parent");
  });

  it("requires subtasks to have a story, task or bug parent", () => {
    expect(validateHierarchy("SUBTASK", null, "p1")).toBe("A subtask must have a parent issue");
    expect(validateHierarchy("SUBTASK", parent("STORY"), "p1")).toBeNull();
    expect(validateHierarchy("SUBTASK", parent("BUG"), "p1")).toBeNull();
    expect(validateHierarchy("SUBTASK", parent("EPIC"), "p1")).toBe(
      "A subtask's parent must be a story, task, or bug",
    );
    expect(validateHierarchy("SUBTASK", parent("SUBTASK"), "p1")).toBe(
      "A subtask's parent must be a story, task, or bug",
    );
  });

  it("only lets stories, tasks and bugs sit under epics", () => {
    expect(validateHierarchy("STORY", null, "p1")).toBeNull();
    expect(validateHierarchy("TASK", parent("EPIC"), "p1")).toBeNull();
    expect(validateHierarchy("BUG", parent("STORY"), "p1")).toBe(
      "Only epics can be the parent of a story, task, or bug",
    );
  });

  it("rejects parents from another project", () => {
    expect(validateHierarchy("TASK", parent("EPIC", "p2"), "p1")).toBe(
      "Parent issue must belong to the same project",
    );
  });
});

describe("canBeParentOf", () => {
  it("mirrors validateHierarchy", () => {
    expect(canBeParentOf("EPIC", "STORY")).toBe(true);
    expect(canBeParentOf("STORY", "SUBTASK")).toBe(true);
    expect(canBeParentOf("EPIC", "SUBTASK")).toBe(false);
    expect(canBeParentOf("TASK", "EPIC")).toBe(false);
  });
});
