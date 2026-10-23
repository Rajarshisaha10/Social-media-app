import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info, 
  Network, 
  User, 
  Hash, 
  Play, 
  Pause,
  ExternalLink,
  Cpu,
  Layers
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function GraphVisualizer({ onUserClick }) {
  const { user } = useAuth();
  const canvasRef = useRef(null);

  const [graphData, setGraphData] = useState({ nodes: [], links: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'USERS' | 'TOPICS'

  // Physics simulation state stored in refs to avoid React re-render lag during 60fps canvas loop
  const simNodesRef = useRef([]);
  const simLinksRef = useRef([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const draggingNodeRef = useRef(null);
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
  const pulsePhaseRef = useRef(0);

  // 1. Fetch live Neo4j AuraDB graph data
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.getGraphData();
        if (mounted && res?.nodes) {
          setGraphData(res);
        }
      } catch (err) {
        console.error('Failed to load Neo4j graph data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  // 2. Initialize physics coordinates when data arrives
  useEffect(() => {
    if (!graphData.nodes || graphData.nodes.length === 0) return;

    const width = canvasRef.current?.clientWidth || 800;
    const height = canvasRef.current?.clientHeight || 600;

    // Center coordinates
    const cx = width / 2;
    const cy = height / 2;

    const initialNodes = graphData.nodes.map((n, i) => {
      const isMe = user?.user_id && n.userId === user.user_id;
      const angle = (i / graphData.nodes.length) * Math.PI * 2;
      const radius = n.type === 'user' ? (isMe ? 0 : 160 + Math.random() * 60) : 280 + Math.random() * 80;

      return {
        ...n,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: n.type === 'user' ? (isMe ? 22 : 16) : 10 + Math.min(n.degree || 1, 6) * 1.5,
        isMe,
      };
    });

    const nodeMap = new Map(initialNodes.map((n) => [n.id, n]));

    const initialLinks = graphData.links
      .map((l) => ({
        ...l,
        sourceNode: nodeMap.get(l.source),
        targetNode: nodeMap.get(l.target),
      }))
      .filter((l) => l.sourceNode && l.targetNode);

    simNodesRef.current = initialNodes;
    simLinksRef.current = initialLinks;

    // Auto-select logged-in user if found
    const meNode = initialNodes.find((n) => n.isMe) || initialNodes[0];
    if (meNode) setSelectedNode(meNode);
  }, [graphData, user?.user_id]);

  // 3. Canvas Physics & Render Loop (Coulomb Repulsion + Spring Restoring + Velocity Verlet)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const runPhysicsStep = () => {
      const nodes = simNodesRef.current;
      const links = simLinksRef.current;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const cx = width / 2;
      const cy = height / 2;

      // Force 1: Center Gravity
      for (const n of nodes) {
        if (n === draggingNodeRef.current) continue;
        const dx = cx - n.x;
        const dy = cy - n.y;
        n.vx += dx * 0.0015;
        n.vy += dy * 0.0015;
      }

      // Force 2: Repulsion (Coulomb's Law)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy || 1;
          if (distSq < 160000) {
            const dist = Math.sqrt(distSq);
            const force = (a.radius + b.radius + 70) / (distSq + 20);
            const fx = (dx / dist) * force * 15;
            const fy = (dy / dist) * force * 15;
            if (a !== draggingNodeRef.current) { a.vx -= fx; a.vy -= fy; }
            if (b !== draggingNodeRef.current) { b.vx += fx; b.vy += fy; }
          }
        }
      }

      // Force 3: Springs (Hooke's Law along graph edges)
      for (const l of links) {
        const a = l.sourceNode;
        const b = l.targetNode;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desiredDist = l.type === 'FOLLOWS' ? 140 : 110;
        const springForce = (dist - desiredDist) * 0.035;
        const fx = (dx / dist) * springForce;
        const fy = (dy / dist) * springForce;

        if (a !== draggingNodeRef.current) { a.vx += fx; a.vy += fy; }
        if (b !== draggingNodeRef.current) { b.vx -= fx; b.vy -= fy; }
      }

      // Apply damping & position updates
      for (const n of nodes) {
        if (n === draggingNodeRef.current) continue;
        n.vx *= 0.88;
        n.vy *= 0.88;
        n.x += n.vx;
        n.y += n.vy;
      }
    };

    const render = () => {
      runPhysicsStep();
      pulsePhaseRef.current += 0.04;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const { x: tx, y: ty, k: tk } = transformRef.current;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Dark Tech Background with Coordinate Dots
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);

      // Apply Pan & Zoom Transform
      ctx.translate(tx, ty);
      ctx.scale(tk, tk);

      // Background grid points
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      for (let x = -width; x < width * 2; x += 40) {
        for (let y = -height; y < height * 2; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const nodes = simNodesRef.current;
      const links = simLinksRef.current;

      // Draw Links
      for (const l of links) {
        const a = l.sourceNode;
        const b = l.targetNode;

        const isHighlighted =
          demoMode && (
            (selectedNode && (a.id === selectedNode.id || b.id === selectedNode.id))
          );

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        if (l.type === 'FOLLOWS') {
          ctx.strokeStyle = isHighlighted ? '#fbbf24' : 'rgba(251, 191, 36, 0.4)';
          ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
          ctx.setLineDash([]);
        } else {
          // INTERESTED_IN
          ctx.strokeStyle = isHighlighted ? '#38bdf8' : 'rgba(56, 189, 248, 0.22)';
          ctx.lineWidth = isHighlighted ? 2 : 1;
          ctx.setLineDash([4, 4]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated Traveling Photon Pulse in Demo Mode
        if (demoMode && isHighlighted) {
          const t = (pulsePhaseRef.current % 1);
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = l.type === 'FOLLOWS' ? '#fbbf24' : '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw Nodes
      for (const n of nodes) {
        const isSelected = selectedNode && selectedNode.id === n.id;
        const isHovered = hoveredNode && hoveredNode.id === n.id;

        // Outer Glow for Selected / Me node
        if (n.isMe || isSelected) {
          const pulse = Math.sin(pulsePhaseRef.current * 2) * 4;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 6 + pulse, 0, Math.PI * 2);
          ctx.fillStyle = n.isMe ? 'rgba(251, 191, 36, 0.18)' : 'rgba(56, 189, 248, 0.22)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

        if (n.type === 'user') {
          ctx.fillStyle = n.isMe ? '#f59e0b' : '#3b82f6';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isSelected ? 3 : 1.5;
        } else {
          // Topic node
          ctx.fillStyle = '#10b981';
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
          ctx.lineWidth = 1;
        }

        ctx.fill();
        ctx.stroke();

        // Node Label
        ctx.font = n.isMe || isSelected ? 'bold 12px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.fillStyle = n.type === 'user' ? '#f8fafc' : '#a7f3d0';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + n.radius + 14);
      }

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [demoMode, selectedNode, hoveredNode]);

  // 4. Mouse / Touch Interaction Handlers (Click, Drag, Pan, Zoom)
  const getNodeAtCoords = (screenX, screenY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const { x: tx, y: ty, k: tk } = transformRef.current;
    const worldX = (screenX - tx) / tk;
    const worldY = (screenY - ty) / tk;

    for (let i = simNodesRef.current.length - 1; i >= 0; i--) {
      const n = simNodesRef.current[i];
      const dx = worldX - n.x;
      const dy = worldY - n.y;
      if (dx * dx + dy * dy <= (n.radius + 5) * (n.radius + 5)) {
        return n;
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hitNode = getNodeAtCoords(x, y);

    if (hitNode) {
      draggingNodeRef.current = hitNode;
      setSelectedNode(hitNode);
    } else {
      isPanningRef.current = true;
      startPanRef.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y };
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggingNodeRef.current) {
      const { x: tx, y: ty, k: tk } = transformRef.current;
      draggingNodeRef.current.x = (x - tx) / tk;
      draggingNodeRef.current.y = (y - ty) / tk;
      draggingNodeRef.current.vx = 0;
      draggingNodeRef.current.vy = 0;
    } else if (isPanningRef.current) {
      transformRef.current.x = e.clientX - startPanRef.current.x;
      transformRef.current.y = e.clientY - startPanRef.current.y;
    } else {
      const hitNode = getNodeAtCoords(x, y);
      setHoveredNode(hitNode);
      canvasRef.current.style.cursor = hitNode ? 'pointer' : 'grab';
    }
  };

  const handleMouseUp = () => {
    draggingNodeRef.current = null;
    isPanningRef.current = false;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newK = Math.min(Math.max(transformRef.current.k * zoomFactor, 0.4), 3.0);
    transformRef.current.k = newK;
  };

  const handleResetView = () => {
    transformRef.current = { x: 0, y: 0, k: 1 };
  };

  // Find neighbors of the selected node
  const neighborData = useMemo(() => {
    if (!selectedNode) return { neighbors: [], sharedTopics: [] };
    const links = simLinksRef.current;
    const connected = [];

    for (const l of links) {
      if (l.sourceNode.id === selectedNode.id) {
        connected.push({ node: l.targetNode, edgeType: l.type });
      } else if (l.targetNode.id === selectedNode.id) {
        connected.push({ node: l.sourceNode, edgeType: l.type });
      }
    }
    return { neighbors: connected };
  }, [selectedNode]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '620px', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)', background: '#0a0d14', boxShadow: 'var(--shadow-md)' }}>
      {/* Interactive Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
      />

      {/* Top Floating Control Bar */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 10 }}>
        {/* Title & Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', pointerEvents: 'auto' }}>
          <Network size={18} color="#38bdf8" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Neo4j Graph Topology Studio</span>
              <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                AuraDB Live
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {graphData.stats?.usersCount || 12} Engineers • {graphData.stats?.topicsCount || 35} Bio Topics • {graphData.stats?.totalLinks || 71} Edges
            </div>
          </div>
        </div>

        {/* Demo Mode & Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={() => setDemoMode((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: demoMode ? '#f59e0b' : 'rgba(15, 23, 42, 0.85)',
              color: demoMode ? '#000000' : '#f8fafc',
              border: demoMode ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease',
            }}
          >
            {demoMode ? <Pause size={14} /> : <Play size={14} />}
            <span>{demoMode ? 'Stop 2-Hop Demo' : '✨ Explain to Teacher'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              type="button"
              onClick={() => { transformRef.current.k = Math.min(transformRef.current.k * 1.2, 3); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '8px 10px', cursor: 'pointer' }}
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              type="button"
              onClick={() => { transformRef.current.k = Math.max(transformRef.current.k * 0.8, 0.4); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '8px 10px', cursor: 'pointer' }}
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '8px 10px', cursor: 'pointer' }}
              title="Reset View"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Educational Explanation Card (Visible when Demo Mode is Active) */}
      {demoMode && (
        <div style={{ position: 'absolute', bottom: 16, left: 16, maxWidth: '420px', background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '16px', padding: '16px', zIndex: 10, color: '#f8fafc', boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '6px' }}>
            <Cpu size={16} color="#fbbf24" />
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              How the Graph Recommendation Works
            </h4>
          </div>
          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '10px' }}>
            <strong>Index-Free Adjacency:</strong> Neo4j does not scan tables. It follows memory pointers from <code>(User)</code> $\rightarrow$ <code>(Topic)</code> $\rightarrow$ <code>(Candidate)</code>. Notice the traveling pulse along the glowing edges!
          </p>
          <div style={{ background: '#020617', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8', overflowX: 'auto' }}>
            MATCH (me)-[:INTERESTED_IN]-&gt;(t)&lt;-[:INTERESTED_IN]-(other)<br/>
            RETURN other, count(t) AS sharedTopics
          </div>
        </div>
      )}

      {/* Right Floating Node Inspector */}
      {selectedNode && (
        <div style={{ position: 'absolute', top: 76, right: 16, width: '280px', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '16px', zIndex: 10, color: '#f8fafc', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '12px' }}>
            {selectedNode.type === 'user' ? (
              <img
                src={selectedNode.pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                alt={selectedNode.label}
                style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: selectedNode.isMe ? '2px solid #fbbf24' : '2px solid #38bdf8' }}
              />
            ) : (
              <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hash size={20} color="#10b981" />
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedNode.label}
              </h4>
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: selectedNode.type === 'user' ? (selectedNode.isMe ? '#fbbf24' : '#38bdf8') : '#10b981' }}>
                {selectedNode.isMe ? 'You (Logged In)' : (selectedNode.type === 'user' ? 'Engineer Node' : 'Bio Topic Hub')}
              </span>
            </div>
          </div>

          {selectedNode.bio && (
            <p style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4', marginBottom: '12px', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '8px' }}>
              {selectedNode.bio}
            </p>
          )}

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '8px' }}>
              Graph Connections ({neighborData.neighbors.length}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '130px', overflowY: 'auto' }}>
              {neighborData.neighbors.map((conn, i) => (
                <span
                  key={i}
                  onClick={() => setSelectedNode(conn.node)}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: conn.node.type === 'user' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: conn.node.type === 'user' ? '#7dd3fc' : '#6ee7b7',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {conn.node.label}
                </span>
              ))}
            </div>
          </div>

          {selectedNode.type === 'user' && !selectedNode.isMe && (
            <button
              type="button"
              onClick={() => onUserClick?.(selectedNode.userId)}
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '7px 0',
                borderRadius: '8px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              View Full Profile
            </button>
          )}
        </div>
      )}

      {/* Legend at Bottom Right */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: 14, fontSize: '11px', color: '#94a3b8', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
          <span>You</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
          <span>Engineer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
          <span>Bio Topic</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 16, height: 2, background: '#fbbf24' }} />
          <span>Follows</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 16, height: 2, borderBottom: '2px dashed #38bdf8' }} />
          <span>Bio Affinity</span>
        </div>
      </div>
    </div>
  );
}
