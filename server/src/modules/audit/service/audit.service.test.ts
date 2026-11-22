import { describe, expect, it, vi } from "vitest";

import { AuditService, sanitizeAuditMetadata } from "./audit.service.ts";
import type { AuditLogRepo } from "../repo/auditLog.repo.ts";

describe("AuditService", () => {
  it("redacts sensitive metadata and truncates long values", async () => {
    const repo = { create: vi.fn().mockResolvedValue({}), findPage: vi.fn() };
    const service = new AuditService(repo as unknown as AuditLogRepo);

    await service.record({
      action: "AUTH_LOGIN_FAILURE",
      entityType: "User",
      metadata: {
        email: "asha@example.com",
        password: "secret",
        nested: { refreshToken: "token-value" },
        note: "x".repeat(600),
      },
    });

    const payload = repo.create.mock.calls[0]?.[0] as {
      metadata: Record<string, unknown>;
    };

    expect(payload.metadata.email).toBe("asha@example.com");
    expect(payload.metadata.password).toBe("[REDACTED]");
    expect(payload.metadata.nested).toEqual({
      refreshToken: "[REDACTED]",
    });
    expect(String(payload.metadata.note)).toContain("…");
  });

  it("never throws when audit persistence fails", async () => {
    const repo = {
      create: vi.fn().mockRejectedValue(new Error("db down")),
      findPage: vi.fn(),
    };
    const service = new AuditService(repo as unknown as AuditLogRepo);

    await expect(
      service.record({ action: "TEST", entityType: "Test" }),
    ).resolves.toBeUndefined();
  });

  it("returns a cursor page and drops the lookahead row", async () => {
    const rows = [
      {
        _id: "507f1f77bcf86cd799439011",
        action: "A",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        _id: "507f1f77bcf86cd799439012",
        action: "B",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];
    const repo = {
      create: vi.fn(),
      findPage: vi.fn().mockResolvedValue(rows),
    };
    const service = new AuditService(repo as unknown as AuditLogRepo);

    const page = await service.getPage({
      limit: 1,
      action: "AUTH_LOGIN_FAILURE",
    });

    expect(repo.findPage).toHaveBeenCalledWith(
      { action: "AUTH_LOGIN_FAILURE" },
      null,
      2,
    );
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toEqual(expect.any(String));
  });
});

describe("sanitizeAuditMetadata", () => {
  it("returns primitives and handles depth limits", () => {
    expect(sanitizeAuditMetadata(null)).toBeNull();
    expect(sanitizeAuditMetadata(3)).toBe(3);
    expect(
      sanitizeAuditMetadata({ a: { b: { c: { d: { e: 1 } } } } }),
    ).toMatchObject({ a: { b: { c: "[Truncated]" } } });
  });
});
