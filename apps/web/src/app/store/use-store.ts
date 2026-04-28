import { useAuthStore } from './auth-store';
import { useProductStore } from './product-store';
import { useInventoryStore } from './inventory-store';
import { useOrderStore } from './order-store';
import { useCartStore } from './cart-store';
import { useExpenseStore } from './expense-store';
import { useStaffStore } from './staff-store';
import { useUIStore } from './ui-store';
import { useMasterStore } from './master-store';

/**
 * Hook to access all stores in a unified way.
 * Alternatively, use individual store hooks for better performance (less re-renders).
 */
export const useStore = () => {
  return {
    ...useAuthStore(),
    ...useProductStore(),
    ...useInventoryStore(),
    ...useOrderStore(),
    ...useCartStore(),
    ...useExpenseStore(),
    ...useStaffStore(),
    ...useUIStore(),
    ...useMasterStore(),
  };
};

export {
  useAuthStore,
  useProductStore,
  useInventoryStore,
  useOrderStore,
  useCartStore,
  useExpenseStore,
  useStaffStore,
  useUIStore,
  useMasterStore,
};
