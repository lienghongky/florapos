import { motion } from 'motion/react';
import { Product } from '@/app/context/AppContext';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Plus, Minus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: () => void; // For opening modal/details
  onAdd: () => void;   // For quick add button
}

// Map product categories to specific flower images
const getFlowerImage = (name: string, category: string): string => {
  const imageMap: Record<string, string> = {
    'Red Roses': 'photo-1518709594023-6eab9bab7b23?w=400&h=400&fit=crop', // red roses
    'White Lilies': 'photo-1602492275880-1b23c1a8e6f1?w=400&h=400&fit=crop', // white lilies
    'Tulips Bouquet': 'photo-1520763185298-1b434c919102?w=400&h=400&fit=crop', // tulips
    'Orchid Plant': 'photo-1525310072745-f49212b5ac6d?w=400&h=400&fit=crop', // orchid
    'Sunflowers': 'photo-1470509037663-253afd7f0f51?w=400&h=400&fit=crop', // sunflowers
    'Mixed Bouquet': 'photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop', // mixed flowers
    'Pink Peonies': 'photo-1522348693650-dc5c2347e082?w=400&h=400&fit=crop', // peonies
    'Carnations': 'photo-1585821569331-f071db2abd8d?w=400&h=400&fit=crop', // carnations
    'Daisies': 'photo-1463320898484-cdae8bccd79e?w=400&h=400&fit=crop', // daisies
    'Hydrangeas': 'photo-1558603668-6570496b66f8?w=400&h=400&fit=crop', // hydrangeas
    'Lavender Bouquet': 'photo-1499002238440-d264edd596ec?w=400&h=400&fit=crop', // lavender
    'Exotic Tropicals': 'photo-1601002354177-a2e88c27a23f?w=400&h=400&fit=crop', // tropical flowers
  };

  const imageId = imageMap[name] || 'photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop';
  return `https://images.unsplash.com/${imageId}&q=80`;
};

export function ProductCard({ product, onClick, onAdd }: ProductCardProps) {
  const isLowStock = product.stock <= product.lowStockThreshold;

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
    >
      {/* Discount/Badge (Mock) */}
      {Math.random() > 0.7 && (
        <div className="absolute left-4 top-4 z-10 rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-bold text-black">
          20% OFF
        </div>
      )}

      {/* Image */}
      <div className="mb-4 aspect-square w-full overflow-hidden rounded-full border-4 border-muted/30">
        <ImageWithFallback
          src={getFlowerImage(product.name, product.category)}
          alt={product.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-bold text-foreground line-clamp-2 min-h-[3rem]">{product.name}</h3>
        <span className="text-xl font-bold text-brand-primary">${product.price.toFixed(2)}</span>
      </div>

      {/* Action */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-accent py-3 font-semibold text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
      >
        <span>Add to Cart</span>
      </motion.button>
    </div>
  );
}