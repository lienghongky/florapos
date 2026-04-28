import { create } from 'zustand';
import { Expense, Income, ExpenseCategory } from '../types';
import { expensesService } from '../services/expenses.service';
import { useAuthStore } from './auth-store';

interface ExpenseState {
  expenses: Expense[];
  incomes: Income[];
  expenseCategories: ExpenseCategory[];
  startingBalance: number;
  
  setStartingBalance: (val: number) => void;
  refreshExpenseCategories: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addExpense: (expense: any) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (category: Omit<ExpenseCategory, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addIncome: (income: any) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  incomes: [],
  expenseCategories: [],
  startingBalance: Number(localStorage.getItem('starting_balance') || 0),

  setStartingBalance: (val) => {
    localStorage.setItem('starting_balance', val.toString());
    set({ startingBalance: val });
  },

  refreshExpenseCategories: async () => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    try {
      const cats = await expensesService.getCategories(token, selectedStore.id);
      set({ expenseCategories: cats });
    } catch (e) {
      console.error("Failed to fetch expense categories", e);
    }
  },

  refreshTransactions: async () => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    try {
      const { expenses, incomes } = await expensesService.getTransactions(token, selectedStore.id);
      set({ expenses, incomes });
    } catch (e) {
      console.error("Failed to fetch transactions", e);
    }
  },

  addExpense: async (e) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    await expensesService.createTransaction(token, selectedStore.id, {
      ...e,
      type: 'expense',
      transaction_date: e.date,
      category_id: e.categoryId,
      payment_method: e.paymentMethod?.toLowerCase().replace(' ', '_'),
    });
    await get().refreshTransactions();
  },

  updateExpense: async (id, u) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await expensesService.updateTransaction(token, id, u);
    await get().refreshTransactions();
  },

  deleteExpense: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await expensesService.deleteTransaction(token, id);
    await get().refreshTransactions();
  },

  addCategory: async (c) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    await expensesService.createCategory(token, selectedStore.id, {
      ...c,
      type: c.type || 'expense',
    });
    await get().refreshExpenseCategories();
  },

  deleteCategory: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await expensesService.deleteCategory(token, id);
    await get().refreshExpenseCategories();
  },

  addIncome: async (i) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token || !selectedStore) return;
    await expensesService.createTransaction(token, selectedStore.id, {
      ...i,
      type: 'income',
      description: i.source,
      transaction_date: i.date,
      category_id: i.categoryId,
      payment_method: i.paymentMethod?.toLowerCase().replace(' ', '_'),
    });
    await get().refreshTransactions();
  },

  deleteIncome: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await expensesService.deleteTransaction(token, id);
    await get().refreshTransactions();
  },
}));
