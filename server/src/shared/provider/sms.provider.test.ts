import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  NonRetryableDeliveryError,
  sendSms,
} from "./sms.provider.ts";

describe("sendSms", () => {
  beforeEach(() => {
    delete process.env.SMS_WEBHOOK_URL;
    delete process.env.SMS_API_KEY;
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    delete process.env.SMS_WEBHOOK_URL;
    delete process.env.SMS_API_KEY;
    vi.unstubAllGlobals();
  });

  it("throws a non-retryable error when the webhook is not configured", async () => {
    await expect(
      sendSms({ to: "+15550001111", message: "Hello" }),
    ).rejects.toBeInstanceOf(NonRetryableDeliveryError);
  });

  it("posts JSON with a bearer token and accepts any 2xx", async () => {
    process.env.SMS_WEBHOOK_URL = "https://sms.example.test/send";
    process.env.SMS_API_KEY = "secret";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    await sendSms({ to: "+15550001111", message: "Hello" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://sms.example.test/send");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({
      "content-type": "application/json",
      authorization: "Bearer secret",
    });
    expect(options.body).toBe(
      JSON.stringify({ to: "+15550001111", message: "Hello" }),
    );
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("omits the authorization header when no API key is set", async () => {
    process.env.SMS_WEBHOOK_URL = "https://sms.example.test/send";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await sendSms({ to: "+15550001111", message: "Hello" });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.headers).toEqual({ "content-type": "application/json" });
  });

  it("throws a retryable error containing the status and body on non-2xx", async () => {
    process.env.SMS_WEBHOOK_URL = "https://sms.example.test/send";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => "bad gateway",
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendSms({ to: "+15550001111", message: "Hello" }),
    ).rejects.toThrow("SMS webhook returned HTTP 502: bad gateway");
  });

  it("wraps network failures in a retryable error", async () => {
    process.env.SMS_WEBHOOK_URL = "https://sms.example.test/send";
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendSms({ to: "+15550001111", message: "Hello" }),
    ).rejects.toThrow("SMS webhook request failed: ECONNREFUSED");
  });
});
