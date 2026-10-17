import { create } from 'zustand';
import { InventoryItem, InventoryHistoryLog } from '../types';
import { inventoryService } from '../services/inventory.service';
import { useAuthStore } from './auth-store';
import { useProductStore } from './product-store';

interface InventoryState {
  inventoryItems: InventoryItem[];
  refreshInventory: () => Promise<void>;
  getInventoryHistory: (id: string) => Promise<InventoryHistoryLog[]>;
  getGlobalHistory: (filters?: any) => Promise<InventoryHistoryLog[]>;
  findInventoryItemByCode: (code: string) => Promise<InventoryItem | null>;
  adjustInventoryStock: (id: string, type: 'set' | 'increase' | 'decrease', quantity: number, reason: string) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  inventoryItems: [],

  refreshInventory: async () => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    try {
      const fetchedInventory = await inventoryService.getInventory(token, selectedStore.id);
      set({ inventoryItems: fetchedInventory });
    } catch (e) {
      console.error("Failed to fetch inventory", e);
    }
  },

  getInventoryHistory: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return [];
    try {
      return await inventoryService.getHistory(token, id);
    } catch (e) {
      console.error("Failed to fetch history", e);
      return [];
    }
  },

  getGlobalHistory: async (filters = {}) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return [];
    try {
      return await inventoryService.getGlobalHistory(token, selectedStore.id, filters);
    } catch (e) {
      console.error("Failed to fetch global history", e);
      return [];
    }
  },

  findInventoryItemByCode: async (code) => {
    const raw = (code || '').trim();
    if (!raw) return null;
    const clean = raw.toLowerCase();

    // 1. Check local loaded inventory items first
    const items = get().inventoryItems;
    const localMatch = items.find(i =>
      (i.barcode && i.barcode.toLowerCase() === clean) ||
      (i.sku && i.sku.toLowerCase() === clean) ||
      (i.name && i.name.toLowerCase() === clean) ||
      (i.id && i.id.toLowerCase() === clean)
    );
    if (localMatch) return localMatch;

    // 2. Query backend API /inventory/find
    const { token, selectedStore } = useAuthStore.getState();
    if (token && selectedStore) {
      try {
        const item = await inventoryService.findItemByCode(token, selectedStore.id, raw);
        if (item) return item;
      } catch (e) {
        // Fallback to product-based search below
      }
    }

    // 3. Fallback: match via products (if barcode/SKU belongs to a product linked to inventory item)
    const product = useProductStore.getState().products.find(p =>
      (p.barcode && p.barcode.toLowerCase() === clean) ||
      (p.sku && p.sku.toLowerCase() === clean) ||
      (p.name && p.name.toLowerCase() === clean) ||
      (p.variants || []).some(v => (v.barcode && v.barcode.toLowerCase() === clean) || (v.sku && v.sku.toLowerCase() === clean))
    );

    if (product) {
      const matched = items.find(i =>
        i.name.toLowerCase() === product.name.toLowerCase() ||
        (product.inventoryItemId && i.id === product.inventoryItemId) ||
        (product.recipe && product.recipe.some((r: any) => r.inventory_item_id === i.id))
      );
      if (matched) return matched;
    }

    return null;
  },

  adjustInventoryStock: async (id, type, quantity, reason) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await inventoryService.adjustStock(token, id, type, quantity, reason);
    await get().refreshInventory();
    await useProductStore.getState().refreshProducts();
  },

  deleteInventoryItem: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await inventoryService.deleteInventoryItem(token, id);
    await get().refreshInventory();
    await useProductStore.getState().refreshProducts();
  },
}));
