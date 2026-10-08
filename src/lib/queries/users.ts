import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export type UserSummary = Prisma.UserGetPayload<{ select: typeof userSummarySelect }>;

export const listUsers = cache(
  async (): Promise<UserSummary[]> => db.user.findMany({ orderBy: { name: "asc" }, select: userSummarySelect }),
);
