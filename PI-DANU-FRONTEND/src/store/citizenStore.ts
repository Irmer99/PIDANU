import { create } from "zustand";
import type { CitizenUser, CitizenProfile, CitizenRequest } from "../types";
import {
  citizenLogin,
  citizenRegister,
  getCitizenProfile,
  getCitizenMyRequests,
  citizenSubmitRequest,
} from "../api/endpoints";

interface CitizenState {
  isAuthenticated: boolean;
  citizen: CitizenUser | null;
  profile: CitizenProfile | null;
  requests: CitizenRequest[];
  loading: boolean;

  login: (nin: string, pin: string) => Promise<boolean>;
  register: (params: {
    nin: string;
    pin: string;
    full_name: string;
    phone_number?: string;
    parish: string;
    district: string;
    language_preference?: string;
  }) => Promise<boolean>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  loadRequests: () => Promise<void>;
  submitRequest: (params: {
    request_type: string;
    description: string;
  }) => Promise<CitizenRequest | null>;
}

export const useCitizenStore = create<CitizenState>((set, get) => ({
  isAuthenticated: !!localStorage.getItem("pidanu_citizen_token"),
  citizen: JSON.parse(localStorage.getItem("pidanu_citizen_user") || "null"),
  profile: null,
  requests: [],
  loading: false,

  login: async (nin: string, pin: string) => {
    try {
      const result = await citizenLogin(nin, pin);
      localStorage.setItem("pidanu_citizen_token", result.token);
      localStorage.setItem("pidanu_citizen_user", JSON.stringify(result.citizen));
      set({ isAuthenticated: true, citizen: result.citizen });
      get().loadProfile();
      return true;
    } catch {
      return false;
    }
  },

  register: async (params) => {
    try {
      const result = await citizenRegister(params);
      localStorage.setItem("pidanu_citizen_token", result.token);
      localStorage.setItem("pidanu_citizen_user", JSON.stringify(result.citizen));
      set({ isAuthenticated: true, citizen: result.citizen });
      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("pidanu_citizen_token");
    localStorage.removeItem("pidanu_citizen_user");
    set({ isAuthenticated: false, citizen: null, profile: null, requests: [] });
  },

  loadProfile: async () => {
    set({ loading: true });
    try {
      const profile = await getCitizenProfile();
      set({ profile });
    } catch { /* ignore */ }
    set({ loading: false });
  },

  loadRequests: async () => {
    try {
      const requests = await getCitizenMyRequests();
      set({ requests });
    } catch { /* ignore */ }
  },

  submitRequest: async (params) => {
    try {
      const newReq = await citizenSubmitRequest(params);
      set((s) => ({ requests: [newReq, ...s.requests] }));
      return newReq;
    } catch {
      return null;
    }
  },
}));
