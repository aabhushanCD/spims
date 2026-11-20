import { authApi } from "@/features/auth/api/authApi";

/**
 * Security is a UI feature, not a separate API surface. These helpers keep the
 * existing security-feature imports stable while routing every request through
 * the auth API module.
 */
export const securityApi = {
  getSessions() {
    return authApi.getSessions();
  },

  revokeSession(sessionId: string) {
    return authApi.revokeSession(sessionId);
  },

  logoutAll() {
    return authApi.logoutAll();
  },
};
