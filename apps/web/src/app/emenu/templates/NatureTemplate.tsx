import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Store, Plus, Leaf, Cloud, Sun } from 'lucide-react';
import { EMenuTemplateProps } from './types';
import { SocialLinks } from './components/SocialLinks';

export const NatureTemplate: React.FC<EMenuTemplateProps> = ({
  store,
  settings,
  products,
  tags,
  onAddToCart,
  isScrolled,
  cart
}) => {
  // ... existing logic ...
  const [activeCategory, setActiveCategory] = useState<string>('');

  const categorizedProducts: Record<string, any[]> = {};
  products.forEach((p: any) => {
    const catName = p.category?.name || 'Menu';
    if (!categorizedProducts[catName]) categorizedProducts[catName] = [];
    categorizedProducts[catName].push(p);
  });

  const categories = Object.keys(categorizedProducts);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const element = document.getElementById(`category-${cat}`);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF9F3] text-[#3E4A35] font-sans pb-10">
      {/* ... Hero and Content ... */}
      <div className="relative h-[65vh] min-h-[500px] overflow-hidden">
        {store.banner_image ? (
          <img src={store.banner_image} alt="Farm" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#E8F1E6] flex items-center justify-center">
            <Leaf className="size-32 text-[#A8C4A0] opacity-30" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-8 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 max-w-2xl"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-12 bg-white/40" />
              <span className="text-xs font-black uppercase tracking-[0.4em] text-white/80">Premium Freshness</span>
              <div className="h-px w-12 bg-white/40" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight uppercase">
              <span className="text-[#E7C873] font-serif italic font-normal normal-case">{store.name}</span>
            </h1>

            <div className="flex items-center justify-center gap-6 pt-4">
              {[
                { icon: Sun, label: 'Organic', color: '#E7C873' },
                { icon: Leaf, label: 'Freshly Picked', color: '#A8C4A0' },
                { icon: Cloud, label: 'Local', color: 'white' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="size-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <item.icon className="size-5" style={{ color: item.color }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Organic Wavy Divider Bottom */}
        <div className="absolute left-0 w-full overflow-hidden leading-[0] bottom-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[60px]" style={{ fill: '#FDF9F3' }}>
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.2,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,33.76-16.43,58-45,120-100V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </div>

      <div className="relative z-10 -mt-16 px-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md mx-auto bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-[#3E4A35]/10 flex flex-col items-center text-center border-t border-white/50"
        >
          {store.logo_url && (
            <div className="size-24 rounded-full overflow-hidden shadow-2xl -mt-20 border-8 border-white mb-6">
              <img src={store.logo_url} alt="Logo" className="size-full object-cover" />
            </div>
          )}
          <h2 className="text-3xl font-black tracking-tight text-[#2D3A24] mb-2">{store.name}</h2>
          <p className="text-xs font-black text-[#A4B19A] uppercase tracking-[0.2em] mb-4">Open for Freshness</p>
          
          {tags && (
            <div className="px-6 py-2 bg-[#7E8F6F] rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em]">
              Table: {tags}
            </div>
          )}
        </motion.div>
      </div>

      {/* Organic Category Navigation */}
      <div className={`sticky top-0 z-40 py-8 transition-all ${isScrolled ? 'bg-[#FDF9F3]/90 backdrop-blur-xl shadow-lg shadow-[#3E4A35]/5' : ''}`}>
        <div className="flex items-center gap-4 px-8 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className={`whitespace-nowrap px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 active:scale-90 duration-300 ${
                activeCategory === cat 
                ? 'bg-[#3E4A35] text-white border-[#3E4A35] shadow-xl shadow-[#3E4A35]/20' 
                : 'bg-white text-[#3E4A35] border-transparent hover:border-[#3E4A35]/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content with floating decorations */}
      <main className="max-w-6xl mx-auto px-8 py-16 relative">
        {/* Floating Leaf Decorations using motion */}
        <motion.img 
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          src="/assets/nature/leaf.png" 
          className="absolute top-20 -left-20 size-40 opacity-10 pointer-events-none" 
          alt="" 
        />
        <motion.img 
          animate={{ y: [0, -20, 0], rotate: [90, 95, 90] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          src="/assets/nature/leaf.png" 
          className="absolute top-[40%] -right-20 size-48 opacity-10 pointer-events-none" 
          alt="" 
        />
        <motion.img 
          animate={{ y: [0, -10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          src="/assets/nature/tomato.png" 
          className="absolute bottom-[20%] -left-10 size-24 opacity-10 pointer-events-none" 
          alt="" 
        />

        {Object.entries(categorizedProducts).map(([category, items]) => (
          <section key={category} id={`category-${category}`} className="mb-32 scroll-mt-32">
            <div className="flex flex-col items-center mb-16">
              <div className="flex items-center gap-6 mb-4">
                <div className="h-px w-16 bg-[#3E4A35]/10" />
                <Leaf className="size-8 text-[#A8C4A0]" />
                <div className="h-px w-16 bg-[#3E4A35]/10" />
              </div>
              <h2 className="text-4xl font-black tracking-tight text-[#2D3A24] font-serif italic text-center uppercase tracking-[0.05em]">{category}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
              {items.map((product, idx) => {
                const isOutOfStock = product.is_out_of_stock;
                const cartItem = cart?.find(i => i.product_id === product.id);
                const qty = cartItem?.quantity || 0;

                return (
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: idx * 0.1 }}
                    key={product.id}
                    className={`bg-white rounded-[2.5rem] p-4 shadow-[0_15px_35px_rgba(62,74,53,0.08)] hover:shadow-[0_25px_50px_rgba(62,74,53,0.12)] transition-all duration-500 border border-black/[0.02] hover:-translate-y-2 group ${isOutOfStock ? 'opacity-60' : ''}`}
                  >
                    <div className="aspect-square rounded-[2rem] overflow-hidden relative mb-6 group-hover:scale-[1.02] transition-transform duration-500">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center bg-[#FDF9F3]">
                          <Store className="size-12 text-[#A8C4A0]/20" />
                        </div>
                      )}
                      
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-[#3E4A35]/40 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-white text-[#3E4A35] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">Sold Out</span>
                        </div>
                      )}

                      {settings.allow_ordering && !isOutOfStock && (
                        <button
                          onClick={() => onAddToCart(product)}
                          className="absolute bottom-4 right-4 size-14 rounded-full bg-[#3E4A35] text-white shadow-2xl flex items-center justify-center hover:bg-[#7E8F6F] active:scale-90 transition-all z-10"
                        >
                          {qty > 0 ? (
                            <span className="text-sm font-black">{qty}x</span>
                          ) : (
                            <Plus className="size-8" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 px-2">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="text-xl font-black text-[#2D3A24] leading-tight group-hover:text-[#3E4A35] transition-colors uppercase tracking-tight">{product.name}</h3>
                        {settings.show_prices && (
                          <span className="text-xl font-black text-[#7E8F6F] tracking-tighter tabular-nums whitespace-nowrap">
                            ${Number(product.base_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      {product.description && (
                        <p className="text-[10px] font-black text-[#A4B19A] line-clamp-2 leading-relaxed uppercase tracking-widest">{product.description}</p>
                      )}

                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {product.tags.map(tag => (
                            <span key={tag} className="text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg bg-[#3E4A35]/5 text-[#3E4A35]/60">
                              {tag}
                            </span>
                          ))}
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

      {/* Premium Footer */}
      <footer className="relative bg-[#3E4A35] pt-40 pb-20 px-8 text-center overflow-hidden">
        {/* Wavy Divider Top */}
        <div className="absolute left-0 w-full overflow-hidden leading-[0] top-0 rotate-180">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[60px]" style={{ fill: '#FDF9F3' }}>
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.2,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,33.76-16.43,58-45,120-100V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <div className="size-20 rounded-full bg-white/10 mx-auto flex items-center justify-center mb-8 border border-white/10 backdrop-blur-md">
            <Leaf className="size-10 text-[#E7C873]" />
          </div>
          <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-[0.2em]">{store.name}</h3>
          <p className="text-white/60 text-xs font-bold uppercase tracking-[0.4em] mb-12">Naturally Sourced — Sustainably Grown</p>
          
          <div className="flex justify-center mb-16 px-4">
            <SocialLinks settings={settings} className="flex justify-center flex-wrap gap-8 text-white/40" iconClassName="size-6" />
          </div>

          <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">
            Powered by FloraPos Digital E-Menu
          </div>
        </motion.div>
      </footer>
    </div>
  );
};


