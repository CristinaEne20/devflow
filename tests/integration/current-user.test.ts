import { beforeEach, describe, expect, it } from "vitest";
import { getCurrentUser } from "@/lib/current-user";
import { actAs, makeUser, resetDb } from "./helpers";

beforeEach(resetDb);

describe("getCurrentUser", () => {
  it("defaults to the earliest-created user", async () => {
    const first = await makeUser("First");
    await makeUser("Second");
    await expect(getCurrentUser()).resolves.toMatchObject({ id: first.id });
  });

  it("uses the user from the cookie", async () => {
    await makeUser("First");
    const second = await makeUser("Second");
    actAs(second.id);
    await expect(getCurrentUser()).resolves.toMatchObject({ id: second.id });
  });

  it("falls back to the earliest user when the cookie is stale (e.g. after re-seeding)", async () => {
    const first = await makeUser("First");
    actAs("deleted-user-id");
    await expect(getCurrentUser()).resolves.toMatchObject({ id: first.id });
  });

  it("explains how to fix an empty database", async () => {
    await expect(getCurrentUser()).rejects.toThrow("npx prisma db seed");
  });
});
