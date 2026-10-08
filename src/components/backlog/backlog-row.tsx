import Link from "next/link";
import { IssueTypeIcon } from "@/components/shared/issue-type-icon";
import { ParentLabel } from "@/components/shared/parent-label";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { StoryPointsBadge } from "@/components/shared/story-points-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { BoardIssue } from "@/lib/queries/issues";

export function BacklogRow({ issue, href }: { issue: BoardIssue; href: string }) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
      >
        <IssueTypeIcon type={issue.type} />
        <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{issue.key}</span>
        <span className="min-w-0 flex-1 truncate">{issue.title}</span>
        {issue.parent && <ParentLabel parent={issue.parent} className="hidden max-w-48 md:inline-flex" />}
        <PriorityIcon priority={issue.priority} />
        <span className="flex w-6 justify-center">
          <StoryPointsBadge points={issue.storyPoints} />
        </span>
        <UserAvatar user={issue.assignee} />
      </Link>
    </li>
  );
}
