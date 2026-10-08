# DevFlow — Design Spec

**Date:** 2026-10-08
**Status:** Draft — awaiting review (refined while writing the implementation plan)

## 1. Purpose & Success Criteria

DevFlow is a Jira-inspired agile project management app. It is a **learning/reference project for the modern Next.js + Prisma stack** and a **portfolio showcase**, so code clarity, idiomatic patterns, and UI polish matter more than feature breadth.

**Success means:**

1. A fresh clone runs with exactly these steps (documented in README): `docker compose up -d` → `npm install` → `npx prisma db push` → `npx prisma db seed` → `npm run dev`, and opens to a populated Kanban board.
2. Every listed feature (board DnD, issue drawer editing, comments, filters, backlog, settings, global search, dark/light mode) works end-to-end against Postgres.
3. Each pattern (RSC reads, Server Actions writes, URL-driven state, optimistic DnD) appears in one clear, canonical place a reader can learn from.
4. `npm run typecheck`, `npm run lint`, and `npm test` pass; no placeholder code.

**Explicit non-goals (v1):** authentication/authorization, sprints, workflows/custom statuses, attachments, notifications, real-time collaboration, WYSIWYG editing, deployment config.

## 2. Validated Assumptions

- No real auth. A "current user" is resolved from a cookie, defaulting to the first seeded user. The avatar menu offers a **"Switch user"** list so the comment/assign flows can be demoed as different people.
- Schema and routes are multi-project (`/projects/[key]/…`); the seed creates one project (`DEV`) and the sidebar lists all projects.
- Backlog = list view of the project's issues grouped by status (no sprints).
- Settings = edit project name and description (key is immutable after creation).
- Descriptions and comments are Markdown stored as `TEXT`, rendered with `react-markdown` + `remark-gfm`; editing uses a textarea with Write/Preview tabs.

## 3. Technology & Versions

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19 | Turbopack dev server |
| Language | TypeScript, `strict: true`, `noUncheckedIndexedAccess: true` | |
| Styling | Tailwind CSS v4 | **CSS-first config**: theme tokens live in `src/app/globals.css` (`@theme`). v4 does not use `tailwind.config.ts`; this is a deliberate deviation from the original brief to follow current conventions. |
| Components | shadcn/ui (Radix primitives), `lucide-react` | Generated into `src/components/ui/` |
| Theme | `next-themes` | `class` strategy, system default, toggle in navbar |
| DnD | `@hello-pangea/dnd` 18 | |
| DB | PostgreSQL 17 via `docker-compose.yml` | Host port 5433 (5432 is taken locally); `pg_trgm` and a `devflow_test` DB created by init SQL |
| ORM | Prisma 7.10 (pinned; `latest` tag is an 8.0 RC) | `prisma.config.ts`, `prisma-client` generator, `@prisma/adapter-pg` driver adapter |
| Validation | `zod` 4 | Shared by forms and Server Actions |
| Toasts | `sonner` (shadcn wrapper) | |
| Markdown | `react-markdown` + `remark-gfm` | |
| Seed runner | `tsx` | |
| Tests | Vitest | Unit + DB integration tests |

## 4. Architecture

### 4.1 Data flow

- **Reads:** Server Components call typed query functions in `src/lib/queries/` (plain async functions using Prisma, marked `import "server-only"`). No API routes.
- **Writes:** Client components call Server Actions in `src/actions/`. Every action: validates input with zod → resolves current user → performs Prisma write → `revalidatePath` for affected project routes → returns an `ActionResult<T>`.
- **UI state lives in the URL** wherever it should be shareable: board filters (`?assignee=…&type=…&q=…`) and the open issue (`?issue=DEV-101`). The page reads `searchParams`, so filtering and drawer content are server-rendered and deep-linkable.
- **Optimistic updates** only where latency is felt: board drag-and-drop (`useOptimistic` + `startTransition`) and new comments. Failure → rollback + error toast.

```ts
// src/lib/action-result.ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
```

### 4.2 Routes

| Route | Type | Purpose |
|---|---|---|
| `/` | Server | Redirects to `/projects/<first project key>/board` (or an empty state if no projects) |
| `/projects/[key]/board` | Server page + client board | Kanban board, filter bar, issue drawer via `?issue=` |
| `/projects/[key]/backlog` | Server | Status-grouped issue list; rows open the drawer via `?issue=` |
| `/projects/[key]/settings` | Server page + client form | Edit project name/description |
| `/search?q=` | Server | Global search results across all projects (key or title match) |

