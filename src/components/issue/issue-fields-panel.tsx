"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { updateIssue } from "@/actions/issue-actions";
import { AssigneeSelect } from "@/components/issue/fields/assignee-select";
import { ParentSelect } from "@/components/issue/fields/parent-select";
import { PrioritySelect } from "@/components/issue/fields/priority-select";
import { StatusSelect } from "@/components/issue/fields/status-select";
import { TypeSelect } from "@/components/issue/fields/type-select";
import { StoryPointsInput } from "@/components/issue/story-points-input";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Separator } from "@/components/ui/separator";
import { useOptimisticField } from "@/hooks/use-optimistic-field";
import type { IssuePriority, IssueStatus, IssueType } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import type { IssueDetail, ParentCandidate } from "@/lib/queries/issues";
import type { UserSummary } from "@/lib/queries/users";
import { canBeParentOf, type IssuePatch } from "@/lib/validation";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

type IssueFieldsPanelProps = {
  issue: IssueDetail;
  users: UserSummary[];
  parentCandidates: ParentCandidate[];
};

export function IssueFieldsPanel({ issue, users, parentCandidates }: IssueFieldsPanelProps) {
  const save = (patch: IssuePatch) => updateIssue({ id: issue.id, patch });

  const [status, setStatus, statusPending] = useOptimisticField(issue.status, (status: IssueStatus) => save({ status }));
  const [priority, setPriority, priorityPending] = useOptimisticField(issue.priority, (priority: IssuePriority) =>
    save({ priority }),
  );
  const [type, setType, typePending] = useOptimisticField(issue.type, (type: IssueType) => save({ type }));
  const [assigneeId, setAssigneeId, assigneePending] = useOptimisticField(
    issue.assignee?.id ?? null,
    (assigneeId: string | null) => save({ assigneeId }),
  );
  const [parentId, setParentId, parentPending] = useOptimisticField(
    issue.parent?.id ?? null,
    (parentId: string | null) => save({ parentId }),
  );

  // Converting to a subtask needs a parent in the same save, so the Parent picker
  // switches to subtask-eligible parents until one is chosen.
  const [isChoosingSubtaskParent, setIsChoosingSubtaskParent] = useState(false);
  const [isConverting, startConverting] = useTransition();
  const currentParent = parentCandidates.find((candidate) => candidate.id === parentId) ?? null;

  function changeType(next: IssueType) {
    if (next === "SUBTASK" && !(currentParent && canBeParentOf(currentParent.type, "SUBTASK"))) {
      setIsChoosingSubtaskParent(true);
      return;
    }
    setIsChoosingSubtaskParent(false);
    setType(next);
  }

  function convertToSubtask(newParentId: string | null) {
    if (!newParentId) return;
    startConverting(async () => {
      const result = await save({ type: "SUBTASK", parentId: newParentId });
      if (!result.ok) toast.error(result.error);
      setIsChoosingSubtaskParent(false);
    });
  }

  const parentTargetType: IssueType = isChoosingSubtaskParent ? "SUBTASK" : type;
  // Offer only parents valid for the (optimistic) type, plus the current parent so it still displays.
  const eligibleParents = parentCandidates.filter(
    (candidate) =>
      (!isChoosingSubtaskParent && candidate.id === parentId) ||
      (candidate.id !== issue.id && canBeParentOf(candidate.type, parentTargetType)),
  );

  return (
    <dl className="space-y-3">
      <Field label="Status">
        <StatusSelect value={status} onValueChange={setStatus} disabled={statusPending} />
      </Field>
      <Field label="Priority">
        <PrioritySelect value={priority} onValueChange={setPriority} disabled={priorityPending} />
      </Field>
      <Field label="Type">
        <TypeSelect value={type} onValueChange={changeType} disabled={typePending || isConverting} />
      </Field>
      {isChoosingSubtaskParent && (
        <div role="status" className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
          <p>Pick a story, task or bug as the parent to convert this issue into a subtask.</p>
          <button
            type="button"
            onClick={() => setIsChoosingSubtaskParent(false)}
            className="mt-1 font-medium text-primary hover:underline"
          >
            Cancel
          </button>
        </div>
      )}
      <Field label="Assignee">
        <AssigneeSelect users={users} value={assigneeId} onValueChange={setAssigneeId} disabled={assigneePending} />
      </Field>
      <Field label="Parent">
        <ParentSelect
          candidates={eligibleParents}
          value={isChoosingSubtaskParent ? null : parentId}
          onValueChange={isChoosingSubtaskParent ? convertToSubtask : setParentId}
          disabled={parentPending || isConverting || (type === "EPIC" && !isChoosingSubtaskParent)}
        />
      </Field>
      <Field label="Story points">
        <StoryPointsInput issueId={issue.id} value={issue.storyPoints} />
      </Field>
      <Field label="Reporter">
        <span className="flex items-center gap-2">
          <UserAvatar user={issue.reporter} size="xs" />
          <span className="truncate">{issue.reporter.name}</span>
        </span>
      </Field>

      <Separator className="my-4" />

      <Field label="Created">
        <time dateTime={issue.createdAt.toISOString()} suppressHydrationWarning className="text-xs text-muted-foreground">
          {formatDate(issue.createdAt)}
        </time>
      </Field>
      <Field label="Updated">
        <time dateTime={issue.updatedAt.toISOString()} suppressHydrationWarning className="text-xs text-muted-foreground">
          {formatDate(issue.updatedAt)}
        </time>
      </Field>
    </dl>
  );
}
