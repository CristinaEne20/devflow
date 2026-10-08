import type { IssueStatus, IssueType } from "@/lib/domain";
import { CURRENT_USER_COOKIE } from "@/lib/constants";
import { db } from "@/lib/db";
import { positionForIndex } from "@/lib/position";
import { cookieJar } from "./cookie-jar";

let sequence = 0;

export function actAs(userId: string) {
  cookieJar.set(CURRENT_USER_COOKIE, userId);
}

export async function resetDb() {
  cookieJar.clear();
  await db.$executeRawUnsafe('TRUNCATE TABLE "Comment", "Issue", "Project", "User" RESTART IDENTITY CASCADE');
}

export async function makeUser(name?: string) {
  sequence += 1;
  return db.user.create({
    data: {
      name: name ?? `User ${sequence}`,
      email: `user${sequence}@test.dev`,
      // Explicit, increasing timestamps keep "earliest user" deterministic.
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, sequence)),
    },
  });
}

export async function makeProject(key = "TST") {
  return db.project.create({ data: { key, name: `${key} project` } });
}

type IssueData = {
  title?: string;
  type?: IssueType;
  status?: IssueStatus;
  position?: number;
  parentId?: string | null;
  assigneeId?: string | null;
};

/** Inserts an issue directly (bypassing actions) so tests control every field. */
export async function makeIssue(project: { id: string; key: string }, reporterId: string, data: IssueData = {}) {
  const { issueCounter } = await db.project.update({
    where: { id: project.id },
    data: { issueCounter: { increment: 1 } },
    select: { issueCounter: true },
  });
  return db.issue.create({
    data: {
      projectId: project.id,
      reporterId,
      number: issueCounter,
      key: `${project.key}-${issueCounter}`,
      title: data.title ?? `Issue ${issueCounter}`,
      type: data.type ?? "TASK",
      status: data.status ?? "TODO",
      position: data.position ?? positionForIndex(issueCounter - 1),
      parentId: data.parentId ?? null,
      assigneeId: data.assigneeId ?? null,
    },
  });
}

/** Issue keys in a column, top to bottom. */
export async function columnKeys(projectId: string, status: IssueStatus) {
  const issues = await db.issue.findMany({
    where: { projectId, status },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { key: true },
  });
  return issues.map((issue) => issue.key);
}
