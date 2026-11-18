import axios from "axios";

interface ApiErrorBody {
  message?: string;
}

/**
 * Extracts the server-provided error message from an unknown thrown value.
 * Keeps callers free of `any` while preserving the existing toast text.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return fallback;
}
