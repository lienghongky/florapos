import { getLabelConnection } from './label-printer-connection';
import { printDirectLabels } from './direct-label-print';
import { LabelPrinterSettingsModal, loadLabelPrinterPreferences, saveLabelPrinterPreferences } from './LabelPrinterSettingsModal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createLabelPdf, validateLabelLayout } from './label-pdf';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  X, Search, Minus, Plus, Printer, Tag, ChevronRight, ChevronLeft, Sparkles, Check, AlertCircle, ZoomIn, ZoomOut, Barcode as BarcodeIcon, Share2, Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { Label, LabelProduct } from './Label';
import {
  LABEL_TEMPLATES, LabelSettings, LabelFields, LabelFontSizes, SHEET_PRESETS, applyTemplate, loadSettings, saveSettings,
} from './label-templates';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  categories: { id: string; name: string }[];
  storeId?: string;
  storeName?: string;
  initialProductIds?: string[];
  /** Persist a generated barcode for a product. */
  onSaveBarcode: (product: any, barcode: string) => Promise<void>;
  generateBarcode: () => string;
}

const MM_TO_PX = 3.78; // 96dpi

const FIELD_LABELS: { key: keyof LabelFields; label: string }[] = [
  { key: 'storeName', label: 'Store name' },
  { key: 'productName', label: 'Product name' },
  { key: 'price', label: 'Price' },
  { key: 'showKhrPrice', label: 'KH price (៛)' },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'barcodeDigits', label: 'Barcode digits' },
  { key: 'madeOn', label: 'Made on date' },
  { key: 'bestBefore', label: 'Best before' },
  { key: 'note', label: 'Custom note' },
];

