import { Order, OrderItem, Store } from '../types';
import { formatDateTime, formatPaymentMethod } from './format';

export interface ReceiptCanvasOptions {
  paperSize?: '58mm' | '80mm';
  receiptCurrency?: 'USD' | 'KHR';
  customNote?: string;
  customInvoiceCode?: string;
}

const parsePrice = (val: any): number => {
  if (val && typeof val === 'object' && 'usd' in val) return Number(val.usd);
  return Number(val) || 0;
};

/**
 * Renders an Order receipt onto an HTML5 Canvas with native font shaping.
 * Supports Khmer script, symbols (៛), English, multi-language items, and custom tags.
 */
export function generateReceiptCanvas(
  order: Order,
  store: Store | null,
  options: ReceiptCanvasOptions = {}
): HTMLCanvasElement {
  const is80mm = options.paperSize === '80mm';
  const width = is80mm ? 576 : 384;
  const padding = is80mm ? 20 : 12;
  const exchangeRate = order.exchange_rate || store?.exchange_rate || 4100;
  const isKhr = options.receiptCurrency === 'KHR';

  const fontSans = "'Noto Sans Khmer', 'Inter', 'Battambang', -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  const fontMono = "'SF Mono', Menlo, 'Noto Sans Khmer', monospace";

  // Pre-estimate canvas height with ample headroom
  const itemsCount = (order.items || []).length;
  const addonsCount = (order.items || []).reduce((acc, it) => acc + (it.addons?.length || 0), 0);
  const estimatedHeight = (is80mm ? 700 : 500) + itemsCount * (is80mm ? 70 : 50) + addonsCount * (is80mm ? 30 : 22) + 400;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = estimatedHeight;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, estimatedHeight);
  ctx.fillStyle = '#000000';

  let y = is80mm ? 28 : 18;

  // Store Name
  const storeName = store?.name || 'Ottor POS';
  ctx.font = `bold ${is80mm ? 32 : 22}px ${fontSans}`;
  ctx.textAlign = 'center';
  ctx.fillText(storeName.toUpperCase(), width / 2, y);
  y += is80mm ? 36 : 26;

  // Store Address & Phone & Tax ID
  ctx.font = `bold ${is80mm ? 17 : 12}px ${fontSans}`;
  if (store?.address) {
    ctx.fillText(store.address, width / 2, y);
    y += is80mm ? 25 : 18;
  }
  if (store?.phone_number) {
    ctx.fillText(`TEL: ${store.phone_number}`, width / 2, y);
    y += is80mm ? 25 : 18;
  }
  if (store?.tax_id) {
    ctx.fillText(`VAT TIN: ${store.tax_id}`, width / 2, y);
    y += is80mm ? 25 : 18;
  }

  // RECEIPT Header
  y += is80mm ? 8 : 4;
  ctx.font = `black ${is80mm ? 24 : 17}px ${fontSans}`;
  ctx.fillText('=== RECEIPT ===', width / 2, y);
  y += is80mm ? 30 : 22;

  // Helper: Draw dividers
  const drawDivider = (dashed = true) => {
    ctx.beginPath();
    ctx.lineWidth = dashed ? 1.5 : 2;
    if (dashed) ctx.setLineDash([5, 3]);
    else ctx.setLineDash([]);
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += is80mm ? 20 : 15;
  };

  drawDivider(true);

  // Metadata block (Invoice, Date, Cashier, Payment, Client, Rate, TAG)
  ctx.font = `bold ${is80mm ? 17 : 12}px ${fontMono}`;
  ctx.textAlign = 'left';

  const invoice = options.customInvoiceCode || order.order_number?.toUpperCase() || order.id.slice(-6).toUpperCase();
  ctx.fillText(`Invoice : ${invoice}`, padding, y);
  y += is80mm ? 24 : 17;

  ctx.fillText(`Date    : ${formatDateTime(order.created_at)}`, padding, y);
  y += is80mm ? 24 : 17;

  ctx.fillText(`Cashier : ${order.staff_name || 'System'}`, padding, y);
  y += is80mm ? 24 : 17;

  ctx.fillText(`Payment : ${formatPaymentMethod(order.payment_method || 'Cash')}`, padding, y);
  y += is80mm ? 24 : 17;

  if (order.customer_name) {
    ctx.fillText(`Client  : ${order.customer_name}`, padding, y);
    y += is80mm ? 24 : 17;
  }
  if (order.customer_phone) {
    ctx.fillText(`Phone   : ${order.customer_phone}`, padding, y);
    y += is80mm ? 24 : 17;
  }

  ctx.fillText(`Ex. Rate: 1$ = ${exchangeRate.toLocaleString()} ៛`, padding, y);
  y += is80mm ? 25 : 18;

  // Prominent Bold & Big TAG
  if (order.tags) {
    y += 2;
    ctx.font = `bold ${is80mm ? 24 : 16}px ${fontSans}`;
    ctx.fillText(`TAG : ${order.tags}`, padding, y);
    y += is80mm ? 28 : 20;
  }

  drawDivider(false);

  // Items Table Header
  const rightColWidth = is80mm ? 220 : 130;
  const qtyColX = width - padding - (is80mm ? 105 : 68);
  const totalColX = width - padding;
  const maxNameWidth = width - padding * 2 - rightColWidth;

  ctx.font = `bold ${is80mm ? 17 : 12}px ${fontSans}`;
  ctx.textAlign = 'left';
  ctx.fillText('Item', padding, y);
  ctx.textAlign = 'right';
  ctx.fillText('Qty x Price', qtyColX, y);
  ctx.fillText('Total', totalColX, y);
  y += is80mm ? 24 : 17;

  drawDivider(true);

  // Items List
  (order.items || []).forEach((item: OrderItem, idx: number) => {
    ctx.font = `bold ${is80mm ? 17 : 12}px ${fontSans}`;
    ctx.textAlign = 'left';

    const rawName = item.product_name_snapshot || 'Product';
    // Truncate name if it exceeds column width
    let displayName = rawName;
    while (displayName.length > 0 && ctx.measureText(`${idx + 1}. ${displayName}`).width > maxNameWidth) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName.length < rawName.length) {
      displayName = displayName.trim() + '…';
    }

    ctx.fillText(`${idx + 1}. ${displayName}`, padding, y);

    // Qty x Price
    ctx.textAlign = 'right';
    ctx.font = `bold ${is80mm ? 16 : 12}px ${fontSans}`;
    const rawUnitPrice = parsePrice(item.unit_price);
    const rawLineTotal = parsePrice(item.line_total);

    if (isKhr) {
      const khrUnitPrice = Math.round(rawUnitPrice * exchangeRate);
      const khrLineTotal = Math.round(rawLineTotal * exchangeRate);
      ctx.fillText(`${item.quantity}x${khrUnitPrice.toLocaleString()}៛`, qtyColX, y);
      ctx.fillText(`${khrLineTotal.toLocaleString()}៛`, totalColX, y);
    } else {
      ctx.fillText(`${item.quantity}x$${rawUnitPrice.toFixed(2)}`, qtyColX, y);
      ctx.fillText(`$${rawLineTotal.toFixed(2)}`, totalColX, y);
    }
    y += is80mm ? 25 : 18;

    // Addons
    if (item.addons && item.addons.length > 0) {
      ctx.font = `bold ${is80mm ? 15 : 11}px ${fontSans}`;
      item.addons.forEach((addon: any) => {
        const rawAddonPrice = parsePrice(addon.price || 0);
        ctx.textAlign = 'left';
        ctx.fillText(`   + ${addon.name_snapshot}`, padding, y);
        ctx.textAlign = 'right';
        if (isKhr) {
          const khrAddonPrice = Math.round(rawAddonPrice * exchangeRate);
          ctx.fillText(`+${khrAddonPrice.toLocaleString()}៛`, totalColX, y);
        } else {
          ctx.fillText(`$${rawAddonPrice.toFixed(2)}`, totalColX, y);
        }
        y += is80mm ? 20 : 15;
      });
    }
  });

  drawDivider(true);

  // Financial Summary
  ctx.font = `bold ${is80mm ? 17 : 13}px ${fontSans}`;
  const rawSubtotal = parsePrice(order.subtotal);
  const rawTax = parsePrice(order.tax_total);
  const rawDiscount = parsePrice(order.discount_total);
  const rawDelivery = parsePrice(order.delivery_fee || 0);
  const grandTotal = parsePrice(order.grand_total);
  const khrTotal = Math.round(grandTotal * exchangeRate);

  ctx.textAlign = 'left';
  ctx.fillText('Subtotal:', padding, y);
  ctx.textAlign = 'right';
  if (isKhr) {
    ctx.fillText(`${Math.round(rawSubtotal * exchangeRate).toLocaleString()} ៛`, totalColX, y);
  } else {
    ctx.fillText(`$${rawSubtotal.toFixed(2)}`, totalColX, y);
  }
  y += is80mm ? 25 : 18;

  if (store?.enable_tax !== false && rawTax > 0) {
    ctx.textAlign = 'left';
    ctx.fillText(`Tax (${order.tax_rate || store?.tax_rate || 0}%):`, padding, y);
    ctx.textAlign = 'right';
    if (isKhr) {
      ctx.fillText(`${Math.round(rawTax * exchangeRate).toLocaleString()} ៛`, totalColX, y);
    } else {
      ctx.fillText(`$${rawTax.toFixed(2)}`, totalColX, y);
    }
    y += is80mm ? 25 : 18;
  }

  if (rawDiscount > 0) {
    ctx.textAlign = 'left';
    ctx.fillText('Discount:', padding, y);
    ctx.textAlign = 'right';
    if (isKhr) {
      ctx.fillText(`-${Math.round(rawDiscount * exchangeRate).toLocaleString()} ៛`, totalColX, y);
    } else {
      ctx.fillText(`-$${rawDiscount.toFixed(2)}`, totalColX, y);
    }
    y += is80mm ? 25 : 18;
  }

  if (order.order_type === 'delivery' && rawDelivery > 0) {
    ctx.textAlign = 'left';
    ctx.fillText('Delivery Fee:', padding, y);
    ctx.textAlign = 'right';
    if (isKhr) {
      ctx.fillText(`${Math.round(rawDelivery * exchangeRate).toLocaleString()} ៛`, totalColX, y);
    } else {
      ctx.fillText(`$${rawDelivery.toFixed(2)}`, totalColX, y);
    }
    y += is80mm ? 25 : 18;
  }

  drawDivider(false);

  // Grand Total & Currency Combinations
  if (isKhr) {
    // KHR Main: Total shows KHR and USD together
    ctx.font = `bold ${is80mm ? 26 : 18}px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText('GRAND TOTAL (KHR):', padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(`${khrTotal.toLocaleString()} ៛`, totalColX, y);
    y += is80mm ? 32 : 23;

    ctx.font = `bold ${is80mm ? 22 : 16}px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL (USD):', padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(`$${grandTotal.toFixed(2)}`, totalColX, y);
    y += is80mm ? 30 : 24;
  } else {
    // USD Main: USD total first, and exchanged to riel in total
    ctx.font = `bold ${is80mm ? 26 : 18}px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText('GRAND TOTAL:', padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(`$${grandTotal.toFixed(2)}`, totalColX, y);
    y += is80mm ? 32 : 23;

    ctx.font = `bold ${is80mm ? 22 : 16}px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL (KHR):', padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(`${khrTotal.toLocaleString()} ៛`, totalColX, y);
    y += is80mm ? 30 : 24;
  }

  drawDivider(true);

  // Footer note & branding
  ctx.font = `bold ${is80mm ? 16 : 12}px ${fontSans}`;
  ctx.textAlign = 'center';
  if (options.customNote) {
    ctx.fillText(`Note: ${options.customNote}`, width / 2, y);
    y += is80mm ? 24 : 18;
  }
  const footer = store?.receipt_footer_text || 'Thank you for your business!';
  ctx.fillText(footer, width / 2, y);
  y += is80mm ? 24 : 18;

  ctx.font = `bold ${is80mm ? 13 : 10}px ${fontSans}`;
  ctx.fillText('Powered by Ottor POS', width / 2, y);
  y += is80mm ? 24 : 20;

  // Crop canvas to actual rendered content height
  const trimmed = document.createElement('canvas');
  trimmed.width = width;
  trimmed.height = y;
  const tCtx = trimmed.getContext('2d')!;
  tCtx.fillStyle = '#ffffff';
  tCtx.fillRect(0, 0, width, y);
  tCtx.drawImage(canvas, 0, 0);

  return trimmed;
}

