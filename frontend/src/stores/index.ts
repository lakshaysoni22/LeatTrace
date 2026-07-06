import { create } from 'zustand';
import type { User, Case, Alert, WatchlistEntry } from '../types';

// Auth Store
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  mfaPendingUser: User | null;
  tempMfaToken: string | null;
  login: (email: string, password: string, isOAuth?: boolean) => Promise<boolean>;
  verifyMFA: (code: string) => Promise<boolean>;
  logout: () => void;
  setMfaPending: (user: User | null, token: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  mfaPendingUser: null,
  tempMfaToken: null,
  login: async (email: string, _password: string, isOAuth = false) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', _password);

      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.requires_mfa) {
          set({ 
            mfaPendingUser: {
              id: data.user.id,
              email: data.user.email,
              username: data.user.username,
              role: data.user.role,
              isActive: data.user.is_active,
              mfaEnabled: data.user.mfa_enabled,
              createdAt: data.user.created_at
            }, 
            tempMfaToken: data.temp_token 
          });
          return true;
        }
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        set({ 
          user: {
            id: data.user.id,
            email: data.user.email,
            username: data.user.username,
            role: data.user.role,
            isActive: data.user.is_active,
            mfaEnabled: data.user.mfa_enabled,
            createdAt: data.user.created_at
          }, 
          isAuthenticated: true, 
          mfaPendingUser: null, 
          tempMfaToken: null 
        });
        return true;
      }
    } catch (err) {
      console.error('Authentication request failed:', err);
    }

    return false;
  },
  verifyMFA: async (code: string) => {
    const pending = get().mfaPendingUser;
    const tempToken = get().tempMfaToken;
    
    if (pending && tempToken) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/auth/mfa/verify?temp_token=${tempToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code })
        });
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          set({
            user: {
              id: data.user.id,
              email: data.user.email,
              username: data.user.username,
              role: data.user.role,
              isActive: data.user.is_active,
              mfaEnabled: data.user.mfa_enabled,
              createdAt: data.user.created_at
            },
            isAuthenticated: true,
            mfaPendingUser: null,
            tempMfaToken: null
          });
          return true;
        }
      } catch (err) {
        console.error('MFA verification failed:', err);
      }
    }
    return false;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, mfaPendingUser: null, tempMfaToken: null });
  },
  setMfaPending: (user: User | null, token: string | null) => set({ mfaPendingUser: user, tempMfaToken: token })
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
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  currentPage: 'dashboard',
  showShortcuts: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setPage: (page: string) => set({ currentPage: page }),
  setShowShortcuts: (v) => set({ showShortcuts: v }),
}));

const mapCasePayload = (item: any): Case => ({
  id: item.id,
  caseNumber: item.case_number ?? item.caseNumber ?? '',
  title: item.title ?? '',
  description: item.description ?? '',
  priority: item.priority ?? 'medium',
  status: item.status ?? 'open',
  investigatorId: item.investigator_id ?? item.investigatorId ?? '',
  investigatorName: item.investigator_name ?? item.investigatorName ?? '',
  department: item.department ?? '',
  notes: item.notes,
  createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
  updatedAt: item.updated_at ?? item.updatedAt ?? new Date().toISOString(),
  closedAt: item.closed_at ?? item.closedAt,
  walletCount: Array.isArray(item.wallets) ? item.wallets.length : item.walletCount ?? 0,
  evidenceCount: Array.isArray(item.evidence) ? item.evidence.length : item.evidenceCount ?? 0,
});

// Cases Store
interface CaseStore {
  cases: Case[];
  selectedCase: Case | null;
  selectCase: (c: Case | null) => void;
  addCase: (c: Case) => void;
  updateCase: (id: string, updates: Partial<Case>) => void;
  setCases: (cases: Case[]) => void;
  loadCases: () => Promise<void>;
}

export const useCaseStore = create<CaseStore>((set, get) => ({
  cases: [],
  selectedCase: null,
  selectCase: (c) => set({ selectedCase: c }),
  addCase: (c) => set((s) => ({ cases: [c, ...s.cases] })),
  updateCase: (id, updates) => set((s) => ({
    cases: s.cases.map((c) => (c.id === id ? { ...c, ...updates } : c)),
  })),
  setCases: (cases) => set({ cases }),
  loadCases: async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/cases', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        const mappedCases = Array.isArray(data) ? data.map(mapCasePayload) : [];
        const currentSelection = get().selectedCase;
        set({
          cases: mappedCases,
          selectedCase: currentSelection && mappedCases.some((c) => c.id === currentSelection.id)
            ? currentSelection
            : mappedCases[0] ?? null,
        });
      }
    } catch (err) {
      console.error('Failed to load cases from backend:', err);
    }
  },
}));

// Alerts Store
interface AlertStore {
  alerts: Alert[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],
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
  entries: [],
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
