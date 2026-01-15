import { motion } from 'motion/react';
import { Coffee, Soup, UtensilsCrossed, Cherry, LayoutGrid, Star, Percent, Flower2, Package } from 'lucide-react';

interface CategoryRailProps {
    categories: string[];
    selectedCategory: string;
    onSelect: (category: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    All: <LayoutGrid className="size-5" />,
    New: <Star className="size-5" />,
    Discount: <Percent className="size-5" />,
    Rose: <Flower2 className="size-5" />,
    Lily: <Flower2 className="size-5" />,
    Tulip: <Flower2 className="size-5" />,
    Orchid: <Flower2 className="size-5" />,
    Others: <Package className="size-5" />,
};

export function CategoryRail({ categories, selectedCategory, onSelect }: CategoryRailProps) {
    // Mock counts for now, in a real app these would come from the products list
    const getCount = (cat: string) => {
        if (cat === 'All') return 235;
        return Math.floor(Math.random() * 50) + 5;
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {['All', ...categories].map((category) => {
                const isSelected = selectedCategory === category;
                return (
                    <motion.button
                        key={category}
                        onClick={() => onSelect(category)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex min-w-[100px] flex-col items-center gap-3 rounded-2xl p-4 transition-all ${isSelected
                            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25'
                            : 'bg-white text-muted-foreground hover:bg-white/80'
                            }`}
                    >
                        <div className={`flex size-10 items-center justify-center rounded-full ${isSelected ? 'bg-white/20' : 'bg-brand-accent text-brand-primary'
                            }`}>
                            {CATEGORY_ICONS[category] || <UtensilsCrossed className="size-5" />}
                        </div>

                        <div className="text-center">
                            <span className={`block text-sm font-semibold ${isSelected ? 'text-white' : 'text-foreground'}`}>
                                {category}
                            </span>
                            <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                                {getCount(category)} Items
                            </span>
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
}
