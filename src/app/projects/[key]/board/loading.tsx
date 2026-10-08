import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="h-full overflow-hidden" aria-busy="true" aria-label="Loading">
      <div className="space-y-2 px-6 pt-6 pb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex gap-3 px-6">
        {Array.from({ length: 5 }, (_, column) => (
          <div key={column} className="w-72 shrink-0 space-y-2 rounded-xl border bg-column p-2">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 3 - (column % 2) }, (_, card) => (
              <Skeleton key={card} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
