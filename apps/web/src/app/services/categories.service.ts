import { request } from './api';
import { Category } from '../types';

/** Service for product category CRUD operations. */
export const categoriesService = {
    getCategories: async (token: string, storeId?: string): Promise<Category[]> => {
        let endpoint = '/categories';
        if (storeId) {
            endpoint += `?store_id=${storeId}`;
        }
        return request<Category[]>(endpoint, { token });
    },

    createCategory: async (token: string, data: Partial<Category>): Promise<Category> => {
        return request<Category>('/categories', {
            method: 'POST',
            token,
            body: JSON.stringify(data),
        });
    },

    updateCategory: async (token: string, id: string, data: Partial<Category>): Promise<Category> => {
        return request<Category>(`/categories/${id}`, {
            method: 'PATCH',
            token,
            body: JSON.stringify(data),
        });
    },

    deleteCategory: async (token: string, id: string): Promise<{ message: string }> => {
        return request<{ message: string }>(`/categories/${id}`, {
            method: 'DELETE',
            token,
        });
    },
};
