import React, { useState } from 'react';
import { Order, OrderItem } from '@/app/types';
import { Printer, Download, Settings, FileText, Image as ImageIcon, Bluetooth, Check, Zap, Smartphone } from 'lucide-react';
import { formatDateTime, formatPaymentMethod } from '@/app/utils/format';
import { useAuthStore } from '@/app/store/auth-store';
import { usePrinterStore } from '@/app/store/printer-store';
import { printReceipt, downloadReceiptPdf, downloadReceiptImage } from '@/app/utils/receipt-actions';
import { PrinterSettingsModal } from './PrinterSettingsModal';

const parsePrice = (val: any): number => {
    if (val && typeof val === 'object' && 'usd' in val) return Number(val.usd);
    return Number(val) || 0;
};

interface OrderReceiptProps {
    order: Order;
    onPrint?: () => void;
    onDownload?: () => void;
    storeOverride?: any;
    customInvoiceCode?: string;
    customNote?: string;
    showActions?: boolean;
}

export function OrderReceipt({
    order,
    onPrint,
    onDownload,
    storeOverride,
    customInvoiceCode,
    customNote,
    showActions = true
}: OrderReceiptProps) {
    const { user, selectedStore } = useAuthStore();
    const { printMode, isBluetoothConnected, bluetoothDeviceName, isPocketConnected, pocketDeviceName } = usePrinterStore();
    const [showPrinterSettings, setShowPrinterSettings] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    const activeStore = storeOverride || selectedStore;
    const storeName = activeStore?.name || "Ottor POS";
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
    const exchangeRate = order.exchange_rate || activeStore?.exchange_rate || 4100;

    const handleDirectPrint = async () => {
        if (onPrint) {
            onPrint();
        } else {
            await printReceipt(order, activeStore, {
                customNote,
                customInvoiceCode
            });
        }
    };

    const handlePdfDownload = async () => {
        if (onDownload) {
            onDownload();
        } else {
            await downloadReceiptPdf(order);
        }
    };

    const handleImageDownload = async () => {
        await downloadReceiptImage(order);
    };

    return (
        <>
            <div className="printable-receipt relative mx-auto w-full max-w-[340px] overflow-hidden bg-white text-black font-mono text-sm sm:text-[15px] shadow-sm rounded-xl border border-slate-100" style={{ backgroundColor: '#ffffff', fontFamily: '"Courier New", Courier, monospace', fontWeight: 700 }}>
                <div className="p-4 sm:p-6 pb-8">
                    {/* Header / Branding */}
                    <div className="text-center mb-4">
                        {storeLogo && (
                            <img src={storeLogo} alt="Store Logo" className="mx-auto mb-2 max-h-16 object-contain grayscale" />
                        )}
                        <h2 className="text-base sm:text-lg font-black uppercase tracking-wider">{storeName}</h2>
                        
                        {!storeLogo && website && (
                            <p className="text-xs font-bold mt-1">{website}</p>
                        )}
                        
                        <div className="mt-4 font-black text-xl border-b-2 border-black pb-1 mb-2">RECEIPT</div>
                        
                        <div className="flex flex-col gap-1 text-xs sm:text-[13px] font-bold">
                            {storeAddress && <div className="mb-1 font-bold">{storeAddress}</div>}
                            {storePhone && <div>TEL: {storePhone}</div>}
                            {taxId && <div>VAT TIN : {taxId}</div>}
                            <div>Invoice : {customInvoiceCode || (order.order_number?.toUpperCase() || order.id.slice(-6).toUpperCase())}</div>
                            <div>DATE : {formatDateTime(order.created_at)}</div>
                            <div>CASHIER : {order.staff_name || user?.full_name || 'System'}</div>
                            <div>PAYMENT : {formatPaymentMethod(order.payment_method || 'Cash')}</div>
                            {order.customer_name && <div>CUSTOMER: {order.customer_name}</div>}
                            {order.customer_phone && <div>PHONE: {order.customer_phone}</div>}
                            <div>EXCHANGE RATE: 1$ = {exchangeRate.toLocaleString()} ៛</div>
                            {order.tags && (
                                <div className="text-base sm:text-lg font-black text-black tracking-wide mt-1">
                                    TAG : {order.tags}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t-2 border-dashed border-black my-3"></div>

                    {/* Items Table */}
                    <table className="w-full text-left text-xs sm:text-[13px]">
                        <thead>
                            <tr className="border-b border-black font-black">
                                <th className="pb-1.5 w-6">#</th>
                                <th className="pb-1.5">Product</th>
                                <th className="pb-1.5 text-right">Price</th>
                                <th className="pb-1.5 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="border-t border-dashed border-black">
                            {order.items.map((item: OrderItem, idx: number) => (
                                <React.Fragment key={idx}>
                                    <tr>
                                        <td className="py-1.5 align-top font-bold">{idx + 1}</td>
                                        <td className="py-1.5 pr-1 font-black text-black">{item.product_name_snapshot}</td>
                                        <td className="py-1.5 text-right align-top whitespace-nowrap font-bold">{item.quantity}x{parsePrice(item.unit_price).toFixed(2)}</td>
                                        <td className="py-1.5 text-right align-top font-black">${parsePrice(item.line_total).toFixed(2)}</td>
                                    </tr>
                                    {item.addons && item.addons.length > 0 && item.addons.map((addon: any, aIdx: number) => (
                                        <tr key={`addon-${idx}-${aIdx}`}>
                                            <td></td>
                                            <td colSpan={2} className="pl-2 pb-1 text-xs font-bold">+ {addon.name_snapshot}</td>
                                            <td className="pb-1 text-right text-xs font-black">${parsePrice(addon.price || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-t-2 border-dashed border-black my-3"></div>

                    {/* Financial Summary */}
                    <div className="space-y-1.5 text-xs sm:text-[13px] font-bold">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-black">${parsePrice(order.subtotal).toFixed(2)}</span>
                        </div>
                        {(activeStore?.enable_tax !== false) && (
                            <div className="flex justify-between">
                                <span>Tax ({order.tax_rate || activeStore?.tax_rate || 0}%):</span>
                                <span className="font-black">${parsePrice(order.tax_total).toFixed(2)}</span>
                            </div>
                        )}
                        {parsePrice(order.discount_total) > 0 && (
                            <div className="flex justify-between">
                                <span>Discount:</span>
                                <span className="font-black">-${parsePrice(order.discount_total).toFixed(2)}</span>
                            </div>
                        )}
                        {order.order_type === 'delivery' && (
                            <div className="flex justify-between">
                                <span>Delivery Fee:</span>
                                <span className="font-black">${parsePrice(order.delivery_fee || 0).toFixed(2)}</span>
                            </div>
                        )}
                        {order.order_type === 'delivery' && order.delivery_address && (
                            <div className="pt-2 border-t border-dashed border-black/30 text-xs font-bold">
                                <span className="font-black">DELIVERY TO:</span>
                                <div className="mt-1 whitespace-pre-wrap">{order.delivery_address}</div>
                            </div>
                        )}
                        
                        <div className="pt-2 border-t-2 border-black mt-2">
                            <div className="flex justify-between font-black text-base sm:text-lg">
                                <span>GRAND TOTAL:</span>
                                <span>${parsePrice(order.grand_total).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm sm:text-base font-black mt-1">
                                <span>TOTAL (KHR):</span>
                                <span>{(parsePrice(order.grand_total) * exchangeRate).toLocaleString()}៛</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t-2 border-dashed border-black my-4"></div>

                    {/* Footer Note */}
                    <div className="text-center text-xs sm:text-[13px] font-bold space-y-1">
                        {customNote && <p className="font-black border-b border-black pb-1 mb-2 italic">Note: {customNote}</p>}
                        <p className="font-black whitespace-pre-wrap">{footerText}</p>
                        <p className="font-semibold text-xs">Powered by Ottor POS</p>
                    </div>
                    
                    {/* Action Bar: Download vs Print (Hidden in screen capture & print mode) */}
                    {showActions && (
                        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col gap-2 font-sans" data-html2canvas-ignore="true">
                            <div className="grid grid-cols-2 gap-2">
                                {/* Print Receipt Button */}
                                <button
                                    onClick={handleDirectPrint}
                                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-black text-white font-bold rounded-xl text-xs hover:bg-gray-800 transition-all active:scale-95 shadow-md"
                                >
                                    {printMode === 'bluetooth' ? (
                                        <Bluetooth className="size-4 text-blue-400" />
                                    ) : printMode === 'pocket' ? (
                                        <Zap className="size-4 text-amber-400" />
                                    ) : printMode === 'escpos_driver' ? (
                                        <Smartphone className="size-4 text-sky-400" />
                                    ) : (
                                        <Printer className="size-4" />
                                    )}
                                    <span>Print Receipt</span>
                                </button>

                                {/* Download Dropdown Button */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 text-slate-800 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                                    >
                                        <Download className="size-4 text-slate-600" />
                                        <span>Download</span>
                                    </button>

                                    {showDownloadMenu && (
                                        <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 flex flex-col gap-1">
                                            <button
                                                onClick={() => {
                                                    setShowDownloadMenu(false);
                                                    handlePdfDownload();
                                                }}
                                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl text-left"
                                            >
                                                <FileText className="size-4 text-red-500" />
                                                <span>Download PDF</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowDownloadMenu(false);
                                                    handleImageDownload();
                                                }}
                                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl text-left"
                                            >
                                                <ImageIcon className="size-4 text-blue-500" />
                                                <span>Download Image</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Printer Config Bar */}
                            <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1 font-semibold">
                                    {printMode === 'bluetooth' ? (
                                        <>
                                            <span className="inline-block size-2 rounded-full bg-blue-500 animate-pulse" />
                                            Direct BT: {isBluetoothConnected ? (bluetoothDeviceName || 'Ready') : 'Not Paired'}
                                        </>
                                    ) : printMode === 'pocket' ? (
                                        <>
                                            <span className="inline-block size-2 rounded-full bg-amber-500 animate-pulse" />
                                            Lucky Jingle: {isPocketConnected ? (pocketDeviceName || 'Ready') : 'Not Paired'}
                                        </>
                                    ) : printMode === 'escpos_driver' ? (
                                        <>
                                            <span className="inline-block size-2 rounded-full bg-sky-500 animate-pulse" />
                                            ESC-POS Driver (Android)
                                        </>
                                    ) : (
                                        <>
                                            <span className="inline-block size-2 rounded-full bg-slate-400" />
                                            Mode: System Print
                                        </>
                                    )}
                                </span>
                                <button
                                    onClick={() => setShowPrinterSettings(true)}
                                    className="flex items-center gap-1 text-slate-700 hover:text-black font-bold hover:underline"
                                >
                                    <Settings className="size-3.5" />
                                    <span>Printer Settings</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Printer Settings Modal */}
            <PrinterSettingsModal
                isOpen={showPrinterSettings}
                onClose={() => setShowPrinterSettings(false)}
            />
        </>
    );
}
