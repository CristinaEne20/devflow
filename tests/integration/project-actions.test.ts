import { beforeEach, describe, expect, it } from "vitest";
import { updateProject } from "@/actions/project-actions";
import { db } from "@/lib/db";
import { makeProject, resetDb } from "./helpers";

beforeEach(resetDb);

describe("updateProject", () => {
  it("updates name and description but never the key", async () => {
    const project = await makeProject("DEV");
    const result = await updateProject({ projectId: project.id, name: "  Platform  ", description: "## Goals" });
    expect(result).toEqual({ ok: true, data: { key: "DEV" } });
    await expect(db.project.findUniqueOrThrow({ where: { id: project.id } })).resolves.toMatchObject({
      key: "DEV",
      name: "Platform",
      description: "## Goals",
    });
  });

  it("clears a blank description and validates the name", async () => {
    const project = await makeProject("DEV");
    await updateProject({ projectId: project.id, name: "X", description: "  " });
    await expect(db.project.findUniqueOrThrow({ where: { id: project.id } })).resolves.toMatchObject({
      description: null,
    });

    const invalid = await updateProject({ projectId: project.id, name: "", description: null });
    expect(!invalid.ok && invalid.fieldErrors?.name).toEqual(["Project name is required"]);
  });

  it("returns not found for unknown projects", async () => {
    await expect(updateProject({ projectId: "missing", name: "X", description: null })).resolves.toEqual({
      ok: false,
      error: "Project not found",
    });
  });
});
