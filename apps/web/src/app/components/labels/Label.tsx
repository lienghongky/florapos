import { useEffect, useRef, CSSProperties } from 'react';
import JsBarcode from 'jsbarcode';
import { LabelSettings, isUpcA, isEan13 } from './label-templates';

export interface LabelProduct {
  id: string;
  name: string;
  price: number;
  sku?: string;
  barcode?: string;
  category?: string;
}

/** SVG barcode, scaled to fill the given box (crisp at any printer DPI). */
export function BarcodeSvg({ value, heightMm }: { value: string; heightMm: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    const format = isUpcA(value) ? 'UPC' : isEan13(value) ? 'EAN13' : 'CODE128';
    try {
      JsBarcode(ref.current, value, { format, displayValue: false, margin: 0, height: 60, width: 2, flat: true });
    } catch {
      JsBarcode(ref.current, value, { format: 'CODE128', displayValue: false, margin: 0, height: 60, width: 2 });
    }
    const w = ref.current.getAttribute('width');
    const h = ref.current.getAttribute('height');
    if (w && h) ref.current.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
    ref.current.removeAttribute('width');
    ref.current.removeAttribute('height');
    ref.current.setAttribute('preserveAspectRatio', 'none');
  }, [value]);
  return <svg ref={ref} style={{ width: '100%', height: `${heightMm}mm`, display: 'block' }} />;
}

const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });

/** A single physical label. All sizes in mm/pt so preview == print. */
export function Label({ product, settings, storeName }: { product: LabelProduct; settings: LabelSettings; storeName?: string }) {
  const s = settings;
  const f = s.fields;
  const scale = { sm: 0.85, md: 1, lg: 1.2 }[s.fontScale] * Math.min(1.25, Math.max(0.75, s.height / 30));
  const pt = (n: number) => `${(n * scale).toFixed(2)}pt`;
  const center = s.align === 'center';
  const today = new Date();
  const best = new Date(today.getTime() + s.bestBeforeDays * 86400000);
  const hasBarcode = f.barcode && !!product.barcode;
  const priceText = `${s.currency}${Number(product.price || 0).toFixed(2)}`;
  const bigPrice = s.templateId === 'price';

  const root: CSSProperties = {
    width: `${s.width}mm`,
    height: `${s.height}mm`,
    padding: '1.8mm 2.2mm',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6mm',
    overflow: 'hidden',
    background: '#fff',
    color: '#000',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    textAlign: center ? 'center' : 'left',
    border: s.border ? '0.3mm solid #000' : 'none',
    borderRadius: s.border ? '1.2mm' : 0,
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  };

  const clamp2: CSSProperties = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };

  return (
    <div style={root} className="label-item">
      {(f.storeName && storeName) || (f.price && !bigPrice && !center) ? (
        <div style={{ display: 'flex', justifyContent: center ? 'center' : 'space-between', alignItems: 'baseline', gap: '1mm' }}>
          {f.storeName && storeName && (
            <span style={{ fontSize: pt(5.5), fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {storeName}
            </span>
          )}
          {f.price && !bigPrice && !center && (
            <span style={{ fontSize: pt(9), fontWeight: s.boldPrice ? 800 : 500, whiteSpace: 'nowrap', marginLeft: 'auto' }}>{priceText}</span>
          )}
        </div>
      ) : null}

      {f.productName && (
        <div style={{ fontSize: pt(bigPrice ? 6.5 : 7.5), fontWeight: 600, lineHeight: 1.15, ...clamp2 }}>{product.name}</div>
      )}

      {(f.category || f.sku) && (
        <div style={{ fontSize: pt(5), opacity: 0.7, display: 'flex', gap: '1.5mm', justifyContent: center ? 'center' : 'flex-start' }}>
          {f.category && product.category && <span>{product.category}</span>}
          {f.sku && product.sku && <span style={{ fontFamily: 'monospace' }}>SKU {product.sku}</span>}
        </div>
      )}

      {f.price && (bigPrice || center) && (
        <div style={{ fontSize: pt(bigPrice ? 16 : 10), fontWeight: s.boldPrice ? 800 : 500, lineHeight: 1, letterSpacing: '-0.02em' }}>{priceText}</div>
      )}

      {(f.madeOn || f.bestBefore) && (
        <div style={{ fontSize: pt(5), display: 'flex', gap: '2mm', justifyContent: center ? 'center' : 'flex-start' }}>
          {f.madeOn && <span>Made <b>{fmtDate(today)}</b></span>}
          {f.bestBefore && <span>Best before <b>{fmtDate(best)}</b></span>}
        </div>
      )}

      {f.note && s.note && <div style={{ fontSize: pt(4.8), fontStyle: 'italic', opacity: 0.8 }}>{s.note}</div>}

      <div style={{ marginTop: 'auto' }}>
        {hasBarcode ? (
          <>
            <BarcodeSvg value={product.barcode!} heightMm={s.barHeight} />
            {f.barcodeDigits && (
              <div style={{ fontSize: pt(5.5), fontFamily: "'SF Mono', Menlo, monospace", letterSpacing: '0.18em', textAlign: 'center', marginTop: '0.4mm' }}>
                {product.barcode}
              </div>
            )}
          </>
        ) : f.barcode ? (
          <div style={{ height: `${s.barHeight}mm`, border: '0.3mm dashed #999', borderRadius: '1mm', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: pt(5), color: '#999' }}>
            No barcode
          </div>
        ) : null}
      </div>
    </div>
  );
}
