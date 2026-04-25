import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, CheckCircle, XCircle, Loader2, Package, Calendar, ChevronRight, Printer, Search, Filter, ChevronDown, RefreshCw, ShoppingBag, Wallet, Banknote, CreditCard, ScanLine, Delete, User, Sparkles, Instagram } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Order, OrderStatus, OrderItem, Addon } from '@/app/types';
import { AnimatedModal } from '../motion/AnimatedPage';
import { useState, useEffect, useMemo } from 'react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { OrderReceipt } from '@/app/components/orders/OrderReceipt';
import { OrderShareCard } from '@/app/components/orders/OrderShareCard';
import { OrderDetail } from './OrderDetail';
import { formatDate, formatTime, formatPaymentMethod } from '@/app/utils/format';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { domToCanvas } from 'modern-screenshot';
import { useRef } from 'react';

const parsePrice = (val: any): number => {
    if (val && typeof val === 'object' && 'usd' in val) return Number(val.usd);
    return Number(val) || 0;
};

const getFlowerImage = (name: string, categoryId?: string): string => {
    const imageMap: Record<string, string> = {
        'Red Roses': 'photo-1518709594023-6eab9bab7b23?w=800&h=800&fit=crop',
        'White Lilies': 'photo-1602492275880-1b23c1a8e6f1?w=800&h=800&fit=crop',
        'Tulips Bouquet': 'photo-1520763185298-1b434c919102?w=800&h=800&fit=crop',
        'Orchid Plant': 'photo-1525310072745-f49212b5ac6d?w=800&h=800&fit=crop',
        'Sunflowers': 'photo-1470509037663-253afd7f0f51?w=800&h=800&fit=crop',
        'Mixed Bouquet': 'photo-1490750967868-88aa4486c946?w=800&h=800&fit=crop',
        'Pink Peonies': 'photo-1522348693650-dc5c2347e082?w=800&h=800&fit=crop',
        'Carnations': 'photo-1585821569331-f071db2abd8d?w=800&h=800&fit=crop',
        'Daisies': 'photo-1463320898484-cdae8bccd79e?w=800&h=800&fit=crop',
        'Hydrangeas': 'photo-1558603668-6570496b66f8?w=800&h=800&fit=crop',
        'Lavender Bouquet': 'photo-1499002238440-d264edd596ec?w=800&h=800&fit=crop',
        'Exotic Tropicals': 'photo-1601002354177-a2e88c27a23f?w=800&h=800&fit=crop',
    };
    const imageId = imageMap[Object.keys(imageMap).find(k => name.includes(k)) || ''] || 'photo-1490750967868-88aa4486c946?w=800&h=800&fit=crop';
    return `https://images.unsplash.com/${imageId}&q=80`;
};

interface OrderListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OrderListModal({ isOpen, onClose }: OrderListModalProps) {
    const { orders, refreshOrders, updateOrderStatus, updateOrderPayment, isLoading } = useApp();
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [printingOrders, setPrintingOrders] = useState<Order[]>([]);
    const [payingOrder, setPayingOrder] = useState<Order | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'qr'>('cash');
    const [paymentStep, setPaymentStep] = useState<'select' | 'cash'>('select');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
    
    // Batch Print State
    const [batchOrder, setBatchOrder] = useState<Order | null>(null);
    const batchRef = useRef<HTMLDivElement>(null);
    const [isPrintingAll, setIsPrintingAll] = useState(false);
    
    // Share State
    const [shareOrder, setShareOrder] = useState<Order | null>(null);
    const shareRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [shareMessage, setShareMessage] = useState('');
    
    // REMOVED: Auto-trigger print when orders are selected
    // We'll use the PDF approach for better quality and page breaks
    
    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('active');
    const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'all'>('today');

