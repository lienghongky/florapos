import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { request, API_URL } from '../services/api';

import {
  User, Store, Product, InventoryItem, Category, CartItem, Order, OrderStatus, Expense, ExpenseCategory,
  InventoryHistoryLog, Income, ProductVariant, Addon
} from '../types';
import { storesService } from '../services/stores.service';
import { productsService } from '../services/products.service';
import { inventoryService } from '../services/inventory.service';
import { categoriesService } from '../services/categories.service';
import { ordersService } from '../services/orders.service';
import { expensesService } from '../services/expenses.service';
import { usersService } from '../services/users.service';

/**
 * Central state management for the entire application.
 * Handles authentication, store switching, data fetching, and cart management.
 */
interface AppContextType {
  // Auth
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;

  // Products
  products: Product[];
  refreshProducts: () => Promise<void>;
  addProduct: (product: any) => Promise<void>;
  updateProduct: (id: string, product: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Inventory
  inventoryItems: InventoryItem[];
  refreshInventory: () => Promise<void>;
  getInventoryHistory: (id: string) => Promise<InventoryHistoryLog[]>;
  getGlobalHistory: (filters?: any) => Promise<InventoryHistoryLog[]>;
  findInventoryItemByCode: (code: string) => Promise<InventoryItem | null>;
  adjustInventoryStock: (id: string, type: 'set' | 'increase' | 'decrease', quantity: number, reason: string) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;

  // User Management
  users: User[];
  refreshUsers: (storeId?: string) => Promise<void>;
  createStaff: (data: any) => Promise<void>;
  updateStaff: (id: string, data: any) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  toggleActiveStaff: (id: string) => Promise<void>;


  // Product Categories
  categories: Category[];
  refreshProductCategories: () => Promise<void>;
  addProductCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateProductCategory: (id: string, name: string) => Promise<void>;
  deleteProductCategory: (id: string) => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, selectedVariant?: ProductVariant, selectedAddons?: Addon[], quantity?: number) => void;
  removeFromCart: (cartUuid: string) => void;
  updateCartQuantity: (cartUuid: string, quantity: number) => void;
  clearCart: () => void;

  // Orders
  orders: Order[];
  refreshOrders: (filters?: any) => Promise<void>;
  checkoutOrder: (payload: any) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updateOrderPayment: (id: string, paymentStatus: string, paymentMethod?: string) => Promise<void>;

  // Store
  stores: Store[];
  selectedStore: Store | null;
  setSelectedStore: (store: Store) => void;
  refreshStores: () => Promise<void>;

  // Expenses & Incomes
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  refreshExpenseCategories: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (category: Omit<ExpenseCategory, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  incomes: Income[];
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  // Page Navigation
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // UI State
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;

  // Financials
  startingBalance: number;
  setStartingBalance: (val: number) => void;

  // Master Admin (System Owner)
  masterStats: { totalOwners: number, totalStores: number, totalStaff: number } | null;
  owners: any[];
  refreshMasterData: () => Promise<void>;
  toggleUserActive: (id: string) => Promise<void>;
  deleteGlobalUser: (id: string) => Promise<void>;
  inviteOwner: (data: any) => Promise<void>;
  createStoreForOwner: (ownerId: string, storeData: { name: string, currency: string }) => Promise<void>;
  resetOwnerPassword: (id: string, newPassword: string) => Promise<void>;
  getOwnerStaff: (ownerId: string) => Promise<any[]>;
  
  globalStaff: any[];
  refreshGlobalStaff: () => Promise<void>;
  
  globalStores: any[];
  refreshGlobalStores: () => Promise<void>;
  updateGlobalStore: (storeId: string, data: Partial<Store>) => Promise<void>;
  transferStoreOwnership: (storeId: string, newOwnerId: string) => Promise<void>;
  updateStoreInfo: (storeId: string, data: any) => Promise<void>;
  uploadStoreBanner: (storeId: string, file: File) => Promise<void>;
  uploadStoreLogo: (storeId: string, file: File) => Promise<void>;

  saasPayments: any[];
  refreshSaaSPayments: () => Promise<void>;
  recordSaaSPayment: (data: any) => Promise<void>;
  fetchOwnerPayments: (ownerId: string) => Promise<any[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [currentPage, setCurrentPageState] = useState(() => {
    const path = window.location.pathname.replace('/', '');
    return path || localStorage.getItem('current_page') || 'login';
  });

  // Sync path to state
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '');
      if (path && path !== currentPage) {
        setCurrentPageState(path);
      }
    };
    window.addEventListener('popstate', handlePopState);
    
