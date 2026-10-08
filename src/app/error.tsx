"use client";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="h-dvh">
      <ErrorState
        title="DevFlow couldn't load"
        message={
          process.env.NODE_ENV === "development" ? (
            <>
              Is the database running? Start it with{" "}
              <code className="font-mono text-foreground">docker compose up -d</code> and seed it with{" "}
              <code className="font-mono text-foreground">npx prisma db seed</code>.
            </>
          ) : (
            "An unexpected error occurred. Please try again."
          )
        }
        action={
          <Button size="sm" onClick={reset}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