    useEffect(() => {
        if (isOpen) {
            handleRefresh();
        }
    }, [isOpen, dateFilter, selectedStatus]);

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
        });
    };

    const handleCollectPayment = async () => {
        if (!payingOrder) return;
        setIsProcessingPayment(true);
        try {
            await updateOrderPayment(payingOrder.id, 'completed', paymentMethod);
            toast.success('Payment collected successfully!');
            setPayingOrder(null);
            setPaymentStep('select');
            setReceivedAmount('');
            handleRefresh();
        } catch (error) {
            toast.error('Failed to collect payment');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handlePrintAll = async () => {
        if (displayOrders.length === 0) {
            toast.error('No orders to print');
            return;
        }

        setIsPrintingAll(true);
        const toastId = toast.loading(`Preparing 0 of ${displayOrders.length} receipts...`);
        
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            for (let i = 0; i < displayOrders.length; i++) {
                const order = displayOrders[i];
                toast.loading(`Processing receipt ${i + 1} of ${displayOrders.length}...`, { id: toastId });
                
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

                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                }
            }

            // Generate blob and print
            const pdfBlob = pdf.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            
            // Open in new tab and print
            const printWindow = window.open(blobUrl);
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            } else {
                // Fallback: just download it
                pdf.save(`batch-receipts-${new Date().getTime()}.pdf`);
                toast.info('Pop-up blocked. PDF downloaded instead.', { id: toastId });
            }

            setBatchOrder(null);
            toast.success(`Generated ${displayOrders.length} receipts`, { id: toastId });
        } catch (error) {
            console.error('Batch Print Error:', error);
            toast.error('Failed to generate batch receipts', { id: toastId });
            setBatchOrder(null);
        } finally {
            setIsPrintingAll(false);
        }
    };

    const handleDownloadShareCard = async () => {
        if (!shareRef.current || !shareOrder) return;
        
        setIsSharing(true);
        const toastId = toast.loading('Creating beautiful card...');
        
        try {
            const dataUrl = await domToCanvas(shareRef.current, {
                scale: 3, // Higher scale for IG quality
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

    const displayOrders = useMemo(() => {
        return (orders || []).filter((order: Order) => 
            order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [orders, searchQuery]);

    const toggleOrderExpansion = (orderId: string) => {
        setExpandedOrders((prev: Set<string>) => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'preparing': return 'bg-blue-100 text-blue-700 border-blue-200';

            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return Clock;
            case 'preparing': return Loader2;

            case 'completed': return CheckCircle;
            case 'cancelled': return XCircle;
            default: return Package;
        }
    };

    return (
        <AnimatedModal isOpen={isOpen} onClose={onClose}>
            <div className="flex h-[85vh] w-[850px] max-w-full flex-col overflow-hidden rounded-3xl bg-white shadow-xl relative mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-6 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold">POS Order History</h2>
                        <p className="text-muted-foreground text-sm">Quickly manage and update recent boutique orders</p>
                    </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handlePrintAll}
                                disabled={isPrintingAll || displayOrders.length === 0}
                                className="flex h-10 items-center gap-2 rounded-xl bg-brand-primary/10 px-4 text-xs font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary/20 transition-all disabled:opacity-50"
                                title="Print all filtered orders"
                            >
                                <Printer className={`size-4 ${isPrintingAll ? 'animate-spin' : ''}`} />
                                {isPrintingAll ? 'Processing...' : 'Print All'}
                                <span className="flex size-5 items-center justify-center rounded-full bg-brand-primary text-[10px] text-white">
                                    {displayOrders.length}
                                </span>
                            </button>
                            <button 
                                onClick={handleRefresh}
                                className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
                            >
                                <RefreshCw className={`size-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={onClose}
                                className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col gap-4 border-b border-border bg-slate-50/50 p-6 pt-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search Order #..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/10"
                            />
                        </div>

                        <div className="flex rounded-xl border border-border bg-white p-1">
                            {[
                                { id: 'today', label: 'Today' },
                                { id: 'yesterday', label: '1D' },
                                { id: 'week', label: '7D' },
                                { id: 'all', label: 'All' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setDateFilter(tab.id as any)}
                                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                                        dateFilter === tab.id 
                                            ? 'bg-brand-primary text-white shadow-sm' 
                                            : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative min-w-[140px]">
                            <Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="h-10 w-full appearance-none rounded-xl border border-border bg-white pl-10 pr-8 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/10"
                            >
                                <option value="active">Active Orders</option>
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="preparing">Preparing</option>

                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="space-y-4">
                        {displayOrders.map((order: Order) => {
                            const StatusIcon = getStatusIcon(order.status);
                            const isExpanded = expandedOrders.has(order.id);

                            return (
                                <div key={order.id} className={`rounded-2xl border border-border overflow-hidden transition-all hover:bg-muted/30 ${isExpanded ? 'ring-2 ring-brand-primary/10' : ''}`}>
                                    <div className="flex items-start gap-4 p-4">
                                        <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl border ${getStatusColor(order.status)}`}>
                                            <StatusIcon className={`size-6 ${order.status === 'preparing' ? 'animate-spin' : ''}`} />

                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-bold text-lg">Order #{order.order_number?.toUpperCase() || order.id.slice(-6).toUpperCase()}</h3>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="size-3" />
                                                    {formatTime(order.created_at)}
                                                </span>
                                            </div>
                                            {order.customer_name && (
                                                <p className="text-[11px] font-bold text-brand-primary mb-2 flex items-center gap-1">
                                                    <User className="size-3" />
                                                    {order.customer_name}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex -space-x-2">
                                                    {order.items.slice(0, 3).map((item: OrderItem, idx: number) => (
                                                        <div key={idx} className="size-8 rounded-lg overflow-hidden border-2 border-white bg-muted">
                                                            <ImageWithFallback
                                                                src={item.product?.image_url || getFlowerImage(item.product_name_snapshot)}
                                                                alt={item.product_name_snapshot}
                                                                className="size-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                    {order.items.length > 3 && (
                                                        <div className="size-8 rounded-lg bg-muted border-2 border-white flex items-center justify-center">
                                                            <span className="text-[10px] font-bold text-muted-foreground">+{order.items.length - 3}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{order.items.length} items • {order.order_type || 'POS'}</span>
                                            </div>

                                            <div className="flex gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                                <span className="flex items-center gap-1 text-brand-primary">
                                                    <RefreshCw className="size-3" />
                                                    {formatPaymentMethod(order.payment_method || 'credit')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-3" />
                                                    {formatDate(order.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Grand Total</div>
                                                <span className="text-xl font-black text-brand-primary">${parsePrice(order.grand_total).toFixed(2)}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Pay Button for Pay Later */}
                                                {order.payment_method === 'pay_later' && order.status !== 'completed' && order.status !== 'cancelled' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setPayingOrder(order); }}
                                                        className="flex h-8 items-center gap-2 rounded-lg bg-green-600 px-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-green-700 transition-all shadow-md shadow-green-600/20"
                                                        title="Collect Payment"
                                                    >
                                                        <Wallet className="size-3" />
                                                        Pay
                                                    </button>
                                                )}

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePrintSingle(order); }}
                                                    className="flex size-8 items-center justify-center rounded-lg bg-muted hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                                                    title="Print Order"
                                                >
                                                    <Printer className="size-4" />
                                                </button>

                                                <select
                                                    value={order.status}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                                    className={`h-8 rounded-lg border px-2 text-[10px] font-black uppercase tracking-wider outline-none transition-all max-w-[120px] ${getStatusColor(order.status)}`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="preparing">Preparing</option>

                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>

                                                <button
                                                    onClick={() => toggleOrderExpansion(order.id)}
                                                    className={`flex size-8 items-center justify-center rounded-lg bg-muted hover:bg-brand-primary hover:text-white transition-all ${isExpanded ? 'bg-brand-primary text-white' : ''}`}
                                                >
                                                    <ChevronRight className={`size-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden border-t border-dashed border-border"
                                            >
                                                <div className="p-6 bg-slate-50/50">
                                                    <OrderDetail 
                                                        order={order} 
                                                        onPreviewReceipt={() => setPreviewOrder(order)}
                                                        onShare={() => openShareModal(order)}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}

                        {displayOrders.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                                <div className="rounded-full bg-slate-50 p-8 mb-6">
                                    <ShoppingBag className="size-16 opacity-10" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">No orders found</h3>
                                <p className="text-sm max-w-[250px] text-center mt-2">We couldn't find any orders matching your current filters.</p>
                                <button 
                                    onClick={() => { setDateFilter('all'); setSelectedStatus('all'); setSearchQuery(''); }}
                                    className="mt-6 text-sm font-black text-brand-primary uppercase tracking-widest hover:underline"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Payment Selection Sub-Modal Overlay */}
                <AnimatePresence>
                    {payingOrder && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4"
                            onClick={() => {
                                setPayingOrder(null);
                                setPaymentStep('select');
                                setReceivedAmount('');
                            }}
                        >
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                transition={{ type: 'spring', damping: 30, stiffness: 500 }}
                                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-8">
                                    {paymentStep === 'select' ? (
                                        <>
                                            <div className="text-center mb-8">
                                                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                                                    <Wallet className="size-8" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-slate-900">Collect Payment</h3>
                                                <p className="text-slate-500 mt-1">Order <span className="font-bold text-slate-900">#{payingOrder.order_number}</span></p>
                                                <div className="mt-4 text-3xl font-black text-brand-primary">${parsePrice(payingOrder.grand_total).toFixed(2)}</div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 mb-8">
                                                {[
                                                    { id: 'cash', label: 'Cash', icon: Banknote },
                                                    { id: 'credit', label: 'Credit Card', icon: CreditCard },
                                                    { id: 'qr', label: 'QR Code', icon: ScanLine },
                                                ].map((method) => (
                                                    <button
                                                        key={method.id}
                                                        onClick={() => {
                                                            setPaymentMethod(method.id as any);
                                                            if (method.id === 'cash') {
                                                                setPaymentStep('cash');
                                                            }
                                                        }}
                                                        className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                                                            paymentMethod === method.id
                                                                ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                                                                : 'border-slate-100 hover:border-slate-200 text-slate-500'
                                                        }`}
                                                    >
                                                        <method.icon className="size-6" />
                                                        <span className="font-bold text-[10px] uppercase tracking-wider">{method.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => setPayingOrder(null)}
                                                    className="flex-1 h-14 rounded-xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50 transition-all font-sans"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleCollectPayment}
                                                    disabled={isProcessingPayment}
                                                    className="flex-[2] h-14 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 disabled:opacity-50"
                                                >
                                                    {isProcessingPayment ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle className="size-5" />}
                                                    {isProcessingPayment ? 'Processing...' : 'Complete Payment'}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mb-4 flex items-center justify-between">
                                                <button onClick={() => setPaymentStep('select')} className="text-sm font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1">
                                                    <ChevronRight className="size-4 rotate-180" />
                                                    Back
                                                </button>
                                                <h3 className="font-black uppercase tracking-widest text-xs text-slate-900">Cash Payment</h3>
                                                <div className="w-12" />
                                            </div>

                                            <div className="mb-6 rounded-[2rem] bg-slate-50 p-6 space-y-3 border border-slate-100">
                                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
                                                    <span>Total Due</span>
                                                    <span className="text-slate-900">${parsePrice(payingOrder.grand_total).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Received</span>
                                                    <span className="text-3xl font-black text-brand-primary">${receivedAmount || '0'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                                    <span className="text-slate-400">Change</span>
                                                    <span className="text-green-600 font-black">
                                                        ${Math.max(0, (parseFloat(receivedAmount || '0') - parsePrice(payingOrder.grand_total))).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Keypad */}
                                            <div className="grid grid-cols-3 gap-2 mb-6">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((key) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setReceivedAmount(prev => prev + key.toString())}
                                                        className="flex h-12 items-center justify-center rounded-xl bg-slate-50 text-lg font-black hover:bg-slate-100 transition-all border border-slate-100"
                                                    >
                                                        {key}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setReceivedAmount(prev => prev.slice(0, -1))}
                                                    className="flex h-12 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100"
                                                >
                                                    <Delete className="size-5" />
                                                </button>
                                            </div>

                                            {/* Denominations */}
                                            <div className="flex gap-2 mb-6">
                                                {[10, 20, 50, 100].map(amt => (
                                                    <button
                                                        key={amt}
                                                        onClick={() => setReceivedAmount(amt.toString())}
                                                        className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                                                    >
                                                        ${amt}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setReceivedAmount('')}
                                                    className="flex-1 h-14 rounded-xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    onClick={handleCollectPayment}
                                                    disabled={isProcessingPayment || parseFloat(receivedAmount || '0') < parsePrice(payingOrder.grand_total)}
                                                    className="flex-[2] h-14 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isProcessingPayment ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle className="size-5" />}
                                                    {isProcessingPayment ? 'Processing...' : 'Complete Payment'}
                                                </button>
                                            </div>
                                        </>
                                    )}
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
                            className="absolute inset-0 z-[80] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={() => setShareOrder(null)}
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-transparent pointer-events-auto flex flex-col md:flex-row items-center gap-8 max-w-[95%] lg:max-w-4xl"
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

                {/* Receipt Preview Overlay */}
                <AnimatePresence>
                    {previewOrder && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setPreviewOrder(null)}
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-3xl shadow-2xl overflow-hidden max-h-full overflow-y-auto pointer-events-auto"
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
            </div>

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
        </AnimatedModal>
    );
}
