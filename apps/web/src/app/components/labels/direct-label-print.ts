import { LabelProduct } from './Label';
import { LabelSettings } from './label-templates';
import { renderLabelCanvas, validateLabelLayout } from './label-pdf';
import { LabelConnection } from './label-printer-connection';

/** ESC/POS GS v 0: each set bit is a black dot, MSB first, row-aligned. */
export function encodeEscPosRaster(width: number, height: number, rgba: Uint8ClampedArray): Uint8Array {
  const rowBytes = Math.ceil(width / 8);
  if (width < 1 || width > 576 || height < 1 || height > 4095 || rgba.length !== width * height * 4) throw new Error('Invalid R80A label image dimensions.');
  const result = new Uint8Array(8 + rowBytes * height);
  result.set([0x1d, 0x76, 0x30, 0, rowBytes & 255, rowBytes >> 8, height & 255, height >> 8]);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const alpha = rgba[i + 3] / 255;
    const brightness = (rgba[i] * .299 + rgba[i + 1] * .587 + rgba[i + 2] * .114) * alpha + 255 * (1 - alpha);
    if (brightness < 160) result[8 + y * rowBytes + (x >> 3)] |= 128 >> (x % 8);
  }
  return result;
}

let busy = false;
export async function printDirectLabels(connection: LabelConnection, items: { product: LabelProduct; quantity: number }[], settings: LabelSettings, storeName?: string, onProgress?: (done: number, total: number) => void) {
  validateLabelLayout(settings);
  if (settings.paper !== 'roll' || settings.width > 72) throw new Error('R80A direct printing needs roll labels no wider than 72 mm (576 dots).');
  if (!items.length || items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999)) throw new Error('Choose valid label quantities.');
  if (!connection.connected()) throw new Error('Reconnect your label printer in Printer settings.');
  if (busy) throw new Error('A label print job is already running.');
  busy = true;
  let done = 0;
  const total = items.reduce((sum, item) => sum + item.quantity, 0);
  try {
    for (const { product, quantity } of items) {
      // R80A uses 8 dots/mm. Labels retain their physical dimensions and Unicode text.
      const canvas = renderLabelCanvas(product, settings, storeName, 203.2);
      let raster: Uint8Array;
      try {
        const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
        raster = encodeEscPosRaster(canvas.width, canvas.height, pixels.data);
      } finally { canvas.width = 0; canvas.height = 0; }
      // Initialize, align left, render bitmap, then advance 24 dots. Never operate a cutter/cash drawer.
      const bytes = new Uint8Array(5 + raster.length + 3);
      bytes.set([0x1b, 0x40, 0x1b, 0x61, 0]); bytes.set(raster, 5);
      bytes.set([0x1b, 0x4a, 24], 5 + raster.length);
      for (let copy = 0; copy < quantity; copy++) {
        await connection.send(bytes);
        onProgress?.(++done, total);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  } catch (error) {
    // Never retry or fall back automatically: already transferred labels may have printed.
    throw new Error(`${done} of ${total} labels fully sent. Check the printer before retrying. ${error instanceof Error ? error.message : 'Connection failed.'}`);
  } finally { busy = false; }
}
