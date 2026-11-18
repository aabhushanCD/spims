import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * Backend ESLint configuration (flat config).
 *
 * Uses the non-type-aware `recommended` preset because the server build
 * already performs full type checking (`npm run typecheck`). Type-aware lint
 * rules can be layered on later without changing the CI contract.
 */
export default defineConfig([
  globalIgnores(["dist/**", "coverage/**", "node_modules/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      // `any` exists in the current codebase. Keep it visible as a warning
      // instead of hiding it or blocking all work on a large refactor.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);
