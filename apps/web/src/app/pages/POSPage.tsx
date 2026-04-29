import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { ProductCard } from '@/app/components/pos/ProductCard';
import { CartPanel } from '@/app/components/pos/CartPanel';
import { CategoryRail } from '@/app/components/pos/CategoryRail';
import { useProductStore } from '@/app/store/product-store';
import { useCartStore } from '@/app/store/cart-store';
import { useAuthStore } from '@/app/store/auth-store';
import { Search, SlidersHorizontal, ShoppingBag, X, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

import { ProductCustomizationModal } from '@/app/components/pos/ProductCustomizationModal';
import { Product, ProductVariant, Addon, ModifierOption } from '@/app/types';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export function POSPage() {
  const { products, categories, refreshProducts, refreshProductCategories } = useProductStore();
  const { addToCart, cart, clearCart } = useCartStore();
  const { selectedStore } = useAuthStore();

  useEffect(() => {
    refreshProducts();
    refreshProductCategories();
    clearCart();
  }, [selectedStore?.id]);
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [showFilters, setShowFilters] = useState(true);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  // Desktop: cart shown inline; Mobile: cart shown as bottom-sheet overlay
  const [isCartOpen, setIsCartOpen] = useState(true);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const isMobile = useIsMobile();
  const isFullscreen = location.pathname === '/pos-fullscreen';

  const categoryNames = ['All', ...Array.from(new Set(categories.map(c => c.name).filter(n => n !== 'All')))];

  const allTags = ['All', ...Array.from(new Set(products.flatMap(p => p.tags || []))).sort()];

  const filteredProducts = products.filter(product => {
    const catName = categories.find(c => c.id === product.category_id)?.name || '';
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      catName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || catName === selectedCategory;
    const matchesTag = selectedTag === 'All' || (product.tags || []).map(t => t.toLowerCase()).includes(selectedTag.toLowerCase());
    return matchesSearch && matchesCategory && matchesTag && product.is_active;
  });

  const productsWithCategory = products.map(p => ({
    ...p,
    category_name: categories.find(c => c.id === p.category_id)?.name || 'Uncategorized'
  }));

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProductClick = (product: Product) => {
    const isOutOfStock = product.track_inventory && !product.allow_negative_stock && (Number(product.calculated_stock) <= 0);
    
    if (isOutOfStock) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    if (
      (product.variants && product.variants.length > 0) || 
      (product.product_addons && product.product_addons.length > 0) ||
      (product.modifier_groups && product.modifier_groups.length > 0)
    ) {
      setCustomizingProduct(product);
    } else {
      addToCart(product, undefined, []);
      toast.success(`${product.name} added to cart`);
    }
  };

  const handleAddToCartFromModal = (
    product: Product, 
    selectedVariant?: ProductVariant, 
    selectedAddons?: Addon[], 
    quantity: number = 1,
    selectedModifiers?: { [groupId: string]: ModifierOption[] }
  ) => {
    addToCart(product, selectedVariant, selectedAddons, quantity, selectedModifiers);
    toast.success(`${product.name} added to cart`);
  };

  const pageHeight = isFullscreen ? 'h-[calc(100vh-2rem)]' : 'h-[calc(100vh-5rem)]';

  // Decide which grid layout to show based on state
  const productGridCols = isMobile
    ? 'grid-cols-2 gap-3'
    : isCartOpen
      ? 'grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4'
      : 'grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

  return (
    <AnimatedPage className={pageHeight}>
      <div className="relative flex h-full gap-4 lg:gap-8 overflow-hidden">

        {/* ── Main product area ────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-4 md:gap-6 overflow-hidden min-w-0">
          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 md:size-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-11 md:h-12 w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 md:pl-12 pr-4 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary/50 focus:bg-white focus:ring-4 focus:ring-brand-primary/5 text-sm md:text-base"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex size-11 md:size-12 items-center justify-center rounded-2xl border border-slate-200 shadow-sm transition-all active:scale-95 ${showFilters ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white/50 text-slate-600 hover:bg-white hover:text-brand-primary'}`}
            >
              <SlidersHorizontal className="size-4 md:size-5" />
            </button>
          </div>

          {/* Category rail & Tags */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="shrink-0 border-b border-slate-100/50 pb-2">
                  <CategoryRail
                    categories={categoryNames}
                    selectedCategory={selectedCategory}
                    onSelect={(cat) => {
                      setSelectedCategory(cat);
                      setSelectedTag('All'); // Reset tag when changing category
                    }}
                    products={productsWithCategory}
                  />
                  
                  {/* Tag Filter Bar */}
                  {allTags.length > 1 && (
                    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide px-1">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag)}
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                            selectedTag === tag
                              ? 'bg-brand-primary text-white shadow-md'
                              : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {tag === 'All' ? 'All Tags' : `#${tag}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product grid area */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
            <div className="flex items-center justify-between mb-4 mt-2">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">
                {selectedCategory === 'All' ? 'Menu' : selectedCategory}
                <span className="ml-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{filteredProducts.length} Items</span>
              </h2>
            </div>

            <div className={`grid pb-28 md:pb-24 ${productGridCols}`}>
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleProductClick(product)}
                  onAdd={() => handleProductClick(product)}
                  compact={isMobile || !isCartOpen}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Desktop inline Cart Panel ────────────────────────────────────── */}
        {!isMobile && (
          <>
            {/* Floating cart button when desktop cart is closed */}
            {!isCartOpen && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="fixed bottom-8 right-8 z-50 flex size-16 items-center justify-center rounded-full bg-brand-primary text-white shadow-2xl shadow-brand-primary/40 hover:bg-brand-primary/90 active:scale-95 transition-all"
              >
                <ShoppingBag className="size-7" />
                {cartItemsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold ring-2 ring-white">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            )}

            {isCartOpen && (
              <div className="relative w-[380px] xl:w-[420px] shrink-0">
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="absolute -left-1 top-0 z-50 flex size-8 items-center justify-center rounded-full bg-white shadow-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                  title="Collapse Cart"
                >
                  <X className="size-4" />
                </button>
                <CartPanel />
              </div>
            )}
          </>
        )}

        {/* ── Mobile Cart: FAB + bottom sheet ─────────────────────────────── */}
        {isMobile && (
          <>
            {/* Floating cart FAB */}
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="fixed bottom-6 right-5 z-40 flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3.5 text-white shadow-2xl shadow-brand-primary/40 active:scale-95 transition-all"
            >
              <ShoppingBag className="size-5" />
              <span className="text-sm font-semibold">View Cart</span>
              {cartItemsCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-white text-brand-primary text-[10px] font-bold">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Bottom sheet overlay */}
            <AnimatePresence>
              {isMobileCartOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    key="cart-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsMobileCartOpen(false)}
                  />

                  {/* Sheet */}
                  <motion.div
                    key="cart-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 35 }}
                    className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-hidden rounded-t-3xl bg-background shadow-2xl"
                  >
                    {/* Pull indicator + close */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                      <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/30 absolute left-1/2 -translate-x-1/2 top-3" />
                      <div className="size-6" /> {/* spacer */}
                      <button
                        onClick={() => setIsMobileCartOpen(false)}
                        className="ml-auto flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronDown className="size-5" />
                      </button>
                    </div>

                    {/* Cart content */}
                    <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 56px)' }}>
                      <CartPanel onClose={() => setIsMobileCartOpen(false)} />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <ProductCustomizationModal
        isOpen={!!customizingProduct}
        onClose={() => setCustomizingProduct(null)}
        product={customizingProduct}
        onAddToCart={handleAddToCartFromModal}
      />
    </AnimatedPage>
  );
}