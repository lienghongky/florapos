import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export type UserRole = 'owner' | 'sales';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface ProductOption {
  id: string;
  name: string;
  price: number;
  type: 'select' | 'radio' | 'checkbox';
}

export interface SelectedOption {
  optionId: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  lowStockThreshold: number;
  isActive: boolean;
  options?: ProductOption[];
}

export interface CartItem {
  uuid: string; // Unique ID for cart entry
  product: Product;
  quantity: number;
  selectedOptions?: SelectedOption[];
}

export type SaleStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Sale {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  salesPerson: string;
  status: SaleStatus;
  // Optional order details
  address?: string;
  deliveryFee?: number;
  discount?: number;
  tax?: number;
  subtotal?: number;
  note?: string;
  serviceType?: 'pick-up' | 'delivery';
}

export interface Store {
  id: string;
  name: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  isDefault?: boolean;
  isActive: boolean;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  categoryId: string;
  paymentMethod?: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface Income {
  id: string;
  date: string;
  source: string;
  amount: number;
  categoryId: string;
  paymentMethod?: string;
  notes?: string;
}

interface AppContextType {
  // Auth
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, selectedOptions?: SelectedOption[]) => void;
  removeFromCart: (cartUuid: string) => void;
  updateCartQuantity: (cartUuid: string, quantity: number) => void;
  clearCart: () => void;

  // Sales
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'date' | 'status'>) => void;
  updateSaleStatus: (id: string, status: SaleStatus) => void;

  // Store
  stores: Store[];
  selectedStore: Store | null;
  setSelectedStore: (store: Store) => void;

  // Expenses
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addCategory: (category: Omit<ExpenseCategory, 'id'>) => void;
  deleteCategory: (id: string) => void; // Soft delete (deactivate) ideally

  // Incomes
  incomes: Income[];
  addIncome: (income: Omit<Income, 'id'>) => void;
  deleteIncome: (id: string) => void;

  // Page
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // UI State
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data
const mockProducts: Product[] = [
  // Roses
  {
    id: '1', name: 'Red Roses Dozen', price: 45.99, stock: 50, category: 'Rose', image: 'red-roses', lowStockThreshold: 10, isActive: true,
    options: [
      { id: 'opt_ribbon', name: 'Add Satin Ribbon', price: 2.00, type: 'checkbox' },
      { id: 'opt_vase', name: 'Glass Vase', price: 12.00, type: 'checkbox' },
      { id: 'opt_card', name: 'Greeting Card', price: 3.50, type: 'checkbox' }
    ]
  },
  { id: '2', name: 'Pink Roses Bouquet', price: 38.99, stock: 30, category: 'Rose', image: 'pink-roses', lowStockThreshold: 10, isActive: true },

  // Lilies
  { id: '3', name: 'White Lilies', price: 38.99, stock: 30, category: 'Lily', image: 'white-lilies', lowStockThreshold: 10, isActive: true },
  { id: '4', name: 'Tiger Lilies', price: 35.99, stock: 25, category: 'Lily', image: 'tiger-lilies', lowStockThreshold: 10, isActive: true },

  // Tulips
  { id: '5', name: 'Mixed Tulips', price: 32.99, stock: 40, category: 'Tulip', image: 'tulips', lowStockThreshold: 10, isActive: true },
  {
    id: '6', name: 'Yellow Tulips', price: 29.99, stock: 35, category: 'Tulip', image: 'yellow-tulips', lowStockThreshold: 10, isActive: true,
    options: [
      { id: 'opt_wrap', name: 'Premium Wrap', price: 5.00, type: 'checkbox' }
    ]
  },

  // Orchids
  { id: '8', name: 'White Orchid Plant', price: 55.99, stock: 15, category: 'Orchid', image: 'white-orchid', lowStockThreshold: 5, isActive: true },
  { id: '9', name: 'Purple Orchid Pot', price: 59.99, stock: 12, category: 'Orchid', image: 'purple-orchid', lowStockThreshold: 5, isActive: true },

  // New
  {
    id: '10', name: 'Seasonal Mix', price: 65.00, stock: 20, category: 'New', image: 'seasonal-mix', lowStockThreshold: 8, isActive: true,
    options: [
      { id: 'opt_size_s', name: 'Standard', price: 0, type: 'radio' },
      { id: 'opt_size_l', name: 'Large (+5 stems)', price: 15.00, type: 'radio' },
      { id: 'opt_size_xl', name: 'Deluxe (+10 stems)', price: 25.00, type: 'radio' }
    ]
  },
  { id: '11', name: 'Luxury Vase Arrangement', price: 89.99, stock: 10, category: 'New', image: 'luxury-vase', lowStockThreshold: 5, isActive: true },

  // Discount
  { id: '12', name: 'Yesterday\'s Blooms', price: 15.99, stock: 10, category: 'Discount', image: 'discount-flowers', lowStockThreshold: 0, isActive: true },
  { id: '13', name: 'Succulent Trio', price: 25.00, stock: 18, category: 'Discount', image: 'succulents', lowStockThreshold: 5, isActive: true },

  // Others
  { id: '14', name: 'Premium Wrap', price: 5.00, stock: 100, category: 'Others', image: 'wrap', lowStockThreshold: 20, isActive: true },
  { id: '15', name: 'Greeting Card', price: 3.50, stock: 50, category: 'Others', image: 'card', lowStockThreshold: 10, isActive: true },
  { id: '16', name: 'Satin Ribbon', price: 2.00, stock: 200, category: 'Others', image: 'ribbon', lowStockThreshold: 30, isActive: true },
  { id: '17', name: 'Metal Bucket', price: 12.00, stock: 15, category: 'Others', image: 'bucket', lowStockThreshold: 5, isActive: true },
];

