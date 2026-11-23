import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    restoreMocks: true,
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/coverage/**",
            "src/**/*.contract.test.ts",
          ],
        },
      },
      {
        test: {
          // Service contract tests exercise axios, which needs the browser
          // adapter (jsdom) to resolve the relative `/api` base URL.
          name: "contract",
          environment: "jsdom",
          include: ["src/**/*.contract.test.ts"],
          setupFiles: ["./src/test/setup.ts"],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/coverage/**",
          ],
        },
      },
      {
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./src/test/setup.ts"],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/coverage/**",
          ],
        },
      },
    ],
  },
});
