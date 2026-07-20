import ProtectedRoute from "@/components/ProtectedRoute";

import Login from "@/features/auth/pages/login.page";
import Signup from "@/features/auth/pages/Signup";
import BatchPage from "@/features/batch/pages/BatchPage";

import DashboardLayout from "@/features/dashboard/layouts/DashboardLayout";
import Dashboard from "@/features/dashboard/pages/Dashboard.page";
import BrandPage from "@/features/genericName/pages/BrandPage";
import CategoryPage from "@/features/genericName/pages/CategoryPage";
import GenericNamePage from "@/features/genericName/pages/GenericNamePage";
import UnitPage from "@/features/genericName/pages/UnitPage";
import MedicinePage from "@/features/medicine/pages/Medicine.page";
import PurchasePage from "@/features/purchase/pages/PurchasePage";
import SaleDetailsPage from "@/features/sales/pages/SaleDetailsPage";
import SalesPage from "@/features/sales/pages/SalesPage";

import SupplierPage from "@/features/seller/pages/SupplierPage";
import UserPage from "@/features/user/pages/UserPage";
import { BrowserRouter, Routes, Route } from "react-router";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/medicines" element={<MedicinePage />} />
          <Route path="/generic-names" element={<GenericNamePage />} />

          <Route path="/categories" element={<CategoryPage />} />

          <Route path="/brands" element={<BrandPage />} />

          <Route path="/units" element={<UnitPage />} />
          <Route path="/suppliers" element={<SupplierPage />} />
          <Route path="/purchase-orders" element={<PurchasePage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/:id" element={<SaleDetailsPage />} />
          <Route path="/users" element={<UserPage />} />
          <Route path="/batches" element={<BatchPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
