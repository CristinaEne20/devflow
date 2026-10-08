import { ISSUE_STATUSES, type IssueStatus } from "@/lib/domain";

export type Columns<T> = Record<IssueStatus, T[]>;

/** A drag result. `to.index` is the final index after the item is removed from its source. */
export type BoardMove = {
  issueId: string;
  from: { status: IssueStatus; index: number };
  to: { status: IssueStatus; index: number };
};

type Movable = { id: string; status: IssueStatus };

export function groupByStatus<T extends { status: IssueStatus }>(items: readonly T[]): Columns<T> {
  const columns = Object.fromEntries(ISSUE_STATUSES.map((status) => [status, [] as T[]])) as Columns<T>;
  for (const item of items) columns[item.status].push(item);
  return columns;
}

export function moveInColumns<T extends Movable>(columns: Columns<T>, move: BoardMove): Columns<T> {
  const source = [...columns[move.from.status]];
  const sourceIndex = source.findIndex((item) => item.id === move.issueId);
  const [item] = sourceIndex === -1 ? [] : source.splice(sourceIndex, 1);
  if (!item) return columns;

  const moved: T = { ...item, status: move.to.status };

  if (move.from.status === move.to.status) {
    source.splice(move.to.index, 0, moved);
    return { ...columns, [move.from.status]: source };
  }

  const destination = [...columns[move.to.status]];
  destination.splice(move.to.index, 0, moved);
  return { ...columns, [move.from.status]: source, [move.to.status]: destination };
}

/** Ids of the items directly above and below the moved item once the move is applied. */
export function neighborsAfterMove<T extends Movable>(
  columns: Columns<T>,
  move: BoardMove,
): { beforeId: string | null; afterId: string | null } {
  const column = moveInColumns(columns, move)[move.to.status];
  return {
    beforeId: column[move.to.index - 1]?.id ?? null,
    afterId: column[move.to.index + 1]?.id ?? null,
  };
}
