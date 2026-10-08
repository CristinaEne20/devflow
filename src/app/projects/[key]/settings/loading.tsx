import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="h-full overflow-hidden" aria-busy="true" aria-label="Loading">
      <div className="space-y-2 px-6 pt-6 pb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="max-w-3xl px-6">
        <div className="space-y-6 rounded-xl border bg-card p-6">
          <div className="grid gap-6 sm:grid-cols-[1fr_160px]">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}
