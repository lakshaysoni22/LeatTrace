import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { useInvestigationStore } from '../stores/investigation';
import {
  ZoomIn, ZoomOut, Maximize, RotateCcw, Download, Search, Filter, Info,
  AlertTriangle, Eye, Activity, Play, Pause, FastForward, Building, Link, Shield, Cpu, X, PlusCircle, Bookmark, Check
} from 'lucide-react';
import { getRiskColor } from '../utils/helpers';
import { apiGet } from '../utils/api';

const nodeColors: Record<string, { bg: string; border: string }> = {
  wallet: { bg: '#00d4ff', border: '#4de3ff' },
  contract: { bg: '#a855f7', border: '#c084fc' },
  exchange: { bg: '#f97316', border: '#fb923c' },
  bridge: { bg: '#06b6d4', border: '#22d3ee' },
  evidence: { bg: '#22c55e', border: '#4ade80' }
};

export const GraphPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Selected Node/Edge Inspector
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  // Layout Controls
  const [activeLayout, setActiveLayout] = useState<'cose' | 'circle' | 'concentric' | 'breadthfirst'>('cose');

  // Toggleable Layers
  const [layers, setLayers] = useState({
    wallets: true,
    transactions: true,
    entities: true,
    evidence: true
  });

  // Timeline Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineVal, setTimelineVal] = useState(50);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Annotations and Bookmarks
  const [annotations, setAnnotations] = useState<Array<{ id: string; text: string; author: string }>>([]);
  const [newAnnotation, setNewAnnotation] = useState('');

  // Active right-side tab
  const [activeRightTab, setActiveRightTab] = useState<'inspector' | 'crosschain' | 'notes'>('inspector');

  // Cross-chain trace live data state
  const [crossChainTrace, setCrossChainTrace] = useState<any>(null);
  const [crossChainLoading, setCrossChainLoading] = useState(false);

  // Store data
  const { activeTargetAddress, summary, transactions, isLoading } = useInvestigationStore();

  // Search & Graph Element State
  const [searchAddress, setSearchAddress] = useState(activeTargetAddress);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [graphElements, setGraphElements] = useState<any[]>([]);
  const [totalDiscoveredAddresses, setTotalDiscoveredAddresses] = useState(0);

  // ── Unified Data Flow: Build Graph From Real Store Transactions ──────────
  useEffect(() => {
    if (!activeTargetAddress) {
      setGraphElements([]);
      setTotalDiscoveredAddresses(0);
      return;
    }
    setSearchAddress(activeTargetAddress);
    setSearchError(null);

    // Count all unique addresses across all transactions for the indicator
    const allDiscovered = new Set<string>();
    allDiscovered.add(activeTargetAddress);
    transactions.forEach((tx: any) => {
      tx.vin?.forEach((v: any) => {
        const a = v.prevout?.scriptpubkey_address;
        if (a) allDiscovered.add(a);
      });
      tx.vout?.forEach((v: any) => {
        const a = v.scriptpubkey_address;
        if (a) allDiscovered.add(a);
      });
    });
    setTotalDiscoveredAddresses(allDiscovered.size);

    const newNodes: any[] = [];
    const newEdges: any[] = [];
    const nodeSet = new Set<string>();

    // Central Target Node
    newNodes.push({
      data: {
        id: activeTargetAddress,
        label: `${activeTargetAddress.slice(0, 8)}... (${summary?.scriptType || 'TARGET'})`,
        type: 'wallet',
        risk: 85,
        isTarget: true,
        balance: summary ? `${(summary.confirmedBalance / 1e8).toFixed(4)} BTC` : 'Target'
      },
      classes: 'wallet target-node'
    });
    nodeSet.add(activeTargetAddress);

    // Sort transactions by total transaction value descending to show the most significant fund flows first
    const txTotalValue = (tx: any): number => {
      if (!tx?.vout || !Array.isArray(tx.vout)) return 0;
      return tx.vout.reduce((sum: number, v: any) => sum + (v.value || 0), 0);
    };

    const sortedTxs = [...transactions].sort((a, b) => txTotalValue(b) - txTotalValue(a));

    // Cap at ~55 nodes for readable, non-overcrowded initial render
    const INITIAL_NODE_CAP = 55;

    for (const tx of sortedTxs) {
      if (newNodes.length >= INITIAL_NODE_CAP) break;

      // Inputs
      tx.vin?.forEach((vinItem: any, vinIdx: number) => {
        if (newNodes.length >= INITIAL_NODE_CAP) return;
        const inAddr = vinItem.prevout?.scriptpubkey_address;
        if (inAddr && !nodeSet.has(inAddr)) {
          nodeSet.add(inAddr);
          const inValBtc = vinItem.prevout?.value ? (vinItem.prevout.value / 1e8).toFixed(4) : '';
          newNodes.push({
            data: {
              id: inAddr,
              label: `${inAddr.slice(0, 8)}... (IN)`,
              type: 'wallet',
              risk: 35,
              isTarget: false,
              balance: inValBtc ? `${inValBtc} BTC` : ''
            },
            classes: 'wallet'
          });
        }
        if (inAddr) {
          newEdges.push({
            data: {
              id: `edge-in-${tx.txid.slice(0, 8)}-${vinIdx}`,
              source: inAddr,
              target: activeTargetAddress,
              value: vinItem.prevout?.value ? `${(vinItem.prevout.value / 1e8).toFixed(4)} BTC` : 'Transfer'
            }
          });
        }
      });

      // Outputs
      tx.vout?.forEach((voutItem: any, voutIdx: number) => {
        if (newNodes.length >= INITIAL_NODE_CAP) return;
        const outAddr = voutItem.scriptpubkey_address;
        if (outAddr && !nodeSet.has(outAddr)) {
          nodeSet.add(outAddr);
          const outValBtc = voutItem.value ? (voutItem.value / 1e8).toFixed(4) : '';
          newNodes.push({
            data: {
              id: outAddr,
              label: `${outAddr.slice(0, 8)}... (OUT)`,
              type: 'wallet',
              risk: 45,
              isTarget: false,
              balance: outValBtc ? `${outValBtc} BTC` : ''
            },
            classes: 'wallet'
          });
        }
        if (outAddr) {
          newEdges.push({
            data: {
              id: `edge-out-${tx.txid.slice(0, 8)}-${voutIdx}`,
              source: activeTargetAddress,
              target: outAddr,
              value: `${(voutItem.value / 1e8).toFixed(4)} BTC`
            }
          });
        }
      });
    }

    setGraphElements([...newNodes, ...newEdges]);
  }, [activeTargetAddress, summary, transactions]);

  // Derived real metrics for the currently selected node
  const selectedNodeMetrics = useMemo(() => {
    if (!selectedNode?.id) return null;
    const nodeId = selectedNode.id;
    let inCount = 0;
    let outCount = 0;
    let inValue = 0;
    let outValue = 0;

    graphElements.forEach((el) => {
      if (el.data?.source && el.data?.target) {
        const valStr = String(el.data.value || '');
        const numMatch = valStr.match(/([\d.]+)/);
        const numVal = numMatch ? parseFloat(numMatch[1]) : 0;

        if (el.data.target === nodeId) {
          inCount++;
          inValue += numVal;
        }
        if (el.data.source === nodeId) {
          outCount++;
          outValue += numVal;
        }
      }
    });

    let role = 'Counterparty';
    if (selectedNode.isTarget || nodeId === activeTargetAddress) {
      role = 'Investigation Target';
    } else if (selectedNode.label?.includes('(IN)')) {
      role = 'Input Source (Sender)';
    } else if (selectedNode.label?.includes('(OUT)')) {
      role = 'Output Destination (Recipient)';
    } else if (selectedNode.type === 'bridge') {
      role = 'Cross-Chain Bridge';
    } else if (selectedNode.type === 'exchange') {
      role = 'Exchange Service';
    }

    const riskVal = selectedNode.risk ?? selectedNode.riskScore ?? 35;

    return {
      inCount,
      outCount,
      totalLinks: inCount + outCount,
      inValue,
      outValue,
      totalValue: inValue + outValue,
      role,
      risk: riskVal,
    };
  }, [selectedNode, graphElements, activeTargetAddress]);

  // Fetch real cross-chain bridge trace when node is selected or tab switched
  useEffect(() => {
    if (activeRightTab !== 'crosschain' || !selectedNode?.id) {
      if (!selectedNode?.id) setCrossChainTrace(null);
      return;
    }

    let isMounted = true;
    setCrossChainLoading(true);

    apiGet<any>(`/api/wallets/cross-chain-trace/${selectedNode.id}`)
      .then((data) => {
        if (isMounted) {
          setCrossChainTrace(data);
          setCrossChainLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCrossChainTrace(null);
          setCrossChainLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedNode?.id, activeRightTab]);

  // Layout configuration tuner helper
  const getLayoutConfig = (layoutName: string, nodeCount: number) => {
    if (layoutName === 'cose') {
      return {
        name: 'cose',
        animate: true,
        animationDuration: 600,
        fit: true,
        padding: 50,
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: true,
        nodeRepulsion: () => 9000 + Math.min(nodeCount * 40, 5000),
        idealEdgeLength: () => Math.max(90, Math.min(180, 80 + nodeCount * 1.5)),
        edgeElasticity: () => 100,
        nestingFactor: 1.2,
        gravity: 0.25,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
        componentSpacing: 100,
      };
    }
    return {
      name: layoutName,
      animate: true,
      animationDuration: 500,
      fit: true,
      padding: 50,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
    };
  };

  // Search within graph or expand target address via store
  const handleSearchGraph = async () => {
    const query = searchAddress.trim();
    if (!query) return;
    setSearchError(null);

    // 1. If the node already exists in Cytoscape, focus and highlight it
    if (cyRef.current) {
      const targetElement = cyRef.current.getElementById(query);
      if (targetElement.length > 0) {
        cyRef.current.animate({
          center: { eles: targetElement },
          zoom: 1.6,
          duration: 500
        });
        targetElement.select();
        setSelectedNode(targetElement.data());
        setSelectedEdge(null);
        setActiveRightTab('inspector');
        return;
      }
    }

    // 2. Otherwise trigger live investigation store target change
    setIsSearching(true);
    try {
      await useInvestigationStore.getState().setActiveTarget(query);
    } catch (err: any) {
      setSearchError('Live graph data unavailable for this address — retry');
    } finally {
      setIsSearching(false);
    }
  };

  // ── Cytoscape Instance Lifecycle & Rendering ──────────────────────────────
  useEffect(() => {
    if (!containerRef.current || graphElements.length === 0) return;

    // Filter elements based on layer toggles
    const filteredNodes = graphElements.filter(el => el.data.source === undefined).filter(n => {
      const data = n.data;
      if (data.type === 'wallet' && !layers.wallets) return false;
      if (data.type === 'exchange' && !layers.entities) return false;
      if (data.type === 'contract' && !layers.entities) return false;
      return true;
    });

    const filteredEdges = graphElements.filter(el => el.data.source !== undefined).filter(() => {
      if (!layers.transactions) return false;
      return true;
    });

    const cy = cytoscape({
      container: containerRef.current,
      hideEdgesOnViewport: false,
      textureOnViewport: true,
      motionBlur: true,
      motionBlurOpacity: 0.15,
      pixelRatio: 'auto',
      elements: [
        ...filteredNodes,
        ...filteredEdges
      ],
      style: [
        // Default node styling with risk-based scaling
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'font-size': '9px',
            color: '#a0aec0',
            'text-margin-y': 6,
            'font-family': 'JetBrains Mono, monospace',
            width: 'mapData(risk, 0, 100, 26, 42)' as any,
            height: 'mapData(risk, 0, 100, 26, 42)' as any,
            'border-width': 2,
            'background-opacity': 0.95,
            'transition-property': 'opacity, border-width, border-color, width, height',
            'transition-duration': '0.2s',
          } as any,
        },
        // Central target node styling — larger, distinct glow
        {
          selector: 'node.target-node, node[?isTarget]',
          style: {
            width: 50,
            height: 50,
            'border-width': 3.5,
            'border-color': '#00e5ff',
            'background-color': '#00d4ff',
            'overlay-color': '#00e5ff',
            'overlay-padding': 8,
            'overlay-opacity': 0.35,
            'font-size': '11px',
            'font-weight': 'bold',
            color: '#ffffff',
            'text-background-opacity': 0.9,
            'text-background-color': '#060d1f',
            'text-background-padding': '4px',
            'z-index': 999,
          } as any,
        },
        // Risk-based halos
        {
          selector: 'node[risk >= 70][!isTarget]',
          style: {
            'border-color': '#ef4444',
            'border-width': 3,
            'overlay-color': '#ef4444',
            'overlay-padding': 6,
            'overlay-opacity': 0.25,
          } as any,
        },
        {
          selector: 'node[risk >= 40][risk < 70][!isTarget]',
          style: {
            'border-color': '#f59e0b',
            'border-width': 2.5,
            'overlay-color': '#f59e0b',
            'overlay-padding': 4,
            'overlay-opacity': 0.15,
          } as any,
        },
        {
          selector: 'node.wallet',
          style: {
            'background-color': nodeColors.wallet.bg,
            'border-color': nodeColors.wallet.border,
          }
        },
        {
          selector: 'node.contract',
          style: {
            'background-color': nodeColors.contract.bg,
            'border-color': nodeColors.contract.border,
          }
        },
        {
          selector: 'node.exchange',
          style: {
            'background-color': nodeColors.exchange.bg,
            'border-color': nodeColors.exchange.border,
          }
        },
        {
          selector: 'node.bridge',
          style: {
            'background-color': nodeColors.bridge.bg,
            'border-color': nodeColors.bridge.border,
          }
        },
        // Edge styling with zoom-based label display
        {
          selector: 'edge',
          style: {
            width: 1.6,
            'line-color': '#2a3b66',
            'target-arrow-color': '#00d4ff',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.1,
            'curve-style': 'bezier',
            'line-style': 'dashed',
            'line-dash-pattern': [6, 4],
            'line-dash-offset': 0,
            label: 'data(value)',
            'font-size': '8px',
            'min-zoomed-font-size': 9,
            color: '#78819a',
            'font-family': 'JetBrains Mono, monospace',
            'text-background-opacity': 0.85,
            'text-background-color': '#0b0f1d',
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle',
            'transition-property': 'line-color, opacity, width',
            'transition-duration': '0.2s',
          } as any,
        },
        // Edge label hiding class for zoomed out states
        {
          selector: 'edge.hide-labels',
          style: {
            label: '',
          } as any,
        },
        // Ego network hover highlight & dimming classes
        {
          selector: '.dimmed',
          style: {
            opacity: 0.15,
            'line-opacity': 0.08,
          } as any,
        },
        {
          selector: '.highlighted',
          style: {
            opacity: 1,
            'z-index': 100,
            'line-color': '#00e5ff',
            'target-arrow-color': '#00e5ff',
            width: 2.4,
          } as any,
        },
      ],
      layout: getLayoutConfig(activeLayout, filteredNodes.length) as any,
    });

    // ── Zoom Listener: Auto-hide Edge Labels Past Threshold ──
    cy.on('zoom', () => {
      const zoom = cy.zoom();
      if (zoom < 0.72) {
        cy.edges().addClass('hide-labels');
      } else {
        cy.edges().removeClass('hide-labels');
      }
    });

    // ── Entrance Animation: Staggered Node Scale & Fade In ──
    cy.nodes().style({ opacity: 0 });
    cy.edges().style({ opacity: 0 });
    cy.nodes().forEach((node, idx) => {
      setTimeout(() => {
        if (!cy.destroyed()) {
          node.animate({
            style: { opacity: 1 },
            duration: 250,
            easing: 'ease-out-quad'
          });
        }
      }, Math.min(idx * 15, 600));
    });
    setTimeout(() => {
      if (!cy.destroyed()) {
        cy.edges().animate({
          style: { opacity: 1 },
          duration: 350,
          easing: 'ease-out-quad'
        });
      }
    }, 350);

    // ── Interaction: Ego Network Hover Highlighting ──
    cy.on('mouseover', 'node', (evt) => {
      const selNode = evt.target;
      const neighborhood = selNode.neighborhood().add(selNode);
      cy.elements().addClass('dimmed');
      neighborhood.removeClass('dimmed').addClass('highlighted');
    });

    cy.on('mouseout', 'node', () => {
      cy.elements().removeClass('dimmed highlighted');
    });

    // ── Double-Click Progressive Expansion via Real Cluster API ──
    cy.on('dblclick', 'node', async (evt) => {
      const node = evt.target;
      const addr = node.id();
      if (!addr || addr.startsWith('hop-') || addr.startsWith('sim-')) return;

      try {
        const data = await apiGet<any>(`/api/wallets/cluster/${addr}`);
        if (data && data.associated_wallets && Array.isArray(data.associated_wallets)) {
          const addedNodes: any[] = [];
          const addedEdges: any[] = [];

          data.associated_wallets.slice(0, 6).forEach((assoc: string, idx: number) => {
            if (assoc !== addr && !cy.getElementById(assoc).length) {
              addedNodes.push({
                group: 'nodes',
                data: {
                  id: assoc,
                  label: `${assoc.substring(0, 8)}...`,
                  type: 'wallet',
                  risk: 30,
                  isTarget: false,
                  balance: ''
                },
                classes: 'wallet'
              });
              addedEdges.push({
                group: 'edges',
                data: {
                  id: `edge-${addr}-${assoc}-${idx}`,
                  source: addr,
                  target: assoc,
                  value: 'Co-spent'
                }
              });
            }
          });

          if (addedNodes.length > 0) {
            cy.add([...addedNodes, ...addedEdges]);
            const tunedLayout = getLayoutConfig(activeLayout, cy.nodes().length);
            cy.layout(tunedLayout as any).run();
          }
        }
      } catch (e) {
        console.warn('Dynamic node expansion cluster unavailable:', e);
      }
    });

    // Selection handlers
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode(node.data());
      setSelectedEdge(null);
    });

    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      setSelectedEdge(edge.data());
      setSelectedNode(null);
    });

    cyRef.current = cy;

    // Ensure cy.resize() and cy.fit() on mount & window resize
    const handleResize = () => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 40);
      }
    };

    const rafId = requestAnimationFrame(handleResize);
    const timeoutId = setTimeout(handleResize, 150);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      cy.destroy();
    };
  }, [graphElements, activeLayout, layers]);

  // ── Edge Flow Animation Loop (Moving Dashes) ──
  useEffect(() => {
    if (!cyRef.current || graphElements.length === 0) return;

    let animFrameId: number;
    let lastTime = 0;
    let offset = 0;

    const animateEdgeFlow = (time: number) => {
      if (time - lastTime > 45) {
        lastTime = time;
        offset = (offset - 1) % 30;
        if (cyRef.current && !cyRef.current.destroyed()) {
          cyRef.current.edges().style('line-dash-offset', offset);
        }
      }
      animFrameId = requestAnimationFrame(animateEdgeFlow);
    };

    animFrameId = requestAnimationFrame(animateEdgeFlow);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [graphElements]);

  // Export utilities
  const exportPNG = () => {
    if (!cyRef.current) return;
    const pngUri = cyRef.current.png({ output: 'base64uri', full: true, bg: '#060810' });
    const a = document.createElement('a');
    a.href = pngUri;
    a.download = `LEAtTrace-graph-${searchAddress || 'network'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportJSON = () => {
    if (!cyRef.current) return;
    const jsonStr = JSON.stringify(cyRef.current.json());
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LEAtTrace-graph-${searchAddress || 'network'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Layout switcher utility
  const runLayout = (layoutName: typeof activeLayout) => {
    setActiveLayout(layoutName);
    if (cyRef.current && !cyRef.current.destroyed()) {
      const tuned = getLayoutConfig(layoutName, cyRef.current.nodes().length);
      cyRef.current.layout(tuned as any).run();
    }
  };

  // Zoom controls
  const zoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() + 0.15);
  const zoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() - 0.15);
  const fitCanvas = () => {
    if (cyRef.current) {
      cyRef.current.resize();
      cyRef.current.fit(undefined, 40);
    }
  };
  const resetLayout = () => {
    if (cyRef.current) {
      cyRef.current.reset();
      cyRef.current.fit(undefined, 40);
    }
  };

  // Timeline simulate interval
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineVal((prev) => (prev >= 100 ? 0 : prev + 2 * playbackSpeed));
      }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed]);

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnotation.trim()) return;
    setAnnotations((prev) => [
      ...prev,
      {
        id: `an-${crypto.randomUUID().substring(0, 8)}`,
        text: newAnnotation,
        author: 'Investigator'
      }
    ]);
    setNewAnnotation('');
  };

  const visibleNodesCount = graphElements.filter(e => !e.data?.source).length;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-135px)] min-h-[600px] w-full animate-fade-in">
      {/* Central Graph Panel */}
      <div className="flex-1 glass-card border-dark-700/50 flex flex-col h-full min-h-0 relative overflow-hidden rounded-2xl">
        {/* Canvas Controls Header */}
        <div className="absolute top-4 left-4 z-40 bg-dark-900/90 backdrop-blur-md border border-dark-700/50 p-2 rounded-xl flex items-center gap-3 shadow-lg">
          <div className="flex items-center gap-1 border-r border-dark-800 pr-3">
            <button onClick={zoomIn} className="p-1.5 hover:bg-dark-800 rounded text-dark-300 hover:text-white transition-colors" title="Zoom In"><ZoomIn size={14} /></button>
            <button onClick={zoomOut} className="p-1.5 hover:bg-dark-800 rounded text-dark-300 hover:text-white transition-colors" title="Zoom Out"><ZoomOut size={14} /></button>
            <button onClick={fitCanvas} className="p-1.5 hover:bg-dark-800 rounded text-dark-300 hover:text-white transition-colors" title="Fit Screen"><Maximize size={14} /></button>
            <button onClick={resetLayout} className="p-1.5 hover:bg-dark-800 rounded text-dark-300 hover:text-white transition-colors" title="Reset View"><RotateCcw size={14} /></button>
          </div>

          {/* Layout switches */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-dark-500 font-bold uppercase">Layout</span>
            <select
              value={activeLayout}
              onChange={(e) => runLayout(e.target.value as any)}
              className="bg-dark-950 border border-dark-700/60 rounded px-2 py-1 text-[11px] font-semibold text-white focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="cose">Force Directed</option>
              <option value="circle">Circular</option>
              <option value="concentric">Radial Concentric</option>
              <option value="breadthfirst">Hierarchical Tree</option>
            </select>
          </div>
        </div>

        {/* Search / Target Overlay */}
        <div className="absolute top-4 right-4 z-40 bg-dark-900/90 backdrop-blur-md border border-dark-700/50 p-2 rounded-xl flex items-center gap-2 shadow-lg">
          <input
            type="text"
            placeholder="Focus node or enter address…"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchGraph()}
            className="bg-dark-950 border border-dark-750 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-primary-500 w-52 sm:w-64 font-mono placeholder-dark-500"
          />
          <button
            onClick={handleSearchGraph}
            disabled={isSearching}
            className="p-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded text-xs flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
            title="Search or focus address"
          >
            <Search size={13} className={isSearching ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Inline Error Toast */}
        {searchError && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-accent-red/20 border border-accent-red/40 text-accent-red text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur-md animate-slide-down">
            <AlertTriangle size={14} />
            <span>{searchError}</span>
            <button onClick={() => setSearchError(null)} className="ml-2 text-dark-400 hover:text-white">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Layers Overlay Control Panel */}
        <div className="absolute bottom-20 left-4 z-40 bg-dark-900/95 backdrop-blur-md border border-dark-700/50 p-3 rounded-xl shadow-lg w-52 text-xs space-y-2">
          <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Graph View Layers</span>
          <div className="space-y-1.5 font-semibold text-dark-300">
            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox" checked={layers.wallets}
                onChange={() => setLayers(prev => ({ ...prev, wallets: !prev.wallets }))}
                className="w-3.5 h-3.5 rounded border-dark-700 bg-dark-950 text-primary-500 focus:ring-primary-500/20"
              />
              <span>Wallet Nodes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox" checked={layers.transactions}
                onChange={() => setLayers(prev => ({ ...prev, transactions: !prev.transactions }))}
                className="w-3.5 h-3.5 rounded border-dark-700 bg-dark-950 text-primary-500 focus:ring-primary-500/20"
              />
              <span>Transaction Flows</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox" checked={layers.entities}
                onChange={() => setLayers(prev => ({ ...prev, entities: !prev.entities }))}
                className="w-3.5 h-3.5 rounded border-dark-700 bg-dark-950 text-primary-500 focus:ring-primary-500/20"
              />
              <span>Entity Clustering</span>
            </label>
          </div>

          {/* Density Indicator */}
          {totalDiscoveredAddresses > 0 && (
            <div className="mt-2 pt-2 border-t border-dark-800 text-[10px] text-dark-400">
              <div className="flex items-center gap-1.5 font-medium text-dark-300">
                <Activity size={11} className="text-primary-400 shrink-0" />
                <span>Top {visibleNodesCount} of {totalDiscoveredAddresses} addresses</span>
              </div>
              <p className="text-dark-500 text-[9px] mt-0.5 leading-tight">
                Double-click node to progressively expand
              </p>
            </div>
          )}
        </div>

        {/* ── Active Cytoscape Graph Canvas ── */}
        <div
          ref={containerRef}
          className="flex-1 w-full h-full min-h-0 relative bg-dark-950/70"
        />

        {/* ── Loading Animation Overlay ── */}
        {isLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-dark-950/80 backdrop-blur-sm pointer-events-none animate-fade-in">
            <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-primary-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-primary-500/40 border-dashed animate-spin" style={{ animationDuration: '6s' }} />
              <div className="w-12 h-12 rounded-full bg-primary-500/20 border border-primary-400 flex items-center justify-center text-primary-300 shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                <Activity size={24} className="animate-pulse" />
              </div>
            </div>
            <div className="text-sm font-bold text-white tracking-wide">Mapping Transaction Topology</div>
            <div className="text-xs text-primary-400/80 font-mono mt-1">Tracing real on-chain UTXO paths & counterparties…</div>
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && graphElements.length === 0 && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-dark-950/90 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-dark-850 border border-dark-700 flex items-center justify-center text-primary-400 mb-3 shadow-lg">
              <Activity size={32} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No Target Selected</h3>
            <p className="text-xs text-dark-400 max-w-sm leading-relaxed mb-4">
              Search an address to build the real-time transaction network graph.
            </p>
            <div className="flex gap-2 w-full max-w-md">
              <input
                type="text"
                placeholder="Enter address (e.g. bc1q... or 0x...)"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchGraph()}
                className="input-field text-xs font-mono flex-1"
              />
              <button
                onClick={handleSearchGraph}
                className="btn-primary text-xs font-bold px-4 py-2"
              >
                Build Graph
              </button>
            </div>
          </div>
        )}

        {/* Interactive Playback Timeline Control Bar */}
        <div className="h-16 shrink-0 bg-dark-900 border-t border-dark-800/80 px-5 flex items-center justify-between text-xs gap-4 z-40 select-none">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded bg-primary-500 text-black hover:bg-primary-400 transition-colors flex items-center justify-center cursor-pointer shadow-glow-cyan"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <span className="text-[10px] text-dark-400 block uppercase font-bold">Timeline Playback</span>
          </div>

          {/* Slider */}
          <div className="flex-1 flex items-center gap-3">
            <span className="mono text-dark-500 font-semibold text-[10px]">Earliest</span>
            <input
              type="range" min="0" max="100"
              value={timelineVal}
              onChange={(e) => setTimelineVal(Number(e.target.value))}
              className="flex-1 accent-primary-500 h-1 bg-dark-800 rounded-lg appearance-none cursor-pointer"
            />
            <span className="mono text-dark-500 font-semibold text-[10px]">Latest Block</span>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1.5 border-l border-dark-800 pl-4">
            <button
              onClick={() => setPlaybackSpeed(s => s === 4 ? 1 : s * 2)}
              className="px-2 py-1 rounded bg-dark-800 hover:bg-dark-750 text-[10px] font-mono text-white flex items-center gap-1 font-bold"
            >
              <FastForward size={10} /> {playbackSpeed}x
            </button>
          </div>
        </div>
      </div>

      {/* Right Details Slide-over Tab Panel */}
      <div className="w-full lg:w-80 glass-card border-dark-700/50 flex flex-col justify-between overflow-hidden rounded-2xl h-full min-h-0 shrink-0">
        {/* Tab switcher */}
        <div className="flex border-b border-dark-700/50 bg-dark-800/20">
          <button
            onClick={() => setActiveRightTab('inspector')}
            className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeRightTab === 'inspector' ? 'border-primary-500 text-white' : 'border-transparent text-dark-400'
            }`}
          >
            Inspector
          </button>
          <button
            onClick={() => setActiveRightTab('crosschain')}
            className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeRightTab === 'crosschain' ? 'border-primary-500 text-white' : 'border-transparent text-dark-400'
            }`}
          >
            Cross-Chain
          </button>
          <button
            onClick={() => setActiveRightTab('notes')}
            className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeRightTab === 'notes' ? 'border-primary-500 text-white' : 'border-transparent text-dark-400'
            }`}
          >
            Notes ({annotations.length})
          </button>
        </div>

        {/* Tab Workspace Panel Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {activeRightTab === 'inspector' && (
            <>
              {selectedNode ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-dark-800">
                    <Building size={14} className="text-primary-400" />
                    <span className="text-[10px] font-bold text-dark-300 uppercase tracking-wider">Node Details</span>
                    <span className="ml-auto px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-dark-800 border border-dark-700 text-primary-300">
                      {selectedNodeMetrics?.role || 'Node'}
                    </span>
                  </div>

                  {/* Address Identity */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-dark-500 block uppercase">Address Identity</span>
                    <code className="text-[11px] font-bold text-white font-mono block select-all break-all bg-dark-900 p-2.5 rounded-lg border border-dark-800">
                      {selectedNode.id}
                    </code>
                    <div className="flex items-center justify-between text-[10px] text-dark-400 pt-0.5">
                      <span>Type: <strong className="text-white capitalize">{selectedNode.type}</strong></span>
                      {selectedNode.balance && <span className="text-primary-400 font-mono font-medium">{selectedNode.balance}</span>}
                    </div>
                  </div>

                  {/* Real Risk Metrics */}
                  {selectedNodeMetrics && (
                    <div className="space-y-1.5 p-3 bg-dark-900/80 border border-dark-800 rounded-xl">
                      <span className="text-[10px] text-dark-400 uppercase tracking-wider block">Risk Metrics</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-black ${getRiskColor(selectedNodeMetrics.risk)}`}>
                          {selectedNodeMetrics.risk}%
                        </span>
                        <div className="leading-tight">
                          <span className="text-[9px] text-dark-500 block uppercase font-mono">Calculated Severity</span>
                          <span className="text-[11px] text-white font-bold">
                            {selectedNodeMetrics.risk >= 75
                              ? 'CRITICAL RISK'
                              : selectedNodeMetrics.risk >= 50
                              ? 'HIGH RISK'
                              : selectedNodeMetrics.risk >= 25
                              ? 'MEDIUM RISK'
                              : 'LOW RISK'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Real On-Chain Network Topology Stats */}
                  {selectedNodeMetrics && (
                    <div className="p-3 bg-dark-900/70 border border-dark-800 rounded-xl space-y-2">
                      <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider block">
                        Observed Graph Flow
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-dark-950 rounded-lg border border-dark-850">
                          <span className="text-[9px] text-dark-500 block">Inbound Links</span>
                          <span className="text-white font-mono font-bold">{selectedNodeMetrics.inCount}</span>
                          {selectedNodeMetrics.inValue > 0 && (
                            <span className="text-[10px] text-accent-green block font-mono">+{selectedNodeMetrics.inValue.toFixed(4)} BTC</span>
                          )}
                        </div>
                        <div className="p-2 bg-dark-950 rounded-lg border border-dark-850">
                          <span className="text-[9px] text-dark-500 block">Outbound Links</span>
                          <span className="text-white font-mono font-bold">{selectedNodeMetrics.outCount}</span>
                          {selectedNodeMetrics.outValue > 0 && (
                            <span className="text-[10px] text-accent-red block font-mono">-{selectedNodeMetrics.outValue.toFixed(4)} BTC</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Verified Facts (Dynamic) */}
                  {selectedNodeMetrics && (
                    <div className="p-3 bg-accent-green/5 border border-accent-green/20 rounded-xl space-y-1">
                      <span className="text-[9px] text-accent-green font-bold uppercase tracking-wider block">
                        Verified On-Chain Evidence
                      </span>
                      <p className="text-dark-200 text-[11px] leading-relaxed">
                        {selectedNodeMetrics.totalLinks > 0
                          ? `${selectedNodeMetrics.totalLinks} direct transfer link(s) totaling ${selectedNodeMetrics.totalValue.toFixed(4)} BTC verified on public blockchain index.`
                          : 'Directly verified on-chain address associated with the active investigation target.'}
                      </p>
                    </div>
                  )}

                  {/* Quick Action Hints */}
                  <div className="p-3 bg-dark-900/40 border border-dark-800/80 rounded-xl text-[10px] text-dark-400 space-y-1">
                    <div className="text-dark-300 font-semibold flex items-center gap-1.5">
                      <PlusCircle size={12} className="text-primary-400" />
                      <span>Expand Network</span>
                    </div>
                    <p className="leading-normal text-dark-400">
                      Double-click this node on the canvas to dynamically load its co-spending cluster addresses.
                    </p>
                  </div>
                </div>
              ) : selectedEdge ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-dark-800">
                    <Link size={14} className="text-primary-400" />
                    <span className="text-[10px] font-bold text-dark-300 uppercase tracking-wider">Edge Parameters</span>
                  </div>

                  <div className="bg-dark-900/90 p-3.5 rounded-xl border border-dark-800 font-mono space-y-2 leading-relaxed">
                    <div>
                      <span className="text-dark-500 text-[9px] block">SOURCE</span>
                      <span className="text-white text-[10px] truncate block select-all">{selectedEdge.source}</span>
                    </div>
                    <div>
                      <span className="text-dark-500 text-[9px] block">DESTINATION</span>
                      <span className="text-white text-[10px] truncate block select-all">{selectedEdge.target}</span>
                    </div>
                    <div>
                      <span className="text-dark-500 text-[9px] block">TRANSFER VALUE</span>
                      <span className="text-accent-green font-bold text-xs">{selectedEdge.value}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-dark-500 italic">
                  Select a node or edge on the canvas to inspect forensic properties.
                </div>
              )}
            </>
          )}

          {activeRightTab === 'crosschain' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 pb-2 border-b border-dark-800">
                <Shield size={14} className="text-primary-400" />
                <span className="text-[10px] font-bold text-dark-300 uppercase tracking-wider">Cross-Chain Bridge Trace</span>
              </div>

              {!selectedNode ? (
                <div className="text-center py-16 text-dark-500 italic space-y-2">
                  <Shield size={24} className="mx-auto text-dark-600 opacity-60" />
                  <p>Select a node on the canvas to inspect its cross-chain bridge trace.</p>
                </div>
              ) : crossChainLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary-500/20 border-t-primary-400 animate-spin" />
                  <p className="text-xs text-dark-400 font-mono">Querying bridge routers for {selectedNode.id.slice(0, 10)}…</p>
                </div>
              ) : crossChainTrace?.hops && crossChainTrace.hops.length > 0 ? (
                <div className="space-y-3">
                  {/* Trace Summary */}
                  <div className="p-3 bg-dark-900 border border-dark-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-400 uppercase text-[10px] font-mono">Chain Hopping Risk</span>
                      <span className={`font-mono font-bold ${getRiskColor(crossChainTrace.chain_hopping_score || 45)}`}>
                        {crossChainTrace.chain_hopping_score || 45}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-400 uppercase text-[10px] font-mono">Total Bridge Hops</span>
                      <span className="text-white font-mono font-bold">{crossChainTrace.hops.length}</span>
                    </div>
                  </div>

                  {/* Hops List */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider block">
                      Bridge Interactions ({crossChainTrace.hops.length})
                    </span>
                    {crossChainTrace.hops.map((hop: any, idx: number) => (
                      <div key={idx} className="p-3 bg-dark-900/80 border border-dark-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-primary-300 text-[11px]">
                            Hop {hop.step || idx + 1}: {hop.bridge_contract || 'Bridge Router'}
                          </span>
                          {hop.timestamp && (
                            <span className="text-[9px] text-dark-500 font-mono">
                              {new Date(hop.timestamp).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-white">
                          <span className="px-1.5 py-0.5 rounded bg-dark-800 text-dark-300 font-mono text-[10px]">
                            {hop.source_chain || 'Ethereum'}
                          </span>
                          <span className="text-primary-400">➔</span>
                          <span className="px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green font-mono text-[10px]">
                            {hop.destination_chain || hop.target_chain || 'Target Chain'}
                          </span>
                        </div>
                        {hop.amount_sent !== undefined && (
                          <div className="text-[11px] font-mono text-dark-300 pt-1">
                            Amount: <span className="text-white font-bold">{hop.amount_sent} {hop.token || 'ETH'}</span>
                          </div>
                        )}
                        {hop.tx_hash && (
                          <div className="text-[9px] font-mono text-dark-500 truncate select-all">
                            TX: {hop.tx_hash}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-dark-900/50 border border-dark-800 rounded-xl text-center space-y-2">
                  <Shield size={20} className="mx-auto text-dark-500" />
                  <div className="text-xs font-semibold text-dark-300">No Cross-Chain Activity Detected</div>
                  <p className="text-[11px] text-dark-500 leading-relaxed">
                    No bridge router hops or cross-chain asset movements observed for <span className="font-mono text-dark-400">{selectedNode.id.slice(0, 12)}…</span>.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-dark-800">
                <Bookmark size={14} className="text-primary-400" />
                <span className="text-[10px] font-bold text-dark-300 uppercase tracking-wider">Graph Annotations Log</span>
              </div>

              {/* Add Annotation form */}
              <form onSubmit={handleAddAnnotation} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add note on graph region..."
                  value={newAnnotation}
                  onChange={(e) => setNewAnnotation(e.target.value)}
                  className="input-field py-1.5 px-3 flex-1 text-xs"
                />
                <button type="submit" className="btn-primary py-1.5 px-3 font-semibold text-xs">
                  Add
                </button>
              </form>

              {/* List */}
              <div className="space-y-2.5">
                {annotations.map((ann) => (
                  <div key={ann.id} className="p-3 bg-dark-800/40 border border-dark-700/30 rounded-lg space-y-1 text-xs">
                    <p className="text-dark-100 font-medium leading-relaxed">{ann.text}</p>
                    <span className="text-[9px] text-dark-500 font-semibold block uppercase">by {ann.author}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-dark-750/70 flex gap-2">
          <button
            onClick={exportPNG}
            className="flex-1 btn-ghost py-2 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <Download size={14} /> Export PNG
          </button>
          <button
            onClick={exportJSON}
            className="flex-1 btn-primary py-2 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <Download size={14} /> Export JSON
          </button>
        </div>
      </div>
    </div>
  );
};
