import { Search, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { IssueTypeIcon } from "@/components/shared/issue-type-icon";
import { PageHeader } from "@/components/shared/page-header";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { SearchParamsRecord } from "@/lib/filters";
import { SEARCH_LIMIT, searchIssues, type SearchResult } from "@/lib/queries/search";
import { boardIssueUrl } from "@/lib/urls";

export const metadata: Metadata = { title: "Search" };

type SearchPageProps = { searchParams: Promise<SearchParamsRecord> };

function groupByProject(results: SearchResult[]) {
  const groups = new Map<string, { name: string; key: string; results: SearchResult[] }>();
  for (const result of results) {
    const group = groups.get(result.project.key) ?? { ...result.project, results: [] };
    group.results.push(result);
    groups.set(result.project.key, group);
  }
  return [...groups.values()];
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const results = query ? await searchIssues(query) : [];

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        title="Search"
        description={
          query
            ? `${results.length}${results.length === SEARCH_LIMIT ? "+" : ""} result${results.length === 1 ? "" : "s"} for “${query}”`
            : "Find issues by title or key across all projects."
        }
      />

      <div className="mx-auto max-w-4xl space-y-6 px-6 pb-10">
        {!query && (
          <EmptyState
            icon={Search}
            title="Search for issues"
            description="Type in the search box above (⌘K) — try “login” or “DEV-10”."
          />
        )}

        {query && results.length === 0 && (
          <EmptyState icon={SearchX} title="No matching issues" description="Try a different word or an issue key." />
        )}

        {groupByProject(results).map((group) => (
          <section key={group.key} aria-labelledby={`search-${group.key}`} className="space-y-2">
            <h2 id={`search-${group.key}`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.name}
            </h2>
            <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-xs">
              {group.results.map((issue) => (
                <li key={issue.id}>
                  <Link
                    href={boardIssueUrl(group.key, issue.key)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                  >
                    <IssueTypeIcon type={issue.type} />
                    <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{issue.key}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{issue.title}</span>
                    <StatusBadge status={issue.status} className="hidden sm:inline-flex" />
                    <PriorityIcon priority={issue.priority} />
                    <UserAvatar user={issue.assignee} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
