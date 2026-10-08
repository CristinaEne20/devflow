"use client";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NONE } from "@/lib/forms";
import type { UserSummary } from "@/lib/queries/users";
import { cn } from "@/lib/utils";
import type { SelectFieldProps } from "./types";

type AssigneeSelectProps = SelectFieldProps<string | null> & { users: UserSummary[] };

export function AssigneeSelect({
  users,
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  id,
  className,
}: AssigneeSelectProps) {
  return (
    <Select
      value={value === undefined ? undefined : (value ?? NONE)}
      defaultValue={defaultValue === undefined ? undefined : (defaultValue ?? NONE)}
      onValueChange={(next) => onValueChange?.(next === NONE ? null : next)}
      name={name}
      disabled={disabled}
    >
      <SelectTrigger id={id} size="sm" aria-label="Assignee" className={cn("w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>
          <UserAvatar user={null} size="xs" />
          <span className="text-muted-foreground">Unassigned</span>
        </SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <UserAvatar user={user} size="xs" />
            {user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
