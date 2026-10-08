import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { IssuePriority } from "@/lib/domain";
import { ISSUE_PRIORITY_META } from "@/lib/issue-meta";
import { cn } from "@/lib/utils";

type PriorityIconProps = { priority: IssuePriority; showLabel?: boolean; className?: string };

export function PriorityIcon({ priority, showLabel = false, className }: PriorityIconProps) {
  const meta = ISSUE_PRIORITY_META[priority];
  const Icon = meta.icon;
  const icon = <Icon aria-hidden className={cn("size-4 shrink-0", meta.className, className)} strokeWidth={2.5} />;

  if (showLabel) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {icon}
        <span>{meta.label}</span>
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span role="img" aria-label={`${meta.label} priority`} className="inline-flex">
          {icon}
        </span>
      </TooltipTrigger>
      <TooltipContent>{meta.label} priority</TooltipContent>
    </Tooltip>
  );
}
