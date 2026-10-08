import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@/generated/prisma/client";
import { CURRENT_USER_COOKIE } from "@/lib/constants";
import { db } from "@/lib/db";

/**
 * DevFlow has no authentication: the visitor "acts as" a seeded user chosen in
 * the user menu (stored in a cookie). Falls back to the earliest user, which
 * also covers stale cookies after the database is re-seeded.
 */
export const getCurrentUser = cache(async (): Promise<User> => {
  const userId = (await cookies()).get(CURRENT_USER_COOKIE)?.value;
  if (userId) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user) return user;
  }

  const fallback = await db.user.findFirst({ orderBy: [{ createdAt: "asc" }, { email: "asc" }] });
  if (!fallback) throw new Error("No users found. Run `npx prisma db seed` to populate the database.");
  return fallback;
});
