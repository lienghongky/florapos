import { request } from './api';
import { InventoryItem, InventoryHistoryLog } from '../types';

/** Service for inventory management, stock adjustments, and history tracking. */
export const inventoryService = {
    getInventory: async (token: string, storeId: string): Promise<InventoryItem[]> => {
        return request<InventoryItem[]>(`/inventory?storeId=${storeId}`, { token });
    },

    getSummary: async (token: string, storeId: string): Promise<any> => {
        return request<any>(`/inventory/summary?storeId=${storeId}`, { token });
    },

    adjustStock: async (token: string, id: string, type: 'set' | 'increase' | 'decrease', quantity: number, reason: string): Promise<InventoryItem> => {
        return request<InventoryItem>(`/inventory/${id}/adjust`, {
            method: 'PATCH',
            token,
            body: JSON.stringify({ type, quantity, reason }),
        });
    },

    getHistory: async (token: string, id: string): Promise<InventoryHistoryLog[]> => {
        const data = await request<any[]>(`/inventory/${id}/history`, { token });
        return data.map(item => ({
            id: item.id,
            store_id: item.store_id,
            inventory_item_id: item.inventory_item_id,
            action: item.action_type,
            quantityChange: Number(item.quantity_change),
            previousStock: Number(item.quantity_before),
            newStock: Number(item.quantity_after),
            date: item.timestamp,
            userName: item.user?.full_name || 'System',
            userRole: item.user?.role,
            referenceId: item.reference_id,
            note: item.notes,
            item: item.item ? { name: item.item.name } : undefined
        }));
    },
    
    getGlobalHistory: async (token: string, storeId: string, filters: any = {}): Promise<InventoryHistoryLog[]> => {
        const params = new URLSearchParams({ storeId });
        if (filters.actionType && filters.actionType !== 'all') params.append('action_type', filters.actionType);
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        
        const data = await request<any[]>(`/inventory/history?${params.toString()}`, { token });
        return data.map(item => ({
            id: item.id,
            store_id: item.store_id,
            inventory_item_id: item.inventory_item_id,
            action: item.action_type,
            quantityChange: Number(item.quantity_change),
            previousStock: Number(item.quantity_before),
            newStock: Number(item.quantity_after),
            date: item.timestamp,
            userName: item.user?.full_name || 'System',
            userRole: item.user?.role,
            referenceId: item.reference_id,
            note: item.notes,
            item: item.item ? { name: item.item.name } : undefined
        }));
    },
    
    findItemByCode: async (token: string, storeId: string, code: string): Promise<InventoryItem> => {
        return request<InventoryItem>(`/inventory/find?storeId=${storeId}&code=${code}`, { token });
    },

    deleteInventoryItem: async (token: string, id: string): Promise<void> => {
        return request<void>(`/inventory/${id}`, {
            method: 'DELETE',
            token,
        });
    }
};
