import { describe, expect, it } from "vitest";

import { AppError } from "../../../shared/error.ts";
import { parseOrThrow } from "../../../shared/utils/parseOrThrow.ts";
import { MAX_NOTIFICATION_RECIPIENTS } from "../notification.constants.ts";
import {
  createNotificationSchema,
  forceRetryQuerySchema,
  notificationIdParamSchema,
  paginationQuerySchema,
  preferencesSchema,
  userIdParamSchema,
} from "./notification.schema.ts";

const OBJECT_ID = "507f1f77bcf86cd799439011";

describe("notification schemas", () => {
  describe("createNotificationSchema", () => {
    it("accepts a valid body and strips unknown keys", () => {
      const result = createNotificationSchema.safeParse({
        title: "Alert",
        message: "Body",
        type: "InApp",
        userIds: [OBJECT_ID],
        critical: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          title: "Alert",
          message: "Body",
          type: "InApp",
          userIds: [OBJECT_ID],
        });
      }
    });

    it("rejects an empty title, message, or recipient list", () => {
      expect(
        createNotificationSchema.safeParse({
          title: "",
          message: "Body",
          type: "InApp",
          userIds: [OBJECT_ID],
        }).success,
      ).toBe(false);

      expect(
        createNotificationSchema.safeParse({
          title: "Alert",
          message: "",
          type: "InApp",
          userIds: [OBJECT_ID],
        }).success,
      ).toBe(false);

      expect(
        createNotificationSchema.safeParse({
          title: "Alert",
          message: "Body",
          type: "InApp",
          userIds: [],
        }).success,
      ).toBe(false);
    });

    it("rejects oversized title and message values", () => {
      expect(
        createNotificationSchema.safeParse({
          title: "x".repeat(201),
          message: "Body",
          type: "InApp",
          userIds: [OBJECT_ID],
        }).success,
      ).toBe(false);

      expect(
        createNotificationSchema.safeParse({
          title: "Alert",
          message: "x".repeat(5001),
          type: "InApp",
          userIds: [OBJECT_ID],
        }).success,
      ).toBe(false);
    });

    it("does not enforce the unique-recipient cap before dedupe", () => {
      const userIds = Array.from(
        { length: MAX_NOTIFICATION_RECIPIENTS + 1 },
        () => OBJECT_ID,
      );

      expect(
        createNotificationSchema.safeParse({
          title: "Alert",
          message: "Body",
          type: "InApp",
          userIds,
        }).success,
      ).toBe(true);
    });

    it("rejects an invalid type and malformed ObjectIds", () => {
      expect(
        createNotificationSchema.safeParse({
          title: "Alert",
          message: "Body",
          type: "Push",
          userIds: [OBJECT_ID],
        }).success,
      ).toBe(false);

      expect(
        createNotificationSchema.safeParse({
          title: "Alert",
          message: "Body",
          type: "InApp",
          userIds: ["not-an-object-id"],
        }).success,
      ).toBe(false);
    });
  });

  describe("param schemas", () => {
    it("accepts 24-hex ObjectIds", () => {
      expect(notificationIdParamSchema.safeParse({ id: OBJECT_ID }).success).toBe(
        true,
      );
      expect(userIdParamSchema.safeParse({ userId: OBJECT_ID }).success).toBe(
        true,
      );
    });

    it("rejects malformed ObjectIds", () => {
      expect(notificationIdParamSchema.safeParse({ id: "123" }).success).toBe(
        false,
      );
      expect(userIdParamSchema.safeParse({ userId: "xyz" }).success).toBe(
        false,
      );
    });
  });

  describe("paginationQuerySchema", () => {
    it("defaults the limit to 20 and coerces numeric strings", () => {
      const defaulted = paginationQuerySchema.safeParse({});
      expect(defaulted.success).toBe(true);
      if (defaulted.success) {
        expect(defaulted.data.limit).toBe(20);
      }

      const coerced = paginationQuerySchema.safeParse({ limit: "5" });
      expect(coerced.success).toBe(true);
      if (coerced.success) {
        expect(coerced.data.limit).toBe(5);
      }
    });

    it("rejects limits outside 1..100", () => {
      expect(paginationQuerySchema.safeParse({ limit: "0" }).success).toBe(
        false,
      );
      expect(paginationQuerySchema.safeParse({ limit: "101" }).success).toBe(
        false,
      );
      expect(paginationQuerySchema.safeParse({ limit: "2.5" }).success).toBe(
        false,
      );
    });
  });

  describe("forceRetryQuerySchema", () => {
    it.each([
      ["true", true],
      ["1", true],
      ["false", false],
      ["0", false],
    ])("parses %s as %s", (input, expected) => {
      const result = forceRetryQuerySchema.safeParse({ force: input });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.force).toBe(expected);
      }
    });

    it("treats a missing flag as undefined and rejects other values", () => {
      const missing = forceRetryQuerySchema.safeParse({});
      expect(missing.success).toBe(true);
      if (missing.success) {
        expect(missing.data.force).toBeUndefined();
      }

      expect(forceRetryQuerySchema.safeParse({ force: "yes" }).success).toBe(
        false,
      );
    });
  });

  describe("preferencesSchema", () => {
    it("accepts a partial preference update", () => {
      expect(preferencesSchema.safeParse({ email: false }).success).toBe(true);
      expect(preferencesSchema.safeParse({ sms: true }).success).toBe(true);
    });

    it("requires at least one key and boolean values", () => {
      expect(preferencesSchema.safeParse({}).success).toBe(false);
      expect(preferencesSchema.safeParse({ email: "no" }).success).toBe(false);
    });
  });

  describe("parseOrThrow", () => {
    it("returns parsed data", () => {
      const parsed = parseOrThrow(paginationQuerySchema, { limit: "10" });
      expect(parsed.limit).toBe(10);
    });

    it("throws an AppError 400 with the first issue message", () => {
      expect(() => parseOrThrow(notificationIdParamSchema, { id: "bad" })).toThrow(
        expect.objectContaining({
          statusCode: 400,
          message: "Invalid ObjectId",
        }),
      );
      expect(() => parseOrThrow(notificationIdParamSchema, { id: "bad" })).toThrow(
        AppError,
      );
    });
  });
});
