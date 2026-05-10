import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ChevronRight, Info, Star, Instagram, Facebook, Twitter, Globe, Download, Apple, Play } from 'lucide-react';
import { EMenuTemplateProps } from './types';

export const MarbleLuxuryTemplate: React.FC<EMenuTemplateProps> = ({
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
      const catName = p.category?.name || 'Chef Specials';
      if (!categorizedProducts[catName]) categorizedProducts[catName] = [];
      categorizedProducts[catName].push(p);
   });

   const categories = Object.keys(categorizedProducts);

   return (
      <div className="min-h-screen bg-[#0A1A14] text-white selection:bg-emerald-500 selection:text-white">
         {/* Green Marble Background Texture */}
         <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A1A14] via-[#0D2B20] to-[#0A1A14]" />
            <div className="absolute inset-0 opacity-20 mix-blend-overlay" 
                 style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/marble.png")` }} />
            {/* Ambient Light Effects */}
            <div className="absolute -top-[20%] -left-[10%] size-[60%] bg-emerald-900/20 blur-[120px] rounded-full" />
            <div className="absolute -bottom-[20%] -right-[10%] size-[60%] bg-emerald-800/10 blur-[120px] rounded-full" />
         </div>

         {/* Luxury Header */}
         <header className={`fixed top-0 inset-x-0 z-50 px-8 transition-all duration-700 ${
            isScrolled ? 'bg-[#0A1A14]/80 backdrop-blur-xl py-4 border-b border-white/5' : 'bg-transparent py-10'
         }`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                     <Star className="size-5 text-emerald-400 fill-emerald-400/20" />
                  </div>
                  <div>
                     <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase">{store.name}</h1>
                     {!isScrolled && <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 font-bold">Elite Gastronomy</p>}
                  </div>
               </div>

               {tags && (
                  <div className="px-5 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] uppercase tracking-[0.2em] font-black flex items-center gap-3">
                     <span className="text-white/40">Exclusive Table</span>
                     <span className="text-emerald-400">{tags}</span>
                  </div>
               )}
            </div>
         </header>

         <div className="h-40" />

         {/* Floating Category Nav */}
         <nav className="sticky top-[64px] z-40 py-6">
            <div className="flex items-center justify-center gap-4 px-8 overflow-x-auto no-scrollbar">
               {categories.map(cat => (
                  <button
                     key={cat}
                     onClick={() => {
                        setActiveCategory(cat);
                        const el = document.getElementById(`category-${cat}`);
                        if (el) {
                           const offset = 180;
                           const bodyRect = document.body.getBoundingClientRect().top;
                           const elementRect = el.getBoundingClientRect().top;
                           const elementPosition = elementRect - bodyRect;
                           const offsetPosition = elementPosition - offset;
                           window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                        }
                     }}
                     className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                        activeCategory === cat 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 border-emerald-400' 
                        : 'bg-white/5 text-white/40 hover:text-white border border-white/5'
                     }`}
                  >
                     {cat}
                  </button>
               ))}
            </div>
         </nav>

         <main className="max-w-6xl mx-auto px-6 py-20 space-y-48 relative z-10">
            {Object.entries(categorizedProducts).map(([category, items]) => (
               <section key={category} id={`category-${category}`} className="space-y-32">
                  {/* Category Banner */}
                  <div className="text-center space-y-4">
                     <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter opacity-5 select-none absolute left-0 right-0 -translate-y-12">
                        {category}
                     </h2>
                     <h3 className="text-3xl font-black tracking-widest uppercase relative z-10">{category}</h3>
                     <div className="w-12 h-1.5 bg-emerald-500 mx-auto rounded-full" />
                  </div>

                  <div className="space-y-40">
                     {items.map((product, idx) => {
                        const isEven = idx % 2 === 0;
                        const isOutOfStock = product.is_out_of_stock;
                        return (
                           <motion.div
                              initial={{ opacity: 0, y: 50 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-100px" }}
                              key={product.id}
                              className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center w-full relative ${isOutOfStock ? 'opacity-40 grayscale' : ''}`}
                           >
                              {/* Product Image Side */}
                              <div className="w-full lg:w-[60%] relative z-0">
                                 <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-black/60 border border-white/5">
                                    <img 
                                       src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=60'} 
                                       alt={product.name} 
                                       className="size-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A14]/80 via-transparent to-transparent opacity-60" />
                                    
                                    {/* Price Badge on Mobile */}
                                    <div className="absolute top-6 right-6 lg:hidden px-4 py-2 bg-emerald-500 rounded-full font-black text-sm shadow-xl">
                                       ${Number(product.base_price).toFixed(0)}
                                    </div>
                                 </div>
                                 
                                 {/* Decorative Elements around image */}
                                 <div className={`absolute -z-10 -top-8 ${isEven ? '-left-8' : '-right-8'} size-48 border border-emerald-500/20 rounded-[3rem] ${isEven ? 'rotate-12' : '-rotate-12'}`} />
                                 <div className={`absolute -z-10 -bottom-8 ${isEven ? '-right-8' : '-left-8'} size-48 border border-white/10 rounded-[3rem] ${isEven ? '-rotate-12' : 'rotate-12'}`} />
                              </div>

                              {/* Info Card Side - Overlapping */}
                              <div className={`w-full lg:w-[45%] -mt-16 lg:mt-0 ${isEven ? 'lg:-ml-24' : 'lg:-mr-24'} relative z-10`}>
                                 <div className="p-8 lg:p-12 bg-[#0D2B20]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group/card hover:border-emerald-500/40 transition-all duration-500">
                                    {/* Glass Highlight */}
                                    <div className="absolute -top-[50%] -right-[20%] size-[80%] bg-emerald-400/10 blur-[80px] group-hover/card:bg-emerald-400/20 transition-colors" />
                                    
                                    <div className="relative z-10 space-y-6">
                                       <div className="space-y-2">
                                          <div className="flex items-center gap-3">
                                             <div className="w-8 h-px bg-emerald-500" />
                                             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Signature Dish</span>
                                          </div>
                                          <h4 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter leading-none italic">
                                             {product.name.split(' ')[0]} <span className="font-light not-italic text-white/60">{product.name.split(' ').slice(1).join(' ')}</span>
                                          </h4>
                                       </div>

                                       {product.description && (
                                          <p className="text-base lg:text-lg text-white/50 font-medium leading-relaxed">
                                             {product.description}
                                          </p>
                                       )}

                                       <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                          <div className="space-y-1">
                                             <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Price Selection</p>
                                             <div className="flex items-center gap-4">
                                                {settings.show_prices && (
                                                   <span className="text-3xl lg:text-4xl font-black tracking-tighter text-white">
                                                      ${Number(product.base_price).toFixed(0)}<span className="text-lg text-emerald-500 ml-1">++</span>
                                                   </span>
                                                )}
                                             </div>
                                          </div>

                                          {settings.allow_ordering && !isOutOfStock && (
                                             <button
                                                onClick={() => onAddToCart(product)}
                                                className="px-6 lg:px-8 py-3 lg:py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest text-[10px] lg:text-xs rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-3 group/btn"
                                             >
                                                <ShoppingBag className="size-4 group-hover/btn:rotate-12 transition-transform" />
                                                Order
                                             </button>
                                          )}
                                       </div>
                                    </div>
                                 </div>

                                 {/* Tags - floating or integrated */}
                                 <div className={`flex flex-wrap gap-2 mt-6 ${isEven ? 'justify-start lg:justify-end' : 'justify-start'}`}>
                                    {product.tags?.map(tag => (
                                       <span key={tag} className="px-4 py-1.5 bg-emerald-500/10 rounded-full text-[9px] font-bold uppercase tracking-widest border border-emerald-500/10 text-emerald-400 backdrop-blur-sm">
                                          {tag}
                                       </span>
                                    ))}
                                 </div>
                              </div>
                           </motion.div>
                        );
                     })}
                  </div>
               </section>
            ))}
         </main>

         {/* Luxury Footer */}
         <footer className="mt-64 relative overflow-hidden bg-black/40 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-8 py-24 flex flex-col items-center gap-16 text-center">
               <div className="space-y-6">
                  <div className="size-20 rounded-full border border-emerald-500/20 bg-emerald-500/5 mx-auto flex items-center justify-center">
                     <Star className="size-10 text-emerald-500" />
                  </div>
                  <h5 className="text-3xl font-black uppercase tracking-[0.2em]">{store.name}</h5>
                  <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
                     An elite culinary destination where every flavor tells a story of craftsmanship and luxury.
                  </p>
               </div>

               <div className="flex flex-wrap justify-center gap-12 text-[11px] font-black uppercase tracking-[0.3em] text-white/30">
                  {settings.social_links?.instagram && (
                     <a href={settings.social_links.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-3">
                        <Instagram className="size-4" /> Instagram
                     </a>
                  )}
                  {settings.social_links?.facebook && (
                     <a href={settings.social_links.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-3">
                        <Facebook className="size-4" /> Facebook
                     </a>
                  )}
                  {settings.social_links?.twitter && (
                     <a href={settings.social_links.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-3">
                        <Twitter className="size-4" /> Twitter
                     </a>
                  )}
                  {settings.social_links?.website && (
                     <a href={settings.social_links.website} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-3">
                        <Globe className="size-4" /> Website
                     </a>
                  )}
                  <a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-3"><Download className="size-4" /> Download App</a>
               </div>

               <div className="flex items-center gap-8 pt-16 border-t border-white/5 w-full justify-between opacity-30">
                  <p className="text-[10px] uppercase tracking-widest italic">Experience Excellence</p>
                  <div className="flex items-center gap-6">
                     <Apple className="size-5" />
                     <Play className="size-5" />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest">© 2024 FloraPos Elite</p>
               </div>
            </div>
         </footer>
      </div>
   );
};
