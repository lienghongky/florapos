import { printSystemReceipts } from './system-receipt-print';
import { Order, Store, OrderItem } from '../types';
import { formatDateTime, formatPaymentMethod } from './format';
import { jsPDF } from 'jspdf';
import { domToCanvas } from 'modern-screenshot';
import { toast } from 'sonner';
import { usePrinterStore } from '../store/printer-store';
import { EscPosBuilder } from './escpos-builder';
import { generateReceiptCanvas } from './receipt-canvas';
import {
    getActivePocketConnection,
    generatePocketReceiptCanvas,
    canvasToPocketRaster,
    executePocketPrintJob,
    POCKET_PRINT_WIDTH
} from './pocket-printer';

export interface PrintReceiptOptions {
    customNote?: string;
    customInvoiceCode?: string;
    targetElement?: HTMLElement | null;
}

/**
 * Downloads receipt as PDF file
 */
export async function downloadReceiptPdf(order: Order, targetElement?: HTMLElement | null): Promise<boolean> {
    const toastId = toast.loading('Generating PDF receipt...');
    const orderNum = order.order_number?.toLowerCase() || order.id.slice(-6);

    try {
        let canvas: HTMLCanvasElement;

        if (targetElement) {
            canvas = await domToCanvas(targetElement, {
                scale: 2,
                backgroundColor: '#ffffff'
            });
        } else {
            const el = document.querySelector('.printable-receipt') as HTMLElement;
            if (!el) {
                throw new Error('Receipt DOM element not found');
            }
            canvas = await domToCanvas(el, {
                scale: 2,
                backgroundColor: '#ffffff'
            });
        }

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`receipt-${orderNum}.pdf`);

        toast.success(`Receipt downloaded as PDF`, { id: toastId });
        return true;
    } catch (error: any) {
        console.error('Download PDF Error:', error);
        toast.error('Failed to download PDF receipt', { id: toastId });
        return false;
    }
}

/**
 * Downloads receipt as PNG image file
 */
