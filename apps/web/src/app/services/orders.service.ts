import { request } from './api';

/** Service for order CRUD operations and analytics. */
export const ordersService = {
  createOrder: async (token: string, payload: any) => {
    return request('/orders', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },
  

  getOrders: async (token: string, storeId: string, status?: string, startDate?: string, endDate?: string, search?: string, page?: number, limit?: number) => {
    const query = new URLSearchParams({ storeId });
    if (status) query.append('status', status);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (search) query.append('search', search);
    if (page !== undefined) query.append('page', page.toString());
    if (limit !== undefined) query.append('limit', limit.toString());
    return request(`/orders?${query.toString()}`, { token });
  },

  getStats: async (token: string, storeId: string, startDate?: string, endDate?: string) => {
    const query = new URLSearchParams({ storeId });
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    return request(`/orders/stats?${query.toString()}`, { token });
  },

  getRecentOrders: async (token: string, storeId: string, limit: number = 5) => {
    const query = new URLSearchParams({ storeId, limit: limit.toString() });
    return request(`/orders/recent?${query.toString()}`, { token });
  },

  updateOrderStatus: async (token: string, orderId: string, status: string) => {
    return request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    });
  },
  updatePayment: async (token: string, orderId: string, paymentStatus: string, paymentMethod?: string) => {
    return request(`/orders/${orderId}/payment`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ payment_status: paymentStatus, payment_method: paymentMethod }),
    });
  }
};
