import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { stripControlChars } from "@/lib/filters";

/** Cached per request so the layout and page share one query. */
export const getProjectByKey = cache(async (key: string) =>
  db.project.findUnique({ where: { key: stripControlChars(key).trim().toUpperCase() } }),
);

export async function listProjects() {
  return db.project.findMany({ orderBy: { name: "asc" }, select: { id: true, key: true, name: true } });
}

export type ProjectSummary = Awaited<ReturnType<typeof listProjects>>[number];

export async function getFirstProject() {
  return db.project.findFirst({ orderBy: { createdAt: "asc" }, select: { key: true } });
}
