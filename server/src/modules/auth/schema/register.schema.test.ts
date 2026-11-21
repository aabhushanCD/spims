import { describe, expect, it } from "vitest";

import { registerSchema } from "./register.schema.ts";

describe("register schema", () => {
  it("strips a role supplied by a public registrant", () => {
    const parsed = registerSchema.parse({
      name: "Asha Sharma",
      email: "ASHA@example.com",
      password: "password123",
      role: "owner",
    });

    expect(parsed).toEqual({
      name: "Asha Sharma",
      email: "asha@example.com",
      password: "password123",
    });
    expect(parsed).not.toHaveProperty("role");
  });
});
