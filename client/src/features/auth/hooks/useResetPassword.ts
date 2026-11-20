import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/lib/apiError";
import { authServices } from "../services/authServices";

export function useResetPassword() {
  return useMutation({
    mutationFn: authServices.resetPasswordService,
    onSuccess() {
      // The server revoked every refresh session, so clear any local user
      // state in this tab as well.
      window.dispatchEvent(new Event("auth:session-expired"));
    },
    onError(error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not reset your password. The link may have expired.",
        ),
      );
    },
  });
}
