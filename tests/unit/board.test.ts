import { describe, expect, it } from "vitest";
import { groupByStatus, moveInColumns, neighborsAfterMove, type Columns } from "@/lib/board";
import type { IssueStatus } from "@/lib/domain";

type Item = { id: string; status: IssueStatus };

const item = (id: string, status: IssueStatus): Item => ({ id, status });

function sampleColumns(): Columns<Item> {
  return groupByStatus([
    item("a", "TODO"),
    item("b", "TODO"),
    item("c", "TODO"),
    item("d", "IN_PROGRESS"),
  ]);
}

const ids = (columns: Columns<Item>, status: IssueStatus) => columns[status].map((i) => i.id);

describe("groupByStatus", () => {
  it("creates every column, preserving input order", () => {
    const columns = sampleColumns();
    expect(Object.keys(columns)).toEqual(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
    expect(ids(columns, "TODO")).toEqual(["a", "b", "c"]);
    expect(ids(columns, "DONE")).toEqual([]);
  });
});

describe("moveInColumns", () => {
  it("reorders within a column using the post-removal destination index", () => {
    const next = moveInColumns(sampleColumns(), {
      issueId: "a",
      from: { status: "TODO", index: 0 },
      to: { status: "TODO", index: 2 },
    });
    expect(ids(next, "TODO")).toEqual(["b", "c", "a"]);
  });

  it("moves across columns and updates the item's status", () => {
    const next = moveInColumns(sampleColumns(), {
      issueId: "b",
      from: { status: "TODO", index: 1 },
      to: { status: "IN_PROGRESS", index: 0 },
    });
    expect(ids(next, "TODO")).toEqual(["a", "c"]);
    expect(ids(next, "IN_PROGRESS")).toEqual(["b", "d"]);
    expect(next.IN_PROGRESS[0]?.status).toBe("IN_PROGRESS");
  });

  it("does not mutate the input", () => {
    const columns = sampleColumns();
    moveInColumns(columns, {
      issueId: "a",
      from: { status: "TODO", index: 0 },
      to: { status: "DONE", index: 0 },
    });
    expect(ids(columns, "TODO")).toEqual(["a", "b", "c"]);
    expect(columns.TODO[0]?.status).toBe("TODO");
  });

  it("returns the same columns when the issue is unknown", () => {
    const columns = sampleColumns();
    const next = moveInColumns(columns, {
      issueId: "zzz",
      from: { status: "TODO", index: 0 },
      to: { status: "DONE", index: 0 },
    });
    expect(next).toBe(columns);
  });
});

describe("neighborsAfterMove", () => {
  it("returns both neighbors for a drop in the middle", () => {
    expect(
      neighborsAfterMove(sampleColumns(), {
        issueId: "d",
        from: { status: "IN_PROGRESS", index: 0 },
        to: { status: "TODO", index: 1 },
      }),
    ).toEqual({ beforeId: "a", afterId: "b" });
  });

  it("has no before-neighbor at the top", () => {
    expect(
      neighborsAfterMove(sampleColumns(), {
        issueId: "d",
        from: { status: "IN_PROGRESS", index: 0 },
        to: { status: "TODO", index: 0 },
      }),
    ).toEqual({ beforeId: null, afterId: "a" });
  });

  it("has no after-neighbor at the bottom of the same column", () => {
    expect(
      neighborsAfterMove(sampleColumns(), {
        issueId: "a",
        from: { status: "TODO", index: 0 },
        to: { status: "TODO", index: 2 },
      }),
    ).toEqual({ beforeId: "c", afterId: null });
  });

  it("has no neighbors in an empty column", () => {
    expect(
      neighborsAfterMove(sampleColumns(), {
        issueId: "a",
        from: { status: "TODO", index: 0 },
        to: { status: "DONE", index: 0 },
      }),
    ).toEqual({ beforeId: null, afterId: null });
  });
});
