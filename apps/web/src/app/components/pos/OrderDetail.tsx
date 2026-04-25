import React from 'react';
import { Order, OrderItem } from '@/app/types';
import { Package, MapPin, Phone, User, Clock, CreditCard, Banknote, ScanLine, Printer, Eye, Share2, Heart } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { formatDate, formatTime, formatPaymentMethod } from '@/app/utils/format';

const parsePrice = (val: any): number => {
    if (val && typeof val === 'object' && 'usd' in val) return Number(val.usd);
    return Number(val) || 0;
};

interface OrderDetailProps {
    order: Order;
    onPreviewReceipt: () => void;
}

const getFlowerImage = (name: string): string => {
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

export function OrderDetail({ order, onPreviewReceipt }: OrderDetailProps) {
    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            {/* Top Grid: Status & Customer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Left: Order Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <Package className="size-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Order Status</h4>
                            <p className="text-xs text-muted-foreground">Placed on {formatDate(order.created_at)} at {formatTime(order.created_at)}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            order.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' : 
                            order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                            {order.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-100">
                            {order.order_type}
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-100">
                            {formatPaymentMethod(order.payment_method || 'credit')}
                        </span>
                    </div>
                </div>

                {/* Right: Customer Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <User className="size-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Customer Details</h4>
                            <p className="text-xs text-muted-foreground">{order.customer_name || 'Guest Customer'}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {order.customer_phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Phone className="size-3.5 text-muted-foreground" />
                                <span>{order.customer_phone}</span>
                            </div>
                        )}
                        {order.order_type === 'delivery' && order.delivery_address && (
                            <div className="flex items-start gap-2 text-xs text-slate-600">
                                <MapPin className="size-3.5 mt-0.5 text-muted-foreground" />
                                <span className="flex-1">{order.delivery_address}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="mb-8">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Order Items</h4>
                <div className="space-y-3">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border border-slate-50 bg-slate-50/30">
                            <div className="size-14 rounded-lg overflow-hidden border border-white shadow-sm">
                                <ImageWithFallback 
                                    src={item.product?.image_url || getFlowerImage(item.product_name_snapshot)} 
                                    alt={item.product_name_snapshot}
                                    className="size-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-bold text-slate-900 truncate">{item.product_name_snapshot}</h5>
                                <p className="text-xs text-muted-foreground">{item.quantity} x ${parsePrice(item.unit_price).toFixed(2)}</p>
                                {item.addons && item.addons.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {item.addons.map((addon: any, aIdx: number) => (
                                            <span key={aIdx} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-100 text-slate-500">
                                                + {addon.name_snapshot}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-black text-slate-900">${parsePrice(item.line_total).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Summary */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 pt-6 border-t border-dashed border-slate-200">
                <div className="flex gap-2">
                    <button 
                        onClick={onPreviewReceipt}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                    >
                        <Eye className="size-3.5" />
                        Preview Receipt
                    </button>
                </div>

                <div className="w-full md:w-64 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-bold text-slate-900">${parsePrice(order.subtotal).toFixed(2)}</span>
                    </div>
                    {Number(order.tax_total) > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Tax (5%)</span>
                            <span className="font-bold text-slate-900">${parsePrice(order.tax_total).toFixed(2)}</span>
                        </div>
                    )}
                    {order.order_type === 'delivery' && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Delivery Fee</span>
                            <span className="font-bold text-slate-900">${parsePrice(order.delivery_fee).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-black text-brand-primary pt-2 border-t border-slate-100">
                        <span>Total</span>
                        <span>${parsePrice(order.grand_total).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
