import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/lib/apiError";
import { authServices } from "../services/authServices";

export function useResendVerification() {
  return useMutation({
    mutationFn: authServices.resendVerificationService,
    onSuccess() {
      toast.success(
        "If the account needs verification, a new link has been sent.",
      );
    },
    onError(error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not resend the verification email. Please try again.",
        ),
      );
    },
  });
}