`src/app/projects/[key]/layout.tsx` loads the project (404 via `notFound()` if the key is unknown) and renders the shell (sidebar + navbar). `error.tsx`, `not-found.tsx`, and `loading.tsx` (skeletons) exist at the project segment level.

### 4.3 Directory layout

```
devflow/
├── docker-compose.yml
├── docker/init.sql                 # CREATE EXTENSION IF NOT EXISTS pg_trgm;
├── prisma.config.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env.example                    # DATABASE_URL, TEST_DATABASE_URL
├── src/
│   ├── app/
│   │   ├── layout.tsx              # ThemeProvider, Toaster, fonts
│   │   ├── globals.css             # Tailwind v4 + design tokens (light/dark)
│   │   ├── page.tsx                # redirect
│   │   ├── search/page.tsx
│   │   └── projects/[key]/
│   │       ├── layout.tsx          # AppShell
│   │       ├── error.tsx  not-found.tsx  loading.tsx
│   │       ├── board/page.tsx
│   │       ├── backlog/page.tsx
│   │       └── settings/page.tsx
│   ├── actions/
│   │   ├── issue-actions.ts        # createIssue, updateIssue, moveIssue, deleteIssue
│   │   ├── comment-actions.ts      # addComment, deleteComment
│   │   ├── project-actions.ts      # updateProject
│   │   └── user-actions.ts         # switchCurrentUser
│   ├── hooks/                      # useIssueHref, useOptimisticField
│   ├── lib/
│   │   ├── domain.ts               # client-safe enum arrays + type guards
│   │   ├── board.ts                # column grouping / optimistic move math
│   │   ├── urls.ts  format.ts  forms.ts  revalidate.ts  constants.ts
│   │   ├── db.ts                   # PrismaClient singleton w/ adapter-pg
│   │   ├── current-user.ts         # cookie → User (fallback: first user)
│   │   ├── action-result.ts
│   │   ├── validation.ts           # zod schemas
│   │   ├── filters.ts              # parse/serialize board filter search params
│   │   ├── position.ts             # fractional ordering helpers
│   │   ├── issue-meta.ts           # enum → label/icon/color maps
│   │   ├── utils.ts                # cn()
│   │   └── queries/
│   │       ├── projects.ts  issues.ts  users.ts  search.ts
│   ├── components/
│   │   ├── ui/                     # shadcn generated
│   │   ├── layout/                 # AppShell, Sidebar, Navbar, GlobalSearch, UserMenu, ThemeToggle
│   │   ├── board/                  # Board, BoardColumn, IssueCard, FilterBar, AssigneeFilter, TypeFilter
│   │   ├── issue/                  # IssueDrawerSlot, IssueDrawer, IssueTitleEditor, IssueDescriptionEditor,
│   │   │                           # IssueFieldsPanel, CreateIssueDialog, DeleteIssueButton, fields/*Select
│   │   ├── comments/               # CommentList, CommentItem, CommentForm
│   │   ├── backlog/                # BacklogList, BacklogGroup, BacklogRow
│   │   ├── settings/               # ProjectSettingsForm
│   │   └── shared/                 # UserAvatar, IssueTypeIcon, PriorityIcon, StoryPointsBadge,
│   │                               # Markdown, MarkdownEditor, EmptyState
│   └── generated/prisma/           # Prisma client output (gitignored)
└── tests/
    ├── unit/                       # position, filters, validation, issue-meta
    └── integration/                # server actions against devflow_test DB
```

## 5. Data Model

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum IssueType     { EPIC STORY BUG TASK SUBTASK }
enum IssueStatus   { BACKLOG TODO IN_PROGRESS IN_REVIEW DONE }
enum IssuePriority { LOW MEDIUM HIGH CRITICAL }

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  avatarUrl String?
  createdAt DateTime @default(now())

  reportedIssues Issue[]   @relation("IssueReporter")
  assignedIssues Issue[]   @relation("IssueAssignee")
  comments       Comment[]
}

model Project {
  id           String   @id @default(cuid())
  name         String
  key          String   @unique            // "DEV", uppercase 2–10 chars
  description  String?
  issueCounter Int      @default(0)         // last issued number, bumped atomically
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  issues Issue[]
}

