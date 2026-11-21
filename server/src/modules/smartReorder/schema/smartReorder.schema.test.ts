import { describe, expect, it } from "vitest";

import {
  smartReorderIdParamSchema,
  smartReorderMedicineParamSchema,
} from "./smartReorder.schema.ts";

const ID = "507f1f77bcf86cd799439011";

describe("smart reorder schemas", () => {
  it("accepts ObjectId params", () => {
    expect(smartReorderIdParamSchema.parse({ id: ID })).toEqual({ id: ID });
    expect(
      smartReorderMedicineParamSchema.parse({ medicineId: ID }),
    ).toEqual({ medicineId: ID });
  });

  it("rejects malformed ids", () => {
    expect(() => smartReorderIdParamSchema.parse({ id: "bad" })).toThrow();
  });
});
