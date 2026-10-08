import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { IssuePriority, IssueStatus, IssueType } from "../src/generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const POSITION_STEP = 1024;
const FIRST_ISSUE_NUMBER = 101;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms);

// ---------------------------------------------------------------------------
// Users

type UserRef = "alex" | "priya" | "marcus" | "sofia" | "jordan" | "emma";

const USERS: Record<UserRef, { name: string; email: string }> = {
  alex: { name: "Alex Morgan", email: "alex.morgan@devflow.dev" },
  priya: { name: "Priya Patel", email: "priya.patel@devflow.dev" },
  marcus: { name: "Marcus Chen", email: "marcus.chen@devflow.dev" },
  sofia: { name: "Sofia Rossi", email: "sofia.rossi@devflow.dev" },
  jordan: { name: "Jordan Lee", email: "jordan.lee@devflow.dev" },
  emma: { name: "Emma Novak", email: "emma.novak@devflow.dev" },
};

const avatarUrl = (name: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

// ---------------------------------------------------------------------------
// Issues — declared parents-first; numbers follow array order (DEV-101, …).

type SeedIssue = {
  ref: string;
  type: IssueType;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  reporter: UserRef;
  assignee: UserRef | null;
  points: number | null;
  parent?: string;
  createdDaysAgo: number;
  description?: string;
};

const ISSUES: SeedIssue[] = [
  {
    ref: "auth-epic",
    type: "EPIC",
    title: "Authentication overhaul",
    status: "IN_PROGRESS",
    priority: "HIGH",
    reporter: "alex",
    assignee: "alex",
    points: null,
    createdDaysAgo: 40,
    description: `## Goal
Replace the legacy session system with a modern, secure authentication stack.

## Scope
- Single sign-on with Google Workspace
- Passwordless magic links
- Redis-backed sessions

## Success metrics
- Login success rate **> 99%**
- Median login time under **2 seconds**`,
  },
  {
    ref: "perf-epic",
    type: "EPIC",
    title: "Board performance & real-time updates",
    status: "TODO",
    priority: "MEDIUM",
    reporter: "marcus",
    assignee: "marcus",
    points: null,
    createdDaysAgo: 35,
    description: `Large boards (500+ cards) feel sluggish. This epic covers rendering performance, query tuning and live collaboration features.`,
  },
  {
    ref: "mobile-epic",
    type: "EPIC",
    title: "Mobile experience",
    status: "BACKLOG",
    priority: "LOW",
    reporter: "sofia",
    assignee: "sofia",
    points: null,
    createdDaysAgo: 30,
    description: `Make DevFlow comfortable to use on phones and tablets.\n\n> Roughly 18% of sessions come from mobile devices.`,
  },
  {
    ref: "sso",
    type: "STORY",
    title: "SSO login with Google Workspace",
    status: "IN_PROGRESS",
    priority: "HIGH",
    reporter: "alex",
    assignee: "priya",
    points: 8,
    parent: "auth-epic",
    createdDaysAgo: 21,
    description: `**As a** workspace admin
**I want** my team to sign in with their Google accounts
**so that** we don't manage separate passwords.

### Acceptance criteria
- [x] "Continue with Google" button on the login page
- [ ] Users from unapproved domains are rejected
- [ ] First login provisions a DevFlow account`,
  },
  {
    ref: "magic-link",
    type: "STORY",
    title: "Password reset via magic link",
    status: "DONE",
    priority: "MEDIUM",
    reporter: "priya",
    assignee: "alex",
    points: 5,
    parent: "auth-epic",
    createdDaysAgo: 28,
    description: `Send a single-use link that expires after **15 minutes**. Links are invalidated once used.`,
  },
  {
    ref: "redis-sessions",
    type: "TASK",
    title: "Migrate session storage to Redis",
    status: "IN_REVIEW",
    priority: "HIGH",
    reporter: "marcus",
    assignee: "marcus",
    points: 3,
    parent: "auth-epic",
    createdDaysAgo: 14,
    description: `Move sessions out of Postgres.

\`\`\`ts
const store = new RedisStore({ client: redis, prefix: "sess:" });
\`\`\`

Remember to set a TTL that matches the cookie max-age.`,
  },
  {
    ref: "2fa-bug",
    type: "BUG",
    title: "Login form loses state after failed 2FA attempt",
    status: "TODO",
    priority: "CRITICAL",
    reporter: "jordan",
    assignee: "jordan",
    points: 2,
    parent: "auth-epic",
    createdDaysAgo: 3,
    description: `### Steps to reproduce
1. Enter email and password
2. Enter a wrong 2FA code
3. Observe the email field is now empty

### Expected
The email stays filled in and only the code field is cleared.`,
  },
  {
    ref: "virtualize",
    type: "STORY",
    title: "Virtualize long Kanban columns",
    status: "TODO",
    priority: "MEDIUM",
    reporter: "marcus",
    assignee: "marcus",
    points: 8,
    parent: "perf-epic",
    createdDaysAgo: 12,
    description: `Only render cards that are visible in the viewport. Drag-and-drop must keep working across virtualized lists.`,
  },
  {
    ref: "indexes",
    type: "TASK",
    title: "Add database indexes for board queries",
    status: "DONE",
    priority: "HIGH",
    reporter: "emma",
    assignee: "emma",
    points: 2,
    parent: "perf-epic",
    createdDaysAgo: 20,
    description: `Composite index on \`(projectId, status, position)\` brought the board query from **180 ms** to **6 ms**.`,
  },
  {
    ref: "snap-bug",
    type: "BUG",
    title: "Dragging a card quickly causes it to snap back",
    status: "IN_PROGRESS",
    priority: "HIGH",
    reporter: "sofia",
    assignee: "sofia",
    points: 3,
    parent: "perf-epic",
    createdDaysAgo: 5,
    description: `When a card is dropped within ~200 ms of the previous drop, it briefly returns to its original column before moving again.`,
  },
  {
    ref: "presence",
    type: "STORY",
    title: "Live presence avatars on the board",
    status: "BACKLOG",
    priority: "LOW",
    reporter: "alex",
    assignee: null,
    points: 13,
    parent: "perf-epic",
    createdDaysAgo: 18,
    description: `Show who else is looking at the board, Figma-style.`,
  },
  {
    ref: "responsive-drawer",
    type: "STORY",
    title: "Responsive issue drawer for small screens",
    status: "BACKLOG",
    priority: "MEDIUM",
    reporter: "sofia",
    assignee: "sofia",
    points: 5,
    parent: "mobile-epic",
    createdDaysAgo: 16,
  },
  {
    ref: "touch-audit",
    type: "TASK",
    title: "Audit touch targets against WCAG 2.2",
    status: "BACKLOG",
    priority: "LOW",
    reporter: "emma",
    assignee: null,
    points: null,
    parent: "mobile-epic",
    createdDaysAgo: 15,
    description: `Every interactive element needs a target of at least **24×24 CSS px**.`,
  },
  {
    ref: "ipad-bug",
    type: "BUG",
    title: "Sidebar overlaps content on iPad landscape",
    status: "TODO",
    priority: "MEDIUM",
    reporter: "jordan",
    assignee: "jordan",
    points: 1,
    parent: "mobile-epic",
    createdDaysAgo: 6,
  },
  {
    ref: "sentry",
    type: "TASK",
    title: "Set up error monitoring with Sentry",
    status: "IN_REVIEW",
    priority: "MEDIUM",
    reporter: "priya",
    assignee: "priya",
    points: 2,
    createdDaysAgo: 9,
    description: `Capture server action failures and client errors. Scrub emails from breadcrumbs.`,
  },
  {
    ref: "codeblock-bug",
    type: "BUG",
    title: "Markdown code blocks overflow comment container",
    status: "DONE",
    priority: "LOW",
    reporter: "emma",
    assignee: "emma",
    points: 1,
    createdDaysAgo: 11,
  },
  {
    ref: "shortcuts",
    type: "STORY",
    title: "Keyboard shortcuts for common board actions",
    status: "TODO",
    priority: "MEDIUM",
    reporter: "alex",
    assignee: "alex",
    points: 5,
    createdDaysAgo: 8,
    description: `| Shortcut | Action |
| --- | --- |
| \`c\` | Create issue |
| \`/\` | Focus search |
| \`j\` / \`k\` | Next / previous card |`,
  },
  {
    ref: "next-upgrade",
    type: "TASK",
    title: "Upgrade to Next.js 16",
    status: "DONE",
    priority: "MEDIUM",
    reporter: "marcus",
    assignee: "marcus",
    points: 3,
    createdDaysAgo: 25,
  },
  {
    ref: "archived-bug",
    type: "BUG",
    title: "Search returns archived projects",
    status: "BACKLOG",
    priority: "MEDIUM",
    reporter: "jordan",
    assignee: null,
    points: 2,
    createdDaysAgo: 4,
  },
  {
    ref: "oauth-consent",
    type: "SUBTASK",
    title: "Configure OAuth consent screen",
    status: "DONE",
    priority: "MEDIUM",
    reporter: "priya",
    assignee: "priya",
    points: 1,
    parent: "sso",
    createdDaysAgo: 19,
  },
  {
    ref: "group-mapping",
    type: "SUBTASK",
    title: "Map Google groups to DevFlow roles",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    reporter: "priya",
    assignee: "priya",
    points: 2,
    parent: "sso",
    createdDaysAgo: 10,
  },
  {
    ref: "sso-tests",
    type: "SUBTASK",
    title: "Write SSO integration tests",
    status: "TODO",
    priority: "LOW",
    reporter: "alex",
    assignee: "jordan",
    points: 2,
    parent: "sso",
    createdDaysAgo: 7,
  },
  {
    ref: "render-benchmark",
    type: "SUBTASK",
    title: "Measure render time with 500 cards",
    status: "IN_REVIEW",
    priority: "MEDIUM",
    reporter: "marcus",
    assignee: "marcus",
    points: 1,
    parent: "virtualize",
    createdDaysAgo: 6,
  },
  {
    ref: "rate-limits",
    type: "TASK",
    title: "Document API rate limits",
    status: "IN_PROGRESS",
    priority: "LOW",
    reporter: "emma",
    assignee: "emma",
    points: 2,
    createdDaysAgo: 2,
  },
];

// ---------------------------------------------------------------------------
// Comments

type SeedComment = { issue: string; author: UserRef; hoursAgo: number; content: string };

const COMMENTS: SeedComment[] = [
  { issue: "auth-epic", author: "priya", hoursAgo: 200, content: "Kicked off the SSO spike — Google's OIDC flow looks straightforward." },
  { issue: "auth-epic", author: "alex", hoursAgo: 120, content: "Great. Let's aim to have SSO behind a feature flag by the end of the sprint." },
  { issue: "sso", author: "alex", hoursAgo: 72, content: "Do we need to support multiple Google domains per workspace?" },
  { issue: "sso", author: "priya", hoursAgo: 70, content: "Not for v1. I'll add an `allowedDomains` array so it's easy to extend later." },
  { issue: "sso", author: "jordan", hoursAgo: 20, content: "I can pick up the integration tests once the callback route lands." },
  { issue: "redis-sessions", author: "emma", hoursAgo: 30, content: "Left a review: we should set `maxRetriesPerRequest` so a Redis outage doesn't hang requests." },
  { issue: "redis-sessions", author: "marcus", hoursAgo: 26, content: "Good catch, fixed in the latest push." },
  { issue: "2fa-bug", author: "sofia", hoursAgo: 50, content: "Reproduced on Safari and Firefox. Looks like the form remounts on error." },
  { issue: "2fa-bug", author: "jordan", hoursAgo: 8, content: "Root cause: the error boundary resets the whole form. Moving it one level down." },
  { issue: "snap-bug", author: "marcus", hoursAgo: 40, content: "This is probably the optimistic update racing with the revalidation." },
  { issue: "snap-bug", author: "sofia", hoursAgo: 12, content: "Confirmed — wrapping the move in a single transition fixes it locally." },
  { issue: "indexes", author: "marcus", hoursAgo: 300, content: "🚀 Board loads noticeably faster on the staging dataset." },
  { issue: "virtualize", author: "alex", hoursAgo: 90, content: "Let's benchmark before committing to a library. The subtask covers that." },
  { issue: "presence", author: "emma", hoursAgo: 150, content: "Parking this until real-time infra is decided." },
  { issue: "sentry", author: "alex", hoursAgo: 15, content: "Please make sure we don't send source maps publicly." },
  { issue: "sentry", author: "priya", hoursAgo: 6, content: "They're uploaded with the auth token and deleted from the build output." },
  { issue: "shortcuts", author: "jordan", hoursAgo: 60, content: "Can we also add `?` to show a shortcuts cheat sheet?" },
  { issue: "codeblock-bug", author: "emma", hoursAgo: 260, content: "Fixed by adding `overflow-x-auto` to `pre` blocks." },
  { issue: "ipad-bug", author: "sofia", hoursAgo: 30, content: "Happens at exactly 1024px — the breakpoint is off by one." },
  { issue: "rate-limits", author: "marcus", hoursAgo: 4, content: "Include the `Retry-After` header in the examples, please." },
];

// ---------------------------------------------------------------------------

async function main() {
  // Children first; issue self-references are SET NULL so order within issues doesn't matter.
  await prisma.comment.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const userIds = {} as Record<UserRef, string>;
  for (const [index, [ref, user]] of (Object.entries(USERS) as [UserRef, (typeof USERS)[UserRef]][]).entries()) {
    const created = await prisma.user.create({
      data: { ...user, avatarUrl: avatarUrl(user.name), createdAt: ago((60 - index) * DAY) },
    });
    userIds[ref] = created.id;
  }

  const project = await prisma.project.create({
    data: {
      key: "DEV",
      name: "DevFlow Platform",
      description:
        "The core DevFlow web application: boards, backlog, issue tracking and collaboration features.",
      issueCounter: FIRST_ISSUE_NUMBER - 1 + ISSUES.length,
    },
  });

  const issueIds = new Map<string, string>();
  const columnSizes = new Map<IssueStatus, number>();

  for (const [index, issue] of ISSUES.entries()) {
    const number = FIRST_ISSUE_NUMBER + index;
    const slot = (columnSizes.get(issue.status) ?? 0) + 1;
    columnSizes.set(issue.status, slot);

    const parentId = issue.parent ? issueIds.get(issue.parent) : undefined;
    if (issue.parent && !parentId) {
      throw new Error(`Seed issue "${issue.ref}" references parent "${issue.parent}" before it is declared.`);
    }

    const created = await prisma.issue.create({
      data: {
        projectId: project.id,
        number,
        key: `${project.key}-${number}`,
        title: issue.title,
        description: issue.description ?? null,
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        storyPoints: issue.points,
        position: slot * POSITION_STEP,
        reporterId: userIds[issue.reporter],
        assigneeId: issue.assignee ? userIds[issue.assignee] : null,
        parentId: parentId ?? null,
        createdAt: ago(issue.createdDaysAgo * DAY),
      },
    });
    issueIds.set(issue.ref, created.id);
  }

  for (const comment of COMMENTS) {
    const issueId = issueIds.get(comment.issue);
    if (!issueId) throw new Error(`Seed comment references unknown issue "${comment.issue}".`);
    await prisma.comment.create({
      data: {
        issueId,
        authorId: userIds[comment.author],
        content: comment.content,
        createdAt: ago(comment.hoursAgo * HOUR),
      },
    });
  }

  console.log(
    `Seeded ${Object.keys(USERS).length} users, project ${project.key}, ${ISSUES.length} issues and ${COMMENTS.length} comments.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
