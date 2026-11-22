import ProtectedRoute from "@/components/ProtectedRoute";
import RequireRole from "@/components/RequireRole";
import NotFoundPage from "@/components/NotFoundPage";

import Login from "@/features/auth/pages/login.page";
import Signup from "@/features/auth/pages/Signup";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import SecurityPage from "@/features/security/pages/SecurityPage";
import BatchPage from "@/features/batch/pages/BatchPage";

import DashboardLayout from "@/features/dashboard/layouts/DashboardLayout";
import Dashboard from "@/features/dashboard/pages/Dashboard.page";
import BrandPage from "@/features/genericName/pages/BrandPage";
import CategoryPage from "@/features/genericName/pages/CategoryPage";
import GenericNamePage from "@/features/genericName/pages/GenericNamePage";
import UnitPage from "@/features/genericName/pages/UnitPage";
import InventoryPage from "@/features/inventory/pages/InventoryPage";
import InventoryMovementsPage from "@/features/inventory/pages/InventoryMovementsPage";
import ReconciliationPage from "@/features/inventory/pages/ReconciliationPage";
import MedicinePage from "@/features/medicine/pages/Medicine.page";
import NotificationsPage from "@/features/notification/pages/NotificationsPage";
import NotificationSettingsPage from "@/features/notification/pages/NotificationSettingsPage";
import PurchasePage from "@/features/purchase/pages/PurchasePage";
import SaleDetailsPage from "@/features/sales/pages/SaleDetailsPage";
import SalesPage from "@/features/sales/pages/SalesPage";

import CustomerPage from "@/features/customer/pages/CustomerPage";
import ReturnDetailsPage from "@/features/returns/pages/ReturnDetailsPage";
import ReturnsPage from "@/features/returns/pages/ReturnsPage";
import StocktakeDetailsPage from "@/features/stocktake/pages/StocktakeDetailsPage";
import StocktakesPage from "@/features/stocktake/pages/StocktakesPage";
import SupplierPage from "@/features/supplier/pages/SupplierPage";
import UserPage from "@/features/user/pages/UserPage";
import { BrowserRouter, Routes, Route } from "react-router";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

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
          <Route path="/customers" element={<CustomerPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/:id" element={<SaleDetailsPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/returns/:id" element={<ReturnDetailsPage />} />
          <Route
            path="/users"
            element={
              <RequireRole allowedRoles={["owner", "pharmacist"]}>
                <UserPage />
              </RequireRole>
            }
          />
          <Route path="/batches" element={<BatchPage />} />
          <Route path="/stock" element={<InventoryPage />} />
          <Route
            path="/inventory/movements"
            element={<InventoryMovementsPage />}
          />
          <Route
            path="/inventory/reconciliation"
            element={<ReconciliationPage />}
          />
          <Route
            path="/stocktakes"
            element={
              <RequireRole allowedRoles={["owner", "inventory_manager"]}>
                <StocktakesPage />
              </RequireRole>
            }
          />
          <Route
            path="/stocktakes/:id"
            element={
              <RequireRole allowedRoles={["owner", "inventory_manager"]}>
                <StocktakeDetailsPage />
              </RequireRole>
            }
          />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route
            path="/settings/notifications"
            element={<NotificationSettingsPage />}
          />
          <Route path="/settings/security" element={<SecurityPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
