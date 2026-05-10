import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, Plus, ChevronRight, MapPin, Clock } from 'lucide-react';
import { EMenuTemplateProps } from './types';
import { EMenuFooter } from './components/EMenuFooter';

export const ClassicTemplate: React.FC<EMenuTemplateProps> = ({
  store,
  settings,
  products,
  tags,
  onAddToCart,
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
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* ... Hero and categories ... */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
        {store.banner_image ? (
          <img src={store.banner_image} alt="Banner" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-slate-50 flex items-center justify-center">
            <Store className="size-20 opacity-5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-xl p-8 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl bg-white border border-slate-100 shadow-slate-200"
          >
            {store.logo_url && (
              <div className="size-24 rounded-3xl overflow-hidden shadow-2xl -mt-20 border-4 mb-4 border-white">
                <img src={store.logo_url} alt="Logo" className="size-full object-cover" />
              </div>
            )}
            <h1 className="text-3xl font-black tracking-tight mb-2 text-slate-900">{store.name}</h1>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <Clock className="size-3.5" /> Open
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 text-center">
                <MapPin className="size-3.5" /> {store.address || 'Main St'}
              </div>
            </div>
            {tags && (
              <div className="mt-6 px-4 py-1.5 bg-slate-900 rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                {tags}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="h-12" />

      {/* Sticky Categories */}
      <div className="sticky top-0 z-30 border-b py-4 backdrop-blur-xl bg-white/80 border-slate-100">
        <div className="flex items-center gap-3 px-6 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeCategory === cat ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Classic List Feed */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {Object.entries(categorizedProducts).map(([category, items]) => (
          <section key={category} id={`category-${category}`} className="scroll-mt-32">
            <div className="flex items-center gap-6 mb-8 text-center justify-center flex-col">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase tracking-widest">{category}</h2>
              <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
            </div>

            <div className="grid gap-6 grid-cols-1">
               {items.map((product) => {
                  const isOutOfStock = product.is_out_of_stock;
                  return (
                    <div key={product.id} className={`group relative flex gap-6 p-4 rounded-[2rem] transition-all border border-transparent hover:border-slate-100 hover:bg-slate-50/50 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
                      <div className="relative size-24 md:size-32 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-slate-100 transition-transform group-active:scale-95 bg-slate-50">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex items-center justify-center">
                            <Store className="size-8 text-slate-100" />
                          </div>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                             <span className="text-[8px] font-black uppercase tracking-widest text-white border border-white/20 px-2 py-1">Sold Out</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-black leading-tight text-slate-900">{product.name}</h3>
                          {settings.show_prices && (
                            <span className={`text-lg font-black tracking-tighter ml-4 ${isOutOfStock ? 'text-slate-300' : 'text-slate-900'}`}>
                              ${Number(product.base_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm font-medium line-clamp-2 leading-relaxed text-slate-400 mt-1 mb-2">{product.description}</p>
                        )}
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {product.tags.map(tag => (
                              <span key={tag} className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {settings.allow_ordering && (
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => !isOutOfStock && onAddToCart(product)}
                              disabled={isOutOfStock}
                              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                                isOutOfStock 
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
                                : 'bg-slate-900 text-white hover:bg-brand-primary shadow-slate-200'
                              }`}
                            >
                              {isOutOfStock ? 'Unavailable' : 'Add to Order'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </main>

      <EMenuFooter store={store} settings={settings} />
    </div>
  );
};
