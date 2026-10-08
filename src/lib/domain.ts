// Client-safe enum values. Types come from the generated Prisma client via
// `import type`, so nothing server-side is bundled into client components.
import type { IssuePriority, IssueStatus, IssueType } from "@/generated/prisma/enums";

export type { IssuePriority, IssueStatus, IssueType };

/** Board column order. */
export const ISSUE_STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const satisfies readonly IssueStatus[];

export const ISSUE_TYPES = [
  "EPIC",
  "STORY",
  "BUG",
  "TASK",
  "SUBTASK",
] as const satisfies readonly IssueType[];

export const ISSUE_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const satisfies readonly IssuePriority[];

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

export function isIssueStatus(value: unknown): value is IssueStatus {
  return includes(ISSUE_STATUSES, value);
}

export function isIssueType(value: unknown): value is IssueType {
  return includes(ISSUE_TYPES, value);
}

export function isIssuePriority(value: unknown): value is IssuePriority {
  return includes(ISSUE_PRIORITIES, value);
}
