"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateIssue } from "@/actions/issue-actions";
import { Input } from "@/components/ui/input";
import { parseStoryPoints } from "@/lib/forms";
import { STORY_POINTS_MAX } from "@/lib/validation";

export function StoryPointsInput({ issueId, value }: { issueId: string; value: number | null }) {
  const asText = value === null ? "" : String(value);
  const [draft, setDraft] = useState(asText);
  const [isPending, startTransition] = useTransition();

  function commit() {
    const next = parseStoryPoints(draft);
    if (next === value) return;
    startTransition(async () => {
      const result = await updateIssue({ id: issueId, patch: { storyPoints: next } });
      if (!result.ok) {
        toast.error(result.error);
        setDraft(asText);
      }
    });
  }

  return (
    <Input
      data-inline-editor
      type="number"
      inputMode="numeric"
      min={0}
      max={STORY_POINTS_MAX}
      value={draft}
      placeholder="None"
      aria-label="Story points"
      disabled={isPending}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") setDraft(asText);
      }}
      className="h-8 w-24"
    />
  );
}
