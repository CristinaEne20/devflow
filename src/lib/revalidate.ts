import { revalidatePath } from "next/cache";

/** Refresh every page under every project (board, backlog, settings) and search results. */
export function revalidateProject() {
  revalidatePath("/projects/[key]", "layout");
  revalidatePath("/search");
}

/** Refresh everything (e.g. project names in the sidebar, current user in the navbar). */
export function revalidateAll() {
  revalidatePath("/", "layout");
}
