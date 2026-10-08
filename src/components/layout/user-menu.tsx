"use client";

import { Users } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { switchCurrentUser } from "@/actions/user-actions";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserSummary } from "@/lib/queries/users";

type UserMenuProps = { users: UserSummary[]; currentUser: UserSummary };

export function UserMenu({ users, currentUser }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  function switchTo(userId: string) {
    if (userId === currentUser.id) return;
    startTransition(async () => {
      const result = await switchCurrentUser({ userId });
      if (result.ok) toast.success(`Now acting as ${result.data.name}`);
      else toast.error(result.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open user menu"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <UserAvatar user={currentUser} size="md" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2.5 font-normal">
          <UserAvatar user={currentUser} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{currentUser.name}</p>
            <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={isPending}>
            <Users aria-hidden className="size-4" />
            Switch user
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <DropdownMenuRadioGroup value={currentUser.id} onValueChange={switchTo}>
              {users.map((user) => (
                <DropdownMenuRadioItem key={user.id} value={user.id}>
                  <UserAvatar user={user} size="xs" />
                  {user.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
