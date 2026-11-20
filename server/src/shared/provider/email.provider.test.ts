import { afterEach, describe, expect, it } from "vitest";

import { assertEmailConfig } from "./email.provider.ts";

describe("assertEmailConfig", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalHost = process.env.SMTP_HOST;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalHost === undefined) {
      delete process.env.SMTP_HOST;
    } else {
      process.env.SMTP_HOST = originalHost;
    }
  });

  it("fails fast in production without SMTP_HOST", () => {
    process.env.NODE_ENV = "production";
    delete process.env.SMTP_HOST;

    expect(() => assertEmailConfig()).toThrow(/SMTP_HOST/);
  });

  it("allows production when SMTP_HOST is configured", () => {
    process.env.NODE_ENV = "production";
    process.env.SMTP_HOST = "smtp.example.com";

    expect(() => assertEmailConfig()).not.toThrow();
  });

  it("allows local development without SMTP_HOST", () => {
    process.env.NODE_ENV = "development";
    delete process.env.SMTP_HOST;

    expect(() => assertEmailConfig()).not.toThrow();
  });
});
