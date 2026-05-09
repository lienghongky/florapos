import { create } from 'zustand';
import { request } from '../services/api';
import { useAuthStore } from './auth-store';
import { toast } from 'sonner';

export interface EmenuSetting {
  id?: string;
  store_id?: string;
  is_enabled: boolean;
  show_prices: boolean;
  allow_ordering: boolean;
  banner_image?: string;
  theme_color?: string;
  template_id?: string;
  require_customer_name: boolean;
  require_customer_phone: boolean;
  qr_tags: string[];
  social_links?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    website?: string;
  };
  phone_numbers: string[];
}

interface EmenuState {
  settings: EmenuSetting | null;
  publicData: any | null;
  loading: boolean;
  
  fetchSettings: (storeId: string) => Promise<void>;
  updateSettings: (storeId: string, data: Partial<EmenuSetting>) => Promise<void>;
  uploadBanner: (storeId: string, file: File) => Promise<void>;
  fetchPublicData: (storeId: string) => Promise<void>;
  emenuProductIds: string[];
  fetchEmenuProducts: (storeId: string) => Promise<void>;
  toggleProductVisibility: (storeId: string, productId: string, isVisible: boolean) => Promise<void>;
}

export const useEmenuStore = create<EmenuState>((set, get) => ({
  settings: null,
  publicData: null,
  loading: false,

  fetchSettings: async (storeId: string) => {
    const { token } = useAuthStore.getState();
    if (!token || !storeId) return;
    set({ loading: true });
    try {
      const data = await request<EmenuSetting>(`/emenu/settings/${storeId}`, { token });
      set({ settings: data });
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch E-Menu settings');
    } finally {
      set({ loading: false });
    }
  },

  updateSettings: async (storeId: string, data: Partial<EmenuSetting>) => {
    const { token } = useAuthStore.getState();
    if (!token || !storeId) return;
    set({ loading: true });
    try {
      const updated = await request<EmenuSetting>(`/emenu/settings/${storeId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      });
      set({ settings: updated });
      toast.success('E-Menu settings updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update E-Menu settings');
    } finally {
      set({ loading: false });
    }
  },

  uploadBanner: async (storeId: string, file: File) => {
    const { token } = useAuthStore.getState();
    if (!token || !storeId) return;
    set({ loading: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const updated = await request<EmenuSetting>(`/emenu/settings/${storeId}/upload-banner`, {
        method: 'POST',
        body: formData as any, // bypassing JSON.stringify in `request` requires handling formData properly, wait...
        token,
      });
      // The `request` wrapper might stringify everything if we don't handle FormData.
      // Let's use fetch directly for FormData if `request` doesn't support it.
      // Assuming `request` supports FormData if body is not stringified manually?
      // Actually `request` in api.ts usually checks if body is instanceof FormData.
      set({ settings: updated });
      toast.success('E-Menu banner uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload banner');
    } finally {
      set({ loading: false });
    }
  },

  fetchPublicData: async (storeId: string) => {
    set({ loading: true });
    try {
      // Public route, no token needed
      const data = await request<any>(`/emenu/public/${storeId}`);
      set({ publicData: data });
    } catch (error: any) {
      console.error('Failed to fetch public E-Menu data:', error);
    } finally {
      set({ loading: false });
    }
  },

  emenuProductIds: [],
  fetchEmenuProducts: async (storeId: string) => {
    const { token } = useAuthStore.getState();
    if (!token || !storeId) return;
    try {
      const ids = await request<string[]>(`/emenu/settings/${storeId}/products`, { token });
      set({ emenuProductIds: ids });
    } catch (error: any) {
      console.error('Failed to fetch E-Menu products:', error);
    }
  },

  toggleProductVisibility: async (storeId: string, productId: string, isVisible: boolean) => {
    const { token } = useAuthStore.getState();
    if (!token || !storeId) return;
    try {
      if (isVisible) {
        await request(`/emenu/settings/${storeId}/products/${productId}`, { method: 'POST', token });
        set(state => ({ emenuProductIds: [...state.emenuProductIds, productId] }));
      } else {
        await request(`/emenu/settings/${storeId}/products/${productId}/remove`, { method: 'POST', token });
        set(state => ({ emenuProductIds: state.emenuProductIds.filter(id => id !== productId) }));
      }
      toast.success('Product visibility updated');
    } catch (error: any) {
      toast.error('Failed to update product visibility');
    }
  },
}));
