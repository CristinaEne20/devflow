import type { IssueParent } from "@/lib/queries/issues";
import { cn } from "@/lib/utils";

/** Compact chip naming an issue's parent: the epic's title, or the parent's key for subtasks. */
export function ParentLabel({ parent, className }: { parent: IssueParent; className?: string }) {
  const isEpic = parent.type === "EPIC";
  return (
    <span
      title={`${parent.key}: ${parent.title}`}
      className={cn(
        "inline-flex max-w-full items-center truncate rounded px-1.5 py-0.5 text-[11px] font-medium",
        isEpic
          ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
          : "bg-muted font-mono text-muted-foreground",
        className,
      )}
    >
      <span className="truncate">{isEpic ? parent.title : parent.key}</span>
    </span>
  );
}
