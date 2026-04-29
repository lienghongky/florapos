import { create } from 'zustand';
import { Product, ProductVariant, Addon, CartItem, ModifierOption } from '../types';

interface CartState {
  cart: CartItem[];
  addToCart: (
    product: Product, 
    selectedVariant?: ProductVariant, 
    selectedAddons?: Addon[], 
    quantity?: number,
    selectedModifiers?: { [groupId: string]: ModifierOption[] }
  ) => void;
  removeFromCart: (cartUuid: string) => void;
  updateCartQuantity: (cartUuid: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  addToCart: (product, selectedVariant, selectedAddons = [], quantity = 1, selectedModifiers = {}) => {
    const addonsMatch = (opts1: Addon[] = [], opts2: Addon[] = []) => {
      if (opts1.length !== opts2.length) return false;
      const sorted1 = [...opts1].sort((a, b) => a.id.localeCompare(b.id));
      const sorted2 = [...opts2].sort((a, b) => a.id.localeCompare(b.id));
      return sorted1.every((opt, i) => opt.id === sorted2[i].id);
    };

    const modifiersMatch = (mods1: { [key: string]: ModifierOption[] } = {}, mods2: { [key: string]: ModifierOption[] } = {}) => {
        const keys1 = Object.keys(mods1).sort();
        const keys2 = Object.keys(mods2).sort();
        if (keys1.length !== keys2.length) return false;
        if (!keys1.every((k, i) => k === keys2[i])) return false;

        return keys1.every(key => {
            const list1 = mods1[key].sort((a, b) => a.id!.localeCompare(b.id!));
            const list2 = mods2[key].sort((a, b) => a.id!.localeCompare(b.id!));
            if (list1.length !== list2.length) return false;
            return list1.every((opt, i) => opt.id === list2[i].id);
        });
    };

    const { cart } = get();
    const existingItem = cart.find(item =>
      item.product.id === product.id && 
      item.selectedVariant?.id === selectedVariant?.id &&
      addonsMatch(item.selectedAddons, selectedAddons) &&
      modifiersMatch(item.selectedModifiers, selectedModifiers)
    );

    if (existingItem) {
      get().updateCartQuantity(existingItem.uuid, existingItem.quantity + quantity);
    } else {
      set({
        cart: [...cart, {
          uuid: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          product, quantity, selectedVariant, selectedAddons, selectedModifiers
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
