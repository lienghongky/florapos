import { request } from './api';
import { User } from '../types';

/** Service for user/staff CRUD and status management. */
export const usersService = {
  getUsers: (token: string, storeId?: string) => 
    request(`/users${storeId ? `?store_id=${storeId}` : ''}`, { token }),
    
  createUser: (token: string, data: any) => 
    request('/users', { method: 'POST', body: JSON.stringify(data), token }),
    
  updateUser: (token: string, id: string, data: any) => 
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
    
  deleteUser: (token: string, id: string) => 
    request(`/users/${id}`, { method: 'DELETE', token }),
    
  toggleActiveStaff: (token: string, id: string) => 
    request(`/users/${id}/toggle-active`, { method: 'PATCH', token }),
};
