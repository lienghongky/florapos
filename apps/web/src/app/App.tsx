import { AppProvider, useApp } from '@/app/context/AppContext';
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
import { Toaster } from '@/app/components/ui/sonner';
import { ExpensesPage } from '@/app/pages/ExpensesPage';
import { DashboardMasterPage } from '@/app/pages/DashboardMasterPage';

function AppContent() {
  const { currentPage, isLoading, user } = useApp();

  // Show a loading screen while auth token is being validated on startup.
  // This prevents the login page from flashing before the stored session is restored.
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-border border-t-brand-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'dashboard-owner':
        return <DashboardOwnerPage />;
      case 'dashboard-sales':
        return <DashboardSalesPage />;
      case 'pos':
      case 'pos-fullscreen':
        return <POSPage />;
      case 'orders':
        return <OrdersPage />;
      case 'products':
        return <ProductsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'inventory-history':
        return <InventoryHistoryPage />;
      case 'reports':
        return <ReportsPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'settings':
        return <SettingsPage />;
      case 'dashboard-master':
        return <DashboardMasterPage />;
      default:
        // If user is logged in, default to their respective dashboard for unknown routes
        if (user) {
          if (user.role === 'owner') return <DashboardOwnerPage />;
          if (user.role === 'staff') return <DashboardSalesPage />;
          if (user.role === 'superadmin') return <DashboardMasterPage />;
        }
        return <LoginPage />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster />
    </AppProvider>
  );
}