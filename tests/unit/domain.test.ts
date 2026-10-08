import { describe, expect, it } from "vitest";
import { IssuePriority, IssueStatus, IssueType } from "@/generated/prisma/enums";
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  ISSUE_TYPES,
  isIssuePriority,
  isIssueStatus,
  isIssueType,
} from "@/lib/domain";

describe("domain constants", () => {
  it("lists statuses in schema (board column) order", () => {
    expect(ISSUE_STATUSES).toEqual(Object.values(IssueStatus));
  });

  it("lists every issue type and priority from the schema", () => {
    expect(ISSUE_TYPES).toEqual(Object.values(IssueType));
    expect(ISSUE_PRIORITIES).toEqual(Object.values(IssuePriority));
  });
});

describe("type guards", () => {
  it("accept enum values and reject anything else", () => {
    expect(isIssueStatus("IN_REVIEW")).toBe(true);
    expect(isIssueStatus("in_review")).toBe(false);
    expect(isIssueType("EPIC")).toBe(true);
    expect(isIssueType(42)).toBe(false);
    expect(isIssuePriority("CRITICAL")).toBe(true);
    expect(isIssuePriority(undefined)).toBe(false);
  });
});
