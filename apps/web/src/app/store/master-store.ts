import { create } from 'zustand';
import { request } from '../services/api';
import { useAuthStore } from './auth-store';
import { storesService } from '../services/stores.service';
import { toast } from 'sonner';

interface MasterState {
  masterStats: { totalOwners: number, totalStores: number, totalStaff: number, totalTelegramLinks: number } | null;
  owners: any[];
  globalStores: any[];
  globalStaff: any[];
  saasPayments: any[];
  telegramAccounts: any[];
  subscriptions: any[];
  plans: any[];
  
  refreshMasterData: () => Promise<void>;
  refreshGlobalStores: () => Promise<void>;
  refreshGlobalStaff: () => Promise<void>;
  refreshSaaSPayments: () => Promise<void>;
  refreshTelegramAccounts: () => Promise<void>;
  refreshSubscriptions: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  
  toggleUserActive: (id: string) => Promise<void>;
  deleteGlobalUser: (id: string) => Promise<void>;
  resetOwnerPassword: (id: string, newPassword: string) => Promise<void>;
  inviteOwner: (data: any) => Promise<void>;
  createStoreForOwner: (ownerId: string, storeData: { name: string, currency: string }) => Promise<void>;
  getOwnerStaff: (ownerId: string) => Promise<any[]>;
  updateGlobalStore: (storeId: string, data: any) => Promise<void>;
  transferStoreOwnership: (storeId: string, newOwnerId: string) => Promise<void>;
  recordSaaSPayment: (data: any) => Promise<void>;
  fetchOwnerPayments: (ownerId: string) => Promise<any[]>;
  uploadStoreBanner: (storeId: string, file: File) => Promise<void>;
  uploadStoreLogo: (storeId: string, file: File) => Promise<void>;
  disconnectTelegramAccount: (id: string) => Promise<void>;
  toggleTelegramAccount: (id: string) => Promise<void>;
  updateSubscription: (userId: string, data: any) => Promise<void>;
  getSystemSetting: (key: string) => Promise<string>;
  setSystemSetting: (key: string, value: string) => Promise<void>;
}