export function PrintLabelsModal({
  isOpen, onClose, products, categories, storeId, storeName, initialProductIds, onSaveBarcode, generateBarcode,
}: Props) {
  const currentStore = useAuthStore(s => s.selectedStore);
  const storeExchangeRate = currentStore?.exchange_rate ? Number(currentStore.exchange_rate) : 4100;
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'name_asc'>('created_desc');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<LabelSettings>(() => {
    const loaded = loadSettings(storeId, storeExchangeRate);
    return { ...loaded, exchangeRate: storeExchangeRate };
  });
  const [labelPrinter, setLabelPrinter] = useState(() => loadLabelPrinterPreferences(storeId));
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [zoom, setZoom] = useState(1.6);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [printing, setPrinting] = useState(false);
  const [directPrinting, setDirectPrinting] = useState(false);
  const [directProgress, setDirectProgress] = useState(0);
  const directBusy = useRef(false);
  const [downloading, setDownloading] = useState(false);
  const exportController = useRef<AbortController | null>(null);
  const exportUrl = useRef<string | null>(null);
  const [exportProgress, setExportProgress] = useState({ done: 0, total: 0 });
  useEffect(() => () => {
    exportController.current?.abort();
    if (exportUrl.current) URL.revokeObjectURL(exportUrl.current);
  }, []);
  useEffect(() => { if (!isOpen) exportController.current?.abort(); }, [isOpen]);

  // Reset when opened
  useEffect(() => {
    if (!isOpen) return;
    const loaded = loadSettings(storeId, storeExchangeRate);
    setSettings({
      ...loaded,
      exchangeRate: storeExchangeRate,
    });
    setLabelPrinter(loadLabelPrinterPreferences(storeId));
    setShowPrinterSettings(false);
    setPendingPrint(false);
    const init: Record<string, number> = {};
    (initialProductIds || []).forEach(id => { init[id] = 1; });
    setQty(init);
    setStep(initialProductIds?.length ? 2 : 1);
    setQuery('');
  }, [isOpen, storeId, storeExchangeRate]);

  useEffect(() => { if (isOpen) saveSettings(storeId, settings); }, [settings]);

  const catName = (id?: string) => categories.find(c => c.id === id)?.name || '';

  const labelProducts: (LabelProduct & { raw: any })[] = useMemo(() => products.map(p => ({
    id: p.id,
    name: p.name,
    price: Number(p.base_price ?? p.price ?? 0),
    sku: p.sku || '',
    barcode: p.barcode || '',
    category: catName(p.category_id),
    raw: p,
  })), [products, categories]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = labelProducts.filter(p => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.includes(q);
      const matchC = categoryFilter === 'all' || p.raw.category_id === categoryFilter;
      const matchM = !onlyMissing || !p.barcode;
      return matchQ && matchC && matchM;
    });

    const getCreatedTime = (p: typeof labelProducts[0]) => {
      const t = p.raw?.created_at ? new Date(p.raw.created_at).getTime() : 0;
      return isNaN(t) ? 0 : t;
    };

    return list.sort((a, b) => {
      if (sortBy === 'created_desc') {
        const diff = getCreatedTime(b) - getCreatedTime(a);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      if (sortBy === 'created_asc') {
        const diff = getCreatedTime(a) - getCreatedTime(b);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [labelProducts, query, categoryFilter, onlyMissing, sortBy]);

  const selected = labelProducts.filter(p => (qty[p.id] || 0) > 0);
  const totalLabels = selected.reduce((n, p) => n + qty[p.id], 0);
  const missingSelected = selected.filter(p => !p.barcode);
  const printItems = selected.flatMap(p => Array.from({ length: qty[p.id] }, () => p));

  const setQ = (id: string, n: number) => setQty(prev => ({ ...prev, [id]: Math.max(0, Math.min(999, n)) }));
  const toggle = (id: string) => setQ(id, qty[id] ? 0 : 1);
  const update = (patch: Partial<LabelSettings>) => setSettings(s => ({ ...s, ...patch, templateId: patch.templateId ?? (patch.width || patch.height ? 'custom' : s.templateId) }));
  const toggleField = (k: keyof LabelFields) => setSettings(s => ({ ...s, fields: { ...s.fields, [k]: !s.fields[k] } }));
  const updateFontSize = (key: keyof LabelFontSizes, val: number) => {
    setSettings(s => ({
      ...s,
      fontSizes: {
        ...(s.fontSizes || {}),
        [key]: val > 0 ? val : undefined,
      },
    }));
  };

  const generateFor = async (list: typeof labelProducts) => {
    const ids = new Set(savingIds);
    list.forEach(p => ids.add(p.id));
    setSavingIds(ids);
    let ok = 0;
    for (const p of list) {
      try { await onSaveBarcode(p.raw, generateBarcode()); ok++; }
      catch (e: any) { toast.error(`${p.name}: ${e?.message || 'failed to save barcode'}`); }
    }
    setSavingIds(new Set());
    if (ok) toast.success(`Generated ${ok} barcode${ok > 1 ? 's' : ''}`);
  };

  const handlePrint = async () => {
    if (!printItems.length || directBusy.current) return;
    if (!labelPrinter.configured) { setPendingPrint(true); setShowPrinterSettings(true); return; }
    if (labelPrinter.output === 'pdf') { void handleShare(); return; }
    if (labelPrinter.output === 'bluetooth' || labelPrinter.output === 'usb' || labelPrinter.output === 'pocket') {
      const connection = getLabelConnection(labelPrinter.output, labelPrinter.deviceId);
      if (!connection) { setPendingPrint(true); setShowPrinterSettings(true); return; }
      directBusy.current = true; setDirectPrinting(true); setDirectProgress(0);
      try {
        await printDirectLabels(connection, selected.map(product => ({ product, quantity: qty[product.id] })), settings, storeName, done => setDirectProgress(done));
        toast.success('Label data sent to ' + connection.name);
      } catch (e) { toast.error(e instanceof Error ? e.message : 'Label printer failed. Check the printer before retrying.'); }
      finally { directBusy.current = false; setDirectPrinting(false); }
      return;
    }
    try { validateLabelLayout(settings); } catch (e) { toast.error(e instanceof Error ? e.message : 'Check label settings'); return; }
    if (missingSelected.length && settings.fields.barcode) {
      toast.warning(`${missingSelected.length} product(s) have no barcode — their labels will show a placeholder.`);
    }
    setPrinting(true);
    // Wait for the print DOM + SVGs to render
    setTimeout(() => {
      const done = () => setPrinting(false);
      window.addEventListener('afterprint', done, { once: true });
      try { window.print(); } catch { window.removeEventListener('afterprint', done); setPrinting(false); toast.error('Could not open print dialog.'); }
    }, 150);
  };

  const triggerDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url; link.download = name; link.target = '_blank'; link.rel = 'noopener';
    document.body.appendChild(link); link.click(); link.remove();
  };

  const handleShare = async () => {
    if (!selected.length || exportController.current) return;
    const controller = new AbortController();
    exportController.current = controller;
    setDownloading(true);
    setExportProgress({ done: 0, total: totalLabels });
    if (exportUrl.current) { URL.revokeObjectURL(exportUrl.current); exportUrl.current = null; }
    try {
      const pdf = await createLabelPdf(selected.map(product => ({ product, quantity: qty[product.id] })), settings, {
        storeName, signal: controller.signal,
        onProgress: (done, total) => setExportProgress({ done, total }),
      });
      controller.signal.throwIfAborted();
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      exportUrl.current = url;
      const name = 'labels-' + new Date().toISOString().slice(0, 10) + '-' + settings.width + 'x' + settings.height + 'mm.pdf';

      // Trigger native share dialog
      const file = new File([blob], name, { type: 'application/pdf' });
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Barcode labels' });
        } catch (shareErr: any) {
          if (shareErr?.name !== 'AbortError') {
            triggerDownload(url, name);
          }
        }
      } else {
        triggerDownload(url, name);
        toast.success('PDF downloaded.');
      }
    } catch (e: any) {
      if (!controller.signal.aborted) toast.error(e?.message || 'Failed to generate PDF');
    } finally {
      exportController.current = null;
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (pendingPrint && !showPrinterSettings && labelPrinter.configured) {
      setPendingPrint(false);
      handlePrint();
    }
  }, [pendingPrint, showPrinterSettings, labelPrinter]);

  // Sheet pagination
  const perSheet = Math.max(1, Math.floor(settings.sheetCols) || 1) * Math.max(1, Math.floor(settings.sheetRows) || 1);
  const sheets: typeof printItems[] = [];
  if (settings.paper === 'sheet') for (let i = 0; i < printItems.length; i += perSheet) sheets.push(printItems.slice(i, i + perSheet));

  const previewProduct = selected[0] || labelProducts[0] || { id: 'x', name: 'Red Rose Bouquet', price: 4.5, sku: 'RED-1024', barcode: '201234567893', category: 'Flowers' };

  return (
    <>
      <AnimatedModal 
        isOpen={isOpen} 
        closeOnClickOutside={false}
        onClose={downloading || directPrinting || showPrinterSettings ? undefined : onClose} 
        position="center"
      >
        <div className="flex w-[min(1100px,96vw)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ height: 'min(760px, 92dvh)' }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-brand-primary/5 via-white to-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <Tag className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-tight">Print Barcode Labels</h2>
                <p className="text-xs text-muted-foreground">For fresh-made & unlabeled items</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button aria-label="Label printer settings" disabled={downloading || printing || directPrinting} onClick={() => { setPendingPrint(false); setShowPrinterSettings(true); }} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">
                <Printer className="size-4" /><span>Printer settings</span>
              </button>
              {/* Stepper */}
              <div className="hidden items-center gap-2 text-xs font-semibold sm:flex">
                {[{ n: 1, l: 'Select products' }, { n: 2, l: 'Design & print' }].map(({ n, l }, i) => (
                  <div key={n} className="flex items-center gap-2">
                    {i > 0 && <div className="h-px w-6 bg-border" />}
                    <button
                      onClick={() => (n === 1 || selected.length) && setStep(n as 1 | 2)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition-all ${step === n ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
                    >
                      <span className="flex size-4 items-center justify-center rounded-full bg-white/25 text-[10px]">{step > n ? <Check className="size-3" /> : n}</span>
                      {l}
                    </button>
                  </div>
                ))}
              </div>
              <button disabled={downloading || directPrinting} onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
            </div>
          </div>

          {/* Body */}
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 ? (
                <motion.div key="s1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="flex h-full flex-col">
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-3">
                    <div className="relative min-w-[220px] flex-1">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="label-product-search"
                        autoFocus
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search name, SKU or barcode…"
                        className="w-full rounded-lg border border-border bg-muted/30 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-muted/30 px-3 text-sm outline-none">
                      <option value="all">All categories</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="h-9 rounded-lg border border-border bg-muted/30 px-3 text-sm outline-none font-medium"
                    >
                      <option value="created_desc">Created: Newest</option>
                      <option value="created_asc">Created: Oldest</option>
                      <option value="name_asc">Name: A-Z</option>
                    </select>
                    <button
                      onClick={() => setOnlyMissing(v => !v)}
                      className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-all ${onlyMissing ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-border text-muted-foreground hover:bg-muted'}`}
                    >
                      <AlertCircle className="size-3.5" /> Missing barcode
                    </button>
                    <button
                      onClick={() => setQty(prev => { const n = { ...prev }; filtered.forEach(p => { if (!n[p.id]) n[p.id] = 1; }); return n; })}
                      className="h-9 rounded-lg px-3 text-xs font-semibold text-brand-primary hover:bg-brand-primary/10"
                    >
                      Select all ({filtered.length})
                    </button>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto px-3 py-2">
                    {filtered.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">No products found</div>}
                    {filtered.map(p => {
                      const n = qty[p.id] || 0;
                      const saving = savingIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggle(p.id)}
                          className={`group mx-3 my-1 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${n ? 'border-brand-primary/40 bg-brand-primary/[0.04] shadow-sm' : 'border-transparent hover:bg-muted/50'}`}
                        >
                          <div className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${n ? 'border-brand-primary bg-brand-primary text-white' : 'border-border bg-white'}`}>
                            {n > 0 && <Check className="size-3.5" strokeWidth={3} />}
                          </div>
                          <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {p.raw.image_url && <img src={p.raw.image_url} alt="" className="size-full object-cover" onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">{p.name}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>${p.price.toFixed(2)}</span>
                              {p.category && <span>· {p.category}</span>}
                              {p.sku && <span className="font-mono">· {p.sku}</span>}
                              {p.raw.created_at && (
                                <span className="text-[11px] text-muted-foreground/80">
                                  · {new Date(p.raw.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="hidden w-36 shrink-0 text-right sm:block" onClick={e => e.stopPropagation()}>
                            {p.barcode ? (
                              <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground"><BarcodeIcon className="size-3.5" />{p.barcode}</span>
                            ) : (
                              <button
                                disabled={saving}
                                onClick={() => generateFor([p])}
                                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 transition-all hover:bg-amber-100 disabled:opacity-50"
                              >
                                <Sparkles className={`size-3 ${saving ? 'animate-spin' : ''}`} /> {saving ? 'Saving…' : 'Generate'}
                              </button>
                            )}
                          </div>
                          <div className={`flex shrink-0 items-center rounded-lg border border-border bg-white transition-opacity ${n ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} onClick={e => e.stopPropagation()}>
                            <button onClick={() => setQ(p.id, n - 1)} className="p-1.5 text-muted-foreground hover:text-foreground"><Minus className="size-3.5" /></button>
                            <input
                              value={n}
                              onChange={e => setQ(p.id, parseInt(e.target.value) || 0)}
                              className="w-9 bg-transparent text-center text-sm font-semibold outline-none"
                            />
                            <button onClick={() => setQ(p.id, n + 1)} className="p-1.5 text-muted-foreground hover:text-foreground"><Plus className="size-3.5" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="grid h-full grid-cols-1 md:grid-cols-[340px_1fr]">
                  {/* Settings panel */}
                  <div className="space-y-6 overflow-y-auto border-r border-border p-5">
                    <section>
                      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Template</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {LABEL_TEMPLATES.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setSettings(s => applyTemplate(s, t))}
                            className={`rounded-xl border p-2.5 text-left transition-all ${settings.templateId === t.id ? 'border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/15' : 'border-border hover:border-brand-primary/40 hover:bg-muted/40'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{t.name}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">{t.width}×{t.height}</span>
                            </div>
                            <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{t.description}</div>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Paper</h3>
                      <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                        {(['roll', 'sheet'] as const).map(m => (
                          <button key={m} onClick={() => update({ paper: m })} className={`rounded-md py-1.5 text-xs font-semibold transition-all ${settings.paper === m ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>
                            {m === 'roll' ? 'Thermal roll' : 'A4 sheet'}
                          </button>
                        ))}
                      </div>
                      {settings.paper === 'sheet' && (
                        <select
                          className="mb-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
                          value=""
                          onChange={e => {
                            const p = SHEET_PRESETS[Number(e.target.value)];
                            if (p) update({ sheetCols: p.cols, sheetRows: p.rows, width: p.width, height: p.height, sheetMargin: p.margin, sheetGap: p.gap });
                          }}
                        >
                          <option value="">Apply sheet preset…</option>
                          {SHEET_PRESETS.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
                        </select>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <NumField label="Width (mm)" value={settings.width} onChange={v => update({ width: v })} />
                        <NumField label="Height (mm)" value={settings.height} onChange={v => update({ height: v })} />
                        {settings.paper === 'sheet' && (
                          <>
                            <NumField label="Columns" value={settings.sheetCols} onChange={v => update({ sheetCols: Math.max(1, v) })} />
                            <NumField label="Rows" value={settings.sheetRows} onChange={v => update({ sheetRows: Math.max(1, v) })} />
                            <NumField label="Margin (mm)" value={settings.sheetMargin} onChange={v => update({ sheetMargin: v })} />
                            <NumField label="Gap (mm)" value={settings.sheetGap} onChange={v => update({ sheetGap: v })} />
                          </>
                        )}
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Show on label</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {FIELD_LABELS.map(({ key, label }) => {
                          const displayLabel = key === 'barcode'
                            ? (settings.codeType === 'qr' ? 'QR code' : 'Barcode')
                            : key === 'barcodeDigits'
                            ? (settings.codeType === 'qr' ? 'Code digits' : 'Barcode digits')
                            : label;
                          return (
                            <button
                              key={key}
                              onClick={() => toggleField(key)}
                              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${settings.fields[key] ? 'bg-brand-primary text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
                            >
                              {displayLabel}
                            </button>
                          );
                        })}
                      </div>
                      {settings.fields.bestBefore && (
                        <div className="mt-3"><NumField label="Best before (+days)" value={settings.bestBeforeDays} onChange={v => update({ bestBeforeDays: v })} /></div>
                      )}
                      {settings.fields.note && (
                        <input value={settings.note} onChange={e => update({ note: e.target.value })} placeholder="Custom note" className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                      )}
                    </section>

                    <section>
                      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Style</h3>
                      <div className="space-y-3">
                        <Segmented
                          label="Code type"
                          value={settings.codeType || 'barcode'}
                          options={[['barcode', 'Barcode'], ['qr', 'QR Code']]}
                          onChange={v => update({ codeType: v as any })}
                        />
                        {settings.codeType === 'qr' && (
                          <Segmented
                            label="QR Alignment"
                            value={settings.codeAlign || 'center'}
                            options={[['left', 'Left'], ['center', 'Center'], ['right', 'Right']]}
                            onChange={v => update({ codeAlign: v as any })}
                          />
                        )}
                        <Segmented label="Overall scale" value={settings.fontScale} options={[['sm', 'S'], ['md', 'M'], ['lg', 'L']]} onChange={v => update({ fontScale: v as any })} />
                        <Segmented label="Text align" value={settings.align} options={[['left', 'Left'], ['center', 'Center']]} onChange={v => update({ align: v as any })} />
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>{settings.codeType === 'qr' ? 'QR size' : 'Barcode height'}</span>
                            <span className="font-mono">{settings.barHeight}mm</span>
                          </div>
                          <input type="range" min={5} max={Math.max(6, Math.floor(settings.height * 0.6))} value={settings.barHeight} onChange={e => update({ barHeight: Number(e.target.value) })} className="w-full accent-[var(--color-brand-primary,#7c3aed)]" />
                        </div>
                        <div className="flex gap-4 text-sm">
                          <Check2 label="Border" checked={settings.border} onChange={v => update({ border: v })} />
                          <Check2 label="Bold price" checked={settings.boldPrice} onChange={v => update({ boldPrice: v })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Currency</span>
                            <input
                              value={settings.currency}
                              onChange={e => update({ currency: e.target.value })}
                              className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm font-mono"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Exchange Rate</span>
                              {settings.exchangeRate !== storeExchangeRate && (
                                <button
                                  type="button"
                                  onClick={() => update({ exchangeRate: storeExchangeRate })}
                                  className="text-[10px] text-brand-primary hover:underline font-semibold"
                                  title={`Reset to store setting: ${storeExchangeRate.toLocaleString()} ៛`}
                                >
                                  Reset ({storeExchangeRate})
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                value={settings.exchangeRate ?? storeExchangeRate}
                                onChange={e => update({ exchangeRate: Number(e.target.value) || storeExchangeRate })}
                                placeholder={String(storeExchangeRate)}
                                className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm font-mono pr-7"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold pointer-events-none">
                                ៛
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-2.5">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Text Sizes (pt)</h3>
                        {settings.fontSizes && Object.values(settings.fontSizes).some(v => v !== undefined) && (
                          <button
                            type="button"
                            onClick={() => update({ fontSizes: {} })}
                            className="text-[10px] text-brand-primary hover:underline font-semibold"
                          >
                            Reset sizes
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {settings.fields.productName && (
                          <NumField
                            label="Product name"
                            value={settings.fontSizes?.productName ?? (settings.templateId === 'classic' ? 5.2 : settings.templateId === 'price' ? 6.5 : 6.0)}
                            onChange={v => updateFontSize('productName', v)}
                          />
                        )}
                        {settings.fields.price && (
                          <NumField
                            label="USD price"
                            value={settings.fontSizes?.price ?? (settings.templateId === 'price' ? 14 : settings.align === 'center' ? 8.5 : 7.8)}
                            onChange={v => updateFontSize('price', v)}
                          />
                        )}
                        {settings.fields.price && settings.fields.showKhrPrice && (
                          <NumField
                            label="KHR price (៛)"
                            value={settings.fontSizes?.khrPrice ?? (settings.templateId === 'price' ? 7 : settings.align === 'center' ? 5 : 4.5)}
                            onChange={v => updateFontSize('khrPrice', v)}
                          />
                        )}
                        {settings.fields.storeName && (
                          <NumField
                            label="Store name"
                            value={settings.fontSizes?.storeName ?? 3.2}
                            onChange={v => updateFontSize('storeName', v)}
                          />
                        )}
                        {(settings.fields.sku || settings.fields.category) && (
                          <NumField
                            label="SKU / Category"
                            value={settings.fontSizes?.sku ?? 5.0}
                            onChange={v => updateFontSize('sku', v)}
                          />
                        )}
                        {settings.fields.barcode && settings.fields.barcodeDigits && (
                          <NumField
                            label={settings.codeType === 'qr' ? 'QR digits' : 'Barcode digits'}
                            value={settings.fontSizes?.barcodeDigits ?? (settings.templateId === 'classic' ? 3.6 : 4.0)}
                            onChange={v => updateFontSize('barcodeDigits', v)}
                          />
                        )}
                        {(settings.fields.madeOn || settings.fields.bestBefore) && (
                          <NumField
                            label="Dates"
                            value={settings.fontSizes?.dates ?? 5.0}
                            onChange={v => updateFontSize('dates', v)}
                          />
                        )}
                        {settings.fields.note && (
                          <NumField
                            label="Custom note"
                            value={settings.fontSizes?.note ?? 4.8}
                            onChange={v => updateFontSize('note', v)}
                          />
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Preview */}
                  <div className="relative flex flex-col overflow-hidden bg-[radial-gradient(circle_at_1px_1px,#e5e7eb_1px,transparent_0)] [background-size:16px_16px] bg-slate-50">
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs font-semibold text-muted-foreground">Live preview · {settings.width}×{settings.height} mm</span>
                      <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-0.5 shadow-sm">
                        <button onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomOut className="size-4" /></button>
                        <span className="w-10 text-center text-xs font-mono">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomIn className="size-4" /></button>
                      </div>
                    </div>
                    <div className="flex flex-1 items-center justify-center overflow-auto p-6">
                      {settings.paper === 'roll' ? (
                        <div className="flex flex-col items-center gap-3">
                          {(selected.length ? selected.slice(0, 3) : [previewProduct]).map(p => (
                            <motion.div key={p.id} layout style={{ zoom }} className="rounded-[2px] shadow-[0_8px_30px_-6px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
                              <Label product={p} settings={settings} storeName={storeName} />
                            </motion.div>
                          ))}
                          {selected.length > 3 && <span className="text-xs text-muted-foreground">+ {selected.length - 3} more products</span>}
                        </div>
                      ) : (
                        <div style={{ zoom: zoom * 0.45 }} className="shadow-[0_10px_40px_-8px_rgba(0,0,0,0.3)]">
                          <SheetPage items={(sheets[0] || [previewProduct as any])} settings={settings} storeName={storeName} preview />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {directPrinting && <p role="status" className="border-t bg-blue-50 px-6 py-3 text-sm">Sending labels to {labelPrinter.deviceName}: {directProgress} / {totalLabels}… Keep this page open.</p>}
          {downloading && <div className="border-t px-6 py-3" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>Preparing labels {exportProgress.done} / {exportProgress.total}</span>
              <button onClick={() => exportController.current?.abort()} className="rounded-lg border px-3 py-2">Cancel export</button>
            </div>
            <progress className="mt-2 w-full" max={exportProgress.total || 1} value={exportProgress.done} />
          </div>}

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-4 py-3.5">
            <div className="text-sm">
              <span className="font-semibold">{selected.length}</span> <span className="text-muted-foreground">products ·</span>{' '}
              <span className="font-semibold">{totalLabels}</span> <span className="text-muted-foreground">labels</span>
              {settings.paper === 'sheet' && totalLabels > 0 && <span className="text-muted-foreground"> · {sheets.length} sheet{sheets.length > 1 ? 's' : ''}</span>}
              {missingSelected.length > 0 && (
                <button onClick={() => generateFor(missingSelected)} className="ml-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100">
                  <Sparkles className="size-3" /> Generate {missingSelected.length} missing barcode{missingSelected.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {step === 2 && (
                <button onClick={() => setStep(1)} className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted">
                  <ChevronLeft className="size-4" /> Back
                </button>
              )}
              {step === 1 ? (
                <button
                  id="label-next-btn"
                  disabled={!selected.length}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 disabled:opacity-40 disabled:shadow-none"
                >
                  Design labels <ChevronRight className="size-4" />
                </button>
              ) : (
                <>
                  <motion.button
                    id="label-share-btn"
                    whileTap={{ scale: 0.97 }}
                    disabled={!totalLabels || downloading || directPrinting}
                    onClick={handleShare}
                    className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition-all hover:border-brand-primary/40 hover:text-brand-primary disabled:opacity-40"
                  >
                    {downloading ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                    {downloading ? 'Generating…' : 'Share'}
                  </motion.button>
                  <motion.button
                  id="label-print-btn"
                  whileTap={{ scale: 0.97 }}
                  disabled={!totalLabels || printing || downloading || directPrinting}
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 disabled:opacity-40"
                >
                  <Printer className="size-4" /> {labelPrinter.output === 'pdf' ? 'Export' : 'Print'} {totalLabels} label{totalLabels !== 1 ? 's' : ''}
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </AnimatedModal>

      {isOpen && showPrinterSettings && <LabelPrinterSettingsModal preferences={labelPrinter} settings={settings} pendingPrint={pendingPrint}
        onClose={() => { setPendingPrint(false); setShowPrinterSettings(false); }}
        onSave={(preferences, layout) => {
          saveLabelPrinterPreferences(storeId, preferences);
          saveSettings(storeId, layout);
          setLabelPrinter(preferences); setSettings(layout); setShowPrinterSettings(false);
        }} />}

      {/* Hidden print root — only visible in @media print */}
      {isOpen && printing && createPortal(
        <div id="label-print-root">
          <style>{`
            #label-print-root { display: none; }
            @media print {
              @page { size: ${settings.paper === 'roll' ? `${settings.width}mm ${settings.height}mm` : 'A4 portrait'}; margin: 0; }
              html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
              body > *:not(#label-print-root) { display: none !important; }
              #label-print-root { display: block !important; }
              /* Override the global receipt rule "body * { visibility: hidden }" */
              #label-print-root, #label-print-root * { visibility: visible !important; }
              #label-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .label-roll-page { page-break-after: always; break-after: page; }
              .label-roll-page:last-child { page-break-after: auto; break-after: auto; }
            }
          `}</style>
          {settings.paper === 'roll'
            ? printItems.map((p, i) => (
              <div key={i} className="label-roll-page"><Label product={p} settings={settings} storeName={storeName} /></div>
            ))
            : sheets.map((items, i) => <SheetPage key={i} items={items} settings={settings} storeName={storeName} />)}
        </div>,
        document.body,
      )}

    </>
  );
}

function SheetPage({ items, settings, storeName, preview }: { items: LabelProduct[]; settings: LabelSettings; storeName?: string; preview?: boolean }) {
  const s = settings;
  return (
    <div
      className="label-roll-page"
      style={{
        width: '210mm', height: '297mm', boxSizing: 'border-box', padding: `${s.sheetMargin}mm`, background: '#fff',
        display: 'grid', gridTemplateColumns: `repeat(${s.sheetCols}, ${s.width}mm)`, gridAutoRows: `${s.height}mm`,
        gap: `${s.sheetGap}mm`, justifyContent: 'center', alignContent: 'start',
      }}
    >
      {items.map((p, i) => (
        <div key={i} style={preview && !s.border ? { outline: '0.2mm dashed #d1d5db' } : undefined}>
          <Label product={p} settings={s} storeName={storeName} />
        </div>
      ))}
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted-foreground">{label}</span>
      <input
        type="number"
        min={0}
        step="0.5"
        value={value}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function Segmented({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
        {options.map(([v, l]) => (
          <button key={v} onClick={() => onChange(v)} className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${value === v ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function Check2({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="size-4 accent-[var(--color-brand-primary,#7c3aed)]" />
      <span className="text-sm">{label}</span>
    </label>
  );
}

export { MM_TO_PX };
