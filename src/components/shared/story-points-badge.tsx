export function StoryPointsBadge({ points }: { points: number | null }) {
  if (points === null) return null;
  return (
    <span
      title={`${points} story point${points === 1 ? "" : "s"}`}
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground"
    >
      {points}
    </span>
  );
}
