import { api, rawApi } from "@/api/apiClient";

import type { LoginFormData } from "../schema/login.schema";
import type { SignupFormData } from "../schema/signup.schema";
import type { SessionSummary } from "../types/session.types";

export interface RevokeSessionResponse {
  message: string;
  sessionId: string;
}

export interface LogoutAllResponse {
  message: string;
}

export const authApi = {
  login(data: LoginFormData) {
    return api.post("/auth/login", data);
  },

  register(data: SignupFormData) {
    return api.post("/auth/register", data);
  },

  logout() {
    return api.post("/auth/logout");
  },

  getCurrentUser() {
    return api.get("/auth/me");
  },

  refresh() {
    return rawApi.post("/auth/refresh");
  },

  verifyEmail(token: string) {
    return api.post("/auth/verify-email", { token });
  },

  resendVerification(email: string) {
    return api.post("/auth/resend-verification", { email });
  },

  forgotPassword(email: string) {
    return api.post("/auth/forgot-password", { email });
  },

  resetPassword(data: { token: string; password: string }) {
    return api.post("/auth/reset-password", data);
  },

  logoutAll() {
    return api.post<LogoutAllResponse>("/auth/logout-all");
  },

  getSessions() {
    return api.get<SessionSummary[]>("/auth/sessions");
  },

  revokeSession(sessionId: string) {
    return api.delete<RevokeSessionResponse>(
      `/auth/sessions/${sessionId}`,
    );
  },
};
