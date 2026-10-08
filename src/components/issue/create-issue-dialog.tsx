"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { createIssue } from "@/actions/issue-actions";
import { AssigneeSelect } from "@/components/issue/fields/assignee-select";
import { ParentSelect } from "@/components/issue/fields/parent-select";
import { PrioritySelect } from "@/components/issue/fields/priority-select";
import { StatusSelect } from "@/components/issue/fields/status-select";
import { TypeSelect } from "@/components/issue/fields/type-select";
import { FieldError } from "@/components/shared/field-error";
import { MarkdownEditor } from "@/components/shared/markdown-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/action-result";
import type { IssueType } from "@/lib/domain";
import { createIssueInputFromForm } from "@/lib/forms";
import type { ParentCandidate } from "@/lib/queries/issues";
import type { UserSummary } from "@/lib/queries/users";
import { boardIssueUrl } from "@/lib/urls";
import { DESCRIPTION_MAX, STORY_POINTS_MAX, TITLE_MAX, canBeParentOf } from "@/lib/validation";

type CreateIssueDialogProps = {
  projectId: string;
  projectKey: string;
  users: UserSummary[];
  parentCandidates: ParentCandidate[];
};

type FormState = ActionResult<{ key: string }> | null;

export function CreateIssueDialog(props: CreateIssueDialogProps) {
  const [open, setOpen] = useState(false);
  // A new key per opening gives the form fresh state (values, errors, action state).
  const [formKey, setFormKey] = useState(0);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setFormKey((key) => key + 1);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus aria-hidden className="size-4" />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create issue</DialogTitle>
          <DialogDescription>Add a new issue to {props.projectKey}. Fields marked * are required.</DialogDescription>
        </DialogHeader>
        <CreateIssueForm key={formKey} {...props} onDone={() => handleOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CreateIssueForm({
  projectId,
  projectKey,
  users,
  parentCandidates,
  onDone,
}: CreateIssueDialogProps & { onDone: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<IssueType>("TASK");
  const [description, setDescription] = useState("");
  const [, startTransition] = useTransition();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(async (_previous, formData) => {
    const result = await createIssue(createIssueInputFromForm(formData, projectId));
    if (!result.ok) return result;

    toast.success(`${result.data.key} created`, {
      action: { label: "View", onClick: () => router.push(boardIssueUrl(projectKey, result.data.key)) },
    });
    onDone();
    return null;
  }, null);

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok && !state.fieldErrors ? state.error : null;
  const eligibleParents = parentCandidates.filter((candidate) => canBeParentOf(candidate.type, type));

  // Submit manually so React doesn't reset the form when validation fails.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="create-title">Title *</Label>
        <Input id="create-title" name="title" autoFocus maxLength={TITLE_MAX} aria-invalid={!!fieldErrors.title} />
        <FieldError messages={fieldErrors.title} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="create-type">Type</Label>
          <TypeSelect id="create-type" name="type" value={type} onValueChange={setType} />
          <FieldError messages={fieldErrors.type} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="create-status">Status</Label>
          <StatusSelect id="create-status" name="status" defaultValue="TODO" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="create-priority">Priority</Label>
          <PrioritySelect id="create-priority" name="priority" defaultValue="MEDIUM" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="create-assignee">Assignee</Label>
          <AssigneeSelect id="create-assignee" name="assigneeId" users={users} defaultValue={null} />
          <FieldError messages={fieldErrors.assigneeId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="create-parent">Parent{type === "SUBTASK" ? " *" : ""}</Label>
          <ParentSelect
            // Remount when the type changes so an ineligible selection is cleared.
            key={type}
            id="create-parent"
            name="parentId"
            candidates={eligibleParents}
            defaultValue={null}
            disabled={type === "EPIC"}
          />
          <FieldError messages={fieldErrors.parentId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="create-points">Story points</Label>
          <Input
            id="create-points"
            name="storyPoints"
            type="number"
            inputMode="numeric"
            min={0}
            max={STORY_POINTS_MAX}
            placeholder="None"
            aria-invalid={!!fieldErrors.storyPoints}
          />
          <FieldError messages={fieldErrors.storyPoints} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <MarkdownEditor
          name="description"
          value={description}
          onChange={setDescription}
          maxLength={DESCRIPTION_MAX}
          aria-label="Description"
        />
        <FieldError messages={fieldErrors.description} />
      </div>

      {formError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create issue"}
        </Button>
      </DialogFooter>
    </form>
  );
}
