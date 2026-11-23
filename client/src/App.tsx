import { useAuth } from "./features/auth/context/authContext";
import AppRoutes from "./routes/appRoutes";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastContainer } from "react-toastify";

function App() {
  const { theme } = useAuth();
  return (
    <div
      className={`bg-background text-foreground min-h-screen ${
        theme === "dark" ? "dark" : ""
      }`}
    >
      <ToastContainer />
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </div>
  );
}

export default App;
