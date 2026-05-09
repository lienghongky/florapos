import { useEffect } from 'react';
import { useAuthStore } from '@/app/store/auth-store';
import { Layout } from '@/app/components/layout/Layout';
import { LoginPage } from '@/app/pages/LoginPage';
import { RegisterPage } from '@/app/pages/RegisterPage';
import { DashboardOwnerPage } from '@/app/pages/DashboardOwnerPage';
import { DashboardSalesPage } from '@/app/pages/DashboardSalesPage';
import { POSPage } from '@/app/pages/POSPage';
import { ProductsPage } from '@/app/pages/ProductsPage';
import { InventoryPage } from '@/app/pages/InventoryPage';
import { InventoryHistoryPage } from '@/app/pages/InventoryHistoryPage';
import { ReportsPage } from '@/app/pages/ReportsPage';
import { OrdersPage } from '@/app/pages/OrdersPage';
import { SettingsPage } from '@/app/pages/SettingsPage';
import { EMenuPage } from '@/app/pages/EMenuPage';
import { PublicEMenuPage } from '@/app/pages/PublicEMenuPage';
import { Toaster } from '@/app/components/ui/sonner';
import { ExpensesPage } from '@/app/pages/ExpensesPage';
import { DashboardMasterPage } from '@/app/pages/DashboardMasterPage';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/app/components/auth/ProtectedRoute';

import { UserRole } from './types';

function AppRoutes() {
  const { user } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/menu/:storeId" element={<PublicEMenuPage />} />

      {/* Protected Routes inside Layout */}
      <Route element={<Layout><ProtectedRoute children={null} /></Layout>}>
        {/* We use an outlet-like pattern here by wrapping the protected route logic */}
      </Route>

      {/* Dashboards */}
      <Route path="/dashboard-owner" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, 'owner']}><Layout><DashboardOwnerPage /></Layout></ProtectedRoute>} />
      <Route path="/dashboard-sales" element={<ProtectedRoute allowedRoles={[UserRole.STAFF, 'staff']}><Layout><DashboardSalesPage /></Layout></ProtectedRoute>} />
      <Route path="/dashboard-master" element={<ProtectedRoute allowedRoles={[UserRole.MASTER, 'master']}><Layout><DashboardMasterPage /></Layout></ProtectedRoute>} />

      {/* Feature Pages */}
      <Route path="/pos" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, 'owner', UserRole.STAFF, 'staff']}><Layout><POSPage /></Layout></ProtectedRoute>} />
      <Route path="/pos-fullscreen" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, 'owner', UserRole.STAFF, 'staff']}><Layout><POSPage /></Layout></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, 'owner', UserRole.STAFF, 'staff']}><Layout><OrdersPage /></Layout></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, 'owner', UserRole.STAFF, 'staff']}><Layout><ProductsPage /></Layout></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, 'owner', UserRole.STAFF, 'staff']}><Layout><InventoryPage /></Layout></ProtectedRoute>} />
      <Route path="/inventory-history" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, 'owner', UserRole.STAFF, 'staff']}><Layout><InventoryHistoryPage /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, 'owner']}><Layout><ReportsPage /></Layout></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, 'owner']}><Layout><ExpensesPage /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, 'owner', UserRole.STAFF, 'staff']}><Layout><SettingsPage /></Layout></ProtectedRoute>} />
      <Route path="/emenu" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, 'owner']}><Layout><EMenuPage /></Layout></ProtectedRoute>} />

      {/* Default Redirection */}
      <Route path="/" element={
        user ? (
          <Navigate to={
            (user.role === UserRole.MASTER || user.role === 'master' || user.role === 'MASTER') ? '/dashboard-master' : 
            ((user.role === UserRole.OWNER || user.role === 'owner' || user.role === 'OWNER') ? '/dashboard-owner' : '/dashboard-sales')
          } replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster />
    </>
  );
}