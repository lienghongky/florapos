import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { ProductCard } from '@/app/components/pos/ProductCard';
import { CartPanel } from '@/app/components/pos/CartPanel';
import { CategoryRail } from '@/app/components/pos/CategoryRail';
import { useApp } from '@/app/context/AppContext';
import { Search, SlidersHorizontal, Menu } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import { ProductCustomizationModal } from '@/app/components/pos/ProductCustomizationModal';
import { Product, SelectedOption } from '@/app/context/AppContext';

export function POSPage() {
  const { products, addToCart, currentPage } = useApp(); // Get currentPage
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // Fixed categories as per request
  const categories = ['New', 'Discount', 'Rose', 'Lily', 'Tulip', 'Orchid', 'Others'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive !== false;
  });

  const handleProductClick = (product: Product) => {
    if (product.options && product.options.length > 0) {
      setCustomizingProduct(product);
    } else {
      addToCart(product, []);
      toast.success(`${product.name} added to cart`);
    }
  };

  const handleAddToCartFromModal = (product: Product, selectedOptions: SelectedOption[]) => {
    addToCart(product, selectedOptions);
    toast.success(`${product.name} added to cart`);
  };

  const pageHeight = currentPage === 'pos-fullscreen' ? 'h-[calc(100vh-2rem)]' : 'h-[calc(100vh-6rem)]';

  return (
    <AnimatedPage className={pageHeight}>
      <div className="flex h-full gap-8">
        {/* Middle Column: Menu & Grid */}
        <div className="flex flex-1 flex-col gap-6 overflow-hidden">
          {/* Header Row: Trigger & Search */}
          <div className="flex items-center gap-4">
            <button className="flex size-12 items-center justify-center rounded-xl bg-white shadow-sm transition-colors hover:bg-white/80 lg:hidden">
              <Menu className="size-6 text-foreground" />
            </button>

            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Product here..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border-none bg-white pl-12 pr-4 shadow-sm outline-none ring-1 ring-transparent transition-shadow placeholder:text-muted-foreground focus:ring-brand-primary"
              />
            </div>

            <button className="flex size-12 items-center justify-center rounded-xl bg-white shadow-sm transition-colors hover:bg-white/80">
              <SlidersHorizontal className="size-5 text-foreground" />
            </button>
          </div>

          {/* Category Rail */}
          <div className="shrink-0">
            <CategoryRail
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
            <h2 className="mb-4 text-xl font-bold text-foreground">
              {selectedCategory === 'All' ? 'All Items' : selectedCategory}
              <span className="ml-2 text-sm font-normal text-muted-foreground">({filteredProducts.length} items)</span>
            </h2>

            <div className="grid grid-cols-1 gap-6 pb-20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setCustomizingProduct(product)}
                  onAdd={() => {
                    addToCart(product, []);
                    toast.success(`${product.name} added to cart`);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Cart Panel */}
        <div className="w-[400px] shrink-0">
          <CartPanel />
        </div>
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