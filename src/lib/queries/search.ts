import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { MAX_QUERY_LENGTH, stripControlChars } from "@/lib/filters";
import { userSummarySelect } from "@/lib/queries/users";

export const SEARCH_LIMIT = 50;
/** Results shown in the navbar's as-you-type dropdown. */
export const QUICK_SEARCH_LIMIT = 8;

const searchResultSelect = {
  id: true,
  key: true,
  title: true,
  type: true,
  status: true,
  priority: true,
  project: { select: { key: true, name: true } },
  assignee: { select: userSummarySelect },
} satisfies Prisma.IssueSelect;

export type SearchResult = Prisma.IssueGetPayload<{ select: typeof searchResultSelect }>;

/** Global search: title contains the query (trigram-indexed) or key starts with it. */
export async function searchIssues(query: string, limit = SEARCH_LIMIT): Promise<SearchResult[]> {
  const q = stripControlChars(query).trim().slice(0, MAX_QUERY_LENGTH);
  if (!q) return [];
  return db.issue.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { key: { startsWith: q, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: searchResultSelect,
  });
}
