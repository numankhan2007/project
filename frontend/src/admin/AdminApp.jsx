import { Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./AdminAuthContext";
import { AdminToastProvider } from "./components/AdminToast";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import AdminLoginPage from "./pages/AdminLoginPage";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import AuditLogs from "./pages/AuditLogs";

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminToastProvider>
        <Routes>
          <Route path="login" element={<AdminLoginPage />} />
          <Route
            path="*"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="audit" element={<AuditLogs />} />
          </Route>
        </Routes>
      </AdminToastProvider>
    </AdminAuthProvider>
  );
}
