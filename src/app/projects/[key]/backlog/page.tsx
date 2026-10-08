import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BacklogGroup } from "@/components/backlog/backlog-group";
import { BacklogRow } from "@/components/backlog/backlog-row";
import { FilterBar } from "@/components/board/filter-bar";
import { IssueDrawerSlot } from "@/components/issue/issue-drawer-slot";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { groupByStatus } from "@/lib/board";
import { ISSUE_STATUSES } from "@/lib/domain";
import { parseFilters, type SearchParamsRecord } from "@/lib/filters";
import { listBoardIssues } from "@/lib/queries/issues";
import { getProjectByKey } from "@/lib/queries/projects";
import { listUsers } from "@/lib/queries/users";
import { projectUrl, withIssueParam } from "@/lib/urls";

export const metadata: Metadata = { title: "Backlog" };

type BacklogPageProps = {
  params: Promise<{ key: string }>;
  searchParams: Promise<SearchParamsRecord>;
};

export default async function BacklogPage({ params, searchParams }: BacklogPageProps) {
  const [{ key }, query] = await Promise.all([params, searchParams]);
  const project = await getProjectByKey(key);
  if (!project) notFound();

  const filters = parseFilters(query);
  const issueKey = typeof query.issue === "string" ? query.issue : null;
  const [issues, users] = await Promise.all([listBoardIssues(project.id, filters), listUsers()]);
  const columns = groupByStatus(issues);
  const basePath = projectUrl(project.key, "backlog");
  const totalPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints ?? 0), 0);

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Backlog" description={`${issues.length} issues · ${totalPoints} story points`} />
      <FilterBar users={users} filters={filters} />
      <div className="space-y-6 px-6 pb-10">
        {filters.q && issues.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="No matching issues"
            description={`Nothing in the backlog matches “${filters.q}”. Try a different word or an issue key.`}
          />
        )}
        {ISSUE_STATUSES.map((status) => {
          const group = columns[status];
          // While searching, only the groups that contain matches are shown.
          if (filters.q && group.length === 0) return null;
          return (
            <BacklogGroup
              key={status}
              status={status}
              count={group.length}
              points={group.reduce((sum, issue) => sum + (issue.storyPoints ?? 0), 0)}
            >
              {group.map((issue) => (
                <BacklogRow key={issue.id} issue={issue} href={`${basePath}${withIssueParam(query, issue.key)}`} />
              ))}
            </BacklogGroup>
          );
        })}
      </div>
      {issueKey && <IssueDrawerSlot projectId={project.id} issueKey={issueKey} />}
    </div>
  );
}
