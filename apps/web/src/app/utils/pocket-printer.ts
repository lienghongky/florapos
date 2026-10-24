/**
 * Lucky Jingle / DP-L1S / Crafts & Co 3128 BLE Pocket Printer Driver
 * Reverse-engineered from LuckPrinter SDK (com.luckprinter.sdk_new)
 * Compatible with 159+ generic 57mm portable mini thermal Bluetooth printers.
 *
 * Spec:
 * - Printhead width: 384 dots (48 bytes / line at 203 DPI / 8 dots/mm)
 * - Service UUID: 0000ff00-0000-1000-8000-00805f9b34fb (0xff00)
 * - Write Char:   0000ff02-0000-1000-8000-00805f9b34fb (0xff02)
 * - Notify Char:  0000ff01-0000-1000-8000-00805f9b34fb (0xff01)
 */

import { Order, OrderItem, Store } from '../types';
import { formatDateTime, formatPaymentMethod } from './format';
import { generateReceiptCanvas } from './receipt-canvas';

export const POCKET_PRINT_WIDTH = 384; // 384 pixels = 48 bytes per row
export const POCKET_SERVICE_UUID = 0xff00;
export const POCKET_WRITE_CHAR_UUID = 0xff02;
export const POCKET_NOTIFY_CHAR_UUID = 0xff01;

const CHUNK_SIZE = 100; // Web Bluetooth MTU safe limit
const CHUNK_DELAY = 40; // ms

export interface PocketPrinterConnection {
  device: any;
  server: any;
  writeChar: any;
  notifyChar?: any;
  name: string;
  id: string;
  battery: number | null;
  connected: () => boolean;
  disconnect: () => Promise<void>;
}

let activePocketConnection: PocketPrinterConnection | null = null;
let connecting = false;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function isPocketPrinterSupported(): boolean {
  return typeof navigator !== 'undefined' && !!(navigator as any).bluetooth;
}

export function getActivePocketConnection(): PocketPrinterConnection | null {
  if (activePocketConnection && activePocketConnection.connected()) {
    return activePocketConnection;
  }
  return null;
}

export async function disconnectPocketPrinter(): Promise<void> {
  const current = activePocketConnection;
  activePocketConnection = null;
  if (current) {
    try {
      await current.disconnect();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Connect to Lucky Jingle / DP-L1S / C&Co 3128 via Web Bluetooth.
 * Must be triggered directly by user gesture (button click).
 */
export async function connectPocketPrinter(
  onBatteryChange?: (level: number) => void
): Promise<PocketPrinterConnection> {
  const nav = navigator as any;
  if (!nav.bluetooth) {
    throw new Error('Web Bluetooth is not supported on this browser or OS. Try Chrome on Android, macOS, Linux or Windows.');
  }
  if (connecting) {
    throw new Error('A Bluetooth pairing dialog is already active.');
  }

  connecting = true;
  try {
    let device: any;
    try {
      // First try common manufacturer prefixes
      device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'C&Co' },
          { namePrefix: 'DP' },
          { namePrefix: 'LJ' },
          { namePrefix: 'Luck' },
          { namePrefix: 'L1S' },
          { namePrefix: 'Crafts' },
          { namePrefix: 'GB0' },
          { namePrefix: 'MX' },
        ],
        optionalServices: [POCKET_SERVICE_UUID, '0000ff00-0000-1000-8000-00805f9b34fb'],
      });
    } catch (e: any) {
      if (e?.name !== 'NotFoundError') throw e;
      // Fallback: accept all devices so user can choose whatever name their portable printer has
      device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [POCKET_SERVICE_UUID, '0000ff00-0000-1000-8000-00805f9b34fb'],
      });
    }

    if (!device) throw new Error('No Bluetooth device selected.');

    await disconnectPocketPrinter();

    const server = await device.gatt.connect();
    let service: any;
    try {
      service = await server.getPrimaryService(POCKET_SERVICE_UUID);
    } catch {
      service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
    }

    const writeChar = await service.getCharacteristic(POCKET_WRITE_CHAR_UUID);
    let notifyChar: any = null;
    let batteryLevel: number | null = null;

    try {
      notifyChar = await service.getCharacteristic(POCKET_NOTIFY_CHAR_UUID);
      await notifyChar.startNotifications();
      notifyChar.addEventListener('characteristicvaluechanged', (event: any) => {
        const val = new Uint8Array(event.target.value.buffer);
        // Battery query response: [0x10, 0xFF, ...] with battery % at val[1]
        if (val.length >= 2 && val[1] >= 0 && val[1] <= 100) {
          batteryLevel = val[1];
          onBatteryChange?.(val[1]);
        }
      });
    } catch {
      // Notification is optional
    }

    const conn: PocketPrinterConnection = {
      device,
      server,
      writeChar,
      notifyChar,
      name: device.name || 'Pocket Printer',
      id: device.id,
      get battery() {
        return batteryLevel;
      },
      connected: () => !!server?.connected,
      disconnect: async () => {
        try {
          if (notifyChar) await notifyChar.stopNotifications().catch(() => {});
        } catch {}
        if (server?.connected) server.disconnect();
      },
    };

    activePocketConnection = conn;

    device.addEventListener('gattserverdisconnected', () => {
      if (activePocketConnection === conn) {
        activePocketConnection = null;
      }
    });

    // Query battery level
    try {
      await sleep(300);
      await writeChar.writeValueWithoutResponse(new Uint8Array([0x10, 0xff, 0x50, 0xf1]));
    } catch {}

    return conn;
  } finally {
    connecting = false;
  }
}

