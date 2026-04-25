/**
 * Safely converts any date input to a valid Date object.
 * Falls back to current date if input is invalid or missing.
 */
export const toSafeDate = (dateInput: any): Date => {
  if (!dateInput) return new Date();
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? new Date() : d;
};

/**
 * Formats a date to locale time string (e.g., 10:30 AM)
 */
export const formatTime = (dateInput: any): string => {
  return toSafeDate(dateInput).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Formats a date to locale date string (e.g., Apr 18, 2026)
 */
export const formatDate = (dateInput: any, options: Intl.DateTimeFormatOptions = {}): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  };
  return toSafeDate(dateInput).toLocaleDateString([], { ...defaultOptions, ...options });
};

/**
 * Formats a date to full locale string
 */
export const formatDateTime = (dateInput: any): string => {
  return toSafeDate(dateInput).toLocaleString([], { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });
};

/**
 * Formats a payment method string for display
 */
export const formatPaymentMethod = (method: string): string => {
  const methods: Record<string, string> = {
    'cash': 'Cash',
    'credit': 'Credit Card',
    'debit': 'Debit Card',
    'qr': 'QR Payment',
    'bank': 'Bank Transfer',
    'pay_later': 'Pay Later'
  };
  const m = (method || '').toLowerCase();
  return methods[m] || m.charAt(0).toUpperCase() + m.slice(1);
};

/**
 * Safely parses a price value from various formats.
 * Handles objects with `.usd` property, strings, and numbers.
 */
export const parsePrice = (val: any): number => {
  if (val && typeof val === 'object' && 'usd' in val) return Number(val.usd) || 0;
  return Number(val) || 0;
};

/**
 * Formats a number as a USD currency string (e.g., "$1,234.56").
 */
export const formatCurrency = (amount: number, decimals = 2): string => {
  return `$${amount.toFixed(decimals)}`;
};

/**
 * Formats a local date as YYYY-MM-DD string (used for API queries / date inputs).
 */
export const toLocalDateString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

