import { describe, expect, it } from "vitest";
import { boardIssueUrl, projectUrl, toURLSearchParams, withIssueParam } from "@/lib/urls";

describe("withIssueParam", () => {
  it("adds the issue key and keeps other params", () => {
    expect(withIssueParam("type=BUG", "DEV-1")).toBe("?type=BUG&issue=DEV-1");
  });

  it("replaces an existing issue key", () => {
    expect(withIssueParam("issue=DEV-1", "DEV-2")).toBe("?issue=DEV-2");
  });

  it("removes the issue key when null", () => {
    expect(withIssueParam("issue=DEV-1&q=x", null)).toBe("?q=x");
  });

  it("returns an empty string when nothing is left", () => {
    expect(withIssueParam("", null)).toBe("");
  });

  it("accepts a Next.js searchParams record", () => {
    expect(withIssueParam({ type: ["BUG", "TASK"], q: undefined }, "DEV-9")).toBe("?type=BUG&issue=DEV-9");
  });
});

describe("toURLSearchParams", () => {
  it("copies URLSearchParams instead of aliasing them", () => {
    const original = new URLSearchParams("a=1");
    const copy = toURLSearchParams(original);
    copy.set("a", "2");
    expect(original.get("a")).toBe("1");
  });
});

describe("route helpers", () => {
  it("builds project and issue URLs", () => {
    expect(projectUrl("DEV", "backlog")).toBe("/projects/DEV/backlog");
    expect(boardIssueUrl("DEV", "DEV-101")).toBe("/projects/DEV/board?issue=DEV-101");
  });
});
