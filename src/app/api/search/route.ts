import type { NextRequest } from "next/server";
import { QUICK_SEARCH_LIMIT, searchIssues } from "@/lib/queries/search";

// Backs the navbar's as-you-type results; the full list lives on /search.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchIssues(query, QUICK_SEARCH_LIMIT);
  return Response.json(results);
}
