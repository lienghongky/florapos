import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { KPICard } from '@/app/components/cards/KPICard';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';
import { useOrderStore } from '@/app/store/order-store';
import { Order } from '@/app/types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { formatDateTime } from '@/app/utils/format';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Badge } from '@/app/components/ui/badge';

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

  const { total_revenue, today_revenue, today_orders, revenue_trend, chart_data, top_products, category_stats } = stats;

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#EC4899'];

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

      {/* Sales Trend Chart (Full Width) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-xl border border-border bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Sales Trend</h2>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            <div className="size-2 rounded-full bg-emerald-500" />
            Monthly Revenue
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chart_data}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSales)"
              animationDuration={1500}
            />
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
          <div className="p-0">
            {top_products && top_products.length > 0 ? (
              <div className="divide-y divide-border">
                {top_products.map((product: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.quantity} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${Number(product.revenue).toFixed(2)}</p>
                      <div className="h-1.5 w-24 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(product.revenue / top_products[0].revenue) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                          className="h-full bg-emerald-500" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-muted-foreground text-sm italic">
                No product data available yet
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <h2 className="mb-6 text-lg font-semibold">Sales by Weekday</h2>
          <div className="h-[300px] w-full">
            {stats.weekday_stats && stats.weekday_stats.length > 0 ? (
              <div className="h-full flex flex-col">
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={stats.weekday_stats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Sales']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#10B981" 
                      radius={[20, 20, 0, 0]} 
                      barSize={45}
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
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">
                No weekday data available
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Sales (Full Width) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="rounded-xl border border-border bg-white shadow-sm overflow-hidden"
      >
        <div className="border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Sales</h2>
          <Badge variant="outline" className="font-normal">Last 10 orders</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Order ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Items</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Total</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Payment</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Sales Person</th>
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
                  <td className="px-6 py-4 text-sm font-medium">#{order.order_number?.split('-').pop() || order.id.slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDateTime(order.created_at)}</td>
                  <td className="px-6 py-4 text-sm">{order.items?.length || 0}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">${Number(order.grand_total).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge variant="secondary" className="font-normal uppercase text-[10px]">{order.payment_method}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{order.staff_name || 'System'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AnimatedPage>
  );
}
