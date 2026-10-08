"use server";

import { cookies } from "next/headers";
import { DomainError, runAction, type ActionResult } from "@/lib/action-result";
import { CURRENT_USER_COOKIE } from "@/lib/constants";
import { db } from "@/lib/db";
import { revalidateAll } from "@/lib/revalidate";
import { switchUserSchema, type SwitchUserInput } from "@/lib/validation";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function switchCurrentUser(input: SwitchUserInput): Promise<ActionResult<{ name: string }>> {
  return runAction(async () => {
    const { userId } = switchUserSchema.parse(input);
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
    if (!user) throw new DomainError("User not found");

    (await cookies()).set(CURRENT_USER_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });

    revalidateAll();
    return { name: user.name };
  });
}
