import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { KPICard } from '@/app/components/cards/KPICard';
import { DollarSign, ShoppingBag, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';
import { useOrderStore } from '@/app/store/order-store';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Badge } from '@/app/components/ui/badge';

/**
 * Staff-facing dashboard — shows today's sales performance
 * and a prominent CTA to the POS system.
 */
export function DashboardSalesPage() {
  const { selectedStore } = useAuthStore();
  const { stats, isDashboardLoading, refreshDashboardData } = useOrderStore();

  useEffect(() => {
    refreshDashboardData();
  }, [selectedStore?.id]);

  if (isDashboardLoading || !stats) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-44 w-full max-w-4xl rounded-3xl" />
        <div className="text-center space-y-2">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full max-w-4xl rounded-xl" />
      </div>
    );
  }

  const { today_revenue, today_orders, chart_data, top_products, weekday_stats } = stats;

  return (
    <AnimatedPage className="space-y-10 max-w-6xl mx-auto py-6">
      {/* Hero Banner */}
      <div className="w-full relative h-44 overflow-hidden rounded-3xl shadow-lg">
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

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <KPICard
          title="Today's Sales"
          value={today_revenue}
          prefix="$"
          decimals={2}
          icon={<DollarSign className="size-6" />}
        />
        <KPICard
          title="Today's Orders"
          value={today_orders}
          icon={<ShoppingBag className="size-6" />}
        />
      </div>

      {/* Sales Trend Chart (Full Width) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-xl border border-border bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold mb-6">Sales Performance</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chart_data}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
            <Area type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} fill="url(#colorSales)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products (50%) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-xl border border-border bg-white shadow-sm overflow-hidden"
        >
          <div className="border-b border-border p-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top Selling Products</h2>
            <TrendingUp className="size-5 text-emerald-500" />
          </div>
          <div className="divide-y divide-border">
            {top_products?.slice(0, 5).map((product: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs">
                    #{i + 1}
                  </div>
                  <span className="font-semibold text-sm text-slate-800">{product.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">${Number(product.revenue).toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400">{product.quantity} sold</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-6">Weekly Performance</h2>
          <div className="h-[300px] w-full">
            <div className="h-full flex flex-col">
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={weekday_stats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                    formatter={(val: string) => val.toUpperCase()}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={false} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#10B981" 
                    radius={[20, 20, 0, 0]} 
                    barSize={40}
                    background={{ fill: '#f1f5f9', radius: [20, 20, 0, 0] }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 text-center">
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-300 uppercase">
                  Weekly Performance (Mon - Sun)
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex justify-center pt-4"
      >
        <Link
          to="/pos"
          className="flex items-center gap-3 rounded-2xl bg-brand-primary px-12 py-5 text-xl font-semibold text-white shadow-xl shadow-brand-primary/25 transition-all"
        >
          Go to Point of Sale
          <ArrowRight className="size-6" />
        </Link>
      </motion.div>
    </AnimatedPage>
  );
}
