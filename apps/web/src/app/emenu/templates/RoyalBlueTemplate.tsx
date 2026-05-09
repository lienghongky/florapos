import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, Plus, ChevronRight, Crown } from 'lucide-react';
import { EMenuTemplateProps } from './types';

// Simple SVG Kbach Pattern
const KbachPattern = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" className="opacity-10 fill-[#C5A059]">
    <path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" />
  </svg>
);

export const RoyalBlueTemplate: React.FC<EMenuTemplateProps> = ({
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
    <div className="min-h-screen bg-[#0A1221] text-[#D4C3A3] font-serif">
      {/* Royal Deep Blue Header */}
      <div className="relative h-[45vh] min-h-[400px] flex flex-col items-center justify-center text-center p-8 overflow-hidden">
        {/* Khmer Background Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-paper.png")' }} />
          <div className="grid grid-cols-6 gap-4 p-4">
            {Array.from({ length: 24 }).map((_, i) => <KbachPattern key={i} />)}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1221] via-transparent to-transparent" />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10"
        >
          {store.logo_url ? (
            <div className="size-24 rounded-full overflow-hidden border-4 border-[#C5A059] mx-auto mb-8 shadow-2xl">
              <img src={store.logo_url} alt="Logo" className="size-full object-cover" />
            </div>
          ) : (
            <Crown className="size-16 text-[#C5A059] mx-auto mb-8" />
          )}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.6em] text-[#C5A059] font-sans font-black">Prestige Menu</span>
            <h1 className="text-4xl font-black tracking-widest text-white leading-tight uppercase">{store.name}</h1>
          </div>
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#C5A059]" />
            <div className="size-2 bg-[#C5A059] rotate-45" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#C5A059]" />
          </div>
        </motion.div>

        {tags && (
          <div className="absolute bottom-10 px-8 py-2 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-full text-[10px] font-black tracking-[0.4em] text-[#C5A059] backdrop-blur-md">
            {tags}
          </div>
        )}
      </div>

      {/* Sticky Khmer Nav */}
      <div className="sticky top-[72px] z-30 border-b border-[#C5A059]/20 bg-[#0A1221]/90 backdrop-blur-xl py-6">
        <div className="flex items-center justify-center gap-10 px-6 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${activeCategory === cat ? 'text-[#C5A059]' : 'text-[#5E6A7D] hover:text-white'
                }`}
            >
              {cat}
              {activeCategory === cat && (
                <motion.div layoutId="royal-nav-blue" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059] shadow-[0_0_10px_#C5A059]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-20 space-y-32">
        {Object.entries(categorizedProducts).map(([category, items]) => (
          <section key={category} id={`category-${category}`} className="scroll-mt-40">
            <div className="flex flex-col items-center mb-16">
              <h2 className="text-3xl font-black tracking-widest text-white uppercase italic">{category}</h2>
              <div className="flex items-center gap-4 mt-6">
                <div className="w-20 h-px bg-[#C5A059]/30" />
                <Crown className="size-5 text-[#C5A059]" />
                <div className="w-20 h-px bg-[#C5A059]/30" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
               {items.map((product) => {
                  const isOutOfStock = product.is_out_of_stock;
                  return (
                    <div key={product.id} className={`group relative flex flex-col p-4 rounded-[3rem] bg-[#111A2C] border border-[#C5A059]/10 hover:border-[#C5A059]/40 transition-all ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
                      <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl transition-transform group-hover:scale-[1.02]">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex items-center justify-center bg-[#0A1221]">
                            <Store className="size-10 text-[#5E6A7D]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111A2C] via-transparent to-transparent opacity-60" />
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <div className="border border-[#C5A059] px-6 py-2 bg-[#0A1221]/80 shadow-[0_0_20px_rgba(197,160,89,0.3)]">
                              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#C5A059]">Sold Out</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="px-4 pb-4">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-white uppercase tracking-wider">{product.name}</h3>
                          {settings.show_prices && (
                            <span className={`text-xl font-black tracking-tighter ${isOutOfStock ? 'text-[#5E6A7D]' : 'text-[#C5A059]'}`}>
                              ${Number(product.base_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-xs font-sans font-medium text-[#5E6A7D] line-clamp-2 leading-relaxed mb-4">{product.description}</p>
                        )}
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {product.tags.map(tag => (
                              <span key={tag} className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {settings.allow_ordering && (
                          <button
                            onClick={() => !isOutOfStock && onAddToCart(product)}
                            disabled={isOutOfStock}
                            className={`mt-8 w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl transition-all ${
                              isOutOfStock 
                              ? 'bg-transparent border border-[#5E6A7D]/30 text-[#5E6A7D] cursor-not-allowed shadow-none' 
                              : 'bg-gradient-to-r from-[#C5A059] to-[#E5C78B] text-[#0A1221] hover:opacity-90 active:scale-95'
                            }`}
                          >
                            {isOutOfStock ? 'Unavailable' : 'Order Now'}
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

      <footer className="py-32 flex flex-col items-center bg-[#080E1A]">
        <div className="grid grid-cols-3 gap-8 opacity-20 mb-12">
          <KbachPattern />
          <Crown className="size-8 text-[#C5A059]" />
          <KbachPattern />
        </div>
        <p className="text-[10px] font-black text-[#5E6A7D] uppercase tracking-[0.8em]">
          THE ROYAL KHMER EXPERIENCE
        </p>
      </footer>
    </div>
  );
};
