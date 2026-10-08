import { FolderKanban } from "lucide-react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { EmptyState } from "@/components/shared/empty-state";
import { getFirstProject } from "@/lib/queries/projects";
import { projectUrl } from "@/lib/urls";

export default async function HomePage() {
  // Resolve the first project per request, never at build time.
  await connection();
  const project = await getFirstProject();
  if (project) redirect(projectUrl(project.key, "board"));

  return (
    <EmptyState
      icon={FolderKanban}
      title="No projects yet"
      description={
        <>
          Populate the database with <code className="font-mono">npx prisma db seed</code>, then reload.
        </>
      }
      className="h-dvh"
    />
  );
}
