import { motion, AnimatePresence } from 'motion/react';
import {
  Minus, Plus, CreditCard, Banknote, ShoppingBag, Clock, Truck,
  ScanLine, Wallet, MapPin, StickyNote, Delete, ClipboardList, User, Phone
} from 'lucide-react';
import { useCartStore } from '@/app/store/cart-store';
import { useOrderStore } from '@/app/store/order-store';
import { useAuthStore } from '@/app/store/auth-store';
import { useState, useMemo, useEffect } from 'react';
import { AnimatedModal } from '../motion/AnimatedPage';
import { toast } from 'sonner';
import { OrderListModal } from './OrderListModal';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

/** Fallback flower images keyed by product name substring. */
const FLOWER_IMAGE_MAP: Record<string, string> = {
  'Red Roses': 'photo-1518709594023-6eab9bab7b23?w=800&h=800&fit=crop',
  'White Lilies': 'photo-1602492275880-1b23c1a8e6f1?w=800&h=800&fit=crop',
  'Tulips Bouquet': 'photo-1520763185298-1b434c919102?w=800&h=800&fit=crop',
  'Orchid Plant': 'photo-1525310072745-f49212b5ac6d?w=800&h=800&fit=crop',
  'Sunflowers': 'photo-1470509037663-253afd7f0f51?w=800&h=800&fit=crop',
  'Mixed Bouquet': 'photo-1490750967868-88aa4486c946?w=800&h=800&fit=crop',
  'Pink Peonies': 'photo-1522348693650-dc5c2347e082?w=800&h=800&fit=crop',
  'Carnations': 'photo-1585821569331-f071db2abd8d?w=800&h=800&fit=crop',
  'Daisies': 'photo-1463320898484-cdae8bccd79e?w=800&h=800&fit=crop',
  'Hydrangeas': 'photo-1558603668-6570496b66f8?w=800&h=800&fit=crop',
  'Lavender Bouquet': 'photo-1499002238440-d264edd596ec?w=800&h=800&fit=crop',
  'Exotic Tropicals': 'photo-1601002354177-a2e88c27a23f?w=800&h=800&fit=crop',
};
const DEFAULT_IMAGE = 'photo-1490750967868-88aa4486c946?w=800&h=800&fit=crop';

function getFlowerImage(name: string): string {
  const key = Object.keys(FLOWER_IMAGE_MAP).find(k => name.includes(k));
  const imageId = key ? FLOWER_IMAGE_MAP[key] : DEFAULT_IMAGE;
  return `https://images.unsplash.com/${imageId}&q=80`;
}

