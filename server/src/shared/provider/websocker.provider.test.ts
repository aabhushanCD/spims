import { describe, expect, it, vi } from "vitest";

import { push, register } from "./websocker.provider.ts";

interface FakeSocket {
  readyState: number;
  OPEN: number;
  send: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
}

function fakeSocket(overrides: Partial<FakeSocket> = {}): FakeSocket {
  return {
    readyState: 1,
    OPEN: 1,
    send: vi.fn(),
    on: vi.fn(),
    ...overrides,
  };
}

describe("push", () => {
  it("returns false when the user has no socket", () => {
    expect(push("no-socket-user", { title: "t", message: "m" })).toBe(false);
  });

  it("sends to an open socket and reports delivery", () => {
    const socket = fakeSocket();
    register("open-user", socket as never);

    const delivered = push("open-user", { title: "Alert", message: "Body" });

    expect(delivered).toBe(true);
    expect(socket.send).toHaveBeenCalledWith(
      JSON.stringify({ title: "Alert", message: "Body" }),
    );
  });

  it("drops closed sockets instead of throwing", () => {
    const socket = fakeSocket({ readyState: 3 });
    register("closed-user", socket as never);

    const delivered = push("closed-user", { title: "Alert", message: "Body" });

    expect(delivered).toBe(false);
    expect(socket.send).not.toHaveBeenCalled();
    // The socket was evicted, so a second push finds nothing.
    expect(push("closed-user", { title: "Alert", message: "Body" })).toBe(false);
  });

  it("swallows send failures and evicts the socket", () => {
    const socket = fakeSocket({
      send: vi.fn(() => {
        throw new Error("socket closed between check and send");
      }),
    });
    register("broken-user", socket as never);

    expect(() =>
      push("broken-user", { title: "Alert", message: "Body" }),
    ).not.toThrow();
    expect(push("broken-user", { title: "Alert", message: "Body" })).toBe(
      false,
    );
  });
});
