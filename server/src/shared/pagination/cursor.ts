import { Types } from "mongoose";
import { AppError } from "../error.ts";

export interface PageCursor {
  date: Date;
  id: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export function encodeCursor(
  date: Date | string | null | undefined,
  id: string,
): string {
  const parsed = date instanceof Date ? date : new Date(date ?? "");
  const safeDate = Number.isNaN(parsed.getTime())
    ? new Types.ObjectId(id).getTimestamp()
    : parsed;
  return Buffer.from(`${safeDate.toISOString()}|${id}`).toString("base64url");
}

export function decodeCursor(raw: string): PageCursor {
  const decoded = Buffer.from(raw, "base64url").toString("utf8");
  const separator = decoded.indexOf("|");
  if (separator === -1) {
    throw AppError.badRequest("Invalid pagination cursor");
  }

  const datePart = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  const date = new Date(datePart);

  if (Number.isNaN(date.getTime()) || !Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("Invalid pagination cursor");
  }

  return { date, id };
}

export function cursorFilter(
  field: string,
  cursor: PageCursor | null,
): Record<string, unknown> {
  if (!cursor) {
    return {};
  }

  return {
    $or: [
      { [field]: { $lt: cursor.date } },
      {
        [field]: cursor.date,
        _id: { $lt: new Types.ObjectId(cursor.id) },
      },
    ],
  };
}

export function buildPage<T>(
  rows: T[],
  limit: number,
  getDate: (row: T) => Date | string | null | undefined,
  getId: (row: T) => string,
): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  const nextCursor =
    hasMore && last ? encodeCursor(getDate(last), getId(last)) : null;

  return { items, nextCursor };
}
