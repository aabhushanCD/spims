import { describe, expect, it } from "vitest";

import { resolveNotificationSocketUrl } from "./notificationSocketUrl";

const ORIGIN = "http://localhost:5173";

describe("resolveNotificationSocketUrl", () => {
  it("uses an explicit ws url verbatim", () => {
    expect(
      resolveNotificationSocketUrl({
        wsUrl: "ws://localhost:4000/socket",
        apiBaseUrl: "http://localhost:3000/api",
        origin: ORIGIN,
      }),
    ).toBe("ws://localhost:4000/socket");
  });

  it("normalizes an http(s) explicit ws url to ws(s)", () => {
    expect(
      resolveNotificationSocketUrl({
        wsUrl: "https://example.com/ws",
        origin: ORIGIN,
      }),
    ).toBe("wss://example.com/ws");

    expect(
      resolveNotificationSocketUrl({
        wsUrl: "http://localhost:5173/ws",
        origin: ORIGIN,
      }),
    ).toBe("ws://localhost:5173/ws");
  });

  it("keeps the path of an explicit ws url", () => {
    expect(
      resolveNotificationSocketUrl({
        wsUrl: "wss://example.com/notifications/socket",
        origin: ORIGIN,
      }),
    ).toBe("wss://example.com/notifications/socket");
  });

  it("derives the socket origin from an absolute https api url", () => {
    expect(
      resolveNotificationSocketUrl({
        apiBaseUrl: "https://api.example.com/api",
        origin: ORIGIN,
      }),
    ).toBe("wss://api.example.com/ws");
  });

  it("derives the socket origin from an absolute http api url", () => {
    expect(
      resolveNotificationSocketUrl({
        apiBaseUrl: "http://localhost:3000/api",
        origin: ORIGIN,
      }),
    ).toBe("ws://localhost:3000/ws");
  });

  it("falls back to the page origin for a relative api url", () => {
    expect(
      resolveNotificationSocketUrl({
        apiBaseUrl: "/api",
        origin: ORIGIN,
      }),
    ).toBe("ws://localhost:5173/ws");
  });

  it("falls back to the page origin when nothing is configured", () => {
    expect(resolveNotificationSocketUrl({ origin: ORIGIN })).toBe(
      "ws://localhost:5173/ws",
    );
  });

  it("strips query strings and hashes", () => {
    expect(
      resolveNotificationSocketUrl({
        wsUrl: "ws://localhost:4000/ws?token=abc#fragment",
        origin: ORIGIN,
      }),
    ).toBe("ws://localhost:4000/ws");
  });

  it("does not throw when the origin cannot be parsed", () => {
    expect(
      resolveNotificationSocketUrl({ origin: "example.com" }),
    ).toBe("example.com/ws");
  });
});
