import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "CLIENT_VIEWER" | "STAFF";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  clientId?: string | null;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setAuth: (payload: {
    accessToken: string;
    refreshToken: string;
    user?: AuthUser | null;
  }) => void;

  setUser: (user: AuthUser | null) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: ({ accessToken, refreshToken, user = null }) => {
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: Boolean(user),
        });
      },

      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "creative-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
