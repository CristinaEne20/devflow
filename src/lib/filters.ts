// Board/backlog filters live in the URL so filtered views are shareable and
// server-rendered. This module is the only place that knows the param format:
//   ?assignee=<userId>,<userId>,unassigned&type=BUG,STORY&q=text
import type { Prisma } from "@/generated/prisma/client";
import { isIssueType, type IssueType } from "@/lib/domain";

export const UNASSIGNED = "unassigned";
export const MAX_QUERY_LENGTH = 100;

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

export type BoardFilters = {
  assigneeIds: string[];
  includeUnassigned: boolean;
  types: IssueType[];
  q: string;
};

export const EMPTY_FILTERS: BoardFilters = {
  assigneeIds: [],
  includeUnassigned: false,
  types: [],
  q: "",
};

/** Removes NUL and other control characters (Postgres rejects NUL bytes in text parameters). */
export function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, "");
}

function readParam(source: SearchParamsRecord | URLSearchParams, key: string): string {
  const raw = source instanceof URLSearchParams ? source.get(key) : source[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return stripControlChars(value ?? "");
}

function splitList(value: string): string[] {
  return [...new Set(value.split(",").map((part) => part.trim()).filter(Boolean))];
}

export function parseFilters(source: SearchParamsRecord | URLSearchParams): BoardFilters {
  const assigneeTokens = splitList(readParam(source, "assignee"));
  return {
    assigneeIds: assigneeTokens.filter((token) => token !== UNASSIGNED),
    includeUnassigned: assigneeTokens.includes(UNASSIGNED),
    types: splitList(readParam(source, "type")).filter(isIssueType),
    q: readParam(source, "q").trim().slice(0, MAX_QUERY_LENGTH),
  };
}

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

/** Returns a copy of `base` with the filter params replaced; other params are kept. */
export function writeFilters(base: string | URLSearchParams, filters: BoardFilters): URLSearchParams {
  const params = new URLSearchParams(base);
  const assignees = [...filters.assigneeIds, ...(filters.includeUnassigned ? [UNASSIGNED] : [])];
  setOrDelete(params, "assignee", assignees.join(","));
  setOrDelete(params, "type", filters.types.join(","));
  setOrDelete(params, "q", filters.q.trim());
  return params;
}

export function hasActiveFilters(filters: BoardFilters): boolean {
  return (
    filters.assigneeIds.length > 0 || filters.includeUnassigned || filters.types.length > 0 || filters.q !== ""
  );
}

export function toIssueWhere(projectId: string, filters: BoardFilters): Prisma.IssueWhereInput {
  const conditions: Prisma.IssueWhereInput[] = [];

  if (filters.assigneeIds.length > 0 || filters.includeUnassigned) {
    conditions.push({
      OR: [
        ...(filters.assigneeIds.length > 0 ? [{ assigneeId: { in: filters.assigneeIds } }] : []),
        ...(filters.includeUnassigned ? [{ assigneeId: null }] : []),
      ],
    });
  }

  if (filters.types.length > 0) {
    conditions.push({ type: { in: filters.types } });
  }

  if (filters.q) {
    conditions.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { key: { startsWith: filters.q, mode: "insensitive" } },
      ],
    });
  }

  return conditions.length > 0 ? { projectId, AND: conditions } : { projectId };
}
