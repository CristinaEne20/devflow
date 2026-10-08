import { beforeEach, describe, expect, it } from "vitest";
import { switchCurrentUser } from "@/actions/user-actions";
import { getCurrentUser } from "@/lib/current-user";
import { makeUser, resetDb } from "./helpers";

beforeEach(resetDb);

describe("switchCurrentUser", () => {
  it("stores the chosen user so getCurrentUser returns them", async () => {
    await makeUser("First");
    const second = await makeUser("Second");

    await expect(switchCurrentUser({ userId: second.id })).resolves.toEqual({ ok: true, data: { name: "Second" } });
    await expect(getCurrentUser()).resolves.toMatchObject({ id: second.id });
  });

  it("rejects unknown users", async () => {
    await expect(switchCurrentUser({ userId: "missing" })).resolves.toEqual({ ok: false, error: "User not found" });
  });
});
