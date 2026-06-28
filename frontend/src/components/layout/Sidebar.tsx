import React from 'react';
import { useNavStore, useAuthStore, useAlertStore } from '../../stores';
import {
  LayoutDashboard, Search, FolderOpen, Shield, Eye, FileText, Bell, Settings,
  ClipboardList, LogOut, ChevronLeft, ChevronRight, Hexagon, Activity, Sparkles, Building,
  ShieldAlert
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cases', label: 'Case Management', icon: FolderOpen },
  { id: 'blockchain', label: 'Blockchain Analysis', icon: Search },
  { id: 'graph', label: 'Graph Visualization', icon: Activity },
  { id: 'evidence', label: 'Evidence Vault', icon: Shield },
  { id: 'watchlist', label: 'Watchlist', icon: Eye },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'ai', label: 'AI Workspace', icon: Sparkles },
  { id: 'entities', label: 'Entity Intelligence', icon: Building },
  { id: 'incident', label: 'Incident Response', icon: ShieldAlert },
  { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, currentPage, toggleSidebar, setPage } = useNavStore();
  const { user, logout } = useAuthStore();
  const alerts = useAlertStore((s) => s.alerts);
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <aside
      className={`fixed top-0 h-screen bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50 
        flex flex-col transition-snappy gpu-accelerated z-[110] 
        ${sidebarOpen ? 'w-64 left-0' : 'w-[72px] -left-[72px] md:left-0'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-700/50">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-cyber-teal flex items-center justify-center flex-shrink-0">
          <Hexagon size={20} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold text-white tracking-wide">LEATrace-X</h1>
            <p className="text-[10px] text-dark-400 tracking-widest uppercase">Blockchain Intel</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {sidebarOpen && (
          <p className="text-[10px] text-dark-500 uppercase tracking-widest font-semibold px-3 mb-2">Navigation</p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full nav-item ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-0' : ''}`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <div className="relative">
                <Icon size={18} />
                {item.id === 'alerts' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-red rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-dark-700/50 p-3">
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500/30 to-cyber-purple/30 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary-400">
                {user?.username?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
              <p className="text-[10px] text-dark-400 capitalize">{user?.role || 'investigator'}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-accent-red transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button onClick={logout} className="w-full flex justify-center p-2 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-accent-red transition-colors" title="Logout">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
};
