import type { IssueStatus } from "@/lib/domain";
import { ISSUE_STATUS_META } from "@/lib/issue-meta";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  const meta = ISSUE_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium",
        meta.badgeClassName,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", meta.dotClassName)} />
      {meta.label}
    </span>
  );
}
