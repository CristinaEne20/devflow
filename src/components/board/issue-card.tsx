"use client";

import { Draggable } from "@hello-pangea/dnd";
import Link from "next/link";
import { IssueTypeIcon } from "@/components/shared/issue-type-icon";
import { ParentLabel } from "@/components/shared/parent-label";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { StoryPointsBadge } from "@/components/shared/story-points-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useIssueHref } from "@/hooks/use-issue-href";
import type { BoardIssue } from "@/lib/queries/issues";
import { cn } from "@/lib/utils";

export function IssueCard({ issue, index }: { issue: BoardIssue; index: number }) {
  const issueHref = useIssueHref();

  return (
    <Draggable draggableId={issue.id} index={index}>
      {(provided, snapshot) => (
        <Link
          href={issueHref(issue.key)}
          scroll={false}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          // Margin (not flex gap) so the library can measure spacing during drags.
          className={cn(
            "group mb-2 block rounded-lg border bg-card p-3 text-card-foreground shadow-xs",
            "transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-sm",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            snapshot.isDragging && "rotate-[1.5deg] border-primary/50 shadow-lg",
          )}
        >
          <p className="line-clamp-2 text-sm leading-snug font-medium">{issue.title}</p>
          {issue.parent && <ParentLabel parent={issue.parent} className="mt-2" />}
          <div className="mt-3 flex items-center gap-2">
            <IssueTypeIcon type={issue.type} />
            <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
            <div className="ml-auto flex items-center gap-1.5">
              <PriorityIcon priority={issue.priority} />
              <StoryPointsBadge points={issue.storyPoints} />
              <UserAvatar user={issue.assignee} size="sm" />
            </div>
          </div>
        </Link>
      )}
    </Draggable>
  );
}
