"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { withIssueParam } from "@/lib/urls";

/** Builds links that open (or, with null, close) the issue drawer while keeping filters. */
export function useIssueHref() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useCallback(
    (issueKey: string | null) => `${pathname}${withIssueParam(searchParams.toString(), issueKey)}`,
    [pathname, searchParams],
  );
}
