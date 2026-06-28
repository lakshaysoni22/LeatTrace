import React, { useEffect } from 'react';
import { useAuthStore, useNavStore, useAlertStore } from './stores';
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

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { currentPage, sidebarOpen, setPage, showShortcuts, setShowShortcuts } = useNavStore();

  // Real-time Event Streaming System WebSocket hook
  useEffect(() => {
    if (!isAuthenticated) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = async () => {
      try {
        const loginData = new URLSearchParams();
        loginData.append('username', 'auditor.gupta@cybercrime.gov.in');
        loginData.append('password', 'SecurePass@2026');

        const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: loginData,
        });

        if (!response.ok) {
          throw new Error('Silent login failed');
        }

        const data = await response.json();
        const token = data.access_token;

        ws = new WebSocket(`ws://127.0.0.1:8000/api/streaming/alerts?token=${token}`);

        ws.onopen = () => {
          console.log('[WebSocket] Real-time event alert stream connected.');
        };

        ws.onmessage = (event) => {
          try {
            const rawAlert = JSON.parse(event.data);
            const mappedAlert = {
              id: rawAlert.id,
              severity: rawAlert.severity || 'high',
              type: rawAlert.type || 'simulated',
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
          "LEATrace Keyboard Shortcuts:\n" +
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
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main content body */}
        <div 
          className={`flex-1 flex flex-col min-h-screen pb-8 transition-snappy gpu-accelerated pl-0
            ${sidebarOpen ? 'md:pl-64' : 'md:pl-[72px]'}`}
        >
          <Header />
          <main className="flex-1 p-6 mt-16 overflow-y-auto">
            {renderPage()}
          </main>
        </div>
      </div>

      {/* Dynamic Background Task Status Bar */}
      <StatusBar />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
};

export default App;
