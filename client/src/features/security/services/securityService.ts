import { authServices } from "@/features/auth/services/authServices";

/**
 * Thin security-feature adapter over the auth services. All session requests
 * still originate from `features/auth/api/authApi.ts`.
 */
export const securityService = {
  getSessions: authServices.getSessionsService,
  revokeSession: authServices.revokeSessionService,
  logoutAll: authServices.logoutAllService,
};
