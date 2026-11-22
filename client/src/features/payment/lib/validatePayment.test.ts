import { describe, expect, it } from "vitest";

import { validatePaymentAmount } from "./validatePayment";

describe("validatePaymentAmount", () => {
  it("accepts a partial payment within the amount due", () => {
    expect(validatePaymentAmount(50, 100)).toBeNull();
  });

  it("accepts the full outstanding amount", () => {
    expect(validatePaymentAmount(100, 100)).toBeNull();
  });

  it("rejects zero, negative, and non-finite amounts", () => {
    expect(validatePaymentAmount(0, 100)).toMatch(/greater than zero/);
    expect(validatePaymentAmount(-1, 100)).toMatch(/greater than zero/);
    expect(validatePaymentAmount(Number.NaN, 100)).toMatch(
      /greater than zero/,
    );
  });

  it("rejects overpayment", () => {
    expect(validatePaymentAmount(101, 100)).toMatch(/outstanding amount/);
  });
});
