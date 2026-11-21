import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import {
  buildPage,
  cursorFilter,
  decodeCursor,
  encodeCursor,
} from "./cursor.ts";

const ID = "507f1f77bcf86cd799439011";
const NEXT_ID = "507f1f77bcf86cd799439012";

describe("cursor pagination", () => {
  it("round-trips a cursor", () => {
    const date = new Date("2026-01-02T03:04:05.000Z");
    const cursor = encodeCursor(date, ID);

    expect(decodeCursor(cursor)).toEqual({ date, id: ID });
  });

  it("rejects malformed cursors", () => {
    expect(() => decodeCursor("not-a-cursor")).toThrowError(
      "Invalid pagination cursor",
    );
  });

  it("builds a stable cursor filter", () => {
    const date = new Date("2026-01-02T03:04:05.000Z");
    expect(cursorFilter("createdAt", { date, id: ID })).toEqual({
      $or: [
        { createdAt: { $lt: date } },
        { createdAt: date, _id: { $lt: new Types.ObjectId(ID) } },
      ],
    });
    expect(cursorFilter("createdAt", null)).toEqual({});
  });

  it("returns one extra row as a next cursor and trims the page", () => {
    const rows = [
      { _id: ID, createdAt: new Date("2026-01-02T00:00:00.000Z") },
      { _id: NEXT_ID, createdAt: new Date("2026-01-01T00:00:00.000Z") },
    ];

    const page = buildPage(
      rows,
      1,
      (row) => row.createdAt,
      (row) => row._id,
    );

    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).not.toBeNull();
    expect(decodeCursor(page.nextCursor!)).toEqual({
      date: rows[0]!.createdAt,
      id: ID,
    });
  });
});
