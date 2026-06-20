import React, { useState, useEffect } from 'react';
import GraphVisualizer from './components/GraphVisualizer';
import RiskPanel from './components/RiskPanel';
import MonitorPanel from './components/MonitorPanel';
import ReportView from './components/ReportView';
import AntigravityResearch from './components/AntigravityResearch';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default logged in for demo ease
  const [username, setUsername] = useState('admin');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Search state
  const [searchChain, setSearchChain] = useState('BTC');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Active query data
  const [tracedData, setTracedData] = useState(null);
  
  // Dashboard & global metrics state
  const [stats, setStats] = useState({
    totalTracedVolume: { BTC: 0, ETH: 0, SOL: 0, BSC: 0, POL: 0, ADA: 0, AVAX: 0 },
    flaggedAddressesCount: 0,
    monitoredAddressesCount: 0,
    activeAlertTriggered: 0,
    complianceScore: 100,
    recentInvestigations: 0
  });

  const [history, setHistory] = useState([]);
  const [cases, setCases] = useState([]);
  const [alertLogs, setAlertLogs] = useState([]);

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  // Fetch history/cases
  const fetchCases = async () => {
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (e) {
      console.error("Error fetching cases:", e);
    }
  };

  // Fetch alert logs
  const fetchAlertLogs = async () => {
    try {
      const res = await fetch('/api/monitor/logs');
      if (res.ok) {
        const data = await res.json();
        setAlertLogs(data);
      }
    } catch (e) {
      console.error("Error fetching alert logs:", e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCases();
    fetchAlertLogs();
    
    // Poll logs every 10 seconds for dynamic simulation updates
    const interval = setInterval(() => {
      fetchAlertLogs();
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle Search Transaction / Address Tracing
  const handleSearch = async (addr, chainInput) => {
    const targetAddress = addr || searchAddress;
    const targetChain = chainInput || searchChain;
    
    if (!targetAddress || targetAddress.trim().length < 10) {
      setErrorMessage('Please enter a valid blockchain address (min 10 characters).');
      return;
    }
    setErrorMessage('');
    setSearchLoading(true);
    
    try {
      const response = await fetch(`/api/trace/address/${targetChain}/${targetAddress}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze address');
      }
      const data = await response.json();
      setTracedData(data);
      
      // Update local history
      const key = `${targetChain}-${targetAddress}`;
      if (!history.some(item => `${item.chain}-${item.address}` === key)) {
        const newHistoryItem = {
          chain: targetChain,
          address: targetAddress,
          alias: data.details.name,
          riskScore: data.details.riskScore
        };
        setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
      }
      
      // Switch tab to Explorer to view visual map
      setActiveTab('explorer');
    } catch (err) {
      setErrorMessage(err.message || 'Error occurred querying API.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Helper to click suggestion pills
  const handleSuggestionClick = (addr, chain) => {
    setSearchAddress(addr);
    setSearchChain(chain);
    handleSearch(addr, chain);
  };

  // Simulate Block Activity
  const triggerSimulation = async () => {
    try {
      const response = await fetch('/api/monitor/simulate', { method: 'POST' });
      const data = await response.json();
      if (data.triggered) {
        fetchAlertLogs();
        fetchStats();
      } else {
        alert(data.message || 'No active monitor addresses.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save trace to investigation cases
  const saveCurrentCase = async () => {
    if (!tracedData) return;
    const name = prompt('Enter investigation case name:', `Case - ${tracedData.details.name}`);
    if (!name) return;
    
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          chain: tracedData.chain,
          target: tracedData.address,
          notes: `Traced address risk category: ${tracedData.metrics.riskAnalysis.category}`
        })
      });
      if (response.ok) {
        fetchCases();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="app-container">
      {/* Header bar */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-icon">LT</div>
          <h1 className="brand-name">Leat Trace</h1>
          <span className="brand-tag">Compliance v2.4</span>
        </div>
        
        <nav className="nav-links">
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Command Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            🕸️ Trace Graph Explorer
          </button>
          <button 
            className={`nav-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
            🔔 Realtime Monitoring
          </button>
          <button 
            className={`nav-btn ${activeTab === 'compliance' ? 'active' : ''}`}
            onClick={() => setActiveTab('compliance')}
          >
            📋 Compliance Reports
          </button>
          <button 
            className={`nav-btn ${activeTab === 'antigravity' ? 'active' : ''}`}
            onClick={() => setActiveTab('antigravity')}
          >
            ⚛️ Gravity Lab & Reports
          </button>
        </nav>

        <div className="user-badge">
          <div className="user-dot"></div>
          <span className="user-role">{username} (Compliance Officer)</span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="dashboard-grid">
        {/* Left Search Sidebar (constant for all views) */}
        <aside className="glass-panel search-sidebar">
          <div className="sidebar-section">
            <h2 className="sidebar-title">Risk Query Solver</h2>
            
            <div className="form-group">
              <label className="input-label">Select Blockchain</label>
              <select 
                className="select-input"
                value={searchChain} 
                onChange={(e) => setSearchChain(e.target.value)}
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="SOL">Solana (SOL)</option>
                <option value="BSC">Binance Smart Chain (BSC)</option>
                <option value="POL">Polygon (POL)</option>
                <option value="ADA">Cardano (ADA)</option>
                <option value="AVAX">Avalanche (AVAX)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="input-label">Target Wallet Address</label>
              <input 
                type="text" 
                className="text-input" 
                placeholder="Enter address..." 
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {errorMessage && <p style={{ color: 'var(--risk-high)', fontSize: '0.8rem' }}>{errorMessage}</p>}

            <button 
              className="btn-primary" 
              onClick={() => handleSearch()}
              disabled={searchLoading}
            >
              {searchLoading ? 'Resolving Hops...' : '🔎 Trace Address'}
            </button>
          </div>

          <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 className="sidebar-title">Recent Traces</h2>
            <div className="history-list">
              {history.length === 0 ? (
                <p style={{ color: 'var(--text-dark)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', marginTop: '1rem' }}>
                  No recent investigations.
                </p>
              ) : (
                history.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="history-card"
                    onClick={() => handleSuggestionClick(item.address, item.chain)}
                  >
                    <div className="history-info">
                      <span className="history-alias">{item.alias}</span>
                      <span 
                        className="history-badge"
                        style={{
                          background: item.riskScore >= 75 ? 'rgba(239, 68, 68, 0.15)' : item.riskScore >= 40 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: item.riskScore >= 75 ? 'var(--risk-high)' : item.riskScore >= 40 ? 'var(--risk-medium)' : 'var(--risk-low)'
                        }}
                      >
                        Risk {item.riskScore}%
                      </span>
                    </div>
                    <div className="history-address">{item.chain}: {item.address}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h2 className="sidebar-title">Active Investigations</h2>
            <div className="history-list" style={{ maxHeight: '150px' }}>
              {cases.map((c, idx) => (
                <div 
                  key={idx} 
                  className="history-card" 
                  style={{ borderLeft: '3px solid var(--color-primary)' }}
                  onClick={() => handleSuggestionClick(c.target, c.chain)}
                >
                  <div className="history-info">
                    <span className="history-alias" style={{ color: 'var(--color-primary)' }}>{c.name}</span>
                  </div>
                  <div className="history-address">{c.chain}: {c.target}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Dashboard Area (switches based on Active Tab) */}
        <main style={{ minWidth: 0 }}>
          
          {/* TAB 1: COMMAND DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Stat overview cards */}
              <div className="stats-overview-grid">
                <div className="glass-panel stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-info">
                    <span className="stat-label">Traced Volume ({searchChain})</span>
                    <span className="stat-value">
                      {((stats.totalTracedVolume && stats.totalTracedVolume[searchChain]) || 0).toLocaleString()} {searchChain}
                    </span>
                  </div>
                </div>

                <div className="glass-panel stat-card" style={{ borderLeft: '3px solid var(--risk-high)' }}>
                  <div className="stat-icon" style={{ color: 'var(--risk-high)' }}>⚠️</div>
                  <div className="stat-info">
                    <span className="stat-label">Flagged High-Risk WALLETS</span>
                    <span className="stat-value">{stats.flaggedAddressesCount}</span>
                  </div>
                </div>

                <div className="glass-panel stat-card">
                  <div className="stat-icon" style={{ color: 'var(--color-primary)' }}>🔔</div>
                  <div className="stat-info">
                    <span className="stat-label">Monitored Wallets</span>
                    <span className="stat-value">{stats.monitoredAddressesCount} Rules</span>
                  </div>
                </div>

                <div className="glass-panel stat-card">
                  <div className="stat-icon" style={{ color: 'var(--risk-medium)' }}>🛡️</div>
                  <div className="stat-info">
                    <span className="stat-label">AML Compliance Score</span>
                    <span className="stat-value">{stats.complianceScore}%</span>
                  </div>
                </div>
              </div>

              {/* Simulation banner */}
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(13, 20, 38, 0.9) 0%, rgba(20, 10, 50, 0.4) 100%)', border: '1px solid var(--border-accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--color-primary)' }}>
                      AML Transaction Simulation Engine
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Force block listeners to run checks on target rules. Instantly generates simulated multi-hop transfers to trigger alarms.
                    </p>
                  </div>
                  <button className="btn-primary" onClick={triggerSimulation}>
                    🚀 Simulate Block Event
                  </button>
                </div>
              </div>

              {/* Demo Sandbox Wallet suggestion shortcuts */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  💡 Demo Investigation Targets (Select to Trace)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div 
                    className="history-card" 
                    style={{ border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem' }}
                    onClick={() => handleSuggestionClick('1LbcPeel5s9zARansom993vX78cDf', 'BTC')}
                  >
                    <h4 style={{ color: 'var(--risk-high)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔴 BTC LockBit Ransomware
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                      Showcases a dynamic peeling chain where extorted Bitcoin is laundered down.
                    </p>
                    <code style={{ fontSize: '0.75rem', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      1LbcPeel5s9zARansom993vX78cDf
                    </code>
                  </div>

                  <div 
                    className="history-card" 
                    style={{ border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem' }}
                    onClick={() => handleSuggestionClick('0x71c20e241775e5332f143715df332f143789a71b', 'ETH')}
                  >
                    <h4 style={{ color: 'var(--risk-medium)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🟡 ETH Tornado Cash Router
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                      Traces funds routed through an automated sanctioned privacy pool.
                    </p>
                    <code style={{ fontSize: '0.75rem', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      0x71c20e241775e5332...f143789a71b
                    </code>
                  </div>

                  <div 
                    className="history-card" 
                    style={{ border: '1px solid rgba(0, 242, 254, 0.2)', padding: '1rem' }}
                    onClick={() => handleSuggestionClick('HN7c5P28vPj3p83Vz18djs83hV9as8a8d11c8eD', 'SOL')}
                  >
                    <h4 style={{ color: 'var(--color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔵 SOL Mango Markets Exploiter
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                      Solana network asset routing layout following a large-scale DeFi exploit.
                    </p>
                    <code style={{ fontSize: '0.75rem', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      HN7c5P28vPj3p83Vz18djs83hV9as8a8d11c8eD
                    </code>
                  </div>
                </div>
              </div>

              {/* Alert logs table */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                  🚨 Real-Time Compliance Alarms
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Risk Level</th>
                        <th>Network</th>
                        <th>Address</th>
                        <th>Alert Trigger Message</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dark)' }}>
                            No alerts triggered. Set rules in "Realtime Monitoring".
                          </td>
                        </tr>
                      ) : (
                        alertLogs.map((log) => (
                          <tr key={log.id}>
                            <td>
                              <span className={`severity-tag ${log.severity}`}>
                                {log.severity === 'critical' ? '🔴 Critical' : '🟡 Warning'}
                              </span>
                            </td>
                            <td><strong>{log.chain}</strong></td>
                            <td>
                              <a 
                                href="#" 
                                className="addr-link"
                                onClick={(e) => { e.preventDefault(); handleSuggestionClick(log.address, log.chain); }}
                              >
                                {log.address.slice(0, 10)}...{log.address.slice(-6)}
                              </a>
                            </td>
                            <td>{log.message}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRACE GRAPH EXPLORER */}
          {activeTab === 'explorer' && (
            <div className="trace-workspace">
              {tracedData ? (
                <>
                  {/* Left Column: Visualizer graph canvas */}
                  <div className="glass-panel graph-container">
                    <div className="graph-header">
                      <div>
                        <span className="graph-title">🌐 Multi-Hop Money-Flow Map</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>
                          Traced: <code style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{tracedData.address}</code>
                        </span>
                      </div>
                      
                      <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={saveCurrentCase}>
                        💾 Pin to Active Cases
                      </button>
                    </div>

                    <div className="graph-canvas-wrapper">
                      <GraphVisualizer graph={tracedData.graph} rootAddress={tracedData.address} />
                    </div>
                  </div>

                  {/* Right Column: Address information assessment */}
                  <div className="analysis-sidebar">
                    <RiskPanel 
                      riskData={tracedData} 
                      onNodeClick={(addr) => handleSearch(addr, tracedData.chain)} 
                    />
                  </div>
                </>
              ) : (
                <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '3rem' }}>🕸️</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, margin: '1rem 0' }}>
                    Interactive Trace Visualization
                  </h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
                    Query a wallet address in the left sidebar to generate automated traces, map payment flow networks, compute AML metrics, and audit peeling hops.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MONITORING SETTINGS */}
          {activeTab === 'monitoring' && (
            <MonitorPanel 
              alertLogs={alertLogs} 
              onAddressSelect={(addr, chain) => handleSuggestionClick(addr, chain)} 
              onSimulationTrigger={triggerSimulation}
              fetchAlertLogs={fetchAlertLogs}
            />
          )}

          {/* TAB 4: COMPLIANCE AUDIT REPORTS */}
          {activeTab === 'compliance' && (
            <ReportView 
              tracedData={tracedData} 
              cases={cases}
              onLoadCase={(addr, chain) => handleSuggestionClick(addr, chain)}
            />
          )}

          {/* TAB 5: ANTIGRAVITY RESEARCH PLATFORM */}
          {activeTab === 'antigravity' && (
            <AntigravityResearch />
          )}

        </main>
      </div>
    </div>
  );
}
