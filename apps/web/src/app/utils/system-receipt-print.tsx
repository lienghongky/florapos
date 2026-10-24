import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { OrderReceipt } from '../components/orders/OrderReceipt';
import { Order, Store } from '../types';
import { usePrinterStore } from '../store/printer-store';

let activeCleanup: (() => void) | undefined;
let preparing = false;

export interface PrintSystemReceiptsOptions {
  customNote?: string;
  customInvoiceCode?: string;
  paperSize?: '58mm' | '80mm';
  receiptCurrency?: 'USD' | 'KHR';
}

/** Print actual receipt HTML in the current tab: dynamically formatted for 58mm or 80mm roll paper */
export async function printSystemReceipts(
  orders: Order[],
  store: Store | null,
  options: PrintSystemReceiptsOptions = {}
): Promise<void> {
  if (!orders.length || preparing) return;
  preparing = true;
  activeCleanup?.();

  const paperSize = options.paperSize || usePrinterStore.getState().paperSize || '58mm';
  const is80mm = paperSize === '80mm';
  // Physical printable widths: ~74mm for 80mm paper, ~52mm for 58mm paper
  const targetWidth = is80mm ? '74mm' : '52mm';

  const host = document.createElement('div');
  host.id = 'receipt-system-print-root';
  host.setAttribute('aria-hidden', 'true');
  const style = document.createElement('style');
  style.textContent = `
    #receipt-system-print-root {
      position: fixed;
      left: -10000px;
      top: 0;
      width: ${targetWidth};
      background: white;
      pointer-events: none;
    }
    @media print {
      @page {
        size: ${is80mm ? '80mm auto' : '58mm auto'};
        margin: 0;
      }
      html, body {
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      body > *:not(#receipt-system-print-root) {
        display: none !important;
      }
      #receipt-system-print-root {
        display: block !important;
        position: static !important;
        width: 100% !important;
        max-width: ${targetWidth} !important;
        margin: 0 auto !important;
        padding: 0 !important;
        height: auto !important;
        overflow: visible !important;
      }
      #receipt-system-print-root, #receipt-system-print-root * {
        visibility: visible !important;
        opacity: 1 !important;
        transform: none !important;
      }
      #receipt-system-print-root .printable-receipt {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        padding: ${is80mm ? '3mm 4mm 6mm 4mm' : '2mm 2.5mm 5mm 2.5mm'} !important;
        box-sizing: border-box !important;
        overflow: visible !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      #receipt-system-print-root .receipt-print-page {
        break-after: page;
        page-break-after: always;
      }
      #receipt-system-print-root .receipt-print-page:last-child {
        break-after: auto;
        page-break-after: auto;
      }
      #receipt-system-print-root tr, #receipt-system-print-root img {
        break-inside: avoid;
      }
      #receipt-system-print-root button, #receipt-system-print-root .no-print {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(host);
  const root = createRoot(host);
  const cleanup = () => {
    window.removeEventListener('afterprint', cleanup);
    root.unmount(); host.remove(); style.remove();
    if (activeCleanup === cleanup) activeCleanup = undefined;
  };
  activeCleanup = cleanup;
  try {
    flushSync(() => root.render(<>{orders.map(order => <div className="receipt-print-page" key={order.id}>
      <OrderReceipt
        order={order}
        storeOverride={store}
        showActions={false}
        paperSizeOverride={paperSize}
        receiptCurrencyOverride={options.receiptCurrency || usePrinterStore.getState().receiptCurrency}
        customNote={options.customNote}
        customInvoiceCode={options.customInvoiceCode}
      />
    </div>)}</>));
    // Wait for fonts and logos, with a bounded wait for unreachable image URLs.
    const images = Array.from(host.querySelectorAll('img'));
    await Promise.all([
      document.fonts?.ready,
      ...images.map(img => img.complete ? Promise.resolve() : new Promise<void>(resolve => {
        const done = () => { clearTimeout(timer); img.removeEventListener('load', done); img.removeEventListener('error', done); resolve(); };
        const timer = setTimeout(done, 3000);
        img.addEventListener('load', done); img.addEventListener('error', done);
      })),
    ]);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.addEventListener('afterprint', cleanup);
    window.print();
    // Safari can return while its preview is still open. Keep the DOM until afterprint.
  } catch (error) {
    cleanup(); throw error;
  } finally {
    preparing = false;
  }
}
