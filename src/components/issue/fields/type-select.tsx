"use client";

import { IssueTypeIcon } from "@/components/shared/issue-type-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ISSUE_TYPES, isIssueType, type IssueType } from "@/lib/domain";
import { cn } from "@/lib/utils";
import type { SelectFieldProps } from "./types";

export function TypeSelect({ value, defaultValue, onValueChange, name, disabled, id, className }: SelectFieldProps<IssueType>) {
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => isIssueType(next) && onValueChange?.(next)}
      name={name}
      disabled={disabled}
    >
      <SelectTrigger id={id} size="sm" aria-label="Issue type" className={cn("w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ISSUE_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            <IssueTypeIcon type={type} showLabel />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
