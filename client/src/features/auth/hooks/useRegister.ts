import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";

import { getApiErrorMessage } from "@/lib/apiError";
import { authServices } from "../services/authServices";

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authServices.registerService,
    onSuccess: (_data, variables) => {
      toast.success(
        "Account created. Check your email to verify your address.",
      );
      navigate(
        `/verify-email?email=${encodeURIComponent(variables.email)}&sent=1`,
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Registration failed. Please try again.",
        ),
      );
    },
  });
};
