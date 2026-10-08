"use client";

import { LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { updateIssue } from "@/actions/issue-actions";
import { Textarea } from "@/components/ui/textarea";
import { useOptimisticField } from "@/hooks/use-optimistic-field";
import { TITLE_MAX } from "@/lib/validation";

export function IssueTitleEditor({ issueId, title }: { issueId: string; title: string }) {
  const [value, save, isPending] = useOptimisticField(title, (next: string) =>
    updateIssue({ id: issueId, patch: { title: next } }),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  // Escape unmounts the textarea, which can still fire blur; this skips that commit.
  const cancelledRef = useRef(false);

  function cancel() {
    cancelledRef.current = true;
    setIsEditing(false);
  }

  function commit() {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    setIsEditing(false);
    const next = draft.trim();
    if (!next) {
      toast.error("Title is required");
      return;
    }
    if (next !== value) save(next);
  }

  if (isEditing) {
    return (
      <Textarea
        data-inline-editor
        autoFocus
        value={draft}
        rows={2}
        maxLength={TITLE_MAX}
        aria-label="Issue title"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") cancel();
        }}
        className="resize-none text-xl font-semibold tracking-tight md:text-xl"
      />
    );
  }

  return (
    <h2 className="text-xl font-semibold tracking-tight">
      <button
        type="button"
        onClick={() => {
          cancelledRef.current = false;
          setDraft(value);
          setIsEditing(true);
        }}
        className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={`Edit title: ${value}`}
      >
        <span className="min-w-0 flex-1 break-words">{value}</span>
        {isPending && <LoaderCircle aria-hidden className="mt-1.5 size-4 shrink-0 animate-spin text-muted-foreground" />}
      </button>
    </h2>
  );
}
