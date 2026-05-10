import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight, Info, Star, MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import { EMenuTemplateProps } from './types';
import { SocialLinks } from './components/SocialLinks';

export const SymphonyEliteTemplate: React.FC<EMenuTemplateProps> = ({
// ... existing props ...
   store,
   settings,
   products,
   tags,
   onAddToCart,
   isScrolled
}) => {
   const [activeCategory, setActiveCategory] = useState<string>('');
   const [heroImage, setHeroImage] = useState<string>('');

   useEffect(() => {
      // Use the first product image as hero or a default luxury food image
      const firstWithImage = products.find(p => p.image_url);
      setHeroImage(firstWithImage?.image_url || 'https://images.unsplash.com/photo-1550966842-2849a28eef7a?w=1600&auto=format&fit=crop&q=80');
   }, [products]);

   const categorizedProducts: Record<string, any[]> = {};
   products.forEach((p: any) => {
      const catName = p.category?.name || 'Selections';
      if (!categorizedProducts[catName]) categorizedProducts[catName] = [];
      categorizedProducts[catName].push(p);
   });

   const categories = Object.keys(categorizedProducts);

   return (
      <div className="min-h-screen bg-[#050505] text-[#F5F5F5] font-sans selection:bg-[#C5A059] selection:text-black">
         {/* ... Header and Hero ... */}
         <header className={`fixed top-0 inset-x-0 z-50 px-8 transition-all duration-700 ${
            isScrolled ? 'bg-black/80 backdrop-blur-2xl py-4 border-b border-white/5' : 'bg-transparent py-8'
         }`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <h1 className="text-2xl font-serif italic tracking-[0.2em] uppercase text-[#C5A059]">{store.name}</h1>
               </div>

               <nav className="hidden lg:flex items-center gap-12 text-[10px] uppercase tracking-[0.4em] font-bold text-white/40">
                  {categories.slice(0, 4).map(cat => (
                     <button 
                        key={cat} 
                        onClick={() => document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="hover:text-[#C5A059] transition-colors"
                     >
                        {cat}
                     </button>
                  ))}
               </nav>

               <div className="flex items-center gap-6">
                  {tags && (
                     <div className="hidden md:flex px-4 py-1.5 border border-[#C5A059]/30 rounded-full text-[9px] uppercase tracking-widest text-[#C5A059] font-black">
                        Table {tags}
                     </div>
                  )}
                  <button className="p-2 text-[#C5A059] hover:text-white transition-colors">
                     <ShoppingBag className="size-5" />
                  </button>
               </div>
            </div>
         </header>

         {/* Cinematic Hero Section - Store Info Focus */}
         <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
            <motion.div 
               initial={{ scale: 1.1, opacity: 0 }}
               animate={{ scale: 1, opacity: 0.6 }}
               transition={{ duration: 2, ease: "easeOut" }}
               className="absolute inset-0 z-0"
            >
               <img src={heroImage} className="size-full object-cover" alt="Hero" />
               <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#050505]" />
            </motion.div>

            <div className="relative z-10 max-w-5xl mx-auto px-8 text-center space-y-8">
               <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 1 }}
               >
                  <p className="text-[11px] uppercase tracking-[0.6em] text-[#C5A059] font-black mb-6">Culinary Excellence Section</p>
                  <h2 className="text-6xl md:text-8xl font-serif italic tracking-tight leading-[1.1] mb-8">
                     A Symphony of <br /> 
                     <span className="text-white not-italic font-light">Taste & Elegance</span>
                  </h2>
                  <div className="w-24 h-px bg-[#C5A059] mx-auto mb-8" />
                  <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
                     {store.description || 'Experience the perfect harmony of seasonal flavors and artisanal craftsmanship in every bite.'}
                  </p>
                  <motion.button 
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                     className="mt-12 px-10 py-4 bg-[#C5A059] text-black text-[11px] uppercase tracking-[0.4em] font-black rounded-sm hover:bg-[#D4B57A] transition-colors shadow-2xl shadow-[#C5A059]/20"
                  >
                     Explore Menu
                  </motion.button>
               </motion.div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-[#C5A059]/40">
               <div className="w-px h-12 bg-gradient-to-b from-[#C5A059] to-transparent animate-bounce" />
            </div>
         </section>

         {/* Store Info Cards Section */}
         <section className="max-w-7xl mx-auto px-8 py-32 grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-white/5">
            <div className="flex flex-col items-center text-center space-y-4 group">
               <div className="size-12 rounded-full border border-white/10 flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059]/10 transition-colors">
                  <MapPin className="size-5" />
               </div>
               <h4 className="text-[10px] uppercase tracking-[0.4em] font-black">Location</h4>
               <p className="text-sm text-white/40 leading-relaxed max-w-[200px]">{store.address || 'Contact us for location'}</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 group">
               <div className="size-12 rounded-full border border-white/10 flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059]/10 transition-colors">
                  <Clock className="size-5" />
               </div>
               <h4 className="text-[10px] uppercase tracking-[0.4em] font-black">Hours</h4>
               <p className="text-sm text-white/40 leading-relaxed max-w-[200px]">Daily 10:00 AM — 11:00 PM</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 group">
               <div className="size-12 rounded-full border border-white/10 flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059]/10 transition-colors">
                  <Phone className="size-5" />
               </div>
               <h4 className="text-[10px] uppercase tracking-[0.4em] font-black">Reservations</h4>
               <p className="text-sm text-white/40 leading-relaxed max-w-[200px]">
                  {settings.phone_numbers?.[0] || store.phone_number || 'In-store only'}
               </p>
            </div>
         </section>

         {/* Elegant Category Navigation (Sticky) */}
         <nav className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl py-8 border-b border-white/5 overflow-hidden">
            <div className="flex items-center justify-center gap-12 px-8 overflow-x-auto no-scrollbar">
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
                     className={`whitespace-nowrap text-[11px] font-black uppercase tracking-[0.3em] transition-all relative py-2 ${
                        activeCategory === cat ? 'text-[#C5A059]' : 'text-white/20 hover:text-white/60'
                     }`}
                  >
                     {cat}
                        {activeCategory === cat && (
                           <motion.div 
                              initial={{ scaleX: 0, opacity: 0 }}
                              animate={{ scaleX: 1, opacity: 1 }}
                              className="absolute -bottom-1 left-0 right-0 h-px bg-[#C5A059] origin-left" 
                           />
                        )}
                  </button>
               ))}
            </div>
         </nav>

         <main className="max-w-6xl mx-auto px-8 py-32 space-y-48">
            {Object.entries(categorizedProducts).map(([category, items]) => (
               <section key={category} id={`category-${category}`} className="space-y-24">
                  {/* Luxury Section Header */}
                  <div className="space-y-6">
                     <p className="text-[10px] uppercase tracking-[0.6em] text-[#C5A059] font-black">Signature Section</p>
                     <h3 className="text-5xl md:text-6xl font-serif italic tracking-tight">{category}</h3>
                     <div className="w-20 h-px bg-[#C5A059]/30" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-32">
                     {items.map((product) => {
                        const isOutOfStock = product.is_out_of_stock;
                        return (
                           <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-100px" }}
                              key={product.id}
                              className={`group relative flex flex-col gap-8 ${isOutOfStock ? 'opacity-30 grayscale' : ''}`}
                           >
                              {product.image_url && (
                                 <div className="aspect-[16/10] overflow-hidden rounded-sm bg-white/5 border border-white/5 group-hover:border-[#C5A059]/20 transition-all duration-700">
                                    <img src={product.image_url} alt={product.name} className="size-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" />
                                 </div>
                              )}
                              
                              <div className="space-y-4">
                                 <div className="flex items-start justify-between gap-6">
                                    <div className="space-y-1">
                                       <h4 className="text-2xl font-serif italic tracking-wide group-hover:text-[#C5A059] transition-colors">{product.name}</h4>
                                       {product.tags && product.tags.length > 0 && (
                                          <div className="flex gap-4">
                                             {product.tags.map(t => (
                                                <span key={t} className="text-[9px] uppercase tracking-widest text-[#C5A059]/60 font-bold">• {t}</span>
                                             ))}
                                          </div>
                                       )}
                                    </div>
                                    {settings.show_prices && (
                                       <span className="text-xl font-light tracking-widest text-[#C5A059]">
                                          ${Number(product.base_price).toFixed(2)}
                                       </span>
                                    )}
                                 </div>

                                 {product.description && (
                                    <p className="text-sm text-white/40 leading-relaxed font-light line-clamp-3">
                                       {product.description}
                                    </p>
                                 )}

                                 {settings.allow_ordering && !isOutOfStock && (
                                    <button
                                       onClick={() => onAddToCart(product)}
                                       className="pt-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-white/20 hover:text-[#C5A059] transition-all group/btn"
                                    >
                                       <ShoppingBag className="size-4" />
                                       Add to Selection
                                       <ArrowRight className="size-3 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                 )}
                              </div>
                           </motion.div>
                        );
                     })}
                  </div>
               </section>
            ))}
         </main>

         {/* Premium Footer */}
         <footer className="mt-32 bg-[#0A0A0A] border-t border-white/5">
            <div className="max-w-7xl mx-auto px-8 py-32 flex flex-col items-center gap-12 text-center">
               <div className="space-y-6">
                  <h5 className="text-3xl font-serif italic tracking-[0.2em] text-[#C5A059]">{store.name}</h5>
                  <p className="text-[10px] uppercase tracking-[0.6em] text-white/20">The Pinnacle of Dining</p>
               </div>
               
               <div className="w-20 h-px bg-white/10" />

               <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-24 text-[9px] uppercase tracking-[0.4em] font-black text-white/40">
                  <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                  <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
                  <span className="hover:text-white cursor-pointer transition-colors">Press Inquiries</span>
                  <span className="hover:text-white cursor-pointer transition-colors">Sustainability</span>
               </div>

               <div className="pt-24 flex flex-col items-center gap-8">
                  <SocialLinks settings={settings} className="flex items-center gap-8 text-white/20" iconClassName="size-5 hover:text-[#C5A059] transition-colors" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/10 italic">Crafted with Excellence by FloraPos Elite</p>
               </div>
            </div>
         </footer>
      </div>
   );
};
