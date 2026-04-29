import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Product, ProductVariant, Addon, ProductAddon } from '@/app/types';
import { useState, useEffect } from 'react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface ProductCustomizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onAddToCart: (product: Product, selectedVariant?: ProductVariant, selectedAddons?: Addon[], quantity?: number) => void;
}


export function ProductCustomizationModal({ isOpen, onClose, product, onAddToCart }: ProductCustomizationModalProps) {
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
    const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (isOpen && product) {
            setSelectedAddons([]);
            setQuantity(1);

            if (product.variants && product.variants.length > 0) {
                const defaultVariant = product.variants.find(v => v.is_default) || product.variants[0];
                setSelectedVariant(defaultVariant);
            } else {
                setSelectedVariant(undefined);
            }
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const toggleAddon = (addon: Addon) => {
        const exists = selectedAddons.find(a => a.id === addon.id);
        if (exists) {
            setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
        } else {
            setSelectedAddons([...selectedAddons, addon]);
        }
    };

    const isAddonSelected = (addonId: string) => selectedAddons.some(a => a.id === addonId);

    const basePrice = Number(product.base_price) || 0;
    const variantModifier = selectedVariant ? Number(selectedVariant.price_modifier) : 0;
    const optionsPrice = selectedAddons.reduce((acc, curr) => acc + Number(curr.price), 0);
    const totalPrice = (basePrice + variantModifier + optionsPrice) * quantity;

    const handleAdd = () => {
        onAddToCart(product, selectedVariant, selectedAddons, quantity);
        onClose();
    };

    const hasVariants = product.variants && product.variants.length > 0;
    const addonsFromProduct = product.product_addons?.map((pa: ProductAddon) => pa.addon).filter(Boolean) as Addon[];
    const hasAddons = addonsFromProduct && addonsFromProduct.length > 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-slate-900/60"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 500 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none"
                    >
                        <div className="bg-white pointer-events-auto w-full max-w-5xl my-0 sm:my-auto max-h-[95vh] lg:max-h-[85vh] rounded-t-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative">

                            {/* Left Side: Product Shot */}
                            <div className="relative w-full lg:w-[45%] h-48 sm:h-64 lg:h-auto bg-slate-50 shrink-0">
                                <div className="absolute inset-0 p-3 sm:p-5 lg:p-8">
                                    <div className="relative size-full overflow-hidden rounded-[2rem] shadow-inner border border-slate-100 bg-white">
                                        <ImageWithFallback
                                            src={product.image_url || ""}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex flex-col justify-end p-6 lg:p-10">
                                            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white mb-2 uppercase tracking-widest">
                                                Selection
                                            </div>
                                            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">{product.name}</h2>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 lg:left-10 lg:top-10 z-10 flex size-10 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur transition-all hover:scale-110 hover:bg-white active:scale-95"
                                >
                                    <X className="size-5 text-slate-900" />
                                </button>
                            </div>

                            {/* Right Side: Options */}
                            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-white opacity-100">
                                <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
                                    {(hasVariants || hasAddons) ? (
                                        <div className="space-y-10">
                                            {/* Variants Section */}
                                            {hasVariants && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-bold text-slate-900 tracking-tight">Choose a Size</h3>
                                                        <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-2.5 py-1 rounded-full">Required</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {product.variants!.map(variant => {
                                                            const isSelected = selectedVariant?.id === variant.id;
                                                            const priceDiff = Number(variant.price_modifier);
                                                            return (
                                                                <motion.div
                                                                    key={variant.id}
                                                                    whileTap={{ scale: 0.97 }}
                                                                    onClick={() => setSelectedVariant(variant)}
                                                                    className={`
                                                                        group relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[80px]
                                                                        ${isSelected
                                                                            ? 'border-brand-primary bg-brand-primary/5 shadow-md shadow-brand-primary/5'
                                                                            : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-brand-primary/30'}
                                                                    `}
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <span className={`font-bold transition-colors ${isSelected ? 'text-brand-primary' : 'text-slate-900'}`}>
                                                                            {variant.name}
                                                                        </span>
                                                                        {isSelected && (
                                                                            <div className="flex size-5 items-center justify-center rounded-full bg-brand-primary text-white">
                                                                                <Check className="size-3" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <span className={`text-xs font-semibold ${isSelected ? 'text-brand-primary/70' : 'text-slate-400'}`}>
                                                                        {priceDiff === 0 ? 'Standard Price' : `${priceDiff > 0 ? '+' : ''}$${priceDiff.toFixed(2)}`}
                                                                    </span>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Add-ons Section */}
                                            {hasAddons && (
                                                <div className="space-y-4">
                                                    <h3 className="font-bold text-slate-900 tracking-tight">Extra Options</h3>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {addonsFromProduct.map(addon => {
                                                            const isSelected = isAddonSelected(addon.id);
                                                            const addonPrice = Number(addon.price);
                                                            return (
                                                                <motion.div
                                                                    key={addon.id}
                                                                    whileTap={{ scale: 0.99 }}
                                                                    onClick={() => toggleAddon(addon)}
                                                                    className={`
                                                                        flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer
                                                                        ${isSelected
                                                                            ? 'border-brand-primary bg-brand-primary/5 shadow-md shadow-brand-primary/5'
                                                                            : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm'}
                                                                    `}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`
                                                                            flex size-6 items-center justify-center rounded-lg border-2 transition-all
                                                                            ${isSelected ? 'bg-brand-primary border-brand-primary text-white' : 'border-slate-200 bg-white group-hover:border-slate-300'}
                                                                        `}>
                                                                            {isSelected && <Check className="size-4" />}
                                                                        </div>
                                                                        <span className={`font-bold transition-colors ${isSelected ? 'text-brand-primary' : 'text-slate-700'}`}>
                                                                            {addon.name}
                                                                        </span>
                                                                    </div>
                                                                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${isSelected ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-100 text-slate-400'}`}>
                                                                        +${addonPrice.toFixed(2)}
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                            <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <ShoppingCart className="size-10" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Classic Item</h4>
                                                <p className="text-slate-400 text-sm">No special options needed for this selection.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Area */}
                                <div className="p-5 sm:p-8 lg:p-10 border-t border-slate-100 bg-slate-50/50 space-y-4 sm:space-y-6">
                                    <div className="flex items-end justify-between">
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Investment</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-500 line-through decoration-slate-300">
                                                    ${((basePrice + variantModifier + optionsPrice)).toFixed(2)}
                                                </span>
                                                <ArrowRight className="size-3 text-slate-300" />
                                                <span className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">${totalPrice.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* Functional Quantity Counter */}
                                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
                                            >
                                                <Minus className="size-4" />
                                            </button>
                                            <span className="font-bold text-sm text-slate-900 px-2 min-w-[20px] text-center">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-900 transition-colors"
                                            >
                                                <Plus className="size-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleAdd}
                                        className="w-full h-14 sm:h-16 bg-slate-900 text-white font-black rounded-xl sm:rounded-[1.25rem] shadow-2xl shadow-slate-900/20 hover:bg-brand-primary hover:shadow-brand-primary/30 transition-all flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <ShoppingCart className="size-5" />
                                        <span className="text-lg">Add {quantity > 1 ? `${quantity} Items` : 'Item'} to Cart</span>
                                        <div className="ml-2 bg-white/10 px-3 py-1.5 rounded-lg text-sm font-bold border border-white/10">
                                            ${totalPrice.toFixed(2)}
                                        </div>
                                    </motion.button>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
