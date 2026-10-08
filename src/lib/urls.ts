import type { SearchParamsRecord } from "@/lib/filters";

export type ProjectSection = "board" | "backlog" | "settings";

export function toURLSearchParams(source: string | URLSearchParams | SearchParamsRecord): URLSearchParams {
  if (typeof source === "string" || source instanceof URLSearchParams) return new URLSearchParams(source);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(source)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) params.set(key, first);
  }
  return params;
}

/** Query string (with leading "?", or "") that opens `issueKey` in the drawer, or closes it when null. */
export function withIssueParam(
  source: string | URLSearchParams | SearchParamsRecord,
  issueKey: string | null,
): string {
  const params = toURLSearchParams(source);
  if (issueKey) params.set("issue", issueKey);
  else params.delete("issue");
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function projectUrl(projectKey: string, section: ProjectSection): string {
  return `/projects/${projectKey}/${section}`;
}

export function boardIssueUrl(projectKey: string, issueKey: string): string {
  return `${projectUrl(projectKey, "board")}${withIssueParam("", issueKey)}`;
}
