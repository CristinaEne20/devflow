"use client";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export default function ProjectError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="This page failed to load"
      message="Something went wrong while loading project data. Try again in a moment."
      action={
        <Button size="sm" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
