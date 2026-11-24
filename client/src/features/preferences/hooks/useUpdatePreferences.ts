import { useMutation } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/context/authContext";
import { preferencesService } from "../services/preferences.service";

export function useUpdatePreferences() {
  const { setCurrentUser } = useAuth();

  return useMutation({
    mutationFn: preferencesService.updateMyPreferences,
    onSuccess: (user) => {
      setCurrentUser(user);
    },
  });
}
