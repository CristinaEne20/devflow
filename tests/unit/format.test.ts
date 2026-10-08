import { describe, expect, it } from "vitest";
import { formatRelativeTime, getInitials } from "@/lib/format";

const NOW = new Date("2026-10-08T12:00:00Z");
const before = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);

describe("formatRelativeTime", () => {
  it("says 'just now' for the last minute", () => {
    expect(formatRelativeTime(before(30), NOW)).toBe("just now");
  });

  it("uses the largest whole unit", () => {
    expect(formatRelativeTime(before(5 * 60), NOW)).toBe("5 minutes ago");
    expect(formatRelativeTime(before(2 * 3600), NOW)).toBe("2 hours ago");
    expect(formatRelativeTime(before(86400), NOW)).toBe("yesterday");
    expect(formatRelativeTime(before(3 * 86400), NOW)).toBe("3 days ago");
  });
});

describe("getInitials", () => {
  it("uses the first letters of the first and last words", () => {
    expect(getInitials("Alex Morgan")).toBe("AM");
    expect(getInitials("  mary  jane watson ")).toBe("MW");
    expect(getInitials("Cher")).toBe("C");
    expect(getInitials("")).toBe("?");
  });
});
