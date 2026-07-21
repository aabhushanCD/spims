import { useAuth } from "@/features/auth/context/authContext";
import { Navigate } from "react-router";
import LoadingSpinner from "./common/LoadingSpinner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) {
    return <LoadingSpinner />;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