    // Set initial path if it's missing but we have a state
    if (window.location.pathname === '/' && currentPage) {
      window.history.replaceState({}, '', `/${currentPage}`);
    }
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage]);

  const setCurrentPage = (page: string) => {
    localStorage.setItem('current_page', page);
    setCurrentPageState(page);
    window.history.pushState({}, '', `/${page}`);
  };
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Expenses & Incomes ──────────────────────────────────────────────────
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [startingBalance, setStartingBalanceState] = useState<number>(() => {
    const saved = localStorage.getItem('starting_balance');
    return saved ? Number(saved) : 0;
  });

  const [masterStats, setMasterStats] = useState<{ totalOwners: number, totalStores: number, totalStaff: number } | null>(null);
  const [owners, setOwners] = useState<any[]>([]);
  const [globalStores, setGlobalStores] = useState<any[]>([]);
  const [globalStaff, setGlobalStaff] = useState<any[]>([]);
  const [saasPayments, setSaaSPayments] = useState<any[]>([]);

  const setStartingBalance = (val: number) => {
    setStartingBalanceState(val);
    localStorage.setItem('starting_balance', val.toString());
  };

  const refreshStores = async (explicitToken?: string) => {
    const activeToken = explicitToken || token;
    if (!activeToken) return;
    try {
      const fetchedStores = await storesService.getStores(activeToken);
      setStores(fetchedStores);
      if (fetchedStores.length > 0) {
        // If no store selected, or current selection isn't in fetched list, pick first
        setSelectedStore(prev => {
          if (!prev) return fetchedStores[0];
          if (fetchedStores.find(s => s.id === prev.id)) return prev;
          return fetchedStores[0];
        });
      }
    } catch (e) { console.error("Failed to fetch stores", e); }
  };

  const refreshProducts = async () => {
    if (!token || !selectedStore) return;
    try {
      const fetchedProducts: any[] = await productsService.getProducts(token, selectedStore.id);
      
      const mappedProducts: Product[] = fetchedProducts.map(p => ({
        id: p.id,
        store_id: p.store_id,
        name: p.name,
        description: p.description,
        sku: p.sku,
        barcode: p.barcode,
        category_id: p.category_id,
        product_type: p.product_type || 'simple',
        pricing_type: p.pricing_type || 'fixed',
        base_price: Number(p.base_price || 0),
        cost_price: Number(p.cost_price || 0),
        taxable: p.taxable ?? true,
        tax_rate: Number(p.tax_rate || 0),
        track_inventory: p.track_inventory ?? true,
        allow_negative_stock: p.allow_negative_stock ?? false,
        image_url: p.image_url ? (p.image_url.startsWith('http') || p.image_url.startsWith('data:image/') ? p.image_url : `${API_URL}${p.image_url}`) : null,
        is_active: p.is_active ?? true,
        variants: p.variants || [],
        product_addons: p.product_addons || [],
        recipe: p.recipe || [],
        calculated_stock: Number(p.calculated_stock || 0),
        tags: Array.isArray(p.tags) ? p.tags.filter(Boolean) : (p.tags ? [p.tags] : []),
        updated_at: p.updated_at,
      }));

      setProducts(mappedProducts);
    } catch (e) { console.error("Failed to fetch products", e); }
  };

  const refreshInventory = async () => {
    if (!token || !selectedStore) return;
    try {
      const fetchedInventory = await inventoryService.getInventory(token, selectedStore.id);
      setInventoryItems(fetchedInventory);
    } catch (e) { console.error("Failed to fetch inventory", e); }
  };

  const refreshOrders = useCallback(async (filters: any = {}) => {
    if (!token || !selectedStore) return;
    try {
      let fetchedOrders;
      if (typeof filters === 'object') {
        const { status, startDate, endDate, search } = filters;
        fetchedOrders = await ordersService.getOrders(token, selectedStore.id, status, startDate, endDate, search);
      } else {
        fetchedOrders = await ordersService.getOrders(token, { ...filters, store_id: selectedStore.id });
      }
      if (fetchedOrders && fetchedOrders.items) {
        setOrders(fetchedOrders.items);
      } else {
        setOrders(fetchedOrders || []);
      }
    } catch (e) { console.error("Failed to fetch orders", e); }
  }, [token, selectedStore?.id]);

  const refreshUsers = async (storeId?: string) => {
    if (!token) return;
    try {
      const data = await usersService.getUsers(token, storeId);
      setUsers(data);
    } catch (e) {
      console.error("Failed to refresh users", e);
    }
  };

  const refreshMasterData = async () => {
    if (!token || user?.role !== 'master') return;
    try {
      const stats = await request<any>('/master/stats', { token });
      const ownersList = await request<any[]>('/master/owners', { token });
      setMasterStats(stats);
      setOwners(ownersList);
    } catch (e) { console.error("Failed to refresh master data", e); }
  };

  const toggleUserActive = async (id: string) => {
    if (!token) return;
    try {
      await request(`/master/users/${id}/toggle-active`, { method: 'PATCH', token });
      await refreshMasterData();
    } catch (e) { throw e; }
  };

  const deleteGlobalUser = async (id: string) => {
    if (!token) return;
    try {
      await request(`/master/users/${id}`, { method: 'DELETE', token });
      await refreshMasterData();
    } catch (e) { throw e; }
  };

  const resetOwnerPassword = async (id: string, newPassword: string) => {
    if (!token) return;
    try {
      await request(`/master/users/${id}/password`, { 
        method: 'PATCH', 
        body: JSON.stringify({ password: newPassword }), 
        token 
      });
      toast.success('Password updated successfully');
    } catch (e) { throw e; }
  };

  const inviteOwner = async (data: any) => {
    if (!token) return;
    try {
      await request('/master/owners', { method: 'POST', body: JSON.stringify(data), token });
      await refreshMasterData();
    } catch (e) { throw e; }
  };

  const createStoreForOwner = async (ownerId: string, storeData: { name: string, currency: string }) => {
    if (!token) return;
    try {
      await request(`/master/owners/${ownerId}/stores`, { method: 'POST', body: JSON.stringify(storeData), token });
      await refreshMasterData();
    } catch (e) { throw e; }
  };

  const getOwnerStaff = async (ownerId: string) => {
    if (!token) return [];
    try {
      return await request<any[]>(`/master/owners/${ownerId}/staff`, { token });
    } catch (e) { console.error("Failed to fetch owner staff", e); return []; }
  };

  const updateStoreInfo = async (storeId: string, data: any) => {
    if (!token) return;
    try {
      await storesService.updateStore(token, storeId, data);
      await refreshStores();
    } catch (e) { throw e; }
  };

  const uploadStoreBanner = async (storeId: string, file: File) => {
    if (!token) return;
    try {
      await storesService.uploadBanner(token, storeId, file);
      await refreshStores();
    } catch (e) { throw e; }
  };

  const uploadStoreLogo = async (storeId: string, file: File) => {
    if (!token) return;
    try {
      await storesService.uploadLogo(token, storeId, file);
      await refreshStores();
    } catch (e) { throw e; }
  };

  const refreshGlobalStores = async () => {
    if (!token || user?.role !== 'master') return;
    try {
      const storesList = await request<any[]>('/master/stores', { token });
      setGlobalStores(storesList);
    } catch (e) { console.error("Failed to fetch global stores", e); }
  };

  const refreshGlobalStaff = async () => {
    if (!token || user?.role !== 'master') return;
    try {
      const staffList = await request<any[]>('/master/staff', { token });
      setGlobalStaff(staffList);
    } catch (e) { console.error("Failed to fetch global staff", e); }
  };

  const updateGlobalStore = async (storeId: string, data: { name?: string, currency?: string }) => {
    if (!token) return;
    try {
      await request(`/master/stores/${storeId}`, { method: 'PATCH', body: JSON.stringify(data), token });
      await refreshGlobalStores();
    } catch (e) { throw e; }
  };

  const transferStoreOwnership = async (storeId: string, newOwnerId: string) => {
    if (!token) return;
    try {
      await request(`/master/stores/${storeId}/transfer`, { method: 'POST', body: JSON.stringify({ newOwnerId }), token });
      await refreshGlobalStores();
      await refreshMasterData(); 
    } catch (e) { throw e; }
  };

  const refreshSaaSPayments = async () => {
    if (!token || user?.role !== 'master') return;
    try {
      const paymentsList = await request<any[]>('/master/payments', { token });
      setSaaSPayments(paymentsList);
    } catch (e) { console.error("Failed to fetch saas payments", e); }
  };

  const recordSaaSPayment = async (data: any) => {
    if (!token) return;
    try {
      await request('/master/payments', { method: 'POST', body: JSON.stringify(data), token });
      await refreshSaaSPayments();
    } catch (e) { throw e; }
  };

  const fetchOwnerPayments = async (ownerId: string) => {
    if (!token) return [];
    try {
      return await request<any[]>(`/master/owners/${ownerId}/payments`, { token });
    } catch (e) { console.error("Failed to fetch owner payments", e); return []; }
  };

  const getInventoryHistory = async (id: string): Promise<InventoryHistoryLog[]> => {
    if (!token) return [];
    try { return await inventoryService.getHistory(token, id); }
    catch (e) { console.error("Failed to fetch history", e); return []; }
  };

  const getGlobalHistory = async (filters: any = {}): Promise<InventoryHistoryLog[]> => {
    if (!token || !selectedStore) return [];
    try { return await inventoryService.getGlobalHistory(token, selectedStore.id, filters); }
    catch (e) { console.error("Failed to fetch global history", e); return []; }
  };

  const findInventoryItemByCode = async (code: string): Promise<InventoryItem | null> => {
    if (!token || !selectedStore) return null;
    try { return await inventoryService.findItemByCode(token, selectedStore.id, code); }
    catch (e) { return null; }
  };

  const adjustInventoryStock = async (id: string, type: 'set' | 'increase' | 'decrease', quantity: number, reason: string): Promise<void> => {
    if (!token) return;
    try {
      await inventoryService.adjustStock(token, id, type, quantity, reason);
      await refreshInventory();
      await refreshProducts();
    } catch (e) { throw e; }
  };

  const deleteInventoryItem = async (id: string) => {
    if (!token) return;
    try {
      await inventoryService.deleteInventoryItem(token, id);
      await refreshInventory();
      await refreshProducts();
    } catch (e) { throw e; }
  };

  const refreshProductCategories = async () => {
    if (!token || !selectedStore) return;
    try {
      const fetchedCategories = await categoriesService.getCategories(token, selectedStore.id);
      setCategories(fetchedCategories);
    } catch (e) { console.error("Failed to fetch product categories", e); }
  };

  const refreshExpenseCategories = async () => {
    if (!token || !selectedStore) return;
    try {
      const cats = await expensesService.getCategories(token, selectedStore.id);
      setExpenseCategories(cats);
    } catch (e) { console.error("Failed to fetch expense categories", e); }
  };

  const refreshTransactions = async () => {
    if (!token || !selectedStore) return;
    try {
      const { expenses: e, incomes: i } = await expensesService.getTransactions(token, selectedStore.id);
      setExpenses(e);
      setIncomes(i);
    } catch (e) { console.error("Failed to fetch transactions", e); }
  };

  useEffect(() => {
    if (selectedStore && token) {
      refreshProducts();
      refreshInventory();
      refreshProductCategories();
      refreshOrders();
      if (user?.role === 'owner') {
        refreshTransactions();
        refreshExpenseCategories();
        refreshUsers(selectedStore.id);
      }
    }
  }, [selectedStore?.id, token, user?.role]);

  useEffect(() => {
    if (token && user?.role === 'master') {
      refreshMasterData();
      refreshGlobalStores();
      refreshSaaSPayments();
    }
  }, [token, user?.role]);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const toggleMobileSidebar = () => setMobileSidebarOpen(prev => !prev);

  const createStaff = async (data: any) => {
    if (!token) return;
    try {
      await usersService.createUser(token, data);
      await refreshUsers(selectedStore?.id);
    } catch (e) { throw e; }
  };

  const updateStaff = async (id: string, data: any) => {
    if (!token) return;
    try {
      await usersService.updateUser(token, id, data);
      await refreshUsers(selectedStore?.id);
    } catch (e) { throw e; }
  };

  const deleteStaff = async (id: string) => {
    if (!token) return;
    try {
      await usersService.deleteUser(token, id);
      await refreshUsers(selectedStore?.id);
    } catch (e) { throw e; }
  };

  const toggleActiveStaff = async (id: string) => {
    if (!token) return;
    try {
      await usersService.toggleActiveStaff(token, id);
      await refreshUsers(selectedStore?.id);
    } catch (e) { throw e; }
  };

  const addExpense = async (e: any) => {
    if (!token || !selectedStore) return;
    try {
      await expensesService.createTransaction(token, selectedStore.id, {
        ...e,
        type: 'expense',
        transaction_date: e.date,
        category_id: e.categoryId,
        payment_method: e.paymentMethod?.toLowerCase().replace(' ', '_'),
      });
      await refreshTransactions();
    } catch (err) { throw err; }
  };

  const updateExpense = async (id: string, u: any) => {
    if (!token) return;
    try {
      await expensesService.updateTransaction(token, id, u);
      await refreshTransactions();
    } catch (err) { throw err; }
  };

  const deleteExpense = async (id: string) => {
    if (!token) return;
    try {
      await expensesService.deleteTransaction(token, id);
      await refreshTransactions();
    } catch (err) { throw err; }
  };

  const addCategory = async (c: any) => {
    if (!token || !selectedStore) return;
    try {
      await expensesService.createCategory(token, selectedStore.id, {
        ...c,
        type: c.type || 'expense',
      });
      await refreshExpenseCategories();
    } catch (err) { throw err; }
  };

  const deleteCategory = async (id: string) => {
    if (!token) return;
    try {
      await expensesService.deleteCategory(token, id);
      await refreshExpenseCategories();
    } catch (err) { throw err; }
  };

  const addIncome = async (i: any) => {
    if (!token || !selectedStore) return;
    try {
      await expensesService.createTransaction(token, selectedStore.id, {
        ...i,
        type: 'income',
        description: i.source,
        transaction_date: i.date,
        category_id: i.categoryId,
        payment_method: i.paymentMethod?.toLowerCase().replace(' ', '_'),
      });
      await refreshTransactions();
    } catch (err) { throw err; }
  };

  const deleteIncome = async (id: string) => {
    if (!token) return;
    try {
      await expensesService.deleteTransaction(token, id);
      await refreshTransactions();
    } catch (err) { throw err; }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await request<{ access_token: string, user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('auth_token', data.access_token);
      setToken(data.access_token);
      const user: User = { ...data.user, name: data.user.full_name || data.user.name || data.user.email };
      setUser(user);
      // Await stores so selectedStore is populated before dashboard mounts
      await refreshStores(data.access_token);
      if (user.role === 'master') setCurrentPage('dashboard-master');
      else setCurrentPage(user.role === 'owner' ? 'dashboard-owner' : 'dashboard-sales');
    } catch (error) { throw error; }
  };

  const register = async (data: any) => {
    await request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_page');
    setToken(null);
    setUser(null);
    setCart([]);
    setCurrentPage('login');
  };

  const addProduct = async (product: any) => {
    if (!token || !selectedStore) return;
    let payload = product;
    if (product instanceof FormData) {
      if (!product.has('store_id')) product.append('store_id', selectedStore.id);
    } else {
      payload = { ...product, store_id: selectedStore.id };
    }
    try {
      await productsService.createProduct(token, payload);
      await refreshProducts();
    } catch (e) { throw e; }
  };

  const updateProduct = async (id: string, updatedProduct: any) => {
    if (!token || !selectedStore) return;
    let payload = updatedProduct;
    if (updatedProduct instanceof FormData) {
      if (!updatedProduct.has('store_id')) updatedProduct.append('store_id', selectedStore.id);
    } else {
      payload = { ...updatedProduct, store_id: selectedStore.id };
    }
    try {
      await productsService.updateProduct(token, id, payload);
      await refreshProducts();
    } catch (e) { throw e; }
  };

  const deleteProduct = async (id: string) => {
    if (!token) return;
    try {
      await productsService.deleteProduct(token, id);
      await refreshProducts();
    } catch (e) { throw e; }
  };

  const addProductCategory = async (category: Omit<Category, 'id'>) => {
    if (!token || !selectedStore) return;
    try {
      await categoriesService.createCategory(token, { ...category, store_id: selectedStore.id });
      await refreshProductCategories();
    } catch (e) { throw e; }
  };

  const updateProductCategory = async (id: string, name: string) => {
    if (!token) return;
    try {
      await categoriesService.updateCategory(token, id, { name });
      await refreshProductCategories();
    } catch (e) { throw e; }
  };

  const deleteProductCategory = async (id: string) => {
    if (!token) return;
    try {
      await categoriesService.deleteCategory(token, id);
      await refreshProductCategories();
    } catch (e) { throw e; }
  };

  const addToCart = (product: Product, selectedVariant?: ProductVariant, selectedAddons: Addon[] = [], quantity: number = 1) => {
    const addonsMatch = (opts1: Addon[] = [], opts2: Addon[] = []) => {
      if (opts1.length !== opts2.length) return false;
      const sorted1 = [...opts1].sort((a, b) => a.id.localeCompare(b.id));
      const sorted2 = [...opts2].sort((a, b) => a.id.localeCompare(b.id));
      return sorted1.every((opt, i) => opt.id === sorted2[i].id);
    };
    const existingItem = cart.find(item =>
      item.product.id === product.id && 
      item.selectedVariant?.id === selectedVariant?.id &&
      addonsMatch(item.selectedAddons, selectedAddons)
    );
    if (existingItem) {
      updateCartQuantity(existingItem.uuid, existingItem.quantity + quantity);
    } else {
      setCart([...cart, {
        uuid: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        product, quantity, selectedVariant, selectedAddons
      }]);
    }
  };

  const removeFromCart = (cartUuid: string) => setCart(cart.filter(item => item.uuid !== cartUuid));

  const updateCartQuantity = (cartUuid: string, quantity: number) => {
    if (quantity <= 0) removeFromCart(cartUuid);
    else setCart(cart.map(item => item.uuid === cartUuid ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const checkoutOrder = async (payload: any) => {
    if (!token || !selectedStore) return;
    try {
      await ordersService.createOrder(token, { ...payload, store_id: selectedStore.id });
      clearCart();
      await refreshOrders();
      await refreshInventory();
    } catch (e) { throw e; }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    if (!token) return;
    try {
       await ordersService.updateOrderStatus(token, id, status);
       setOrders((prev: Order[]) => prev.map((order: Order) => order.id === id ? { ...order, status } : order));
    } catch (e) { console.error('Failed to update order status'); }
  };

  const updateOrderPayment = async (id: string, paymentStatus: string, paymentMethod?: string) => {
    if (!token) return;
    try {
      const updatedOrder = await ordersService.updatePayment(token, id, paymentStatus, paymentMethod);
      setOrders((prev: Order[]) => prev.map((order: Order) => order.id === id ? updatedOrder : order));
    } catch (e) { throw e; }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const userData = await request<User>('/auth/profile', { token: storedToken });
          const hydratedUser = { ...userData, name: userData.full_name || userData.name || userData.email };
          setUser(hydratedUser);
          setToken(storedToken);
          // Await stores so selectedStore is set before pages that need it mount
          await refreshStores(storedToken);
          // Restore saved page; if it was login/register redirect to the right dashboard
          const savedPage = localStorage.getItem('current_page');
          if (!savedPage || savedPage === 'login' || savedPage === 'register') {
            if (hydratedUser.role === 'master') setCurrentPage('dashboard-master');
            else setCurrentPage(hydratedUser.role === 'owner' ? 'dashboard-owner' : 'dashboard-sales');
          }
          // else: savedPage is already in state (initialised from localStorage above)
        } catch (error) { logout(); }
      } else {
        // No token — ensure page is login
        setCurrentPage('login');
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user, login, logout, register, isLoading, 
        products, refreshProducts, addProduct, updateProduct, deleteProduct,
        inventoryItems, refreshInventory, getInventoryHistory, getGlobalHistory, findInventoryItemByCode,
        adjustInventoryStock, deleteInventoryItem, 
        categories, refreshProductCategories, addProductCategory, updateProductCategory, deleteProductCategory, 
        cart, addToCart, removeFromCart, updateCartQuantity, clearCart,
        orders, refreshOrders, checkoutOrder, updateOrderStatus, updateOrderPayment,
        users, refreshUsers, createStaff, updateStaff, deleteStaff, toggleActiveStaff,
        stores, selectedStore, setSelectedStore, refreshStores, 
        currentPage, setCurrentPage,
        expenses, expenseCategories, refreshExpenseCategories, refreshTransactions,
        addExpense, updateExpense, deleteExpense, addCategory, deleteCategory,
        incomes, addIncome, deleteIncome, 
        isSidebarCollapsed, toggleSidebar,
        isMobileSidebarOpen, toggleMobileSidebar, setMobileSidebarOpen,
        startingBalance, setStartingBalance,
        masterStats, owners, refreshMasterData, toggleUserActive, deleteGlobalUser, resetOwnerPassword, inviteOwner, createStoreForOwner, getOwnerStaff,
        globalStores, refreshGlobalStores, updateGlobalStore, transferStoreOwnership,
        globalStaff, refreshGlobalStaff,
        updateStoreInfo, uploadStoreBanner, uploadStoreLogo,
        saasPayments, refreshSaaSPayments, recordSaaSPayment, fetchOwnerPayments,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}
