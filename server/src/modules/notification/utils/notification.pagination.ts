import { Types } from "mongoose";
import { AppError } from "../../../shared/error.ts";

export interface PageCursor {
  createdAt: Date;
  id: string;
}

export function encodeCursor(
  createdAt: Date | null | undefined,
  id: string,
): string {
  const date =
    createdAt instanceof Date && !Number.isNaN(createdAt.getTime())
      ? createdAt
      : new Types.ObjectId(id).getTimestamp();
  return Buffer.from(`${date.toISOString()}|${id}`).toString("base64url");
}

export function decodeCursor(raw: string): PageCursor {
  const decoded = Buffer.from(raw, "base64url").toString("utf8");
  const separator = decoded.indexOf("|");
  if (separator === -1) {
    throw AppError.badRequest("Invalid pagination cursor");
  }

  const datePart = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  const createdAt = new Date(datePart);

  if (Number.isNaN(createdAt.getTime()) || !Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("Invalid pagination cursor");
  }

  return { createdAt, id };
}
