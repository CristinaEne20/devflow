import { Skeleton } from "@/components/ui/skeleton";

const ROWS_PER_GROUP = [4, 3, 2, 2, 3];

export default function BacklogLoading() {
  return (
    <div className="h-full overflow-hidden" aria-busy="true" aria-label="Loading">
      <div className="space-y-2 px-6 pt-6 pb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="flex items-center gap-3 px-6 pb-4">
        <Skeleton className="h-8 w-full max-w-60" />
        <div className="flex -space-x-1.5">
          {Array.from({ length: 5 }, (_, avatar) => (
            <Skeleton key={avatar} className="size-7 rounded-full ring-2 ring-background" />
          ))}
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="space-y-6 px-6">
        {ROWS_PER_GROUP.map((rows, group) => (
          <div key={group} className="space-y-2">
            <div className="flex items-center gap-2 px-1 py-1">
              <Skeleton className="size-4" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="divide-y overflow-hidden rounded-lg border bg-card">
              {Array.from({ length: rows }, (_, row) => (
                <div key={row} className="flex items-center gap-3 px-3 py-2">
                  <Skeleton className="size-4" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 flex-1" style={{ maxWidth: `${60 - ((row + group) % 3) * 12}%` }} />
                  <Skeleton className="ml-auto size-4" />
                  <Skeleton className="size-5 rounded-full" />
                  <Skeleton className="size-6 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
