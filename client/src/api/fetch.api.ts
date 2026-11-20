import axios, {
  type InternalAxiosRequestConfig,
} from "axios";

import { api } from "./apiClient";
import { authServices } from "@/features/auth/services/authServices";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
];

let refreshPromise: Promise<unknown> | null = null;

function refreshSession(): Promise<unknown> {
  if (!refreshPromise) {
    refreshPromise = authServices.refreshService().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function shouldSkipRefresh(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) =>
    url.includes(endpoint),
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const originalRequest = error.config as
      | RetryableRequestConfig
      | undefined;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshSession();
      return await api(originalRequest);
    } catch (refreshError) {
      // The auth context listens for this event and clears the current user.
      // ProtectedRoute then redirects to /login without a hard reload loop.
      window.dispatchEvent(new Event("auth:session-expired"));
      return Promise.reject(refreshError);
    }
  },
);

export { api };
