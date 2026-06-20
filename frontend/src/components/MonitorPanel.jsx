import React, { useState, useEffect } from 'react';

export default function MonitorPanel({ alertLogs, onAddressSelect, onSimulationTrigger, fetchAlertLogs }) {
  const [activeRules, setActiveRules] = useState([]);
  
  // Form input state
  const [ruleChain, setRuleChain] = useState('BTC');
  const [ruleAddress, setRuleAddress] = useState('');
  const [ruleAlias, setRuleAlias] = useState('');
  const [ruleType, setRuleType] = useState('incoming');
  const [ruleThreshold, setRuleThreshold] = useState(1.0);
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch active alerts rules from server
  const fetchRules = async () => {
    try {
      const res = await fetch('/api/monitor/alerts');
      if (res.ok) {
        const data = await res.json();
        setActiveRules(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Save new rule
  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!ruleAddress || ruleAddress.trim().length < 10) {
      setFormError('Please enter a valid target blockchain address.');
      setFormSuccess('');
      return;
    }
    setFormError('');

    try {
      const response = await fetch('/api/monitor/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain: ruleChain,
          address: ruleAddress.trim(),
          alias: ruleAlias.trim() || `Monitored ${ruleChain} Address`,
          type: ruleType,
          threshold: Number(ruleThreshold)
        })
      });
      if (!response.ok) throw new Error('Failed to create alert rule.');
      
      setFormSuccess('Compliance monitor rule registered successfully!');
      setRuleAddress('');
      setRuleAlias('');
      fetchRules();
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Remove rule
  const handleDeleteRule = async (id) => {
    if (!confirm('Are you sure you want to stop monitoring this address?')) return;
    try {
      const response = await fetch(`/api/monitor/alerts/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchRules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="alerts-config-grid">
      {/* Left Column: Form to create rule */}
      <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
          🛡️ Register KYC / KYT Rule
        </h3>
        
        <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="input-label">Blockchain Network</label>
            <select className="select-input" value={ruleChain} onChange={(e) => setRuleChain(e.target.value)}>
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
            <label className="input-label">Compliance Alias Label</label>
            <input 
              type="text" 
              className="text-input" 
              placeholder="e.g. Exploiter 1, LockBit Change Pool..." 
              value={ruleAlias}
              onChange={(e) => setRuleAlias(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Wallet Address to Monitor</label>
            <input 
              type="text" 
              className="text-input" 
              placeholder="Enter exact address..." 
              value={ruleAddress}
              onChange={(e) => setRuleAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Alarm Condition</label>
            <select className="select-input" value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
              <option value="incoming">Incoming Tx Value (Exceeds Threshold)</option>
              <option value="outgoing">Outgoing Tx Value (Exceeds Threshold)</option>
              <option value="balance">Wallet Balance (Exceeds Threshold)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Threshold Value (Coins)</label>
            <input 
              type="number" 
              step="0.001" 
              className="text-input" 
              value={ruleThreshold}
              onChange={(e) => setRuleThreshold(Number(e.target.value))}
            />
          </div>

          {formError && <p style={{ color: 'var(--risk-high)', fontSize: '0.8rem' }}>{formError}</p>}
          {formSuccess && <p style={{ color: 'var(--risk-low)', fontSize: '0.8rem' }}>{formSuccess}</p>}

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            💾 Register Compliance Rule
          </button>
        </form>
      </div>

      {/* Right Column: Active Rules and Log Triggers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Active Rules List */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            🔍 Active Watchlist Rules ({activeRules.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeRules.length === 0 ? (
              <p style={{ color: 'var(--text-dark)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem' }}>
                No active target addresses monitored. Use the registration form to set up surveillance.
              </p>
            ) : (
              activeRules.map((rule) => (
                <div 
                  key={rule.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--color-primary)', color: '#060913', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                        {rule.chain}
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{rule.alias}</strong>
                    </div>
                    <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', margin: '0.2rem 0' }}>
                      {rule.address}
                    </code>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>
                      Trigger: {rule.type} &gt;= {rule.threshold} {rule.chain}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => onAddressSelect(rule.address, rule.chain)}
                    >
                      🕸️ Trace
                    </button>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.35rem 0.5rem', border: '1px solid var(--risk-high)', color: 'var(--risk-high)', background: 'rgba(239, 68, 68, 0.05)' }}
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      🗑️ Stop
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time event log logs */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>
              🚨 Real-Time Compliance Alarms
            </h3>
            <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={onSimulationTrigger}>
              🚀 Simulate Event
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Risk Level</th>
                  <th>Network</th>
                  <th>Monitored Address</th>
                  <th>Alert Message</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {alertLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dark)' }}>
                      No alarm logs triggered yet. Run the block simulation to trigger mock alarms instantly.
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
                        <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                          {log.address.slice(0, 10)}...{log.address.slice(-6)}
                        </code>
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
    </div>
  );
}
