import { create } from 'zustand';
import { User } from '../types';
import { usersService } from '../services/users.service';
import { useAuthStore } from './auth-store';

interface StaffState {
  users: User[];
  refreshUsers: (storeId?: string) => Promise<void>;
  createStaff: (data: any) => Promise<void>;
  updateStaff: (id: string, data: any) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  toggleActiveStaff: (id: string) => Promise<void>;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  users: [],

  refreshUsers: async (storeId) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token) return;
    try {
      const data = await usersService.getUsers(token, storeId || selectedStore?.id);
      set({ users: data });
    } catch (e) {
      console.error("Failed to refresh users", e);
    }
  },

  createStaff: async (data) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token) return;
    await usersService.createUser(token, data);
    await get().refreshUsers(selectedStore?.id);
  },

  updateStaff: async (id, data) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token) return;
    await usersService.updateUser(token, id, data);
    await get().refreshUsers(selectedStore?.id);
  },

  deleteStaff: async (id) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token) return;
    await usersService.deleteUser(token, id);
    await get().refreshUsers(selectedStore?.id);
  },

  toggleActiveStaff: async (id) => {
    const { token, selectedStore } = useAuthStore.getState();
    if (!token) return;
    await usersService.toggleActiveStaff(token, id);
    await get().refreshUsers(selectedStore?.id);
  },
}));
