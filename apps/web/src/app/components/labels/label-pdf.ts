import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import { LabelSettings, isUpcA, isEan13 } from './label-templates';
import type { LabelProduct } from './Label';

export function validateLabelLayout(s: LabelSettings) {
  if (![s.width, s.height].every(n => Number.isFinite(n) && n >= 10 && n <= 300)) throw new Error('Label width and height must be between 10 and 300 mm.');
  if (s.paper === 'sheet') {
    if (![s.sheetCols, s.sheetRows].every(n => Number.isInteger(n) && n > 0)) throw new Error('Sheet rows and columns must be positive whole numbers.');
    if (![s.sheetMargin, s.sheetGap].every(n => Number.isFinite(n) && n >= 0)) throw new Error('Sheet margins and gaps cannot be negative.');
    if (s.sheetCols * s.width + (s.sheetCols - 1) * s.sheetGap + 2 * s.sheetMargin > 210 || s.sheetRows * s.height + (s.sheetRows - 1) * s.sheetGap + 2 * s.sheetMargin > 297) throw new Error('The labels do not fit on A4. Reduce rows, columns, label size, margins, or gaps.');
  }
}

/** Draw one label without SVG foreignObject, DOM screenshots, or remote font embedding. */
export function renderLabelCanvas(product: LabelProduct, s: LabelSettings, storeName?: string, dpi = 300): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  // 300 DPI for normal labels; cap large custom labels to keep mobile memory bounded.
  const density = Math.min(dpi / 25.4, Math.sqrt(2_000_000 / (s.width * s.height)));
  canvas.width = Math.ceil(s.width * density); canvas.height = Math.ceil(s.height * density);
  const c = canvas.getContext('2d');
  if (!c) throw new Error('This browser cannot render label images.');
  c.scale(density, density);
  c.fillStyle = '#fff'; c.fillRect(0, 0, s.width, s.height); c.fillStyle = '#000';
  const scale = { sm: .85, md: 1, lg: 1.2 }[s.fontScale] * Math.min(1.25, Math.max(.75, s.height / 30));
  const width = s.width - 4.4;
  const font = (pt: number, bold = false) => { c.font = `${bold ? 'bold ' : ''}${pt * scale * 25.4 / 72}px Arial, sans-serif`; };
  const f = s.fields;
  const barHeight = Math.max(1, Math.min(s.barHeight, s.height - 5));
  const digitsHeight = f.barcodeDigits && product.barcode ? 3 * scale : 0;
  const bottom = s.height - 1.8;
  const contentBottom = f.barcode ? bottom - barHeight - digitsHeight - .6 : bottom;
  let y = 1.8;
  const text = (value: string, pt: number, bold = false, lines = 1, align = s.align) => {
    if (!value || y >= contentBottom) return;
    font(pt, bold);
    const height = pt * scale * 25.4 / 72 * 1.15;
    const chars = Array.from(value);
    for (let line = 0; line < lines && chars.length && y + height <= contentBottom; line++) {
      let value = '';
      while (chars.length && c.measureText(value + chars[0]).width <= width) value += chars.shift();
      if (!value && chars.length) value = chars.shift()!;
      if (line === lines - 1 && chars.length) { while (value && c.measureText(value + '…').width > width) value = value.slice(0, -1); value += '…'; }
      c.textBaseline = 'top'; c.textAlign = align;
      c.fillText(value, align === 'center' ? s.width / 2 : 2.2, y);
      y += height;
    }
    y += .6;
  };
  const bigPrice = s.templateId === 'price';
  const priceText = `${s.currency}${Number(product.price || 0).toFixed(2)}`;
  if (f.price && !bigPrice && s.align !== 'center') {
    font(9, s.boldPrice);
    const priceWidth = c.measureText(priceText).width;
    c.textBaseline = 'top'; c.textAlign = 'right'; c.fillText(priceText, s.width - 2.2, y, width);
    if (f.storeName && storeName) {
      font(5.5, true); c.textAlign = 'left';
      const available = Math.max(0, width - priceWidth - 1);
      let name = storeName.toUpperCase();
      while (name && c.measureText(name).width > available) name = name.slice(0, -1);
      if (name) c.fillText(name, 2.2, y);
    }
    y += 9 * scale * 25.4 / 72 * 1.15 + .6;
  } else if (f.storeName && storeName) text(storeName.toUpperCase(), 5.5, true);
  if (f.productName) text(product.name, s.templateId === 'price' ? 6.5 : 7.5, true, 2);
  text([f.category && product.category, f.sku && product.sku && `SKU ${product.sku}`].filter(Boolean).join(' · '), 5);
  if (f.price && (bigPrice || s.align === 'center')) text(priceText, bigPrice ? 16 : 10, s.boldPrice);
  const date = (d: Date) => d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  text([f.madeOn && `Made ${date(new Date())}`, f.bestBefore && `Best before ${date(new Date(Date.now() + s.bestBeforeDays * 86400000))}`].filter(Boolean).join('  '), 5);
  if (f.note && s.note) text(s.note, 4.8);
  if (f.barcode) {
    const top = bottom - barHeight - digitsHeight;
    if (product.barcode) {
      const barcode = document.createElement('canvas');
      try {
        JsBarcode(barcode, product.barcode, { format: isUpcA(product.barcode) ? 'UPC' : isEan13(product.barcode) ? 'EAN13' : 'CODE128', displayValue: false, margin: 0, height: 120, width: 3 });
        c.imageSmoothingEnabled = false;
        c.drawImage(barcode, 2.2, top, width, barHeight);
      } catch { throw new Error(`Invalid barcode for ${product.name}. Edit the barcode before exporting.`); }
      finally { barcode.width = 0; barcode.height = 0; }
      if (f.barcodeDigits) {
        font(5.5); c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillText(product.barcode, s.width / 2, top + barHeight + .4, width);
      }
    } else { font(5); c.textAlign = 'center'; c.fillText('No barcode', s.width / 2, top + barHeight / 2); }
  }
  if (s.border) { c.lineWidth = .3; c.strokeRect(.15, .15, s.width - .3, s.height - .3); }
  return canvas;
}

