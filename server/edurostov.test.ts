import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

function makeUser(role: "user" | "admin" | "editor" | "representative" = "user") {
  return {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } as const;
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user when authenticated", async () => {
    const user = makeUser();
    const caller = appRouter.createCaller(makeCtx({ user }));
    const result = await caller.auth.me();
    expect(result).toMatchObject({ id: 1, email: "test@example.com" });
  });

  it("logout clears cookie and returns success", async () => {
    const ctx = makeCtx({ user: makeUser() });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});

// ─── Role-Based Access Tests ──────────────────────────────────────────────────

describe("role-based access", () => {
  it("institutions.create throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.institutions.create({
        name: "Test University",
        city: "Ростов-на-Дону",
        type: "university",
        slug: "test-university",
      })
    ).rejects.toThrow();
  });

  it("institutions.create throws FORBIDDEN for regular user", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: makeUser("user") }));
    await expect(
      caller.institutions.create({
        name: "Test University",
        city: "Ростов-на-Дону",
        type: "university",
        slug: "test-university",
      })
    ).rejects.toThrow();
  });

  it("admin.stats throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("admin.stats throws FORBIDDEN for regular user", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: makeUser("user") }));
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("users.updateRole throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: makeUser("editor") }));
    await expect(
      caller.users.updateRole({ userId: 2, role: "admin" })
    ).rejects.toThrow();
  });
});

// ─── Input Validation Tests ───────────────────────────────────────────────────

describe("input validation", () => {
  it("contacts.send rejects invalid email", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.contacts.send({
        name: "Test",
        email: "not-an-email",
        message: "Hello world, this is a test message",
      })
    ).rejects.toThrow();
  });

  it("contacts.send rejects too-short message", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.contacts.send({
        name: "Test",
        email: "test@example.com",
        message: "short",
      })
    ).rejects.toThrow();
  });

  it("reviews.create rejects rating out of range", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: makeUser() }));
    await expect(
      caller.reviews.create({ institutionId: 1, rating: 6 })
    ).rejects.toThrow();
  });

  it("reviews.create rejects rating below minimum", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: makeUser() }));
    await expect(
      caller.reviews.create({ institutionId: 1, rating: 0 })
    ).rejects.toThrow();
  });
});

// ─── Public Procedures Tests ──────────────────────────────────────────────────

describe("public procedures", () => {
  it("institutions.getCities returns an array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.institutions.getCities();
    expect(Array.isArray(result)).toBe(true);
  });

  it("institutions.getTop returns array with limit", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.institutions.getTop({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("institutions.list returns paginated result", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.institutions.list({ page: 1, limit: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("news.list returns paginated result", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.news.list({ page: 1, limit: 10 });
    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
  });
});
