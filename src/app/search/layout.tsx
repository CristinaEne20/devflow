import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { listProjects } from "@/lib/queries/projects";
import { listUsers } from "@/lib/queries/users";

export default async function SearchLayout({ children }: { children: ReactNode }) {
  const [projects, users, currentUser] = await Promise.all([listProjects(), listUsers(), getCurrentUser()]);
  return (
    <AppShell project={null} projects={projects} users={users} currentUser={currentUser}>
      {children}
    </AppShell>
  );
}
