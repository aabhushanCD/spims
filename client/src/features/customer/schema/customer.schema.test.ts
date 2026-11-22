import { describe, expect, it } from "vitest";

import { customerSchema } from "./customer.schema";

describe("customerSchema", () => {
  it("accepts a name with optional blank contact fields", () => {
    expect(
      customerSchema.safeParse({
        name: "Walk-in Customer",
        phone: "",
        email: "",
        address: "",
        isActive: true,
      }).success,
    ).toBe(true);
  });

  it("rejects a blank name", () => {
    expect(customerSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects an invalid phone", () => {
    expect(
      customerSchema.safeParse({ name: "A", phone: "abc" }).success,
    ).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(
      customerSchema.safeParse({ name: "A", email: "not-an-email" }).success,
    ).toBe(false);
  });
});
