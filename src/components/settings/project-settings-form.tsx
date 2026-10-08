"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { updateProject } from "@/actions/project-actions";
import { FieldError } from "@/components/shared/field-error";
import { MarkdownEditor } from "@/components/shared/markdown-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/action-result";
import { projectSettingsInputFromForm } from "@/lib/forms";
import { PROJECT_DESCRIPTION_MAX, PROJECT_NAME_MAX } from "@/lib/validation";

type ProjectSettingsFormProps = {
  project: { id: string; key: string; name: string; description: string | null };
};

type FormState = ActionResult<{ key: string }> | null;

export function ProjectSettingsForm({ project }: ProjectSettingsFormProps) {
  const [description, setDescription] = useState(project.description ?? "");
  const [, startTransition] = useTransition();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(async (_previous, formData) => {
    const result = await updateProject(projectSettingsInputFromForm(formData, project.id));
    if (result.ok) toast.success("Project settings saved");
    else if (!result.fieldErrors) toast.error(result.error);
    return result;
  }, null);

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  // Submit manually so React doesn't reset the form after the action.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-xl border bg-card p-6 shadow-xs">
      <div className="grid gap-6 sm:grid-cols-[1fr_160px]">
        <div className="space-y-1.5">
          <Label htmlFor="project-name">Name *</Label>
          <Input
            id="project-name"
            name="name"
            defaultValue={project.name}
            maxLength={PROJECT_NAME_MAX}
            aria-invalid={!!fieldErrors.name}
          />
          <FieldError messages={fieldErrors.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="project-key">Key</Label>
          <Input id="project-key" value={project.key} readOnly disabled className="font-mono" />
          <p className="text-xs text-muted-foreground">Prefix for issue keys. Can&apos;t be changed.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <MarkdownEditor
          name="description"
          value={description}
          onChange={setDescription}
          maxLength={PROJECT_DESCRIPTION_MAX}
          placeholder="What is this project about?"
          aria-label="Project description"
        />
        <FieldError messages={fieldErrors.description} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
