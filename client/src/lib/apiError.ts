import axios from "axios";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = asRecord(error.response?.data);
  if (!data) {
    return fallback;
  }

  if (typeof data.message === "string" && data.message.length > 0) {
    return data.message;
  }

  const errors = asRecord(data.errors);
  if (errors) {
    for (const value of Object.values(errors)) {
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  const data = asRecord(error.response?.data);
  return typeof data?.code === "string" ? data.code : undefined;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  return error.response?.status;
}
