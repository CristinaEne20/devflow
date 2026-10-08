import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CreateIssueDialog } from "@/components/issue/create-issue-dialog";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { listParentCandidates } from "@/lib/queries/issues";
import { getProjectByKey, listProjects } from "@/lib/queries/projects";
import { listUsers } from "@/lib/queries/users";

type ProjectLayoutProps = { children: ReactNode; params: Promise<{ key: string }> };

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { key } = await params;
  const [project, projects, users, currentUser] = await Promise.all([
    getProjectByKey(key),
    listProjects(),
    listUsers(),
    getCurrentUser(),
  ]);
  if (!project) notFound();

  const parentCandidates = await listParentCandidates(project.id);

  return (
    <AppShell
      project={project}
      projects={projects}
      users={users}
      currentUser={currentUser}
      navbarActions={
        <CreateIssueDialog
          projectId={project.id}
          projectKey={project.key}
          users={users}
          parentCandidates={parentCandidates}
        />
      }
    >
      {children}
    </AppShell>
  );
}
