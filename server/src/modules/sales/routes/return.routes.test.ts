import { describe, expect, it } from "vitest";

import type { ReturnController } from "../controller/return.controller.ts";
import { buildReturnRouter } from "./return.routes.ts";

function routePaths() {
  const controller = new Proxy(
    {},
    { get: () => () => undefined },
  ) as ReturnController;
  const router = buildReturnRouter(controller);
  const stack = (
    router as unknown as {
      stack: Array<{ route?: { path?: string } }>;
    }
  ).stack;

  return stack.flatMap((layer) =>
    layer.route?.path ? [layer.route.path] : [],
  );
}

describe("return routes", () => {
  it("exposes the full approval workflow", () => {
    const paths = routePaths();

    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/:id",
        "/:id/approve",
        "/:id/reject",
        "/:id/cancel",
        "/:id/complete",
      ]),
    );
  });

  it("does not expose a destructive DELETE", () => {
    const controller = new Proxy(
      {},
      { get: () => () => undefined },
    ) as ReturnController;
    const router = buildReturnRouter(controller);
    const stack = (
      router as unknown as {
        stack: Array<{ route?: { path?: string; methods?: Record<string, boolean> } }>;
      }
    ).stack;

    const deletes = stack.filter(
      (layer) => layer.route?.methods?.["delete"],
    );
    expect(deletes).toHaveLength(0);
  });
});
