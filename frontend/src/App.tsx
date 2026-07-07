import React, { useEffect } from 'react';
import { useAuthStore, useNavStore, useAlertStore } from './stores';
import { WS_BASE } from './utils/api';
import { LayoutDashboard, FolderOpen, Search, Bell, Sparkles } from 'lucide-react';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { DashboardPage } from './pages/DashboardPage';
import { BlockchainPage } from './pages/BlockchainPage';
import { GraphPage } from './pages/GraphPage';

// Import pages
import { CasesPage } from './pages/CasesPage';
import { EvidencePage } from './pages/EvidencePage';
import { WatchlistPage } from './pages/WatchlistPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AIWorkspacePage } from './pages/AIWorkspacePage';
import { EntityIntelligencePage } from './pages/EntityIntelligencePage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { IncidentResponsePage } from './pages/IncidentResponsePage';
import { SocDashboardPage } from './pages/SocDashboardPage';

// ─── Error Boundary ─────────────────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error: Error | null }
class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[LEATrace] Uncaught render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-8">
          <div className="glass-card p-8 max-w-lg w-full text-center">
            <div className="text-accent-red text-4xl mb-4">⚠</div>
            <h2 className="text-white text-lg font-bold mb-2">Application Error</h2>
            <p className="text-dark-400 text-sm mb-4">An unexpected error occurred in the interface.</p>
            <pre className="text-xs text-accent-red/80 bg-dark-900 rounded p-3 text-left overflow-auto max-h-32 mb-4">
              {this.state.error?.message}
            </pre>
            <button
              className="btn-primary text-sm"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { currentPage, sidebarOpen, setPage, showShortcuts, setShowShortcuts } = useNavStore();
  const { alerts } = useAlertStore();
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  // Real-time Event Streaming System WebSocket hook
  useEffect(() => {
    if (!isAuthenticated) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let heartbeatInterval: any = null;

    const connectWebSocket = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
          return;
        }

        ws = new WebSocket(`${WS_BASE}/api/streaming/alerts?token=${token}`);

        ws.onopen = () => {
          console.log('[WebSocket] Real-time event alert stream connected.');

          // Send periodic heartbeats to maintain connection health
          heartbeatInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          try {
            const rawAlert = JSON.parse(event.data);
            if (rawAlert.type === 'pong') return;

            const mappedAlert = {
              id: rawAlert.id,
              severity: rawAlert.severity || 'high',
              type: rawAlert.type || 'real-time',
              message: rawAlert.message || '',
              address: rawAlert.address,
              isRead: false,
              createdAt: rawAlert.timestamp || new Date().toISOString(),
              chain: rawAlert.chain
            };

            useAlertStore.setState((state) => ({
              alerts: [mappedAlert, ...state.alerts]
            }));
          } catch (err) {
            console.error('[WebSocket] Error parsing stream message:', err);
          }
        };

        ws.onclose = (event) => {
          console.log('[WebSocket] Stream closed. Attempting reconnect...', event.reason);
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (err) => {
          console.error('[WebSocket] Stream error:', err);
          ws?.close();
        };

      } catch (err) {
        console.error('[WebSocket] Setup failed. Retrying in 5s...', err);
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [isAuthenticated]);

  // Global keyboard shortcuts listener
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K -> Focus Search
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Ctrl + N -> Go to Cases
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setPage('cases');
      }

      // Ctrl + E -> Go to Evidence
      if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setPage('evidence');
      }

      // Ctrl + R -> Go to Reports
      if (e.ctrlKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setPage('reports');
      }

      // Ctrl + G -> Go to Graph
      if (e.ctrlKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setPage('graph');
      }

      // Ctrl + / -> Shortcuts Help
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        alert(
          "LEAtTrace Keyboard Shortcuts:\n" +
          "• Ctrl + K : Focus Search Bar\n" +
          "• Ctrl + N : Open Case Manager\n" +
          "• Ctrl + E : Open Evidence Locker\n" +
          "• Ctrl + R : Open Report Center\n" +
          "• Ctrl + G : Open Graph Visualizer\n" +
          "• Ctrl + / : Display Hotkeys Guide"
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, setPage]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Page dispatcher mapping nav-ids to components
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'cases':
        return <CasesPage />;
      case 'blockchain':
        return <BlockchainPage />;
      case 'graph':
        return <GraphPage />;
      case 'evidence':
        return <EvidencePage />;
      case 'watchlist':
        return <WatchlistPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'ai':
        return <AIWorkspacePage />;
      case 'entities':
        return <EntityIntelligencePage />;
      case 'audit':
        return <AuditPage />;
      case 'settings':
        return <SettingsPage />;
      case 'incident':
        return <IncidentResponsePage />;
      case 'soc':
        return <SocDashboardPage />;
      default:
        return <DashboardPage />;
    }
  };



  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col relative overflow-x-hidden">
      <div className="flex flex-1 min-w-0 max-w-full">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Mobile Sidebar Backdrop Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-[105] md:hidden cursor-pointer"
            onClick={() => useNavStore.setState({ sidebarOpen: false })}
          />
        )}

        {/* Main content body */}
        <div
          className={`flex-1 flex flex-col min-h-screen pb-20 md:pb-8 transition-snappy gpu-accelerated pl-0 min-w-0 max-w-full overflow-x-hidden
            ${sidebarOpen ? 'md:pl-64' : 'md:pl-[72px]'}`}
        >
          <Header />
          <main className="flex-1 p-4 sm:p-6 mt-16 overflow-y-auto min-w-0 max-w-full">
            {renderPage()}
          </main>
        </div>
      </div>

      {/* Bottom Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-dark-900/90 backdrop-blur-xl border-t border-dark-700/50 flex items-center justify-around md:hidden z-[100] safe-bottom">
        <button
          onClick={() => setPage('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${currentPage === 'dashboard' ? 'text-primary-400 font-semibold' : 'text-dark-400 hover:text-white'}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setPage('cases')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${currentPage === 'cases' ? 'text-primary-400 font-semibold' : 'text-dark-400 hover:text-white'}`}
        >
          <FolderOpen size={20} />
          <span>Cases</span>
        </button>
        <button
          onClick={() => setPage('blockchain')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${currentPage === 'blockchain' ? 'text-primary-400 font-semibold' : 'text-dark-400 hover:text-white'}`}
        >
          <Search size={20} />
          <span>Search</span>
        </button>
        <button
          onClick={() => setPage('alerts')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors relative ${currentPage === 'alerts' ? 'text-primary-400 font-semibold' : 'text-dark-400 hover:text-white'}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-accent-red rounded-full text-[9px] font-bold flex items-center justify-center text-white">
              {unreadCount}
            </span>
          )}
          <span>Alerts</span>
        </button>
        <button
          onClick={() => setPage('ai')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${currentPage === 'ai' ? 'text-primary-400 font-semibold' : 'text-dark-400 hover:text-white'}`}
        >
          <Sparkles size={20} />
          <span>AI Workspace</span>
        </button>
      </div>

      {/* Dynamic Background Task Status Bar */}
      <StatusBar />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
};

export default function AppWithBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

