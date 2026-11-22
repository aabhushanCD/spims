import { describe, expect, it, vi } from "vitest";

vi.mock("../../../app/container.ts", () => ({
  userController: new Proxy({}, { get: () => () => undefined }),
}));

import router from "./user.route.ts";

function routePaths() {
  const stack = (
    router as unknown as {
      stack: Array<{ route?: { path?: string } }>;
    }
  ).stack;

  return stack.flatMap((layer) =>
    layer.route?.path ? [layer.route.path] : [],
  );
}

describe("user routes", () => {
  it("registers static user routes before GET /:id", () => {
    const paths = routePaths();

    expect(paths.indexOf("/active")).toBeGreaterThanOrEqual(0);
    expect(paths.indexOf("/active")).toBeLessThan(paths.indexOf("/:id"));
    expect(paths.indexOf("/inactive")).toBeLessThan(paths.indexOf("/:id"));
  });

  it("keeps only one status route", () => {
    const statusRoutes = routePaths().filter(
      (path) => path === "/status/:isActive/last-login/:date",
    );

    expect(statusRoutes).toHaveLength(1);
  });

  it("removes the misleading /:id/inactive route", () => {
    expect(routePaths()).not.toContain("/:id/inactive");
  });

  it("exposes the role-change route used by the client", () => {
    expect(routePaths()).toContain("/:id/role");
  });

  it("exposes owner-triggered reset and force-logout routes", () => {
    expect(routePaths()).toContain("/:id/reset-password");
    expect(routePaths()).toContain("/:id/force-logout");
  });
});
