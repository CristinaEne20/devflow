import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  MAX_QUERY_LENGTH,
  hasActiveFilters,
  parseFilters,
  toIssueWhere,
  writeFilters,
} from "@/lib/filters";

describe("parseFilters", () => {
  it("returns empty filters for no params", () => {
    expect(parseFilters({})).toEqual(EMPTY_FILTERS);
  });

  it("splits assignees, extracts the unassigned token and de-duplicates", () => {
    expect(parseFilters({ assignee: "u1,unassigned,u1,,u2" })).toMatchObject({
      assigneeIds: ["u1", "u2"],
      includeUnassigned: true,
    });
  });

  it("ignores empty assignee lists", () => {
    expect(parseFilters({ assignee: ",," })).toMatchObject({ assigneeIds: [], includeUnassigned: false });
  });

  it("keeps only valid issue types", () => {
    expect(parseFilters({ type: "BUG,FOO,story,EPIC" }).types).toEqual(["BUG", "EPIC"]);
  });

  it("uses the first value when a param is repeated", () => {
    expect(parseFilters({ type: ["TASK", "BUG"] }).types).toEqual(["TASK"]);
  });

  it("trims and clamps the text query", () => {
    expect(parseFilters({ q: "  login  " }).q).toBe("login");
    expect(parseFilters({ q: "x".repeat(5000) }).q).toHaveLength(MAX_QUERY_LENGTH);
  });

  it("strips NUL and other control characters that Postgres rejects", () => {
    expect(parseFilters({ q: "lo\u0000gin\u0007", assignee: "u1\u0000" })).toMatchObject({
      q: "login",
      assigneeIds: ["u1"],
    });
  });

  it("accepts URLSearchParams", () => {
    expect(parseFilters(new URLSearchParams("type=BUG&q=crash"))).toMatchObject({ types: ["BUG"], q: "crash" });
  });
});

describe("writeFilters", () => {
  it("preserves unrelated params and drops empty filters", () => {
    const params = writeFilters("issue=DEV-1&q=old&type=BUG", { ...EMPTY_FILTERS, assigneeIds: ["u1"] });
    expect(params.get("issue")).toBe("DEV-1");
    expect(params.get("assignee")).toBe("u1");
    expect(params.has("q")).toBe(false);
    expect(params.has("type")).toBe(false);
  });

  it("round-trips through parseFilters", () => {
    const filters = { assigneeIds: ["u1", "u2"], includeUnassigned: true, types: ["BUG" as const], q: "drag" };
    expect(parseFilters(writeFilters("", filters))).toEqual(filters);
  });
});

describe("hasActiveFilters", () => {
  it("detects any active filter", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, includeUnassigned: true })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, q: "x" })).toBe(true);
  });
});

describe("toIssueWhere", () => {
  it("only scopes by project when no filters are set", () => {
    expect(toIssueWhere("p1", EMPTY_FILTERS)).toEqual({ projectId: "p1" });
  });

  it("combines assignee, type and text filters", () => {
    expect(
      toIssueWhere("p1", { assigneeIds: ["u1"], includeUnassigned: true, types: ["BUG"], q: "login" }),
    ).toEqual({
      projectId: "p1",
      AND: [
        { OR: [{ assigneeId: { in: ["u1"] } }, { assigneeId: null }] },
        { type: { in: ["BUG"] } },
        {
          OR: [
            { title: { contains: "login", mode: "insensitive" } },
            { key: { startsWith: "login", mode: "insensitive" } },
          ],
        },
      ],
    });
  });

  it("filters to unassigned only", () => {
    expect(toIssueWhere("p1", { ...EMPTY_FILTERS, includeUnassigned: true })).toEqual({
      projectId: "p1",
      AND: [{ OR: [{ assigneeId: null }] }],
    });
  });
});
