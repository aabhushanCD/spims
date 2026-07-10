import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Login from "@/features/auth/pages/login.page";
import Signup from "@/features/auth/pages/Signup";
import { BrowserRouter, Routes, Route } from "react-router";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={<ProtectedRoute><Sidebar/></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
