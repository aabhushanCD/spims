import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/lib/apiError";
import { authServices } from "../services/authServices";

export function useForgotPassword() {
  return useMutation({
    mutationFn: authServices.forgotPasswordService,
    onError(error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not send the reset email. Please try again.",
        ),
      );
    },
  });
}
