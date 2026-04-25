import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  History, Search, Filter, Download, ArrowDown, ShoppingBag, 
  Sliders, AlertTriangle, Clock, Calendar, User, ArrowRight,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Package
} from 'lucide-react';
import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useApp, InventoryHistoryLog, InventoryActionType } from '@/app/context/AppContext';
import { toast } from 'sonner';
import { formatDate, formatTime } from '@/app/utils/format';

export function InventoryHistoryPage() {
  const { getGlobalHistory } = useApp();
  const [history, setHistory] = useState<InventoryHistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<InventoryActionType | 'all'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getGlobalHistory({
        actionType: actionFilter,
        search: searchQuery,
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      setHistory(data);
    } catch (e) {
      toast.error('Failed to load inventory history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [actionFilter, dateRange.start, dateRange.end]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  // Action Configuration
  const actionConfig: Record<string, any> = {
    SALE: { icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Sale', desc: 'Direct product sale' },
    ADJUSTMENT: { icon: Sliders, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Adjustment', desc: 'Manual stock update' },
    RESTOCK: { icon: ArrowDown, color: 'text-green-600', bg: 'bg-green-50', label: 'Restock', desc: 'Inventory replenishment' },
    DAMAGE: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Damage', desc: 'Stock loss due to damage' },
    EXPIRED: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Expired', desc: 'Expired product removal' },
    STOCK_IN: { icon: ArrowDown, color: 'text-green-600', bg: 'bg-green-50', label: 'Stock In', desc: 'Initial or bulk entry' },
    COMPOSITE_DEDUCTION: { icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Recipe Usage', desc: 'Deducted via composite product sale' },
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const totalMovements = history.length;
    const additions = history.filter((h: InventoryHistoryLog) => h.quantityChange > 0).reduce((sum: number, h: InventoryHistoryLog) => sum + h.quantityChange, 0);
    const deductions = history.filter((h: InventoryHistoryLog) => h.quantityChange < 0).reduce((sum: number, h: InventoryHistoryLog) => sum + Math.abs(h.quantityChange), 0);
    const salesCount = history.filter((h: InventoryHistoryLog) => h.action === 'SALE' || h.action === 'COMPOSITE_DEDUCTION').length;

    return { totalMovements, additions, deductions, salesCount };
  }, [history]);

  return (
    <AnimatedPage className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <History className="size-8 text-primary" />
            Inventory History
          </h1>
          <p className="mt-1 text-muted-foreground font-medium">Audit trail of all stock movements across your store</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              const csv = [
                ['Date', 'Item', 'Action', 'Change', 'Previous', 'New', 'User', 'Reference', 'Notes'].join(','),
                ...history.map((h: InventoryHistoryLog) => [
                  new Date(h.date).toLocaleString(),
                  h.item?.name || 'N/A',
                  h.action,
                  h.quantityChange,
                  h.previousStock,
                  h.newStock,
                  h.userName,
                  h.referenceId || '',
                  h.note || ''
                ].join(','))
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `inventory-history-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 font-medium transition-all hover:bg-muted hover:shadow-sm"
          >
            <Download className="size-4" />
            Export Audit Log
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Movements', value: stats.totalMovements, icon: History, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Additions', value: `+${stats.additions}`, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Total Deductions', value: `-${stats.deductions}`, icon: TrendingDown, color: 'bg-red-50 text-red-600' },
          { label: 'Sales Deductions', value: stats.salesCount, icon: ShoppingBag, color: 'bg-purple-50 text-purple-600' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`flex size-12 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product name, reference, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </form>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/20">
              <Filter className="size-4 text-muted-foreground" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as any)}
                className="bg-transparent text-sm font-medium outline-none cursor-pointer"
              >
                <option value="all">All Actions</option>
                {Object.entries(actionConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/20">
              <Calendar className="size-4 text-muted-foreground" />
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange((prev: any) => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-sm font-medium outline-none cursor-pointer"
              />
              <ArrowRight className="size-3 text-muted-foreground" />
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange((prev: any) => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-sm font-medium outline-none cursor-pointer"
              />
            </div>
            
            <button 
              onClick={() => {
                setSearchQuery('');
                setActionFilter('all');
                setDateRange({ start: '', end: '' });
                fetchHistory();
              }}
              className="p-2 text-muted-foreground hover:text-primary transition-colors hover:bg-muted/50 rounded-lg"
              title="Clear Filters"
            >
              <History className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Timestamp</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Product / Item</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Action Type</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground text-center">Movement</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Stock Change</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Performed By</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-8">
                      <div className="h-4 bg-muted rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : history.length > 0 ? (
                history.map((log: InventoryHistoryLog, i: number) => {
                  const config = actionConfig[log.action] || { icon: History, color: 'text-gray-500', bg: 'bg-gray-50', label: log.action };
                  const isPositive = log.quantityChange > 0;
                  const isNegative = log.quantityChange < 0;

                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {formatDate(log.date)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(log.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/5 text-primary">
                            <Package className="size-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">{log.item?.name || 'Unknown Item'}</span>
                            {log.note && <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">"{log.note}"</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${config.bg} ${config.color} ring-current/20`}>
                          <config.icon className="size-3" />
                          {config.label}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center font-bold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'}`}>
                          {isPositive ? <TrendingUp className="size-4 mr-1" /> : isNegative ? <TrendingDown className="size-4 mr-1" /> : null}
                          {isPositive ? '+' : ''}{log.quantityChange}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="text-muted-foreground">{log.previousStock}</span>
                            <ArrowRight className="size-3 text-muted-foreground" />
                            <span className="text-foreground">{log.newStock}</span>
                          </div>
                          <div className="mt-1 w-24 h-1 rounded-full bg-muted overflow-hidden">
                            <div 
                              className={`h-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(log.quantityChange / (log.previousStock || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                             <User className="size-3 text-primary" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-medium text-foreground">{log.userName}</span>
                             <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{log.userRole}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.referenceId ? (
                          <div className="flex flex-col">
                             <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 p-1 rounded border border-border/50">
                               {log.referenceId}
                             </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <History className="size-16 mb-4" />
                      <p className="text-lg font-medium">No movement history found</p>
                      <p className="text-sm max-w-[250px] mx-auto mt-2">Adjust your filters or try searching for another term.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Placeholder */}
      <div className="flex items-center justify-between border-t border-border bg-white p-4 rounded-xl shadow-sm">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{history.length}</span> movements
        </p>
        <div className="flex gap-2">
          <button disabled className="p-2 rounded-lg border border-border bg-white text-muted-foreground hover:bg-muted disabled:opacity-50">
            <ChevronLeft className="size-5" />
          </button>
          <button disabled className="p-2 rounded-lg border border-border bg-white text-muted-foreground hover:bg-muted disabled:opacity-50">
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
}
