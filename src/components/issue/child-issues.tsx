"use client";

import Link from "next/link";
import { IssueTypeIcon } from "@/components/shared/issue-type-icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { useIssueHref } from "@/hooks/use-issue-href";
import type { ChildIssue } from "@/lib/queries/issues";

export function ChildIssues({ issues }: { issues: ChildIssue[] }) {
  const issueHref = useIssueHref();
  if (issues.length === 0) return null;

  return (
    <section aria-labelledby="child-issues-heading" className="space-y-2">
      <h3 id="child-issues-heading" className="text-sm font-semibold">
        Child issues <span className="font-normal text-muted-foreground">({issues.length})</span>
      </h3>
      <ul className="divide-y overflow-hidden rounded-lg border">
        {issues.map((child) => (
          <li key={child.id}>
            <Link
              href={issueHref(child.key)}
              scroll={false}
              className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
            >
              <IssueTypeIcon type={child.type} />
              <span className="font-mono text-xs text-muted-foreground">{child.key}</span>
              <span className="min-w-0 flex-1 truncate">{child.title}</span>
              <StatusBadge status={child.status} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
