import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assertEmailConfig, sendEmail } from "./email.provider.ts";

const ENV_KEYS = [
  "NODE_ENV",
  "EMAIL_PROVIDER",
  "BREVO_API_KEY",
  "EMAIL_FROM",
  "EMAIL_FROM_NAME",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
] as const;

const originalEnv = new Map<string, string | undefined>(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

beforeEach(() => {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("assertEmailConfig", () => {
  it("fails fast in production without a provider", () => {
    process.env.NODE_ENV = "production";

    expect(() => assertEmailConfig()).toThrow(/SMTP_HOST/);
  });

  it("allows production when SMTP_HOST is configured", () => {
    process.env.NODE_ENV = "production";
    process.env.SMTP_HOST = "smtp.example.com";

    expect(() => assertEmailConfig()).not.toThrow();
  });

  it("allows production with the Brevo API configured", () => {
    process.env.NODE_ENV = "production";
    process.env.EMAIL_PROVIDER = "brevo";
    process.env.BREVO_API_KEY = "test-brevo-key";
    process.env.EMAIL_FROM = "sender@example.com";

    expect(() => assertEmailConfig()).not.toThrow();
  });

  it("requires BREVO_API_KEY for the Brevo provider", () => {
    process.env.NODE_ENV = "production";
    process.env.EMAIL_PROVIDER = "brevo";
    process.env.EMAIL_FROM = "sender@example.com";

    expect(() => assertEmailConfig()).toThrow(/BREVO_API_KEY/);
  });

  it("requires a verified sender for the Brevo provider", () => {
    process.env.NODE_ENV = "production";
    process.env.EMAIL_PROVIDER = "brevo";
    process.env.BREVO_API_KEY = "test-brevo-key";

    expect(() => assertEmailConfig()).toThrow(/EMAIL_FROM/);
  });

  it("lets EMAIL_PROVIDER override SMTP auto-detection", () => {
    process.env.NODE_ENV = "production";
    process.env.EMAIL_PROVIDER = "brevo";
    process.env.SMTP_HOST = "smtp.example.com";

    expect(() => assertEmailConfig()).toThrow(/BREVO_API_KEY/);
  });

  it("prefers SMTP_HOST over a Brevo key when EMAIL_PROVIDER is unset", () => {
    process.env.NODE_ENV = "production";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.BREVO_API_KEY = "test-brevo-key";

    expect(() => assertEmailConfig()).not.toThrow();
  });

  it("allows local development without a provider", () => {
    process.env.NODE_ENV = "development";

    expect(() => assertEmailConfig()).not.toThrow();
  });
});

describe("sendEmail with the Brevo API", () => {
  function enableBrevo(): void {
    process.env.EMAIL_PROVIDER = "brevo";
    process.env.BREVO_API_KEY = "test-brevo-key";
    process.env.EMAIL_FROM = "sender@example.com";
    process.env.EMAIL_FROM_NAME = "SPIMS Test";
  }

  it("posts the expected payload to the Brevo API", async () => {
    enableBrevo();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ messageId: "brevo-message-id" }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendEmail({
      to: "recipient@example.com",
      subject: "Verify your email",
      text: "Plain body",
      html: "<p>HTML body</p>",
    });

    expect(result).toEqual({ messageId: "brevo-message-id" });
    expect(fetchMock).toHaveBeenCalledOnce();

    const call = fetchMock.mock.calls.at(0);
    expect(call).toBeDefined();
    if (!call) {
      throw new Error("fetch was not called");
    }

    const [url, init] = call;
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("api-key")).toBe("test-brevo-key");
    expect(new Headers(init?.headers).get("content-type")).toBe(
      "application/json",
    );

    expect(JSON.parse(String(init?.body))).toEqual({
      sender: { name: "SPIMS Test", email: "sender@example.com" },
      to: [{ email: "recipient@example.com" }],
      subject: "Verify your email",
      textContent: "Plain body",
      htmlContent: "<p>HTML body</p>",
    });
  });

  it("throws a sanitized error when Brevo rejects the request", async () => {
    enableBrevo();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({ code: "unauthorized", message: "Key not found" }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;
    try {
      await sendEmail({
        to: "recipient@example.com",
        subject: "Hello",
        text: "Body",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    const message = (caught as Error).message;
    expect(message).toContain("Brevo email API failed (401)");
    expect(message).toContain("Key not found");
    expect(message).not.toContain("test-brevo-key");
  });
});

describe("sendEmail development fallback", () => {
  it("uses the JSON transport when no provider is configured", async () => {
    const info = await sendEmail({
      to: "recipient@example.com",
      subject: "Hello",
      text: "Body",
    });

    expect(info).toBeDefined();
  });
});
