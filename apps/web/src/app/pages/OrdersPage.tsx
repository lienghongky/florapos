import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, Calendar, ShoppingBag, ChevronDown, 
  ChevronRight, RefreshCw, Printer, Clock, 
  CheckCircle, XCircle, Package, ArrowUpRight, X,
  Instagram, Loader2, Sparkles
} from 'lucide-react';
import { useOrderStore } from '@/app/store/order-store';
import { useAuthStore } from '@/app/store/auth-store';
import { Order, OrderStatus } from '@/app/types';
import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { OrderReceipt } from '@/app/components/orders/OrderReceipt';
import { OrderShareCard } from '@/app/components/orders/OrderShareCard';
import { OrderDetail } from '@/app/components/pos/OrderDetail';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { domToCanvas } from 'modern-screenshot';
import { useRef } from 'react';
import { formatDate, formatTime, formatPaymentMethod } from '@/app/utils/format';
import { PageHeader } from '@/app/components/ui/page-header';

const parsePrice = (val: any): number => {
  if (val && typeof val === 'object' && 'usd' in val) return Number(val.usd);
  return Number(val) || 0;
};

export function OrdersPage() {
  const { orders, totalOrders, refreshOrders, updateOrderStatus, isOrdersLoading } = useOrderStore();
  const { selectedStore } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'all'>('today');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [printingOrders, setPrintingOrders] = useState<Order[]>([]);

  // Batch Print State
  const [batchOrder, setBatchOrder] = useState<Order | null>(null);
  const batchRef = useRef<HTMLDivElement>(null);

  // Share State
  const [shareOrder, setShareOrder] = useState<Order | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // Pagination State
  const [currentPage, setCurrentPageNum] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // REMOVED: Auto-trigger print

  // Initial load
  useEffect(() => {
    handleRefresh();
  }, [dateFilter, selectedStatus, currentPage, itemsPerPage, searchQuery]);

  const handleRefresh = async () => {
    let startDate: string | undefined;
    let endDate: string | undefined = new Date().toISOString().split('T')[0];

    const today = new Date();
    if (dateFilter === 'today') {
      startDate = today.toISOString().split('T')[0];
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = yesterday.toISOString().split('T')[0];
      endDate = startDate;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
    }

    await refreshOrders({
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      startDate,
      endDate: dateFilter === 'all' ? undefined : endDate,
      search: searchQuery || undefined,
      page: currentPage,
      limit: itemsPerPage
    });
  };

  const handlePrintSingle = async (order: Order) => {
    const toastId = toast.loading(`Generating receipt...`);
    
    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        setBatchOrder(order);
        
        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 300));

        if (batchRef.current) {
            const canvas = await domToCanvas(batchRef.current, {
                scale: 2,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            // Generate blob and print
            const pdfBlob = pdf.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            
            const printWindow = window.open(blobUrl);
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            } else {
                pdf.save(`receipt-${order.order_number?.toLowerCase() || order.id.slice(-6)}.pdf`);
            }
        }

        setBatchOrder(null);
        toast.success(`Receipt ready`, { id: toastId });
    } catch (error) {
        console.error('Print Error:', error);
        toast.error('Failed to generate receipt', { id: toastId });
        setBatchOrder(null);
    }
  };

  const handleDownloadShareCard = async () => {
    if (!shareRef.current || !shareOrder) return;
    
    setIsSharing(true);
    const toastId = toast.loading('Creating beautiful card...');
    
    try {
        const dataUrl = await domToCanvas(shareRef.current, {
            scale: 3,
            backgroundColor: '#ffffff'
        });
        
        const link = document.createElement('a');
        link.download = `gift-card-${shareOrder.order_number?.toLowerCase() || shareOrder.id.slice(-6)}.png`;
        link.href = dataUrl.toDataURL('image/png');
        link.click();
        
        toast.success('Ready to share!', { id: toastId });
    } catch (error) {
        console.error('Share Error:', error);
        toast.error('Failed to create share card', { id: toastId });
    } finally {
        setIsSharing(false);
    }
  };

  const openShareModal = (order: Order) => {
    setShareOrder(order);
    setShareMessage(order.notes || '');
  };

  const filteredOrders = orders || [];
  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return { color: 'text-yellow-600 bg-yellow-50 border-yellow-100', icon: Clock };
      case 'preparing': return { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: RefreshCw };

      case 'completed': return { color: 'text-green-600 bg-green-50 border-green-100', icon: CheckCircle };
      case 'cancelled': return { color: 'text-red-600 bg-red-50 border-red-100', icon: XCircle };
      default: return { color: 'text-gray-600 bg-gray-50 border-gray-100', icon: Package };
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <AnimatedPage className="space-y-6 pb-20">
      <PageHeader 
        title="Orders Management" 
        subtitle="Track, filter, and manage all your store transactions"
        action={
          <>
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:bg-muted active:scale-95"
            >
              <RefreshCw className={`size-4 ${isOrdersLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </>
        }
      />


      {/* Filters Bar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Order #, ID, or Staff..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPageNum(1);
            }}
            className="h-12 w-full rounded-2xl border border-border bg-white pl-11 pr-4 text-sm font-medium outline-none ring-brand-primary/10 transition-all focus:ring-4"
          />
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 rounded-2xl border border-border bg-white p-1">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: '7D' },
            { id: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setDateFilter(tab.id as any);
                setCurrentPageNum(1);
              }}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                dateFilter === tab.id 
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPageNum(1);
            }}
            className="h-12 w-full appearance-none rounded-2xl border border-border bg-white pl-11 pr-10 text-sm font-bold outline-none ring-brand-primary/10 transition-all focus:ring-4"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>

            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order: Order) => {
            const isExpanded = expandedOrderId === order.id;
            const statusCfg = getStatusConfig(order.status);
            const StatusIcon = statusCfg.icon;

            return (
              <div 
                key={order.id} 
                className={`group overflow-hidden rounded-3xl border border-border bg-white transition-all hover:shadow-md ${isExpanded ? 'ring-2 ring-brand-primary/20' : ''}`}
              >
                {/* Main Row */}
                <div 
                  className="flex cursor-pointer items-center gap-4 p-5 md:gap-8"
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                >
                  {/* Status Icon */}
                  <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border ${statusCfg.color}`}>
                    <StatusIcon className="size-7" />
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold tracking-tight">Order #{order.order_number?.toUpperCase() || order.id.slice(-6).toUpperCase()}</h3>
                      <span className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {order.order_type || 'Standard'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        {formatTime(order.created_at)}
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5">
                        <ShoppingBag className="size-3.5" />
                        {order.items.length} items
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 font-bold text-brand-primary/80">
                        <RefreshCw className="size-3.5" />
                        {formatPaymentMethod(order.payment_method || 'credit')}
                      </div>
                      <div className="hidden md:flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grand Total</p>
                    <p className="text-2xl font-black text-brand-primary">${parsePrice(order.grand_total).toFixed(2)}</p>
                  </div>

                  {/* Actions & Chevron */}
                  <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <select 
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                            className={`rounded-lg border border-border px-3 py-1.5 text-xs font-bold outline-none transition-all focus:ring-2 focus:ring-brand-primary/20 ${statusCfg.color}`}
                        >
                            <option value="pending">Mark Pending</option>
                            <option value="preparing">Mark Preparing</option>

                            <option value="completed">Mark Completed</option>
                            <option value="cancelled">Mark Cancelled</option>
                        </select>
                    </div>
                    <div className={`flex size-10 items-center justify-center rounded-xl bg-muted transition-all group-hover:bg-brand-primary group-hover:text-white ${isExpanded ? 'rotate-90 bg-brand-primary text-white' : ''}`}>
                      <ChevronRight className="size-5" />
                    </div>
                  </div>
                </div>

                {/* Expanded Details - Receipt Style */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-dashed border-border bg-slate-50/50 p-6 lg:p-10"
                    >
                      <div className="flex flex-col lg:flex-row gap-10 items-start">
                        {/* Order Detail UI */}
                        <div className="w-full lg:w-3/5">
                           <OrderDetail 
                             order={order} 
                             onPreviewReceipt={() => setPreviewOrder(order)}
                           />
                        </div>

                        {/* Quick Actions Side Panel */}
                        <div className="w-full lg:w-2/5 space-y-6">
                            <div className="rounded-3xl bg-white p-6 shadow-sm border border-border">
                                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => handlePrintSingle(order)}
                                        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border p-4 transition-all hover:bg-muted group"
                                    >
                                        <Printer className="size-6 text-brand-primary group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold">Print Invoice</span>
                                    </button>
                                    <button 
                                        onClick={() => openShareModal(order)}
                                        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border p-4 transition-all hover:bg-muted group"
                                    >
                                        <ArrowUpRight className="size-6 text-green-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold">Share Order</span>
                                    </button>
                                </div>
                            </div>

                            {/* Internal Notes Mock */}
                            <div className="rounded-3xl bg-white p-6 shadow-sm border border-border">
                                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">Internal Note</h4>
                                <textarea 
                                    className="w-full min-h-[100px] rounded-xl border border-border bg-muted/30 p-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 placeholder:italic"
                                    placeholder="Add private note about this order..."
                                    defaultValue={order.notes}
                                />
                                <button className="mt-3 w-full rounded-xl bg-muted py-2 text-xs font-bold text-muted-foreground hover:bg-brand-primary hover:text-white transition-all">
                                    Save Note
                                </button>
                            </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-full bg-muted p-10">
              <ShoppingBag className="size-20 opacity-10" />
            </div>
            <h3 className="text-xl font-bold">No orders found</h3>
            <p className="max-w-xs text-muted-foreground mt-2">Try adjusting your filters or searches to find what you're looking for.</p>
            <button 
                onClick={() => {
                    setDateFilter('all');
                    setSelectedStatus('all');
                    setSearchQuery('');
                }}
                className="mt-6 font-bold text-brand-primary hover:underline"
            >
                Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {orders.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPageNum(1);
              }}
              className="rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              {[10, 20, 50, 100].map(val => (
                <option key={val} value={val}>{val} items</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageNum(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex size-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition-all hover:bg-muted disabled:opacity-30 active:scale-95"
            >
              <ChevronDown className="size-5 rotate-90" />
            </button>
            <div className="flex items-center gap-1 px-4">
              <span className="text-sm font-bold text-slate-900">Page {currentPage} of {Math.max(1, totalPages)}</span>
              <span className="text-xs text-muted-foreground ml-2">({totalOrders} total)</span>
            </div>
            <button
              onClick={() => setCurrentPageNum(prev => prev + 1)}
              disabled={currentPage >= totalPages}
              className="flex size-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition-all hover:bg-muted disabled:opacity-30 active:scale-95"
            >
              <ChevronDown className="size-5 -rotate-90" />
            </button>
          </div>
        </div>
      )}

      {/* Receipt Preview Overlay */}
      <AnimatePresence>
        {previewOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewOrder(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 right-0 p-4 flex justify-end bg-white/80 backdrop-blur-md z-10">
                <button 
                  onClick={() => setPreviewOrder(null)}
                  className="size-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="px-8 pb-12">
                <OrderReceipt order={previewOrder} onPrint={() => handlePrintSingle(previewOrder)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShareOrder(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-transparent pointer-events-auto flex flex-col md:flex-row items-center gap-8 max-w-[90vw]"
              onClick={e => e.stopPropagation()}
            >
              <div ref={shareRef} className="shrink-0">
                <OrderShareCard order={shareOrder} storeName={selectedStore?.name} customMessage={shareMessage} />
              </div>
              
              <div className="flex flex-col gap-6 w-full max-w-[380px]">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-6 text-white">
                    <h4 className="text-lg font-black mb-4 flex items-center gap-2 italic">
                        <Sparkles className="size-5 text-yellow-300" />
                        Personalize Message
                    </h4>
                    <textarea 
                        value={shareMessage}
                        onChange={(e) => setShareMessage(e.target.value)}
                        placeholder="Type your gift message here..."
                        className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none font-serif italic"
                    />
                    <p className="text-[10px] text-white/50 mt-3 font-bold uppercase tracking-widest text-center">
                        This message will appear on the card
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleDownloadShareCard}
                        disabled={isSharing}
                        className="h-16 rounded-2xl bg-brand-primary text-white font-black flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                        {isSharing ? <Loader2 className="size-5 animate-spin" /> : <Instagram className="size-5" />}
                        {isSharing ? 'Generating Image...' : 'Save & Share to Instagram'}
                    </button>
                    <button 
                        onClick={() => setShareOrder(null)}
                        className="h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold hover:bg-white/20 transition-all"
                    >
                        Maybe Later
                    </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Batch Printing Area */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none opacity-0">
        <div ref={batchRef} className="bg-white p-8 w-[400px]">
          {batchOrder && <OrderReceipt order={batchOrder} />}
        </div>
      </div>

      {/* Legacy Printable Area for individual prints */}
      <div id="printable-area" className="hidden print:block fixed top-0 left-0 w-full bg-white z-[99999] opacity-100">
        {printingOrders.map((order: Order) => (
          <div key={order.id} className="printable-receipt">
            <OrderReceipt order={order} />
          </div>
        ))}
      </div>
    </AnimatedPage>
  );
}
