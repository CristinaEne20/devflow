"use client";

import { IssueTypeIcon } from "@/components/shared/issue-type-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NONE } from "@/lib/forms";
import type { ParentCandidate } from "@/lib/queries/issues";
import { cn } from "@/lib/utils";
import type { SelectFieldProps } from "./types";

type ParentSelectProps = SelectFieldProps<string | null> & { candidates: ParentCandidate[] };

export function ParentSelect({
  candidates,
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  id,
  className,
}: ParentSelectProps) {
  return (
    <Select
      value={value === undefined ? undefined : (value ?? NONE)}
      defaultValue={defaultValue === undefined ? undefined : (defaultValue ?? NONE)}
      onValueChange={(next) => onValueChange?.(next === NONE ? null : next)}
      name={name}
      disabled={disabled}
    >
      <SelectTrigger id={id} size="sm" aria-label="Parent issue" className={cn("w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>
          <span className="text-muted-foreground">None</span>
        </SelectItem>
        {candidates.map((candidate) => (
          <SelectItem key={candidate.id} value={candidate.id}>
            <IssueTypeIcon type={candidate.type} />
            <span className="font-mono text-xs text-muted-foreground">{candidate.key}</span>
            <span className="max-w-48 truncate">{candidate.title}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
