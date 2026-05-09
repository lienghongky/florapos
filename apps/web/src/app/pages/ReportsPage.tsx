import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useAuthStore } from '@/app/store/auth-store';
import { useProductStore } from '@/app/store/product-store';
import { Product, UserRole } from '@/app/types';
import { Order } from '@/app/types';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileText, TrendingUp, Users, CreditCard, Calendar, Search, Filter, ChevronDown, BarChart3, Receipt, DollarSign, UserCheck, Percent, RefreshCw, Printer, AlertCircle } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { domToCanvas } from 'modern-screenshot';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { toast } from 'sonner';
import { OrderReceipt } from '@/app/components/orders/OrderReceipt';
import { formatDateTime, parsePrice, toLocalDateString } from '@/app/utils/format';
import { ordersService } from '@/app/services/orders.service';

// parsePrice is now imported from @/app/utils/format

export function ReportsPage() {
  const { user, selectedStore } = useAuthStore();
  const { products } = useProductStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('sales'); // sales, history, invoices, financial, staff

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [batchOrder, setBatchOrder] = useState<Order | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Download Customization State
  const [dlPrefix, setDlPrefix] = useState('');
  const [dlStartNum, setDlStartNum] = useState(1);
  const [dlMode, setDlMode] = useState<'original' | 'auto'>('original');
  const [dlNote, setDlNote] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [metricsOrders, setMetricsOrders] = useState<Order[]>([]);

  const [weeklyTrend, setWeeklyTrend] = useState<{ date: string, sales: number, dayName: string }[]>(() => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return dayNames.map(name => ({ date: '', sales: 0, dayName: name }));
  });

  const receiptRef = useRef<HTMLDivElement>(null);
  const batchRef = useRef<HTMLDivElement>(null);

  // Date Range State
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return toLocalDateString(firstDay);
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return toLocalDateString(lastDay);
  });

  useEffect(() => {
    if (!selectedStore) return;

    const status = (activeTab === 'sales' || activeTab === 'financial' || activeTab === 'invoices' || activeTab === 'staff')
      ? 'completed'
      : undefined;

    setIsRefreshing(true);
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';
        const response = await ordersService.getOrders(
          token,
          selectedStore.id,
          status,
          startDate,
          endDate,
          (activeTab === 'history' || activeTab === 'invoices') ? searchQuery : undefined,
          currentPage,
          itemsPerPage
        );

        if (response && response.items) {
          setOrders(response.items);
          setTotalItems(response.count);
        } else {
          setOrders(response || []);
          setTotalItems((response || []).length);
        }

        setSelectedOrderIds([]);
      } catch (err) {
        console.error("Failed to fetch report orders", err);
        setOrders([]);
        setTotalItems(0);
      } finally {
        setIsRefreshing(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [startDate, endDate, activeTab, searchQuery, selectedStore?.id, currentPage, itemsPerPage]);

  // Separate effect to fetch ALL orders for metrics (summary cards, charts)
  useEffect(() => {
    if (!selectedStore) return;

    const fetchMetricsData = async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';
        const status = (activeTab === 'sales' || activeTab === 'financial' || activeTab === 'invoices' || activeTab === 'staff')
          ? 'completed'
          : undefined;

        const response = await ordersService.getOrders(
          token,
          selectedStore.id,
          status,
          startDate,
          endDate,
          (activeTab === 'history' || activeTab === 'invoices') ? searchQuery : undefined,
          1,
          5000 // High limit for metrics
        );

        if (response && response.items) {
          setMetricsOrders(response.items);
        } else {
          setMetricsOrders(response || []);
        }
      } catch (err) {
        console.error("Failed to fetch metrics data", err);
      }
    };

    fetchMetricsData();
  }, [startDate, endDate, activeTab, searchQuery, selectedStore?.id]);

  // Fetch Weekly Trend specifically for Monday-Sunday
  useEffect(() => {
    if (!selectedStore) return;

    const fetchWeeklyTrend = async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';

        // Get Current Week (Monday to Sunday)
        const now = new Date();
        const day = now.getDay();
        const mon = new Date(now);
        mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        mon.setHours(0, 0, 0, 0);

        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        sun.setHours(23, 59, 59, 999);

        // We use local date strings to avoid timezone shifts
        const monStr = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
        const sunStr = `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}`;

        const stats = await ordersService.getStats(token, selectedStore.id, monStr, sunStr);

        if (stats && stats.chart_data) {
          const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

          // The backend returns an array for the range. We ensure it's exactly 7 days
          // by mapping over our expected day names.
          const fullTrend = dayNames.map((name, i) => {
            const targetDate = new Date(mon);
            targetDate.setDate(mon.getDate() + i);
            const label = targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

            // Find the matching data point from backend
            const dataPoint = stats.chart_data.find((d: any) => d.date === label);

            return {
              date: label,
              sales: dataPoint ? dataPoint.sales : 0,
              dayName: name
            };
          });

          setWeeklyTrend(fullTrend);
        }
      } catch (err) {
        console.error("Failed to fetch weekly trend", err);
      }
    };

    fetchWeeklyTrend();
  }, [selectedStore?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, activeTab, searchQuery, itemsPerPage]);

  // Filter Orders based on Status (sync with current Tab)
  // We trust the backend for date-range and search-term filtering
  const filteredOrders = useMemo(() => {
    const activeStatus = (activeTab === 'sales' || activeTab === 'financial' || activeTab === 'invoices' || activeTab === 'staff')
      ? 'completed'
      : undefined;

    const searchLower = searchQuery.toLowerCase().trim();

    return (metricsOrders || []).filter((order: Order) => {
      // Status Check (Must match what the tab expects)
      const matchesStatus = !activeStatus || order.status === activeStatus;
      if (!matchesStatus) return false;

      // Search Check
      if (!searchLower) return true;
      const orderNum = (order.order_number || '').toLowerCase();
      const shortId = order.id.slice(-6).toLowerCase();
      return orderNum.includes(searchLower) || shortId.includes(searchLower);
    });
  }, [metricsOrders, activeTab, searchQuery]);

  // Derived Metrics (based on metricsOrders filtered)
  const totalSales = filteredOrders.reduce((acc: number, order: Order) => acc + parsePrice(order.grand_total), 0);
  const totalTransactions = filteredOrders.length;
  const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const totalDiscounts = filteredOrders.reduce((acc: number, order: Order) => acc + parsePrice(order.discount_total || 0), 0);
  const totalTax = filteredOrders.reduce((acc: number, order: Order) => acc + parsePrice(order.tax_total || 0), 0);

  // Calculate Real Sales Over Time
  const salesOverTime = useMemo(() => {
    const dailyMap: Record<string, number> = {};

    // Fill with zeroes for the date range to avoid gaps
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const localKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dailyMap[localKey] = 0;
      }
    }

    filteredOrders.forEach((order: Order) => {
      const dateObj = order.created_at ? new Date(order.created_at) : null;
      if (dateObj && !isNaN(dateObj.getTime())) {
        // Use local date for grouping to match Dashboard
        const date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        if (dailyMap[date] !== undefined) {
          dailyMap[date] += parsePrice(order.grand_total);
        }
      }
    });

    return Object.entries(dailyMap).sort().map(([date, amount]) => ({ date, amount }));
  }, [filteredOrders, startDate, endDate]);

  const maxDailySales = Math.max(...salesOverTime.map((s: { amount: number }) => s.amount), 1);

  // Calculate Real Top Products
  const topProductStats = useMemo(() => {
    const productMap: Record<string, { name: string, quantity: number, revenue: number }> = {};

    filteredOrders.forEach((order: Order) => {
      order.items.forEach((item: any) => {
        if (!productMap[item.product_id]) {
          productMap[item.product_id] = { name: item.product_name_snapshot, quantity: 0, revenue: 0 };
        }
        productMap[item.product_id].quantity += Number(item.quantity);
        productMap[item.product_id].revenue += parsePrice(item.line_total);
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  // Financial Metrics (Estimated)
  const financialSummary = useMemo(() => {
    let estimatedCOGS = 0;
    filteredOrders.forEach((order: Order) => {
      order.items.forEach((item: any) => {
        const product = products.find((p: Product) => p.id === item.product_id);
        const costPrice = parsePrice(product?.cost_price || 0);
        estimatedCOGS += Number(item.quantity) * costPrice;
      });
    });

    const grossProfit = totalSales - estimatedCOGS;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    return { estimatedCOGS, grossProfit, profitMargin };
  }, [filteredOrders, products, totalSales]);

  const selectedOrders = useMemo(() => {
    return filteredOrders.filter(o => selectedOrderIds.includes(o.id));
  }, [filteredOrders, selectedOrderIds]);

  const handleDownloadInvoice = async (invoice: Order) => {
    if (!receiptRef.current) {
      toast.error('Receipt component not ready for download');
      return;
    }

    const toastId = toast.loading('Generating PDF...');

    try {
      const canvas = await domToCanvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${invoice.order_number?.toLowerCase() || invoice.id.slice(-6)}.pdf`);

      toast.success('Invoice downloaded successfully', { id: toastId });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const handlePrintInvoice = (invoice: any) => {
    // Standard approach: use the CSS print styles defined in index.css
    window.print();
  };

  const processBatchPDF = async () => {
    setIsDownloadModalOpen(false);
    const toastId = toast.loading(`Preparing 0 of ${selectedOrders.length} invoices...`);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Loop through each order and add to PDF
      for (let i = 0; i < selectedOrders.length; i++) {
        const order = selectedOrders[i];
        toast.loading(`Processing invoice ${i + 1} of ${selectedOrders.length}...`, { id: toastId });

        // Custom Invoice Code Logic
        let customCode = undefined;
        if (dlMode === 'auto') {
          customCode = `${dlPrefix}${dlStartNum + i}`;
        }

        // Set the batch order with extra props
        setBatchOrder({ ...order, customInvoiceCode: customCode, customNote: dlNote } as any);

        // Wait for React to render
        await new Promise(resolve => setTimeout(resolve, 350));

        if (batchRef.current) {
          const canvas = await domToCanvas(batchRef.current, {
            scale: 2,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/png');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
      }

      pdf.save(`batch-invoices-${startDate}-to-${endDate}.pdf`);
      setBatchOrder(null);
      toast.success(`Generated PDF with ${selectedOrders.length} invoices`, { id: toastId });
    } catch (error) {
      console.error('Batch Export Error:', error);
      toast.error('Failed to generate batch PDF', { id: toastId });
      setBatchOrder(null);
    }
  };

  const handleExport = async () => {
    if (activeTab === 'invoices') {
      if (filteredOrders.length === 0) {
        toast.error('No invoices to download');
        return;
      }
      setIsDownloadModalOpen(true);
    } else {
      // CSV Export for Sales/History
      const headers = ['Ref', 'Invoice ID', 'Date', 'Staff', 'Total', 'Payment', 'Status'];
      const rows = filteredOrders.map((o: Order) => [
        o.id, o.order_number || '', new Date(o.created_at || Date.now()).toLocaleDateString(), o.staff_name || o.staff_id || 'Self-Serve', parsePrice(o.grand_total).toFixed(2), o.payment_method || 'Unknown', 'Paid'
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

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    toast.info('Filters have been reset');
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
      <button
        onClick={handleResetFilters}
        className="text-xs font-semibold text-primary hover:underline"
      >
        Clear All
      </button>
      <div className="ml-auto flex items-center gap-4">
        {activeTab === 'invoices' && selectedOrderIds.length > 0 && (
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {selectedOrderIds.length} Selected
          </span>
        )}
        <button
          onClick={handleExport}
          disabled={activeTab === 'invoices' && selectedOrderIds.length === 0}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-md transition-all ${(activeTab === 'invoices' && selectedOrderIds.length === 0)
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 active:scale-95'
            }`}
        >
          <Download className="size-4" />
          {activeTab === 'invoices'
            ? `Download ${selectedOrderIds.length > 0 ? 'Selected' : 'All'} Invoices (PDF)`
            : 'Export CSV'}
        </button>
      </div>
    </div>
  );

  return (
    <AnimatedPage className="space-y-6 relative">
      {/* Print-only Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-receipt, .printable-receipt * { visibility: visible; }
          .printable-receipt { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            border: none;
            box-shadow: none;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Hidden container for batch PDF processing */}
      {batchOrder && (
        <div
          className="fixed pointer-events-none opacity-0"
          style={{ width: '500px', left: '-5000px', top: 0, zIndex: -1 }}
        >
          <div ref={batchRef}>
            <OrderReceipt
              order={batchOrder}
              customInvoiceCode={(batchOrder as any).customInvoiceCode}
              customNote={(batchOrder as any).customNote}
            />
          </div>
        </div>
      )}

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
          if (tab.ownerOnly && user?.role !== UserRole.OWNER) return null;
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
      <div className="space-y-6 relative">
        <AnimatePresence mode="wait">
          {isRefreshing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl"
            >
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="size-8 text-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">Refreshing data...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                <div className="flex h-64 items-end justify-between gap-3 px-2">
                  {weeklyTrend.map((s, i) => {
                    const maxVal = Math.max(...weeklyTrend.map(t => t.sales), 1);
                    const height = (s.sales / maxVal) * 100;

                    return (
                      <div key={i} className="group relative w-full h-full flex items-end">
                        {/* Background column to show the day slot exists */}
                        <div className="absolute inset-0 w-full bg-slate-50/50 rounded-t-lg -z-0" />

                        {/* Actual Sales Bar */}
                        <div
                          className="relative w-full rounded-t-lg bg-primary/40 group-hover:bg-primary/60 transition-all z-10"
                          style={{ height: `100%`, opacity: 0.1 }} // Subtle background for the bar
                        />

                        <div
                          className="absolute bottom-0 w-full rounded-t-lg bg-primary transition-all group-hover:bg-primary/80 z-20 shadow-sm"
                          style={{ height: `${height}%`, minHeight: s.sales > 0 ? '4px' : '0' }}
                        />

                        <div className="absolute -bottom-8 w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          {s.dayName}
                        </div>

                        {/* Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-30 whitespace-nowrap transition-opacity pointer-events-none">
                          <p className="font-black text-white">${parsePrice(s.sales).toFixed(2)}</p>
                          <p className="text-white/40">{s.date || s.dayName}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                  Weekly Performance (Mon - Sun)
                </div>
              </div>
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h3 className="mb-6 font-semibold flex items-center gap-2">
                  <BarChart3 className="size-5 text-primary" />
                  Top Products
                </h3>
                <div className="space-y-4">
                  {topProductStats.length > 0 ? (
                    topProductStats.map((p: any, i: number) => {
                      const maxQty = topProductStats[0].quantity;
                      const percentage = (p.quantity / maxQty) * 100;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-muted-foreground">{p.quantity} units sold</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                            <span>Rev: ${p.revenue.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <AlertCircle className="size-8 mb-2 opacity-20" />
                      <p className="text-sm">No items sold in this period</p>
                    </div>
                  )}
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
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-border text-primary focus:ring-primary/20"
                        checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrderIds(filteredOrders.map(o => o.id));
                          } else {
                            setSelectedOrderIds([]);
                          }
                        }}
                      />
                    </th>
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
                  {(() => {
                    if (orders.length === 0 && !isRefreshing) {
                      return (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Search className="size-8 opacity-20" />
                              <p>{searchQuery ? `No matches for "${searchQuery}"` : 'No transactions found'}</p>
                              <button onClick={handleResetFilters} className="text-sm text-primary font-medium hover:underline">Reset filters</button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return orders.map((order: Order) => (
                      <tr key={order.id} className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${selectedOrderIds.includes(order.id) ? 'bg-primary/5' : ''}`}>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-primary/20"
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrderIds(prev => [...prev, order.id]);
                              } else {
                                setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                              }
                            }}
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">#{order.order_number?.toUpperCase() || order.id.slice(-6).toUpperCase()}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{formatDateTime(order.created_at)}</td>
                        <td className="py-3 px-4 text-sm">{order.staff_name || order.staff_id || 'System'}</td>

                        <td className="py-3 px-4 font-medium">${parsePrice(order.grand_total).toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm">{order.payment_method || 'Unknown'}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            {order.status === 'completed' ? 'Paid' : order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-6 py-4 bg-muted/10 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-border rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">per page</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Page {currentPage} of {Math.ceil(totalItems / itemsPerPage) || 1}
                    <span className="ml-2 text-slate-300">({totalItems} total)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="size-8 flex items-center justify-center rounded-lg bg-white border border-border text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                    >
                      <ChevronDown className="size-4 rotate-90" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalItems / itemsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                      className="size-8 flex items-center justify-center rounded-lg bg-white border border-border text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                    >
                      <ChevronDown className="size-4 -rotate-90" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'financial' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <ReportControls />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Net Sales', value: `$${totalSales.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100', sub: 'After discounts' },
                { label: 'Estimated COGS', value: `$${financialSummary.estimatedCOGS.toFixed(2)}`, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', sub: 'Current cost basis' },
                { label: 'Gross Profit', value: `$${financialSummary.grossProfit.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100', sub: `${financialSummary.profitMargin.toFixed(1)}% margin` },
                { label: 'Tax Collected', value: `$${totalTax.toFixed(2)}`, icon: Percent, color: 'text-orange-600', bg: 'bg-orange-100', sub: 'Total VAT/Tax' },
              ].map((card, i) => (
                <div key={i} className="rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
                      <card.icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                      <p className="text-2xl font-bold">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Financial Performance Summary</h3>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Profitability: {financialSummary.profitMargin > 20 ? 'Good' : 'Review Costs'}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                        Profit Margin
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-primary">
                        {financialSummary.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-muted">
                    <div style={{ width: `${financialSummary.profitMargin}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">Total Discounts</p>
                    <p className="text-lg font-semibold text-red-600">-${totalDiscounts.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">Avg. Profit / Sale</p>
                    <p className="text-lg font-semibold text-primary">${(totalTransactions > 0 ? financialSummary.grossProfit / totalTransactions : 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'staff' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <ReportControls />

            {/* Staff Aggregation Logic */}
            {(() => {
              // Aggregate data
              const staffStats = filteredOrders.reduce((acc: any, order: Order) => {
                const name = order.staff_name || order.staff_id || 'System';
                const staffRole = order.staff?.role || ((order.staff_name || order.staff_id) ? 'Sales Associate' : 'System');
                if (!acc[name]) {
                  acc[name] = {
                    name,
                    transactions: 0,
                    total: 0,
                    discounts: 0,
                    role: staffRole.charAt(0).toUpperCase() + staffRole.slice(1).toLowerCase()
                  };
                }

                acc[name].transactions += 1;
                acc[name].total += parsePrice(order.grand_total);
                acc[name].discounts += parsePrice(order.discount_total || 0);
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
                                onClick={() => setSelectedStaff({ name: staff.name, data: staff })}
                                className="text-sm font-medium text-primary hover:underline"
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
      <AnimatedModal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <div className="w-[500px] max-h-[90vh] overflow-y-auto no-scrollbar">
            <div ref={receiptRef}>
              <OrderReceipt
                order={selectedOrder}
                onPrint={() => handlePrintInvoice(selectedOrder)}
              />
            </div>
            <div className="p-4 bg-white border-t border-border sticky bottom-0 flex gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 rounded-lg border border-border bg-white py-2.5 font-medium hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadInvoice(selectedOrder)}
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
      <AnimatedModal isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)}>
        {selectedStaff && (
          <div className="w-[600px] bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                  {selectedStaff.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedStaff.name}</h2>
                  <p className="text-muted-foreground">Sales Representative • Active</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-xl font-bold text-green-600">${selectedStaff.data.total.toFixed(2)}</p>
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
                      {orders
                        .filter((o: Order) => o.staff_id === selectedStaff.name)
                        .slice(0, 5) // Last 5
                        .map((order: Order) => (
                          <tr key={order.id} className="border-t border-border">
                            <td className="px-3 py-2">#{order.order_number?.toUpperCase() || order.id.slice(-6).toUpperCase()}</td>
                            <td className="px-3 py-2 text-muted-foreground">{formatDateTime(order.created_at)}</td>
                            <td className="px-3 py-2 text-right font-medium">${Number(order.grand_total).toFixed(2)}</td>
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
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Download Settings Modal */}
      <AnimatedModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)}>
        <div className="w-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Export Settings</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configure your invoice batch</p>
            </div>
            <div className="size-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Download className="size-6" />
            </div>
          </div>

          <div className="space-y-6">

            {/* Invoice Code Customization */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Code Logic</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDlMode('original')}
                  className={`p-4 rounded-2xl border transition-all text-left ${dlMode === 'original' ? 'border-brand-primary bg-brand-primary/5 ring-4 ring-brand-primary/5' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                >
                  <p className="text-xs font-black uppercase tracking-widest mb-1">Original</p>
                  <p className="text-[10px] text-slate-500">Keep order #s</p>
                </button>
                <button
                  onClick={() => setDlMode('auto')}
                  className={`p-4 rounded-2xl border transition-all text-left ${dlMode === 'auto' ? 'border-brand-primary bg-brand-primary/5 ring-4 ring-brand-primary/5' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                >
                  <p className="text-xs font-black uppercase tracking-widest mb-1">Custom Auto</p>
                  <p className="text-[10px] text-slate-500">Prefix + Sequence</p>
                </button>
              </div>

              {dlMode === 'auto' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1">Prefix</p>
                    <input
                      type="text"
                      placeholder="INV-"
                      value={dlPrefix}
                      onChange={e => setDlPrefix(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1">Start No.</p>
                    <input
                      type="number"
                      value={dlStartNum}
                      onChange={e => setDlStartNum(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Custom Note */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Export Note</label>
              <textarea
                placeholder="e.g. Monthly Tax Report - Q2"
                value={dlNote}
                onChange={e => setDlNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 min-h-[80px] resize-none transition-all"
              />
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button
              onClick={() => setIsDownloadModalOpen(false)}
              className="flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={processBatchPDF}
              className="flex-[2] bg-brand-primary text-white rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/90 active:scale-95 transition-all"
            >
              Start Download ({selectedOrders.length})
            </button>
          </div>
        </div>
      </AnimatedModal>
    </AnimatedPage>
  );
}
