import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { Product, ProductOption, SelectedOption } from '@/app/context/AppContext';
import { useState, useEffect } from 'react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface ProductCustomizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onAddToCart: (product: Product, selectedOptions: SelectedOption[]) => void;
}

// Helper for mapped images (reused from ProductCard - ideally should be a shared utility)
const getFlowerImage = (name: string, category: string): string => {
    const imageMap: Record<string, string> = {
        'Red Roses': 'photo-1518709594023-6eab9bab7b23?w=800&h=800&fit=crop',
        'White Lilies': 'photo-1602492275880-1b23c1a8e6f1?w=800&h=800&fit=crop',
        'Tulips Bouquet': 'photo-1520763185298-1b434c919102?w=800&h=800&fit=crop',
        'Orchid Plant': 'photo-1525310072745-f49212b5ac6d?w=800&h=800&fit=crop',
        'Sunflowers': 'photo-1470509037663-253afd7f0f51?w=800&h=800&fit=crop',
        'Mixed Bouquet': 'photo-1490750967868-88aa4486c946?w=800&h=800&fit=crop',
        'Pink Peonies': 'photo-1522348693650-dc5c2347e082?w=800&h=800&fit=crop',
        'Carnations': 'photo-1585821569331-f071db2abd8d?w=800&h=800&fit=crop',
        'Daisies': 'photo-1463320898484-cdae8bccd79e?w=800&h=800&fit=crop',
        'Hydrangeas': 'photo-1558603668-6570496b66f8?w=800&h=800&fit=crop',
        'Lavender Bouquet': 'photo-1499002238440-d264edd596ec?w=800&h=800&fit=crop',
        'Exotic Tropicals': 'photo-1601002354177-a2e88c27a23f?w=800&h=800&fit=crop',
    };
    const imageId = imageMap[Object.keys(imageMap).find(k => name.includes(k)) || ''] || 'photo-1490750967868-88aa4486c946?w=800&h=800&fit=crop';
    return `https://images.unsplash.com/${imageId}&q=80`;
};

export function ProductCustomizationModal({ isOpen, onClose, product, onAddToCart }: ProductCustomizationModalProps) {
    const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setSelectedOptions([]);
            setQuantity(1);

            // Auto-select default options (e.g. first radio)
            if (product?.options) {
                const initialSelections: SelectedOption[] = [];
                product.options.forEach(opt => {
                    if (opt.type === 'radio') {
                        // Check if there are other radio options in the same group (not implemented yet, assuming simple list for now)
                        // For now, if we have radio buttons, we might want to select the first one if it's required.
                        // Let's assume the first radio option of a set needs to be selected if it's "Size". 
                        // Simplified: If first option is radio, select it.
                        if (product.options!.filter(o => o.type === 'radio').indexOf(opt) === 0) {
                            initialSelections.push({ optionId: opt.id, name: opt.name, price: opt.price });
                        }
                    }
                });
                // Logic for radio groups needs to be more robust if multiple groups exists. 
                // For this mock, we only have one radio group "Size".
                const radioOptions = product.options.filter(o => o.type === 'radio');
                if (radioOptions.length > 0) {
                    const defaultOpt = radioOptions[0];
                    initialSelections.push({ optionId: defaultOpt.id, name: defaultOpt.name, price: defaultOpt.price });
                }

                setSelectedOptions(initialSelections);
            }
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const toggleOption = (option: ProductOption) => {
        if (option.type === 'checkbox') {
            const exists = selectedOptions.find(o => o.optionId === option.id);
            if (exists) {
                setSelectedOptions(selectedOptions.filter(o => o.optionId !== option.id));
            } else {
                setSelectedOptions([...selectedOptions, { optionId: option.id, name: option.name, price: option.price }]);
            }
        } else if (option.type === 'radio') {
            // Remove other radio options (assuming single group for now)
            // Improve: Check if they share a group ID if we add that later.
            const newOptions = selectedOptions.filter(o => !product.options?.find(po => po.id === o.optionId && po.type === 'radio'));
            setSelectedOptions([...newOptions, { optionId: option.id, name: option.name, price: option.price }]);
        }
    };

    const isSelected = (optionId: string) => selectedOptions.some(o => o.optionId === optionId);

    const basePrice = product.price;
    const optionsPrice = selectedOptions.reduce((acc, curr) => acc + curr.price, 0);
    const totalPrice = (basePrice + optionsPrice) * quantity;

    const handleAdd = () => {
        onAddToCart(product, selectedOptions);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white pointer-events-auto w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">

                            {/* Header / Image */}
                            <div className="relative h-48 sm:h-64 bg-muted/30 shrink-0">
                                <ImageWithFallback
                                    src={getFlowerImage(product.name, product.category)}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur hover:bg-white rounded-full transition-colors"
                                >
                                    <X className="size-5" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                                    <h2 className="text-2xl font-bold text-white">{product.name}</h2>
                                    <p className="text-white/90 font-medium">${product.price.toFixed(2)} Base Price</p>
                                </div>
                            </div>

                            {/* Content Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Options */}
                                {product.options && product.options.length > 0 ? (
                                    <div className="space-y-6">
                                        {/* Group by primitive logic: Checkboxes vs Radios */}
                                        {product.options.some(o => o.type === 'radio') && (
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    Select Size <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Required</span>
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {product.options.filter(o => o.type === 'radio').map(option => (
                                                        <div
                                                            key={option.id}
                                                            onClick={() => toggleOption(option)}
                                                            className={`
                                                relative p-4 rounded-xl border-2 cursor-pointer transition-all
                                                ${isSelected(option.id)
                                                                    ? 'border-brand-primary bg-brand-primary/5'
                                                                    : 'border-border hover:border-brand-primary/50'}
                                            `}
                                                        >
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-medium">{option.name}</span>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {option.price === 0 ? 'Base Price' : `+$${option.price.toFixed(2)}`}
                                                                </span>
                                                            </div>
                                                            {isSelected(option.id) && (
                                                                <div className="absolute top-3 right-3 text-brand-primary">
                                                                    <Check className="size-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {product.options.some(o => o.type === 'checkbox') && (
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-lg">Add-ons</h3>
                                                <div className="space-y-2">
                                                    {product.options.filter(o => o.type === 'checkbox').map(option => (
                                                        <div
                                                            key={option.id}
                                                            onClick={() => toggleOption(option)}
                                                            className={`
                                                flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                                                ${isSelected(option.id)
                                                                    ? 'border-brand-primary bg-brand-primary/5'
                                                                    : 'border-border hover:bg-muted/50'}
                                            `}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`
                                                     w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                     ${isSelected(option.id) ? 'bg-brand-primary border-brand-primary text-white' : 'border-muted-foreground'}
                                                 `}>
                                                                    {isSelected(option.id) && <Check className="size-3" />}
                                                                </div>
                                                                <span className="font-medium">{option.name}</span>
                                                            </div>
                                                            <span className="font-medium text-brand-primary">
                                                                +${option.price.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No customization options available for this product.
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-border bg-muted/20 space-y-4 shrink-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Price</span>
                                    <span className="text-2xl font-bold text-brand-primary">${totalPrice.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={handleAdd}
                                    className="w-full h-12 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>Add to Cart</span>
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm">${totalPrice.toFixed(2)}</span>
                                </button>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
