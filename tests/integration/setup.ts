import { afterAll, vi } from "vitest";

// Server Actions call next/headers and next/cache, which need a Next.js request
// context. Replace them with in-memory fakes.
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("./cookie-jar");
  return {
    cookies: async () => ({
      get: (name: string) => {
        const value = cookieJar.get(name);
        return value === undefined ? undefined : { name, value };
      },
      set: (name: string, value: string) => {
        cookieJar.set(name, value);
      },
      delete: (name: string) => {
        cookieJar.delete(name);
      },
    }),
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

afterAll(async () => {
  const { db } = await import("@/lib/db");
  await db.$disconnect();
});
