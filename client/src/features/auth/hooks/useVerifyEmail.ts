import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/lib/apiError";
import { authServices } from "../services/authServices";

export function useVerifyEmail() {
  return useMutation({
    mutationFn: authServices.verifyEmailService,
    onError(error) {
      toast.error(
        getApiErrorMessage(
          error,
          "This verification link is invalid or has expired.",
        ),
      );
    },
  });
}
