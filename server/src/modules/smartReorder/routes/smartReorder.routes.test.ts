import { describe, expect, it, vi } from "vitest";

vi.mock("../../../app/container.ts", () => ({
  smartReorderController: new Proxy({}, { get: () => () => undefined }),
}));

vi.mock("../../../shared/middleware/authorize.ts", () => ({
  authorize: (roles: string[]) => {
    const middleware = (
      _req: unknown,
      _res: unknown,
      next: () => void,
    ) => next();
    return Object.assign(middleware, { __roles: roles });
  },
}));

import router from "./smartReorder.routes.ts";

type Handler = ((...args: never[]) => unknown) & {
  __roles?: string[];
};

function handlersFor(path: string, method: "get" | "patch" | "delete") {
  const stack = (
    router as unknown as {
      stack: Array<{
        route?: {
          path?: string;
          methods?: Record<string, boolean>;
          stack?: Array<{ handle: Handler }>;
        };
      }>;
    }
  ).stack;

  const layer = stack.find(
    (entry) =>
      entry.route?.path === path && entry.route.methods?.[method] === true,
  );
  return layer?.route?.stack?.map((entry) => entry.handle) ?? [];
}

function rolesFor(path: string, method: "get" | "patch" | "delete") {
  return handlersFor(path, method).find((handler) => handler.__roles)
    ?.__roles;
}

describe("smart reorder routes", () => {
  it("restricts approve to owner and inventory manager", () => {
    expect(rolesFor("/:id/approve", "patch")).toEqual([
      "owner",
      "inventory_manager",
    ]);
  });

  it("restricts reject to owner and inventory manager", () => {
    expect(rolesFor("/:id/reject", "patch")).toEqual([
      "owner",
      "inventory_manager",
    ]);
  });

  it("restricts delete to owner", () => {
    expect(rolesFor("/:id", "delete")).toEqual(["owner"]);
  });
});
