"use client";

import { ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { IssueStatus } from "@/lib/domain";
import { cn } from "@/lib/utils";

type BacklogGroupProps = { status: IssueStatus; count: number; points: number; children: ReactNode };

export function BacklogGroup({ status, count, points, children }: BacklogGroupProps) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <ChevronRight aria-hidden className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-90")} />
        <StatusBadge status={status} />
        <span className="text-sm text-muted-foreground tabular-nums">
          {count} issue{count === 1 ? "" : "s"}
        </span>
        {points > 0 && <span className="ml-auto text-xs text-muted-foreground tabular-nums">{points} pts</span>}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {count > 0 ? (
          <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-xs">{children}</ul>
        ) : (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            No issues
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
