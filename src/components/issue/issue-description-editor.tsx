"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { updateIssue } from "@/actions/issue-actions";
import { Markdown } from "@/components/shared/markdown";
import { MarkdownEditor } from "@/components/shared/markdown-editor";
import { Button } from "@/components/ui/button";
import { useOptimisticField } from "@/hooks/use-optimistic-field";
import { DESCRIPTION_MAX } from "@/lib/validation";

export function IssueDescriptionEditor({ issueId, description }: { issueId: string; description: string | null }) {
  const [value, save, isPending] = useOptimisticField(description ?? "", (next: string) =>
    updateIssue({ id: issueId, patch: { description: next } }),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEditing() {
    setDraft(value);
    setIsEditing(true);
  }

  function commit() {
    setIsEditing(false);
    if (draft !== value) save(draft);
  }

  return (
    <section aria-labelledby="issue-description-heading" className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 id="issue-description-heading" className="text-sm font-semibold">
          Description
        </h3>
        {!isEditing && value && (
          <Button variant="ghost" size="sm" className="h-7 text-muted-foreground" onClick={startEditing} disabled={isPending}>
            <Pencil aria-hidden className="size-3.5" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div
          data-inline-editor
          className="space-y-2"
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsEditing(false);
          }}
        >
          <MarkdownEditor
            value={draft}
            onChange={setDraft}
            onSubmit={commit}
            autoFocus
            rows={10}
            maxLength={DESCRIPTION_MAX}
            aria-label="Issue description"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={commit}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : value ? (
        <Markdown className={isPending ? "opacity-60" : undefined}>{value}</Markdown>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="w-full rounded-md border border-dashed px-3 py-6 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50"
        >
          Add a description…
        </button>
      )}
    </section>
  );
}
