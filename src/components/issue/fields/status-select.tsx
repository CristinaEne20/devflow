"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ISSUE_STATUSES, isIssueStatus, type IssueStatus } from "@/lib/domain";
import { cn } from "@/lib/utils";
import type { SelectFieldProps } from "./types";

export function StatusSelect({ value, defaultValue, onValueChange, name, disabled, id, className }: SelectFieldProps<IssueStatus>) {
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => isIssueStatus(next) && onValueChange?.(next)}
      name={name}
      disabled={disabled}
    >
      <SelectTrigger id={id} size="sm" aria-label="Status" className={cn("w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ISSUE_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            <StatusBadge status={status} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
