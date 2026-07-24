import { create } from "zustand";
import type { User } from "../types";

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;

  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  selectedCitizenNin: string | null;
  setSelectedCitizenNin: (nin: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: !!localStorage.getItem("pidanu_token"),
  user: JSON.parse(localStorage.getItem("pidanu_user") || "null"),

  login: async (pin: string) => {
    try {
      const { login: apiLogin } = await import(/* @vite-ignore */ "../api/endpoints");
      const result = await apiLogin(pin);
      localStorage.setItem("pidanu_token", result.token);
      localStorage.setItem("pidanu_user", JSON.stringify(result.user));
      set({ isAuthenticated: true, user: result.user });
      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("pidanu_token");
    localStorage.removeItem("pidanu_user");
    set({ isAuthenticated: false, user: null });
  },

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  selectedRequestId: null,
  setSelectedRequestId: (id) => set({ selectedRequestId: id }),
  selectedCitizenNin: null,
  setSelectedCitizenNin: (nin) => set({ selectedCitizenNin: nin }),
}));
