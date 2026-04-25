import { request } from './api';
import { Expense, ExpenseCategory, Income } from '../types';

/** Service for expense/income categories and transactions. */
export const expensesService = {
  // Categories
  async getCategories(token: string, storeId: string): Promise<ExpenseCategory[]> {
    const data = await request<any[]>(`/expense-categories?storeId=${storeId}`, { token });
    return data.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: cat.type, // 'expense' or 'income'
      isDefault: cat.is_system,
      isActive: true, // Backend doesn't seem to have isActive field, assuming true
    }));
  },

  async createCategory(token: string, storeId: string, category: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory> {
    const data = await request<any>(`/expense-categories?storeId=${storeId}`, {
      method: 'POST',
      token,
      body: JSON.stringify({
        name: category.name,
        type: category.type,
      }),
    });
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      isDefault: data.is_system,
      isActive: true,
    };
  },

  async deleteCategory(token: string, id: string): Promise<void> {
    await request(`/expense-categories/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  // Transactions
  async getTransactions(token: string, storeId: string, filters: any = {}): Promise<{ expenses: Expense[], incomes: Income[] }> {
    const queryParams = new URLSearchParams({ storeId, ...filters }).toString();
    const data = await request<any[]>(`/transactions?${queryParams}`, { token });
    
    const expenses: Expense[] = [];
    const incomes: Income[] = [];

    data.forEach(t => {
      if (t.type === 'expense') {
        expenses.push({
          id: t.id,
          date: t.transaction_date,
          description: t.description || '',
          amount: Number(t.amount),
          categoryId: t.category_id,
          paymentMethod: t.payment_method,
          notes: t.notes,
        });
      } else {
        incomes.push({
          id: t.id,
          date: t.transaction_date,
          source: t.description || '',
          amount: Number(t.amount),
          categoryId: t.category_id,
          paymentMethod: t.payment_method,
          notes: t.notes,
        });
      }
    });

    return { expenses, incomes };
  },

  async createTransaction(token: string, storeId: string, transaction: any): Promise<any> {
    return await request('/transactions', {
      method: 'POST',
      token,
      body: JSON.stringify({
        ...transaction,
        store_id: storeId,
      }),
    });
  },

  async updateTransaction(token: string, id: string, transaction: any): Promise<any> {
    return await request(`/transactions/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(transaction),
    });
  },

  async deleteTransaction(token: string, id: string): Promise<void> {
    await request(`/transactions/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};
