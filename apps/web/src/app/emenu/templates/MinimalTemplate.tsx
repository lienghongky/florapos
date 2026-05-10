import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ChevronRight, Info } from 'lucide-react';
import { EMenuTemplateProps } from './types';

export const MinimalTemplate: React.FC<EMenuTemplateProps> = ({
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
      <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-serif">
         {/* Ultra Minimal Header */}
         <header className={`fixed top-0 inset-x-0 z-40 px-8 py-6 flex flex-col items-center transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-md py-4 border-b border-stone-100' : 'bg-transparent'}`}>
            <h1 className="text-2xl font-light tracking-[0.3em] uppercase">{store.name}</h1>
            {!isScrolled && (
               <div className="flex flex-col items-center gap-4">
                  <div className="mt-4 flex items-center gap-6 text-[10px] uppercase tracking-widest text-stone-400 font-sans">
                     <span>Est. 2024</span>
                     <div className="size-1 bg-stone-200 rounded-full" />
                     <span>Fine Dining</span>
                  </div>
                  {tags && (
                     <div className="px-5 py-1.5 border border-stone-100 text-[9px] uppercase tracking-[0.4em] text-stone-500 font-sans">
                        {tags}
                     </div>
                  )}
               </div>
            )}
         </header>

         <div className="h-32" />

         {/* Elegant Category Nav */}
         <nav className="sticky top-[64px] z-30 bg-[#FDFCFB]/80 backdrop-blur-xl py-6 overflow-hidden">
            <div className="flex items-center justify-center gap-10 px-8 overflow-x-auto no-scrollbar">
               {categories.map(cat => (
                  <button
                     key={cat}
                     onClick={() => {
                        setActiveCategory(cat);
                        document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                     }}
                     className={`whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.25em] transition-all relative py-2 ${activeCategory === cat ? 'text-[#1A1A1A]' : 'text-stone-300 hover:text-stone-500'
                        }`}
                  >
                     {cat}
                     {activeCategory === cat && (
                        <motion.div layoutId="minimal-nav" className="absolute bottom-0 left-0 right-0 h-px bg-[#1A1A1A]" />
                     )}
                  </button>
               ))}
            </div>
         </nav>

         <main className="max-w-xl mx-auto px-8 py-20 space-y-32">
            {Object.entries(categorizedProducts).map(([category, items]) => (
               <section key={category} id={`category-${category}`} className="scroll-mt-40 space-y-16">
                  <div className="text-center space-y-4">
                     <h2 className="text-xl font-light italic tracking-widest text-stone-400">{category}</h2>
                     <div className="w-px h-12 bg-stone-100 mx-auto" />
                  </div>

                  <div className="space-y-24">
                     {items.map((product) => {
                        const isOutOfStock = product.is_out_of_stock;
                        return (
                           <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-100px" }}
                              key={product.id}
                              className={`flex flex-col items-center text-center group ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                           >
                              {product.image_url && (
                                 <div className="w-full aspect-square mb-8 overflow-hidden bg-stone-50 transition-all duration-700 group-hover:scale-[1.02] relative">
                                    <img src={product.image_url} alt={product.name} className="size-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                                    {isOutOfStock && (
                                       <div className="absolute inset-0 bg-stone-100/40 flex items-center justify-center">
                                          <span className="text-[8px] uppercase tracking-[0.4em] font-sans text-stone-500 border border-stone-200 px-4 py-2 bg-white/80">Currently Unavailable</span>
                                       </div>
                                    )}
                                 </div>
                              )}
                              <h3 className="text-2xl font-light tracking-wider mb-2 uppercase">{product.name}</h3>
                              {product.description && (
                                 <p className="text-sm font-sans text-stone-400 max-w-xs leading-relaxed mb-4">{product.description}</p>
                              )}
                              {product.tags && product.tags.length > 0 && (
                                 <div className="flex flex-wrap justify-center gap-4 mb-8">
                                    {product.tags.map(tag => (
                                       <span key={tag} className="text-[8px] font-sans uppercase tracking-[0.3em] text-stone-300">
                                          #{tag}
                                       </span>
                                    ))}
                                 </div>
                              )}
                              {settings.show_prices && (
                                 <div className="flex flex-col items-center gap-2 mb-8">
                                    <span className="text-lg font-light tracking-widest">${Number(product.base_price).toFixed(2)}</span>
                                    {isOutOfStock && <span className="text-[9px] uppercase tracking-widest text-red-400 font-sans font-bold">Sold Out</span>}
                                 </div>
                              )}

                              {settings.allow_ordering && (
                                 <button
                                    onClick={() => !isOutOfStock && onAddToCart(product)}
                                    disabled={isOutOfStock}
                                    className={`px-10 py-3 border border-stone-200 text-[10px] uppercase tracking-[0.3em] transition-all font-sans ${
                                       isOutOfStock 
                                       ? 'opacity-30 cursor-not-allowed border-stone-100' 
                                       : 'hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A]'
                                    }`}
                                 >
                                    {isOutOfStock ? 'Out of Stock' : 'Add to Order'}
                                 </button>
                              )}
                           </motion.div>
                        );
                     })}
                  </div>
               </section>
            ))}
         </main>

         <footer className="py-20 text-center border-t border-stone-50">
            <p className="text-[10px] font-sans uppercase tracking-[0.4em] text-stone-300">
               {store.name} — Luxury Dining Experience
            </p>
         </footer>
      </div>
   );
};
