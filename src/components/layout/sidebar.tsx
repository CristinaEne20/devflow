"use client";

import { ListTodo, Settings, SquareKanban, Workflow } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ProjectSummary } from "@/lib/queries/projects";
import { projectUrl, type ProjectSection } from "@/lib/urls";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { section: ProjectSection; label: string; icon: typeof SquareKanban }[] = [
  { section: "board", label: "Board", icon: SquareKanban },
  { section: "backlog", label: "Backlog", icon: ListTodo },
  { section: "settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  project: { key: string; name: string } | null;
  projects: ProjectSummary[];
};

const itemClass =
  "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";

export function Sidebar({ project, projects }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-14 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:w-60">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-3.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
          <Workflow aria-hidden className="size-4" />
        </div>
        <span className="hidden text-[15px] font-semibold tracking-tight md:inline">DevFlow</span>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto p-2">
        {project && (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-bold text-white">
                {project.key.slice(0, 3)}
              </div>
              <div className="hidden min-w-0 md:block">
                <p className="truncate text-sm font-semibold">{project.name}</p>
                <p className="text-xs text-muted-foreground">Software project</p>
              </div>
            </div>
            <ul className="space-y-0.5">
              {NAV_ITEMS.map(({ section, label, icon: Icon }) => {
                const href = projectUrl(project.key, section);
                const isActive = pathname === href;
                return (
                  <li key={section}>
                    <Link
                      href={href}
                      title={label}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        itemClass,
                        isActive && "bg-sidebar-accent text-sidebar-primary hover:text-sidebar-primary",
                      )}
                    >
                      <Icon aria-hidden className="size-4 shrink-0" />
                      <span className="hidden md:inline">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="space-y-1">
          <p className="hidden px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:block">
            Projects
          </p>
          <ul className="space-y-0.5">
            {projects.map((item) => (
              <li key={item.id}>
                <Link
                  href={projectUrl(item.key, "board")}
                  title={item.name}
                  className={cn(itemClass, item.key === project?.key && "text-sidebar-accent-foreground")}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted font-mono text-[9px] font-semibold">
                    {item.key.slice(0, 2)}
                  </span>
                  <span className="hidden truncate md:inline">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
