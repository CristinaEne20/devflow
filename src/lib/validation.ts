import { z } from "zod";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES, type IssueType } from "@/lib/domain";

export const TITLE_MAX = 255;
export const DESCRIPTION_MAX = 20_000;
export const COMMENT_MAX = 5_000;
export const PROJECT_NAME_MAX = 80;
export const PROJECT_DESCRIPTION_MAX = 2_000;
export const STORY_POINTS_MAX = 100;

const id = z.string().min(1, "Missing id");
const optionalId = z.string().min(1).nullable();

const title = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`);

/** Markdown text where blank means "no value". */
const optionalMarkdown = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} must be at most ${max.toLocaleString("en")} characters`)
    .nullable()
    .transform((value) => (value === null || value.trim() === "" ? null : value));

const storyPoints = z
  .number({ error: "Story points must be a number" })
  .int("Story points must be a whole number")
  .min(0, "Story points cannot be negative")
  .max(STORY_POINTS_MAX, `Story points must be at most ${STORY_POINTS_MAX}`)
  .nullable();

const issueType = z.enum(ISSUE_TYPES);
const issueStatus = z.enum(ISSUE_STATUSES);
const issuePriority = z.enum(ISSUE_PRIORITIES);

export const createIssueSchema = z.object({
  projectId: id,
  title,
  description: optionalMarkdown(DESCRIPTION_MAX, "Description").optional(),
  type: issueType,
  status: issueStatus,
  priority: issuePriority,
  assigneeId: optionalId,
  storyPoints,
  parentId: optionalId,
});

export const issuePatchSchema = z
  .object({
    title,
    description: optionalMarkdown(DESCRIPTION_MAX, "Description"),
    type: issueType,
    status: issueStatus,
    priority: issuePriority,
    assigneeId: optionalId,
    storyPoints,
    parentId: optionalId,
  })
  .partial()
  .refine((patch) => Object.values(patch).some((value) => value !== undefined), "Nothing to update");

export const updateIssueSchema = z.object({ id, patch: issuePatchSchema });

export const moveIssueSchema = z.object({
  issueId: id,
  toStatus: issueStatus,
  beforeId: optionalId,
  afterId: optionalId,
});

export const deleteIssueSchema = z.object({ id });

export const addCommentSchema = z.object({
  issueId: id,
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(COMMENT_MAX, `Comment must be at most ${COMMENT_MAX.toLocaleString("en")} characters`),
});

export const deleteCommentSchema = z.object({ commentId: id });

export const updateProjectSchema = z.object({
  projectId: id,
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(PROJECT_NAME_MAX, `Project name must be at most ${PROJECT_NAME_MAX} characters`),
  description: optionalMarkdown(PROJECT_DESCRIPTION_MAX, "Description"),
});

export const switchUserSchema = z.object({ userId: id });

export type CreateIssueInput = z.input<typeof createIssueSchema>;
export type IssuePatch = z.input<typeof issuePatchSchema>;
export type UpdateIssueInput = z.input<typeof updateIssueSchema>;
export type MoveIssueInput = z.input<typeof moveIssueSchema>;
export type DeleteIssueInput = z.input<typeof deleteIssueSchema>;
export type AddCommentInput = z.input<typeof addCommentSchema>;
export type DeleteCommentInput = z.input<typeof deleteCommentSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;
export type SwitchUserInput = z.input<typeof switchUserSchema>;

// ---------------------------------------------------------------------------
// Issue hierarchy: EPIC ← STORY/TASK/BUG ← SUBTASK. Epics have no parent, so
// cycles are impossible as long as these rules hold.

export type ParentInfo = { type: IssueType; projectId: string };

const SUBTASK_PARENT_TYPES: readonly IssueType[] = ["STORY", "TASK", "BUG"];

/** Returns an error message, or null when `type` may sit under `parent`. */
export function validateHierarchy(type: IssueType, parent: ParentInfo | null, projectId: string): string | null {
  if (parent && parent.projectId !== projectId) return "Parent issue must belong to the same project";

  switch (type) {
    case "EPIC":
      return parent ? "Epics cannot have a parent" : null;
    case "SUBTASK":
      if (!parent) return "A subtask must have a parent issue";
      return SUBTASK_PARENT_TYPES.includes(parent.type) ? null : "A subtask's parent must be a story, task, or bug";
    default:
      return parent && parent.type !== "EPIC" ? "Only epics can be the parent of a story, task, or bug" : null;
  }
}

export function canBeParentOf(parentType: IssueType, childType: IssueType): boolean {
  return validateHierarchy(childType, { type: parentType, projectId: "" }, "") === null;
}
