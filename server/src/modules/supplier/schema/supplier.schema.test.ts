import { describe, expect, it } from "vitest";

import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./supplier.schema.ts";

describe("supplier schemas", () => {
  it("normalizes email and trims contact fields", () => {
    const parsed = createSupplierSchema.parse({
      companyName: "  Acme Pharma ",
      contactPerson: "  Asha Sharma ",
      email: "  SALES@ACME.COM ",
      phone: "+977-9800000000",
      address: "  Kathmandu, Nepal ",
      leadTime: 3,
    });

    expect(parsed).toMatchObject({
      companyName: "Acme Pharma",
      contactPerson: "Asha Sharma",
      email: "sales@acme.com",
      address: "Kathmandu, Nepal",
    });
  });

  it("rejects weak contact details", () => {
    expect(() =>
      createSupplierSchema.parse({
        companyName: "A",
        contactPerson: "B",
        email: "not-an-email",
        phone: "123",
        address: "short",
        leadTime: 1,
      }),
    ).toThrow();
  });

  it("allows partial updates", () => {
    expect(updateSupplierSchema.parse({ leadTime: 2 })).toEqual({
      leadTime: 2,
    });
  });
});
