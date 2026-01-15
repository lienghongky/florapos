import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, CheckCircle, XCircle, Loader2, Package, Calendar, ChevronRight, Printer } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Sale, SaleStatus } from '@/app/context/AppContext';
import { AnimatedModal } from '../motion/AnimatedPage';
import { useState } from 'react';

interface OrderListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OrderListModal({ isOpen, onClose }: OrderListModalProps) {
    const { sales, updateSaleStatus } = useApp();
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

    const toggleOrderExpansion = (orderId: string) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const getStatusColor = (status: SaleStatus) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: SaleStatus) => {
        switch (status) {
            case 'pending': return Clock;
            case 'processing': return Loader2;
            case 'completed': return CheckCircle;
            case 'cancelled': return XCircle;
            default: return Package;
        }
    };

    return (
        <AnimatedModal isOpen={isOpen} onClose={onClose}>
            <div className="flex h-[80vh] w-[800px] flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-6">
                    <div>
                        <h2 className="text-2xl font-bold">Order List</h2>
                        <p className="text-muted-foreground">Manage recent orders and track status</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="space-y-4">
                        {sales.map((sale) => {
                            const StatusIcon = getStatusIcon(sale.status);
                            const isExpanded = expandedOrders.has(sale.id);

                            return (
                                <div key={sale.id} className="rounded-2xl border border-border overflow-hidden transition-all hover:bg-muted/30">
                                    <div className="flex items-start gap-4 p-4">
                                        {/* Icon/Status Indicator */}
                                        <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl border ${getStatusColor(sale.status)}`}>
                                            <StatusIcon className="size-6" />
                                        </div>

                                        {/* Order Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-bold text-lg">Order #{sale.id.slice(-6).toUpperCase()}</h3>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="size-3" />
                                                    {new Date(sale.date).toLocaleTimeString()}
                                                </span>
                                            </div>

                                            {/* Item Thumbnails */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex -space-x-2">
                                                    {sale.items.slice(0, 3).map((item, idx) => (
                                                        <div key={idx} className="size-8 rounded-lg overflow-hidden border-2 border-white bg-muted">
                                                            <img
                                                                src="https://images.unsplash.com/photo-1520763185298-1b434c919102?w=80&h=80&fit=crop"
                                                                alt={item.product.name}
                                                                className="size-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                    {sale.items.length > 3 && (
                                                        <div className="size-8 rounded-lg bg-muted border-2 border-white flex items-center justify-center">
                                                            <span className="text-[10px] font-bold text-muted-foreground">+{sale.items.length - 3}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm text-muted-foreground">{sale.items.length} items</span>
                                            </div>

                                            <div className="flex gap-4 text-sm text-muted-foreground">
                                                <span>{sale.paymentMethod}</span>
                                                <span>•</span>
                                                <span>{sale.salesPerson}</span>
                                            </div>
                                        </div>

                                        {/* Total & Actions */}
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground mb-1">Total</div>
                                                <span className="text-xl font-bold text-brand-primary">${sale.total.toFixed(2)}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Print Button */}
                                                <button
                                                    onClick={() => window.print()}
                                                    className="flex size-8 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                                                    title="Print Order"
                                                >
                                                    <Printer className="size-4" />
                                                </button>

                                                {/* Status Select */}
                                                <select
                                                    value={sale.status}
                                                    onChange={(e) => updateSaleStatus(sale.id, e.target.value as SaleStatus)}
                                                    className={`h-8 rounded-lg border px-2 text-xs font-medium outline-none transition-colors max-w-[120px] ${getStatusColor(sale.status)}`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>

                                                {/* Expand Button */}
                                                <button
                                                    onClick={() => toggleOrderExpansion(sale.id)}
                                                    className="flex size-8 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                                                >
                                                    <ChevronRight className={`size-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden border-t border-border"
                                            >
                                                <div className="p-6 bg-muted/30">
                                                    <div className="grid grid-cols-2 gap-6">
                                                        {/* Left Column: Items */}
                                                        <div>
                                                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                                                <Package className="size-4" />
                                                                Order Items
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {sale.items.map((item, idx) => {
                                                                    const optionsPrice = item.selectedOptions?.reduce((acc, opt) => acc + opt.price, 0) || 0;
                                                                    const unitPrice = item.product.price + optionsPrice;

                                                                    return (
                                                                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-white">
                                                                            <div className="size-12 rounded-lg overflow-hidden bg-muted shrink-0">
                                                                                <img
                                                                                    src="https://images.unsplash.com/photo-1520763185298-1b434c919102?w=80&h=80&fit=crop"
                                                                                    alt={item.product.name}
                                                                                    className="size-full object-cover"
                                                                                />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="font-medium text-sm truncate">{item.product.name}</div>
                                                                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                                        {item.selectedOptions.map(opt => (
                                                                                            <span key={opt.optionId} className="text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded font-medium">
                                                                                                + {opt.name}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                                    ${unitPrice.toFixed(2)} × {item.quantity}
                                                                                </div>
                                                                            </div>
                                                                            <div className="font-bold text-sm">
                                                                                ${(unitPrice * item.quantity).toFixed(2)}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Right Column: Order Summary & Details */}
                                                        <div className="space-y-4">
                                                            {/* Order Summary */}
                                                            <div className="rounded-xl bg-white p-4">
                                                                <h4 className="font-semibold text-sm mb-3">Order Summary</h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Subtotal</span>
                                                                        <span className="font-medium">${(sale.subtotal || sale.total).toFixed(2)}</span>
                                                                    </div>
                                                                    {sale.discount && sale.discount > 0 && (
                                                                        <div className="flex justify-between text-green-600">
                                                                            <span>Discount</span>
                                                                            <span className="font-medium">-${sale.discount.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    {sale.tax && sale.tax > 0 && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Tax</span>
                                                                            <span className="font-medium">${sale.tax.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    {sale.serviceType === 'delivery' && sale.deliveryFee && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Delivery Fee</span>
                                                                            <span className="font-medium">${sale.deliveryFee.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between pt-2 border-t border-border">
                                                                        <span className="font-bold">Total</span>
                                                                        <span className="font-bold text-brand-primary text-lg">${sale.total.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Delivery/Service Info */}
                                                            {(sale.serviceType || sale.address) && (
                                                                <div className="rounded-xl bg-white p-4">
                                                                    <h4 className="font-semibold text-sm mb-3">Service Details</h4>
                                                                    <div className="space-y-2 text-sm">
                                                                        {sale.serviceType && (
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-muted-foreground">Type:</span>
                                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sale.serviceType === 'delivery'
                                                                                    ? 'bg-blue-100 text-blue-700'
                                                                                    : 'bg-green-100 text-green-700'
                                                                                    }`}>
                                                                                    {sale.serviceType === 'delivery' ? 'Delivery' : 'Pick Up'}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {sale.address && (
                                                                            <div>
                                                                                <span className="text-muted-foreground">Address:</span>
                                                                                <p className="mt-1 text-foreground">{sale.address}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Order Note */}
                                                            {sale.note && (
                                                                <div className="rounded-xl bg-white p-4">
                                                                    <h4 className="font-semibold text-sm mb-2">Order Note</h4>
                                                                    <p className="text-sm text-muted-foreground italic">{sale.note}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}

                        {sales.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Package className="size-16 opacity-20 mb-4" />
                                <p>No orders found yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AnimatedModal>
    );
}
