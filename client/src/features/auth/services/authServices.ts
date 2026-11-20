import { authApi } from "../api/authApi";
import type {
  LogoutAllResponse,
  RevokeSessionResponse,
} from "../api/authApi";
import type { LoginFormData } from "../schema/login.schema";
import type { SignupFormData } from "../schema/signup.schema";
import type { SessionSummary } from "../types/session.types";

const loginService = async (data: LoginFormData) => {
  const response = await authApi.login(data);
  return response.data;
};

const registerService = async (data: SignupFormData) => {
  const response = await authApi.register(data);
  return response.data;
};

const logoutService = async () => {
  const response = await authApi.logout();
  return response.data;
};

const refreshService = async () => {
  const response = await authApi.refresh();
  return response.data;
};

const getCurrentUserService = async () => {
  const response = await authApi.getCurrentUser();
  return response.data;
};

const verifyEmailService = async (token: string) => {
  const response = await authApi.verifyEmail(token);
  return response.data;
};

const resendVerificationService = async (email: string) => {
  const response = await authApi.resendVerification(email);
  return response.data;
};

const forgotPasswordService = async (email: string) => {
  const response = await authApi.forgotPassword(email);
  return response.data;
};

const resetPasswordService = async (data: {
  token: string;
  password: string;
}) => {
  const response = await authApi.resetPassword(data);
  return response.data;
};

const logoutAllService = async (): Promise<LogoutAllResponse> => {
  const response = await authApi.logoutAll();
  return response.data;
};

const getSessionsService = async (): Promise<SessionSummary[]> => {
  const response = await authApi.getSessions();
  return response.data;
};

const revokeSessionService = async (
  sessionId: string,
): Promise<RevokeSessionResponse> => {
  const response = await authApi.revokeSession(sessionId);
  return response.data;
};

const authServices = {
  loginService,
  registerService,
  logoutService,
  refreshService,
  getCurrentUserService,
  verifyEmailService,
  resendVerificationService,
  forgotPasswordService,
  resetPasswordService,
  logoutAllService,
  getSessionsService,
  revokeSessionService,
};

export { authServices };
