import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { KPICard } from '@/app/components/cards/KPICard';
import { DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

const chartData = [
  { date: 'Jan 8', sales: 3200 },
  { date: 'Jan 9', sales: 4100 },
  { date: 'Jan 10', sales: 3800 },
  { date: 'Jan 11', sales: 4500 },
  { date: 'Jan 12', sales: 5200 },
  { date: 'Jan 13', sales: 4800 },
  { date: 'Jan 14', sales: 5600 },
  { date: 'Jan 15', sales: 6200 },
];

export function DashboardOwnerPage() {
  const { sales } = useApp();

  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalOrders = sales.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <AnimatedPage className="space-y-8">
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden rounded-3xl bg-muted shadow-sm">
        <img
          src="https://img.freepik.com/premium-photo/shopping-cart-with-flowers-shopping-cart-with-heart-it_954894-150531.jpg?semt=ais_hybrid&w=740&q=80"
          alt="Dashboard Banner"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Owner</h1>
          <p className="text-white/90 font-medium max-w-md">
            Here's your store's performance overview for today.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={totalRevenue}
          prefix="$"
          decimals={2}
          icon={<DollarSign className="size-6" />}
          trend={{ value: 12.5, isPositive: true }}
        />
        <KPICard
          title="Total Orders"
          value={totalOrders}
          icon={<ShoppingBag className="size-6" />}
          trend={{ value: 8.2, isPositive: true }}
        />
        <KPICard
          title="Avg Order Value"
          value={avgOrderValue}
          prefix="$"
          decimals={2}
          icon={<TrendingUp className="size-6" />}
          trend={{ value: 3.1, isPositive: true }}
        />
        <KPICard
          title="Active Customers"
          value={156}
          icon={<Users className="size-6" />}
          trend={{ value: 5.4, isPositive: false }}
        />
      </div>

      {/* Sales Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-xl border border-border bg-white p-6 shadow-sm"
      >
        <h2 className="mb-6 text-lg font-semibold">Sales Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
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
              stroke="#030213"
              strokeWidth={2}
              dot={{ fill: '#030213', r: 4 }}
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
              {sales.slice(0, 5).map((sale, index) => (
                <motion.tr
                  key={sale.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/50"
                >
                  <td className="px-6 py-4 text-sm">#{sale.id}</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(sale.date).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm">{sale.items.length}</td>
                  <td className="px-6 py-4 text-sm font-medium">${sale.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">{sale.paymentMethod}</td>
                  <td className="px-6 py-4 text-sm">{sale.salesPerson}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AnimatedPage>
  );
}
