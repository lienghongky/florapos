import React from 'react';
import { Order, OrderItem, Addon } from '@/app/types';
import { Printer, Calendar, User, CreditCard, Tag, Info } from 'lucide-react';
import { formatDateTime, formatPaymentMethod } from '@/app/utils/format';
import { useAuthStore } from '@/app/store/auth-store';

const parsePrice = (val: any): number => {
    if (val && typeof val === 'object' && 'usd' in val) return Number(val.usd);
    return Number(val) || 0;
};

interface OrderReceiptProps {
    order: Order;
    onPrint?: () => void;
    storeOverride?: any;
    customInvoiceCode?: string;
    customNote?: string;
}

export function OrderReceipt({ order, onPrint, storeOverride, customInvoiceCode, customNote }: OrderReceiptProps) {
    const { user, selectedStore } = useAuthStore();
    const activeStore = storeOverride || selectedStore;
    const storeName = activeStore?.name || "FloraPos";
    const storeLogo = activeStore?.logo_url 
        ? (activeStore.logo_url.startsWith('blob:') || activeStore.logo_url.startsWith('data:') || activeStore.logo_url.startsWith('/api') 
            ? activeStore.logo_url 
            : `/api${activeStore.logo_url}`) 
        : null;
    const storeAddress = activeStore?.address;
    const storePhone = activeStore?.phone_number;
    const taxId = activeStore?.tax_id;
    const website = activeStore?.website;
    const footerText = activeStore?.receipt_footer_text || "Thank you for your business!";
    const invoicePrefix = activeStore?.invoice_prefix || "";
    const exchangeRate = order.exchange_rate || activeStore?.exchange_rate || 4100;

    return (
        <div className="printable-receipt relative mx-auto w-full max-w-[320px] overflow-hidden bg-white text-black font-mono text-xs sm:text-sm" style={{ backgroundColor: '#ffffff', fontFamily: '"Courier New", Courier, monospace' }}>
            <div className="p-4 sm:p-6 pb-8">
                {/* Header / Branding */}
                <div className="text-center mb-4">
                    {storeLogo && (
                        <img src={storeLogo} alt="Store Logo" className="mx-auto mb-2 max-h-16 object-contain grayscale" />
                    )}
                    <h2 className="text-sm font-bold uppercase tracking-widest">{storeName}</h2>
                    
                    {!storeLogo && website && (
                        <p className="text-[10px] mt-1">{website}</p>
                    )}
                    
                    <div className="mt-4 font-bold text-lg border-b border-black pb-1 mb-2">RECEIPT</div>
                    
                    <div className="flex flex-col gap-1 text-[11px] sm:text-xs">
                        {storeAddress && <div className="mb-1 font-bold">{storeAddress}</div>}
                        {storePhone && <div>TEL: {storePhone}</div>}
                        {taxId && <div>VAT TIN : {taxId}</div>}
                        <div>Invoice : {customInvoiceCode || (invoicePrefix + (order.order_number?.toUpperCase() || order.id.slice(-6).toUpperCase()))}</div>
                        <div>ORDER : {order.id.replace(/-/g, '').toUpperCase()}</div>
                        <div>DATE : {formatDateTime(order.created_at)}</div>
                        <div>CASHIER : {order.staff_name || user?.full_name || 'System'}</div>
                        <div>PAYMENT : {formatPaymentMethod(order.payment_method || 'Cash')}</div>
                        {order.customer_name && <div>CUSTOMER: {order.customer_name}</div>}
                        {order.customer_phone && <div>PHONE: {order.customer_phone}</div>}
                        <div>EXCHANGE RATE: 1$ = {exchangeRate.toLocaleString()} ៛</div>
                    </div>
                </div>

                <div className="border-t border-dashed border-black my-3"></div>

                {/* Items Table */}
                <table className="w-full text-left text-[11px] sm:text-xs">
                    <thead>
                        <tr>
                            <th className="pb-1 w-6">#</th>
                            <th className="pb-1">Product</th>
                            <th className="pb-1 text-right">Price</th>
                            <th className="pb-1 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="border-t border-dashed border-black">
                        {order.items.map((item: OrderItem, idx: number) => (
                            <React.Fragment key={idx}>
                                <tr>
                                    <td className="py-1 align-top">{idx + 1}</td>
                                    <td className="py-1 pr-1 font-bold">{item.product_name_snapshot}</td>
                                    <td className="py-1 text-right align-top whitespace-nowrap">{item.quantity}x{parsePrice(item.unit_price).toFixed(2)}</td>
                                    <td className="py-1 text-right align-top font-bold">${parsePrice(item.line_total).toFixed(2)}</td>
                                </tr>
                                {item.addons && item.addons.length > 0 && item.addons.map((addon: any, aIdx: number) => (
                                    <tr key={`addon-${idx}-${aIdx}`}>
                                        <td></td>
                                        <td colSpan={2} className="pl-2 pb-1 text-[10px]">+ {addon.name_snapshot}</td>
                                        <td className="pb-1 text-right text-[10px]">${parsePrice(addon.price || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>

                <div className="border-t border-dashed border-black my-3"></div>

                {/* Financial Summary */}
                <div className="space-y-1 text-[11px] sm:text-xs">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${parsePrice(order.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax ({order.tax_rate || activeStore?.tax_rate || 0}%):</span>
                        <span>${parsePrice(order.tax_total).toFixed(2)}</span>
                    </div>
                    {parsePrice(order.discount_total) > 0 && (
                        <div className="flex justify-between">
                            <span>Discount:</span>
                            <span>-${parsePrice(order.discount_total).toFixed(2)}</span>
                        </div>
                    )}
                    {order.order_type === 'delivery' && (
                        <div className="flex justify-between">
                            <span>Delivery Fee:</span>
                            <span>${parsePrice(order.delivery_fee || 0).toFixed(2)}</span>
                        </div>
                    )}
                    {order.order_type === 'delivery' && order.delivery_address && (
                        <div className="pt-2 border-t border-dashed border-black/20 text-[10px]">
                            <span className="font-bold">DELIVERY TO:</span>
                            <div className="mt-1 whitespace-pre-wrap">{order.delivery_address}</div>
                        </div>
                    )}
                    
                    <div className="pt-2 border-t border-black mt-2">
                        <div className="flex justify-between font-bold text-sm sm:text-base">
                            <span>GRAND TOTAL:</span>
                            <span>${parsePrice(order.grand_total).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold mt-0.5">
                            <span>TOTAL (KHR):</span>
                            <span>{(parsePrice(order.grand_total) * exchangeRate).toLocaleString()}៛</span>
                        </div>
                    </div>
                </div>

                <div className="border-t border-dashed border-black my-4"></div>

                {/* Footer Note */}
                <div className="text-center text-[10px] sm:text-[11px] space-y-1">
                    {customNote && <p className="font-bold border-b border-black pb-1 mb-2 italic">Note: {customNote}</p>}
                    <p className="font-bold whitespace-pre-wrap">{footerText}</p>
                    <p>Powered by FloraPos</p>
                </div>
                
                {/* Print Button (Hidden in print mode) */}
                {onPrint && (
                    <div className="mt-8 text-center" data-html2canvas-ignore="true">
                        <button
                            onClick={onPrint}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white font-sans rounded-full text-sm hover:bg-gray-800 transition-colors"
                        >
                            <Printer className="size-4" />
                            Print Receipt
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