export const useMasterStore = create<MasterState>((set, get) => ({
  masterStats: null,
  owners: [],
  globalStores: [],
  globalStaff: [],
  saasPayments: [],
  telegramAccounts: [],
  subscriptions: [],
  plans: [],

  refreshMasterData: async () => {
    const { token, user } = useAuthStore.getState();
    if (!token || user?.role !== 'master') return;
    try {
      const stats = await request<any>('/master/stats', { token });
      const ownersList = await request<any[]>('/master/owners', { token });
      set({ masterStats: stats, owners: ownersList });
    } catch (e) {
      console.error("Failed to refresh master data", e);
    }
  },

  refreshGlobalStores: async () => {
    const { token, user } = useAuthStore.getState();
    if (!token || user?.role !== 'master') return;
    try {
      const storesList = await request<any[]>('/master/stores', { token });
      set({ globalStores: storesList });
    } catch (e) {
      console.error("Failed to fetch global stores", e);
    }
  },

  refreshGlobalStaff: async () => {
    const { token, user } = useAuthStore.getState();
    if (!token || user?.role !== 'master') return;
    try {
      const staffList = await request<any[]>('/master/staff', { token });
      set({ globalStaff: staffList });
    } catch (e) {
      console.error("Failed to fetch global staff", e);
    }
  },

  refreshSaaSPayments: async () => {
    const { token, user } = useAuthStore.getState();
    if (!token || user?.role !== 'master') return;
    try {
      const paymentsList = await request<any[]>('/master/payments', { token });
      set({ saasPayments: paymentsList });
    } catch (e) {
      console.error("Failed to fetch saas payments", e);
    }
  },

  refreshTelegramAccounts: async () => {
    const { token, user } = useAuthStore.getState();
    if (!token || user?.role !== 'master') return;
    try {
      const accounts = await request<any[]>('/master/telegram/accounts', { token });
      set({ telegramAccounts: accounts });
    } catch (e) {
      console.error("Failed to fetch telegram accounts", e);
    }
  },

  toggleUserActive: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await request(`/master/users/${id}/toggle-active`, { method: 'PATCH', token });
    await get().refreshMasterData();
  },

  deleteGlobalUser: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await request(`/master/users/${id}`, { method: 'DELETE', token });
    await get().refreshMasterData();
  },

  resetOwnerPassword: async (id, newPassword) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await request(`/master/users/${id}/password`, { 
      method: 'PATCH', 
      body: JSON.stringify({ password: newPassword }), 
      token 
    });
    toast.success('Password updated successfully');
  },

  inviteOwner: async (data) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await request('/master/owners', { method: 'POST', body: JSON.stringify(data), token });
    await get().refreshMasterData();
  },

  createStoreForOwner: async (ownerId, storeData) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await request(`/master/owners/${ownerId}/stores`, { method: 'POST', body: JSON.stringify(storeData), token });
    await get().refreshMasterData();
  },

  getOwnerStaff: async (ownerId) => {
    const { token } = useAuthStore.getState();
    if (!token) return [];
    return await request<any[]>(`/master/owners/${ownerId}/staff`, { token });
  },

  updateGlobalStore: async (storeId, data) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await request(`/master/stores/${storeId}`, { method: 'PATCH', body: JSON.stringify(data), token });
    await get().refreshGlobalStores();
  },

  transferStoreOwnership: async (storeId, newOwnerId) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await request(`/master/stores/${storeId}/transfer`, { method: 'POST', body: JSON.stringify({ newOwnerId }), token });
    await get().refreshGlobalStores();
    await get().refreshMasterData();
  },

  recordSaaSPayment: async (data) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await request('/master/payments', { method: 'POST', body: JSON.stringify(data), token });
    await get().refreshSaaSPayments();
  },

  fetchOwnerPayments: async (ownerId) => {
    const { token } = useAuthStore.getState();
    if (!token) return [];
    return await request<any[]>(`/master/owners/${ownerId}/payments`, { token });
  },

  uploadStoreBanner: async (storeId, file) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await storesService.uploadBanner(token, storeId, file);
  },

  uploadStoreLogo: async (storeId, file) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await storesService.uploadLogo(token, storeId, file);
  },

  disconnectTelegramAccount: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    try {
      await request(`/master/telegram/accounts/${id}`, { method: 'DELETE', token });
      toast.success('Telegram account disconnected');
      await get().refreshTelegramAccounts();
      await get().refreshMasterData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to disconnect telegram account');
    }
  },

  toggleTelegramAccount: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    try {
      await request(`/master/telegram/accounts/${id}/toggle`, { method: 'PATCH', token });
      toast.success('Telegram account status updated');
      await get().refreshTelegramAccounts();
    } catch (e: any) {
      toast.error(e.message || 'Failed to toggle telegram account');
    }
  },

  refreshSubscriptions: async () => {
    const { token, user } = useAuthStore.getState();
    if (!token || user?.role !== 'master') return;
    try {
      const data = await request<any[]>('/master/subscriptions', { token });
      set({ subscriptions: data });
    } catch (e) {
      console.error("Failed to refresh subscriptions", e);
    }
  },

  refreshPlans: async () => {
    const { token, user } = useAuthStore.getState();
    if (!token || user?.role !== 'master') return;
    try {
      const data = await request<any[]>('/master/plans', { token });
      set({ plans: data });
    } catch (e) {
      console.error("Failed to refresh plans", e);
    }
  },

  updateSubscription: async (userId, data) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    try {
      await request(`/master/subscriptions/${userId}`, { 
        method: 'PATCH', 
        body: JSON.stringify(data), 
        token 
      });
      toast.success('Subscription updated');
      await get().refreshSubscriptions();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update subscription');
    }
  },

  getSystemSetting: async (key) => {
    const { token } = useAuthStore.getState();
    if (!token) return '';
    try {
      return await request<string>(`/master/settings/${key}`, { token });
    } catch {
      return '';
    }
  },

  setSystemSetting: async (key, value) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    try {
      await request('/master/settings', { 
        method: 'POST', 
        body: JSON.stringify({ key, value }), 
        token 
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to update system setting');
    }
  },
}));
