import React, { useState, useRef, useEffect } from 'react';
import { useNavStore, useAuthStore, useBlockchainStore, useCaseStore } from '../../stores';
import { useInvestigationStore } from '../../stores/investigation';
import { Bell, Search, Wifi, Shield, X, FolderPlus, FileUp, Sparkles, Keyboard, Menu, Target, ExternalLink } from 'lucide-react';
import { timeAgo, getSeverityColor } from '../../utils/helpers';

export const Header: React.FC = () => {
  const { sidebarOpen, currentPage, toggleSidebar, setPage, showShortcuts, setShowShortcuts } = useNavStore();
  const { 
    alerts, 
    markAlertRead, 
    markAllAlertsRead, 
    activeTargetAddress, 
    setActiveTarget 
  } = useInvestigationStore();
  const { user } = useAuthStore();
  const { setSearchAddress } = useBlockchainStore();
  const { cases, selectCase } = useCaseStore();

  const [showAlerts, setShowAlerts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const alertRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setShowAlerts(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pageTitle: Record<string, string> = {
    dashboard: 'Intelligence Dashboard',
    cases: 'Case Management',
    blockchain: 'Blockchain Analysis',
    graph: 'Transaction Graph',
    evidence: 'Evidence Vault',
    watchlist: 'Watchlist Monitor',
    alerts: 'Alert Center',
    reports: 'Report Generation',
    ai: 'Cyber Analysis Workspace',
    audit: 'Audit Trail',
    settings: 'Platform Settings',
    incident: 'Incident Response',
  };

  // Search suggestions derived from user input (no hardcoded addresses)
  const searchTargets: { type: string; label: string; id?: string; chain: string; target: string }[] = [];

  const suggestions = searchQuery.trim().length >= 6
    ? searchTargets.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.target.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    useInvestigationStore.getState().setActiveTarget(searchQuery.trim());
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (item: any) => {
    setSearchQuery('');
    setShowSuggestions(false);
    useInvestigationStore.getState().setActiveTarget(item.target);
  };

  return (
    <header className={`fixed top-0 right-0 h-16 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 
      flex items-center justify-between px-4 md:px-6 z-[100] transition-snappy gpu-accelerated left-0
      ${sidebarOpen ? 'md:left-64' : 'md:left-[72px]'}`}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg bg-dark-800 border border-dark-700/50 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors cursor-pointer"
        >
          <Menu size={16} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-semibold text-white truncate max-w-[160px] md:max-w-none">{pageTitle[currentPage] || 'Dashboard'}</h2>
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-[11px] font-mono text-primary-300">
              <Target size={11} className="text-primary-400 animate-pulse" />
              <span>TARGET: {activeTargetAddress.slice(0, 8)}...{activeTargetAddress.slice(-6)}</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-dark-400">
            <span className="flex items-center gap-1"><Wifi size={10} className="text-accent-green" /> CONNECTED</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Shield size={10} className="text-primary-400" /> SECURE SESSION</span>
            <span>•</span>
            <span>{user?.department || 'Cyber Crime Cell'}</span>
          </div>
        </div>
      </div>

      {/* Center — Target Address Search Bar */}
      <div className="flex-1 max-w-md mx-2 sm:mx-8 relative" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Enter target BTC/Crypto address (e.g. 1A1zP1...)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="input-field pl-9 pr-7 py-1.5 sm:py-2 text-xs sm:text-sm w-full font-mono"
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white p-1"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-12 glass-card bg-dark-900/98 max-h-60 overflow-y-auto z-[120] border-dark-700/50 shadow-2xl rounded-xl">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(item)}
                className="w-full text-left px-3 sm:px-4 py-2.5 border-b border-dark-800/50 hover:bg-dark-800/60 transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="font-semibold text-white truncate block">{item.label}</span>
                  <p className="text-[10px] text-dark-400 mono truncate mt-0.5">{item.target}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] bg-dark-800 border border-dark-700 text-primary-400 capitalize font-bold flex-shrink-0">
                  {item.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Quick actions, Status, Alerts */}
      <div className="flex items-center gap-3">
        {/* Quick Actions Shortcuts */}
        <div className="hidden sm:flex items-center bg-dark-800/40 border border-dark-700/50 rounded-lg p-0.5">
          <button 
            onClick={() => setPage('cases')}
            className="p-1.5 rounded hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
            title="Create Case"
          >
            <FolderPlus size={16} />
          </button>
          <button 
            onClick={() => setPage('evidence')}
            className="p-1.5 rounded hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
            title="Catalog Evidence"
          >
            <FileUp size={16} />
          </button>
          <button 
            onClick={() => setPage('ai')}
            className="p-1.5 rounded hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
            title="AI Investigation Workspace"
          >
            <Sparkles size={16} />
          </button>
          <button 
            onClick={() => setShowShortcuts(true)}
            className="p-1.5 rounded hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
            title="Keyboard Shortcuts Guide"
          >
            <Keyboard size={16} />
          </button>
        </div>

        {/* Live Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800/60 border border-dark-700/50">
          <div className="pulse-dot bg-accent-green" />
          <span className="text-[11px] text-dark-300 font-medium">Mainnet Online</span>
        </div>

        {/* Alerts */}
        <div className="relative" ref={alertRef}>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 rounded-lg hover:bg-dark-700/50 text-dark-300 hover:text-white transition-colors cursor-pointer"
            title="Alert Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-accent-red rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Alert Dropdown */}
          {showAlerts && (
            <div className="absolute right-0 top-12 w-96 glass-card bg-dark-950/98 rounded-xl overflow-hidden animate-scale-in shadow-2xl z-[120] border border-dark-700/50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50 bg-dark-900/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Security Alerts</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-accent-red/20 text-accent-red border border-accent-red/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => void markAllAlertsRead()} 
                      className="text-[11px] text-primary-400 hover:text-primary-300 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowAlerts(false)} className="p-1 rounded hover:bg-dark-700/50 text-dark-400 hover:text-white cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-dark-800/60">
                {alerts.length > 0 ? (
                  alerts.slice(0, 6).map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => {
                        void markAlertRead(alert.id);
                        const target = alert.flaggedAddress || alert.walletAddress;
                        if (target) {
                          void setActiveTarget(target);
                        }
                        setShowAlerts(false);
                        setPage('alerts');
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-dark-800/60 transition-colors cursor-pointer block group
                        ${!alert.isRead ? 'bg-dark-800/30' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          alert.severity === 'critical' ? 'bg-accent-red animate-pulse' :
                          alert.severity === 'high' ? 'bg-accent-gold' :
                          alert.severity === 'medium' ? 'bg-primary-400' : 'bg-accent-green'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug line-clamp-2 ${!alert.isRead ? 'text-white font-medium' : 'text-dark-300'}`}>
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                              alert.severity === 'critical' ? 'bg-accent-red/20 text-accent-red border-accent-red/30' :
                              alert.severity === 'high' ? 'bg-accent-gold/20 text-accent-gold border-accent-gold/30' :
                              alert.severity === 'medium' ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' :
                              'bg-accent-green/20 text-accent-green border-accent-green/30'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-[10px] text-dark-500 font-mono">
                              {timeAgo(alert.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-dark-500 italic">
                    No security alerts generated for active investigation.
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-dark-900/60 border-t border-dark-700/50 text-center">
                <button
                  onClick={() => {
                    setShowAlerts(false);
                    setPage('alerts');
                  }}
                  className="text-xs text-primary-400 hover:text-primary-300 font-semibold hover:underline flex items-center justify-center gap-1.5 w-full py-1 cursor-pointer"
                >
                  View All Alerts ({alerts.length}) <ExternalLink size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </header>
  );
};
