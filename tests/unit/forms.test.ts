import { describe, expect, it } from "vitest";
import { NONE, createIssueInputFromForm, parseStoryPoints, projectSettingsInputFromForm } from "@/lib/forms";
import { createIssueSchema } from "@/lib/validation";

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

describe("parseStoryPoints", () => {
  it("treats blank as no estimate", () => {
    expect(parseStoryPoints("  ")).toBeNull();
  });

  it("parses numbers and leaves garbage for zod to reject", () => {
    expect(parseStoryPoints("5")).toBe(5);
    expect(parseStoryPoints("abc")).toBeNaN();
  });
});

describe("createIssueInputFromForm", () => {
  it("maps form fields to a valid create input", () => {
    const input = createIssueInputFromForm(
      formData({
        title: "New bug",
        description: "Steps",
        type: "BUG",
        status: "TODO",
        priority: "HIGH",
        assigneeId: NONE,
        storyPoints: "3",
        parentId: NONE,
      }),
      "p1",
    );
    expect(input).toEqual({
      projectId: "p1",
      title: "New bug",
      description: "Steps",
      type: "BUG",
      status: "TODO",
      priority: "HIGH",
      assigneeId: null,
      storyPoints: 3,
      parentId: null,
    });
    expect(createIssueSchema.safeParse(input).success).toBe(true);
  });

  it("keeps selected ids", () => {
    const input = createIssueInputFromForm(formData({ assigneeId: "u1", parentId: "i1" }), "p1");
    expect(input.assigneeId).toBe("u1");
    expect(input.parentId).toBe("i1");
  });
});

describe("projectSettingsInputFromForm", () => {
  it("maps name and description", () => {
    expect(projectSettingsInputFromForm(formData({ name: "DevFlow", description: "" }), "p1")).toEqual({
      projectId: "p1",
      name: "DevFlow",
      description: "",
    });
  });
});
