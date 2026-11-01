import { useEffect, useRef, CSSProperties } from 'react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
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

export function QrCodeSvg({ value, sizeMm }: { value: string; sizeMm: number }) {
  return (
    <div style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm`, display: 'inline-block' }}>
      <QRCodeSVG
        value={value}
        size={Math.round(sizeMm * 3.78)}
        level="M"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });

/** A single physical label. All sizes in mm/pt so preview == print. */
export function Label({ product, settings, storeName }: { product: LabelProduct; settings: LabelSettings; storeName?: string }) {
  const s = settings;
  const f = s.fields;
  const scale = ({ sm: 1.7, md: 2.0, lg: 2.4 }[s.fontScale] ?? 2.0) * Math.min(1.25, Math.max(0.75, s.height / 30));
  const pt = (n: number) => `${(n * scale).toFixed(2)}pt`;
  const center = s.align === 'center';
  const today = new Date();
  const best = new Date(today.getTime() + s.bestBeforeDays * 86400000);
  const hasBarcode = f.barcode && !!product.barcode;
  const priceText = `${s.currency}${Number(product.price || 0).toFixed(2)}`;
  const exchangeRate = s.exchangeRate || 4100;
  const khrValue = Math.round(Number(product.price || 0) * exchangeRate);
  const khrText = `${khrValue.toLocaleString()}៛`;
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
    fontFamily: "'Inter', 'Helvetica Neue', Arial, 'Noto Sans Khmer', sans-serif",
    textAlign: center ? 'center' : 'left',
    border: s.border ? '0.3mm solid #000' : 'none',
    borderRadius: s.border ? '1.2mm' : 0,
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  };

  const clamp2: CSSProperties = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };

  const qrAlign = s.codeAlign || (center ? 'center' : 'left');
  const qrJustify = qrAlign === 'center' ? 'center' : qrAlign === 'right' ? 'flex-end' : 'flex-start';

  const isQrRight = s.codeType === 'qr' && (qrAlign === 'right' || !s.codeAlign || s.templateId === 'qr_clean');

  return (
    <div style={root} className="label-item">
      {/* Row 1: 2 columns { store name, Price } */}
      {(f.storeName || (f.price && !bigPrice)) ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1mm', width: '100%' }}>
          {f.storeName ? (
            <span style={{ fontSize: pt(s.fontSizes?.storeName ?? 3.4), fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: f.price ? '56%' : '100%', paddingTop: '0.2mm' }}>
              {storeName || 'STORE'}
            </span>
          ) : <div />}
          {f.price && !bigPrice ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto', lineHeight: 1.05 }}>
              <span style={{ fontSize: pt(s.fontSizes?.price ?? 8.0), fontWeight: s.boldPrice ? 800 : 700, whiteSpace: 'nowrap' }}>{priceText}</span>
              {f.showKhrPrice && (
                <span style={{ fontSize: pt(s.fontSizes?.khrPrice ?? 4.6), fontWeight: 600, opacity: 0.85, whiteSpace: 'nowrap', color: '#000' }}>
                  {khrText}
                </span>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {isQrRight ? (
        /* Body: Left side expands (Product Name, Details) | Right side QR Code & Code Digits */
        <div style={{ display: 'flex', gap: '2mm', flex: 1, minHeight: 0, alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', marginTop: '0.4mm' }}>
          {/* Left Column (Expands) */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4mm', height: '100%', justifyContent: 'flex-start' }}>
            {f.productName && (
              <div style={{
                fontSize: pt(s.fontSizes?.productName ?? (bigPrice ? 6.5 : 5.8)),
                fontWeight: 600,
                lineHeight: 1.18,
                textAlign: 'left',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {product.name}
              </div>
            )}

            {(f.category || f.sku) && (
              <div style={{ fontSize: pt(s.fontSizes?.sku ?? 4.5), opacity: 0.7, display: 'flex', gap: '1mm', flexWrap: 'wrap' }}>
                {f.category && product.category && <span>{product.category}</span>}
                {f.sku && product.sku && <span style={{ fontFamily: 'monospace' }}>SKU {product.sku}</span>}
              </div>
            )}

            {(f.madeOn || f.bestBefore) && (
              <div style={{ fontSize: pt(s.fontSizes?.dates ?? 4.5), display: 'flex', gap: '1.5mm', flexWrap: 'wrap' }}>
                {f.madeOn && <span>Made {fmtDate(today)}</span>}
                {f.bestBefore && <span>Best {fmtDate(best)}</span>}
              </div>
            )}

            {f.note && s.note && <div style={{ fontSize: pt(s.fontSizes?.note ?? 4.5), fontStyle: 'italic', opacity: 0.8 }}>{s.note}</div>}
          </div>

          {/* Right Column (QR & Code Digits) */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {hasBarcode ? (
              <>
                <QrCodeSvg value={product.barcode!} sizeMm={s.barHeight} />
                {f.barcodeDigits && (
                  <div style={{
                    fontSize: pt(s.fontSizes?.barcodeDigits ?? 2.8),
                    fontFamily: "'SF Mono', Menlo, monospace",
                    letterSpacing: '0.08em',
                    textAlign: 'center',
                    marginTop: '0.3mm',
                    opacity: 0.85,
                    whiteSpace: 'nowrap'
                  }}>
                    {product.barcode}
                  </div>
                )}
              </>
            ) : f.barcode ? (
              <div style={{ height: `${s.barHeight}mm`, width: `${s.barHeight}mm`, border: '0.3mm dashed #999', borderRadius: '1mm', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: pt(4.5), color: '#999' }}>
                No QR
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          {/* Row 2: Product Name (Left-aligned) */}
          {f.productName && (
            <div style={{
              fontSize: pt(s.fontSizes?.productName ?? (s.templateId === 'classic' ? 5.2 : bigPrice ? 6.5 : 5.8)),
              fontWeight: 600,
              lineHeight: 1.15,
              textAlign: s.align === 'center' ? 'center' : s.align === 'right' ? 'right' : 'left',
              width: '100%',
              ...clamp2
            }}>{product.name}</div>
          )}

          {(f.category || f.sku) && (
            <div style={{ fontSize: pt(s.fontSizes?.sku ?? 5), opacity: 0.7, display: 'flex', gap: '1.5mm', justifyContent: s.align === 'center' ? 'center' : s.align === 'right' ? 'flex-end' : 'flex-start' }}>
              {f.category && product.category && <span>{product.category}</span>}
              {f.sku && product.sku && <span style={{ fontFamily: 'monospace' }}>SKU {product.sku}</span>}
            </div>
          )}

          {/* Big Price only when bigPrice template is chosen */}
          {f.price && bigPrice && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: center ? 'center' : 'flex-start', gap: '0.2mm', lineHeight: 1.05 }}>
              <div style={{ fontSize: pt(s.fontSizes?.price ?? 14), fontWeight: s.boldPrice ? 800 : 700, letterSpacing: '-0.02em' }}>{priceText}</div>
              {f.showKhrPrice && (
                <div style={{ fontSize: pt(s.fontSizes?.khrPrice ?? 7), fontWeight: 600, opacity: 0.85, color: '#000' }}>{khrText}</div>
              )}
            </div>
          )}

          {(f.madeOn || f.bestBefore) && (
            <div style={{ fontSize: pt(s.fontSizes?.dates ?? 5), display: 'flex', gap: '2mm', justifyContent: s.align === 'center' ? 'center' : s.align === 'right' ? 'flex-end' : 'flex-start' }}>
              {f.madeOn && <span>Made <b>{fmtDate(today)}</b></span>}
              {f.bestBefore && <span>Best before <b>{fmtDate(best)}</b></span>}
            </div>
          )}

          {f.note && s.note && <div style={{ fontSize: pt(s.fontSizes?.note ?? 4.8), fontStyle: 'italic', opacity: 0.8, textAlign: s.align === 'center' ? 'center' : s.align === 'right' ? 'right' : 'left' }}>{s.note}</div>}

          <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: qrJustify }}>
            {hasBarcode ? (
              <div style={{ width: '100%' }}>
                <BarcodeSvg value={product.barcode!} heightMm={s.barHeight} />
                {f.barcodeDigits && (
                  <div style={{ fontSize: pt(s.fontSizes?.barcodeDigits ?? (s.templateId === 'classic' ? 3.6 : 4.0)), fontFamily: "'SF Mono', Menlo, monospace", letterSpacing: '0.14em', textAlign: 'center', marginTop: '0.3mm' }}>
                    {product.barcode}
                  </div>
                )}
              </div>
            ) : f.barcode ? (
              <div style={{ height: `${s.barHeight}mm`, width: '100%', border: '0.3mm dashed #999', borderRadius: '1mm', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: pt(5), color: '#999' }}>
                No barcode
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
