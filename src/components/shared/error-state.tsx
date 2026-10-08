import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type ErrorStateProps = { title: string; message: ReactNode; action?: ReactNode };

export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <TriangleAlert aria-hidden className="size-4 text-destructive" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-sm font-semibold">{title}</h2>
            <div className="text-sm text-muted-foreground">{message}</div>
          </div>
        </div>
        {action && <div className="mt-4 flex justify-end">{action}</div>}
      </div>
    </div>
  );
}
