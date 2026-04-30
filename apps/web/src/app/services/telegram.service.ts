import { request } from './api';

export interface TelegramStatus {
  linked: boolean;
  is_active?: boolean;
  chat_id?: number;
  username?: string | null;
  active_store_id?: string | null;
  preferences?: {
    notify_orders: boolean;
    notify_daily_summary: boolean;
    notify_low_stock: boolean;
  };
  linked_at?: string;
}

export interface TelegramLinkResponse {
  link: string;
  token: string;
  expires_in: string;
  bot_username: string;
}

export const telegramService = {
  getStatus: async (token: string): Promise<TelegramStatus> => {
    return request<TelegramStatus>('/telegram/status', { token });
  },

  generateLink: async (token: string, targetUserId?: string): Promise<TelegramLinkResponse> => {
    return request<TelegramLinkResponse>('/telegram/generate-link', {
      method: 'POST',
      token,
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
  },

  unlink: async (token: string): Promise<{ message: string }> => {
    return request<{ message: string }>('/telegram/unlink', {
      method: 'DELETE',
      token,
    });
  },
};