const mockSales: Sale[] = [
  {
    id: '1',
    date: '2026-01-15T10:30:00',
    items: [
      { uuid: 'sale1-item1', product: mockProducts[0], quantity: 2 },
      { uuid: 'sale1-item2', product: mockProducts[2], quantity: 1 }
    ],
    total: 124.97,
    paymentMethod: 'Credit Card',
    salesPerson: 'Sarah Jenkins',
    status: 'completed',
    subtotal: 119.97,
    tax: 5.00,
    serviceType: 'pick-up'
  },
  {
    id: '2',
    date: '2026-01-15T11:45:00',
    items: [
      { uuid: 'sale2-item1', product: mockProducts[1], quantity: 1 },
      { uuid: 'sale2-item2', product: mockProducts[4], quantity: 3 }
    ],
    total: 128.96,
    paymentMethod: 'Cash',
    salesPerson: 'Emma Wilson',
    status: 'completed',
    subtotal: 110.96,
    tax: 5.55,
    deliveryFee: 12.45,
    serviceType: 'delivery',
    address: '123 Main Street, Apt 4B, Downtown District',
    note: 'Please ring doorbell twice. Leave at door if no answer.'
  },
  {
    id: '3',
    date: '2026-01-15T14:20:00',
    items: [{ uuid: 'sale3-item1', product: mockProducts[2], quantity: 1 }],
    total: 32.99,
    paymentMethod: 'Credit Card',
    salesPerson: 'Emma Wilson',
    status: 'processing',
    subtotal: 31.42,
    tax: 1.57,
    serviceType: 'pick-up',
    note: 'Birthday arrangement - please add a card'
  },
  {
    id: '4',
    date: '2026-01-14T09:15:00',
    items: [{ uuid: 'sale4-item1', product: mockProducts[3], quantity: 2 }],
    total: 111.98,
    paymentMethod: 'Debit Card',
    salesPerson: 'Michael Chen',
    status: 'completed',
    subtotal: 120.00,
    discount: 12.00,
    tax: 3.98,
    serviceType: 'pick-up'
  },
  {
    id: '5',
    date: '2026-01-14T16:30:00',
    items: [{ uuid: 'sale5-item1', product: mockProducts[5], quantity: 3 }],
    total: 128.97,
    paymentMethod: 'Cash',
    salesPerson: 'Michael Chen',
    status: 'cancelled',
    subtotal: 105.00,
    tax: 5.25,
    deliveryFee: 18.72,
    serviceType: 'delivery',
    address: '456 Oak Avenue, Suite 200, Westside',
    note: 'Customer requested cancellation - refund processed'
  },
];

