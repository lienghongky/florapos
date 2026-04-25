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
  const { currentPage } = useApp();

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