import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Store, ShoppingBag, Plus, ChevronRight, Info, MapPin, Clock } from 'lucide-react';
import { EMenuTemplateProps } from './types';

export const ModernTemplate: React.FC<EMenuTemplateProps> = ({
  store,
  settings,
  products,
  tags,
  cart,
  onAddToCart,
  onOpenCart,
  isScrolled
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
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Hero Section */}
      <div className="relative h-[45vh] min-h-[350px] overflow-hidden">
        {store.banner_image ? (
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            src={store.banner_image}
            className="w-full h-full object-cover opacity-40"
          />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <Store className="size-20 opacity-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-xl p-8 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl relative bg-white/5 backdrop-blur-2xl border border-white/10"
          >
            {store.logo_url && (
              <div className="size-24 rounded-3xl overflow-hidden shadow-2xl -mt-20 border-4 mb-4 border-slate-800">
                <img src={store.logo_url} alt="Logo" className="size-full object-cover" />
              </div>
            )}
            <h1 className="text-3xl font-black tracking-tight mb-2 text-white">{store.name}</h1>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <Clock className="size-3.5" /> Open
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <MapPin className="size-3.5" /> {store.address || 'Main St'}
              </div>
            </div>
            {tags && (
              <div className="mt-6 inline-flex px-5 py-2 bg-brand-primary rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">
                {tags}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="h-16" />

      {/* Sticky Category Navigator */}
      <div className="sticky top-0 z-30 border-b py-4 backdrop-blur-xl bg-slate-950/80 border-white/5">
        <div className="flex items-center gap-3 px-6 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeCategory === cat ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Menu Feed */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-24">
        {Object.entries(categorizedProducts).map(([category, items]) => (
          <section key={category} id={`category-${category}`} className="scroll-mt-32">
            <div className="flex items-center gap-6 mb-10">
              <h2 className="text-4xl font-black tracking-tighter">{category}</h2>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>
            <div className="grid gap-x-8 gap-y-12 grid-cols-1 md:grid-cols-2">
               {items.map((product, idx) => {
                  const isOutOfStock = product.is_out_of_stock;
                  return (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      key={product.id}
                      className={`group relative flex gap-6 p-2 rounded-[2.5rem] transition-all bg-white/0 hover:bg-white/5 ${isOutOfStock ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    >
                      <div className="relative size-32 md:size-44 rounded-[2rem] overflow-hidden shrink-0 shadow-lg transition-transform group-active:scale-95 bg-slate-900">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex items-center justify-center">
                            <Store className="size-10 text-white/5" />
                          </div>
                        )}
                        
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-red-500 px-3 py-1.5 rounded-lg shadow-lg">Out of Stock</span>
                          </div>
                        )}

                        {settings.allow_ordering && !isOutOfStock && (
                          <button
                            onClick={() => onAddToCart(product)}
                            className="absolute bottom-3 right-3 size-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-2xl bg-white text-slate-900 hover:bg-emerald-400"
                          >
                            <Plus className="size-6" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-xl font-black leading-tight mb-2">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm font-medium line-clamp-2 leading-relaxed text-slate-500 mb-2">{product.description}</p>
                        )}
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {product.tags.map(tag => (
                              <span key={tag} className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          {settings.show_prices && (
                            <span className="text-2xl font-black tracking-tighter text-white">
                              ${Number(product.base_price).toFixed(2)}
                            </span>
                          )}
                          <div className="text-[10px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {isOutOfStock ? 'Sold Out' : 'View Details'} <ChevronRight className="size-3" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};
