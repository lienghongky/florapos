import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useApp, Sale, Product } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileText, TrendingUp, Users, CreditCard, Calendar, Search, Filter, ChevronDown, BarChart3, Receipt, DollarSign, UserCheck, Percent, RefreshCw, Printer, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { toast } from 'sonner';

export function ReportsPage() {
  const { sales, user, products } = useApp();
  const [activeTab, setActiveTab] = useState('sales'); // sales, history, invoices, financial, staff

  // Date Range State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].slice(0, 7) + '-01'); // First day of month
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Sales based on Date Range
  const filteredSales = useMemo(() => {
    return sales.filter((sale: Sale) => {
      const saleDate = sale.date.split('T')[0];
      return saleDate >= startDate && saleDate <= endDate;
    });
  }, [sales, startDate, endDate]);

  // Derived Metrics (based on filtered sales)
  const totalSales = filteredSales.reduce((acc: number, sale: Sale) => acc + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const totalDiscounts = totalSales * 0.05;

  // Chart Data (Mock generated from filtered sales if real data was sufficient, else static for visual)
  const salesOverTime = [650, 450, 780, 920, 560, 890, 1200]; // Mock remains for visuals
  const topProducts = products.slice(0, 5); // Mock

  const handleDownloadInvoice = (invoice: any) => {
    toast.success(`Downloading Invoice #${invoice.id}...`);
  };

  const handlePrintInvoice = (invoice: any) => {
    window.print();
  };

  const handleExport = () => {
    if (activeTab === 'invoices') {
      toast.success(`Generating Combined PDF for invoices from ${startDate} to ${endDate}...`);
      // Logic for generating combined PDF would go here
    } else {
      // CSV Export for Sales/History
      const headers = ['Invoice ID', 'Date', 'Staff', 'Total', 'Payment', 'Status'];
      const rows = filteredSales.map((s: Sale) => [
        s.id, new Date(s.date).toLocaleDateString(), s.salesPerson, s.total.toFixed(2), s.paymentMethod, 'Paid'
      ]);
      const csvContent = "data:text/csv;charset=utf-8,"
        + [headers, ...rows].map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `report_${activeTab}_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${activeTab === 'sales' ? 'Sales' : 'Transaction'} Report exported`);
    }
  };

  // Reusable Controls Component
  const ReportControls = () => (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Calendar className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Range:</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-9 rounded-lg border border-border bg-muted/30 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <span className="text-muted-foreground">-</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-9 rounded-lg border border-border bg-muted/30 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="ml-auto">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-green-700"
        >
          <Download className="size-4" />
          {activeTab === 'invoices' ? 'Download All Invoices (PDF)' : 'Export CSV'}
        </button>
      </div>
    </div>
  );

  return (
    <AnimatedPage className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Reports & Analytics</h1>
          <p className="mt-1 text-muted-foreground">Comprehensive insights into your business performance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto rounded-xl border border-border bg-white p-1">
        {[
          { id: 'sales', label: 'Sales Report', icon: TrendingUp },
          { id: 'history', label: 'Transaction History', icon: FileText },
          { id: 'invoices', label: 'Invoice Management', icon: Receipt },
          { id: 'financial', label: 'Financials', icon: DollarSign, ownerOnly: true },
          { id: 'staff', label: 'Staff Performance', icon: Users, ownerOnly: true },
        ].map((tab) => {
          // Quick check for owner permission, although simple app doesn't enforce strict auth yet
          if (tab.ownerOnly && user?.role !== 'owner') return null;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'sales' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <ReportControls />

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Sales', value: `$${totalSales.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
                { label: 'Transactions', value: totalTransactions, icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-100' },
                { label: 'Avg Order Value', value: `$${averageOrderValue.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
                { label: 'Discounts', value: `$${totalDiscounts.toFixed(2)}`, icon: Percent, color: 'text-orange-600', bg: 'bg-orange-100' },
              ].map((card, i) => (
                <div key={i} className="rounded-xl border border-border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
                      <card.icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                      <p className="text-2xl font-bold">{card.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts (Mock Visuals) */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h3 className="mb-6 font-semibold flex items-center gap-2">
                  <TrendingUp className="size-5 text-primary" />
                  Sales Trends
                </h3>
                <div className="flex h-64 items-end justify-between gap-2 px-2">
                  {salesOverTime.map((val, i) => (
                    <div key={i} className="group relative w-full rounded-t-lg bg-primary/10 transition-all hover:bg-primary/20">
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg bg-primary transition-all group-hover:bg-primary/80"
                        style={{ height: `${(val / 1200) * 100}%` }}
                      />
                      <div className="absolute -bottom-6 w-full text-center text-xs text-muted-foreground">
                        Day {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h3 className="mb-6 font-semibold flex items-center gap-2">
                  <BarChart3 className="size-5 text-primary" />
                  Top Products
                </h3>
                <div className="space-y-4">
                  {topProducts.map((p: Product, i: number) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground">{100 - i * 15} sold</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${100 - i * 15}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {(activeTab === 'history' || activeTab === 'invoices') && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <ReportControls />

            {/* Search Bar */}
            <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
              <Search className="size-4 text-muted-foreground ml-2" />
              <input
                type="text"
                placeholder="Search by Invoice ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
              <Filter className="size-4 text-muted-foreground mr-2 cursor-pointer hover:text-foreground" />
            </div>

            {/* Transaction Table */}
            <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Invoice ID</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Staff</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Payment</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.filter((s: Sale) => s.id.includes(searchQuery)).map((sale: Sale) => (
                    <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">#{sale.id}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(sale.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm">{sale.salesPerson}</td>
                      <td className="py-3 px-4 font-medium">${sale.total.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm">{sale.paymentMethod}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Paid
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoice(sale)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSales.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No transactions found in this date range.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'financial' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Added controls here too just in case */}
            <ReportControls />
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-4 mb-4">
                <DollarSign className="size-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Financial Reports</h3>
              <p>Detailed P&L, COGS, and Tax reports are available for Owners.</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'staff' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <ReportControls />

            {/* Staff Aggregation Logic */}
            {(() => {
              // Aggregate data
              const staffStats = filteredSales.reduce((acc: any, sale) => {
                const name = sale.salesPerson || 'Unknown';
                if (!acc[name]) {
                  acc[name] = { name, transactions: 0, total: 0, discounts: 0, role: 'Sales' };
                }
                acc[name].transactions += 1;
                acc[name].total += sale.total;
                // Mock discount logic as placeholder
                acc[name].discounts += sale.total * 0.02;
                return acc;
              }, {});

              const staffArray = Object.values(staffStats) as any[];
              const totalStaff = staffArray.length;
              const periodTotalSales = staffArray.reduce((summ, s) => summ + s.total, 0);
              const avgSalesPerStaff = totalStaff > 0 ? periodTotalSales / totalStaff : 0;
              const topPerformer = staffArray.reduce((prev, current) => (prev.total > current.total) ? prev : current, { name: '-', total: 0 });

              return (
                <>
                  {/* Staff Summary Cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'Total Active Staff', value: totalStaff, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
                      { label: 'Total Sales (Period)', value: `$${periodTotalSales.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
                      { label: 'Avg Sales / Staff', value: `$${avgSalesPerStaff.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
                      { label: 'Top Performer', value: topPerformer.name, sub: `$${topPerformer.total.toFixed(2)}`, icon: UserCheck, color: 'text-orange-600', bg: 'bg-orange-100' },
                    ].map((card, i) => (
                      <div key={i} className="rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
                            <card.icon className="size-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                            <p className="text-2xl font-bold truncate max-w-[150px]" title={card.value.toString()}>{card.value}</p>
                            {card.sub && <p className="text-xs text-green-600 font-medium">{card.sub}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Staff Table */}
                  <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="bg-muted/30 border-b border-border px-6 py-4">
                      <h3 className="font-semibold text-lg">Staff Performance</h3>
                    </div>
                    <table className="w-full">
                      <thead className="bg-muted/30 border-b border-border">
                        <tr>
                          <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Staff Name</th>
                          <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Role</th>
                          <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Transactions</th>
                          <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Total Sales</th>
                          <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Avg Order Value</th>
                          <th className="text-right py-3 px-6 font-medium text-sm text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffArray.sort((a, b) => b.total - a.total).map((staff, idx) => (
                          <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors group">
                            <td className="py-4 px-6 font-medium flex items-center gap-3">
                              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {staff.name.charAt(0)}
                              </div>
                              {staff.name}
                              {idx === 0 && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200">TOP</span>}
                            </td>
                            <td className="py-4 px-6 text-sm text-muted-foreground">{staff.role}</td>
                            <td className="py-4 px-6 text-sm">{staff.transactions}</td>
                            <td className="py-4 px-6 font-medium text-green-600">${staff.total.toFixed(2)}</td>
                            <td className="py-4 px-6 text-sm">${(staff.total / staff.transactions).toFixed(2)}</td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => setSelectedInvoice({ type: 'staff_detail', data: staff })}
                                className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {staffArray.length === 0 && (
                      <div className="p-12 text-center text-muted-foreground bg-muted/10">
                        <Users className="size-12 mx-auto mb-3 opacity-20" />
                        <p>No staff activity data found for this period.</p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      <AnimatedModal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)}>
        {selectedInvoice && (
          <div className="w-[500px] bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <div>
                <h2 className="text-xl font-bold">Invoice #{selectedInvoice.id}</h2>
                <p className="text-sm text-muted-foreground">{new Date(selectedInvoice.date).toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                Paid
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                {selectedInvoice.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-muted rounded-md flex items-center justify-center text-muted-foreground font-medium text-xs">
                        {item.quantity}x
                      </div>
                      <span>{item.product.name}</span>
                    </div>
                    <span className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${(selectedInvoice.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (0%)</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span>${selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Payment Method</p>
                  <p className="font-medium flex items-center gap-2 mt-1">
                    <CreditCard className="size-4" />
                    {selectedInvoice.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Staff</p>
                  <p className="font-medium flex items-center gap-2 mt-1">
                    <UserCheck className="size-4" />
                    {selectedInvoice.salesPerson}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-muted/50 flex gap-3">
              <button
                onClick={() => handlePrintInvoice(selectedInvoice)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-white py-2.5 font-medium hover:bg-muted/80 transition-colors"
              >
                <Printer className="size-4" />
                Print
              </button>
              <button
                onClick={() => handleDownloadInvoice(selectedInvoice)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 font-medium shadow-md hover:bg-primary/90 transition-colors"
              >
                <Download className="size-4" />
                Download PDF
              </button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Staff Detail Modal */}
      <AnimatedModal isOpen={!!selectedInvoice && selectedInvoice.type === 'staff_detail'} onClose={() => setSelectedInvoice(null)}>
        {selectedInvoice && selectedInvoice.type === 'staff_detail' && (
          <div className="w-[600px] bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                  {selectedInvoice.data.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedInvoice.data.name}</h2>
                  <p className="text-muted-foreground">Sales Representative • Active</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-xl font-bold text-green-600">${selectedInvoice.data.total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Performance Visuals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="size-4 text-primary" />
                    Recent Activity
                  </h4>
                  {/* Mock Mini Chart */}
                  <div className="flex h-24 items-end justify-between gap-1 px-1">
                    {[40, 65, 30, 80, 55, 90, 70].map((h, idx) => (
                      <div key={idx} className="w-full bg-primary/20 rounded-t-sm relative group">
                        <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-primary rounded-t-sm" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">Last 7 Days Sales</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="size-4 text-primary" />
                    Top Categories
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Bouquets</span> <span className="font-medium">45%</span></div>
                    <div className="w-full h-1.5 bg-muted rounded-full"><div className="w-[45%] h-full bg-blue-500 rounded-full" /></div>

                    <div className="flex justify-between"><span>Vase Arrangements</span> <span className="font-medium">30%</span></div>
                    <div className="w-full h-1.5 bg-muted rounded-full"><div className="w-[30%] h-full bg-purple-500 rounded-full" /></div>

                    <div className="flex justify-between"><span>Wedding</span> <span className="font-medium">15%</span></div>
                    <div className="w-full h-1.5 bg-muted rounded-full"><div className="w-[15%] h-full bg-pink-500 rounded-full" /></div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions List */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Recent Transactions</h4>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">ID</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales
                        .filter(s => s.salesPerson === selectedInvoice.data.name)
                        .slice(0, 5) // Last 5
                        .map(sale => (
                          <tr key={sale.id} className="border-t border-border">
                            <td className="px-3 py-2">#{sale.id}</td>
                            <td className="px-3 py-2 text-muted-foreground">{new Date(sale.date).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-right font-medium">${sale.total.toFixed(2)}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="p-4 bg-muted/50 text-right">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AnimatedModal>
    </AnimatedPage>
  );
}
