export type TemplateData = Record<string, string | number | boolean>;

export function parseTemplateData(text: string): {
  data: TemplateData | null;
  error: string | null;
} {
  if (!text.trim()) {
    return { data: {}, error: null };
  }

  try {
    const parsed: unknown = JSON.parse(text);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {
        data: null,
        error: "Template data must be a JSON object",
      };
    }

    for (const value of Object.values(parsed)) {
      if (
        typeof value !== "string" &&
        typeof value !== "number" &&
        typeof value !== "boolean"
      ) {
        return {
          data: null,
          error: "Template values must be strings, numbers, or booleans",
        };
      }
    }

    return { data: parsed as TemplateData, error: null };
  } catch {
    return { data: null, error: "Template data must be valid JSON" };
  }
}

export function canAdministerNotifications(role?: string | null): boolean {
  return role === "owner" || role === "pharmacist";
}
