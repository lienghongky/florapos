import { create } from 'zustand';
import { Product, ProductVariant, Addon, CartItem } from '../types';

interface CartState {
  cart: CartItem[];
  addToCart: (product: Product, selectedVariant?: ProductVariant, selectedAddons?: Addon[], quantity?: number) => void;
  removeFromCart: (cartUuid: string) => void;
  updateCartQuantity: (cartUuid: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  addToCart: (product, selectedVariant, selectedAddons = [], quantity = 1) => {
    const addonsMatch = (opts1: Addon[] = [], opts2: Addon[] = []) => {
      if (opts1.length !== opts2.length) return false;
      const sorted1 = [...opts1].sort((a, b) => a.id.localeCompare(b.id));
      const sorted2 = [...opts2].sort((a, b) => a.id.localeCompare(b.id));
      return sorted1.every((opt, i) => opt.id === sorted2[i].id);
    };

    const { cart } = get();
    const existingItem = cart.find(item =>
      item.product.id === product.id && 
      item.selectedVariant?.id === selectedVariant?.id &&
      addonsMatch(item.selectedAddons, selectedAddons)
    );

    if (existingItem) {
      get().updateCartQuantity(existingItem.uuid, existingItem.quantity + quantity);
    } else {
      set({
        cart: [...cart, {
          uuid: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          product, quantity, selectedVariant, selectedAddons
        }]
      });
    }
  },

  removeFromCart: (cartUuid) => set((state) => ({
    cart: state.cart.filter(item => item.uuid !== cartUuid)
  })),

  updateCartQuantity: (cartUuid, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(cartUuid);
    } else {
      set((state) => ({
        cart: state.cart.map(item => item.uuid === cartUuid ? { ...item, quantity } : item)
      }));
    }
  },

  clearCart: () => set({ cart: [] }),
}));
