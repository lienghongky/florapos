import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, ShoppingBag, Plus, ChevronRight, Crown } from 'lucide-react';
import { EMenuTemplateProps } from './types';
import { EMenuFooter } from './components/EMenuFooter';

export const RoyalWhiteTemplate: React.FC<EMenuTemplateProps> = ({
  store,
  settings,
  products,
  tags,
  onAddToCart,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('');

  const categorizedProducts: Record<string, any[]> = {};
  products.forEach((p: any) => {
    const catName = p.category?.name || 'Menu';
    if (!categorizedProducts[catName]) categorizedProducts[catName] = [];
    categorizedProducts[catName].push(p);
  });

  const categories = Object.keys(categorizedProducts);

  return (
    <div className="min-h-screen bg-[#FFFEFA] text-[#4A3E2A] font-serif">
      {/* Royal Header */}
      <div className="relative h-[40vh] min-h-[350px] flex flex-col items-center justify-center text-center p-8">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#C5A059 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 space-y-4"
        >
          <Crown className="size-12 text-[#C5A059] mx-auto mb-6" />
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A059] font-sans font-bold">The Royal Collection</span>
            <h1 className="text-5xl font-black tracking-tight text-[#2D2416] italic leading-tight">{store.name}</h1>
          </div>
          <div className="w-24 h-px bg-[#C5A059] mx-auto mt-6" />
        </motion.div>

        {tags && (
          <div className="absolute bottom-8 px-6 py-2 border border-[#C5A059] rounded-full text-[10px] font-bold tracking-[0.2em] text-[#C5A059] bg-white/50 backdrop-blur-md">
            {tags}
          </div>
        )}
      </div>

      {/* Ornate Sticky Nav */}
      <div className="sticky top-0 z-30 border-y border-[#F3EAD3] py-4 bg-[#FFFEFA]/90 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-8 px-6 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative py-2 ${activeCategory === cat ? 'text-[#2D2416]' : 'text-[#B5A48B] hover:text-[#2D2416]'
                }`}
            >
              {cat}
              {activeCategory === cat && (
                <motion.div 
                   initial={{ scaleX: 0, opacity: 0 }}
                   animate={{ scaleX: 1, opacity: 1 }}
                   className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059] origin-left" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-8 py-20 space-y-32">
        {Object.entries(categorizedProducts).map(([category, items]) => (
          <section key={category} id={`category-${category}`} className="scroll-mt-40">
            <div className="flex flex-col items-center mb-16 space-y-4">
              <h2 className="text-2xl font-black italic tracking-widest text-[#2D2416]">{category}</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-px bg-[#F3EAD3]" />
                <div className="size-1.5 rounded-full bg-[#C5A059]" />
                <div className="w-12 h-px bg-[#F3EAD3]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
               {items.map((product) => {
                  const isOutOfStock = product.is_out_of_stock;
                  return (
                    <div key={product.id} className={`flex flex-col group items-center text-center ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
                      <div className="relative w-full aspect-[4/5] rounded-[3rem] overflow-hidden mb-8 shadow-2xl shadow-[#EFE6D5] border-[12px] border-white transition-transform group-hover:scale-[1.02]">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex items-center justify-center bg-[#FAF7F0]">
                            <Store className="size-10 text-[#EFE6D5]" />
                          </div>
                        )}
                        <div className="absolute inset-0 border border-[#F3EAD3] rounded-[2rem] m-2 pointer-events-none" />
                        
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-[#FFFEFA]/60 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="px-6 py-2 border border-[#C5A059] bg-white shadow-xl">
                              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#C5A059]">Currently Unavailable</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 px-4">
                        <h3 className="text-xl font-bold text-[#2D2416] leading-tight group-hover:text-[#C5A059] transition-colors uppercase tracking-wider">{product.name}</h3>
                        {product.description && (
                          <p className="text-xs font-sans font-medium text-[#B5A48B] line-clamp-2 leading-relaxed mb-3">{product.description}</p>
                        )}
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {product.tags.map(tag => (
                              <span key={tag} className="text-[8px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-sm border border-[#F3EAD3] text-[#B5A48B] bg-[#FFFEFA]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {settings.show_prices && (
                          <div className={`text-xl font-black pt-2 ${isOutOfStock ? 'text-[#B5A48B]' : 'text-[#2D2416]'}`}>
                            ${Number(product.base_price).toFixed(2)}
                          </div>
                        )}
                        {settings.allow_ordering && (
                          <button
                            onClick={() => !isOutOfStock && onAddToCart(product)}
                            disabled={isOutOfStock}
                            className={`mt-6 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 ${
                              isOutOfStock 
                              ? 'bg-[#EFE6D5] text-[#B5A48B] cursor-not-allowed shadow-none' 
                              : 'bg-[#2D2416] text-[#FFFEFA] hover:bg-[#C5A059] shadow-[#EFE6D5]'
                            }`}
                          >
                            {isOutOfStock ? 'Unavailable' : 'Add to Order'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </main>

      <EMenuFooter store={store} settings={settings} className="py-32 flex flex-col items-center border-t border-[#F3EAD3] bg-[#FAF8F2]" />
    </div>
  );
};
