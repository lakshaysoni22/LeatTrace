import React, { useState, useEffect, useRef } from 'react';

export default function AntigravityResearch() {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  
  // Security & RBAC state
  const [activeRole, setActiveRole] = useState('Compliance Officer');
  const [username, setUsername] = useState('admin');
  const [jwtToken, setJwtToken] = useState('');
  
  // Database States
  const [theories, setTheories] = useState([]);
  const [papers, setPapers] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [researchers, setResearchers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // UI States
  const [activeTheoryId, setActiveTheoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // AI Assistant States
  const [aiAction, setAiAction] = useState('summarize');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  // Summarize input
  const [selectedPaperId, setSelectedPaperId] = useState('');
  // Compare inputs
  const [compareTheoryId1, setCompareTheoryId1] = useState('');
  const [compareTheoryId2, setCompareTheoryId2] = useState('');
  // Plan experiment inputs
  const [expTheoryTitle, setExpTheoryTitle] = useState('Alcubierre Warp Field Metric');
  const [expParameterVal, setExpParameterVal] = useState('Gap = 150nm');
  const [expRiskLevel, setExpRiskLevel] = useState('Safe');
  // Hypothesis tracker inputs
  const [hypoDescription, setHypoDescription] = useState('Superconducting YBCO disk generates local shielding when rotated at 5000 RPM');
  const [hypoPathway, setHypoPathway] = useState('Electromagnetism-Gravity Coupling');
  const [hypoIsExotic, setHypoIsExotic] = useState(false);
  const [hypotheses, setHypotheses] = useState([
    { id: 'h1', description: 'RF Cavity resonance compresses virtual particles to induce local gravity gradients', pathway: 'Vacuum Energy Coupling', viability: 62, status: 'Simulated' },
    { id: 'h2', description: 'Bismuth-Zinc asymmetric capacitor generates thrust through graviton deflection', pathway: 'Electrode Mass Shielding', viability: 8, status: 'Rejected' }
  ]);

  // Forms inputs
  const [newPaper, setNewPaper] = useState({ title: '', author: '', category: 'Speculative Theories', year: 2026, journal: '', summary: '', viabilityScore: 50, gravityClass: 'Speculative' });
  const [newExperiment, setNewExperiment] = useState({ title: '', status: 'In Progress', yield: '0.0 W', parameters: '', results: '', safetyLevel: 'Safe', gravityClass: 'Speculative' });

  // Telemetry Dashboard Stats
  const [telemetry, setTelemetry] = useState({
    activeTheories: 10,
    completedSims: 0,
    safetyStatus: 'Nominal',
    negativeEnergyGen: '0.0 eV/m³',
    casimirPressure: '0.0 Pa',
    provenCount: 0,
    speculativeCount: 0
  });

  // Simulator Settings States
  // 1. Spacetime Curvature
  const [simG, setSimG] = useState(1.5);
  const [simMass, setSimMass] = useState(1.2);
  const [simTension, setSimTension] = useState(80);
  const [isRepulsive, setIsRepulsive] = useState(false);
  // 2. Warp Drive
  const [warpVelocity, setWarpVelocity] = useState(1.0);
  const [warpBubbleThickness, setWarpBubbleThickness] = useState(0.5);
  const [warpExoticMatterMass, setWarpExoticMatterMass] = useState(500); // Solar masses equivalent
  // 3. Casimir Plates
  const [casimirGap, setCasimirGap] = useState(300); // nanometers
  const [casimirArea, setCasimirArea] = useState(10); // cm^2
  const [casimirMeasuredForce, setCasimirMeasuredForce] = useState(0);

  // Refs for Canvases
  const spacetimeCanvasRef = useRef(null);
  const warpCanvasRef = useRef(null);
  const casimirCanvasRef = useRef(null);
  const graphCanvasRef = useRef(null);

  // Handle Authentication / Role switching
  const handleRoleChange = async (newRole) => {
    let targetUser = '';
    let targetPass = '';

    if (newRole === 'Lead Physicist') {
      targetUser = 'physicist';
      targetPass = 'antigravity2026';
    } else if (newRole === 'Speculative Theorist') {
      targetUser = 'theorist';
      targetPass = 'antigravity2026';
    } else if (newRole === 'Compliance Officer') {
      targetUser = 'admin';
      targetPass = 'leattrace2026';
    }

    try {
      setErrorMessage('');
      const res = await fetch('/api/auth/antigravity-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser, password: targetPass })
      });
      if (res.ok) {
        const data = await res.json();
        setJwtToken(data.token);
        setActiveRole(data.user.role);
        setUsername(data.user.username);
        localStorage.setItem('antigravity_token', data.token);
        localStorage.setItem('antigravity_role', data.user.role);
        localStorage.setItem('antigravity_username', data.user.username);
        setSuccessMessage(`Role successfully updated to: ${data.user.role}`);
        setTimeout(() => setSuccessMessage(''), 3000);
        // Refresh registry
        fetchRegistryData(data.token);
      } else {
        const err = await res.json();
        setErrorMessage(err.message || 'Authentication failed');
      }
    } catch (e) {
      setErrorMessage('Network connection error when logging in');
    }
  };

  // Fetch registries
  const fetchRegistryData = async (token = jwtToken) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      setLoading(true);
      // Fetch theories
      const resTheories = await fetch('/api/antigravity/theories');
      const dataTheories = resTheories.ok ? await resTheories.json() : [];
      setTheories(dataTheories);

      // Fetch papers
      const resPapers = await fetch('/api/antigravity/papers');
      const dataPapers = resPapers.ok ? await resPapers.json() : [];
      setPapers(dataPapers);

      // Fetch experiments
      const resExp = await fetch('/api/antigravity/experiments');
      const dataExp = resExp.ok ? await resExp.json() : [];
      setExperiments(dataExp);

      // Fetch simulations
      const resSims = await fetch('/api/antigravity/simulations');
      const dataSims = resSims.ok ? await resSims.json() : [];
      setSimulations(dataSims);

      // Fetch researchers
      const resResearchers = await fetch('/api/antigravity/researchers');
      const dataResearchers = resResearchers.ok ? await resResearchers.json() : [];
      setResearchers(dataResearchers);

      // Fetch audit logs (only if Lead Physicist or Compliance Officer)
      const curRole = token ? parseJwtRole(token) : activeRole;
      if (curRole === 'Lead Physicist' || curRole === 'Compliance Officer') {
        const resAudit = await fetch('/api/antigravity/audit-logs', { headers });
        const dataAudit = resAudit.ok ? await resAudit.json() : [];
        setAuditLogs(dataAudit);
      }

      // Compute statistics summary for telemetry
      const proven = dataTheories.filter(t => t.category === 'Proven Physics').length;
      const spec = dataTheories.filter(t => t.category === 'Speculative Theories').length;
      
      setTelemetry(prev => ({
        ...prev,
        activeTheories: dataTheories.length,
        completedSims: dataSims.length,
        provenCount: proven,
        speculativeCount: spec
      }));

      // Set default options for dropdowns if available
      if (dataPapers.length > 0) setSelectedPaperId(dataPapers[0].id);
      if (dataTheories.length > 1) {
        setCompareTheoryId1(dataTheories[0].id);
        setCompareTheoryId2(dataTheories[1].id);
      }

    } catch (e) {
      console.error(e);
      setErrorMessage('Failed to connect to backend api. Mock local rendering fallback active.');
    } finally {
      setLoading(false);
    }
  };

  // Parsing helper
  const parseJwtRole = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload).role;
    } catch (e) {
      return 'Guest';
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('antigravity_token');
    const savedRole = localStorage.getItem('antigravity_role');
    const savedUser = localStorage.getItem('antigravity_username');

    if (savedToken) {
      setJwtToken(savedToken);
      setActiveRole(savedRole || 'Compliance Officer');
      setUsername(savedUser || 'admin');
      fetchRegistryData(savedToken);
    } else {
      // Auto login compliance officer on startup
      handleRoleChange('Compliance Officer');
    }
  }, []);

  // Save new paper
  const handleAddPaper = async (e) => {
    e.preventDefault();
    if (!newPaper.title || !newPaper.author) {
      alert('Please fill out Title and Author');
      return;
    }

    try {
      const res = await fetch('/api/antigravity/papers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(newPaper)
      });

      if (res.ok) {
        setNewPaper({ title: '', author: '', category: 'Speculative Theories', year: 2026, journal: '', summary: '', viabilityScore: 50, gravityClass: 'Speculative' });
        setSuccessMessage('Research paper successfully logged in Vault.');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchRegistryData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add paper');
      }
    } catch (e) {
      alert('Network error saving paper.');
    }
  };

  // Log new experiment
  const handleAddExperiment = async (e) => {
    e.preventDefault();
    if (!newExperiment.title) {
      alert('Please enter experiment title');
      return;
    }

    try {
      const res = await fetch('/api/antigravity/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(newExperiment)
      });

      if (res.ok) {
        setNewExperiment({ title: '', status: 'In Progress', yield: '0.0 W', parameters: '', results: '', safetyLevel: 'Safe', gravityClass: 'Speculative' });
        setSuccessMessage('Physical experiment logged.');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchRegistryData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to log experiment');
      }
    } catch (e) {
      alert('Network error logging experiment.');
    }
  };

  // Save simulation configuration
  const handleSaveSimulation = async (simName, params, resText) => {
    if (!simName) {
      alert('Please enter a name for the simulation configuration.');
      return;
    }

    try {
      const res = await fetch('/api/antigravity/simulations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          title: simName,
          parameters: params,
          results: resText
        })
      });

      if (res.ok) {
        setSuccessMessage(`Simulation "${simName}" saved successfully.`);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchRegistryData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save simulation configuration');
      }
    } catch (e) {
      alert('Network error saving simulation.');
    }
  };

  // Trigger AI assistant action
  const handleAiAction = async () => {
    setAiLoading(true);
    setAiResponse('');
    
    let payload = {};
    if (aiAction === 'summarize') {
      const p = papers.find(item => item.id === selectedPaperId);
      if (!p) {
        setAiResponse('Please select a paper first.');
        setAiLoading(false);
        return;
      }
      payload = { title: p.title, author: p.author, category: p.category, viabilityScore: p.viabilityScore, gravityClass: p.gravityClass };
    } else if (aiAction === 'compare') {
      const t1 = theories.find(item => item.id === compareTheoryId1);
      const t2 = theories.find(item => item.id === compareTheoryId2);
      if (!t1 || !t2) {
        setAiResponse('Select two theories to compare.');
        setAiLoading(false);
        return;
      }
      payload = { theory1: t1, theory2: t2 };
    } else if (aiAction === 'plan-experiment') {
      payload = { theoryTitle: expTheoryTitle, parameterVal: expParameterVal, riskLevel: expRiskLevel };
    } else if (aiAction === 'track-hypothesis') {
      payload = { description: hypoDescription, pathway: hypoPathway, isExotic: hypoIsExotic };
      // Save local hypothesis instantly
      const newHyp = {
        id: 'h_' + Math.random().toString(36).substring(2, 9),
        description: hypoDescription,
        pathway: hypoPathway,
        viability: hypoIsExotic ? Math.floor(Math.random() * 20) + 2 : Math.floor(Math.random() * 35) + 40,
        status: 'Registered'
      };
      setHypotheses(prev => [newHyp, ...prev]);
    }

    try {
      const res = await fetch('/api/antigravity/ai-assistant/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ action: aiAction, payload })
      });

      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.response);
      } else {
        const err = await res.json();
        setAiResponse(`### [AI ERROR]\nAccess denied or rate limit encountered: ${err.error || 'Server error'}`);
      }
    } catch (e) {
      setAiResponse('### [NETWORK ERROR]\nFailed to communicate with AI sub-agent.');
    } finally {
      setAiLoading(false);
    }
  };

  // --- RENDERING CANVAS ANIMATION: KNOWLEDGE NETWORK (Dashboard) ---
  useEffect(() => {
    if (activeSubTab !== 'dashboard' || loading || theories.length === 0) return;
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame;
    canvas.width = canvas.parentElement.clientWidth || 500;
    canvas.height = 280;

    const width = canvas.width;
    const height = canvas.height;

    // Define 8 key physics nodes
    const nodes = theories.map((t, idx) => {
      const angle = (idx / theories.length) * Math.PI * 2;
      const radius = 90;
      return {
        id: t.id,
        label: t.title,
        category: t.category,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: 12
      };
    });

    // Central core node represents Gravity Control Unified Theory
    nodes.push({
      id: 'unified',
      label: 'Quantum Gravitodynamics',
      category: 'Unified Target',
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      radius: 20
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw spatial mesh grid lines in background
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.03)';
      ctx.lineWidth = 1;
      const spacing = 20;
      for (let x = 0; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw connection lines to center
      nodes.forEach(n => {
        if (n.id === 'unified') return;
        
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(width / 2, height / 2);
        
        // Link color based on category
        ctx.strokeStyle = n.category === 'Proven Physics' 
          ? 'rgba(16, 185, 129, 0.15)' 
          : n.category === 'Experimental Physics'
            ? 'rgba(245, 158, 11, 0.15)'
            : 'rgba(244, 63, 94, 0.15)';
            
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Particle pulse along connection line
        const time = (Date.now() / 2000 + n.x * 0.05) % 1;
        const px = n.x + (width / 2 - n.x) * time;
        const py = n.y + (height / 2 - n.y) * time;
        
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = n.category === 'Proven Physics' ? 'var(--color-proven)' : n.category === 'Experimental Physics' ? 'var(--color-experimental)' : 'var(--color-speculative)';
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach(n => {
        // Pulse radius for central node
        const nodeRad = n.id === 'unified' 
          ? n.radius + Math.sin(Date.now() / 300) * 2 
          : n.radius;

        // Radial gradient fill
        const grad = ctx.createRadialGradient(n.x, n.y, 2, n.x, n.y, nodeRad);
        if (n.id === 'unified') {
          grad.addColorStop(0, '#a55eed');
          grad.addColorStop(1, '#070a13');
        } else {
          grad.addColorStop(0, n.category === 'Proven Physics' ? 'rgba(16, 185, 129, 0.8)' : n.category === 'Experimental Physics' ? 'rgba(245, 158, 11, 0.8)' : 'rgba(244, 63, 94, 0.8)');
          grad.addColorStop(1, '#0c1020');
        }

        // Glow boundary
        ctx.shadowColor = n.id === 'unified' ? '#9d4edd' : n.category === 'Proven Physics' ? 'var(--color-proven)' : n.category === 'Experimental Physics' ? 'var(--color-experimental)' : 'var(--color-speculative)';
        ctx.shadowBlur = n.id === 'unified' ? 12 : 6;

        ctx.beginPath();
        ctx.arc(n.x, n.y, nodeRad, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = n.id === 'unified' ? '#9d4edd' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset glow

        // Labels
        ctx.font = '600 8px "Outfit"';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(n.label.slice(0, 16), n.x, n.y + nodeRad + 12);
      });

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, [activeSubTab, loading, theories]);

  // --- RENDERING CANVAS ANIMATION: SPACETIME GRID SIMULATOR ---
  useEffect(() => {
    if (activeSubTab !== 'simulations') return;
    const canvas = spacetimeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame;
    canvas.width = canvas.parentElement.clientWidth || 600;
    canvas.height = 460;

    const w = canvas.width;
    const h = canvas.height;

    // Mass object (central star)
    let star = {
      x: w / 2,
      y: h / 2,
      mass: simMass * 100, // scaled
      isRepulsive: isRepulsive
    };

    // Satellite object
    let satellite = {
      x: w / 2,
      y: h / 2 - 120,
      vx: 2.2, // initial tangential velocity
      vy: 0,
      trail: []
    };

    const drawCurvature = () => {
      // Clear background
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, 0, w, h);

      star.mass = simMass * 120;
      star.isRepulsive = isRepulsive;

      // 1. Draw 3D-mesh representing distorted spacetime fabric
      const cols = 22;
      const rows = 16;
      const cellW = w / cols;
      const cellH = h / rows;

      ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
      ctx.lineWidth = 0.8;

      // Draw rows
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const origX = c * cellW;
          const origY = r * cellH;

          // Calculate displacement from mass
          const dx = origX - star.x;
          const dy = origY - star.y;
          const distSq = dx * dx + dy * dy + 3000;
          const dist = Math.sqrt(distSq);

          // Curvature distortion scaling. Speculative negative mass bends grid upwards!
          const scale = star.isRepulsive ? -1.0 : 1.0;
          const warpDepth = (star.mass * 85) / dist * scale;
          const pullAngle = Math.atan2(dy, dx);

          // Displace mesh vertices toward gravity well (or away if repulsive)
          const dispX = origX - Math.cos(pullAngle) * Math.min(dist * 0.4, Math.abs(warpDepth) * 0.35) * (star.isRepulsive ? -1 : 1);
          const dispY = origY - Math.sin(pullAngle) * Math.min(dist * 0.4, Math.abs(warpDepth) * 0.35) * (star.isRepulsive ? -1 : 1);

          if (c === 0) {
            ctx.moveTo(dispX, dispY);
          } else {
            ctx.lineTo(dispX, dispY);
          }
        }
        ctx.stroke();
      }

      // Draw columns
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        for (let r = 0; r <= rows; r++) {
          const origX = c * cellW;
          const origY = r * cellH;

          const dx = origX - star.x;
          const dy = origY - star.y;
          const distSq = dx * dx + dy * dy + 3000;
          const dist = Math.sqrt(distSq);

          const scale = star.isRepulsive ? -1.0 : 1.0;
          const warpDepth = (star.mass * 85) / dist * scale;
          const pullAngle = Math.atan2(dy, dx);

          const dispX = origX - Math.cos(pullAngle) * Math.min(dist * 0.4, Math.abs(warpDepth) * 0.35) * (star.isRepulsive ? -1 : 1);
          const dispY = origY - Math.sin(pullAngle) * Math.min(dist * 0.4, Math.abs(warpDepth) * 0.35) * (star.isRepulsive ? -1 : 1);

          if (r === 0) {
            ctx.moveTo(dispX, dispY);
          } else {
            ctx.lineTo(dispX, dispY);
          }
        }
        ctx.stroke();
      }

      // 2. Physics calculation for Satellite Orbit
      const dx = satellite.x - star.x;
      const dy = satellite.y - star.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq) || 1;

      // Newtonian gravity force simulation: F = G * M * m / r^2
      // Acceleration a = G * M / r^2
      // G constant is adjustable
      const gravityMagnitude = (simG * (star.mass * 0.8)) / (distSq + 200);
      const angle = Math.atan2(dy, dx);

      // Repulsion flips gravity force
      const forceDirection = star.isRepulsive ? 1.0 : -1.0;
      satellite.vx += Math.cos(angle) * gravityMagnitude * forceDirection;
      satellite.vy += Math.sin(angle) * gravityMagnitude * forceDirection;

      satellite.x += satellite.vx;
      satellite.y += satellite.vy;

      // Reset satellite if it crashes or flies away
      if (dist < 15 || dist > w * 1.5) {
        satellite.x = w / 2;
        satellite.y = h / 2 - 120;
        satellite.vx = star.isRepulsive ? -1.5 : Math.sqrt((simG * (star.mass * 0.8)) / 120) * 1.05; // circular orbit speed estimate
        satellite.vy = 0;
        satellite.trail = [];
      }

      // Update trail
      satellite.trail.push({ x: satellite.x, y: satellite.y });
      if (satellite.trail.length > 60) satellite.trail.shift();

      // 3. Drawing: Orbit Trail
      ctx.beginPath();
      satellite.trail.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. Drawing: Satellite Node
      ctx.beginPath();
      ctx.arc(satellite.x, satellite.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'var(--color-primary)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 5. Drawing: Central Warp Source (The heavy mass)
      const grad = ctx.createRadialGradient(star.x, star.y, 2, star.x, star.y, star.isRepulsive ? 20 : 25);
      if (star.isRepulsive) {
        grad.addColorStop(0, 'rgba(244, 63, 94, 0.9)'); // Speculative repelling energy
        grad.addColorStop(0.5, 'rgba(244, 63, 94, 0.4)');
        grad.addColorStop(1, 'transparent');
        ctx.shadowColor = 'var(--color-speculative)';
        ctx.shadowBlur = 20;
      } else {
        grad.addColorStop(0, '#00f2fe'); // Cyan gravity well
        grad.addColorStop(0.3, 'rgba(0, 242, 254, 0.3)');
        grad.addColorStop(1, 'transparent');
        ctx.shadowColor = 'var(--color-primary)';
        ctx.shadowBlur = 20;
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.isRepulsive ? 20 : 25, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw negative mass sign or positive mass core
      ctx.font = '800 12px "Outfit"';
      ctx.fillStyle = star.isRepulsive ? 'var(--color-speculative)' : 'var(--color-primary)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(star.isRepulsive ? '-M' : '+M', star.x, star.y);

      animFrame = requestAnimationFrame(drawCurvature);
    };

    drawCurvature();
    return () => cancelAnimationFrame(animFrame);
  }, [activeSubTab, simG, simMass, isRepulsive]);

  // --- RENDERING CANVAS ANIMATION: WARP FIELD SIMULATOR ---
  useEffect(() => {
    if (activeSubTab !== 'simulations') return;
    const canvas = warpCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame;
    canvas.width = canvas.parentElement.clientWidth || 600;
    canvas.height = 460;

    const w = canvas.width;
    const h = canvas.height;

    // Particle streams flowing around the bubble representing spacetime contraction
    const particles = [];
    const numParticles = 40;
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: (Math.random() * 2 + 1) * warpVelocity
      });
    }

    const drawWarpField = () => {
      // Dark space background
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, w, h);

      // Center coords (Ship location)
      const shipX = w / 2;
      const shipY = h / 2;
      const bubbleRadius = 90;

      // Space grid warp calculation
      // Grid lines contract in front (x > shipX) and expand behind (x < shipX)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 0.7;

      const gridSpacing = 24;

      // Render vertical warped grid lines
      for (let x = 0; x < w; x += gridSpacing) {
        ctx.beginPath();
        for (let y = 0; y < h; y += 10) {
          const dx = x - shipX;
          const dy = y - shipY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let warpedX = x;
          // Inside bubble border, spacetime is contracted or expanded
          if (dist < bubbleRadius) {
            // Smooth transition bubble shaping function f(r)
            const f_r = 1 - (dist / bubbleRadius);
            
            // Front side (right) contracts spacetime: drag grid lines closer
            if (dx > 0) {
              warpedX = x - dx * f_r * 0.45 * (warpVelocity / 2);
            } 
            // Back side (left) expands spacetime: push grid lines apart
            else {
              warpedX = x - dx * f_r * 0.55 * (warpVelocity / 2);
            }
          }

          if (y === 0) ctx.moveTo(warpedX, y);
          else ctx.lineTo(warpedX, y);
        }
        ctx.stroke();
      }

      // Render horizontal lines
      for (let y = 0; y < h; y += gridSpacing) {
        ctx.beginPath();
        for (let x = 0; x < w; x += 10) {
          const dx = x - shipX;
          const dy = y - shipY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let warpedY = y;
          if (dist < bubbleRadius) {
            const f_r = 1 - (dist / bubbleRadius);
            // vertical contraction/expansion is symmetrical
            warpedY = y - dy * f_r * 0.3 * (warpVelocity / 2);
          }

          if (x === 0) ctx.moveTo(x, warpedY);
          else ctx.lineTo(x, warpedY);
        }
        ctx.stroke();
      }

      // Draw contraction & expansion bubble halo boundaries
      // Front (Compression zone - Blue glow)
      const frontGrad = ctx.createRadialGradient(shipX + 50, shipY, 5, shipX + 50, shipY, 70);
      frontGrad.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
      frontGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(shipX + 45, shipY, 70, -Math.PI/2, Math.PI/2);
      ctx.fillStyle = frontGrad;
      ctx.fill();

      // Back (Expansion zone - Red glow)
      const backGrad = ctx.createRadialGradient(shipX - 50, shipY, 5, shipX - 50, shipY, 70);
      backGrad.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
      backGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(shipX - 45, shipY, 70, Math.PI/2, -Math.PI/2);
      ctx.fillStyle = backGrad;
      ctx.fill();

      // Particle simulation flow
      particles.forEach(p => {
        // Move particle leftward to show forward ship velocity
        p.x -= p.speed * 1.5;
        if (p.x < 0) {
          p.x = w;
          p.y = Math.random() * h;
        }

        const dx = p.x - shipX;
        const dy = p.y - shipY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let drawX = p.x;
        let drawY = p.y;

        // Animate particles flowing around the Alcubierre bubble boundary
        if (dist < bubbleRadius) {
          const angle = Math.atan2(dy, dx);
          // Push particles outwards along boundary
          drawX = shipX + Math.cos(angle) * (bubbleRadius + 5);
          drawY = shipY + Math.sin(angle) * (bubbleRadius + 5);
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, 2, 0, Math.PI * 2);
        // Particle color changes from red behind to blue in front
        ctx.fillStyle = p.x > shipX ? '#00f2fe' : '#f43f5e';
        ctx.fill();
      });

      // Draw the Spaceship HUD in the middle flat spacetime region
      ctx.beginPath();
      ctx.arc(shipX, shipY, 15, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = 'var(--color-primary)';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Inside ship symbol
      ctx.font = '800 9px "Outfit"';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NAV', shipX, shipY);

      // Render Warp Field parameters in HUD overlay
      ctx.font = '600 10px "JetBrains Mono"';
      ctx.fillStyle = 'var(--color-primary)';
      ctx.textAlign = 'left';
      ctx.fillText(`VELOCITY: ${warpVelocity.toFixed(2)}c (SUBLUMINAL)`, 20, 30);
      
      const massReq = (warpExoticMatterMass * Math.pow(warpVelocity, 2) * warpBubbleThickness).toFixed(0);
      ctx.fillText(`EST. EXOTIC MASS REQ: -${massReq} M_solar`, 20, 50);

      ctx.fillStyle = 'var(--color-speculative)';
      ctx.fillText('STATUS: SPECULATIVE PHYSICS METRIC', 20, 70);

      animFrame = requestAnimationFrame(drawWarpField);
    };

    drawWarpField();
    return () => cancelAnimationFrame(animFrame);
  }, [activeSubTab, warpVelocity, warpBubbleThickness, warpExoticMatterMass]);

  // --- RENDERING CANVAS ANIMATION: CASIMIR PLATE SIMULATOR ---
  useEffect(() => {
    if (activeSubTab !== 'simulations') return;
    const canvas = casimirCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame;
    canvas.width = canvas.parentElement.clientWidth || 600;
    canvas.height = 460;

    const w = canvas.width;
    const h = canvas.height;

    // Virtual particle pairs spawning and dying
    let virtualParticles = [];

    const drawCasimirPlates = () => {
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, w, h);

      // Map slider gap (100 to 500nm) to screen pixels (50 to 220px)
      const scaleX = (casimirGap - 100) / 400; // 0 to 1
      const plateDistance = 50 + scaleX * 170; // gap in pixels

      const plate1X = (w / 2) - (plateDistance / 2);
      const plate2X = (w / 2) + (plateDistance / 2);

      const plateW = 15;
      const plateH = 220;
      const plateY = (h / 2) - (plateH / 2);

      // 1. Spawning virtual particles dynamically
      // Inside gap: lower probability, restricted wave modes
      // Outside gap: higher density
      if (Math.random() < 0.35) {
        // Spawn outside Left
        virtualParticles.push({
          x: Math.random() * (plate1X - 10) + 5,
          y: Math.random() * (h - 20) + 10,
          size: Math.random() * 3 + 1,
          life: 1.0,
          decay: Math.random() * 0.05 + 0.02,
          color: 'rgba(0, 242, 254, 0.45)'
        });
      }
      if (Math.random() < 0.35) {
        // Spawn outside Right
        virtualParticles.push({
          x: Math.random() * (w - plate2X - 25) + plate2X + plateW + 5,
          y: Math.random() * (h - 20) + 10,
          size: Math.random() * 3 + 1,
          life: 1.0,
          decay: Math.random() * 0.05 + 0.02,
          color: 'rgba(0, 242, 254, 0.45)'
        });
      }

      // Spawning inside gap depends heavily on gap width.
      // Small gaps block large virtual modes (longer wavelengths)
      if (Math.random() < (scaleX * 0.35 + 0.05)) {
        virtualParticles.push({
          x: Math.random() * (plate2X - plate1X - plateW - 6) + plate1X + plateW + 3,
          y: Math.random() * (h - 20) + 10,
          size: Math.random() * (scaleX * 2.5 + 0.5) + 0.5, // sizes restricted by gap size
          life: 1.0,
          decay: Math.random() * 0.06 + 0.03,
          color: 'rgba(157, 78, 221, 0.5)' // purple inside showing mode filtering
        });
      }

      // 2. Draw Virtual Particles (QED vacuum fluctuations)
      virtualParticles.forEach((p, idx) => {
        p.life -= p.decay;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1 - p.life) * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        // Fade particle out as life decays
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset
      });

      // Filter out dead particles
      virtualParticles = virtualParticles.filter(p => p.life > 0);

      // 3. Draw Metallic Conducting Plates
      // Plate 1
      ctx.shadowColor = 'rgba(0, 242, 254, 0.3)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#1e294b';
      ctx.fillRect(plate1X, plateY, plateW, plateH);
      ctx.strokeStyle = 'var(--color-primary)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(plate1X, plateY, plateW, plateH);

      // Plate 2
      ctx.fillRect(plate2X, plateY, plateW, plateH);
      ctx.strokeRect(plate2X, plateY, plateW, plateH);
      ctx.shadowBlur = 0;

      // Draw force indicator arrows showing attraction pressure
      ctx.fillStyle = 'var(--color-primary)';
      ctx.font = '600 10px "Inter"';
      ctx.textAlign = 'center';
      
      const arrowY = h / 2;
      const arrowLength = Math.max(10, 50 - (scaleX * 30));

      // Draw arrow left plate pushing right
      ctx.beginPath();
      ctx.moveTo(plate1X - arrowLength, arrowY);
      ctx.lineTo(plate1X - 2, arrowY);
      ctx.lineTo(plate1X - 8, arrowY - 4);
      ctx.moveTo(plate1X - 2, arrowY);
      ctx.lineTo(plate1X - 8, arrowY + 4);
      ctx.strokeStyle = 'var(--color-primary)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw arrow right plate pushing left
      ctx.beginPath();
      ctx.moveTo(plate2X + plateW + arrowLength, arrowY);
      ctx.lineTo(plate2X + plateW + 2, arrowY);
      ctx.lineTo(plate2X + plateW + 8, arrowY - 4);
      ctx.moveTo(plate2X + plateW + 2, arrowY);
      ctx.lineTo(plate2X + plateW + 8, arrowY + 4);
      ctx.stroke();

      // 4. Force calculation display: F = pi^2 * hbar * c * A / (240 * d^4)
      const hbar = 1.054e-34;
      const c = 3.0e8;
      const d_meters = casimirGap * 1e-9;
      const area_m2 = casimirArea * 1e-4; // cm^2 to m^2
      
      // Calculate force value in Newtons
      const forceVal = (Math.pow(Math.PI, 2) * hbar * c * area_m2) / (240 * Math.pow(d_meters, 4));
      
      ctx.font = '600 10px "JetBrains Mono"';
      ctx.fillStyle = 'var(--text-main)';
      ctx.fillText(`VACUUM ATTRACTIVE FORCE: ${forceVal.toExponential(4)} N`, w / 2, h - 80);
      
      const pressure = (forceVal / area_m2).toFixed(4);
      ctx.fillText(`CASIMIR PRESSURE: ${pressure} Pa`, w / 2, h - 60);

      // Label Plates
      ctx.font = '800 11px "Outfit"';
      ctx.fillStyle = 'var(--text-muted)';
      ctx.fillText('CONDUCTIVE PLATE A', plate1X - 50, plateY - 15);
      ctx.fillText('CONDUCTIVE PLATE B', plate2X + 60, plateY - 15);

      animFrame = requestAnimationFrame(drawCasimirPlates);
    };

    drawCasimirPlates();
    return () => cancelAnimationFrame(animFrame);
  }, [activeSubTab, casimirGap, casimirArea]);

  return (
    <div className="physics-dashboard">
      
      {/* 1. ROLE-BASED ACCESS CONTROL (RBAC) TELEMETRY HUD */}
      <div className="rbac-header-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚛️</span>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>
              Gravity Science Lab
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Theoretical Gravity Control & Quantum Fields Laboratory Interface
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="rbac-status-tag">
            <div className="user-dot" style={{ background: activeRole === 'Lead Physicist' ? 'var(--color-proven)' : activeRole === 'Speculative Theorist' ? 'var(--color-experimental)' : 'var(--color-secondary)' }}></div>
            <span>{username} ({activeRole})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Switch Role:</span>
            <select
              className="select-input"
              value={activeRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '30px' }}
            >
              <option value="Compliance Officer">Compliance Officer</option>
              <option value="Lead Physicist">Lead Physicist</option>
              <option value="Speculative Theorist">Speculative Theorist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Warning/Success alerts */}
      {successMessage && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--color-proven)', color: 'var(--color-proven)', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
          ✓ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid var(--color-speculative)', color: '#fda4af', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
          ⚠ {errorMessage}
        </div>
      )}

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="nested-tabs">
        <button 
          className={`nested-tab-btn ${activeSubTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('dashboard')}
        >
          📊 Research Telemetry
        </button>
        <button 
          className={`nested-tab-btn ${activeSubTab === 'theories' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('theories')}
        >
          📚 Physics Knowledge Engine
        </button>
        <button 
          className={`nested-tab-btn ${activeSubTab === 'simulations' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('simulations')}
        >
          🚀 Simulation Lab
        </button>
        <button 
          className={`nested-tab-btn ${activeSubTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('ai')}
        >
          🤖 AI Research assistant
        </button>
        <button 
          className={`nested-tab-btn ${activeSubTab === 'vault' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('vault')}
        >
          💾 Research Vault
        </button>
      </div>

      {/* 3. ACTIVE SUB-VIEW RENDER */}

      {/* TAB A: COMMAND TELEMETRY DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="physics-grid">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Global Telemetry Metrics */}
            <div className="stats-overview-grid">
              <div className="glass-panel stat-card">
                <div className="stat-icon" style={{ color: 'var(--color-primary)' }}>⚛️</div>
                <div className="stat-info">
                  <span className="stat-label">Active Research Paths</span>
                  <span className="stat-value">{telemetry.activeTheories} Modules</span>
                </div>
              </div>
              <div className="glass-panel stat-card" style={{ borderLeft: '3px solid var(--color-proven)' }}>
                <div className="stat-icon" style={{ color: 'var(--color-proven)' }}>✓</div>
                <div className="stat-info">
                  <span className="stat-label">Proven Theories</span>
                  <span className="stat-value">{telemetry.provenCount} Path</span>
                </div>
              </div>
              <div className="glass-panel stat-card" style={{ borderLeft: '3px solid var(--color-speculative)' }}>
                <div className="stat-icon" style={{ color: 'var(--color-speculative)' }}>⚡</div>
                <div className="stat-info">
                  <span className="stat-label">Speculative Concepts</span>
                  <span className="stat-value">{telemetry.speculativeCount} Paths</span>
                </div>
              </div>
              <div className="glass-panel stat-card">
                <div className="stat-icon">🛡️</div>
                <div className="stat-info">
                  <span className="stat-label">Lab Safety Status</span>
                  <span className="stat-value" style={{ color: 'var(--color-proven)' }}>{telemetry.safetyStatus}</span>
                </div>
              </div>
            </div>

            {/* Speculative warning banner */}
            <div className="speculative-alert-banner">
              <div style={{ fontSize: '1.3rem' }}>⚠</div>
              <div>
                <div className="speculative-alert-title">Speculative Physics Boundary Alert</div>
                <p style={{ margin: 0 }}>
                  Antigravity is NOT currently an established technology. All concepts in this platform relating to gravity shielding, warp bubbles, negative mass propulsion, or exotic energy structures are classified under **Speculative Theories** or **Experimental Physics** anomalies, distinct from proven General Relativity observations.
                </p>
              </div>
            </div>

            {/* Connections Graph visual Canvas */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.85rem' }}>
                🕸️ Gravity Control Knowledge Graph
              </h3>
              <div style={{ background: 'rgba(5, 8, 18, 0.95)', border: '1px solid var(--border-light)', borderRadius: '8px', height: '280px', overflow: 'hidden' }}>
                <canvas ref={graphCanvasRef} className="canvas-element" />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem', fontStyle: 'italic', textAlign: 'center' }}>
                Visual map representing synthesis lines between classical curvature tensors, virtual vacuum modes, and warp bubbles.
              </p>
            </div>
          </div>

          {/* Sidebar - Audit Logs and Staff */}
          <div className="physics-sidebar">
            {/* Staff Directory */}
            <div className="glass-panel">
              <div className="card-header">👥 Laboratory Physicists</div>
              <div className="card-body" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {researchers.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{r.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.role}</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', background: 'rgba(0, 242, 254, 0.08)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Audit Console (Protected by RBAC) */}
            <div className="glass-panel">
              <div className="card-header">🛡️ Lab Interaction Audit Console</div>
              <div className="card-body" style={{ padding: '0.75rem' }}>
                {activeRole === 'Speculative Theorist' ? (
                  <div style={{ color: 'var(--color-speculative)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center', border: '1px dashed var(--border-critical)', borderRadius: '6px' }}>
                    ⛔ ACCESS DENIED: Security Audit logs are restricted to Lead Physicist and Compliance Officer roles.
                  </div>
                ) : (
                  <div className="audit-console-panel">
                    {auditLogs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1rem' }}>No security logs recorded.</div>
                    ) : (
                      auditLogs.map(log => (
                        <div key={log.id} className="audit-console-row">
                          <span style={{ color: 'var(--text-dark)' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span 
                            className="audit-role-badge" 
                            style={{ 
                              background: log.role === 'Lead Physicist' ? 'rgba(16,185,129,0.15)' : log.role === 'Compliance Officer' ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.08)',
                              color: log.role === 'Lead Physicist' ? 'var(--color-proven)' : log.role === 'Compliance Officer' ? 'var(--color-primary)' : 'var(--text-muted)'
                            }}
                          >
                            {log.role.slice(0, 9)}
                          </span>
                          <span style={{ color: '#f1f5f9' }}>{log.action}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB B: PHYSICS KNOWLEDGE ENGINE */}
      {activeSubTab === 'theories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="speculative-alert-banner">
            <div style={{ fontSize: '1.3rem' }}>💡</div>
            <div>
              <div className="speculative-alert-title">Core Gravity Knowledge Engine</div>
              <p style={{ margin: 0 }}>
                This knowledge database defines established general relativity foundations, alongside experimental attempts and purely speculative frameworks. Click a module header to expand detailed equations and bibliography citations.
              </p>
            </div>
          </div>

          <div className="theory-accordion">
            {theories.map(t => {
              const isOpen = activeTheoryId === t.id;
              return (
                <div key={t.id} className="theory-card-wrapper">
                  <div 
                    className="theory-card-header"
                    onClick={() => setActiveTheoryId(isOpen ? null : t.id)}
                  >
                    <div className="theory-card-title-section">
                      <span style={{ fontSize: '1.1rem' }}>{isOpen ? '▼' : '▶'}</span>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>{t.title}</h4>
                    </div>
                    <span className={`theory-status-pill ${t.category === 'Proven Physics' ? 'status-proven' : t.category === 'Experimental Physics' ? 'status-experimental' : 'status-speculative'}`}>
                      {t.category}
                    </span>
                  </div>

                  {isOpen && (
                    <div className="theory-card-body">
                      <p style={{ fontSize: '0.85rem', lineHeight: '1.45', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                        {t.explanation}
                      </p>

                      <div className="math-equation-box">
                        {t.mathematicalModel}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Empirical Validation / Consensus Level:</span>
                        <div style={{ fontSize: '0.8rem', color: t.category === 'Proven Physics' ? 'var(--color-proven)' : t.category === 'Experimental Physics' ? 'var(--color-experimental)' : 'var(--color-speculative)', fontWeight: 600 }}>
                          {t.evidenceLevel}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Citations & References:</span>
                        <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {t.references.map((ref, idx) => (
                            <li key={idx} style={{ marginBottom: '0.2rem' }}>{ref}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB C: SIMULATION LAB */}
      {activeSubTab === 'simulations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>Interactive Gravitational Simulators</h4>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => {
                  const sName = prompt('Enter a name to save this simulation configuration:');
                  if (!sName) return;
                  
                  let params = {};
                  let details = '';
                  // Save state metrics depending on which canvas could be active
                  params = {
                    simG, simMass, isRepulsive,
                    warpVelocity, warpBubbleThickness,
                    casimirGap, casimirArea
                  };
                  details = `Parameters: gravity G=${simG}, mass=${simMass}, warpSpeed=${warpVelocity}c, platesGap=${casimirGap}nm`;
                  
                  handleSaveSimulation(sName, params, details);
                }}
              >
                💾 Save Parameters Snapshot
              </button>
            </div>
          </div>

          <div className="simulation-split">
            
            {/* Simulation Canvas Viewports */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Simulator 1: Spacetime mesh curvature simulator */}
              <div className="glass-panel">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🌌 Curvature & Gravity Well Simulator (Mesh Warp)</span>
                  <span className="theory-status-pill status-proven">Proven physics core / Speculative Repulsion</span>
                </div>
                <div className="canvas-viewport-panel">
                  <canvas ref={spacetimeCanvasRef} className="canvas-element" />
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', background: 'rgba(10,15,30,0.4)' }}>
                  
                  <div className="sim-slider-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Gravity Constant (G):</span>
                      <span style={{ color: 'var(--color-primary)' }}>{simG}</span>
                    </label>
                    <input 
                      type="range" className="sim-slider" 
                      min="0.1" max="5.0" step="0.1" 
                      value={simG} onChange={(e) => setSimG(Number(e.target.value))}
                    />
                  </div>

                  <div className="sim-slider-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Central Mass (M):</span>
                      <span style={{ color: 'var(--color-primary)' }}>{simMass} M_sol</span>
                    </label>
                    <input 
                      type="range" className="sim-slider" 
                      min="0.1" max="4.0" step="0.1" 
                      value={simMass} onChange={(e) => setSimMass(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', paddingTop: '1.2rem' }}>
                    <input 
                      type="checkbox" id="repulsiveCheck" 
                      checked={isRepulsive} onChange={(e) => setIsRepulsive(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="repulsiveCheck" style={{ color: 'var(--color-speculative)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                      🔴 Speculative Repulsive Negative Mass (-M)
                    </label>
                  </div>

                </div>
              </div>

              {/* Simulator 2: Alcubierre Warp Field Metric simulator */}
              <div className="glass-panel">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🚀 Alcubierre Warp Bubble Simulator (Space contraction)</span>
                  <span className="theory-status-pill status-speculative">Speculative Theory</span>
                </div>
                <div className="canvas-viewport-panel">
                  <canvas ref={warpCanvasRef} className="canvas-element" />
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', background: 'rgba(10,15,30,0.4)' }}>
                  
                  <div className="sim-slider-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Warp Velocity:</span>
                      <span style={{ color: 'var(--color-speculative)' }}>{warpVelocity} c</span>
                    </label>
                    <input 
                      type="range" className="sim-slider" 
                      min="0.1" max="3.0" step="0.1" 
                      value={warpVelocity} onChange={(e) => setWarpVelocity(Number(e.target.value))}
                    />
                  </div>

                  <div className="sim-slider-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Bubble Thickness (σ):</span>
                      <span style={{ color: 'var(--color-speculative)' }}>{warpBubbleThickness} nm</span>
                    </label>
                    <input 
                      type="range" className="sim-slider" 
                      min="0.1" max="1.5" step="0.05" 
                      value={warpBubbleThickness} onChange={(e) => setWarpBubbleThickness(Number(e.target.value))}
                    />
                  </div>

                  <div className="sim-slider-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Exotic Matter Shielding (M_neg):</span>
                      <span style={{ color: 'var(--color-speculative)' }}>-{warpExoticMatterMass} M_sol</span>
                    </label>
                    <input 
                      type="range" className="sim-slider" 
                      min="50" max="2000" step="50" 
                      value={warpExoticMatterMass} onChange={(e) => setWarpExoticMatterMass(Number(e.target.value))}
                    />
                  </div>

                </div>
              </div>

              {/* Simulator 3: Casimir Vacuum Energy Simulator */}
              <div className="glass-panel">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🔬 Casimir Vacuum Mode Filter Simulator (Zero Point)</span>
                  <span className="theory-status-pill status-proven">Proven Physics (QED)</span>
                </div>
                <div className="canvas-viewport-panel">
                  <canvas ref={casimirCanvasRef} className="canvas-element" />
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', background: 'rgba(10,15,30,0.4)' }}>
                  
                  <div className="sim-slider-group" style={{ flex: 1, minWidth: '220px' }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Plate Distance Gap (d):</span>
                      <span style={{ color: 'var(--color-proven)' }}>{casimirGap} nm</span>
                    </label>
                    <input 
                      type="range" className="sim-slider" 
                      min="100" max="500" step="5" 
                      value={casimirGap} onChange={(e) => setCasimirGap(Number(e.target.value))}
                    />
                  </div>

                  <div className="sim-slider-group" style={{ flex: 1, minWidth: '220px' }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Conducting Plate Area:</span>
                      <span style={{ color: 'var(--color-proven)' }}>{casimirArea} cm²</span>
                    </label>
                    <input 
                      type="range" className="sim-slider" 
                      min="1" max="25" step="1" 
                      value={casimirArea} onChange={(e) => setCasimirArea(Number(e.target.value))}
                    />
                  </div>

                </div>
              </div>

            </div>

            {/* Sidebar controls for simulation configurations */}
            <div className="simulation-control-sidebar">
              <div className="glass-panel">
                <div className="card-header">📊 Simulator Diagnostics</div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="sim-metric-card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curvature Depth:</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{(simMass * 30).toFixed(1)} px</span>
                  </div>

                  <div className="sim-metric-card" style={{ borderLeft: '3px solid var(--color-speculative)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bubble Distortion Index:</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{(warpVelocity * 85).toFixed(0)}% Contraction</span>
                  </div>

                  <div className="sim-metric-card" style={{ borderLeft: '3px solid var(--color-proven)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Casimir Attracted Pressure:</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                      {((Math.pow(Math.PI, 2) * 1.054e-34 * 3e8) / (240 * Math.pow(casimirGap * 1e-9, 4))).toFixed(4)} Pa
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-panel">
                <div className="card-header">💾 Saved Configurations</div>
                <div className="card-body" style={{ padding: '0.75rem' }}>
                  {simulations.length === 0 ? (
                    <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: '1rem' }}>No configurations saved.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {simulations.map(sim => (
                        <div 
                          key={sim.id} 
                          style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.8rem' }}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{sim.title}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: '0.15rem 0' }}>By: {sim.creator}</div>
                          <button 
                            className="btn-secondary"
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', width: '100%', marginTop: '0.25rem' }}
                            onClick={() => {
                              // Load parameters
                              if (sim.parameters) {
                                const p = sim.parameters;
                                if (p.simG !== undefined) setSimG(p.simG);
                                if (p.simMass !== undefined) setSimMass(p.simMass);
                                if (p.isRepulsive !== undefined) setIsRepulsive(p.isRepulsive);
                                if (p.warpVelocity !== undefined) setWarpVelocity(p.warpVelocity);
                                if (p.warpBubbleThickness !== undefined) setWarpBubbleThickness(p.warpBubbleThickness);
                                if (p.casimirGap !== undefined) setCasimirGap(p.casimirGap);
                                if (p.casimirArea !== undefined) setCasimirArea(p.casimirArea);
                                alert(`Loaded simulation parameters snapshot: "${sim.title}"`);
                              }
                            }}
                          >
                            🔄 Restore Snap Parameters
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB D: AI RESEARCH ASSISTANT */}
      {activeSubTab === 'ai' && (
        <div className="ai-assistant-grid">
          
          {/* Controls column */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', margin: 0 }}>
              AI Assistant Toolkit
            </h3>

            <div className="form-group">
              <label className="input-label">Select Action</label>
              <select
                className="select-input"
                value={aiAction}
                onChange={(e) => setAiAction(e.target.value)}
              >
                <option value="summarize">Literature Summarization</option>
                <option value="compare">Theory Comparison</option>
                <option value="plan-experiment">Experiment Planning</option>
                <option value="track-hypothesis">Hypothesis Viability Tracker</option>
              </select>
            </div>

            {/* Sub-form fields dependent on chosen Action */}
            {aiAction === 'summarize' && (
              <div className="form-group">
                <label className="input-label">Select Paper to Analyze</label>
                <select
                  className="select-input"
                  value={selectedPaperId}
                  onChange={(e) => setSelectedPaperId(e.target.value)}
                >
                  {papers.map(p => (
                    <option key={p.id} value={p.id}>{p.title.slice(0, 32)}...</option>
                  ))}
                </select>
              </div>
            )}

            {aiAction === 'compare' && (
              <>
                <div className="form-group">
                  <label className="input-label">Theory 1</label>
                  <select
                    className="select-input"
                    value={compareTheoryId1}
                    onChange={(e) => setCompareTheoryId1(e.target.value)}
                  >
                    {theories.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="input-label">Theory 2</label>
                  <select
                    className="select-input"
                    value={compareTheoryId2}
                    onChange={(e) => setCompareTheoryId2(e.target.value)}
                  >
                    {theories.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {aiAction === 'plan-experiment' && (
              <>
                <div className="form-group">
                  <label className="input-label">Theoretical Target</label>
                  <input
                    type="text" className="text-input"
                    value={expTheoryTitle} onChange={(e) => setExpTheoryTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Key Variable Configuration</label>
                  <input
                    type="text" className="text-input"
                    value={expParameterVal} onChange={(e) => setExpParameterVal(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Risk Category</label>
                  <select
                    className="select-input"
                    value={expRiskLevel} onChange={(e) => setExpRiskLevel(e.target.value)}
                  >
                    <option value="Safe">Safe (Low field intensity)</option>
                    <option value="Caution">Caution (Superconducting cryo)</option>
                    <option value="Hazardous">Hazardous (Exotic matter shear)</option>
                  </select>
                </div>
              </>
            )}

            {aiAction === 'track-hypothesis' && (
              <>
                <div className="form-group">
                  <label className="input-label">Hypothesis Formulation</label>
                  <textarea
                    className="text-input" rows="3"
                    value={hypoDescription} onChange={(e) => setHypoDescription(e.target.value)}
                    style={{ resize: 'none', fontSize: '0.8rem' }}
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Proposed Mechanism</label>
                  <input
                    type="text" className="text-input"
                    value={hypoPathway} onChange={(e) => setHypoPathway(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="checkbox" id="exoticCheck"
                    checked={hypoIsExotic} onChange={(e) => setHypoIsExotic(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor="exoticCheck" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-speculative)', cursor: 'pointer' }}>
                    Requires Negative Energy / Exotic Matter
                  </label>
                </div>
              </>
            )}

            <button
              className="btn-primary"
              onClick={handleAiAction}
              disabled={aiLoading}
              style={{ marginTop: '0.5rem' }}
            >
              {aiLoading ? 'AI Thinking...' : '🤖 Process AI Request'}
            </button>
          </div>

          {/* AI Response Display Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="ai-history-response-card">
              {aiResponse ? (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: '1.5', fontFamily: 'var(--font-body)' }}>
                  {aiResponse}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <span style={{ fontSize: '2.5rem' }}>🤖</span>
                  <h4 style={{ margin: '0.85rem 0 0.25rem 0', fontWeight: 700 }}>Autonomous AI Theoretical Assistant</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', maxWidth: '380px' }}>
                    Choose an action in the left panel to request literature analysis, compare mathematical frameworks, construct laboratory experiment checklists, or register hypotheses.
                  </p>
                </div>
              )}
            </div>

            {/* Registered Hypotheses Tracker */}
            {aiAction === 'track-hypothesis' && (
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  Registered Lab Hypotheses Index
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                  {hypotheses.map(h => (
                    <div key={h.id} className="hypothesis-row">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {h.description}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Pathway: {h.pathway}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: h.viability > 40 ? 'var(--color-proven)' : 'var(--color-speculative)' }}>
                          Viability: {h.viability}%
                        </span>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                          {h.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB E: DATA VAULT REGISTRY */}
      {activeSubTab === 'vault' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Sub registry 1: Research Papers database */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>
                📚 Research Papers Database
              </h3>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table className="db-tab-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Authors</th>
                    <th>Journal/Book</th>
                    <th>Category</th>
                    <th>Feasibility Index</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.title}</strong></td>
                      <td>{p.author}</td>
                      <td>{p.journal} ({p.year})</td>
                      <td>
                        <span className={`theory-status-pill ${p.category === 'Proven Physics' ? 'status-proven' : p.category === 'Experimental Physics' ? 'status-experimental' : 'status-speculative'}`}>
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: p.viabilityScore > 70 ? 'var(--color-proven)' : p.viabilityScore > 30 ? 'var(--color-experimental)' : 'var(--color-speculative)' }}>
                          {p.viabilityScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add paper form (RBAC Protected) */}
            <form onSubmit={handleAddPaper} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '1.25rem' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.85rem', color: 'var(--color-primary)' }}>
                ✍ Add New Research Paper to Vault
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="input-label">Paper Title</label>
                  <input
                    type="text" className="text-input" required
                    value={newPaper.title} onChange={(e) => setNewPaper(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Authors</label>
                  <input
                    type="text" className="text-input" required
                    value={newPaper.author} onChange={(e) => setNewPaper(prev => ({ ...prev, author: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Publication / Journal</label>
                  <input
                    type="text" className="text-input"
                    value={newPaper.journal} onChange={(e) => setNewPaper(prev => ({ ...prev, journal: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="input-label">Category</label>
                  <select
                    className="select-input"
                    value={newPaper.category} onChange={(e) => setNewPaper(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Proven Physics">Proven Physics</option>
                    <option value="Experimental Physics">Experimental Physics</option>
                    <option value="Speculative Theories">Speculative Theories</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="input-label">Publication Year</label>
                  <input
                    type="number" className="text-input"
                    value={newPaper.year} onChange={(e) => setNewPaper(prev => ({ ...prev, year: Number(e.target.value) }))}
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Theoretical Viability Index (0-100%)</label>
                  <input
                    type="number" className="text-input" min="0" max="100"
                    value={newPaper.viabilityScore} onChange={(e) => setNewPaper(prev => ({ ...prev, viabilityScore: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Abstract / Summary</label>
                <textarea
                  className="text-input" rows="2" style={{ resize: 'none' }}
                  value={newPaper.summary} onChange={(e) => setNewPaper(prev => ({ ...prev, summary: e.target.value }))}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '200px' }}>
                ✓ Log Research Paper
              </button>
            </form>
          </div>

          {/* Sub registry 2: Physical Experiments Database */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>
                🔬 Physical Experiments Database
              </h3>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table className="db-tab-table">
                <thead>
                  <tr>
                    <th>Experiment Title</th>
                    <th>Researcher</th>
                    <th>Status</th>
                    <th>Yield output</th>
                    <th>Parameters</th>
                    <th>Safety Index</th>
                  </tr>
                </thead>
                <tbody>
                  {experiments.map(e => (
                    <tr key={e.id}>
                      <td><strong>{e.title}</strong></td>
                      <td>{e.researcher}</td>
                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px',
                          background: e.status === 'Completed' ? 'rgba(16,185,129,0.1)' : e.status === 'Failed' ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)',
                          color: e.status === 'Completed' ? 'var(--color-proven)' : e.status === 'Failed' ? 'var(--color-speculative)' : 'var(--color-experimental)',
                          border: `1px solid ${e.status === 'Completed' ? 'rgba(16,185,129,0.2)' : e.status === 'Failed' ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)'}`
                        }}>
                          {e.status}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{e.yield}</td>
                      <td>{e.parameters}</td>
                      <td>
                        <span style={{ 
                          fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '3px',
                          background: e.safetyLevel === 'Safe' ? 'rgba(16,185,129,0.1)' : e.safetyLevel === 'Caution' ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)',
                          color: e.safetyLevel === 'Safe' ? 'var(--color-proven)' : e.safetyLevel === 'Caution' ? 'var(--color-experimental)' : 'var(--color-speculative)'
                        }}>
                          {e.safetyLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add experiment form (RBAC Protected: Lead Physicist or Speculative Theorist) */}
            {activeRole === 'Compliance Officer' ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-light)', borderRadius: '6px', textAlign: 'center' }}>
                🔒 Compliance Officers are restricted to read-only logs. Physical experiment scheduling requires Lead Physicist or Speculative Theorist authorization.
              </div>
            ) : (
              <form onSubmit={handleAddExperiment} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.85rem', color: 'var(--color-primary)' }}>
                  🧪 Schedule / Log Physical Gravity Experiment
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="input-label">Experiment Name</label>
                    <input
                      type="text" className="text-input" required
                      value={newExperiment.title} onChange={(e) => setNewExperiment(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Parameters (e.g. Frequency, Plate gap)</label>
                    <input
                      type="text" className="text-input"
                      value={newExperiment.parameters} onChange={(e) => setNewExperiment(prev => ({ ...prev, parameters: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="input-label">Current Status</label>
                    <select
                      className="select-input"
                      value={newExperiment.status} onChange={(e) => setNewExperiment(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="input-label">Energy Output / Net Yield</label>
                    <input
                      type="text" className="text-input"
                      value={newExperiment.yield} onChange={(e) => setNewExperiment(prev => ({ ...prev, yield: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Safety Clearance Rating</label>
                    <select
                      className="select-input"
                      value={newExperiment.safetyLevel} onChange={(e) => setNewExperiment(prev => ({ ...prev, safetyLevel: e.target.value }))}
                    >
                      <option value="Safe">Safe</option>
                      <option value="Caution">Caution Required</option>
                      <option value="Hazardous">Hazardous (Thermal/Field Shear)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Initial Results / Observations</label>
                  <textarea
                    className="text-input" rows="2" style={{ resize: 'none' }}
                    value={newExperiment.results} onChange={(e) => setNewExperiment(prev => ({ ...prev, results: e.target.value }))}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '220px' }}>
                  🧪 Authorize & Log Run
                </button>
              </form>
            )}
          </div>
          
        </div>
      )}

    </div>
  );
}
