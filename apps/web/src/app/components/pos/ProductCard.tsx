import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Product } from '@/app/types';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onAdd: () => void;
  compact?: boolean;
}

const getFlowerImage = (name: string): string => {
  const imageMap: Record<string, string> = {
    'Red Roses': 'photo-1518709594023-6eab9bab7b23?w=400&h=400&fit=crop',
    'White Lilies': 'photo-1602492275880-1b23c1a8e6f1?w=400&h=400&fit=crop',
    'Tulips Bouquet': 'photo-1520763185298-1b434c919102?w=400&h=400&fit=crop',
    'Orchid Plant': 'photo-1525310072745-f49212b5ac6d?w=400&h=400&fit=crop',
    'Sunflowers': 'photo-1470509037663-253afd7f0f51?w=400&h=400&fit=crop',
    'Mixed Bouquet': 'photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop',
    'Pink Peonies': 'photo-1522348693650-dc5c2347e082?w=400&h=400&fit=crop',
    'Carnations': 'photo-1585821569331-f071db2abd8d?w=400&h=400&fit=crop',
    'Daisies': 'photo-1463320898484-cdae8bccd79e?w=400&h=400&fit=crop',
    'Hydrangeas': 'photo-1558603668-6570496b66f8?w=400&h=400&fit=crop',
    'Lavender Bouquet': 'photo-1499002238440-d264edd596ec?w=400&h=400&fit=crop',
    'Exotic Tropicals': 'photo-1601002354177-a2e88c27a23f?w=400&h=400&fit=crop',
  };

  const imageId = imageMap[name] || 'photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop';
  return `https://images.unsplash.com/${imageId}&q=80`;
};

export function ProductCard({ product, onClick, onAdd, compact }: ProductCardProps) {
  const isOutOfStock = product.track_inventory && !product.allow_negative_stock && (Number(product.calculated_stock) <= 0);

  return (
    <motion.div
      whileHover={isOutOfStock ? {} : { y: -4 }}
      whileTap={isOutOfStock ? {} : { scale: 0.98 }}
      onClick={isOutOfStock ? undefined : onClick}
      className={`group relative flex flex-col overflow-hidden rounded-[2rem] bg-white p-2 transition-all hover:shadow-xl hover:shadow-brand-primary/5 ${
        isOutOfStock ? 'opacity-70 grayscale-[0.5] cursor-not-allowed' : 'cursor-pointer'
      } ${
        compact ? 'min-h-[200px]' : 'min-h-[240px]'
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[1.5rem] bg-slate-50 transition-all duration-500">
        <ImageWithFallback
          src={product.image_url || getFlowerImage(product.name)}
          alt={product.name}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Subtle overlay on hover */}
        {!isOutOfStock && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />}
        
        {/* Out of Stock Badge */}
        {isOutOfStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <div className="rounded-full bg-white/90 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-red-600 shadow-xl">
                    Out of Stock
                </div>
            </div>
        )}

        {/* Quick Add Icon Overlay (Desktop) */}
        {!isOutOfStock && (
            <div className="absolute right-3 top-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="flex size-8 items-center justify-center rounded-full bg-white/90 text-brand-primary shadow-lg backdrop-blur-sm">
                    <Plus className="size-4" />
                </div>
            </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-2 py-3">
        <h3 className={`font-medium text-slate-800 line-clamp-1 transition-colors group-hover:text-brand-primary ${
          compact ? 'text-sm' : 'text-base'
        } ${isOutOfStock ? 'text-slate-400' : ''}`}>
          {product.name}
        </h3>
        <div className="mt-1 flex items-center justify-between">
          <span className={`font-bold text-slate-900 ${
            compact ? 'text-base' : 'text-lg'
          } ${isOutOfStock ? 'text-slate-400' : ''}`}>
            ${Number(product.base_price).toFixed(2)}
          </span>
          <span className={`text-[10px] uppercase tracking-wider font-semibold transition-colors ${
            isOutOfStock ? 'text-red-500/80' : 'text-slate-400 group-hover:text-brand-primary/60'
          }`}>
            {isOutOfStock ? 'No Stock' : 'In Stock'}
          </span>
        </div>
      </div>

      {/* Action Button (Mobile/Tablet accessibility) */}
      <button
        disabled={isOutOfStock}
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className={`mt-auto flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold transition-all active:scale-95 ${
          isOutOfStock 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-slate-900 text-white hover:bg-brand-primary'
        } ${
          compact ? 'py-2 text-xs' : 'py-2.5'
        }`}
      >
        <Plus className={compact ? 'size-3.5' : 'size-4'} />
        <span>{isOutOfStock ? 'Unavailable' : 'Add to Cart'}</span>
      </button>
    </motion.div>
  );
}