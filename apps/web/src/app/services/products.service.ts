import { request } from './api';
import { Product } from '../types';

/** Service for product CRUD operations and image uploads. */
export const productsService = {
    getProducts: async (token: string, storeId: string): Promise<Product[]> => {
        return request<Product[]>(`/products?storeId=${storeId}`, { token });
    },

    getProduct: async (token: string, id: string): Promise<Product> => {
        return request<Product>(`/products/${id}`, { token });
    },

    createProduct: async (token: string, data: any): Promise<Product> => {
        try {
            return await request<Product>('/products', {
                method: 'POST',
                token,
                body: data instanceof FormData ? data : JSON.stringify(data),
            });

        } catch (error) {
            console.error("Create Product API Error:", error);
            throw error;
        }
    },

    updateProduct: async (token: string, id: string, data: any): Promise<Product> => {
        try {
            return await request<Product>(`/products/${id}`, {
                method: 'PATCH',
                token,
                body: data instanceof FormData ? data : JSON.stringify(data),
            });

        } catch (error) {
            console.error("Update Product API Error:", error);
            throw error;
        }
    },

    deleteProduct: async (token: string, id: string): Promise<void> => {
        try {
            await request(`/products/${id}`, {
                method: 'DELETE',
                token
            });
        } catch (error) {
            console.error("Delete Product API Error:", error);
            throw error;
        }
    }
};
