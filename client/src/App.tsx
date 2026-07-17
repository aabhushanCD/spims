import { useAuth } from "./features/auth/context/authContext";
import AppRoutes from "./routes/appRoutes";
import { ToastContainer } from 'react-toastify';
function App() {
  const { theme } = useAuth();
  return (
    <>
      <div className={` ${theme === "dark" ? "dark" : ""}`}>
        <ToastContainer />
        <AppRoutes />
      </div>
    </>
  );
}

export default App;
