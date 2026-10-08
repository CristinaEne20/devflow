"use client";

import { PriorityIcon } from "@/components/shared/priority-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ISSUE_PRIORITIES, isIssuePriority, type IssuePriority } from "@/lib/domain";
import { cn } from "@/lib/utils";
import type { SelectFieldProps } from "./types";

export function PrioritySelect({
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  id,
  className,
}: SelectFieldProps<IssuePriority>) {
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => isIssuePriority(next) && onValueChange?.(next)}
      name={name}
      disabled={disabled}
    >
      <SelectTrigger id={id} size="sm" aria-label="Priority" className={cn("w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ISSUE_PRIORITIES.map((priority) => (
          <SelectItem key={priority} value={priority}>
            <PriorityIcon priority={priority} showLabel />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
