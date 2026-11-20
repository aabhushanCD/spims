import type { ZodType } from "zod";
import { AppError } from "../error.ts";

export function parseOrThrow<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const first = result.error.issues[0];
    throw AppError.badRequest(first?.message ?? "Invalid request");
  }
  return result.data;
}