model Issue {
  id          String        @id @default(cuid())
  number      Int                               // 101
  key         String        @unique             // "DEV-101" (denormalized for lookup/search)
  title       String
  description String?                           // Markdown
  status      IssueStatus   @default(BACKLOG)
  priority    IssuePriority @default(MEDIUM)
  type        IssueType     @default(TASK)
  storyPoints Int?
  position    Float                             // order within a status column

  projectId  String
  project    Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  reporterId String
  reporter   User    @relation("IssueReporter", fields: [reporterId], references: [id], onDelete: Restrict)
  assigneeId String?
  assignee   User?   @relation("IssueAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  parentId   String?
  parent     Issue?  @relation("IssueHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children   Issue[] @relation("IssueHierarchy")

  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([projectId, number])
  @@index([projectId, status, position])        // board column queries
  @@index([assigneeId])
  @@index([reporterId])
  @@index([parentId])
  @@index([title(ops: raw("gin_trgm_ops"))], type: Gin)  // ILIKE '%q%' search
}

model Comment {
  id        String   @id @default(cuid())
  content   String                              // Markdown
  issueId   String
  issue     Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([issueId, createdAt])
  @@index([authorId])
}
```

**Design notes:**

- **Delete behavior:** Project → Issues → Comments cascade. Deleting an assignee unassigns (`SetNull`). Deleting a user who reported issues is blocked (`Restrict`) — reporter history matters. Deleting a parent issue orphans children (`SetNull`) rather than silently deleting work.
- **Hierarchy (`parentId`):** added beyond the brief because EPIC and SUBTASK are meaningless without it. Rules enforced in `validation.ts`/actions: a SUBTASK must have a STORY, TASK, or BUG parent; a STORY/TASK/BUG may have an EPIC parent; an EPIC has no parent; parent must be in the same project; an issue cannot be its own parent; changing an issue's type is rejected if its existing children would become invalid. Cards show the parent epic as a small label; the drawer has a "Parent" field and lists children.
- **Issue keys:** `createIssue` runs in a transaction: `UPDATE project SET issueCounter = issueCounter + 1 RETURNING issueCounter` (Prisma `update` with `increment`) → `number`, `key = ${project.key}-${number}`. Seed starts counters so keys begin at `DEV-101`.
- **Ordering (`position`):** fractional indexing with floats. Moving between neighbors A and B sets `position = (A + B) / 2`; to the top `first - 1024`, to bottom `last + 1024`, empty column `1024`. If the gap drops below `1e-6`, the action renumbers the column (`1024, 2048, …`) in the same transaction. Logic lives in pure, unit-tested `lib/position.ts`.
- **Search:** `pg_trgm` GIN index on `title`, created by `docker/init.sql` + `db push`. Queries use Prisma `contains` + `mode: "insensitive"`, which emits `ILIKE` and benefits from the trigram index. Key search matches `key` with `startsWith` (case-insensitive).

## 6. Features

### 6.1 App shell
- **Sidebar (persistent, collapsible to icon rail on small screens):** project switcher (name + key avatar tile), nav links Board / Backlog / Settings with active state, project list.
- **Navbar:** breadcrumb (`Projects / DEV / Board`), global search input (submits to `/search?q=`, `⌘K`/`Ctrl+K` focuses it), "Create" button (opens `CreateIssueDialog`), theme toggle, `UserMenu` (avatar → current user name/email, "Switch user" submenu calling `switchCurrentUser`).

### 6.2 Kanban board
- Five columns in enum order, each with title, issue count, and story-point sum. Columns grow with their content and the board area is the **single** scroll container (both axes) — `@hello-pangea/dnd` does not support nested scroll containers, so `<main>` never scrolls and each page owns its own scroll.
- `Board` (client) receives server-filtered issues grouped by status. `DragDropContext.onDragEnd` computes the new position with `lib/position.ts`, applies an optimistic move, and calls `moveIssue({ issueId, toStatus, beforeId, afterId })`. The server recomputes the position from neighbor IDs (client position is never trusted).
- **DnD while filtered:** neighbors are whatever is visible; inserting between visible neighbors is still a valid global ordering, so DnD stays enabled with filters active.
- `IssueCard`: type icon, key (muted mono), title (2-line clamp), parent epic label (if any), priority icon with tooltip, story points badge, assignee avatar (or dashed "unassigned" circle). Card is a link-like button that sets `?issue=KEY` (keeps existing filter params). Keyboard-accessible DnD comes from `@hello-pangea/dnd`.
- Empty column shows a subtle drop zone hint.

### 6.3 Filter bar (above board)
- **Assignee:** overlapping avatar stack of all users; clicking toggles; selected avatars get a ring. Includes "Unassigned" toggle. Multi-select.
- **Type:** dropdown multi-select (checkbox items with type icons).
- **Text search:** input filtering title (and key) — debounced 300 ms, updates URL with `router.replace` inside `startTransition`.
- "Clear filters" button when any filter is active.
- Params: `assignee=<id>,<id>,unassigned`, `type=BUG,STORY`, `q=text`. Parsing/serializing in `lib/filters.ts` (pure, unit-tested; invalid values ignored).

### 6.4 Issue drawer
- shadcn `Sheet` from the right (~640px, full-width on mobile), opened when `?issue=KEY` is present on board/backlog. The page fetches the issue (with reporter, assignee, parent, children, comments+authors) server-side and passes it to `IssueDrawer`. Closing removes the param. Unknown key → drawer shows "Issue not found".
- **Header:** type icon + key (copy-link button), delete button (confirmation `AlertDialog`).
- **Main column:** inline-editable title (click to edit, Enter/blur saves, Esc cancels); description with view mode (rendered Markdown) and edit mode (`MarkdownEditor`: Write/Preview tabs, Save/Cancel); child issues list; comments.
- **Side column (`IssueSidebarFields`):** Status, Priority, Type, Assignee (select with avatars + "Unassigned"), Reporter (read-only), Story points (number input, 0–100, blank = none), Parent (select of eligible issues), created/updated timestamps.
- Each field change calls `updateIssue({ id, ...patch })` immediately; pending state shown via disabled control + spinner; errors toast and revert.
- **Comments:** newest last; each shows avatar, name, relative time, rendered Markdown; author may delete their own. `CommentForm` uses `MarkdownEditor`, optimistic append, `⌘/Ctrl+Enter` submits.

### 6.5 Create issue
`CreateIssueDialog` (form: title*, type, status default TODO, priority, assignee, story points, parent, description). Uses a `<form action>` with `useActionState`, shows zod field errors inline. On success: closes, toasts "DEV-123 created" with a "View" action that opens the drawer.

### 6.6 Backlog
Server-rendered list grouped by status (collapsible groups with counts and point sums). Rows: type icon, key, title, parent epic label, priority, points, assignee. Click opens the drawer. Same `FilterBar` is reused.

### 6.7 Settings
`ProjectSettingsForm`: name (required, ≤80), description (Markdown, ≤2000), key shown read-only. `useActionState` + toast on save. A "Danger zone" is out of scope.

### 6.8 Global search
`/search?q=` lists matching issues across projects (key prefix or title contains), grouped by project, max 50 results, each linking to `/projects/KEY/board?issue=ISSUE-KEY`. Empty query shows a hint; no results shows `EmptyState`.

## 7. Visual Design

- **Aesthetic:** Linear/Atlassian hybrid — neutral zinc surfaces, 1px borders (`border-border`), very subtle shadows (`shadow-xs` on cards, `shadow-lg` only on overlays), 6–8px radii, generous whitespace, compact 13–14px UI text.
- **Typography:** Inter (via `next/font`) for UI, JetBrains Mono for issue keys.
- **Color tokens** (CSS variables in `globals.css`, light + `.dark`): background, foreground, muted, card, border, primary (indigo-600 / indigo-400), plus semantic issue colors:
  - Types: Epic purple, Story green, Bug red, Task blue, Subtask sky — rendered as small filled rounded-square icons (lucide: `Zap`, `Bookmark`, `Bug`, `CheckSquare`, `GitBranch`).
  - Priority: Low (`ChevronDown`, blue), Medium (`Equal`, amber), High (`ChevronUp`, orange), Critical (`ChevronsUp`, red).
  - Status pills: neutral (Backlog), slate (To Do), blue (In Progress), violet (In Review), green (Done).
- Single source of truth for these mappings: `lib/issue-meta.ts`.
- Motion: 150ms color/opacity transitions; drag lift shadow and slight rotation on dragging card; respects `prefers-reduced-motion`.
- Accessibility: all icons have labels/tooltips, focus rings visible, Radix primitives for dialogs/menus/selects, color never the only signal (icons + text).

## 8. Error Handling

- **Validation:** all action inputs parsed with zod; failures return `{ ok: false, error, fieldErrors }`, never throw to the client.
- **Not found / domain errors:** actions return `ok: false` with a human message (e.g., "Issue not found", "A subtask must have a parent"). Pages use `notFound()` for unknown project keys.
- **Unexpected errors:** actions catch, `console.error` server-side, return a generic message. Route-level `error.tsx` renders a retry card.
- **Client:** every failed mutation shows a `sonner` toast and reverts optimistic state.
- **DB unavailable:** `error.tsx` message hints to run `docker compose up -d` (dev only).

## 9. Seed Data (`prisma/seed.ts`)

Idempotent: deletes all rows (comments → issues → projects → users) then inserts.

- **6 users** with avatars from `https://api.dicebear.com/9.x/notionists/svg?seed=<name>` (remote images via plain `<img>` in `UserAvatar` with initials fallback, so no `next/image` remote config needed).
- **1 project:** `DevFlow Platform`, key `DEV`, with description.
- **~24 issues** numbered from `DEV-101`: 3 epics (e.g., "Authentication overhaul", "Board performance", "Mobile experience"), stories/tasks/bugs linked to epics, 3+ subtasks under stories, ≥4 bugs, every status and priority represented, mixed story points (1/2/3/5/8/13 and some null), some unassigned, realistic Markdown descriptions (headings, lists, code, checkboxes).
- **~20 comments** across issues from varied authors with staggered `createdAt`.
- Positions assigned `1024 * n` per column; `issueCounter` set to last number.

## 10. Testing

- **Unit (Vitest, no DB):** `position.ts` (insert top/middle/bottom/empty, renumber trigger), `filters.ts` (parse/serialize round-trip, invalid input), `validation.ts` (hierarchy rules, story-point bounds, title length), `issue-meta.ts` completeness against enums.
- **Integration (Vitest, real Postgres `devflow_test` DB in the same container):** `createIssue` (key generation, concurrent creates yield unique numbers), `moveIssue` (status + ordering, renumber path), `updateIssue` (hierarchy validation), `addComment`/`deleteComment` (author check), `deleteIssue` (comments cascade, children orphaned). `next/cache` and `next/headers` are mocked. DB reset between tests via `TRUNCATE … CASCADE`.
- **Manual verification** (in plan): run the full README flow from a clean DB and exercise each feature in the browser in light and dark mode.
- Scripts: `test`, `test:unit`, `test:integration`, `typecheck`, `lint`.

## 11. README Contents

Overview, feature list, tech stack, prerequisites (Node ≥ 20.9, Docker), **exact commands**:

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma db push
npx prisma generate
npx prisma db seed
npm run dev
```

plus test commands, project structure overview, architecture notes (RSC/Server Actions/URL state/optimistic DnD/fractional ordering), and a "Resetting the database" section. Exact command list will be verified against Prisma 7 behavior during implementation (Prisma 7 no longer auto-generates on `db push`).

## 12. Implementation Notes

Deviations found while building v1 (full rulings live in the git history / review notes):

- **Next.js 16.4 defaults:** `create-next-app` enables `cacheComponents` + `partialPrefetching`; both are turned off because DevFlow renders every request dynamically (cookies + live data in layouts). The home route calls `connection()` so the first-project redirect is never prerendered at build time.
- **Tailwind via Turbopack loader:** the scaffold uses `@tailwindcss/turbopack` (no `postcss.config.mjs`).
- **shadcn 4.21 (`radix-nova` preset):** components import `cn` from shadcn's `cn` package, `globals.css` keeps `@import "shadcn/tailwind.css"`, and the root layout provides `TooltipProvider` (no longer bundled per tooltip). Sheet width overrides must target `data-[side=right]:` variants.
- **Revalidation:** actions call `revalidatePath("/projects/[key]", "layout")` (route pattern, per the bundled docs) instead of a literal project path.
- **Integration test setup:** runs `prisma db push` without `--accept-data-loss` (Prisma 7 blocks that flag when run by an AI agent).
- **Filters & history:** assignee/type toggles and "Clear" push history entries (Back undoes them); the debounced text search replaces.
- **`typecheck` script:** `next typegen && tsc --noEmit` so Next's generated route types exist on a fresh clone.
