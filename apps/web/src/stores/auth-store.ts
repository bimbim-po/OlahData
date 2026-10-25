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

function getInitialLocalUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('olahdata-session');
    if (stored) {
      const parsed = JSON.parse(stored) as User;
      if (parsed && parsed.id) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

const initialUser = getInitialLocalUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  isLoading: initialUser ? false : true,

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

    if (typeof window !== 'undefined' && current.id && !current.id.startsWith('demo')) {
      import('@/lib/supabase/client').then(({ getSupabaseBrowserClient }) => {
        const supabase = getSupabaseBrowserClient();
        const dbUpdate: Record<string, string> = {};
        if (data.name !== undefined) dbUpdate.nama = data.name;
        if (data.university !== undefined) dbUpdate.kampus = data.university;
        if (data.department !== undefined) dbUpdate.prodi = data.department;
        if (Object.keys(dbUpdate).length > 0) {
          supabase
            .from('profiles')
            .update({ ...dbUpdate, updated_at: new Date().toISOString() })
            .eq('id', current.id)
            .then(() => {});
        }
      });
    }
  },

  loadSession: () => {
    let localUser = get().user;
    if (!localUser && typeof window !== 'undefined') {
      localUser = getInitialLocalUser();
      if (localUser) {
        set({ user: localUser, isAuthenticated: true, isLoading: false });
      }
    }

    if (typeof window !== 'undefined') {
      import('@/lib/api').then(({ getSession }) => {
        getSession()
          .then((user) => {
            if (user) {
              set({ user, isAuthenticated: true, isLoading: false });
            } else {
              const currentLocal = getInitialLocalUser();
              if (currentLocal) {
                set({ user: currentLocal, isAuthenticated: true, isLoading: false });
              } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
              }
            }
          })
          .catch(() => {
            const currentLocal = getInitialLocalUser();
            if (currentLocal) {
              set({ user: currentLocal, isAuthenticated: true, isLoading: false });
            } else {
              set({ isLoading: false });
            }
          });
      });
    } else {
      set({ isLoading: false });
    }
  },
}));
