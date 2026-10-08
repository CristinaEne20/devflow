import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GlobalSearch } from "@/components/layout/global-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { UserSummary } from "@/lib/queries/users";

type NavbarProps = {
  project: { key: string; name: string } | null;
  users: UserSummary[];
  currentUser: UserSummary;
  actions?: ReactNode;
};

export function Navbar({ project, users, currentUser, actions }: NavbarProps) {
  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Breadcrumbs project={project} />
      <div className="ml-auto flex flex-1 items-center justify-end gap-2">
        <GlobalSearch />
        {actions}
        <ThemeToggle />
        <UserMenu users={users} currentUser={currentUser} />
      </div>
    </header>
  );
}
