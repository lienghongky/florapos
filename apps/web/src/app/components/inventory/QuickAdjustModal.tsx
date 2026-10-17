import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Zap, Package, Plus, Minus, 
  RotateCcw, Camera, CheckCircle2, 
  AlertCircle, History, Loader2, ArrowRight
} from 'lucide-react';
import { useInventoryStore } from '@/app/store/inventory-store';
import { useProductStore } from '@/app/store/product-store';
import { CameraScannerModal } from '@/app/components/pos/CameraScannerModal';
import { cleanScannedCode } from '@/app/lib/product-code-index';
import { scanFeedback } from '@/app/lib/scan-feedback';
import { useBarcodeScanner } from '@/app/hooks/useBarcodeScanner';
import { InventoryItem } from '@/app/types';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { toast } from 'sonner';

interface QuickAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAdjustModal({ isOpen, onClose }: QuickAdjustModalProps) {
  const { findInventoryItemByCode, adjustInventoryStock } = useInventoryStore();
  const { products, categories } = useProductStore();
  
  // State
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentAction, setAdjustmentAction] = useState<'increase' | 'decrease' | 'set'>('increase');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [recentAdjustments, setRecentAdjustments] = useState<{name: string, qty: number, type: string}[]>([]);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isCameraOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isCameraOpen]);

  // Handle Finding Item
  const handleFind = async (rawCode: string) => {
    const code = cleanScannedCode(rawCode);
    if (!code) return null;
    setLoading(true);
    try {
      const item = await findInventoryItemByCode(code);
      if (item) {
        setFoundItem(item);
        setSearchCode('');
        toast.success(`Found item: ${item.name}`);
        return item;
      } else {
        toast.error(`Item not found for "${code}"`);
        return null;
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error finding item');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Hardware barcode scanner support
  useBarcodeScanner({
    enabled: isOpen && !isCameraOpen,
    onScan: (code) => {
      scanFeedback.success();
      scanFeedback.vibrate();
      handleFind(code);
    }
  });

  // Handle Adjustment
  const handleAdjust = async () => {
    if (!foundItem) return;
    
    try {
      setLoading(true);
      await adjustInventoryStock(
        foundItem.id, 
        adjustmentAction, 
        adjustmentQty, 
        adjustmentAction === 'set' ? 'Quick manual set' : `Quick ${adjustmentAction}`
      );
      
      toast.success(`Updated ${foundItem.name} successfully`);
      
      // Update local recent list
      setRecentAdjustments((prev: {name: string, qty: number, type: string}[]) => [
        { name: foundItem.name, qty: adjustmentQty, type: adjustmentAction },
        ...prev.slice(0, 4)
      ]);
      
      // Reset for next scan
      setFoundItem(null);
      setAdjustmentQty(1);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e) {
      toast.error('Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={async (rawCode) => {
          const code = cleanScannedCode(rawCode);
          if (!code) return false;
          scanFeedback.success();
          scanFeedback.vibrate();
          const item = await handleFind(code);
          return !!item;
        }}
        title="Scan Inventory QR or Barcode"
        subtitle="Point camera at item QR code or barcode to adjust stock"
        initialContinuous={false}
      />

      <AnimatedModal isOpen={isOpen} onClose={() => {
        setIsCameraOpen(false);
        onClose();
      }}>
        <div className="w-[min(680px,94vw)] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col my-auto max-h-[92vh]">
          {/* Header */}
          <div className="bg-primary p-6 text-white relative">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-white/20 rounded-xl">
                 <Zap className="size-6" />
               </div>
               <div>
                 <h2 className="text-xl font-bold">Quick Adjust</h2>
                 <p className="text-primary-foreground/80 text-sm">Scan QR code, barcode, or search item to update stock</p>
               </div>
            </div>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-6 sm:p-7 space-y-6">
            {/* Finding Section */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <form 
                  onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleFind(searchCode); }}
                  className="relative flex-1"
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter Barcode, SKU or Name..."
                    value={searchCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  />
                </form>
                <button 
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-semibold shadow-xs"
                  title="Scan QR or Barcode with Camera"
                >
                  <Camera className="size-5" />
                  <span className="hidden sm:inline text-xs font-bold">Scan QR / Code</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {foundItem ? (
              <motion.div
                key="found"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Item Details */}
                {(() => {
                  const ownerProduct = foundItem && !foundItem.category_id ? products.find(p => p.name === foundItem.name) : null;
                  const categoryName = foundItem.category?.name || 
                                      categories.find(c => c.id === foundItem.category_id)?.name ||
                                      categories.find(c => c.id === ownerProduct?.category_id)?.name ||
                                      'Uncategorized';
                  return (
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                          <Package className="size-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{foundItem.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground font-mono">{foundItem.sku || 'No SKU'}</span>
                            <span className="size-1 rounded-full bg-muted-foreground/30" />
                            <span className="text-xs font-semibold text-primary/80">
                              {categoryName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Stock</p>
                        <p className="text-2xl font-black text-primary">{foundItem.current_stock}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Adjustment Controls */}
                <div className="space-y-4">
                  <div className="flex rounded-xl bg-muted p-1 border border-border">
                    {[
                      { id: 'increase', label: 'Inbound (+)', color: 'text-green-600' },
                      { id: 'decrease', label: 'Outbound (-)', color: 'text-red-600' },
                      { id: 'set', label: 'Set Exact', color: 'text-blue-600' },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setAdjustmentAction(btn.id as any)}
                        className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${adjustmentAction === btn.id ? 'bg-white shadow-sm ' + btn.color : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 border border-border rounded-xl p-2 bg-white ring-1 ring-black/5">
                        <button 
                          onClick={() => setAdjustmentQty(Math.max(0, adjustmentQty - 1))}
                          className="size-10 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                        >
                          <Minus className="size-5" />
                        </button>
                        <input 
                          type="number" 
                          value={adjustmentQty}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdjustmentQty(parseInt(e.target.value) || 0)}
                          className="flex-1 text-center font-black text-xl outline-none"
                        />
                        <button 
                          onClick={() => setAdjustmentQty(adjustmentQty + 1)}
                          className="size-10 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                        >
                          <Plus className="size-5" />
                        </button>
                      </div>
                    </div>
                    {/* Quick Qty Presets */}
                    <div className="flex gap-2">
                       {[5, 10, 20, 50].map(q => (
                         <button 
                           key={q}
                           onClick={() => setAdjustmentQty(q)}
                           className="px-3 py-2 rounded-lg bg-muted text-xs font-bold hover:bg-muted/80 transition-colors"
                         >
                           +{q}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setFoundItem(null)}
                    className="flex-1 py-4 rounded-xl border border-border font-bold text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="size-5" />
                    Reset
                  </button>
                  <button 
                    disabled={loading}
                    onClick={handleAdjust}
                    className="flex-[2] py-4 rounded-xl bg-primary shadow-lg shadow-primary/20 text-white font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
                    Confirm Update
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="size-20 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                  <BarCodeIcon className="size-10 text-muted-foreground/30" />
                </div>
                <div>
                   <p className="text-lg font-bold text-muted-foreground/60">Ready to Scan</p>
                   <p className="text-sm text-muted-foreground/40 max-w-[240px]">Found items will appear here for adjustment</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent History Mini-list */}
          {recentAdjustments.length > 0 && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                 <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                   <History className="size-3" />
                   Recent Highlights
                 </h4>
              </div>
              <div className="space-y-2">
                 {recentAdjustments.map((adj: {name: string, qty: number, type: string}, i: number) => (
                   <div key={i} className="flex items-center justify-between text-xs font-medium p-2 bg-muted/20 rounded-lg">
                     <span className="text-foreground truncate">{adj.name}</span>
                     <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{adj.type === 'set' ? 'Fixed' : adj.type}</span>
                        <ArrowRight className="size-2 text-muted-foreground" />
                        <span className={adj.type === 'increase' ? 'text-green-600' : adj.type === 'decrease' ? 'text-red-600' : 'text-blue-600'}>
                          {adj.qty}
                        </span>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedModal>
    </>
  );
}

function BarCodeIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 5v14" />
      <path d="M21 5v14" />
      <path d="M7 5v14" />
      <path d="M17 5v14" />
      <path d="M12 5v14" />
    </svg>
  );
}
