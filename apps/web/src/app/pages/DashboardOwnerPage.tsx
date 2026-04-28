import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { KPICard } from '@/app/components/cards/KPICard';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';
import { useOrderStore } from '@/app/store/order-store';
import { Order } from '@/app/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { formatDateTime } from '@/app/utils/format';
import { Skeleton } from '@/app/components/ui/skeleton';

/**
 * Owner-facing dashboard — shows KPIs, sales chart, and recent orders.
 */
export function DashboardOwnerPage() {
  const { selectedStore } = useAuthStore();
  const { stats, recentOrders, isDashboardLoading, refreshDashboardData } = useOrderStore();

  useEffect(() => {
    refreshDashboardData();
  }, [selectedStore?.id]);

  if (isDashboardLoading || !stats) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Banner Skeleton */}
        <Skeleton className="h-32 md:h-48 w-full rounded-2xl md:rounded-3xl" />
        
        {/* KPI Skeletons */}
        <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl border border-border" />
          ))}
        </div>

        {/* Chart Skeleton */}
        <Skeleton className="h-[400px] w-full rounded-xl border border-border" />

        {/* Table Skeleton */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="p-6 border-b border-border">
                <Skeleton className="h-6 w-32" />
            </div>
            <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>
      </div>
    );
  }

  const { total_revenue, today_revenue, today_orders, revenue_trend, chart_data } = stats;

  return (
    <AnimatedPage className="space-y-8">
      {/* Banner */}
      <div className="relative h-32 md:h-48 w-full overflow-hidden rounded-2xl md:rounded-3xl bg-muted shadow-sm">
        <img
          src={selectedStore?.banner_image ? `/api${selectedStore.banner_image}` : "https://img.freepik.com/premium-photo/shopping-cart-with-flowers-shopping-cart-with-heart-it_954894-150531.jpg?semt=ais_hybrid&w=740&q=80"}
          alt="Dashboard Banner"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-5 md:px-8">
          <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">Welcome back, Owner</h1>
          <p className="text-white/90 font-medium text-sm md:text-base max-w-xs md:max-w-md">
            Here's your store's performance overview.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Today's Orders"
          value={today_orders}
          icon={<ShoppingBag className="size-6" />}
          trend={{ value: 0, isPositive: true }}
        />
        <KPICard
          title="Today's Sales"
          value={today_revenue}
          prefix="$"
          decimals={2}
          icon={<TrendingUp className="size-6" />}
          trend={{ value: 0, isPositive: true }}
        />
        <KPICard
          title="Monthly Revenue"
          value={total_revenue}
          prefix="$"
          decimals={2}
          icon={<DollarSign className="size-6" />}
          trend={{ value: Math.abs(revenue_trend), isPositive: revenue_trend >= 0 }}
        />
        <KPICard
          title="Sales Growth"
          value={revenue_trend}
          suffix="%"
          decimals={1}
          icon={<TrendingUp className="size-6" />}
          trend={{ value: Math.abs(revenue_trend), isPositive: revenue_trend >= 0 }}
        />
      </div>

      {/* Sales Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-xl border border-border bg-white p-6 shadow-sm"
      >
        <h2 className="mb-6 text-lg font-semibold">Monthly Sales Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chart_data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Sales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="rounded-xl border border-border bg-white shadow-sm"
      >
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold">Recent Sales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Sales Person
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: Order, index: number) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/50"
                >
                  <td className="px-6 py-4 text-sm">#{order.order_number?.toUpperCase() || order.id.slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4 text-sm">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm">{order.items?.length || 0}</td>
                  <td className="px-6 py-4 text-sm font-medium">${Number(order.grand_total).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">{order.payment_method || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm">{order.staff_name || 'System'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AnimatedPage>
  );
}