const mockStores: Store[] = [
  { id: '1', name: 'Downtown Flowers' },
  { id: '2', name: 'Westside Blooms' },
  { id: '3', name: 'Garden District Shop' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [stores] = useState<Store[]>(mockStores);
  const [selectedStore, setSelectedStore] = useState<Store | null>(mockStores[0]);
  const [currentPage, setCurrentPage] = useState('login');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed((prev: boolean) => !prev);

  // Expenses State (Mock)
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([
    { id: '1', name: 'Rent', isDefault: true, isActive: true },
    { id: '2', name: 'Electricity', isDefault: true, isActive: true },
    { id: '3', name: 'Water', isDefault: true, isActive: true },
    { id: '4', name: 'Internet', isDefault: true, isActive: true },
    { id: '5', name: 'Staff Salary', isDefault: true, isActive: true },
    { id: '6', name: 'Product Stocking', isDefault: true, isActive: true },
    { id: '7', name: 'Packaging', isDefault: true, isActive: true },
    { id: '8', name: 'Transport', isDefault: true, isActive: true },
    { id: '9', name: 'Marketing', isDefault: true, isActive: true },
    { id: '10', name: 'Miscellaneous', isDefault: true, isActive: true },
  ]);

  const [incomes, setIncomes] = useState<Income[]>([
    { id: '1', date: new Date().toISOString(), source: 'Consulting', amount: 500, categoryId: '1', paymentMethod: 'Bank Transfer', notes: 'Monthly Fee' }
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Expense Methods
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Date.now().toString() };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updates } : exp));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const addCategory = (category: Omit<ExpenseCategory, 'id'>) => {
    const newCategory = { ...category, id: Date.now().toString() };
    setExpenseCategories(prev => [...prev, newCategory]);
  };

  const deleteCategory = (id: string) => {
    setExpenseCategories(prev => prev.map(cat => cat.id === id ? { ...cat, isActive: false } : cat));
  };

  const addIncome = (income: Omit<Income, 'id'>) => {
    const newIncome = { ...income, id: Date.now().toString() };
    setIncomes((prev: Income[]) => [newIncome, ...prev]);
  };

  const deleteIncome = (id: string) => {
    setIncomes((prev: Income[]) => prev.filter((inc: Income) => inc.id !== id));
  };

  const login = (email: string, password: string) => {
    // Mock login
    const role: UserRole = email.includes('owner') ? 'owner' : 'sales';
    setUser({
      id: '1',
      name: role === 'owner' ? 'John Smith' : 'Emma Wilson',
      email,
      role,
      avatar: role === 'owner' ? 'owner' : 'sales',
    });
    setCurrentPage(role === 'owner' ? 'dashboard-owner' : 'dashboard-sales');
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    setCurrentPage('login');
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now().toString() };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id: string, updatedProduct: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const addToCart = (product: Product, selectedOptions: SelectedOption[] = []) => {
    // Helper to compare options arrays
    const optionsMatch = (opts1: SelectedOption[] = [], opts2: SelectedOption[] = []) => {
      if (opts1.length !== opts2.length) return false;
      const sorted1 = [...opts1].sort((a, b) => a.optionId.localeCompare(b.optionId));
      const sorted2 = [...opts2].sort((a, b) => a.optionId.localeCompare(b.optionId));
      return sorted1.every((opt, i) => opt.optionId === sorted2[i].optionId);
    };

    // Find existing item with same product ID AND same options
    const existingItem = cart.find(item =>
      item.product.id === product.id && optionsMatch(item.selectedOptions, selectedOptions)
    );

    if (existingItem) {
      updateCartQuantity(existingItem.uuid, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        uuid: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        product,
        quantity: 1,
        selectedOptions
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (cartUuid: string) => {
    setCart(cart.filter(item => item.uuid !== cartUuid));
  };

  const updateSaleStatus = (id: string, status: SaleStatus) => {
    setSales(prev => prev.map(sale => sale.id === id ? { ...sale, status } : sale));
  };

  const updateCartQuantity = (cartUuid: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartUuid);
    } else {
      setCart(cart.map(item =>
        item.uuid === cartUuid ? { ...item, quantity } : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const addSale = (sale: Omit<Sale, 'id' | 'date' | 'status'>) => {
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: 'pending' // Default status
    };
    setSales([newSale, ...sales]);

    // Update inventory
    sale.items.forEach(item => {
      updateProduct(item.product.id, {
        stock: item.product.stock - item.quantity
      });
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        sales,
        addSale,
        updateSaleStatus,
        stores,
        selectedStore,
        setSelectedStore,
        currentPage,
        setCurrentPage,
        expenses,
        expenseCategories,
        addExpense,
        updateExpense,
        deleteExpense,
        addCategory,
        deleteCategory,
        incomes,
        addIncome,
        deleteIncome,
        isSidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
