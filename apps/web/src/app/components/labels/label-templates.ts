export type PaperMode = 'roll' | 'sheet';
export type FontScale = 'sm' | 'md' | 'lg';
export type Align = 'left' | 'center';

export interface LabelFields {
  storeName: boolean;
  productName: boolean;
  price: boolean;
  showKhrPrice: boolean;
  sku: boolean;
  barcode: boolean;
  barcodeDigits: boolean;
  category: boolean;
  madeOn: boolean;
  bestBefore: boolean;
  note: boolean;
}

export interface LabelSettings {
  templateId: string;
  width: number; // mm
  height: number; // mm
  paper: PaperMode;
  sheetCols: number;
  sheetRows: number;
  sheetMargin: number; // mm
  sheetGap: number; // mm
  fields: LabelFields;
  fontScale: FontScale;
  align: Align;
  border: boolean;
  boldPrice: boolean;
  barHeight: number; // mm
  bestBeforeDays: number;
  note: string;
  currency: string;
  exchangeRate?: number;
}

export interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  fields: Partial<LabelFields>;
  align?: Align;
  fontScale?: FontScale;
  barHeight?: number;
}

const baseFields: LabelFields = {
  storeName: false, productName: true, price: true, showKhrPrice: true, sku: false, barcode: true,
  barcodeDigits: true, category: false, madeOn: false, bestBefore: false, note: false,
};

export const LABEL_TEMPLATES: LabelTemplate[] = [
  { id: 'classic', name: 'Classic', description: 'Store · name · price · barcode', width: 50, height: 30, fields: { storeName: true, showKhrPrice: true }, barHeight: 10 },
  { id: 'price', name: 'Price Tag', description: 'Big price, compact barcode', width: 40, height: 30, fields: { showKhrPrice: true }, fontScale: 'lg', align: 'center', barHeight: 8 },
  { id: 'compact', name: 'Compact', description: 'Name + barcode for small items', width: 38, height: 25, fields: { price: false, showKhrPrice: false }, fontScale: 'sm', align: 'center', barHeight: 9 },
  { id: 'fresh', name: 'Fresh', description: 'With made-on & best-before dates', width: 50, height: 40, fields: { storeName: true, madeOn: true, bestBefore: true, showKhrPrice: true }, barHeight: 10 },
  { id: 'shelf', name: 'Shelf', description: 'Large name, SKU and price', width: 70, height: 38, fields: { sku: true, category: true, showKhrPrice: true }, fontScale: 'lg', barHeight: 11 },
];

export const DEFAULT_SETTINGS: LabelSettings = {
  templateId: 'classic',
  width: 50,
  height: 30,
  paper: 'roll',
  sheetCols: 3,
  sheetRows: 8,
  sheetMargin: 8,
  sheetGap: 2,
  fields: { ...baseFields, storeName: true, showKhrPrice: true },
  fontScale: 'md',
  align: 'left',
  border: false,
  boldPrice: true,
  barHeight: 10,
  bestBeforeDays: 2,
  note: 'Keep refrigerated',
  currency: '$',
  exchangeRate: 4100,
};

export function applyTemplate(current: LabelSettings, t: LabelTemplate): LabelSettings {
  return {
    ...current,
    templateId: t.id,
    width: t.width,
    height: t.height,
    fields: { ...baseFields, ...t.fields },
    align: t.align ?? 'left',
    fontScale: t.fontScale ?? 'md',
    barHeight: t.barHeight ?? 10,
  };
}

export const SHEET_PRESETS = [
  { label: 'A4 · 3×8 (67×35)', cols: 3, rows: 8, width: 67, height: 35, margin: 4, gap: 0 },
  { label: 'A4 · 4×10 (45×25)', cols: 4, rows: 10, width: 45, height: 25, margin: 10, gap: 2 },
  { label: 'A4 · 5×13 (37×20)', cols: 5, rows: 13, width: 37, height: 20, margin: 8, gap: 1.5 },
];

const STORAGE_KEY = (storeId?: string) => `label-settings:${storeId || 'default'}`;

export function loadSettings(storeId?: string): LabelSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(storeId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed, 
        fields: { 
          ...DEFAULT_SETTINGS.fields, 
          ...parsed.fields,
          showKhrPrice: parsed.fields?.showKhrPrice ?? true,
        } 
      };
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

export function saveSettings(storeId: string | undefined, s: LabelSettings) {
  try { localStorage.setItem(STORAGE_KEY(storeId), JSON.stringify(s)); } catch { /* ignore */ }
}

/** Valid 12-digit UPC-A (numeric with correct check digit)? */
export function isUpcA(code: string): boolean {
  if (!/^\d{12}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) sum += Number(code[i]) * (i % 2 === 0 ? 3 : 1);
  return (10 - (sum % 10)) % 10 === Number(code[11]);
}

export function isEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(code[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10 === Number(code[12]);
}
