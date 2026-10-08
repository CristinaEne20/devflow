import { beforeEach, describe, expect, it } from "vitest";
import { addComment, deleteComment } from "@/actions/comment-actions";
import { db } from "@/lib/db";
import { actAs, makeIssue, makeProject, makeUser, resetDb } from "./helpers";

beforeEach(resetDb);

describe("addComment", () => {
  it("adds a trimmed comment authored by the current user", async () => {
    const author = await makeUser("Author");
    const issue = await makeIssue(await makeProject(), author.id);
    actAs(author.id);

    const result = await addComment({ issueId: issue.id, content: "  Looks good  " });
    expect(result.ok).toBe(true);
    await expect(db.comment.findFirstOrThrow()).resolves.toMatchObject({ content: "Looks good", authorId: author.id });
  });

  it("rejects empty comments and unknown issues", async () => {
    await makeUser();
    expect((await addComment({ issueId: "x", content: "  " })).ok).toBe(false);
    await expect(addComment({ issueId: "missing", content: "Hi" })).resolves.toEqual({
      ok: false,
      error: "Issue not found",
    });
  });
});

describe("deleteComment", () => {
  it("lets authors delete their own comments only", async () => {
    const author = await makeUser("Author");
    const other = await makeUser("Other");
    const issue = await makeIssue(await makeProject(), author.id);
    const comment = await db.comment.create({ data: { issueId: issue.id, authorId: author.id, content: "Hi" } });

    actAs(other.id);
    await expect(deleteComment({ commentId: comment.id })).resolves.toEqual({
      ok: false,
      error: "You can only delete your own comments",
    });

    actAs(author.id);
    await expect(deleteComment({ commentId: comment.id })).resolves.toEqual({ ok: true, data: undefined });
    expect(await db.comment.count()).toBe(0);
  });
});
