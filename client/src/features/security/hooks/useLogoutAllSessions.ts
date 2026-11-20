import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/lib/apiError";
import { useAuth } from "@/features/auth/context/authContext";
import { securityService } from "../services/securityService";

export function useLogoutAllSessions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  return useMutation({
    mutationFn: securityService.logoutAll,
    onSuccess() {
      setCurrentUser(null);
      queryClient.clear();
      toast.success("All sessions have been signed out");
      navigate("/login", { replace: true });
    },
    onError(error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not sign out all devices. Please try again.",
        ),
      );
    },
  });
}
