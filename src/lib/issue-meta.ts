// Single source of truth for how issue enums look: labels, icons and colors.
import {
  Bookmark,
  Bug,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  CornerDownRight,
  Equal,
  SquareCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { IssuePriority, IssueStatus, IssueType } from "@/lib/domain";

type IconMeta = { label: string; icon: LucideIcon; className: string };
type StatusMeta = { label: string; dotClassName: string; badgeClassName: string };

export const ISSUE_TYPE_META: Record<IssueType, IconMeta> = {
  EPIC: { label: "Epic", icon: Zap, className: "bg-violet-500 text-white" },
  STORY: { label: "Story", icon: Bookmark, className: "bg-emerald-500 text-white" },
  BUG: { label: "Bug", icon: Bug, className: "bg-red-500 text-white" },
  TASK: { label: "Task", icon: SquareCheck, className: "bg-blue-500 text-white" },
  SUBTASK: { label: "Subtask", icon: CornerDownRight, className: "bg-sky-400 text-white" },
};

export const ISSUE_PRIORITY_META: Record<IssuePriority, IconMeta> = {
  LOW: { label: "Low", icon: ChevronDown, className: "text-blue-500" },
  MEDIUM: { label: "Medium", icon: Equal, className: "text-amber-500" },
  HIGH: { label: "High", icon: ChevronUp, className: "text-orange-500" },
  CRITICAL: { label: "Critical", icon: ChevronsUp, className: "text-red-500" },
};

export const ISSUE_STATUS_META: Record<IssueStatus, StatusMeta> = {
  BACKLOG: {
    label: "Backlog",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  },
  TODO: {
    label: "To Do",
    dotClassName: "bg-slate-500",
    badgeClassName: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dotClassName: "bg-blue-500",
    badgeClassName: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  IN_REVIEW: {
    label: "In Review",
    dotClassName: "bg-violet-500",
    badgeClassName: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  DONE: {
    label: "Done",
    dotClassName: "bg-emerald-500",
    badgeClassName: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
};
