"use server";

import { DomainError, runAction, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { revalidateProject } from "@/lib/revalidate";
import {
  addCommentSchema,
  deleteCommentSchema,
  type AddCommentInput,
  type DeleteCommentInput,
} from "@/lib/validation";

export async function addComment(input: AddCommentInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const data = addCommentSchema.parse(input);
    const author = await getCurrentUser();

    const issue = await db.issue.findUnique({ where: { id: data.issueId }, select: { id: true } });
    if (!issue) throw new DomainError("Issue not found");

    const comment = await db.comment.create({
      data: { issueId: data.issueId, content: data.content, authorId: author.id },
      select: { id: true },
    });

    revalidateProject();
    return comment;
  });
}

export async function deleteComment(input: DeleteCommentInput): Promise<ActionResult> {
  return runAction(async () => {
    const { commentId } = deleteCommentSchema.parse(input);
    const currentUser = await getCurrentUser();

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });
    if (!comment) throw new DomainError("Comment not found");
    if (comment.authorId !== currentUser.id) throw new DomainError("You can only delete your own comments");

    await db.comment.delete({ where: { id: commentId } });
    revalidateProject();
  });
}
