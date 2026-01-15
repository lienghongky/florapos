import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  FileText,
  Settings,
  Flower2,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: ('owner' | 'sales')[];
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="size-5" />,
    roles: ['owner', 'sales'],
  },
  {
    id: 'pos',
    label: 'POS System',
    icon: <ShoppingCart className="size-5" />,
    roles: ['owner', 'sales'],
  },
  {
    id: 'products',
    label: 'Products',
    icon: <Package className="size-5" />,
    roles: ['owner', 'sales'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <Warehouse className="size-5" />,
    roles: ['owner', 'sales'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <FileText className="size-5" />,
    roles: ['owner'],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: <TrendingDown className="size-5" />,
    roles: ['owner'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="size-5" />,
    roles: ['owner', 'sales'],
  },
];

export function Sidebar() {
  const { user, currentPage, setCurrentPage, isSidebarCollapsed, toggleSidebar, logout } = useApp();

  if (!user) return null;

  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  const getPageId = (page: string) => {
    if (page.startsWith('dashboard')) return 'dashboard';
    return page;
  };

  const handleNavClick = (itemId: string) => {
    if (itemId === 'dashboard') {
      setCurrentPage(user.role === 'owner' ? 'dashboard-owner' : 'dashboard-sales');
    } else {
      setCurrentPage(itemId);
    }
  };

  return (
    <motion.div
      animate={{ width: isSidebarCollapsed ? 80 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-white pb-4 text-foreground shadow-sm border-r border-border"
    >
      {/* Brand */}
      <div className={`flex h-20 shrink-0 items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-6'}`}>
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-lg shadow-brand-primary/25 shrink-0">
          <Flower2 className="size-6" />
        </div>
        {!isSidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden whitespace-nowrap"
          >
            <span className="block text-lg font-bold">FloraPos</span>
            <span className="text-xs text-muted-foreground">Flower Shop POS</span>
          </motion.div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredItems.map(item => {
          const isActive = getPageId(currentPage) === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: isSidebarCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavClick(item.id)}
              onDoubleClick={() => {
                if (item.id === 'pos') {
                  setCurrentPage('pos-fullscreen');
                }
              }}
              className={`group flex items-center rounded-xl transition-all duration-200 
                ${isSidebarCollapsed ? 'w-10 h-10 justify-center mx-auto' : 'w-full px-4 py-3.5 gap-3 text-left'}
                ${isActive
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              <div className="shrink-0">{item.icon}</div>

              {!isSidebarCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
              )}

              {isActive && !isSidebarCollapsed && (
                <motion.div
                  layoutId="active-pill"
                  className="ml-auto size-1.5 rounded-full bg-white shrink-0"
                  transition={{ duration: 0.2 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="mt-auto px-3 space-y-2">
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`flex items-center justify-center w-full h-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors ${isSidebarCollapsed ? 'mx-auto w-10' : ''}`}
        >
          {isSidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>

        <div className={`flex items-center rounded-2xl bg-muted/50 p-2 ${isSidebarCollapsed ? 'justify-center flex-col gap-2' : 'gap-3'}`}>
          <div className="size-8 overflow-hidden rounded-full bg-muted shrink-0">
            <div className="flex size-full items-center justify-center bg-brand-secondary/20 text-brand-primary font-bold text-xs">
              {user?.name?.[0] || 'U'}
            </div>
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden flex-1">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button onClick={logout} className="p-1 hover:bg-white rounded-lg text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
