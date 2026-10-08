"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { projectUrl } from "@/lib/urls";

const SECTION_LABELS: Record<string, string> = { board: "Board", backlog: "Backlog", settings: "Settings" };

export function Breadcrumbs({ project }: { project: { key: string; name: string } | null }) {
  const pathname = usePathname();
  const section = pathname.split("/")[3] ?? "";

  const crumbs = project
    ? [
        { label: "Projects", href: null },
        { label: project.name, href: projectUrl(project.key, "board") },
        { label: SECTION_LABELS[section] ?? "", href: null },
      ]
    : [{ label: "Search", href: null }];

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-sm lg:flex">
      {crumbs
        .filter((crumb) => crumb.label)
        .map((crumb, index, all) => (
          <span key={crumb.label} className="flex min-w-0 items-center gap-1">
            {crumb.href ? (
              <Link href={crumb.href} className="truncate text-muted-foreground hover:text-foreground">
                {crumb.label}
              </Link>
            ) : (
              <span
                className={index === all.length - 1 ? "truncate font-medium" : "truncate text-muted-foreground"}
              >
                {crumb.label}
              </span>
            )}
            {index < all.length - 1 && <ChevronRight aria-hidden className="size-3.5 text-muted-foreground/60" />}
          </span>
        ))}
    </nav>
  );
}
