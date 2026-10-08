"use server";

import { DomainError, runAction, type ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { revalidateAll } from "@/lib/revalidate";
import { updateProjectSchema, type UpdateProjectInput } from "@/lib/validation";

export async function updateProject(input: UpdateProjectInput): Promise<ActionResult<{ key: string }>> {
  return runAction(async () => {
    const { projectId, name, description } = updateProjectSchema.parse(input);

    const exists = await db.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!exists) throw new DomainError("Project not found");

    const project = await db.project.update({
      where: { id: projectId },
      data: { name, description },
      select: { key: true },
    });

    // The project name appears in the sidebar of every page.
    revalidateAll();
    return project;
  });
}
