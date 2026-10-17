import { Product, ProductVariant } from '@/app/types';

export interface CodeMatch {
  product: Product;
  variant?: ProductVariant;
  matchedBy: 'barcode' | 'sku';
}

const norm = (s?: string | null) => (s ?? '').toString().trim().toLowerCase();

/** Build a lookup of barcode/SKU (products + variants; inactive matches are rejected at the POS) → product/variant. Barcodes win over SKUs. */
export function buildCodeIndex(products: Product[]): Map<string, CodeMatch> {
  const index = new Map<string, CodeMatch>();
  const put = (code: string | undefined | null, m: CodeMatch) => {
    const k = norm(code);
    if (!k) return;
    const existing = index.get(k);
    if (existing && existing.matchedBy === 'barcode' && m.matchedBy === 'sku') return;
    index.set(k, m);
  };

  // SKUs first so barcodes overwrite on collision
  for (const p of products) {
    put(p.sku, { product: p, matchedBy: 'sku' });
    for (const v of p.variants || []) put(v.sku, { product: p, variant: v, matchedBy: 'sku' });
  }
  for (const p of products) {
    put(p.barcode, { product: p, matchedBy: 'barcode' });
    for (const v of p.variants || []) put(v.barcode, { product: p, variant: v, matchedBy: 'barcode' });
  }
  return index;
}

export function lookupCode(index: Map<string, CodeMatch>, code: string): CodeMatch | undefined {
  const k = norm(code);
  if (!k) return undefined;
  const hit = index.get(k);
  if (hit) return hit;
  // UPC-A (12) scanned as EAN-13 with leading 0, or vice versa
  if (/^\d{13}$/.test(k) && k.startsWith('0')) return index.get(k.slice(1));
  if (/^\d{12}$/.test(k)) return index.get('0' + k);
  return undefined;
}

/**
 * Clean and extract a product code from raw scanned text (such as QR codes containing URLs,
 * identifiers, or query parameters).
 */
export function cleanScannedCode(raw?: string | null): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const param = url.searchParams.get('barcode') ||
                    url.searchParams.get('code') ||
                    url.searchParams.get('id') ||
                    url.searchParams.get('sku');
      if (param) return param.trim();
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      if (last && /^[A-Za-z0-9_-]+$/.test(last)) {
        return last.trim();
      }
    } catch {
      // Return trimmed if URL parsing fails
    }
  }
  return trimmed;
}
