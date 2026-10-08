import type { IssueType } from "@/lib/domain";
import { ISSUE_TYPE_META } from "@/lib/issue-meta";
import { cn } from "@/lib/utils";

type IssueTypeIconProps = {
  type: IssueType;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
};

export function IssueTypeIcon({ type, size = "sm", showLabel = false, className }: IssueTypeIconProps) {
  const meta = ISSUE_TYPE_META[type];
  const Icon = meta.icon;
  const icon = (
    <span
      role="img"
      aria-label={meta.label}
      title={meta.label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded",
        size === "sm" ? "size-4" : "size-5",
        meta.className,
        className,
      )}
    >
      <Icon aria-hidden className={size === "sm" ? "size-3" : "size-3.5"} strokeWidth={2.5} />
    </span>
  );

  if (!showLabel) return icon;
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      <span>{meta.label}</span>
    </span>
  );
}
