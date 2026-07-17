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
      setCurrentUser(null);
      window.location.href = "/login";
    },
    onError(error) {
      toast.error("Logout failed. Please try again.");
      console.log("Logout failed", error);
    },
  });
};
