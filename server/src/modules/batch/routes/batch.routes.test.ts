import { describe, expect, it, vi } from "vitest";

vi.mock("../../../app/container.ts", () => ({
  medicineBatchController: new Proxy({}, { get: () => () => undefined }),
}));

import router from "./batch.routes.ts";

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

describe("batch routes", () => {
  it("does not expose the destructive allocate endpoint", () => {
    expect(routePaths()).not.toContain("/medicine/:medicineId/allocate");
  });

  it("keeps the read-only available-batches endpoint", () => {
    expect(routePaths()).toContain("/medicine/:medicineId/available");
  });
});
