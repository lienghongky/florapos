import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ChevronRight, Info, Minus, Plus } from 'lucide-react';
import { EMenuTemplateProps } from './types';

export const AntiquePaperTemplate: React.FC<EMenuTemplateProps> = ({
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
      const catName = p.category?.name || 'Selections';
      if (!categorizedProducts[catName]) categorizedProducts[catName] = [];
      categorizedProducts[catName].push(p);
   });

   const categories = Object.keys(categorizedProducts);

   return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#2C2C2C] font-serif relative overflow-x-hidden">
         {/* Paper Texture Overlay */}
         <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply" 
              style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/paper-fibers.png")` }} />

         {/* Physical Border Effect removed per request */}

         {/* Header with Unified Navigation */}
         <header className={`fixed top-0 inset-x-0 z-40 px-6 transition-all duration-700 ${
            isScrolled ? 'bg-[#FAF9F6]/95 backdrop-blur-md py-6 border-b border-[#E8E6E1]' : 'bg-transparent py-12'
         }`}>
            <div className="max-w-7xl mx-auto w-full flex flex-col items-center">
               <div className="text-center">
                  <h1 className={`${isScrolled ? 'text-2xl' : 'text-3xl md:text-4xl'} font-light tracking-[0.2em] uppercase transition-all duration-500`}>
                     {store.name}
                  </h1>
                  {!isScrolled && (
                     <div className="flex flex-col items-center">
                        <div className="w-16 h-px bg-[#D1CFCA] my-4" />
                        <p className="text-[10px] uppercase tracking-[0.4em] text-[#8C8A85]">Est. 2024 • Culinary Excellence</p>
                        {tags && (
                           <div className="mt-4 px-4 py-1 bg-[#2C2C2C] text-[#FAF9F6] text-[9px] uppercase tracking-[0.3em] font-sans">
                              Table {tags}
                           </div>
                        )}
                     </div>
                  )}
               </div>

               {/* Integrated Navigation */}
               <nav className={`mt-10 w-full transition-all duration-500 ${isScrolled ? 'mt-4' : 'mt-10'}`}>
                  <div className="flex items-center justify-center gap-8 px-6 overflow-x-auto no-scrollbar">
                     {categories.map(cat => (
                        <button
                           key={cat}
                           onClick={() => {
                              setActiveCategory(cat);
                              const el = document.getElementById(`category-${cat}`);
                              if (el) {
                                 const offset = 220; // Adjusted for unified header
                                 const bodyRect = document.body.getBoundingClientRect().top;
                                 const elementRect = el.getBoundingClientRect().top;
                                 const elementPosition = elementRect - bodyRect;
                                 const offsetPosition = elementPosition - offset;
                                 window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                              }
                           }}
                           className={`whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative py-1 ${
                              activeCategory === cat ? 'text-[#2C2C2C]' : 'text-[#AFAEA9] hover:text-[#2C2C2C]'
                           }`}
                        >
                           {cat}
                           {activeCategory === cat && (
                              <motion.div layoutId="antique-nav" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#2C2C2C]" />
                           )}
                        </button>
                     ))}
                  </div>
               </nav>
            </div>
         </header>

         <div className="h-80" />

         <main className="max-w-2xl mx-auto px-6 py-16 space-y-24 relative">
            {Object.entries(categorizedProducts).map(([category, items]) => (
               <section key={category} id={`category-${category}`} className="space-y-12">
                  <div className="flex flex-col items-center gap-3">
                     <div className="text-[#D1CFCA] text-xl">❦</div>
                     <h2 className="text-2xl font-light tracking-[0.15em] uppercase text-center">{category}</h2>
                     <div className="flex items-center gap-4 w-full max-w-[200px]">
                        <div className="h-px flex-1 bg-[#E8E6E1]" />
                        <div className="size-1 rounded-full bg-[#D1CFCA]" />
                        <div className="h-px flex-1 bg-[#E8E6E1]" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-12">
                     {items.map((product) => {
                        const isOutOfStock = product.is_out_of_stock;
                        return (
                           <motion.div
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              viewport={{ once: true }}
                              key={product.id}
                              className={`group relative ${isOutOfStock ? 'opacity-40' : ''}`}
                           >
                              <div className="flex flex-col md:flex-row gap-6 items-start">
                                 {product.image_url && (
                                    <div className="w-full md:w-32 aspect-square shrink-0 bg-white rounded-none p-0.5 border border-[#D1CFCA] outline outline-1 outline-[#D1CFCA] outline-offset-2 relative z-0">
                                       <img src={product.image_url} alt={product.name} className="size-full object-cover transition-all duration-700" />
                                    </div>
                                 )}
                                 
                                 <div className="flex-1 w-full">
                                    <div className="flex items-baseline justify-between gap-4 mb-1">
                                       <h3 className="text-xl font-bold tracking-wide">{product.name}</h3>
                                       <div className="flex-1 border-b border-dotted border-[#D1CFCA] h-px" />
                                       {settings.show_prices && (
                                          <span className="text-lg font-medium tracking-tighter">
                                             ${Number(product.base_price).toFixed(2)}
                                          </span>
                                       )}
                                    </div>
                                    
                                    {product.description && (
                                       <p className="text-[13px] italic text-[#6B6964] leading-relaxed mb-4 font-sans">
                                          {product.description}
                                       </p>
                                    )}

                                    <div className="flex items-center justify-between">
                                       <div className="flex gap-4">
                                          {product.tags?.map(tag => (
                                             <span key={tag} className="text-[9px] uppercase tracking-widest text-[#AFAEA9] font-sans">
                                                • {tag}
                                             </span>
                                          ))}
                                       </div>

                                       {settings.allow_ordering && !isOutOfStock && (
                                          <button
                                             onClick={() => onAddToCart(product)}
                                             className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#2C2C2C] hover:text-[#8C8A85] transition-colors group/btn"
                                          >
                                             <Plus className="size-3 transition-transform group-hover/btn:rotate-90" />
                                             Add to Order
                                          </button>
                                       )}
                                       {isOutOfStock && (
                                          <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C8A85] italic">
                                             Currently Unavailable
                                          </span>
                                       )}
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

         <footer className="py-24 text-center border-t border-[#E8E6E1] mx-6">
            <div className="flex flex-col items-center gap-6">
               <div className="text-[#D1CFCA] text-2xl">❧</div>
               <div className="space-y-2">
                  <h4 className="text-sm tracking-[0.3em] uppercase">{store.name}</h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C8A85] font-sans">
                     {store.address || 'Handcrafted Culinary Experience'}
                  </p>
               </div>
               <div className="w-12 h-px bg-[#E8E6E1]" />
               <p className="text-[9px] uppercase tracking-[0.5em] text-[#AFAEA9]">
                  Thank you for dining with us
               </p>
            </div>
         </footer>
      </div>
   );
};
