import { IssueComments } from "@/components/comments/issue-comments";
import { IssueDrawer } from "@/components/issue/issue-drawer";
import { getCurrentUser } from "@/lib/current-user";
import { getIssueDetail, listParentCandidates } from "@/lib/queries/issues";
import { listUsers } from "@/lib/queries/users";

/** Server half of the drawer: loads everything the client drawer needs for `?issue=KEY`. */
export async function IssueDrawerSlot({ projectId, issueKey }: { projectId: string; issueKey: string }) {
  const [issue, users, parentCandidates, currentUser] = await Promise.all([
    getIssueDetail(projectId, issueKey),
    listUsers(),
    listParentCandidates(projectId),
    getCurrentUser(),
  ]);

  return (
    <IssueDrawer
      // Remount per issue so inline-editor state never leaks between issues.
      key={issue?.id ?? issueKey}
      issueKey={issueKey}
      issue={issue}
      users={users}
      parentCandidates={parentCandidates}
      activity={
        issue && (
          <IssueComments key={issue.id} issueId={issue.id} comments={issue.comments} currentUser={currentUser} />
        )
      }
    />
  );
}
