import { useState } from 'react';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { Product } from '@/app/types';
import { toast } from 'sonner';

export function UnknownBarcodeModal({ code, products, role, onClose, onSearch, onAssign, onCreate }: {
  code: string; products: Product[]; role?: string; onClose: () => void;
  onSearch: () => void; onAssign: (product: Product) => Promise<void>; onCreate: () => void;
}) {
  const [productId, setProductId] = useState('');
  const [busy, setBusy] = useState(false);
  const canAssign = ['owner', 'manager'].includes(role?.toLowerCase() || '');
  return <AnimatedModal isOpen={!!code} onClose={busy ? undefined : onClose} position="center">
    <div data-scanner-pause role="dialog" aria-label="Unknown barcode" className="w-[min(440px,90vw)] space-y-4 rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="text-lg font-bold">Unknown barcode</h2>
      <p>No product found for <strong className="break-all font-mono">{code}</strong>.</p>
      <button disabled={busy} className="w-full rounded-lg border p-3" onClick={onSearch}>Search manually</button>
      {canAssign && <>
        <label className="block text-sm">Assign to a product
          <select disabled={busy} className="mt-2 w-full rounded-lg border p-3" value={productId} onChange={e => setProductId(e.target.value)}>
            <option value="">Choose product</option>
            {products.filter(p => p.is_active).map(p => <option key={p.id} value={p.id}>{p.name}{p.barcode ? ` (${p.barcode})` : ''}</option>)}
          </select>
        </label>
        <p className="text-xs text-slate-500">This replaces the selected product’s barcode.</p>
        <button className="w-full rounded-lg bg-brand-primary p-3 text-white disabled:opacity-50" disabled={busy || !productId} onClick={async () => {
          const product = products.find(p => p.id === productId);
          if (!product) return;
          setBusy(true);
          try { await onAssign(product); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not assign barcode'); } finally { setBusy(false); }
        }}>{busy ? 'Saving…' : 'Assign and add to cart'}</button>
      </>}
      {role?.toLowerCase() === 'owner' && <button disabled={busy} className="w-full rounded-lg border p-3" onClick={onCreate}>Create new product</button>}
      <button disabled={busy} className="w-full p-2 text-slate-500" onClick={onClose}>Cancel</button>
    </div>
  </AnimatedModal>;
}
