import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ChevronRight, Info, Heart, Flame, Star, Instagram, Twitter, Facebook, Mail } from 'lucide-react';
import { EMenuTemplateProps } from './types';

export const ChalkboardPremiumTemplate: React.FC<EMenuTemplateProps> = ({
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
      const catName = p.category?.name || 'Our Specials';
      if (!categorizedProducts[catName]) categorizedProducts[catName] = [];
      categorizedProducts[catName].push(p);
   });

   const categories = Object.keys(categorizedProducts);

   return (
      <div className="min-h-screen bg-[#1A1817] text-[#F5F2ED] font-sans selection:bg-[#F5F2ED] selection:text-[#1A1817]">
         {/* Chalkboard Texture Overlay */}
         <div className="fixed inset-0 pointer-events-none opacity-[0.05]" 
              style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/black-linen.png")` }} />

         {/* Decorative Border Frame */}
         <div className="fixed inset-4 border border-[#F5F2ED]/20 pointer-events-none z-50 hidden md:block rounded-sm" />
         <div className="fixed inset-6 border border-[#F5F2ED]/10 pointer-events-none z-50 hidden md:block rounded-sm" />

         {/* Elegant Header with Unified Navigation */}
         <header className={`fixed top-0 inset-x-0 z-40 px-6 transition-all duration-700 ${
            isScrolled ? 'bg-[#1A1817]/95 backdrop-blur-md py-6 border-b border-[#F5F2ED]/10' : 'bg-transparent py-12'
         }`}>
            <div className="max-w-7xl mx-auto w-full flex flex-col items-center">
               <div className="text-center relative">
                  {!isScrolled && (
                     <div className="mb-4 text-[10px] uppercase tracking-[0.4em] text-[#F5F2ED]/60 flex items-center justify-center gap-4">
                        <div className="h-px w-8 bg-[#F5F2ED]/20" />
                        EST. 2024
                        <div className="h-px w-8 bg-[#F5F2ED]/20" />
                     </div>
                  )}
                  
                  <div className="relative inline-block px-12 py-2">
                     {/* Wreath Ornaments */}
                     {!isScrolled && (
                        <>
                           <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-3xl opacity-40">🌿</div>
                           <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-3xl opacity-40 scale-x-[-1]">🌿</div>
                        </>
                     )}
                     <h1 className={`${isScrolled ? 'text-2xl' : 'text-4xl md:text-5xl'} font-serif italic tracking-tight mb-1 transition-all duration-500`}>
                        {store.name}
                     </h1>
                     {!isScrolled && <p className="text-[11px] uppercase tracking-[0.5em] text-[#F5F2ED]/80 font-bold">Premium Menu</p>}
                  </div>
               </div>

               {/* Integrated Navigation */}
               <nav className={`mt-8 w-full transition-all duration-500 ${isScrolled ? 'mt-4' : 'mt-10'}`}>
                  <div className="flex items-center justify-center gap-10 px-8 overflow-x-auto no-scrollbar">
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
                           className={`whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.25em] transition-all relative py-2 ${
                              activeCategory === cat ? 'text-[#F5F2ED]' : 'text-[#F5F2ED]/40 hover:text-[#F5F2ED]'
                           }`}
                        >
                           {cat}
                           {activeCategory === cat && (
                              <motion.div layoutId="premium-nav" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F5F2ED]" />
                           )}
                        </button>
                     ))}
                  </div>
               </nav>
            </div>
         </header>

         <div className="h-80" />

         <main className="max-w-6xl mx-auto px-6 py-20 space-y-32">
            {Object.entries(categorizedProducts).map(([category, items]) => (
               <section key={category} id={`category-${category}`} className="space-y-16">
                  {/* Section Header */}
                  <div className="flex flex-col items-center gap-4">
                     <div className="flex items-center gap-8 w-full">
                        <div className="h-px flex-1 bg-[#F5F2ED]/10" />
                        <div className="flex items-center gap-4">
                           <span className="text-2xl opacity-40">❦</span>
                           <h2 className="text-4xl font-serif italic tracking-wide text-center lowercase first-letter:uppercase">{category}</h2>
                           <span className="text-2xl opacity-40 scale-x-[-1]">❦</span>
                        </div>
                        <div className="h-px flex-1 bg-[#F5F2ED]/10" />
                     </div>
                  </div>

                  {/* 3-Column Grid for Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                     {items.map((product) => {
                        const isOutOfStock = product.is_out_of_stock;
                        return (
                           <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              key={product.id}
                              className={`group relative space-y-4 ${isOutOfStock ? 'opacity-30' : ''}`}
                           >
                              <div className="flex flex-col h-full border-b border-[#F5F2ED]/5 pb-8 group-hover:border-[#F5F2ED]/20 transition-colors">
                                 <div className="flex items-baseline justify-between gap-4 mb-2">
                                    <h3 className="text-lg font-black tracking-tight uppercase group-hover:text-white transition-colors flex items-center gap-2">
                                       {product.name}
                                       {product.tags?.includes('Hot') && <Flame className="size-3 text-orange-400" />}
                                       {product.tags?.includes('Best') && <Star className="size-3 text-yellow-400" />}
                                    </h3>
                                    {settings.show_prices && (
                                       <span className="text-lg font-bold tracking-tighter tabular-nums">
                                          {Number(product.base_price).toFixed(0)}
                                       </span>
                                    )}
                                 </div>
                                 
                                 {product.description && (
                                    <p className="text-[13px] text-[#F5F2ED]/60 leading-relaxed font-light line-clamp-2">
                                       {product.description}
                                    </p>
                                 )}

                                 <div className="mt-auto pt-6 flex items-center justify-between">
                                    <div className="flex gap-2">
                                       {product.tags?.filter(t => !['Hot', 'Best'].includes(t)).map(tag => (
                                          <span key={tag} className="text-[9px] uppercase tracking-widest text-[#F5F2ED]/30 px-2 py-0.5 border border-[#F5F2ED]/10 rounded-sm">
                                             {tag}
                                          </span>
                                       ))}
                                    </div>
                                    
                                    {settings.allow_ordering && !isOutOfStock && (
                                       <button
                                          onClick={() => onAddToCart(product)}
                                          className="size-8 rounded-full border border-[#F5F2ED]/20 flex items-center justify-center hover:bg-[#F5F2ED] hover:text-[#1A1817] transition-all group-hover:scale-110 active:scale-95"
                                       >
                                          <ShoppingBag className="size-3.5" />
                                       </button>
                                    )}
                                 </div>
                              </div>
                           </motion.div>
                        );
                     })}
                  </div>

                  {/* Section Images - 3 Column Grid at bottom of section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                     {items.filter(i => i.image_url).slice(0, 3).map((product, idx) => (
                        <div key={`img-${product.id}`} className="aspect-[4/3] overflow-hidden rounded-sm relative group/img">
                           <img src={product.image_url} alt="" className="size-full object-cover grayscale-[0.2] group-hover/img:grayscale-0 transition-all duration-700 group-hover/img:scale-110" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover/img:opacity-40 transition-opacity" />
                           <div className="absolute bottom-4 left-4 right-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em]">{product.name}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            ))}
         </main>

         {/* Footer with Social Links */}
         <footer className="mt-32 border-t border-[#F5F2ED]/10 bg-black/20 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-6 py-20">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-center text-center">
                  <div className="space-y-4">
                     <p className="text-[10px] uppercase tracking-[0.5em] text-[#F5F2ED]/40">Follow Our Journey</p>
                     <div className="flex items-center justify-center gap-6">
                        <Instagram className="size-5 hover:text-white cursor-pointer transition-colors" />
                        <Twitter className="size-5 hover:text-white cursor-pointer transition-colors" />
                        <Facebook className="size-5 hover:text-white cursor-pointer transition-colors" />
                     </div>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                     <div className="size-12 rounded-full border border-[#F5F2ED]/20 flex items-center justify-center text-xl italic font-serif">
                        {store.name?.[0]}
                     </div>
                     <h4 className="text-xl font-serif italic tracking-widest">{store.name}</h4>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] uppercase tracking-[0.5em] text-[#F5F2ED]/40">Contact Support</p>
                     <a href={`mailto:${store.email}`} className="text-sm hover:underline flex items-center justify-center gap-2">
                        <Mail className="size-4" /> {store.email || 'hello@restaurant.com'}
                     </a>
                  </div>
               </div>
               
               <div className="mt-20 pt-8 border-t border-[#F5F2ED]/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <p className="text-[10px] uppercase tracking-widest text-[#F5F2ED]/20">© 2024 {store.name}. All Rights Reserved.</p>
                  <div className="flex gap-8 text-[10px] uppercase tracking-widest text-[#F5F2ED]/40">
                     <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                     <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
                     <span className="hover:text-white cursor-pointer transition-colors">Accessibility</span>
                  </div>
               </div>
            </div>
         </footer>
      </div>
   );
};
