import { motion, AnimatePresence } from 'motion/react';
import { Minus, Plus, X, CreditCard, Banknote, Flower2, ShoppingBag, Truck, Edit2, ScanLine, Wallet, MapPin, StickyNote, Ticket, Delete, Calculator, CornerDownLeft, ClipboardList } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { useState } from 'react';
import { AnimatedModal } from '../motion/AnimatedPage';
import { toast } from 'sonner';
import { OrderListModal } from './OrderListModal';

export function CartPanel() {
  const { cart, updateCartQuantity, removeFromCart, clearCart, addSale, user } = useApp();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrderList, setShowOrderList] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'cash'>('credit');
  const [serviceType, setServiceType] = useState<'pick-up' | 'delivery'>('pick-up');
  const [deliveryFee, setDeliveryFee] = useState(0); // New State
  const [paymentStep, setPaymentStep] = useState<'select' | 'cash'>('select');
  const [receivedAmount, setReceivedAmount] = useState('');

  // New state for Note and Address
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [address, setAddress] = useState('');

  // Discount State
  const [discountCode, setDiscountCode] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const MOCK_COUPONS = [
    { code: 'SAVE10', type: 'percent', value: 10, label: '10% Off' },
    { code: 'MINUS5', type: 'amount', value: 5, label: '$5.00 Off' },
    { code: 'FLOWERPOWER', type: 'percent', value: 20, label: '20% Summer Sale' },
  ];

  type Coupon = typeof MOCK_COUPONS[0];

  const subTotal = cart.reduce((sum, item) => {
    const optionsPrice = item.selectedOptions?.reduce((acc, opt) => acc + opt.price, 0) || 0;
    return sum + (item.product.price + optionsPrice) * item.quantity;
  }, 0);

  // Calculate discount
  let discountAmount = 0;
  if (selectedCoupon) {
    if (selectedCoupon.type === 'percent') {
      discountAmount = subTotal * (selectedCoupon.value / 100);
    } else {
      discountAmount = selectedCoupon.value;
    }
  }


  const tax = (subTotal - discountAmount) * 0.05;
  const total = Math.max(0, subTotal - discountAmount + tax + (serviceType === 'delivery' ? deliveryFee : 0));

  const handleCheckout = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const paymentMethodMap = {
      credit: 'Credit Card',
      debit: 'Debit Card',
      cash: 'Cash'
    };

    addSale({
      items: cart,
      total,
      paymentMethod: paymentMethodMap[paymentMethod],
      salesPerson: user?.name || 'Unknown',
    });

    clearCart();
    setIsProcessing(false);
    setShowCheckout(false);
    toast.success('Order placed successfully!');
  };

  return (
    <>
      <div className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-sm">
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

        {/* Render Modal */}
        <OrderListModal isOpen={showOrderList} onClose={() => setShowOrderList(false)} />

        {/* Cart items */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {cart.map(item => {
              const optionsPrice = item.selectedOptions?.reduce((acc, opt) => acc + opt.price, 0) || 0;
              const unitPrice = item.product.price + optionsPrice;

              return (
                <motion.div
                  key={item.uuid}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex gap-4 rounded-xl border border-border p-3"
                >
                  {/* Product Image (Mock) */}
                  <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={`https://images.unsplash.com/photo-1520763185298-1b434c919102?w=80&h=80&fit=crop`}
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{item.product.name}</h3>
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.selectedOptions.map(opt => (
                              <span key={opt.optionId} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {opt.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-brand-primary">${(unitPrice * item.quantity).toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                      <span>${unitPrice.toFixed(2)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateCartQuantity(item.uuid, item.quantity - 1)}
                          className="size-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="font-medium text-foreground w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.uuid, item.quantity + 1)}
                          className="size-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Plus className="size-3" />
                        </button>
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

          {/* Service Type Toggles */}
          <div className="mb-6">
            <div className="flex rounded-xl bg-muted p-1">
              {[
                { id: 'pick-up', label: 'Pick Up' },
                { id: 'delivery', label: 'Delivery' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setServiceType(type.id as any);
                    if (type.id === 'pick-up') setDeliveryFee(0); // Reset fee on pickup
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

          {/* Discount & Coupons */}
          <div className="mb-6 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Ticket className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-2 text-sm outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10"
                />
              </div>
              <div className="relative">
                <select
                  onChange={(e) => {
                    const coupon = MOCK_COUPONS.find(c => c.code === e.target.value);
                    setSelectedCoupon(coupon || null);
                    if (coupon) setDiscountCode(coupon.code);
                  }}
                  className="h-full rounded-xl border border-border bg-muted/50 px-3 text-sm font-medium outline-none focus:border-brand-primary/50"
                  value={selectedCoupon?.code || ''}
                >
                  <option value="">Select Coupon</option>
                  {MOCK_COUPONS.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Sub Total</span>
              <span className="font-medium text-foreground">${subTotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({selectedCoupon?.code})</span>
                <span className="font-medium">-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax (5%)</span>
              <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
            </div>

            {serviceType === 'delivery' && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery Fee</span>
                <span className="font-medium text-foreground">${deliveryFee.toFixed(2)}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-lg font-bold">Total Amount</span>
              <span className="text-xl font-bold text-foreground">${total.toFixed(2)}</span>
            </div>
          </div>



          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className="w-full rounded-xl bg-brand-primary py-4 text-lg font-semibold text-white shadow-lg shadow-brand-primary/25 disabled:opacity-50"
          >
            Place Order
          </motion.button>
        </div>
      </div>

      {/* Checkout Modal (Simplified Reuse) */}
      {/* Checkout Modal */}
      {/* Checkout Modal */}
      <AnimatedModal isOpen={showCheckout} onClose={() => {
        setShowCheckout(false);
        setPaymentStep('select');
        setReceivedAmount('');
      }}>
        <div className="rounded-3xl bg-white p-6 shadow-xl w-[400px]">
          {paymentStep === 'select' ? (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Wallet className="size-6" />
                </div>
                <h3 className="text-xl font-bold">Select Payment</h3>
                <p className="text-muted-foreground">Total: <span className="text-foreground font-bold">${total.toFixed(2)}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'credit', label: 'Credit Card', icon: CreditCard },
                  { id: 'debit', label: 'Debit Card', icon: CreditCard },
                  { id: 'qr', label: 'QR Code', icon: ScanLine },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id as any);
                      if (method.id === 'cash') {
                        setPaymentStep('cash');
                      }
                    }}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${paymentMethod === method.id
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary ring-2 ring-brand-primary/20'
                      : 'border-border hover:bg-muted/50'
                      }`}
                  >
                    <method.icon className="size-6" />
                    <span className="font-medium text-sm">{method.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full rounded-xl bg-brand-primary py-3.5 font-bold text-white shadow-lg shadow-brand-primary/25 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </>
          ) : (
            // Cash Calculator UI
            <>
              <div className="mb-4 flex items-center justify-between">
                <button onClick={() => setPaymentStep('select')} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  &larr; Back
                </button>
                <h3 className="font-bold">Cash Payment</h3>
                <div className="w-8" />
              </div>

              <div className="mb-4 rounded-2xl bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Due</span>
                  <span className="font-bold">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end border-b border-border/50 pb-2">
                  <span className="text-sm text-muted-foreground">Received</span>
                  <span className="text-2xl font-bold text-brand-primary">${receivedAmount || '0'}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-muted-foreground">Change</span>
                  <span className="font-bold text-green-600">
                    ${Math.max(0, (parseFloat(receivedAmount || '0') - total)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((key) => (
                  <button
                    key={key}
                    onClick={() => setReceivedAmount(prev => prev + key.toString())}
                    className="flex h-12 items-center justify-center rounded-xl bg-muted/50 text-lg font-bold hover:bg-muted transition-colors"
                  >
                    {key}
                  </button>
                ))}
                <button
                  onClick={() => setReceivedAmount(prev => prev.slice(0, -1))}
                  className="flex h-12 items-center justify-center rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                >
                  <Delete className="size-5" />
                </button>
              </div>

              {/* Proposed amounts */}
              <div className="flex gap-2 mb-4">
                {[10, 20, 50, 100].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setReceivedAmount(amt.toString())}
                    className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold hover:bg-muted"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setReceivedAmount('')}
                  className="flex-1 rounded-xl border border-border py-3.5 font-bold text-muted-foreground hover:bg-muted"
                >
                  Clear
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing || parseFloat(receivedAmount || '0') < total}
                  className="flex-[2] rounded-xl bg-brand-primary py-3.5 font-bold text-white shadow-lg shadow-brand-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing' : 'Confirm Pay'}
                </button>
              </div>
            </>
          )}
        </div>
      </AnimatedModal>
    </>
  );
}