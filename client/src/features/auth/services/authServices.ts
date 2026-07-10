import { api } from "@/api/fetch.api";
import { authApi } from "../api/authApi";
import type { LoginFormData } from "../schema/login.schema";
import type { SignupFormData } from "../schema/signup.schema";

const loginService = async (data: LoginFormData) => {
  const response = await authApi.login(data);
  return response.data;
};

const registerService = async (data: SignupFormData) => {
  const response = await authApi.register(data);
  return response.data;
};

const logoutService = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

const getCurrentUserService = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

const authServices = {
  loginService,
  registerService,
  logoutService,
  getCurrentUserService,
};

export { authServices };
