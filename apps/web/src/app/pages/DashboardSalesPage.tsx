import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { KPICard } from '@/app/components/cards/KPICard';
import { DollarSign, ShoppingBag, ArrowRight } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ordersService } from '@/app/services/orders.service';
import { Skeleton } from '@/app/components/ui/skeleton';

/**
 * Staff-facing dashboard — shows today's sales performance
 * and a prominent CTA to the POS system.
 */
export function DashboardSalesPage() {
  const { setCurrentPage, selectedStore } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTodayStats = async () => {
      if (!selectedStore) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem('auth_token') || '';
        const data = await ordersService.getStats(token, selectedStore.id);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch sales performance', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayStats();
  }, [selectedStore?.id]);

  if (isLoading || !stats) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-44 w-full max-w-4xl rounded-3xl" />
        <div className="text-center space-y-2">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="grid w-full max-w-2xl gap-6 md:grid-cols-2">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-16 w-64 rounded-xl" />
      </div>
    );
  }

  const todayRevenue = stats.today_revenue;
  const todayOrders = stats.today_orders;

  return (
    <AnimatedPage className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center space-y-8">
      {/* Hero Banner */}
      <div className="w-full max-w-4xl relative h-44 overflow-hidden rounded-3xl shadow-lg">
        <img
          src={selectedStore?.banner_image ? `/api${selectedStore.banner_image}` : "https://img.freepik.com/premium-photo/shopping-cart-with-flowers-shopping-cart-with-heart-it_954894-150531.jpg?semt=ais_hybrid&w=740&q=80"}
          alt="Sales Banner"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/90 via-brand-primary/60 to-transparent flex flex-col justify-center px-8">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white mb-1"
          >
            Let's make some sales!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/90"
          >
            Ready to help customers find their perfect arrangement.
          </motion.p>
        </div>
      </div>

      {/* Section Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Today's Performance</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time overview of your daily activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid w-full max-w-2xl gap-6 md:grid-cols-2">
        <KPICard
          title="Today's Sales"
          value={todayRevenue}
          prefix="$"
          decimals={2}
          icon={<DollarSign className="size-6" />}
        />
        <KPICard
          title="Today's Orders"
          value={todayOrders}
          icon={<ShoppingBag className="size-6" />}
        />
      </div>

      {/* CTA Button */}
      <motion.button
        whileHover={{ scale: 1.03, boxShadow: '0 16px 40px -10px rgba(16, 185, 129, 0.35)' }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setCurrentPage('pos')}
        className="flex items-center gap-3 rounded-xl bg-brand-primary px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-primary/25 transition-all"
      >
        Go to Point of Sale
        <ArrowRight className="size-5" />
      </motion.button>
    </AnimatedPage>
  );
}
