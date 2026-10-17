import { printSystemReceipts } from './system-receipt-print';
import { Order, Store } from '../types';
import { jsPDF } from 'jspdf';
import { domToCanvas } from 'modern-screenshot';
import { toast } from 'sonner';
import { usePrinterStore } from '../store/printer-store';
import { EscPosBuilder } from './escpos-builder';

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
 * Executes Receipt Printing based on active printer configuration
 * Supports: Direct Bluetooth thermal print, Android RawBT Intent (Network IP & USB), Android native bridge, & System browser print
 */
export async function printReceipt(
    order: Order,
    store: Store | null,
    options: PrintReceiptOptions = {}
): Promise<boolean> {
    const printerStore = usePrinterStore.getState();
    const { printMode, paperSize, autoCut, openCashDrawer, sendBluetoothBytes } = printerStore;

    // 1. Direct Bluetooth Print Mode
    if (printMode === 'bluetooth') {
        const toastId = toast.loading('Sending receipt to Bluetooth printer...');
        try {
            const escPosBytes = EscPosBuilder.generateOrderEscPos(order, store, {
                paperSize,
                cutPaper: autoCut,
                openDrawer: openCashDrawer,
                customNote: options.customNote,
                customInvoiceCode: options.customInvoiceCode
            });

            const success = await sendBluetoothBytes(escPosBytes);
            toast.dismiss(toastId);

            if (success) {
                toast.success('Receipt sent directly to Bluetooth printer!');
                return true;
            } else {
                toast.error('Failed to print to Bluetooth device. Falling back to system print...');
            }
        } catch (err: any) {
            console.error('Direct Bluetooth print failed:', err);
            toast.dismiss(toastId);
        }
    }

    // 2. Android RawBT Intent Mode (Network IP, USB, & Bluetooth driver on Android)
    if (printMode === 'rawbt' || printMode === 'network') {
        try {
            const escPosBytes = EscPosBuilder.generateOrderEscPos(order, store, {
                paperSize,
                cutPaper: autoCut,
                openDrawer: openCashDrawer,
                customNote: options.customNote,
                customInvoiceCode: options.customInvoiceCode
            });

            let binary = '';
            const len = escPosBytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(escPosBytes[i]);
            }
            const base64Data = btoa(binary);

            const intentUrl = `intent:#Intent;scheme=rawbt;package=ru.a4105.rawbt;S.base64=${encodeURIComponent(base64Data)};end;`;
            window.location.href = intentUrl;
            toast.success('Sent print job to Android Thermal Printer Driver!');
            return true;
        } catch (err: any) {
            console.error('RawBT Intent print error:', err);
            toast.error('Failed to trigger Android printer driver');
        }
    }

    // 3. Android Native Bridge Mode (For Android WebView/Capacitor apps)
    const win = window as any;
    if (win.AndroidPrintBridge || win.AndroidBridge || printMode === 'native_bridge') {
        const bridge = win.AndroidPrintBridge || win.AndroidBridge;
        if (bridge && typeof bridge.printReceipt === 'function') {
            try {
                const escPosBytes = EscPosBuilder.generateOrderEscPos(order, store, {
                    paperSize,
                    cutPaper: autoCut,
                    openDrawer: openCashDrawer,
                    customNote: options.customNote,
                    customInvoiceCode: options.customInvoiceCode
                });
                
                const binary = Array.from(escPosBytes).map(b => String.fromCharCode(b)).join('');
                const base64Data = btoa(binary);
                
                bridge.printReceipt(base64Data);
                toast.success('Print command sent to Android native printer!');
                return true;
            } catch (err) {
                console.error('Android bridge print error:', err);
            }
        }
    }

    // Print a fresh receipt for this order, outside clipped/hidden modal ancestors.
    const toastId = toast.loading('Opening system print preview...');
    try {
        await printSystemReceipts([order], store, options);
        return true;
    } catch (error) {
        console.error('System Print Error:', error);
        toast.error('Failed to open receipt print preview');
        return false;
    } finally {
        toast.dismiss(toastId);
    }
}
