import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-9 text-sm",
} as const;

type UserAvatarProps = {
  user: { name: string; avatarUrl: string | null } | null;
  size?: keyof typeof SIZES;
  className?: string;
};

export function UserAvatar({ user, size = "sm", className }: UserAvatarProps) {
  if (!user) {
    return (
      <span
        role="img"
        aria-label="Unassigned"
        title="Unassigned"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground",
          SIZES[size],
          className,
        )}
      >
        <UserRound aria-hidden className="size-3/5" />
      </span>
    );
  }

  return (
    <Avatar title={user.name} className={cn("shrink-0 ring-1 ring-border", SIZES[size], className)}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
      <AvatarFallback className="bg-muted font-medium">{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
