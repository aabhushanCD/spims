import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/lib/apiError";
import { authServices } from "../services/authServices";
import { useAuth } from "../context/authContext";

export function useLogin() {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  return useMutation({
    mutationFn: authServices.loginService,

    onSuccess(user) {
      setCurrentUser(user);
      toast.success("Login successful!");
      navigate("/");
    },

    onError(error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Login failed. Please check your credentials and try again.",
        ),
      );
    },
  });
}
