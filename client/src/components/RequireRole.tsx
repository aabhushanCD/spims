import { Navigate } from "react-router";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuth } from "@/features/auth/context/authContext";
import type { Role } from "@/lib/permissions";

interface Props {
  allowedRoles: readonly Role[];
  children: React.ReactNode;
}

export default function RequireRole({ allowedRoles, children }: Props) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="text-muted-foreground text-sm">
          Your role does not have permission to view this page.
        </p>
      </div>
    );
  }

  return children;
}