export function CartPanel({ onClose }: { onClose?: () => void }) {
  const { cart, removeFromCart, updateCartQuantity, clearCart } = useCartStore();
  const { checkoutOrder } = useOrderStore();
  const { selectedStore } = useAuthStore();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showOrderList, setShowOrderList] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pay_later' | 'cash' | 'qr' | null>(null);
  const [serviceType, setServiceType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentStep, setPaymentStep] = useState<'select' | 'cash'>('select');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [address, setAddress] = useState('');
  const [tags, setTags] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // ── Price calculations (pure derivations — no setState during render) ──────
  const { subTotal, tax, total } = useMemo(() => {
    const sub = cart.reduce((sum, item) => {
      const variantPrice = item.selectedVariant ? Number(item.selectedVariant.price_modifier) : 0;
      const addonsPrice = item.selectedAddons?.reduce((acc, opt) => acc + Number(opt.price), 0) || 0;
      const modifiersPrice = Object.values(item.selectedModifiers || {}).flat().reduce((acc, curr) => acc + Number(curr.price_adjustment), 0);

      return sum + (Number(item.product.base_price) + variantPrice + addonsPrice + modifiersPrice) * item.quantity;
    }, 0);

    const taxRate = (selectedStore?.enable_tax !== false) ? (selectedStore?.tax_rate || 0) : 0;
    const taxAmt = sub * (taxRate / 100);
    const totalAmt = Math.max(0, sub + taxAmt + (serviceType === 'delivery' ? deliveryFee : 0));
    return { subTotal: sub, tax: taxAmt, total: totalAmt, taxRate };
  }, [cart, serviceType, deliveryFee, selectedStore]);

  // ── Checkout handler ──────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0 || !selectedStore) {
      toast.error('Cart is empty or no store selected');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        store_id: selectedStore.id,
        order_type: serviceType,
        items: cart.map(item => ({
          product_id: item.product.id,
          variant_id: item.selectedVariant?.id,
          quantity: item.quantity,
          addons: [
            ...(item.selectedAddons?.map(a => ({
              name_snapshot: a.name,
              price: Number(a.price),
              addon_id: a.id,
            })) || []),
            ...Object.entries(item.selectedModifiers || {}).flatMap(([groupId, options]) =>
              options.map(opt => ({
                name_snapshot: opt.name,
                price: Number(opt.price_adjustment),
                modifier_option_id: opt.id,
                modifier_group_id: groupId
              }))
            )
          ],
        })),
        discount_amount: 0,
        notes: note || undefined,
        total_amount: total,
        payment_method: paymentMethod,
        delivery_address: serviceType === 'delivery' ? address : undefined,
        delivery_fee: serviceType === 'delivery' ? deliveryFee : undefined,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        tags: tags || undefined,
        exchange_rate: selectedStore.exchange_rate || 4100,
        tax_rate: (selectedStore?.enable_tax !== false) ? (selectedStore?.tax_rate || 0) : 0,
      };

      await checkoutOrder(payload);
      clearCart();
      toast.success('Order placed successfully!');

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setTags('');
      setShowCheckoutModal(false);
      setNote('');
      setAddress('');
      setDeliveryFee(0);
      setServiceType('pickup');
      setPaymentMethod('credit');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process order checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex h-full flex-col rounded-none md:rounded-3xl bg-white p-4 md:p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">New Order</h2>
              <p className="text-sm text-muted-foreground">#ORDER-2458</p>
            </div>
            <button
              onClick={() => setShowOrderList(true)}
              className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
            >
              <ClipboardList className="size-4" />
            </button>
          </div>
        </div>

        {/* Order List Modal */}
        <OrderListModal isOpen={showOrderList} onClose={() => setShowOrderList(false)} />

        {/* Cart Items */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {cart.map(item => {
              const variantPrice = item.selectedVariant ? Number(item.selectedVariant.price_modifier) : 0;
              const addonsPrice = item.selectedAddons?.reduce((acc, opt) => acc + Number(opt.price), 0) || 0;
              const modifiersPrice = Object.values(item.selectedModifiers || {}).flat().reduce((acc, curr) => acc + Number(curr.price_adjustment), 0);
              const unitPrice = Number(item.product.base_price) + variantPrice + addonsPrice + modifiersPrice;

              return (
                <motion.div
                  key={item.uuid}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative flex gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2.5 transition-all hover:border-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/5"
                >
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                    <ImageWithFallback
                      src={item.product.image_url || getFlowerImage(item.product.name)}
                      alt={item.product.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-center gap-1.5">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 truncate leading-tight">{item.product.name}</h3>
                        {(item.selectedVariant || (item.selectedAddons && item.selectedAddons.length > 0) || (item.selectedModifiers && Object.keys(item.selectedModifiers).length > 0)) && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {item.selectedVariant && (
                              <span className="text-[10px] font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                {item.selectedVariant.name}
                              </span>
                            )}
                            {item.selectedAddons?.map(opt => (
                              <span key={opt.id} className="text-[10px] font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                {opt.name}
                              </span>
                            ))}
                            {Object.values(item.selectedModifiers || {}).flat().map(opt => (
                              <span key={opt.id} className="text-[10px] font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                {opt.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 ml-2">${(unitPrice * item.quantity).toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-medium text-slate-400">${unitPrice.toFixed(2)} each</span>
                      <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateCartQuantity(item.uuid, item.quantity - 1)}
                          className="size-6 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-brand-primary transition-colors"
                        >
                          <Minus className="size-3" />
                        </motion.button>
                        <span className="font-bold text-slate-900 min-w-[20px] text-center text-xs">{item.quantity}</span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateCartQuantity(item.uuid, item.quantity + 1)}
                          className="size-6 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-brand-primary transition-colors"
                        >
                          <Plus className="size-3" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {cart.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="mb-4 size-16 text-muted-foreground/20" />
              <p className="text-muted-foreground">No items ordered yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-dashed border-border pt-6">
          {/* Customer Details */}
          <div className="mb-6 space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                autoComplete="name"
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Phone Number"
                value={customerPhone}
                autoComplete="tel"
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
            <div className="relative">
              <ScanLine className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Table / Tag (e.g. Table 5)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
          </div>

          {/* Service Type Toggles */}
          <div className="mb-6">
            <div className="flex rounded-xl bg-muted p-1">
              {([
                { id: 'pickup', label: 'Pick Up' },
                { id: 'delivery', label: 'Delivery' },
              ] as const).map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setServiceType(type.id);
                    if (type.id === 'pickup') setDeliveryFee(0);
                  }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${serviceType === type.id
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Delivery Address Input */}
            <AnimatePresence>
              {serviceType === 'delivery' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Enter delivery address..."
                      value={address}
                      autoComplete="shipping street-address"
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10"
                    />
                  </div>
                  <div className="mt-3 relative">
                    <Truck className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      placeholder="Delivery Fee ($)"
                      value={deliveryFee || ''}
                      onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Note */}
          <div className="mb-6">
            {!showNoteInput ? (
              <button
                onClick={() => setShowNoteInput(true)}
                className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary/80"
              >
                <StickyNote className="size-4" />
                Add Note
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">Order Note</label>
                  <button
                    onClick={() => setShowNoteInput(false)}
                    className="text-xs text-brand-primary hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add special instructions..."
                  className="w-full h-20 resize-none rounded-xl border border-border bg-muted/30 p-3 text-sm outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10"
                />
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Sub Total</span>
              <span className="font-medium text-foreground">${subTotal.toFixed(2)}</span>
            </div>
            {selectedStore?.enable_tax !== false && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax ({selectedStore?.tax_rate || 0}%)</span>
                <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
              </div>
            )}
            {serviceType === 'delivery' && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery Fee</span>
                <span className="font-medium text-foreground">${deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-lg font-bold">Total Amount</span>
              <div className="text-right">
                <div className="text-xl font-bold text-foreground">${total.toFixed(2)}</div>
                <div className="text-[10px] font-bold text-muted-foreground">{(total * (selectedStore?.exchange_rate || 4100)).toLocaleString()}៛</div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCheckoutModal(true)}
            disabled={cart.length === 0}
            className="w-full rounded-xl bg-brand-primary py-4 text-lg font-semibold text-white shadow-lg shadow-brand-primary/25 disabled:opacity-50"
          >
            Place Order
          </motion.button>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatedModal isOpen={showCheckoutModal} position={isMobile ? 'bottom' : 'center'} onClose={() => {
        setShowCheckoutModal(false);
        setPaymentStep('select');
        setReceivedAmount('');
      }}>
        <div className={`bg-white shadow-2xl transition-all relative ${isMobile
          ? 'w-screen rounded-t-[2.5rem] py-6 pb-10 max-h-[90vh] overflow-y-auto px-0'
          : 'rounded-[2.5rem] p-8 w-[384px] mx-auto my-auto'
          }`}>
          {paymentStep === 'select' ? (
            <>
              <div className="text-center mb-6 md:mb-8 px-4">
                <div className="mx-auto mb-3 md:mb-4 flex size-12 md:size-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Wallet className="size-6 md:size-8" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">Select Payment</h2>
                <div className="text-slate-500 text-sm font-medium mt-1">
                  Total Amount: <span className="text-slate-900 font-bold">${total.toFixed(2)}</span>
                  <span className="ml-2 text-[10px] md:text-xs opacity-70">/ {(total * (selectedStore?.exchange_rate || 4100)).toLocaleString()}៛</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8 px-2 md:px-4">
                {([
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'credit', label: 'Credit Card', icon: CreditCard },
                  { id: 'pay_later', label: 'Pay Later', icon: Clock },
                  { id: 'qr', label: 'QR Code', icon: ScanLine },
                ] as const).map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id);
                      if (method.id === 'cash') {
                        setPaymentStep('cash');
                      } else {
                        setPaymentStep('select');
                      }
                    }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 md:p-6 transition-all ${paymentMethod === method.id
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary ring-4 ring-brand-primary/10'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 text-slate-500'
                      }`}
                  >
                    <method.icon className="size-5 md:size-6" />
                    <span className="font-bold text-xs md:text-sm">{method.label}</span>
                  </button>
                ))}
              </div>

              <div className="px-2 md:px-4">
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing || !paymentMethod}
                  className="w-full rounded-xl bg-brand-primary py-4 font-bold text-white shadow-lg shadow-brand-primary/25 disabled:opacity-50 hover:bg-brand-primary/90 transition-all active:scale-95"
                >
                  {isProcessing
                    ? 'Processing...'
                    : !paymentMethod
                      ? 'Select Payment Method'
                      : (paymentMethod === 'pay_later' ? 'Confirm & Pay Later' : 'Complete Transaction')}
                </button>
              </div>
            </>
          ) : (
            /* Cash Calculator UI */
            <>
              <div className="mb-4 flex items-center justify-between px-4">
                <button
                  onClick={() => {
                    setPaymentStep('select');
                    setPaymentMethod(null);
                  }}
                  className="text-sm font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1"
                >
                  &larr; Back
                </button>
                <h3 className="font-black uppercase tracking-widest text-xs text-slate-900">Cash Payment</h3>
                <div className="w-12" />
              </div>

              <div className="mb-4 md:mb-6 md:rounded-[2rem] bg-slate-50 p-4 md:p-6 space-y-2 md:space-y-3 border-y md:border border-slate-100">
                <div className="flex justify-between items-center text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Total Due</span>
                  <div className="text-right">
                    <div className="text-slate-900 font-bold">${total.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">{(total * (selectedStore?.exchange_rate || 4100)).toLocaleString()}៛</div>
                  </div>
                </div>
                <div className="flex justify-between items-end border-b border-slate-200 pb-2 md:pb-3">
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Received</span>
                  <span className="text-2xl md:text-3xl font-black text-brand-primary">${receivedAmount || '0'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] md:text-xs font-bold uppercase tracking-widest pt-1">
                  <span className="text-slate-400">Change</span>
                  <div className="text-right">
                    <div className="text-green-600 font-black text-xl md:text-2xl">
                      ${Math.max(0, (parseFloat(receivedAmount || '0') - total)).toFixed(2)}
                    </div>
                    <div className="text-[10px] font-bold text-green-600/70">
                      {(Math.max(0, (parseFloat(receivedAmount || '0') - total)) * (selectedStore?.exchange_rate || 4100)).toLocaleString()}៛
                    </div>
                  </div>
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-1 mb-4 md:mb-6 md:px-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((key) => (
                  <button
                    key={key}
                    onClick={() => setReceivedAmount(prev => prev + key.toString())}
                    className="flex h-14 items-center justify-center bg-slate-50 text-xl font-black hover:bg-slate-100 transition-all border border-slate-100 md:rounded-2xl"
                  >
                    {key}
                  </button>
                ))}
                <button
                  onClick={() => setReceivedAmount(prev => prev.slice(0, -1))}
                  className="flex h-14 items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100 md:rounded-2xl"
                >
                  <Delete className="size-6" />
                </button>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-1 mb-4 md:mb-6 md:px-4">
                {[10, 20, 50, 100].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setReceivedAmount(amt.toString())}
                    className="flex-1 border border-slate-200 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all md:rounded-xl"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 px-2 md:px-4">
                <button
                  onClick={() => setReceivedAmount('')}
                  className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] md:text-xs"
                >
                  Clear
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing || parseFloat(receivedAmount || '0') < total}
                  className="flex-[2] h-12 md:h-14 rounded-xl md:rounded-2xl bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/25 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-[10px] md:text-xs"
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </>
          )}
        </div>
      </AnimatedModal>
    </>
  );
}