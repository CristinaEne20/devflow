"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

/**
 * Shows `next` immediately while `save` runs. On success the revalidated server
 * value replaces it; on failure a toast is shown and the old value returns.
 */
export function useOptimisticField<T>(serverValue: T, save: (value: T) => Promise<ActionResult<unknown>>) {
  const [value, setOptimisticValue] = useOptimistic(serverValue);
  const [isPending, startTransition] = useTransition();

  function setValue(next: T) {
    startTransition(async () => {
      setOptimisticValue(next);
      const result = await save(next);
      if (!result.ok) toast.error(result.error);
    });
  }

  return [value, setValue, isPending] as const;
}
