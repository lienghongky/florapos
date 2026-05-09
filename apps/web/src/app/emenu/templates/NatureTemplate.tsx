import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, Plus, Leaf, Cloud, Sun } from 'lucide-react';
import { EMenuTemplateProps } from './types';

export const NatureTemplate: React.FC<EMenuTemplateProps> = ({
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
    <div className="min-h-screen bg-[#FDF9F3] text-[#3E4A35] font-sans">
      {/* Nature Hero */}
      <div className="relative h-[45vh] min-h-[350px] overflow-hidden">
        {store.banner_image ? (
          <img src={store.banner_image} alt="Farm" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#E8F1E6] flex items-center justify-center">
            <Leaf className="size-20 text-[#A8C4A0]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDF9F3] via-transparent to-black/10" />

        <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#FCF8F1] rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl shadow-[#DED4C6]/50 border-8 border-white"
          >
            {store.logo_url && (
              <div className="size-24 rounded-full overflow-hidden shadow-xl -mt-24 border-8 border-white mb-6">
                <img src={store.logo_url} alt="Logo" className="size-full object-cover" />
              </div>
            )}
            <h1 className="text-4xl font-black tracking-tight text-[#2D3A24] mb-4 font-serif italic">{store.name}</h1>

            <div className="flex items-center gap-4 text-xs font-bold text-[#A4B19A] uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><Sun className="size-4" /> Farm to Table</div>
              <div className="size-1 bg-[#A4B19A] rounded-full" />
              <div className="flex items-center gap-1.5"><Cloud className="size-4" /> Organic</div>
            </div>

            {tags && (
              <div className="mt-8 px-8 py-3 bg-[#2D3A24] rounded-full text-[#FDF9F3] text-sm font-black tracking-widest">
                {tags}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="h-12" />

      {/* Organic Sticky Nav */}
      <div className="sticky top-[72px] z-30 py-6 backdrop-blur-xl bg-[#FDF9F3]/80">
        <div className="flex items-center gap-4 px-8 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`whitespace-nowrap px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-[#7E8F6F] text-white shadow-lg' : 'bg-[#EAE2D5] text-[#7E8F6F] hover:bg-[#E2D9CB]'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-8 py-12 space-y-24">
        {Object.entries(categorizedProducts).map(([category, items]) => (
          <section key={category} id={`category-${category}`} className="scroll-mt-32">
            <div className="flex flex-col items-center mb-12">
              <Leaf className="size-8 text-[#A8C4A0] mb-4" />
              <h2 className="text-3xl font-black tracking-tight text-[#2D3A24] font-serif italic">{category}</h2>
              <div className="w-24 h-0.5 bg-[#EAE2D5] mt-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {items.map((product, idx) => {
                  const isOutOfStock = product.is_out_of_stock;
                  return (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      key={product.id}
                      className={`flex flex-col group ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                    >
                      <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden mb-6 shadow-xl shadow-[#DED4C6]/40 border-[10px] border-white transition-transform group-hover:scale-[1.02]">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex items-center justify-center bg-[#F1EDE4]">
                            <Store className="size-10 text-[#DED4C6]" />
                          </div>
                        )}
                        
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-[#3E4A35]/40 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-white/90 text-[#3E4A35] px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Out of Stock</span>
                          </div>
                        )}

                        {settings.allow_ordering && !isOutOfStock && (
                          <button
                            onClick={() => onAddToCart(product)}
                            className="absolute bottom-4 right-4 size-14 rounded-full bg-[#E7C873] text-[#2D3A24] shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                          >
                            <Plus className="size-8" />
                          </button>
                        )}
                      </div>

                      <div className="px-4 text-center">
                        <h3 className="text-xl font-black text-[#2D3A24] mb-2">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm font-medium text-[#7E8F6F] line-clamp-2 leading-relaxed mb-2">{product.description}</p>
                        )}
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {product.tags.map(tag => (
                              <span key={tag} className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-[#E8F1E6] text-[#5E7A53]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {settings.show_prices && (
                          <div className={`text-2xl font-black font-serif italic ${isOutOfStock ? 'text-[#A4B19A]' : 'text-[#2D3A24]'}`}>
                            ${Number(product.base_price).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </section>
        ))}
      </main>

      <footer className="py-20 flex flex-col items-center bg-[#EAE2D5]/30">
        <Leaf className="size-10 text-[#A8C4A0] mb-6" />
        <p className="text-xs font-bold text-[#A4B19A] uppercase tracking-[0.3em]">
          Naturally Sourced — {store.name}
        </p>
      </footer>
    </div>
  );
};
