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
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return null;
    try {
      return await inventoryService.findItemByCode(token, selectedStore.id, code);
    } catch (e) {
      return null;
    }
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
