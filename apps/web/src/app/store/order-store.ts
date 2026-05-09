import { create } from 'zustand';
import { Order, OrderStatus } from '../types';
import { ordersService } from '../services/orders.service';
import { useAuthStore } from './auth-store';
import { useCartStore } from './cart-store';
import { useInventoryStore } from './inventory-store';

interface OrderState {
  orders: Order[];
  totalOrders: number;
  isOrdersLoading: boolean;
  stats: any | null;
  recentOrders: Order[];
  isDashboardLoading: boolean;
  refreshOrders: (filters?: any) => Promise<void>;
  refreshDashboardData: () => Promise<void>;
  checkoutOrder: (payload: any) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updateOrderPayment: (id: string, paymentStatus: string, paymentMethod?: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  totalOrders: 0,
  isOrdersLoading: false,
  stats: null,
  recentOrders: [],
  isDashboardLoading: false,

  refreshOrders: async (filters = {}) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    set({ isOrdersLoading: true });
    try {
      let fetchedOrders;
      if (typeof filters === 'object') {
        const { status, startDate, endDate, search, page, limit } = filters;
        fetchedOrders = await ordersService.getOrders(token, selectedStore.id, status, startDate, endDate, search, page, limit);
      } else {
        fetchedOrders = await ordersService.getOrders(token, { ...filters, store_id: selectedStore.id });
      }
      
      const items = (fetchedOrders && fetchedOrders.items) ? fetchedOrders.items : (fetchedOrders || []);
      const count = (fetchedOrders && typeof fetchedOrders.count === 'number') ? fetchedOrders.count : items.length;
      
      set({ orders: items, totalOrders: count });
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      set({ isOrdersLoading: false });
    }
  },

  refreshDashboardData: async () => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    
    set({ isDashboardLoading: true });
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];

      const [statsData, recentData] = await Promise.all([
        ordersService.getStats(token, selectedStore.id, startOfMonth, today),
        ordersService.getRecentOrders(token, selectedStore.id, 5)
      ]);
      set({ stats: statsData, recentOrders: recentData });
    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
    } finally {
      set({ isDashboardLoading: false });
    }
  },

  checkoutOrder: async (payload) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    try {
      await ordersService.createOrder(token, { ...payload, store_id: selectedStore.id });
      useCartStore.getState().clearCart();
      await get().refreshOrders();
      await useInventoryStore.getState().refreshInventory();
    } catch (e) {
      throw e;
    }
  },

  updateOrderStatus: async (id, status) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    try {
      await ordersService.updateOrderStatus(token, id, status);
      set((state) => ({
        orders: state.orders.map(order => order.id === id ? { ...order, status } : order)
      }));
    } catch (e) {
      console.error('Failed to update order status');
    }
  },

  updateOrderPayment: async (id, paymentStatus, paymentMethod) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    try {
      const updatedOrder = await ordersService.updatePayment(token, id, paymentStatus, paymentMethod);
      set((state) => ({
        orders: state.orders.map(order => order.id === id ? updatedOrder : order)
      }));
    } catch (e) {
      throw e;
    }
  },
}));
