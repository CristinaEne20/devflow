import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Board } from "@/components/board/board";
import { FilterBar } from "@/components/board/filter-bar";
import { IssueDrawerSlot } from "@/components/issue/issue-drawer-slot";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { groupByStatus } from "@/lib/board";
import { parseFilters, type SearchParamsRecord } from "@/lib/filters";
import { listBoardIssues } from "@/lib/queries/issues";
import { getProjectByKey } from "@/lib/queries/projects";
import { listUsers } from "@/lib/queries/users";

export const metadata: Metadata = { title: "Board" };

type BoardPageProps = {
  params: Promise<{ key: string }>;
  searchParams: Promise<SearchParamsRecord>;
};

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const [{ key }, query] = await Promise.all([params, searchParams]);
  const project = await getProjectByKey(key);
  if (!project) notFound();

  const filters = parseFilters(query);
  const issueKey = typeof query.issue === "string" ? query.issue : null;
  const [issues, users] = await Promise.all([listBoardIssues(project.id, filters), listUsers()]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Board" description={`${project.name} · ${issues.length} issues`} />
      <FilterBar users={users} filters={filters} />
      {/* The only scroll container on the page (required by @hello-pangea/dnd). */}
      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        {filters.q && issues.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No matching issues"
            description={`Nothing on this board matches “${filters.q}”. Try a different word or an issue key.`}
          />
        ) : (
          <Board columns={groupByStatus(issues)} hideEmptyColumns={filters.q !== ""} />
        )}
      </div>
      {issueKey && <IssueDrawerSlot projectId={project.id} issueKey={issueKey} />}
    </div>
  );
}
