import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useEmenuStore } from '@/app/store/emenu-store';
import { request } from '@/app/services/api';
import { ShoppingBag, X, Minus, Plus, ChevronRight, Store, Layout, ArrowRight, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { getTemplate } from '@/app/emenu/templates';
import { ProductCustomizationModal } from '@/app/components/pos/ProductCustomizationModal';
import html2canvas from 'html2canvas';

export function PublicEMenuPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [searchParams] = useSearchParams();
  const rawTag = searchParams.get('tag') || searchParams.get('table');
  const tagParam = React.useMemo(() => {
    if (!rawTag) return null;
    try {
      // Try to decode base64
      return atob(rawTag);
    } catch (e) {
      // Fallback to raw tag if not valid base64 (legacy links)
      return rawTag;
    }
  }, [rawTag]);

  const { publicData, loading, fetchPublicData } = useEmenuStore();

  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedProductForOptions, setSelectedProductForOptions] = useState<any | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [cartTab, setCartTab] = useState<'cart' | 'history'>('cart');

  useEffect(() => {
    if (storeId) {
      fetchPublicData(storeId);

      // Load recent orders from local storage
      const saved = localStorage.getItem(`emenu_orders_${storeId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const now = Date.now();
          // Filter 5h logic
          const valid = parsed.filter((o: any) => now - o.timestamp < 5 * 60 * 60 * 1000);
          setRecentOrders(valid);
          localStorage.setItem(`emenu_orders_${storeId}`, JSON.stringify(valid));
        } catch (e) {
          console.error('Failed to parse recent orders');
        }
      }
    }
  }, [storeId, fetchPublicData]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="size-10 border-4 border-slate-100 border-t-brand-primary rounded-full" />
      </div>
    );
  }

  if (!publicData || !publicData.settings?.is_enabled) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-white p-10 text-center">
        <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Store className="size-10 text-slate-300" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Menu Unavailable</h1>
        <p className="text-slate-500 font-medium max-w-xs">This store's digital menu is currently offline.</p>
      </div>
    );
  }

  const { store, settings, products } = publicData;
  const allowOrdering = settings.allow_ordering;
  const showPrices = settings.show_prices;
  const templateId = settings.template_id || 'default';

  const { component: TemplateComponent } = getTemplate(templateId);

  const handleAddToCart = (product: any, variant?: any, addons?: any[], qty: number = 1, modifiers?: any) => {
    // Generate a unique key for this combination of product + modifiers
    const modifierIds = modifiers ? Object.values(modifiers).flat().map((o: any) => o.id).sort() : [];
    const cartItemId = `${product.id}-${modifierIds.join('-')}`;

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item => item.id === cartItemId ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, {
        id: cartItemId,
        product_id: product.id,
        product,
        quantity: qty,
        selectedModifiers: modifiers
      }];
    });
    toast.success(`${product.name} added`, { position: 'bottom-center', duration: 1000 });
  };

   const onTemplateAddToCart = (product: any) => {
    if (product.is_out_of_stock) {
      toast.error(`${product.name} is out of stock`, { position: 'bottom-center' });
      return;
    }

    if (product.modifier_groups && product.modifier_groups.length > 0) {
      setSelectedProductForOptions(product);
    } else {
      handleAddToCart(product);
    }
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const calculateItemPrice = (item: any) => {
    const basePrice = Number(item.product.base_price) || 0;
    const modifiersPrice = Object.values(item.selectedModifiers || {}).flat().reduce((acc: number, curr: any) => acc + Number(curr.price_adjustment), 0);
    return basePrice + modifiersPrice;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (calculateItemPrice(item) * item.quantity), 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;

    if (settings.require_customer_name && !customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (settings.require_customer_phone && !customerPhone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const response = await request(`/emenu/public/${storeId}/orders`, {
        method: 'POST',
        body: JSON.stringify({
          store_id: storeId,
          order_type: 'emenu',
          status: 'emenu_pending',
          customer_name: customerName,
          customer_phone: customerPhone,
          items: cart.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            addons: Object.values(i.selectedModifiers || {}).flat().map((opt: any) => ({
              name_snapshot: opt.name,
              price: Number(opt.price_adjustment),
              modifier_option_id: opt.id
            }))
          })),
          tags: tagParam,
          notes: tagParam ? `Tag: ${tagParam}` : '',
          payment_method: 'pay_later',
        })
      });

      // Save to history
      const newOrderHistory = [{ ...response, timestamp: Date.now() }, ...recentOrders];
      setRecentOrders(newOrderHistory);
      localStorage.setItem(`emenu_orders_${storeId}`, JSON.stringify(newOrderHistory));

      toast.success('Order placed successfully!');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCartTab('history');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const downloadReceipt = async (orderId: string) => {
    const element = document.getElementById(`printable-receipt-${orderId}`);
    if (!element) {
      console.error('Receipt element not found for ID:', orderId);
      return;
    }

    try {
      toast.loading('Generating POS Receipt...', { id: 'receipt-loading' });

      // Create a completely isolated iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '380px';
      iframe.style.height = '1000px';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Could not create isolation iframe');

      // Inject basic styles and content
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                background: white; 
                display: flex; 
                justify-content: center;
              }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body>
            ${element.outerHTML}
          </body>
        </html>
      `);
      iframeDoc.close();

      // Wait for iframe to render
      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(iframeDoc.body, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true,
        width: 380,
      });

      // Cleanup iframe
      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || imgData === 'data:,') throw new Error('Canvas rendering failed');

      const link = document.createElement('a');
      link.download = `receipt-${orderId.slice(0, 8)}.png`;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss('receipt-loading');
      toast.success('POS Receipt saved!');
    } catch (err: any) {
      console.error('Receipt Capture Error:', err);
      toast.dismiss('receipt-loading');
      toast.error('Failed to save receipt. Try again.');
    }
  };

  return (
    <div className="relative">
      <TemplateComponent
        store={store}
        settings={settings}
        products={products}
        tags={tagParam || undefined}
        cart={cart}
        onAddToCart={onTemplateAddToCart}
        onOpenCart={() => setIsCartOpen(true)}
        isScrolled={isScrolled}
      />

      {/* Hidden POS-Style Receipts for Capture */}
      <div className="hidden">
        {recentOrders.map(order => {
          const subtotal = order.items?.reduce((sum: number, i: any) => sum + Number(i.line_total), 0) || 0;
          const grandTotal = Number(order.grand_total);
          const orderNum = order.order_number?.split('$$')[0] || order.id.slice(0, 8);
          const timestamp = new Date(order.timestamp).toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });

          return (
            <div
              key={order.id}
              id={`printable-receipt-${order.id}`}
              style={{
                width: '320px',
                padding: '24px',
                backgroundColor: '#ffffff',
                color: '#000000',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '12px',
                lineHeight: '1.4'
              }}
            >
              {/* Receipt Header */}
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>{store.name}</h2>
                <p style={{ fontSize: '10px', margin: '0', opacity: 0.8 }}>{store.address || 'Digital Order'}</p>
                <div style={{ marginTop: '10px', borderTop: '1px solid black', borderBottom: '1px solid black', padding: '4px 0', fontWeight: 'bold', fontSize: '14px' }}>
                  RECEIPT
                </div>
              </div>

              {/* Order Metadata */}
              <div style={{ fontSize: '11px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>INVOICE:</span>
                  <span style={{ fontWeight: 'bold' }}>{orderNum}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>DATE:</span>
                  <span>{timestamp}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>TYPE:</span>
                  <span>E-MENU ORDER</span>
                </div>
                {order.tags && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>TAG:</span>
                    <span style={{ fontWeight: 'bold' }}>{order.tags}</span>
                  </div>
                )}
                {order.customer_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CUSTOMER:</span>
                    <span>{order.customer_name}</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px dashed black', margin: '10px 0' }}></div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', fontSize: '11px' }}>
                    <th style={{ paddingBottom: '5px' }}>ITEM</th>
                    <th style={{ textAlign: 'right', paddingBottom: '5px' }}>QTY</th>
                    <th style={{ textAlign: 'right', paddingBottom: '5px' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, i: number) => (
                    <React.Fragment key={i}>
                      <tr>
                        <td style={{ padding: '6px 0', fontWeight: 'bold', verticalAlign: 'top' }}>{item.product_name_snapshot}</td>
                        <td style={{ textAlign: 'right', padding: '6px 0', verticalAlign: 'top' }}>x{item.quantity}</td>
                        <td style={{ textAlign: 'right', padding: '6px 0', verticalAlign: 'top', fontWeight: 'bold' }}>${Number(item.line_total).toFixed(2)}</td>
                      </tr>
                      {item.addons?.map((addon: any, ai: number) => (
                        <tr key={ai}>
                          <td colSpan={2} style={{ padding: '0 0 4px 12px', fontSize: '10px', opacity: 0.7 }}>
                            + {addon.name_snapshot}
                          </td>
                          <td style={{ textAlign: 'right', padding: '0 0 4px 0', fontSize: '10px', opacity: 0.7 }}>
                            ${Number(addon.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed black', margin: '10px 0' }}></div>

              {/* Financial Totals */}
              <div style={{ spacingY: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {Number(order.tax_total) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tax:</span>
                    <span>${Number(order.tax_total).toFixed(2)}</span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid black', marginTop: '8px', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold' }}>
                    <span>GRAND TOTAL:</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>
                    <span>TOTAL (KHR):</span>
                    <span>{(grandTotal * 4100).toLocaleString()}៛</span>
                  </div>
                </div>
              </div>

              {/* Receipt Footer */}
              <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '10px' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>THANK YOU FOR YOUR VISIT!</p>
                <p style={{ margin: '0' }}>Powered by FloraPos</p>
                <div style={{ marginTop: '15px', border: '1px solid black', padding: '8px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Digital Receipt Saved
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Persistent History Button (Bottom Left) */}
      {recentOrders.length > 0 && !isCartOpen && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            setCartTab('history');
            setIsCartOpen(true);
          }}
          className={`fixed bottom-6 left-6 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-90 ${templateId === 'modern'
            ? 'bg-white/10 text-white backdrop-blur-xl border border-white/10 hover:bg-white/20'
            : 'bg-white text-slate-900 shadow-slate-200 border border-slate-100 hover:bg-slate-50'
            }`}
        >
          <Clock className="size-4 text-brand-primary" />
          My Orders
        </motion.button>
      )}

      <ProductCustomizationModal
        isOpen={!!selectedProductForOptions}
        onClose={() => setSelectedProductForOptions(null)}
        product={selectedProductForOptions}
        onAddToCart={handleAddToCart}
      />

      {/* Floating Cart Island (Shared across templates) */}
      <AnimatePresence>
        {allowOrdering && cart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 inset-x-0 px-6 z-40"
          >
            <button
              onClick={() => {
                setCartTab('cart');
                setIsCartOpen(true);
              }}
              className={`max-w-md mx-auto w-full h-20 rounded-[2.5rem] shadow-2xl flex items-center justify-between px-8 font-black active:scale-[0.98] transition-transform overflow-hidden relative ${templateId === 'modern' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`size-12 flex items-center justify-center rounded-2xl ${templateId === 'modern' ? 'bg-slate-900 text-white' : 'bg-white/10 text-white'}`}>
                  <ShoppingBag className="size-6" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Review Order</span>
                  <span className="text-sm font-black">{cart.reduce((s, i) => s + i.quantity, 0)} Items</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {showPrices && <span className="text-2xl tracking-tighter">${cartTotal.toFixed(2)}</span>}
                <div className={`size-10 rounded-full flex items-center justify-center ${templateId === 'modern' ? 'bg-slate-100' : 'bg-white/10'}`}>
                  <ChevronRight className="size-5" />
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Cart Sheet */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 350 }}
              className={`fixed inset-x-0 bottom-0 z-50 rounded-t-[3rem] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col h-[92vh] ${templateId === 'modern' ? 'bg-[#0A1221] text-white border-t border-white/5' : 'bg-white text-slate-900'}`}
            >
              <div className="flex items-center justify-between px-8 pt-10 pb-6 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black tracking-tight uppercase tracking-[0.05em]">Your Selection</h3>
                    {tagParam && (
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${templateId === 'modern' ? 'bg-white/10 text-white' : 'bg-slate-900 text-white shadow-lg shadow-slate-200'}`}>
                        {tagParam}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-brand-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{store.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsCartOpen(false)} className={`size-12 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${templateId === 'modern' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                  <X className="size-6" />
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="px-8 pb-6 shrink-0 flex gap-2">
                <button
                  onClick={() => setCartTab('cart')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${cartTab === 'cart'
                    ? (templateId === 'modern' ? 'bg-white text-slate-900 shadow-xl shadow-white/5' : 'bg-slate-900 text-white shadow-xl shadow-slate-200')
                    : (templateId === 'modern' ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-400')
                    }`}
                >
                  Current Cart ({cart.length})
                </button>
                <button
                  onClick={() => setCartTab('history')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${cartTab === 'history'
                    ? (templateId === 'modern' ? 'bg-white text-slate-900 shadow-xl shadow-white/5' : 'bg-slate-900 text-white shadow-xl shadow-slate-200')
                    : (templateId === 'modern' ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-400')
                    }`}
                >
                  My Orders ({recentOrders.length})
                </button>
              </div>

              {cartTab === 'cart' ? (
                <>
                  {(settings.require_customer_name || settings.require_customer_phone) && cart.length > 0 && (
                    <div className="px-8 pb-6 shrink-0 space-y-4">
                      <div className={`p-6 rounded-[2rem] space-y-4 ${templateId === 'modern' ? 'bg-white/5' : 'bg-slate-50'}`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Customer Information</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {settings.require_customer_name && (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                placeholder="Full Name *"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className={`w-full px-5 py-3.5 rounded-xl text-sm font-bold outline-none transition-all ${templateId === 'modern'
                                  ? 'bg-white/5 border border-white/10 focus:border-white/30 text-white placeholder:text-white/20'
                                  : 'bg-white border border-slate-200 focus:border-brand-primary shadow-sm placeholder:text-slate-300'
                                  }`}
                              />
                            </div>
                          )}
                          {settings.require_customer_phone && (
                            <div className="space-y-1.5">
                              <input
                                type="tel"
                                placeholder="Phone Number *"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className={`w-full px-5 py-3.5 rounded-xl text-sm font-bold outline-none transition-all ${templateId === 'modern'
                                  ? 'bg-white/5 border border-white/10 focus:border-white/30 text-white placeholder:text-white/20'
                                  : 'bg-white border border-slate-200 focus:border-brand-primary shadow-sm placeholder:text-slate-300'
                                  }`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-8 space-y-6 pb-60 no-scrollbar">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                        <ShoppingBag className="size-16" />
                        <p className="font-bold text-sm uppercase tracking-widest">Cart is Empty</p>
                      </div>
                    ) : (
                      cart.map((item, idx) => (
                        <motion.div
                          layout
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex gap-5 p-4 rounded-[2rem] border transition-all ${templateId === 'modern' ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100'}`}
                        >
                          {item.product.image_url && (
                            <div className="size-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-white/10">
                              <img src={item.product.image_url} alt={item.product.name} className="size-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col min-w-0">
                                <h4 className="font-bold text-base leading-tight truncate">{item.product.name}</h4>
                                {item.selectedModifiers && Object.values(item.selectedModifiers).flat().length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {Object.values(item.selectedModifiers).flat().map((o: any) => (
                                      <span key={o.id} className="text-[9px] font-black bg-brand-primary/5 text-brand-primary/70 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                        {o.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {showPrices && (
                                <span className="font-black text-lg tracking-tighter tabular-nums text-brand-primary">
                                  ${(calculateItemPrice(item) * item.quantity).toFixed(2)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-5">
                              <div className={`flex items-center rounded-xl p-1 gap-4 ${templateId === 'modern' ? 'bg-white/10' : 'bg-white shadow-sm border border-slate-100'}`}>
                                <button onClick={() => updateQuantity(item.id, -1)} className={`size-8 flex items-center justify-center rounded-lg transition-all active:scale-75 ${templateId === 'modern' ? 'text-white/40 hover:text-white' : 'text-slate-300 hover:text-slate-900'}`}>
                                  <Minus className="size-4" />
                                </button>
                                <span className="text-sm font-black w-4 text-center tabular-nums">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className={`size-8 flex items-center justify-center rounded-lg transition-all active:scale-75 ${templateId === 'modern' ? 'text-white' : 'text-slate-900'}`}>
                                  <Plus className="size-4" />
                                </button>
                              </div>
                              <button onClick={() => removeFromCart(item.id)} className="text-red-500/60 hover:text-red-500 font-black text-[9px] uppercase tracking-[0.2em] transition-all">
                                Remove
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto px-8 space-y-6 pb-20 no-scrollbar">
                  {recentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                      <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="size-8" />
                      </div>
                      <p className="font-bold text-sm uppercase tracking-widest">No Previous Orders</p>
                    </div>
                  ) : (
                    recentOrders.map((order, idx) => (
                      <motion.div
                        key={order.id}
                        id={`order-card-${order.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-6 rounded-[2.5rem] border ${templateId === 'modern' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-widest opacity-40 mb-1">Order Ref</h4>
                            <p className="font-black text-brand-primary tracking-tight">#{order.order_number?.split('$$')[0] || order.id.slice(0, 8)}</p>
                          </div>
                          <button
                            onClick={() => downloadReceipt(order.id)}
                            className={`size-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${templateId === 'modern' ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow-sm border border-slate-100'}`}
                          >
                            <Download className="size-4" />
                          </button>
                        </div>

                        <div className="space-y-4 mb-6">
                          {order.items?.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-3">
                                  <span className="size-6 flex items-center justify-center bg-slate-900 text-white rounded-lg text-[10px] font-black shrink-0">{item.quantity}</span>
                                  <span className="font-black truncate max-w-[150px]">{item.product_name_snapshot || 'Product'}</span>
                                </div>
                                {showPrices && (
                                  <span className="font-black tabular-nums">
                                    ${Number(item.line_total).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {item.addons && item.addons.length > 0 && (
                                <div className="flex flex-col gap-1 ml-9">
                                  {item.addons.map((addon: any, ai: number) => (
                                    <div key={ai} className="flex justify-between items-center pr-1">
                                      <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                                        + {addon.name_snapshot}
                                      </span>
                                      {showPrices && Number(addon.price) > 0 && (
                                        <span className="text-[9px] font-black opacity-30 tabular-nums">+${Number(addon.price).toFixed(2)}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className={`pt-4 border-t flex justify-between items-center ${templateId === 'modern' ? 'border-white/5' : 'border-slate-200/50'}`}>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Status</span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary uppercase tracking-[0.2em]">{order.status?.replace('_', ' ')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Total Paid</span>
                            <span className="text-2xl font-black tracking-tighter tabular-nums">${Number(order.grand_total).toFixed(2)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {cartTab === 'cart' && (
                <div className={`absolute bottom-0 inset-x-0 p-8 border-t bg-white/80 backdrop-blur-xl space-y-6 ${templateId === 'modern' ? 'bg-slate-900/90 border-white/5' : 'bg-white/90 border-slate-100'}`}>
                  {showPrices && cart.length > 0 && (
                    <div className="flex justify-between items-center px-2">
                      <div className="flex flex-col">
                        <span className="text-slate-400 font-black uppercase tracking-[0.3em] text-[9px]">Grand Total</span>
                        <span className="text-sm font-bold text-slate-300">Inc. Service & Tax</span>
                      </div>
                      <span className="text-4xl font-black tracking-tighter tabular-nums">${cartTotal.toFixed(2)}</span>
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={placeOrder}
                    disabled={isPlacingOrder || cart.length === 0}
                    className={`w-full h-20 rounded-[2rem] font-black text-xl shadow-2xl disabled:opacity-30 flex items-center justify-center gap-4 transition-all relative overflow-hidden ${templateId === 'modern'
                      ? 'bg-white text-slate-900 shadow-white/5'
                      : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-brand-primary'
                      }`}
                  >
                    {isPlacingOrder ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className={`size-8 border-4 rounded-full ${templateId === 'modern' ? 'border-slate-900/30 border-t-slate-900' : 'border-white/30 border-t-white'}`} />
                    ) : (
                      <>
                        <span className="uppercase tracking-[0.1em]">Complete Order</span>
                        <div className={`size-10 rounded-full flex items-center justify-center ${templateId === 'modern' ? 'bg-slate-100' : 'bg-white/10'}`}>
                          <ArrowRight className="size-6" />
                        </div>
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
