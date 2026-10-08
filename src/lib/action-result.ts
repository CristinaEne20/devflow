import { z } from "zod";

/** The return type of every Server Action. Actions never throw to the client. */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export const GENERIC_ERROR = "Something went wrong. Please try again.";

/** An expected, user-facing failure (not found, rule violation, …). */
export class DomainError extends Error {}

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}

export function failFromZod(error: z.ZodError): ActionResult<never> {
  const flat = z.flattenError(error);
  const fieldErrors: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) fieldErrors[key] = messages;
  }
  const message = flat.formErrors[0] ?? Object.values(fieldErrors)[0]?.[0] ?? "Invalid input";
  return fail(message, fieldErrors);
}

/** Runs an action body and maps every outcome onto an ActionResult. */
export async function runAction<T>(body: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await body());
  } catch (error) {
    if (error instanceof DomainError) return fail(error.message);
    if (error instanceof z.ZodError) return failFromZod(error);
    console.error("[action] unexpected error", error);
    return fail(GENERIC_ERROR);
  }
}
