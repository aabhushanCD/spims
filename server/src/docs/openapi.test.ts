import { describe, expect, it } from "vitest";

import { swaggerSpec } from "./index.ts";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

interface SpecShape {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, unknown>>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
}

function collectRefs(value: unknown, refs: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectRefs(item, refs);
    }
    return refs;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (key === "$ref" && typeof entry === "string") {
        refs.push(entry);
      } else {
        collectRefs(entry, refs);
      }
    }
  }

  return refs;
}

describe("OpenAPI specification", () => {
  const spec = swaggerSpec as unknown as SpecShape;
  const operations = Object.entries(spec.paths).flatMap(([path, item]) =>
    Object.entries(item)
      .filter(([method]) => HTTP_METHODS.includes(method))
      .map(([method, operation]) => ({ path, method, operation })),
  );

  it("is a usable OpenAPI 3 document", () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info.title).toBe("SPIMS API");
    expect(spec.components.securitySchemes.cookieAuth).toBeDefined();
    expect(spec.paths["/auth/login"]?.post).toBeDefined();
    expect(spec.paths["/audit"]?.get).toBeDefined();
  });

  it("documents every mounted module prefix", () => {
    const expectedPrefixes = [
      "/auth",
      "/config",
      "/users",
      "/audit",
      "/medicines",
      "/units",
      "/categories",
      "/brands",
      "/generic-names",
      "/suppliers",
      "/customers",
      "/purchases",
      "/purchase-returns",
      "/inventory",
      "/sales",
      "/sale-items",
      "/returns",
      "/batches",
      "/smart-reorders",
      "/notifications",
      "/dashboard",
    ];

    for (const prefix of expectedPrefixes) {
      expect(
        Object.keys(spec.paths).some(
          (path) => path === prefix || path.startsWith(`${prefix}/`),
        ),
      ).toBe(true);
    }

    expect(operations.length).toBeGreaterThan(90);
  });

  it("gives every operation a tag, summary, and responses", () => {
    for (const { path, method, operation } of operations) {
      const op = operation as {
        tags?: unknown;
        summary?: unknown;
        responses?: unknown;
      };
      expect(op.tags, `${method.toUpperCase()} ${path}`).toBeTruthy();
      expect(op.summary, `${method.toUpperCase()} ${path}`).toBeTruthy();
      expect(op.responses, `${method.toUpperCase()} ${path}`).toBeTruthy();
    }
  });

  it("resolves every local component reference", () => {
    const refs = collectRefs(spec.paths);
    const missing = refs
      .filter((entry) => entry.startsWith("#/components/schemas/"))
      .map((entry) => entry.replace("#/components/schemas/", ""))
      .filter((name) => !(name in spec.components.schemas));

    expect(missing).toEqual([]);
  });
});
