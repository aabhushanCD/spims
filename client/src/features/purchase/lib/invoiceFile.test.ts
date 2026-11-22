import { describe, expect, it } from "vitest";

import { INVOICE_MAX_BYTES, validateInvoiceFile } from "./invoiceFile";

describe("validateInvoiceFile", () => {
  it("accepts PDF, PNG, and JPEG", () => {
    expect(
      validateInvoiceFile(new File(["x"], "a.pdf", { type: "application/pdf" })),
    ).toBeNull();
    expect(
      validateInvoiceFile(new File(["x"], "a.png", { type: "image/png" })),
    ).toBeNull();
    expect(
      validateInvoiceFile(new File(["x"], "a.jpg", { type: "image/jpeg" })),
    ).toBeNull();
  });

  it("rejects unsupported types", () => {
    expect(
      validateInvoiceFile(new File(["x"], "a.txt", { type: "text/plain" })),
    ).toMatch(/PDF, PNG, or JPEG/);
  });

  it("rejects files over 5 MB", () => {
    const file = new File(
      [new Uint8Array(INVOICE_MAX_BYTES + 1)],
      "big.pdf",
      { type: "application/pdf" },
    );

    expect(validateInvoiceFile(file)).toMatch(/5 MB/);
  });
});
