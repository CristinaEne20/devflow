"use client";

import { Droppable } from "@hello-pangea/dnd";
import { IssueCard } from "@/components/board/issue-card";
import type { IssueStatus } from "@/lib/domain";
import { ISSUE_STATUS_META } from "@/lib/issue-meta";
import type { BoardIssue } from "@/lib/queries/issues";
import { cn } from "@/lib/utils";

export function BoardColumn({ status, issues }: { status: IssueStatus; issues: BoardIssue[] }) {
  const meta = ISSUE_STATUS_META[status];
  const points = issues.reduce((sum, issue) => sum + (issue.storyPoints ?? 0), 0);

  return (
    <section aria-label={`${meta.label} column`} className="flex w-72 shrink-0 flex-col rounded-xl border bg-column">
      <header className="sticky top-0 z-10 flex items-center gap-2 rounded-t-xl bg-column px-3 py-2.5">
        <span aria-hidden className={cn("size-2 rounded-full", meta.dotClassName)} />
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{meta.label}</h2>
        <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">{issues.length}</span>
        {points > 0 && (
          <span className="ml-auto text-xs text-muted-foreground tabular-nums" title="Total story points">
            {points} pts
          </span>
        )}
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex min-h-32 flex-1 flex-col rounded-b-xl px-2 pt-0.5 pb-2 transition-colors",
              snapshot.isDraggingOver && "bg-primary/5",
            )}
          >
            {issues.map((issue, index) => (
              <IssueCard key={issue.id} issue={issue} index={index} />
            ))}
            {provided.placeholder}
            {issues.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-6 text-xs text-muted-foreground">
                Drop issues here
              </div>
            )}
          </div>
        )}
      </Droppable>
    </section>
  );
}
