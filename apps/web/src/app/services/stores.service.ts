import { request } from './api';
import { Store } from '../types';

/** Service for store CRUD, banner/logo uploads. */
export const storesService = {
    getStores: async (token: string): Promise<Store[]> => {
        return request<Store[]>('/stores', { token });
    },

    createStore: async (token: string, name: string): Promise<Store> => {
        return request<Store>('/stores', {
            method: 'POST',
            token,
            body: JSON.stringify({ name }),
        });
    },

    getStore: async (token: string, id: string): Promise<Store> => {
        return request<Store>(`/stores/${id}`, { token });
    },

    updateStore: async (token: string, id: string, data: Partial<Store>): Promise<Store> => {
        return request<Store>(`/stores/${id}`, {
            method: 'PATCH',
            token,
            body: JSON.stringify(data),
        });
    },

    uploadBanner: async (token: string, id: string, file: File): Promise<Store> => {
        const formData = new FormData();
        formData.append('file', file);
        return request<Store>(`/stores/${id}/upload-banner`, {
            method: 'POST',
            token,
            body: formData,
        });
    },

    uploadLogo: async (token: string, id: string, file: File): Promise<Store> => {
        const formData = new FormData();
        formData.append('file', file);
        return request<Store>(`/stores/${id}/upload-logo`, {
            method: 'POST',
            token,
            body: formData,
        });
    }
};
