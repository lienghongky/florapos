import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { OrderReceipt } from '../components/orders/OrderReceipt';
import { Order, Store } from '../types';

let activeCleanup: (() => void) | undefined;
let preparing = false;

/** Print actual receipt HTML in the current tab: no popup, PDF viewer, or screenshot. */
export async function printSystemReceipts(orders: Order[], store: Store | null, options: {
  customNote?: string; customInvoiceCode?: string;
} = {}): Promise<void> {
  if (!orders.length || preparing) return;
  preparing = true;
  activeCleanup?.();
  const host = document.createElement('div');
  host.id = 'receipt-system-print-root';
  host.setAttribute('aria-hidden', 'true');
  const style = document.createElement('style');
  style.textContent = `
    #receipt-system-print-root { position: fixed; left: -10000px; top: 0; width: 340px; background: white; pointer-events: none; }
    @media print {
      @page { size: auto; margin: 8mm; }
      html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; background: white !important; }
      body > *:not(#receipt-system-print-root) { display: none !important; }
      #receipt-system-print-root { display: block !important; position: static !important; width: 100% !important; height: auto !important; overflow: visible !important; }
      #receipt-system-print-root, #receipt-system-print-root * { visibility: visible !important; opacity: 1 !important; transform: none !important; }
      #receipt-system-print-root .printable-receipt { width: 100% !important; max-width: 340px !important; overflow: visible !important; border: none !important; box-shadow: none !important; }
      #receipt-system-print-root .receipt-print-page { break-after: page; page-break-after: always; }
      #receipt-system-print-root .receipt-print-page:last-child { break-after: auto; page-break-after: auto; }
      #receipt-system-print-root tr, #receipt-system-print-root img { break-inside: avoid; }
      #receipt-system-print-root button, #receipt-system-print-root .no-print { display: none !important; }
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
      <OrderReceipt order={order} storeOverride={store} showActions={false}
        customNote={options.customNote} customInvoiceCode={options.customInvoiceCode} />
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
