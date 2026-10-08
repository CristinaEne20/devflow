"use client";

import { MarkdownEditor } from "@/components/shared/markdown-editor";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import type { UserSummary } from "@/lib/queries/users";
import { COMMENT_MAX } from "@/lib/validation";

type CommentFormProps = {
  currentUser: UserSummary;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function CommentForm({ currentUser, value, onChange, onSubmit }: CommentFormProps) {
  return (
    <div data-inline-editor className="flex gap-3">
      <UserAvatar user={currentUser} size="md" />
      <div className="min-w-0 flex-1 space-y-2">
        <MarkdownEditor
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          rows={3}
          maxLength={COMMENT_MAX}
          placeholder="Add a comment…"
          aria-label="New comment"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Markdown supported · ⌘/Ctrl+Enter to send</span>
          <Button size="sm" onClick={onSubmit} disabled={!value.trim()}>
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
