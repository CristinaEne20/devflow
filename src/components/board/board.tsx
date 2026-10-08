"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { moveIssue } from "@/actions/issue-actions";
import { BoardColumn } from "@/components/board/board-column";
import { moveInColumns, neighborsAfterMove, type BoardMove, type Columns } from "@/lib/board";
import { ISSUE_STATUSES, isIssueStatus } from "@/lib/domain";
import type { BoardIssue } from "@/lib/queries/issues";

type BoardProps = {
  columns: Columns<BoardIssue>;
  /** While searching, only the columns that contain matches are shown. */
  hideEmptyColumns?: boolean;
};

export function Board({ columns, hideEmptyColumns = false }: BoardProps) {
  // The optimistic copy shows the drop instantly; when the action's
  // revalidation lands (or fails), React falls back to the server `columns`.
  const [optimisticColumns, applyMove] = useOptimistic(columns, moveInColumns<BoardIssue>);
  const [, startTransition] = useTransition();
  // Decided from the server `columns` so a column doesn't vanish mid-drag.
  const visibleStatuses = hideEmptyColumns
    ? ISSUE_STATUSES.filter((status) => columns[status].length > 0)
    : ISSUE_STATUSES;

  function handleDragEnd({ source, destination, draggableId }: DropResult) {
    if (!destination || !isIssueStatus(source.droppableId) || !isIssueStatus(destination.droppableId)) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const move: BoardMove = {
      issueId: draggableId,
      from: { status: source.droppableId, index: source.index },
      to: { status: destination.droppableId, index: destination.index },
    };
    const { beforeId, afterId } = neighborsAfterMove(optimisticColumns, move);

    startTransition(async () => {
      applyMove(move);
      const result = await moveIssue({ issueId: move.issueId, toStatus: move.to.status, beforeId, afterId });
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex min-w-max items-start gap-3">
        {visibleStatuses.map((status) => (
          <BoardColumn key={status} status={status} issues={optimisticColumns[status]} />
        ))}
      </div>
    </DragDropContext>
  );
}
