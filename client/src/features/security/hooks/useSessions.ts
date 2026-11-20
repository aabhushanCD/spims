import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/lib/apiError";
import { securityService } from "../services/securityService";

const SESSIONS_QUERY_KEY = ["auth", "sessions"] as const;

export function useSessions() {
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: securityService.getSessions,
    staleTime: 30_000,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: securityService.revokeSession,
    onSuccess() {
      toast.success("Session revoked");
      void queryClient.invalidateQueries({
        queryKey: SESSIONS_QUERY_KEY,
      });
    },
    onError(error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not revoke this session. Please try again.",
        ),
      );
    },
  });
}
