export type PaperMode = 'roll' | 'sheet';
export type FontScale = 'sm' | 'md' | 'lg';
export type Align = 'left' | 'center' | 'right';
export type CodeType = 'barcode' | 'qr';
export type CodeAlign = 'left' | 'center' | 'right';

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

export interface LabelFontSizes {
  productName?: number;
  price?: number;
  khrPrice?: number;
  storeName?: number;
  sku?: number;
  barcodeDigits?: number;
  dates?: number;
  note?: number;
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
  fontSizes?: LabelFontSizes;
  align: Align;
  border: boolean;
  boldPrice: boolean;
  codeType: CodeType;
  codeAlign: CodeAlign;
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
  codeType?: CodeType;
  codeAlign?: CodeAlign;
}

const baseFields: LabelFields = {
  storeName: false, productName: true, price: true, showKhrPrice: true, sku: false, barcode: true,
  barcodeDigits: true, category: false, madeOn: false, bestBefore: false, note: false,
};

export const LABEL_TEMPLATES: LabelTemplate[] = [
  { id: 'qr_clean', name: 'QR Label', description: 'Store · price · name · QR', width: 50, height: 30, fields: { storeName: true, showKhrPrice: true }, fontScale: 'md', align: 'left', barHeight: 14.5, codeType: 'qr', codeAlign: 'right' },
  { id: 'classic', name: 'Classic', description: 'Store · name · price · barcode', width: 50, height: 30, fields: { storeName: true, showKhrPrice: true }, barHeight: 10, codeType: 'barcode', codeAlign: 'center' },
  { id: 'price', name: 'Price Tag', description: 'Big price, compact barcode', width: 40, height: 30, fields: { showKhrPrice: true }, fontScale: 'lg', align: 'center', barHeight: 8, codeType: 'barcode', codeAlign: 'center' },
  { id: 'compact', name: 'Compact', description: 'Name + barcode for small items', width: 38, height: 25, fields: { price: false, showKhrPrice: false }, fontScale: 'sm', align: 'center', barHeight: 9, codeType: 'barcode', codeAlign: 'center' },
  { id: 'fresh', name: 'Fresh', description: 'With made-on & best-before dates', width: 50, height: 40, fields: { storeName: true, madeOn: true, bestBefore: true, showKhrPrice: true }, barHeight: 10, codeType: 'barcode', codeAlign: 'center' },
  { id: 'shelf', name: 'Shelf', description: 'Large name, SKU and price', width: 70, height: 38, fields: { sku: true, category: true, showKhrPrice: true }, fontScale: 'lg', barHeight: 11, codeType: 'barcode', codeAlign: 'center' },
];

export const DEFAULT_SETTINGS: LabelSettings = {
  templateId: 'qr_clean',
  width: 50,
  height: 30,
  paper: 'roll',
  sheetCols: 3,
  sheetRows: 8,
  sheetMargin: 8,
  sheetGap: 2,
  fields: { ...baseFields, storeName: true, showKhrPrice: true },
  fontScale: 'md',
  fontSizes: {},
  align: 'left',
  border: false,
  boldPrice: true,
  codeType: 'qr',
  codeAlign: 'right',
  barHeight: 14.5,
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
    fontSizes: {},
    barHeight: t.barHeight ?? 10,
    codeType: t.codeType ?? current.codeType ?? 'qr',
    codeAlign: t.codeAlign ?? current.codeAlign ?? 'right',
  };
}

export const SHEET_PRESETS = [
  { label: 'A4 · 3×8 (67×35)', cols: 3, rows: 8, width: 67, height: 35, margin: 4, gap: 0 },
  { label: 'A4 · 4×10 (45×25)', cols: 4, rows: 10, width: 45, height: 25, margin: 10, gap: 2 },
  { label: 'A4 · 5×13 (37×20)', cols: 5, rows: 13, width: 37, height: 20, margin: 8, gap: 1.5 },
];

const STORAGE_KEY_V5 = (storeId?: string) => `label-settings-v5:${storeId || 'default'}`;
const STORAGE_KEY_V4 = (storeId?: string) => `label-settings-v4:${storeId || 'default'}`;
const STORAGE_KEY_V3 = (storeId?: string) => `label-settings-v3:${storeId || 'default'}`;
const STORAGE_KEY_V2 = (storeId?: string) => `label-settings-v2:${storeId || 'default'}`;
const STORAGE_KEY_LEGACY = (storeId?: string) => `label-settings:${storeId || 'default'}`;

export function loadSettings(storeId?: string, defaultExchangeRate: number = 4100): LabelSettings {
  try {
    let raw = localStorage.getItem(STORAGE_KEY_V5(storeId));
    if (!raw) {
      const v4Raw = localStorage.getItem(STORAGE_KEY_V4(storeId));
      if (v4Raw) {
        const v4Parsed = JSON.parse(v4Raw);
        if (v4Parsed.templateId !== 'qr_clean' || v4Parsed.codeAlign !== 'center') {
          raw = v4Raw;
        }
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.templateId === 'qr_clean') {
        parsed.align = 'left';
        parsed.codeAlign = 'right';
      }
      return { 
        ...DEFAULT_SETTINGS, 
        exchangeRate: defaultExchangeRate,
        ...parsed, 
        codeType: parsed.codeType || 'qr',
        codeAlign: parsed.codeAlign || 'right',
        fontSizes: parsed.fontSizes || {},
        fields: { 
          ...DEFAULT_SETTINGS.fields, 
          ...parsed.fields,
          storeName: parsed.fields?.storeName ?? true,
          showKhrPrice: parsed.fields?.showKhrPrice ?? true,
        } 
      };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS, exchangeRate: defaultExchangeRate };
}

export function saveSettings(storeId: string | undefined, s: LabelSettings) {
  try { localStorage.setItem(STORAGE_KEY_V5(storeId), JSON.stringify(s)); } catch { /* ignore */ }
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
