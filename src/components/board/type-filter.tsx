"use client";

import { ChevronDown } from "lucide-react";
import { IssueTypeIcon } from "@/components/shared/issue-type-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ISSUE_TYPES, type IssueType } from "@/lib/domain";
import { ISSUE_TYPE_META } from "@/lib/issue-meta";

type TypeFilterProps = { selected: IssueType[]; onToggle: (type: IssueType) => void };

export function TypeFilter({ selected, onToggle }: TypeFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          Type
          {selected.length > 0 && (
            <span className="rounded bg-primary/10 px-1.5 text-xs font-semibold text-primary tabular-nums">
              {selected.length}
            </span>
          )}
          <ChevronDown aria-hidden className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {ISSUE_TYPES.map((type) => (
          <DropdownMenuCheckboxItem
            key={type}
            checked={selected.includes(type)}
            onCheckedChange={() => onToggle(type)}
            // Keep the menu open so several types can be toggled in a row.
            onSelect={(event) => event.preventDefault()}
          >
            <IssueTypeIcon type={type} />
            {ISSUE_TYPE_META[type].label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