export async function downloadReceiptImage(order: Order, targetElement?: HTMLElement | null): Promise<boolean> {
    const toastId = toast.loading('Generating receipt image...');
    const orderNum = order.order_number?.toLowerCase() || order.id.slice(-6);

    try {
        const el = targetElement || (document.querySelector('.printable-receipt') as HTMLElement);
        if (!el) {
            throw new Error('Receipt element not found');
        }

        const canvas = await domToCanvas(el, {
            scale: 3,
            backgroundColor: '#ffffff'
        });

        const link = document.createElement('a');
        link.download = `receipt-${orderNum}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        toast.success('Receipt image downloaded!', { id: toastId });
        return true;
    } catch (error: any) {
        console.error('Download PNG Error:', error);
        toast.error('Failed to download receipt image', { id: toastId });
        return false;
    }
}

/**
 * Formats order as text with Fidelier ESC/POS tokens ($bighw$, $intro$, $cut$, $drawer$)
 * for https://github.com/solyarisoftware/posprinterdriver (com.fidelier.posprinterdriver)
 */
export function generateFidelierReceiptText(
    order: Order,
    store: Store | null,
    options: {
        paperSize?: '58mm' | '80mm';
        cutPaper?: boolean;
        openDrawer?: boolean;
        customNote?: string;
        customInvoiceCode?: string;
    } = {}
): string {
    const storeName = store?.name || 'Ottor POS';
    const exchangeRate = order.exchange_rate || store?.exchange_rate || 4100;
    const invoice = options.customInvoiceCode || (order.order_number?.toUpperCase() || order.id.slice(-6).toUpperCase());
    const width = options.paperSize === '80mm' ? 48 : 32;

    const parsePrice = (val: any): number => {
        if (val && typeof val === 'object' && 'usd' in val) return Number(val.usd);
        return Number(val) || 0;
    };

    const divider = (char = '-') => char.repeat(width) + '$intro$';
    const padRow = (left: string, right: string) => {
        const avail = width - right.length;
        const l = left.length >= avail ? left.slice(0, avail - 1) : left;
        const spaces = Math.max(1, avail - l.length);
        return l + ' '.repeat(spaces) + right + '$intro$';
    };

    let out = '';
    if (options.openDrawer) {
        out += '$drawer$';
    }

    // Store Header
    out += `$bighw$${storeName}$intro$$small$`;
    if (store?.address) out += `${store.address}$intro$`;
    if (store?.phone_number) out += `TEL: ${store.phone_number}$intro$`;
    if (store?.tax_id) out += `VAT TIN: ${store.tax_id}$intro$`;
    out += '$intro$';

    out += `$bigh$=== RECEIPT ===$intro$$small$`;
    out += divider('-');

    out += padRow('Invoice:', invoice);
    out += padRow('Date:', formatDateTime(order.created_at));
    out += padRow('Cashier:', order.staff_name || 'System');
    out += padRow('Payment:', formatPaymentMethod(order.payment_method || 'Cash'));
    if (order.customer_name) out += padRow('Customer:', order.customer_name);
    if (order.customer_phone) out += padRow('Phone:', order.customer_phone);
    out += padRow('Ex. Rate:', `1$ = ${exchangeRate.toLocaleString()} KHR`);
    if (order.tags) out += `$bighw$TAG: ${order.tags}$intro$$small$`;
    out += divider('-');

    // Items
    out += `$bigh$ITEMS$intro$$small$`;
    out += divider('-');
    (order.items || []).forEach((item: OrderItem, idx: number) => {
        const unitPrice = parsePrice(item.unit_price);
        const lineTotal = parsePrice(item.line_total);
        out += `$bigh$${idx + 1}. ${item.product_name_snapshot}$intro$$small$`;
        out += padRow(`  ${item.quantity} x $${unitPrice.toFixed(2)}`, `$${lineTotal.toFixed(2)}`);
        if (item.addons && item.addons.length > 0) {
            item.addons.forEach((a: any) => {
                out += padRow(`   + ${a.name_snapshot}`, `$${parsePrice(a.price || 0).toFixed(2)}`);
            });
        }
    });

    out += divider('-');

    // Totals
    const subtotal = parsePrice(order.subtotal);
    const taxTotal = parsePrice(order.tax_total);
    const discountTotal = parsePrice(order.discount_total);
    const deliveryFee = parsePrice(order.delivery_fee || 0);
    const grandTotal = parsePrice(order.grand_total);
    const khrTotal = Math.round(grandTotal * exchangeRate);

    out += padRow('Subtotal:', `$${subtotal.toFixed(2)}`);
    if (store?.enable_tax !== false && taxTotal > 0) {
        out += padRow(`Tax (${order.tax_rate || store?.tax_rate || 0}%):`, `$${taxTotal.toFixed(2)}`);
    }
    if (discountTotal > 0) {
        out += padRow('Discount:', `-$${discountTotal.toFixed(2)}`);
    }
    if (order.order_type === 'delivery' && deliveryFee > 0) {
        out += padRow('Delivery Fee:', `$${deliveryFee.toFixed(2)}`);
    }

    out += divider('=');
    out += `$bighw$` + padRow('GRAND TOTAL:', `$${grandTotal.toFixed(2)}`) + `$small$`;
    out += `$bigh$` + padRow('TOTAL (KHR):', `${khrTotal.toLocaleString()} KHR`) + `$small$`;
    out += divider('-');

    // Footer Note
    if (options.customNote || order.notes) {
        out += `Note: ${options.customNote || order.notes}$intro$`;
    }
    const footer = store?.receipt_footer_text || 'Thank you for your business!';
    out += `${footer}$intro$Powered by Ottor POS$intro$`;

    // Spacing & Cut
    out += '$intro$$intro$$intro$';
    if (options.cutPaper !== false) {
        out += '$cut$$intro$';
    }

    return out;
}

/**
 * Executes Receipt Printing based on active printer configuration
 * Supports: Direct Bluetooth thermal print, ESC-POS Driver app, Android RawBT Intent, Android native bridge, & System browser print
 */
export async function printReceipt(
    order: Order,
    store: Store | null,
    options: PrintReceiptOptions = {}
): Promise<boolean> {
    const printerStore = usePrinterStore.getState();
    const {
        printMode,
        paperSize,
        autoCut,
        openCashDrawer,
        sendBluetoothBytes,
        printTwoReceipts,
        receiptDelaySeconds
    } = printerStore;

    const copies = printTwoReceipts ? 2 : 1;
    const delayMs = Math.max(0, (receiptDelaySeconds ?? 2) * 1000);

    // 0. Pocket BLE Printer (Lucky Jingle / DP-L1S / C&Co 3128)
    if (printMode === 'pocket') {
        const toastId = toast.loading('Sending receipt to Pocket printer (Lucky Jingle)...');
        try {
            let active = getActivePocketConnection();
            if (!active || !active.connected()) {
                const connected = await printerStore.connectPocketPrinter();
                if (!connected) {
                    toast.dismiss(toastId);
                    return false;
                }
                active = getActivePocketConnection();
            }
            if (!active) throw new Error('Pocket printer is not connected.');

            const receiptCanvas = generatePocketReceiptCanvas(order, store, options);
            const raster = canvasToPocketRaster(receiptCanvas, POCKET_PRINT_WIDTH);

            for (let copy = 1; copy <= copies; copy++) {
                if (copy > 1) {
                    toast.loading(`Waiting ${receiptDelaySeconds}s before second receipt...`, { id: toastId });
                    await new Promise(r => setTimeout(r, delayMs));
                }
                await executePocketPrintJob(active.writeChar, raster, {
                    labelMode: false,
                    density: 1,
                    feedDots: 80,
                    onProgress: (percent) => {
                        toast.loading(copies > 1 ? `Printing receipt (${copy}/${copies}): ${percent}%...` : `Printing receipt: ${percent}%...`, { id: toastId });
                    }
                });
            }

            toast.dismiss(toastId);
            toast.success(copies > 1 ? 'Printed 2 receipts on Pocket printer!' : 'Receipt printed on Pocket printer!');
            return true;
        } catch (err: any) {
            console.error('Pocket print failed:', err);
            toast.dismiss(toastId);
            toast.error(err?.message || 'Pocket printer failed. Falling back to system print...');
        }
    }

    // 1. Direct Bluetooth Print Mode (Raster Graphic Mode with Khmer font support)
    if (printMode === 'bluetooth') {
        const toastId = toast.loading('Sending raster receipt to Bluetooth printer...');
        try {
            const escPosBytes = EscPosBuilder.generateOrderRasterEscPos(order, store, {
                paperSize,
                cutPaper: autoCut,
                openDrawer: openCashDrawer,
                customNote: options.customNote,
                customInvoiceCode: options.customInvoiceCode
            });

            for (let copy = 1; copy <= copies; copy++) {
                if (copy > 1) {
                    toast.loading(`Waiting ${receiptDelaySeconds}s before second receipt...`, { id: toastId });
                    await new Promise(r => setTimeout(r, delayMs));
                }
                const success = await sendBluetoothBytes(escPosBytes);
                if (!success) {
                    toast.dismiss(toastId);
                    toast.error('Failed to print to Bluetooth device. Falling back to system print...');
                    break;
                }
            }

            toast.dismiss(toastId);
            toast.success(copies > 1 ? '2 receipts sent directly to Bluetooth printer!' : 'Receipt sent directly to Bluetooth printer!');
            return true;
        } catch (err: any) {
            console.error('Direct Bluetooth print failed:', err);
            toast.dismiss(toastId);
        }
    }

    // 2. ESC-POS Driver Mode (Ottor Print / com.fidelier.posprinterdriver)
    if (printMode === 'escpos_driver') {
        try {
            const canvas = generateReceiptCanvas(order, store, {
                paperSize,
                customNote: options.customNote,
                customInvoiceCode: options.customInvoiceCode
            });
            const pngDataUrl = canvas.toDataURL('image/png');
            const singleReceipt = `${openCashDrawer ? '$drawer$' : ''}$image:${pngDataUrl}$intro$$intro$${autoCut ? '$cut$' : ''}`;

            const textToSend = copies > 1
                ? `${singleReceipt}$intro$$intro$${singleReceipt}`
                : singleReceipt;

            const driverApp = printerStore.driverApp || 'ottor';
            const scheme = (printerStore.driverScheme || 'ottor-print').trim().replace(/:+$/, '');

            if (driverApp === 'ottor') {
                const intentUrl = `intent:${encodeURIComponent(textToSend)}#Intent;scheme=${scheme};end;`;
                window.location.href = intentUrl;
                toast.success(copies > 1 ? `Sent 2 receipts to Ottor Print (${scheme}:)!` : `Sent print job to Ottor Print (${scheme}:)!`);
            } else {
                const intentUrl = `intent:${encodeURIComponent(textToSend)}#Intent;scheme=com.fidelier.printfromweb;package=com.fidelier.posprinterdriver;end;`;
                window.location.href = intentUrl;
                toast.success(copies > 1 ? 'Sent 2 receipts to ESC-POS Driver app!' : 'Sent print job to ESC-POS Driver app!');
            }
            return true;
        } catch (err: any) {
            console.error('ESC-POS Driver Intent print error:', err);
            toast.error('Failed to trigger Android printer app');
        }
    }

    // 3. Android RawBT Intent Mode (Network IP, USB, & Bluetooth driver on Android via Raster ESC/POS)
    if (printMode === 'rawbt' || printMode === 'network' || printMode === 'usb') {
        try {
            const escPosBytes = EscPosBuilder.generateOrderRasterEscPos(order, store, {
                paperSize,
                cutPaper: autoCut,
                openDrawer: openCashDrawer,
                customNote: options.customNote,
                customInvoiceCode: options.customInvoiceCode
            });

            let combinedBytes = escPosBytes;
            if (copies > 1) {
                const merged = new Uint8Array(escPosBytes.length * 2);
                merged.set(escPosBytes, 0);
                merged.set(escPosBytes, escPosBytes.length);
                combinedBytes = merged;
            }

            let binary = '';
            const len = combinedBytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(combinedBytes[i]);
            }
            const base64Data = btoa(binary);

            const intentUrl = `intent:base64,${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
            window.location.href = intentUrl;
            toast.success(copies > 1 ? 'Sent 2 receipts to Android Thermal Printer Driver!' : 'Sent print job to Android Thermal Printer Driver!');
            return true;
        } catch (err: any) {
            console.error('RawBT Intent print error:', err);
            toast.error('Failed to trigger Android printer driver');
        }
    }

    // 4. Android Native Bridge Mode (For Android WebView/Capacitor apps)
    const win = window as any;
    if (win.AndroidPrintBridge || win.AndroidBridge || printMode === 'native_bridge') {
        const bridge = win.AndroidPrintBridge || win.AndroidBridge;
        if (bridge && typeof bridge.printReceipt === 'function') {
            try {
                const escPosBytes = EscPosBuilder.generateOrderRasterEscPos(order, store, {
                    paperSize,
                    cutPaper: autoCut,
                    openDrawer: openCashDrawer,
                    customNote: options.customNote,
                    customInvoiceCode: options.customInvoiceCode
                });
                
                for (let copy = 1; copy <= copies; copy++) {
                    if (copy > 1) await new Promise(r => setTimeout(r, delayMs));
                    const binary = Array.from(escPosBytes).map(b => String.fromCharCode(b)).join('');
                    const base64Data = btoa(binary);
                    bridge.printReceipt(base64Data);
                }
                toast.success(copies > 1 ? 'Sent 2 receipts to Android native printer!' : 'Print command sent to Android native printer!');
                return true;
            } catch (err) {
                console.error('Android bridge print error:', err);
            }
        }
    }

    // Print a fresh receipt for this order, outside clipped/hidden modal ancestors.
    const toastId = toast.loading('Opening system print preview...');
    try {
        const receiptList = copies > 1 ? [order, order] : [order];
        await printSystemReceipts(receiptList, store, {
            ...options,
            paperSize,
        });
        return true;
    } catch (error) {
        console.error('System Print Error:', error);
        toast.error('Failed to open receipt print preview');
        return false;
    } finally {
        toast.dismiss(toastId);
    }
}
