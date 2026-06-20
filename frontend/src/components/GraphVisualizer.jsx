import React, { useEffect, useRef, useState } from 'react';

export default function GraphVisualizer({ graph, rootAddress }) {
  const canvasRef = useRef(null);
  
  // Graph rendering variables
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);

  // Keep mutables in ref to avoid re-triggering useEffect on animation ticks
  const stateRef = useRef({
    nodes: [],
    links: [],
    draggedNodeId: null,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    mousePos: { x: 0, y: 0 },
    width: 800,
    height: 550,
  });

  // Re-initialize nodes and links whenever props change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width || 800;
    const h = rect.height || 550;
    
    canvas.width = w;
    canvas.height = h;
    stateRef.current.width = w;
    stateRef.current.height = h;

    // Reset pan/zoom
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setSelectedLink(null);

    // Deep copy and map node positions
    const rawNodes = graph?.nodes || [];
    const rawLinks = graph?.links || [];

    // Arrange nodes in circle initially
    const mappedNodes = rawNodes.map((n, idx) => {
      const angle = (idx / rawNodes.length) * Math.PI * 2;
      const radius = Math.min(w, h) * 0.3;
      
      // If root node, place in center
      const isRoot = n.id === rootAddress;
      return {
        ...n,
        x: isRoot ? w / 2 : w / 2 + Math.cos(angle) * radius,
        y: isRoot ? h / 2 : h / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: isRoot ? 24 : 18,
        isRoot
      };
    });

    // Match links with actual objects
    const mappedLinks = rawLinks.map(l => {
      // Handle source/target as strings or objects
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return {
        ...l,
        sourceId,
        targetId,
        particleOffset: Math.random() // offset so particles don't flow together
      };
    });

    stateRef.current.nodes = mappedNodes;
    stateRef.current.links = mappedLinks;

  }, [graph, rootAddress]);

  // Main rendering & layout engine
  useEffect(() => {
    let animFrameId;
    
    const updatePhysicsAndDraw = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { nodes, links, width, height, draggedNodeId } = state;

      // 1. SIMPLE FORCE-DIRECTED PHYSICS ENGINE
      const k = 140; // ideal spring distance
      const gravity = 0.03;
      const friction = 0.75;

      // Repulsion (nodes push each other away)
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (dist < 300) {
            // Repulsion strength
            const force = (5000 / (dist * dist));
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            // Apply equal and opposite forces
            if (n1.id !== draggedNodeId) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (n2.id !== draggedNodeId) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }
      }

      // Attraction (spring forces along links)
      links.forEach(l => {
        const sourceNode = nodes.find(n => n.id === l.sourceId);
        const targetNode = nodes.find(n => n.id === l.targetId);
        if (!sourceNode || !targetNode) return;

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Hooke's Law spring force
        const force = (dist - k) * 0.04;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (sourceNode.id !== draggedNodeId) {
          sourceNode.vx += fx;
          sourceNode.vy += fy;
        }
        if (targetNode.id !== draggedNodeId) {
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      });

      // Gravity towards center & updates positions
      nodes.forEach(n => {
        if (n.id === draggedNodeId) return;

        // Pull to center
        const dx = (width / 2) - n.x;
        const dy = (height / 2) - n.y;
        n.vx += dx * gravity;
        n.vy += dy * gravity;

        // Apply velocities with damping friction
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= friction;
        n.vy *= friction;

        // Border constraints
        n.x = Math.max(50, Math.min(width - 50, n.x));
        n.y = Math.max(50, Math.min(height - 50, n.y));
      });

      // 2. CANVAS DRAWING STAGE
      ctx.clearRect(0, 0, width, height);

      // Save state and apply zoom + pan transformations
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // --- Draw Links (Transactions) ---
      links.forEach(l => {
        const sourceNode = nodes.find(n => n.id === l.sourceId);
        const targetNode = nodes.find(n => n.id === l.targetId);
        if (!sourceNode || !targetNode) return;

        // Draw transaction edge line
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        
        const isSelected = selectedLink && selectedLink.txid === l.txid;
        ctx.strokeStyle = isSelected 
          ? 'var(--color-primary)' 
          : l.isChange 
            ? 'rgba(148, 163, 184, 0.25)' // Change output
            : 'rgba(255, 255, 255, 0.15)'; // General transfer
        
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.setLineDash(l.isChange ? [4, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Draw arrow head at target node boundary
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const angle = Math.atan2(dy, dx);
        const arrowSize = 6;
        const targetRadius = targetNode.radius;
        
        const arrowX = targetNode.x - Math.cos(angle) * targetRadius;
        const arrowY = targetNode.y - Math.sin(angle) * targetRadius;

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - arrowSize * Math.cos(angle - Math.PI / 6), arrowY - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(arrowX - arrowSize * Math.cos(angle + Math.PI / 6), arrowY - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = isSelected ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        // Draw animated glowing particles flowing from source to target
        const particleTime = ((Date.now() / 2500) + l.particleOffset) % 1;
        const px = sourceNode.x + dx * particleTime;
        const py = sourceNode.y + dy * particleTime;
        
        // Particle color based on risk exposure
        const pColor = targetNode.riskScore >= 75 
          ? 'var(--risk-high)' 
          : targetNode.riskScore >= 40 
            ? 'var(--risk-medium)' 
            : 'var(--color-primary)';
            
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = pColor;
        ctx.shadowColor = pColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow glow

        // Draw text amount labels on edge
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.font = '500 9px "JetBrains Mono"';
        ctx.fillStyle = 'var(--text-muted)';
        
        // Show amount text
        const amountStr = `${l.value} ${sourceNode.chain}`;
        const textWidth = ctx.measureText(amountStr).width;
        ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
        ctx.fillRect(-textWidth/2 - 2, -12, textWidth + 4, 11);
        ctx.fillStyle = isSelected ? '#fff' : 'var(--text-muted)';
        ctx.fillText(amountStr, -textWidth/2, -3);
        ctx.restore();
      });

      // --- Draw Nodes ---
      nodes.forEach(n => {
        const isSelected = selectedNode && selectedNode.id === n.id;
        
        // 1. Draw glowing aura ring based on risk score
        const riskColor = n.riskScore >= 75 
          ? 'var(--risk-high)' 
          : n.riskScore >= 40 
            ? 'var(--risk-medium)' 
            : 'var(--risk-low)';

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = riskColor;
        ctx.lineWidth = isSelected ? 3 : n.isRoot ? 2.5 : 1;
        ctx.globalAlpha = isSelected ? 0.8 : n.isRoot ? 0.6 : 0.25;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Add visual radial gradient shadow for premium asset look
        const gradient = ctx.createRadialGradient(n.x, n.y, 1, n.x, n.y, n.radius);
        gradient.addColorStop(0, 'rgba(30, 41, 79, 1)');
        gradient.addColorStop(1, '#060913');
        
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = isSelected ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // 2. Draw Type icons/letters in center
        ctx.font = '800 10px "Outfit"';
        ctx.fillStyle = riskColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let typeInitial = n.type.slice(0, 2).toUpperCase();
        ctx.fillText(typeInitial, n.x, n.y);

        // 3. Draw address labels
        ctx.font = '600 10px "Outfit"';
        ctx.fillStyle = 'var(--text-main)';
        ctx.fillText(n.label, n.x, n.y + n.radius + 15);

        ctx.font = '400 9px "JetBrains Mono"';
        ctx.fillStyle = 'var(--text-muted)';
        const abbrevAddr = `${n.id.slice(0, 6)}...${n.id.slice(-4)}`;
        ctx.fillText(abbrevAddr, n.x, n.y + n.radius + 25);
        
        // Show indicator tag (e.g. OFAC/HACK) if high risk
        if (n.riskScore >= 90) {
          ctx.font = '700 8px "Inter"';
          ctx.fillStyle = 'var(--risk-high)';
          ctx.fillText('🔴 ILLEGITIMATE', n.x, n.y - n.radius - 10);
        }
      });

      ctx.restore();
      
      // Request next frame
      animFrameId = requestAnimationFrame(updatePhysicsAndDraw);
    };

    updatePhysicsAndDraw();

    return () => {
      cancelAnimationFrame(animFrameId);
    };

  }, [zoom, pan, selectedNode, selectedLink]);

  // Handle Pan/Zoom Canvas Interactions
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert screen mouse click to zoomed & panned coordinate
    const targetX = (x - pan.x) / zoom;
    const targetY = (y - pan.y) / zoom;

    const state = stateRef.current;
    state.mousePos = { x, y };

    // Check if user clicked on a node
    const clickedNode = state.nodes.find(n => {
      const dx = n.x - targetX;
      const dy = n.y - targetY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
    });

    if (clickedNode) {
      state.draggedNodeId = clickedNode.id;
      setSelectedNode(clickedNode);
      setSelectedLink(null);
    } else {
      // Check if user clicked a link
      const clickedLink = state.links.find(l => {
        const s = state.nodes.find(n => n.id === l.sourceId);
        const t = state.nodes.find(n => n.id === l.targetId);
        if (!s || !t) return false;
        
        // Calculate distance from point to line segment
        const A = targetX - s.x;
        const B = targetY - s.y;
        const C = t.x - s.x;
        const D = t.y - s.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
          xx = s.x;
          yy = s.y;
        } else if (param > 1) {
          xx = t.x;
          yy = t.y;
        } else {
          xx = s.x + param * C;
          yy = t.y + param * D;
        }
        
        const distance = Math.sqrt((targetX - xx) * (targetX - xx) + (targetY - yy) * (targetY - yy));
        return distance < 8; // selection range
      });

      if (clickedLink) {
        setSelectedLink(clickedLink);
        setSelectedNode(null);
      } else {
        // Drag panning background
        state.isPanning = true;
        state.panStart = { x: x - pan.x, y: y - pan.y };
      }
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const state = stateRef.current;

    if (state.draggedNodeId) {
      const targetNode = state.nodes.find(n => n.id === state.draggedNodeId);
      if (targetNode) {
        // Set new position matching transformed scale
        targetNode.x = (x - pan.x) / zoom;
        targetNode.y = (y - pan.y) / zoom;
      }
    } else if (state.isPanning) {
      setPan({
        x: x - state.panStart.x,
        y: y - state.panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    const state = stateRef.current;
    state.draggedNodeId = null;
    state.isPanning = false;
  };

  // Zoom control wheel handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    setZoom(prev => Math.max(0.4, Math.min(2.5, prev * zoomFactor)));
  };

  const resetViewport = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setSelectedLink(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas 
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ display: 'block', background: 'transparent' }}
      />

      {/* Toolbar Layer */}
      <div className="graph-toolbar">
        <button className="tool-btn" title="Zoom In" onClick={() => setZoom(z => Math.min(2.5, z * 1.1))}>➕</button>
        <button className="tool-btn" title="Zoom Out" onClick={() => setZoom(z => Math.max(0.4, z * 0.9))}>➖</button>
        <button className="tool-btn" title="Reset Viewport" onClick={resetViewport}>🔄</button>
      </div>

      {/* Selected Entity Card HUD */}
      {selectedNode && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(13, 20, 38, 0.95)',
          border: `1px solid ${selectedNode.riskScore >= 75 ? 'var(--risk-high)' : 'rgba(255, 255, 255, 0.1)'}`,
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          maxWidth: '240px',
          zIndex: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#fff', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
            <span>👤 Entity Node Info</span>
          </h4>
          <p style={{ fontWeight: 700, margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--color-primary)' }}>{selectedNode.label}</p>
          <div style={{ display: 'flex', gap: '0.5rem', margin: '0.25rem 0' }}>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.1rem 0.35rem',
              borderRadius: '3px',
              fontWeight: 700,
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-muted)'
            }}>{selectedNode.type}</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.1rem 0.35rem',
              borderRadius: '3px',
              fontWeight: 700,
              background: selectedNode.riskScore >= 75 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: selectedNode.riskScore >= 75 ? 'var(--risk-high)' : 'var(--risk-low)'
            }}>Risk: {selectedNode.riskScore}%</span>
          </div>
          <code style={{ fontSize: '0.7rem', wordBreak: 'break-all', display: 'block', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{selectedNode.id}</code>
        </div>
      )}

      {selectedLink && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(13, 20, 38, 0.95)',
          border: '1px solid var(--color-primary)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          maxWidth: '240px',
          zIndex: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#fff' }}>🔗 Transaction Info</h4>
          <p style={{ fontWeight: 700, margin: '0.2rem 0', fontSize: '0.95rem', color: '#fff' }}>{selectedLink.value} {graph.nodes[0]?.chain}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>Timestamp: {new Date(selectedLink.timestamp).toLocaleTimeString()}</p>
          <code style={{ fontSize: '0.7rem', wordBreak: 'break-all', display: 'block', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Tx: {selectedLink.txid}</code>
        </div>
      )}

      {/* Static Legend Layer */}
      <div className="legend-panel">
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'var(--risk-low)' }}></div>
          <span>Low Risk (&lt;40%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'var(--risk-medium)' }}></div>
          <span>Medium Risk (40-75%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'var(--risk-high)' }}></div>
          <span>High Risk / Sanctioned (&gt;75%)</span>
        </div>
      </div>
    </div>
  );
}