export function renderLabelImage(product: LabelProduct, s: LabelSettings, storeName?: string): string {
  const canvas = renderLabelCanvas(product, s, storeName);
  try { return canvas.toDataURL('image/png'); }
  finally { canvas.width = 0; canvas.height = 0; }
}

export async function createLabelPdf(items: { product: LabelProduct; quantity: number }[], settings: LabelSettings, options: {
  storeName?: string; signal?: AbortSignal; onProgress?: (done: number, total: number) => void;
} = {}) {
  validateLabelLayout(settings);
  if (!items.length || items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 999)) throw new Error('Choose labels with quantities between 1 and 999.');
  const total = items.reduce((n, i) => n + i.quantity, 0);
  const roll = settings.paper === 'roll';
  const pw = roll ? settings.width : 210, ph = roll ? settings.height : 297;
  const orientation = pw > ph ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ unit: 'mm', format: [pw, ph], orientation, compress: true });
  const perPage = roll ? 1 : settings.sheetCols * settings.sheetRows;
  let done = 0;
  for (const [index, item] of items.entries()) {
    options.signal?.throwIfAborted();
    const png = renderLabelImage(item.product, settings, options.storeName);
    for (let copy = 0; copy < item.quantity; copy++) {
      options.signal?.throwIfAborted();
      if (done && done % perPage === 0) pdf.addPage([pw, ph], orientation);
      const cell = done % perPage;
      const gridWidth = settings.sheetCols * settings.width + (settings.sheetCols - 1) * settings.sheetGap;
      const x = roll ? 0 : (210 - gridWidth) / 2 + (cell % settings.sheetCols) * (settings.width + settings.sheetGap);
      const y = roll ? 0 : settings.sheetMargin + Math.floor(cell / settings.sheetCols) * (settings.height + settings.sheetGap);
      pdf.addImage(png, 'PNG', x, y, settings.width, settings.height, `label-${index}`, 'FAST');
      done++;
      if (done % 10 === 0 || copy === item.quantity - 1) {
        options.onProgress?.(done, total);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }
  options.signal?.throwIfAborted();
  return pdf;
}
