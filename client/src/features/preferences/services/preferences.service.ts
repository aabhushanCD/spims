import { api } from "@/api/apiClient";
import type { User } from "@/features/auth/context/authContext";

import type { UserPreferences } from "../types/preferences.types";

export type UpdatePreferencesInput = Partial<UserPreferences>;

async function updateMyPreferences(
  input: UpdatePreferencesInput,
): Promise<User> {
  const response = await api.patch<User>("/auth/me/preferences", input);
  return response.data;
}

export const preferencesService = {
  updateMyPreferences,
};
