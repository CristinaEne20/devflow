import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectSettingsForm } from "@/components/settings/project-settings-form";
import { getProjectByKey } from "@/lib/queries/projects";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const project = await getProjectByKey(key);
  if (!project) notFound();

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Project settings" description="Update how this project appears across DevFlow." />
      <div className="max-w-3xl px-6 pb-10">
        <ProjectSettingsForm
          project={{ id: project.id, key: project.key, name: project.name, description: project.description }}
        />
      </div>
    </div>
  );
}
