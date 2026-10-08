"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { addComment } from "@/actions/comment-actions";
import { CommentForm } from "@/components/comments/comment-form";
import { CommentItem } from "@/components/comments/comment-item";
import type { CommentView } from "@/lib/queries/issues";
import type { UserSummary } from "@/lib/queries/users";

type PendingComment = CommentView & { isPending?: true };

type IssueCommentsProps = { issueId: string; comments: CommentView[]; currentUser: UserSummary };

export function IssueComments({ issueId, comments, currentUser }: IssueCommentsProps) {
  const [optimisticComments, addOptimisticComment] = useOptimistic<PendingComment[], PendingComment>(
    comments,
    (state, comment) => [...state, comment],
  );
  const [draft, setDraft] = useState("");
  const [, startTransition] = useTransition();

  function submit() {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    startTransition(async () => {
      addOptimisticComment({
        id: `pending-${crypto.randomUUID()}`,
        content,
        createdAt: new Date(),
        author: currentUser,
        isPending: true,
      });
      const result = await addComment({ issueId, content });
      if (!result.ok) {
        toast.error(result.error);
        setDraft(content);
      }
    });
  }

  return (
    <section aria-labelledby="activity-heading" className="space-y-4">
      <h3 id="activity-heading" className="text-sm font-semibold">
        Activity <span className="font-normal text-muted-foreground">({optimisticComments.length})</span>
      </h3>
      {optimisticComments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-5">
          {optimisticComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isPending={comment.isPending}
              canDelete={comment.author.id === currentUser.id}
            />
          ))}
        </ul>
      )}
      <CommentForm currentUser={currentUser} value={draft} onChange={setDraft} onSubmit={submit} />
    </section>
  );
}
