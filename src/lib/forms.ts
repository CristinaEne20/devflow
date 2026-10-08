// Converts FormData from progressively-enhanced forms into typed action inputs.
// Values are passed through as-is; the action's zod schema is the validator.
import type { CreateIssueInput, UpdateProjectInput } from "@/lib/validation";

/** Select value meaning "no selection" (Radix Select items cannot use ""). */
export const NONE = "none";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function optionalId(value: string): string | null {
  return value === "" || value === NONE ? null : value;
}

export function parseStoryPoints(raw: string): number | null {
  const trimmed = raw.trim();
  return trimmed === "" ? null : Number(trimmed);
}

export function createIssueInputFromForm(formData: FormData, projectId: string): CreateIssueInput {
  return {
    projectId,
    title: field(formData, "title"),
    description: field(formData, "description"),
    type: field(formData, "type") as CreateIssueInput["type"],
    status: field(formData, "status") as CreateIssueInput["status"],
    priority: field(formData, "priority") as CreateIssueInput["priority"],
    assigneeId: optionalId(field(formData, "assigneeId")),
    storyPoints: parseStoryPoints(field(formData, "storyPoints")),
    parentId: optionalId(field(formData, "parentId")),
  };
}

export function projectSettingsInputFromForm(formData: FormData, projectId: string): UpdateProjectInput {
  return {
    projectId,
    name: field(formData, "name"),
    description: field(formData, "description"),
  };
}
