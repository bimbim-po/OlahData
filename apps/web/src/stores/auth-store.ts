import { create } from 'zustand';
import type { User } from '@/lib/api/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  loadSession: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user: User) => {
    try {
      localStorage.setItem('olahdata-session', JSON.stringify(user));
    } catch {
      // localStorage not available
    }
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    try {
      localStorage.removeItem('olahdata-session');
    } catch {
      // localStorage not available
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  updateUser: (data: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...data };
    try {
      localStorage.setItem('olahdata-session', JSON.stringify(updated));
    } catch {
      // localStorage not available
    }
    set({ user: updated });
  },

  loadSession: () => {
    try {
      const stored = localStorage.getItem('olahdata-session');
      if (stored) {
        const user = JSON.parse(stored) as User;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