/**
 * Converts any HTML canvas to 384-dot wide 1-bit monochrome ESC/POS GS v 0 raster command.
 */
export function canvasToPocketRaster(canvas: HTMLCanvasElement, targetWidth = POCKET_PRINT_WIDTH): Uint8Array {
  const scale = targetWidth / canvas.width;
  const targetHeight = Math.max(1, Math.round(canvas.height * scale));

  const offscreen = document.createElement('canvas');
  offscreen.width = targetWidth;
  offscreen.height = targetHeight;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Cannot acquire canvas 2D context');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight).data;
  const widthBytes = Math.ceil(targetWidth / 8); // 48 bytes
  const bitmap = new Uint8Array(widthBytes * targetHeight);

  for (let y = 0; y < targetHeight; y++) {
    for (let xb = 0; xb < widthBytes; xb++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = xb * 8 + bit;
        if (x < targetWidth) {
          const idx = (y * targetWidth + x) * 4;
          const alpha = imgData[idx + 3] / 255;
          const brightness =
            (imgData[idx] * 0.299 + imgData[idx + 1] * 0.587 + imgData[idx + 2] * 0.114) * alpha +
            255 * (1 - alpha);
          // Dark dot if brightness < 160
          if (brightness < 160) {
            byte |= 128 >> bit;
          }
        }
      }
      bitmap[y * widthBytes + xb] = byte;
    }
  }

  // GS v 0 00 [w_bytes_lo] [w_bytes_hi] [h_px_lo] [h_px_hi]
  const header = new Uint8Array([
    0x1d,
    0x76,
    0x30,
    0x00,
    widthBytes & 0xff,
    (widthBytes >> 8) & 0xff,
    targetHeight & 0xff,
    (targetHeight >> 8) & 0xff,
  ]);

  const result = new Uint8Array(header.length + bitmap.length);
  result.set(header);
  result.set(bitmap, header.length);
  return result;
}

/**
 * Sends a byte buffer in 100-byte chunks to avoid Web Bluetooth buffer overflow.
 */
export async function sendPocketChunks(
  writeChar: any,
  data: Uint8Array,
  onProgress?: (sent: number, total: number) => void
): Promise<void> {
  let sent = 0;
  while (sent < data.length) {
    const chunk = data.slice(sent, sent + CHUNK_SIZE);
    if (writeChar.properties.writeWithoutResponse) {
      await writeChar.writeValueWithoutResponse(chunk);
    } else {
      await writeChar.writeValue(chunk);
    }
    sent += chunk.length;
    onProgress?.(sent, data.length);
    await sleep(CHUNK_DELAY);
  }
}

