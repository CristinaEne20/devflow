import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { DomainError, GENERIC_ERROR, runAction } from "@/lib/action-result";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runAction", () => {
  it("wraps the returned value", async () => {
    await expect(runAction(async () => 42)).resolves.toEqual({ ok: true, data: 42 });
  });

  it("returns domain error messages to the client", async () => {
    await expect(
      runAction(async () => {
        throw new DomainError("Issue not found");
      }),
    ).resolves.toEqual({ ok: false, error: "Issue not found" });
  });

  it("returns zod field errors", async () => {
    const schema = z.object({ title: z.string().min(1, "Title is required") });
    const result = await runAction(async () => schema.parse({ title: "" }));
    expect(result).toEqual({
      ok: false,
      error: "Title is required",
      fieldErrors: { title: ["Title is required"] },
    });
  });

  it("hides unexpected errors behind a generic message and logs them", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runAction(async () => {
      throw new Error("connection refused");
    });
    expect(result).toEqual({ ok: false, error: GENERIC_ERROR });
    expect(log).toHaveBeenCalledOnce();
  });
});
