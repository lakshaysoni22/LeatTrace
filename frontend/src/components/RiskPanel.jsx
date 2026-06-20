import React from 'react';

export default function RiskPanel({ riskData, onNodeClick }) {
  const { details, metrics } = riskData;
  const score = details.riskScore;
  
  // Risk styling helpers
  const getRiskColor = (s) => {
    if (s >= 75) return 'var(--risk-high)';
    if (s >= 40) return 'var(--risk-medium)';
    return 'var(--risk-low)';
  };

  const getRiskLabel = (s) => {
    if (s >= 90) return 'CRITICAL / OFAC SANCTIONED';
    if (s >= 75) return 'HIGH RISK / AML ALERT';
    if (s >= 40) return 'MEDIUM RISK / MONITOR';
    return 'LOW RISK / COMPLIANT';
  };

  // SVG gauge computations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexTarget: 'column', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Risk Gauge Card */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="card-header">🛡️ AML Risk Evaluation</div>
        <div className="card-body">
          <div className="risk-gauge-container">
            <svg className="risk-circle-svg" viewBox="0 0 120 120">
              <circle className="risk-circle-bg" cx="60" cy="60" r={radius} />
              <circle 
                className="risk-circle-value" 
                cx="60" 
                cy="60" 
                r={radius} 
                stroke={getRiskColor(score)}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="risk-score-text">
              <span className="risk-number" style={{ color: getRiskColor(score) }}>{score}</span>
              <span className="risk-percent">SCORE</span>
            </div>
          </div>
          
          <div 
            className="risk-label-badge"
            style={{
              background: score >= 75 ? 'rgba(239, 68, 68, 0.15)' : score >= 40 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: getRiskColor(score),
              border: `1px solid ${getRiskColor(score)}`
            }}
          >
            {getRiskLabel(score)}
          </div>
        </div>
      </div>

      {/* 2. Wallet Profile Metrics */}
      <div className="glass-panel">
        <div className="card-header">📊 Wallet Profile Dossier</div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Entity Label:</span>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{details.name}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Entity Category:</span>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: getRiskColor(score) }}>{details.type}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Received:</span>
            <span style={{ fontWeight: 500, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{metrics.totalReceived}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Sent:</span>
            <span style={{ fontWeight: 500, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{metrics.totalSent}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Available Balance:</span>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{metrics.balance}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Traced Hops:</span>
            <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>4 Levels Evaluated</span>
          </div>

        </div>
      </div>

      {/* 3. Heuristic Flags & Indicators */}
      <div className="glass-panel">
        <div className="card-header">🛡️ AML / CTF Alert Triggers</div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          <div style={{
            padding: '0.75rem',
            borderRadius: '6px',
            background: score >= 75 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${score >= 75 ? 'var(--risk-high)' : 'var(--border-light)'}`,
            fontSize: '0.8rem'
          }}>
            <h5 style={{ fontWeight: 700, marginBottom: '0.1rem', color: score >= 75 ? 'var(--risk-high)' : '#fff' }}>Mixer Smart Contract Exposure</h5>
            <p style={{ color: 'var(--text-muted)' }}>{metrics.riskAnalysis.directExposure}</p>
          </div>

          <div style={{
            padding: '0.75rem',
            borderRadius: '6px',
            background: score >= 40 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${score >= 40 ? 'var(--risk-medium)' : 'var(--border-light)'}`,
            fontSize: '0.8rem'
          }}>
            <h5 style={{ fontWeight: 700, marginBottom: '0.1rem', color: score >= 40 ? 'var(--risk-medium)' : '#fff' }}>Indirect Entity Exposure</h5>
            <p style={{ color: 'var(--text-muted)' }}>{metrics.riskAnalysis.indirectExposure}</p>
          </div>

          <div style={{
            padding: '0.75rem',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.02)',
            borderLeft: '3px solid var(--border-light)',
            fontSize: '0.8rem'
          }}>
            <h5 style={{ fontWeight: 700, marginBottom: '0.1rem' }}>Peeling Chain Behavior</h5>
            <p style={{ color: 'var(--text-muted)' }}>
              {score >= 75 ? 'Detected multiple serial split-outputs with identical change ratios.' : 'No peeling structure identified.'}
            </p>
          </div>

        </div>
      </div>

      {/* 4. Neighbors / Hops explorer */}
      <div className="glass-panel">
        <div className="card-header">🔁 Immediate Flow Nodes</div>
        <div className="card-body" style={{ padding: '0.75rem' }}>
          <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {riskData.graph.nodes
              .filter(n => n.id !== riskData.address)
              .map((n, idx) => (
                <div 
                  key={idx} 
                  className="history-card" 
                  style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => onNodeClick(n.id)}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.label}</div>
                    <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{n.id.slice(0, 12)}...</code>
                  </div>
                  <span 
                    className="history-badge"
                    style={{
                      background: n.riskScore >= 75 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: n.riskScore >= 75 ? 'var(--risk-high)' : 'var(--risk-low)'
                    }}
                  >
                    {n.riskScore}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

    </div>
  );
}
