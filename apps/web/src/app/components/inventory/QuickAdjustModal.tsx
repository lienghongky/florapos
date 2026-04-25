import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Zap, Package, Plus, Minus, 
  RotateCcw, Camera, CameraOff, CheckCircle2, 
  AlertCircle, History, Loader2, ArrowRight
} from 'lucide-react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useApp, InventoryItem } from '@/app/context/AppContext';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { toast } from 'sonner';

interface QuickAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAdjustModal({ isOpen, onClose }: QuickAdjustModalProps) {
  const { findInventoryItemByCode, adjustInventoryStock } = useApp();
  
  // State
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentAction, setAdjustmentAction] = useState<'increase' | 'decrease' | 'set'>('increase');
  const [isScanning, setIsScanning] = useState(false);
  const [recentAdjustments, setRecentAdjustments] = useState<{name: string, qty: number, type: string}[]>([]);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isScanning) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isScanning]);

  // Handle Finding Item
  const handleFind = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const item = await findInventoryItemByCode(code);
      if (item) {
        setFoundItem(item);
        setSearchCode('');
        // If we found it via scan, maybe auto-focus qty or something
      } else {
        toast.error('Item not found');
      }
    } catch (e) {
      toast.error('Error finding item');
    } finally {
      setLoading(false);
    }
  };

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

  // Scan Logic
  useEffect(() => {
    if (isScanning) {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleFind(decodedText);
          setIsScanning(false);
        },
        (errorMessage) => {
          // parse errors are normal
        }
      ).catch(err => {
        console.error("Camera start error", err);
        setIsScanning(false);
        toast.error('Could not start camera');
      });

      return () => {
        if (scannerRef.current?.isScanning) {
          scannerRef.current.stop().catch(e => console.error(e));
        }
      };
    }
  }, [isScanning]);

  return (
    <AnimatedModal isOpen={isOpen} onClose={() => {
      if (isScanning) setIsScanning(false);
      onClose();
    }}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-primary p-6 text-white relative">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-lg">
               <Zap className="size-6" />
             </div>
             <div>
               <h2 className="text-xl font-bold">Quick Adjust</h2>
               <p className="text-primary-foreground/80 text-sm">Scan barcode or find item to update stock</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
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
                onClick={() => setIsScanning(!isScanning)}
                className={`flex items-center justify-center p-3 rounded-xl border border-border transition-all ${isScanning ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white hover:bg-muted'}`}
                title={isScanning ? "Stop Camera" : "Scan with Camera"}
              >
                {isScanning ? <CameraOff className="size-6" /> : <Camera className="size-6" />}
              </button>
            </div>

            {isScanning && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl border-2 border-dashed border-primary/30 bg-muted/10 p-2"
              >
                <div id="reader" className="w-full overflow-hidden rounded-lg aspect-video" />
                <p className="text-center text-xs text-muted-foreground mt-2">Position the barcode within the frame</p>
              </motion.div>
            )}
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
                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Package className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{foundItem.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{foundItem.sku || 'No SKU'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Stock</p>
                    <p className="text-2xl font-black text-primary">{foundItem.current_stock}</p>
                  </div>
                </div>

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
                       {[5, 10, 50].map(q => (
                         <button 
                           key={q}
                           onClick={() => setAdjustmentQty(q)}
                           className="px-3 py-2 rounded-lg bg-muted text-xs font-bold hover:bg-muted/80"
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
