import { motion } from 'motion/react';
import { Coffee, Soup, UtensilsCrossed, Cherry, LayoutGrid, Star, Percent, Flower2, Package } from 'lucide-react';

interface CategoryRailProps {
    categories: string[];
    selectedCategory: string;
    onSelect: (category: string) => void;
    products: any[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    All: <LayoutGrid className="size-4" />,
    New: <Star className="size-4" />,
    Discount: <Percent className="size-4" />,
    Rose: <Flower2 className="size-4" />,
    Lily: <Flower2 className="size-4" />,
    Tulip: <Flower2 className="size-4" />,
    Orchid: <Flower2 className="size-4" />,
    Others: <Package className="size-4" />,
};

export function CategoryRail({ categories, selectedCategory, onSelect, products }: CategoryRailProps) {
    const getCount = (cat: string) => {
        if (cat === 'All') return products.filter(p => p.is_active).length;
        return products.filter(p => {
            return p.is_active && (p.category_name === cat || p.category === cat);
        }).length;
    };

    return (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from(new Set(['All', ...categories])).map((category) => {
                const isSelected = selectedCategory === category;
                return (
                    <motion.button
                        key={category}
                        onClick={() => onSelect(category)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex min-w-[94px] sm:min-w-[98px] flex-col items-center gap-1.5 rounded-2xl px-3 py-2.5 transition-all ${isSelected
                            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                            : 'bg-white/70 text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-xs'
                            }`}
                    >
                        <div className={`flex size-9 items-center justify-center rounded-xl transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {CATEGORY_ICONS[category] || <UtensilsCrossed className="size-4" />}
                        </div>

                        <div className="text-center w-full px-0.5">
                            <span className={`block text-xs font-semibold truncate leading-tight ${isSelected ? 'text-white' : 'text-foreground'}`}>
                                {category}
                            </span>
                            <span className={`block text-[11px] leading-tight ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                                {getCount(category)} Items
                            </span>
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
}
