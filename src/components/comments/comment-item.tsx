"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteComment } from "@/actions/comment-actions";
import { Markdown } from "@/components/shared/markdown";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { CommentView } from "@/lib/queries/issues";
import { cn } from "@/lib/utils";

type CommentItemProps = { comment: CommentView; canDelete: boolean; isPending?: boolean };

export function CommentItem({ comment, canDelete, isPending = false }: CommentItemProps) {
  const [isDeleting, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteComment({ commentId: comment.id });
      if (result.ok) toast.success("Comment deleted");
      else toast.error(result.error);
    });
  }

  return (
    <li className={cn("group flex gap-3", (isPending || isDeleting) && "opacity-60")}>
      <UserAvatar user={comment.author} size="md" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{comment.author.name}</span>
          <time
            dateTime={comment.createdAt.toISOString()}
            title={formatDate(comment.createdAt)}
            suppressHydrationWarning
            className="text-xs text-muted-foreground"
          >
            {isPending ? "Sending…" : formatRelativeTime(comment.createdAt)}
          </time>
          {canDelete && !isPending && (
            <Button
              variant="ghost"
              size="icon"
              onClick={remove}
              disabled={isDeleting}
              aria-label="Delete comment"
              className="ml-auto size-7 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive"
            >
              <Trash2 aria-hidden className="size-3.5" />
            </Button>
          )}
        </div>
        <Markdown>{comment.content}</Markdown>
      </div>
    </li>
  );
}
