import { api } from "@/api/fetch.api";

import type { LoginFormData } from "../schema/login.schema";
import type { SignupFormData } from "../schema/signup.schema";

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
};
