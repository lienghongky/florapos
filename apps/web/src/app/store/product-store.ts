import { create } from 'zustand';
import { Product, Category } from '../types';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { useAuthStore } from './auth-store';
import { API_URL } from '../services/api';

interface ProductState {
  products: Product[];
  categories: Category[];
  isProductsLoading: boolean;
  
  refreshProducts: () => Promise<void>;
  addProduct: (product: any) => Promise<void>;
  updateProduct: (id: string, product: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  refreshProductCategories: () => Promise<void>;
  addProductCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateProductCategory: (id: string, name: string) => Promise<void>;
  deleteProductCategory: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  isProductsLoading: false,

  refreshProducts: async () => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    
    set({ isProductsLoading: true });
    try {
      const fetchedProducts: any[] = await productsService.getProducts(token, selectedStore.id);
      const mappedProducts: Product[] = fetchedProducts.map(p => ({
        ...p,
        base_price: Number(p.base_price || 0),
        cost_price: Number(p.cost_price || 0),
        tax_rate: Number(p.tax_rate || 0),
        calculated_stock: Number(p.calculated_stock || 0),
        image_url: p.image_url ? (p.image_url.startsWith('http') || p.image_url.startsWith('data:image/') ? p.image_url : `${API_URL}${p.image_url}`) : null,
        tags: Array.isArray(p.tags) ? p.tags.filter(Boolean) : (p.tags ? [p.tags] : []),
      }));
      set({ products: mappedProducts });
    } catch (e) {
      console.error("Failed to fetch products", e);
    } finally {
      set({ isProductsLoading: false });
    }
  },

  addProduct: async (product) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    
    let payload = product;
    if (product instanceof FormData) {
      if (!product.has('store_id')) product.append('store_id', selectedStore.id);
    } else {
      payload = { ...product, store_id: selectedStore.id };
    }
    
    await productsService.createProduct(token, payload);
    await get().refreshProducts();
  },

  updateProduct: async (id, updatedProduct) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    
    let payload = updatedProduct;
    if (updatedProduct instanceof FormData) {
      if (!updatedProduct.has('store_id')) updatedProduct.append('store_id', selectedStore.id);
    } else {
      payload = { ...updatedProduct, store_id: selectedStore.id };
    }
    
    await productsService.updateProduct(token, id, payload);
    await get().refreshProducts();
  },

  deleteProduct: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await productsService.deleteProduct(token, id);
    await get().refreshProducts();
  },

  refreshProductCategories: async () => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    try {
      const fetchedCategories = await categoriesService.getCategories(token, selectedStore.id);
      set({ categories: fetchedCategories });
    } catch (e) {
      console.error("Failed to fetch product categories", e);
    }
  },

  addProductCategory: async (category) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    await categoriesService.createCategory(token, { ...category, store_id: selectedStore.id });
    await get().refreshProductCategories();
  },

  updateProductCategory: async (id, name) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await categoriesService.updateCategory(token, id, { name });
    await get().refreshProductCategories();
  },

  deleteProductCategory: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await categoriesService.deleteCategory(token, id);
    await get().refreshProductCategories();
  },
}));
