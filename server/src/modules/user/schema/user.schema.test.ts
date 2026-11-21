import { describe, expect, it } from "vitest";

import {
  changeUserRoleSchema,
  deleteUserBodySchema,
  userIdParamSchema,
  userRoleParamSchema,
  userStatusDateParamSchema,
} from "./user.schema.ts";

const USER_ID = "507f1f77bcf86cd799439011";

describe("user schemas", () => {
  it("accepts a valid ObjectId parameter", () => {
    expect(userIdParamSchema.parse({ id: USER_ID })).toEqual({ id: USER_ID });
  });

  it("rejects a malformed user id", () => {
    expect(() => userIdParamSchema.parse({ id: "not-an-id" })).toThrow();
  });

  it("accepts only known roles", () => {
    expect(userRoleParamSchema.parse({ role: "owner" })).toEqual({
      role: "owner",
    });
    expect(() => userRoleParamSchema.parse({ role: "super-admin" })).toThrow();
  });

  it("accepts only true/false status params", () => {
    expect(
      userStatusDateParamSchema.parse({
        isActive: "false",
        date: "2026-01-15",
      }),
    ).toEqual({ isActive: "false", date: "2026-01-15" });
    expect(() =>
      userStatusDateParamSchema.parse({
        isActive: "yes",
        date: "2026-01-15",
      }),
    ).toThrow();
  });

  it("rejects a date that cannot be parsed", () => {
    expect(() =>
      userStatusDateParamSchema.parse({
        isActive: "true",
        date: "not-a-date",
      }),
    ).toThrow();
  });

  it("rejects a client-supplied role on delete", () => {
    expect(() => deleteUserBodySchema.parse({ role: "owner" })).toThrow();
    expect(deleteUserBodySchema.parse(undefined)).toBeUndefined();
  });

  it("requires an owner role for role changes", () => {
    expect(changeUserRoleSchema.parse({ role: "owner" })).toEqual({
      role: "owner",
    });
  });
});
