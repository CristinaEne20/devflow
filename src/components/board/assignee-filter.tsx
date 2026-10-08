"use client";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserSummary } from "@/lib/queries/users";
import { cn } from "@/lib/utils";

type AssigneeFilterProps = {
  users: UserSummary[];
  selectedIds: string[];
  includeUnassigned: boolean;
  onToggleUser: (userId: string) => void;
  onToggleUnassigned: () => void;
};

const toggleClass =
  "relative rounded-full ring-2 ring-background transition-transform hover:z-20 hover:-translate-y-0.5 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-ring";

export function AssigneeFilter({
  users,
  selectedIds,
  includeUnassigned,
  onToggleUser,
  onToggleUnassigned,
}: AssigneeFilterProps) {
  return (
    <div role="group" aria-label="Filter by assignee" className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {users.map((user) => {
          const isActive = selectedIds.includes(user.id);
          return (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`Show issues assigned to ${user.name}`}
                  onClick={() => onToggleUser(user.id)}
                  className={cn(toggleClass, isActive && "z-10 ring-primary")}
                >
                  <UserAvatar user={user} size="md" className="ring-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{user.name}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-pressed={includeUnassigned}
            aria-label="Show unassigned issues"
            onClick={onToggleUnassigned}
            className={cn(toggleClass, includeUnassigned && "ring-primary")}
          >
            <UserAvatar user={null} size="md" className="bg-background" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Unassigned</TooltipContent>
      </Tooltip>
    </div>
  );
}
