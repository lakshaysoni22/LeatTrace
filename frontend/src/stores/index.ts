import { create } from 'zustand';
import type { User, Case, Alert, WatchlistEntry } from '../types';
import { mockUser, mockCases, mockAlerts, mockWatchlist } from '../data/mockData';

// Auth Store
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (email: string, _password: string) => {
    if (email === 'inspector.verma@cybercrime.gov.in' && _password === 'SecurePass@2026') {
      set({ user: mockUser, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// Navigation Store
interface NavStore {
  sidebarOpen: boolean;
  currentPage: string;
  showShortcuts: boolean;
  toggleSidebar: () => void;
  setPage: (page: string) => void;
  setShowShortcuts: (v: boolean) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  sidebarOpen: true,
  currentPage: 'dashboard',
  showShortcuts: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setPage: (page: string) => set({ currentPage: page }),
  setShowShortcuts: (v) => set({ showShortcuts: v }),
}));

// Cases Store
interface CaseStore {
  cases: Case[];
  selectedCase: Case | null;
  selectCase: (c: Case | null) => void;
  addCase: (c: Case) => void;
  updateCase: (id: string, updates: Partial<Case>) => void;
}

export const useCaseStore = create<CaseStore>((set) => ({
  cases: mockCases,
  selectedCase: null,
  selectCase: (c) => set({ selectedCase: c }),
  addCase: (c) => set((s) => ({ cases: [c, ...s.cases] })),
  updateCase: (id, updates) => set((s) => ({
    cases: s.cases.map((c) => (c.id === id ? { ...c, ...updates } : c)),
  })),
}));

// Alerts Store
interface AlertStore {
  alerts: Alert[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: mockAlerts,
  get unreadCount() { return get().alerts.filter((a) => !a.isRead).length; },
  markRead: (id) => set((s) => ({
    alerts: s.alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
  })),
  markAllRead: () => set((s) => ({
    alerts: s.alerts.map((a) => ({ ...a, isRead: true })),
  })),
}));

// Watchlist Store
interface WatchlistStore {
  entries: WatchlistEntry[];
  addEntry: (entry: WatchlistEntry) => void;
  removeEntry: (id: string) => void;
}

export const useWatchlistStore = create<WatchlistStore>((set) => ({
  entries: mockWatchlist,
  addEntry: (entry) => set((s) => ({ entries: [entry, ...s.entries] })),
  removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
}));

// Blockchain Analysis Store
interface BlockchainStore {
  searchAddress: string;
  isAnalyzing: boolean;
  setSearchAddress: (addr: string) => void;
  setAnalyzing: (v: boolean) => void;
}

export const useBlockchainStore = create<BlockchainStore>((set) => ({
  searchAddress: '',
  isAnalyzing: false,
  setSearchAddress: (addr) => set({ searchAddress: addr }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
}));
