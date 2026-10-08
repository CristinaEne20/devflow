"use client";

import { CornerDownLeft, LoaderCircle, Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { IssueTypeIcon } from "@/components/shared/issue-type-icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Input } from "@/components/ui/input";
import { MAX_QUERY_LENGTH } from "@/lib/filters";
import type { SearchResult } from "@/lib/queries/search";
import { boardIssueUrl } from "@/lib/urls";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 200;

type Fetched = { query: string; results: SearchResult[]; failed: boolean };

function searchPageUrl(query: string) {
  return query ? `/search?${new URLSearchParams({ q: query })}` : "/search";
}

/** Wraps the first case-insensitive match of `query` in a <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-primary/15 text-foreground">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function GlobalSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listboxId = useId();
  const onSearchPage = pathname === "/search";
  const urlQuery = onSearchPage ? (searchParams.get("q") ?? "") : "";

  const [query, setQuery] = useState(urlQuery);
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isNavigating, startTransition] = useTransition();

  // Adopt URL changes (Back button, leaving /search) unless they came from this input.
  const [previousUrlQuery, setPreviousUrlQuery] = useState(urlQuery);
  const [pushedQuery, setPushedQuery] = useState<string | null>(null);
  if (urlQuery !== previousUrlQuery) {
    setPreviousUrlQuery(urlQuery);
    if (urlQuery !== pushedQuery) setQuery(urlQuery);
  }

  const trimmed = query.trim();

  // ⌘K / Ctrl+K focuses the search box from anywhere.
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // On /search the page itself is the result list, so typing updates its URL.
  useEffect(() => {
    if (!onSearchPage || trimmed === urlQuery) return;
    const timeout = setTimeout(() => {
      setPushedQuery(trimmed);
      startTransition(() => router.replace(searchPageUrl(trimmed), { scroll: false }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [onSearchPage, trimmed, urlQuery, router]);

  // Everywhere else, fetch quick results for the dropdown.
  useEffect(() => {
    if (onSearchPage || !trimmed) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?${new URLSearchParams({ q: trimmed })}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Search failed with ${response.status}`);
        const results = (await response.json()) as SearchResult[];
        setFetched({ query: trimmed, results, failed: false });
      } catch {
        if (!controller.signal.aborted) setFetched({ query: trimmed, results: [], failed: true });
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [onSearchPage, trimmed]);

  const isFresh = fetched?.query === trimmed;
  const isLoading = !onSearchPage && trimmed !== "" && !isFresh;
  // Keep showing the previous results while the next ones load, so the list doesn't flicker.
  const results = fetched?.results ?? [];
  const open = focused && !dismissed && !onSearchPage && trimmed !== "" && (fetched !== null || isLoading);
  const seeAllIndex = results.length;
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  function close() {
    setDismissed(true);
    setActiveIndex(-1);
  }

  function moveActive(delta: number) {
    // Cycles through: nothing highlighted (-1), each result, then "See all".
    const states = results.length + 2;
    const next = ((activeIndex + 1 + delta + states) % states) - 1;
    setActiveIndex(next);
    if (next >= 0) document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" });
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (event.key === "ArrowDown" && trimmed) {
        event.preventDefault();
        setDismissed(false);
      }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Enter" && activeIndex >= 0 && activeIndex < results.length) {
      // Enter on a highlighted issue opens it; otherwise the form submits to /search.
      event.preventDefault();
      const issue = results[activeIndex];
      if (issue) openIssue(issue);
    }
  }

  function openIssue(issue: SearchResult) {
    close();
    setQuery("");
    inputRef.current?.blur();
    router.push(boardIssueUrl(issue.project.key, issue.key));
  }

  return (
    <Form
      action="/search"
      role="search"
      className="relative w-full max-w-xs"
      onSubmit={close}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      {isLoading || isNavigating ? (
        <LoaderCircle
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
        />
      ) : (
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        ref={inputRef}
        name="q"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setDismissed(false);
          setActiveIndex(-1);
        }}
        onKeyDown={onInputKeyDown}
        placeholder="Search issues…"
        aria-label="Search issues"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        autoComplete="off"
        maxLength={MAX_QUERY_LENGTH}
        className="h-8 bg-muted/50 pr-12 pl-8 shadow-none"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
        ⌘K
      </kbd>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-1.5 w-[28rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
          <div
            id={listboxId}
            role="listbox"
            aria-label="Search results"
            className={cn("max-h-96 overflow-y-auto p-1 transition-opacity", isLoading && "opacity-60")}
          >
            {results.map((issue, index) => (
              <Link
                key={issue.id}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                tabIndex={-1}
                href={boardIssueUrl(issue.project.key, issue.key)}
                onClick={(event) => {
                  event.preventDefault();
                  openIssue(issue);
                }}
                onMouseMove={() => setActiveIndex(index)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-2 text-sm",
                  index === activeIndex && "bg-accent text-accent-foreground",
                )}
              >
                <IssueTypeIcon type={issue.type} />
                <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">
                  <Highlight text={issue.key} query={isFresh ? trimmed : ""} />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <Highlight text={issue.title} query={isFresh ? trimmed : ""} />
                </span>
                <StatusBadge status={issue.status} className="hidden shrink-0 sm:inline-flex" />
                <UserAvatar user={issue.assignee} />
              </Link>
            ))}

            {isFresh && results.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {fetched?.failed ? "Couldn't load results. Press Enter to search." : "No matching issues"}
              </p>
            )}
            {!fetched && isLoading && <p className="px-2 py-6 text-center text-sm text-muted-foreground">Searching…</p>}
          </div>

          <Link
            id={optionId(seeAllIndex)}
            role="option"
            aria-selected={activeIndex === seeAllIndex}
            tabIndex={-1}
            href={searchPageUrl(trimmed)}
            onClick={close}
            onMouseMove={() => setActiveIndex(seeAllIndex)}
            className={cn(
              "flex items-center gap-2 border-t px-3 py-2 text-sm text-muted-foreground",
              activeIndex === seeAllIndex && "bg-accent text-accent-foreground",
            )}
          >
            <Search aria-hidden className="size-3.5" />
            <span className="min-w-0 flex-1 truncate">
              See all results for “<span className="text-foreground">{trimmed}</span>”
            </span>
            <CornerDownLeft aria-hidden className="size-3.5" />
          </Link>
        </div>
      )}
    </Form>
  );
}
