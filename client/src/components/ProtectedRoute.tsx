import { useAuth } from "@/features/auth/context/authContext";
import { Navigate } from "react-router";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading } = useAuth();

  console.log("AuthProvider data", currentUser, isLoading);
  if (isLoading && !currentUser) {
    return <div>Loading...</div>;
  }
  if (!currentUser && !isLoading) {
     return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
