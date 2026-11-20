import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { authServices } from "../services/authServices";
import { useAuth } from "../context/authContext";

export const useLogout = () => {
  const { setCurrentUser } = useAuth();

  return useMutation({
    mutationFn: authServices.logoutService,
    onSuccess() {
      toast.success("Logout successful!");
    },
    onSettled() {
      // The httpOnly cookies may already be cleared server-side. Always clear
      // local state so the UI cannot remain in a half-logged-in state.
      setCurrentUser(null);
      window.location.href = "/login";
    },
    onError(error) {
      console.error("Logout failed", error);
    },
  });
};