/**
 * Execute a LuckPrinter / DP-L1S raster print job.
 */
export async function executePocketPrintJob(
  writeChar: any,
  rasterData: Uint8Array,
  options: {
    labelMode?: boolean;
    density?: number; // 0=light, 1=normal, 2=dark
    feedDots?: number;
    onProgress?: (progressPercent: number) => void;
  } = {}
): Promise<void> {
  const density = options.density ?? 1;
  const labelMode = !!options.labelMode;

  // 1. Enable printer (Lujiang mode = 3)
  await writeChar.writeValueWithoutResponse(new Uint8Array([0x10, 0xff, 0xf1, 0x03]));
  await sleep(250);

  // 2. Wake up (12 null bytes)
  await writeChar.writeValueWithoutResponse(new Uint8Array(12));
  await sleep(250);

  // 3. Set print density (0-2)
  await writeChar.writeValueWithoutResponse(new Uint8Array([0x10, 0xff, 0x10, 0x00, density]));
  await sleep(200);

  // 4. Label mode start (gap detection position adjust)
  if (labelMode) {
    await writeChar.writeValueWithoutResponse(new Uint8Array([0x1f, 0x11, 0x51]));
    await sleep(200);
  }

  // 5. Send bitmap
  await sendPocketChunks(writeChar, rasterData, (sent, total) => {
    options.onProgress?.(Math.round((sent / total) * 100));
  });
  await sleep(1200);

  // 6. Paper feed / label position
  if (labelMode) {
    // Position to next label gap
    await writeChar.writeValueWithoutResponse(new Uint8Array([0x1d, 0x0c]));
    await sleep(300);
    // End position adjust
    await writeChar.writeValueWithoutResponse(new Uint8Array([0x1f, 0x11, 0x50]));
    await sleep(200);
  } else {
    // Continuous paper feed
    const feed = options.feedDots ?? 80;
    await writeChar.writeValueWithoutResponse(new Uint8Array([0x1b, 0x4a, feed]));
    await sleep(300);
  }

  // 7. Stop print job
  await writeChar.writeValueWithoutResponse(new Uint8Array([0x10, 0xff, 0xf1, 0x45]));
  await sleep(1500);
}

/**
 * Generates a clean, high-resolution 384px-wide raster receipt canvas
 * with native support for English, Khmer characters (៛), item rows, and totals.
 */
export function generatePocketReceiptCanvas(
  order: Order,
  store: Store | null,
  options: { customNote?: string; customInvoiceCode?: string; receiptCurrency?: 'USD' | 'KHR' } = {}
): HTMLCanvasElement {
  return generateReceiptCanvas(order, store, { paperSize: '58mm', ...options });
}

/**
 * Generate a quick test receipt canvas for pocket printer test prints.
 */
export function generatePocketTestCanvas(): HTMLCanvasElement {
  const width = POCKET_PRINT_WIDTH;
  const height = 240;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';

  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillText('OTTOR POS TEST', width / 2, 40);

  ctx.font = "12px 'Inter', sans-serif";
  ctx.fillText('Pocket BLE Printer (Lucky Jingle)', width / 2, 65);
  ctx.fillText(`Resolution: 384px (203 DPI)`, width / 2, 85);
  ctx.fillText(new Date().toLocaleString(), width / 2, 105);

  // Gradient / Dither test
  for (let x = 20; x < width - 20; x++) {
    const val = Math.round(((x - 20) / (width - 40)) * 255);
    ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
    ctx.fillRect(x, 125, 1, 20);
  }

  // Checkerboard
  ctx.fillStyle = '#000000';
  for (let cy = 160; cy < 190; cy += 4) {
    for (let cx = 20; cx < 80; cx += 4) {
      if (((cx + cy) / 4) % 2 === 0) ctx.fillRect(cx, cy, 4, 4);
    }
  }

  ctx.font = "bold 13px 'Inter', 'Noto Sans Khmer', sans-serif";
  ctx.fillText('Status: OK · 1$ = 4,100៛', width / 2 + 30, 180);

  return canvas;
}
