import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { AdminPage } from "./pages/AdminPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ItemsPage } from "./pages/ItemsPage";
import { LoansPage } from "./pages/LoansPage";
import { AuditPage } from "./pages/AuditPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminReportsPage } from "./pages/AdminReportsPage";
import { TechReportsPage } from "./pages/TechReportsPage";
import { SuperAdminOrgsPage } from "./pages/SuperAdminOrgsPage";
import { SuperAdminRequestsPage } from "./pages/SuperAdminRequestsPage";
import { AdminAccessRequestsPage } from "./pages/AdminAccessRequestsPage";
import { SuperAdminOrgRequestsPage } from "./pages/SuperAdminOrgRequestsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute minRole="ADMIN">
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/items"
          element={
            <ProtectedRoute minRole="TECH">
              <ItemsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/loans"
          element={
            <ProtectedRoute minRole="STUDENT">
              <LoansPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute minRole="TECH">
              <AuditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute minRole="ADMIN">
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-users"
          element={
            <ProtectedRoute minRole="ADMIN">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-reports"
          element={
            <ProtectedRoute minRole="ADMIN">
              <AdminReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tech-reports"
          element={
            <ProtectedRoute minRole="TECH">
              <TechReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/super-orgs"
          element={
            <ProtectedRoute minRole="SUPER_ADMIN">
              <SuperAdminOrgsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/super-requests"
          element={
            <ProtectedRoute minRole="SUPER_ADMIN">
              <SuperAdminRequestsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-access-requests"
          element={
            <ProtectedRoute minRole="ADMIN">
              <AdminAccessRequestsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/super-org-requests"
          element={
            <ProtectedRoute minRole="SUPER_ADMIN">
              <SuperAdminOrgRequestsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;