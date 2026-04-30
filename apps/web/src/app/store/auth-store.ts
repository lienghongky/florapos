import { create } from 'zustand';
import { User, Store } from '../types';
import { request } from '../services/api';
import { storesService } from '../services/stores.service';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  stores: Store[];
  selectedStore: Store | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
  refreshStores: (explicitToken?: string) => Promise<void>;
  setSelectedStore: (store: Store) => void;
  updateStoreInfo: (storeId: string, data: any) => Promise<void>;
  uploadStoreBanner: (storeId: string, file: File) => Promise<void>;
  uploadStoreLogo: (storeId: string, file: File) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: true,
  stores: [],
  selectedStore: null,

  login: async (email, password) => {
    try {
      const data = await request<{ access_token: string, user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      localStorage.setItem('auth_token', data.access_token);
      const user: User = { ...data.user, name: data.user.full_name || data.user.name || data.user.email };
      
      set({ token: data.access_token, user });
      
      await get().refreshStores(data.access_token);
    } catch (error) {
      throw error;
    }
  },

  register: async (data) => {
    await request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_page');
    set({ token: null, user: null, stores: [], selectedStore: null });
  },

  refreshStores: async (explicitToken) => {
    const activeToken = explicitToken || get().token;
    if (!activeToken) return;
    try {
      const fetchedStores = await storesService.getStores(activeToken);
      set({ stores: fetchedStores });
      
      const currentSelected = get().selectedStore;
      if (fetchedStores.length > 0) {
        // Always try to find the current selected store in the new list to update its data (e.g. tax_rate)
        const updatedSelected = currentSelected 
          ? fetchedStores.find(s => s.id === currentSelected.id) 
          : fetchedStores[0];
        
        if (updatedSelected) {
          set({ selectedStore: updatedSelected });
        } else {
          // Fallback to first store if current one is not in the list anymore
          set({ selectedStore: fetchedStores[0] });
        }
      } else {
        set({ selectedStore: null });
      }
    } catch (e) {
      console.error("Failed to fetch stores", e);
    }
  },

  setSelectedStore: (store) => set({ selectedStore: store }),

  updateStoreInfo: async (storeId, data) => {
    const { token } = get();
    if (!token) return;
    try {
      const updatedStore = await storesService.updateStore(token, storeId, data);
      
      // Update state immediately with the returned data
      set(state => ({
        stores: state.stores.map(s => s.id === storeId ? updatedStore : s),
        selectedStore: state.selectedStore?.id === storeId ? updatedStore : state.selectedStore
      }));
      
      // Optional: still refresh all stores to ensure consistency
      await get().refreshStores();
    } catch (e) {
      throw e;
    }
  },

  uploadStoreBanner: async (storeId, file) => {
    const { token } = get();
    if (!token) return;
    const updatedStore = await storesService.uploadBanner(token, storeId, file);
    set(state => ({
      stores: state.stores.map(s => s.id === storeId ? updatedStore : s),
      selectedStore: state.selectedStore?.id === storeId ? updatedStore : state.selectedStore
    }));
    await get().refreshStores();
  },

  uploadStoreLogo: async (storeId, file) => {
    const { token } = get();
    if (!token) return;
    const updatedStore = await storesService.uploadLogo(token, storeId, file);
    set(state => ({
      stores: state.stores.map(s => s.id === storeId ? updatedStore : s),
      selectedStore: state.selectedStore?.id === storeId ? updatedStore : state.selectedStore
    }));
    await get().refreshStores();
  },

  changePassword: async (oldPass, newPass) => {
    const { token } = get();
    if (!token) return;
    await request('/auth/change-password', {
      method: 'POST',
      token,
      body: JSON.stringify({ old_password: oldPass, new_password: newPass })
    });
  },

  initAuth: async () => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      try {
        const userData = await request<User>('/auth/profile', { token: storedToken });
        const hydratedUser = { ...userData, name: userData.full_name || userData.name || userData.email };
        
        set({ user: hydratedUser, token: storedToken });
        await get().refreshStores(storedToken);
      } catch (error) {
        get().logout();
      }
    }
    set({ isLoading: false });
  },
}));
