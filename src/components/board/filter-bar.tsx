"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { AssigneeFilter } from "@/components/board/assignee-filter";
import { TypeFilter } from "@/components/board/type-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IssueType } from "@/lib/domain";
import { EMPTY_FILTERS, MAX_QUERY_LENGTH, hasActiveFilters, writeFilters, type BoardFilters } from "@/lib/filters";
import type { UserSummary } from "@/lib/queries/users";

const SEARCH_DEBOUNCE_MS = 300;

function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

export function FilterBar({ users, filters }: { users: UserSummary[]; filters: BoardFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local text so typing is instant; the URL is updated after a pause.
  const [query, setQuery] = useState(filters.q);
  const [pushedQuery, setPushedQuery] = useState<string | null>(null);
  const [previousUrlQuery, setPreviousUrlQuery] = useState(filters.q);
  if (filters.q !== previousUrlQuery) {
    // The URL changed. Adopt it unless it's the value this input just pushed
    // (e.g. Back button or "Clear" changed it from elsewhere).
    setPreviousUrlQuery(filters.q);
    if (filters.q !== pushedQuery) setQuery(filters.q);
  }

  // Toggles push a history entry (Back undoes them); typing replaces so it doesn't flood history.
  const apply = useCallback(
    (next: BoardFilters, mode: "push" | "replace" = "push") => {
      const params = writeFilters(searchParams.toString(), next).toString();
      const href = `${pathname}${params ? `?${params}` : ""}`;
      startTransition(() => router[mode](href, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const next = query.trim();
    if (next === filters.q) return;
    const timeout = setTimeout(() => {
      setPushedQuery(next);
      apply({ ...filters, q: next }, "replace");
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query, filters, apply]);

  function clearAll() {
    setQuery("");
    setPushedQuery("");
    apply(EMPTY_FILTERS);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 pb-4">
      <div className="relative w-full max-w-60">
        {isPending ? (
          <LoaderCircle aria-hidden className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search aria-hidden className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search this board"
          aria-label="Filter issues by title or key"
          maxLength={MAX_QUERY_LENGTH}
          className="h-8 pl-8"
        />
      </div>

      <AssigneeFilter
        users={users}
        selectedIds={filters.assigneeIds}
        includeUnassigned={filters.includeUnassigned}
        onToggleUser={(userId) => apply({ ...filters, assigneeIds: toggle(filters.assigneeIds, userId) })}
        onToggleUnassigned={() => apply({ ...filters, includeUnassigned: !filters.includeUnassigned })}
      />

      <TypeFilter
        selected={filters.types}
        onToggle={(type: IssueType) => apply({ ...filters, types: toggle(filters.types, type) })}
      />

      {hasActiveFilters(filters) && (
        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={clearAll}>
          <X aria-hidden className="size-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