/**
 * Generates a test print canvas including English and Khmer script verification.
 */
export function generateTestReceiptCanvas(printMode: string, paperSize: '58mm' | '80mm' = '58mm'): HTMLCanvasElement {
  const is80mm = paperSize === '80mm';
  const width = is80mm ? 576 : 384;
  const padding = is80mm ? 20 : 14;
  const height = is80mm ? 420 : 300;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000000';

  const fontSans = "'Noto Sans Khmer', 'Inter', 'Battambang', -apple-system, Arial, sans-serif";
  let y = is80mm ? 32 : 22;

  // Header
  ctx.font = `bold ${is80mm ? 30 : 19}px ${fontSans}`;
  ctx.textAlign = 'center';
  ctx.fillText('OTTOR POS TEST PRINT', width / 2, y);
  y += is80mm ? 34 : 24;

  ctx.font = `bold ${is80mm ? 18 : 13}px ${fontSans}`;
  ctx.fillText(`Mode: ${printMode.toUpperCase()} (Raster Mode)`, width / 2, y);
  y += is80mm ? 26 : 18;

  ctx.font = `bold ${is80mm ? 15 : 11}px ${fontSans}`;
  ctx.fillText(new Date().toLocaleString(), width / 2, y);
  y += is80mm ? 24 : 16;

  // Divider
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += is80mm ? 26 : 18;

  // Content
  ctx.textAlign = 'left';
  ctx.font = `bold ${is80mm ? 18 : 12}px ${fontSans}`;
  ctx.fillText(`Paper Size : ${paperSize}`, padding, y);
  y += is80mm ? 26 : 18;

  ctx.fillText(`Font Test  : English & Khmer Supported`, padding, y);
  y += is80mm ? 28 : 20;

  // Khmer Text Verification Row
  ctx.font = `bold ${is80mm ? 22 : 15}px ${fontSans}`;
  ctx.fillText(`ភាសាខ្មែរ: សាកល្បងព្រីនជោគជ័យ ៛`, padding, y);
  y += is80mm ? 30 : 22;

  // Divider
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  y += is80mm ? 28 : 20;

  // Status OK
  ctx.font = `bold ${is80mm ? 24 : 16}px ${fontSans}`;
  ctx.textAlign = 'center';
  ctx.fillText('STATUS: 100% OK', width / 2, y);

  return canvas;
}
