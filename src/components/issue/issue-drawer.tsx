"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChildIssues } from "@/components/issue/child-issues";
import { CopyLinkButton } from "@/components/issue/copy-link-button";
import { DeleteIssueButton } from "@/components/issue/delete-issue-button";
import { IssueDescriptionEditor } from "@/components/issue/issue-description-editor";
import { IssueFieldsPanel } from "@/components/issue/issue-fields-panel";
import { IssueTitleEditor } from "@/components/issue/issue-title-editor";
import { IssueTypeIcon } from "@/components/shared/issue-type-icon";
import { ParentLabel } from "@/components/shared/parent-label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIssueHref } from "@/hooks/use-issue-href";
import type { IssueDetail, ParentCandidate } from "@/lib/queries/issues";
import type { UserSummary } from "@/lib/queries/users";

type IssueDrawerProps = {
  issueKey: string;
  issue: IssueDetail | null;
  users: UserSummary[];
  parentCandidates: ParentCandidate[];
  /** Activity section (comments), rendered below the description. */
  activity?: ReactNode;
};

export function IssueDrawer({ issueKey, issue, users, parentCandidates, activity }: IssueDrawerProps) {
  const router = useRouter();
  const issueHref = useIssueHref();
  const close = () => router.push(issueHref(null), { scroll: false });

  return (
    <Sheet open onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl"
        // Escape inside an inline editor cancels the edit instead of closing the drawer.
        onEscapeKeyDown={(event) => {
          if (event.target instanceof HTMLElement && event.target.closest("[data-inline-editor]")) {
            event.preventDefault();
          }
        }}
      >
        {issue ? (
          <>
            <SheetHeader className="flex-row items-center gap-2 space-y-0 border-b px-5 py-3 pr-12">
              <IssueTypeIcon type={issue.type} size="md" />
              <SheetTitle className="font-mono text-sm font-medium text-muted-foreground">{issue.key}</SheetTitle>
              <SheetDescription className="sr-only">{issue.title}</SheetDescription>
              <div className="ml-auto flex items-center gap-1">
                <CopyLinkButton />
                <DeleteIssueButton issueId={issue.id} issueKey={issue.key} onDeleted={close} />
              </div>
            </SheetHeader>

            <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-6 px-6 py-5">
                <div className="space-y-2">
                  {issue.parent && <ParentLabel parent={issue.parent} />}
                  <IssueTitleEditor issueId={issue.id} title={issue.title} />
                </div>
                <IssueDescriptionEditor issueId={issue.id} description={issue.description} />
                <ChildIssues issues={issue.children} />
                {activity}
              </div>
              <aside aria-label="Issue details" className="border-t bg-muted/30 px-5 py-5 md:border-t-0 md:border-l">
                <IssueFieldsPanel issue={issue} users={users} parentCandidates={parentCandidates} />
              </aside>
            </div>
          </>
        ) : (
          <SheetHeader className="p-6">
            <SheetTitle>Issue not found</SheetTitle>
            <SheetDescription>
              No issue with key <span className="font-mono">{issueKey}</span> exists in this project. It may have been
              deleted.
            </SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}
