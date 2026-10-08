import { describe, expect, it } from "vitest";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES } from "@/lib/domain";
import { ISSUE_PRIORITY_META, ISSUE_STATUS_META, ISSUE_TYPE_META } from "@/lib/issue-meta";

describe("issue meta", () => {
  it("labels every enum value uniquely", () => {
    const labels = (values: readonly string[], meta: Record<string, { label: string }>) =>
      new Set(values.map((value) => meta[value]?.label)).size;

    expect(labels(ISSUE_TYPES, ISSUE_TYPE_META)).toBe(ISSUE_TYPES.length);
    expect(labels(ISSUE_PRIORITIES, ISSUE_PRIORITY_META)).toBe(ISSUE_PRIORITIES.length);
    expect(labels(ISSUE_STATUSES, ISSUE_STATUS_META)).toBe(ISSUE_STATUSES.length);
  });

  it("uses human-friendly status labels", () => {
    expect(ISSUE_STATUSES.map((status) => ISSUE_STATUS_META[status].label)).toEqual([
      "Backlog",
      "To Do",
      "In Progress",
      "In Review",
      "Done",
    ]);
  });
});
