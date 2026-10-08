import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import type { ProjectSummary } from "@/lib/queries/projects";
import type { UserSummary } from "@/lib/queries/users";

type AppShellProps = {
  project: { id: string; key: string; name: string } | null;
  projects: ProjectSummary[];
  users: UserSummary[];
  currentUser: UserSummary;
  navbarActions?: ReactNode;
  children: ReactNode;
};

/**
 * Persistent sidebar + navbar. <main> never scrolls itself: each page sets
 * `h-full overflow-y-auto` (or, on the board, scrolls only the columns area),
 * because @hello-pangea/dnd supports a single scroll container per droppable.
 */
export function AppShell({ project, projects, users, currentUser, navbarActions, children }: AppShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar project={project} projects={projects} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar project={project} users={users} currentUser={currentUser} actions={navbarActions} />
        <main className="relative min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
