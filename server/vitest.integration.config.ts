import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/integration/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 120_000,
    // The first run downloads a MongoDB binary, which can exceed two minutes.
    hookTimeout: 600_000,
    fileParallelism: false,
  },
});
