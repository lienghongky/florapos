import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { KPICard } from '@/app/components/cards/KPICard';
import { DollarSign, ShoppingBag } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { motion } from 'motion/react';

export function DashboardSalesPage() {
  const { sales, setCurrentPage } = useApp();

  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const todayOrders = todaySales.length;

  return (
    <AnimatedPage className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center space-y-8">
      {/* Salsperson Banner - More compact/focused */}
      <div className="w-full max-w-4xl relative h-40 overflow-hidden rounded-3xl bg-muted shadow-sm mb-4">
        <img
          src="https://img.freepik.com/premium-photo/shopping-cart-with-flowers-shopping-cart-with-heart-it_954894-150531.jpg?semt=ais_hybrid&w=740&q=80"
          alt="Sales Banner"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/80 to-transparent flex flex-col justify-center px-8">
          <h1 className="text-3xl font-bold text-white mb-1">Let's make some sales!</h1>
          <p className="text-white/90">Ready to help customers find their perfect arrangement.</p>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-semibold">Today's Performance</h2>
      </div>

      <div className="grid w-full max-w-2xl gap-6 md:grid-cols-2">
        <KPICard
          title="Today's Revenue"
          value={todayRevenue}
          prefix="$"
          decimals={2}
          icon={<DollarSign className="size-6" />}
        />
        <KPICard
          title="Orders Completed"
          value={todayOrders}
          icon={<ShoppingBag className="size-6" />}
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)' }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setCurrentPage('pos')}
        className="rounded-xl bg-primary px-12 py-4 text-lg font-medium text-primary-foreground shadow-lg"
      >
        Go to Point of Sale
      </motion.button>
    </AnimatedPage>
  );
}
