import { z } from "zod";

/**
 * MongoDB ObjectId in its 24-character hexadecimal string form.
 *
 * Route params stay strings on purpose: controllers and repositories already
 * accept the string representation, and this only rejects malformed values
 * before Mongoose can turn them into a CastError.
 */
export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

export const objectIdParamSchema = z.object({ id: objectIdSchema });
