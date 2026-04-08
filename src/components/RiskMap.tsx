import { useRef, useEffect, useState, useCallback } from 'react';
import './RiskMap.css';

const ICON_MAP: Record<string, string> = {
  eth: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  lido: 'https://assets.coingecko.com/coins/images/13442/small/steth_logo.png',
  mellow: 'https://www.google.com/s2/favicons?domain=mellow.finance&sz=64',
  veda: 'https://www.google.com/s2/favicons?domain=veda.tech&sz=64',
  aave: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
  spark: 'https://www.google.com/s2/favicons?domain=spark.fi&sz=64',
  resolv: 'https://www.google.com/s2/favicons?domain=resolv.xyz&sz=64',
  ethena: 'https://assets.coingecko.com/coins/images/33613/small/usde.png',
  plasma: 'https://www.google.com/s2/favicons?domain=plasma.finance&sz=64',
  base: 'https://www.google.com/s2/favicons?domain=base.org&sz=64',
  hex: 'https://assets.coingecko.com/coins/images/10103/small/HEX-logo.png',
  usdt: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  usdc: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
};

interface MetricDef {
  label: string;
  value: string;
  valueColor?: string;
  comment?: string;
  children?: MetricDef[];
}

interface NodeDef {
  id: string; text: string; icons: string[]; hidden?: boolean; level: number; children?: string[];
  metrics?: MetricDef[];
}

const NODES: NodeDef[] = [
  // Level 1
  { id: 'vault', text: 'Vault earnETH', icons: ['eth'], level: 0, children: ['platform'], metrics: [
    { label: 'NAV Admin Score:', value: 'A+', valueColor: '#34D399', comment: 'update: every hour, admin: Lambda',
      children: [
        { label: '1h cashflow', value: '+3%', valueColor: '#34D399' },
        { label: 'oracle value', value: '64.2K ETH', valueColor: '#34D399', comment: '(6 min ago, sources)', children: [
          { label: 'volatility cross source', value: '< 1%', valueColor: '#34D399' },
          { label: 'deviation w cashflow', value: '0.01%', valueColor: '#34D399', comment: '(last submit = 1h ago)' },
          { label: 'deviation w/o cashflow', value: '3.01%', valueColor: '#34D399', comment: '(last submit = 1h ago)' },
        ]},
        { label: 'liquid NAV', value: '61 ETH', valueColor: '#34D399', children: [
          { label: 'oracle deviation', value: '<5 %', valueColor: '#34D399', comment: '(1 min ago)' },
        ]},
      ],
    },
    { label: 'TVL:', value: '$199.8M', valueColor: '#34D399', comment: '(live, 3 sec ago)' },
    { label: 'Curator Score:', value: 'A+', valueColor: '#34D399', comment: 'Mellow' },
  ]},
  // Level 2
  { id: 'platform', text: 'Platform: lido v3', icons: ['lido'], level: 1, children: ['hold_eth_3','strategy','lido_3','lido_gg','lido_dvt','lido_locked_3'], metrics: [
    { label: 'Platform Score:', value: 'A+', valueColor: '#34D399', children: [
      { label: 'exploits history', value: 'none', valueColor: '#34D399' },
      { label: 'sc upgrades', value: 'audited', valueColor: '#34D399', comment: '1 month ago' },
      { label: 'multi-sigs concentration', value: 'low', valueColor: '#34D399' },
      { label: 'Failed withdraw', value: '< 0.01% of TVL', valueColor: '#34D399', comment: '12 min ago' },
      { label: 'The biggest withdrawal', value: '< 1% of TVL', valueColor: '#34D399', comment: '17h ago' },
    ]},
  ]},
  // Level 3
  { id: 'hold_eth_3', text: 'Holdings in Ethereum', icons: ['eth'], level: 2, children: ['eth_4','weth_4','hex_4'], metrics: [] },
  { id: 'strategy', text: 'Vault stRategy ETH', icons: ['mellow'], level: 2, children: ['hold_eth_4','hold_plasma_4','hold_base_4','aave_eth_4','aave_plasma_4','spark_4','resolv_4','mellow_4','lido_locked_4'] },
  { id: 'lido_3', text: 'Lido', icons: ['lido'], level: 2, children: ['steth_4'] },
  { id: 'lido_gg', text: 'Lido GG', icons: ['veda'], level: 2, children: ['hidden_4a'] },
  { id: 'lido_dvt', text: 'Lido simple DVT', icons: ['mellow'], level: 2, children: ['hidden_4b'] },
  { id: 'lido_locked_3', text: 'Lido (locked) - pending deposit', icons: ['lido'], level: 2, children: ['hidden_4c'] },
  // Level 4
  { id: 'eth_4', text: 'ETH', icons: ['eth'], level: 3, metrics: [
    { label: 'Allocation', value: '$1,128,472', valueColor: '#34D399', comment: '(3 sec ago)', children: [
      { label: 'price', value: '$2127.15', valueColor: '#34D399', comment: '(source = Chainlink, 15 min ago)', children: [
        { label: 'deviation last NAV submission', value: '< 1%', valueColor: '#34D399' },
        { label: 'Swap Price deviation', value: '< 3%', valueColor: '#34D399', comment: 'DEXes, 1inch API' },
        { label: 'volatility', value: '< 1%', valueColor: '#34D399', comment: 'Redstone, Chainlink, Coingecko, Moralis, Alchemy, Binance, Coinbase' },
      ]},
      { label: 'balance', value: '530.50', valueColor: '#34D399', comment: '(block_num = 13412345, 3 sec ago)', children: [
        { label: 'deviation last NAV submission', value: '< 0.001%', valueColor: '#34D399' },
      ]},
    ]},
  ]},
  { id: 'weth_4', text: 'wETH', icons: ['eth'], level: 3, metrics: [
    { label: 'Allocation:', value: '$8', valueColor: '#34D399', comment: 'live, 3 sec ago', children: [
      { label: 'TBD', value: '', valueColor: '#34D399' },
    ]},
  ]},
  { id: 'hex_4', text: 'HEX', icons: ['hex'], level: 3, metrics: [
    { label: 'Allocation:', value: '$1.28', valueColor: '#34D399', comment: 'live, 3 sec ago', children: [
      { label: 'TBD', value: '', valueColor: '#34D399' },
    ]},
  ]},
  { id: 'hold_eth_4', text: 'Holdings in Ethereum', icons: ['eth'], level: 3, children: ['hidden_5a'] },
  { id: 'hold_plasma_4', text: 'Holdings in Plasma', icons: ['plasma'], level: 3, children: ['hidden_5b'] },
  { id: 'hold_base_4', text: 'Holdings in Base', icons: ['base'], level: 3, children: ['hidden_5c'] },
  { id: 'steth_4', text: 'stETH', icons: ['lido'], level: 3 },
  { id: 'aave_eth_4', text: 'Aave v3 in Ethereum', icons: ['aave', 'eth'], level: 3, children: ['steth_5','usdt_5','usdc_5','usde_5'] },
  { id: 'aave_plasma_4', text: 'Aave v3 in Plasma', icons: ['aave', 'plasma'], level: 3, children: ['hidden_5d'] },
  { id: 'spark_4', text: 'Spark Lend', icons: ['spark', 'eth'], level: 3, children: ['hidden_5e'] },
  { id: 'resolv_4', text: 'Resolv', icons: ['resolv', 'eth'], level: 3, children: ['hidden_5f'] },
  { id: 'mellow_4', text: 'Mellow', icons: ['mellow', 'eth'], level: 3, children: ['hidden_5g'] },
  { id: 'lido_locked_4', text: 'Lido locked', icons: ['lido', 'eth'], level: 3, children: ['hidden_5h'] },
  { id: 'hidden_4a', text: '+', icons: [], level: 3, hidden: true },
  { id: 'hidden_4b', text: '+', icons: [], level: 3, hidden: true },
  { id: 'hidden_4c', text: '+', icons: [], level: 3, hidden: true },
  // Level 5
  { id: 'steth_5', text: 'stETH', icons: ['lido'], level: 4 },
  { id: 'usdt_5', text: 'USDT', icons: ['usdt'], level: 4 },
  { id: 'usdc_5', text: 'USDC', icons: ['usdc'], level: 4 },
  { id: 'usde_5', text: 'USDe', icons: ['ethena'], level: 4 },
  { id: 'hidden_5a', text: '+', icons: [], level: 4, hidden: true },
  { id: 'hidden_5b', text: '+', icons: [], level: 4, hidden: true },
  { id: 'hidden_5c', text: '+', icons: [], level: 4, hidden: true },
  { id: 'hidden_5d', text: '+', icons: [], level: 4, hidden: true },
  { id: 'hidden_5e', text: '+', icons: [], level: 4, hidden: true },
  { id: 'hidden_5f', text: '+', icons: [], level: 4, hidden: true },
  { id: 'hidden_5g', text: '+', icons: [], level: 4, hidden: true },
  { id: 'hidden_5h', text: '+', icons: [], level: 4, hidden: true },
];

const NODE_MAP = new Map(NODES.map(n => [n.id, n]));

interface Edge { from: string; to: string; }
const EDGES: Edge[] = [];
NODES.forEach(n => { if (n.children) n.children.forEach(c => EDGES.push({ from: n.id, to: c })); });

// --- Layout: tree-based grid positioning ---
const NODE_MIN_W = 120;
const NODE_H = 42;
const HIDDEN_R = 18;
const METRIC_R = 12;
const H_GAP = 35;
const V_GAP = 100;
const ICON_SZ = 22;
const ICON_CELL = ICON_SZ / 2 + 2; // ICON_R
const TOGGLE_W = 22;

// Pre-compute node widths based on text + icons
const nodeWidths = new Map<string, number>();
(() => {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.font = '600 11px Inter';
  NODES.forEach(n => {
    if (n.hidden) return;
    const iconsW = n.icons.length * (ICON_CELL * 2 + 2) + 6 + ICON_CELL;
    const textW = ctx.measureText(n.text).width;
    const hasKids = n.children && n.children.length > 0;
    const total = iconsW + textW + 12 + (hasKids ? TOGGLE_W : 8);
    nodeWidths.set(n.id, Math.max(NODE_MIN_W, Math.ceil(total)));
  });
})();

function getNodeW(id: string): number {
  return nodeWidths.get(id) || NODE_MIN_W;
}

interface LayoutNode {
  id: string; x: number; y: number; w: number; def: NodeDef;
  mx: number; my: number;
  pinned: boolean;
}

// Flat metric node for rendering/dragging
interface MetricLayoutNode {
  key: string; // unique id
  x: number; y: number;
  w: number; h: number;
  metric: MetricDef;
  parentKey: string | null; // null = root (attached to graph node)
  nodeId: string; // which graph node owns this metric
  pinned: boolean;
  depth: number;
}

function buildMetricNodes(metricPrefix: string, metric: MetricDef, startX: number, startY: number, expandedMetrics: Set<string>, graphNodeId: string): MetricLayoutNode[] {
  const result: MetricLayoutNode[] = [];
  let keyCounter = 0;

  function measure(m: MetricDef): { w: number; h: number } {
    // Approximate without canvas
    const labelW = m.label.length * 6;
    const valueW = m.value.length * 7;
    const commentW = m.comment ? m.comment.length * 4.5 : 0;
    const lineW = labelW + valueW + 14;
    const w = Math.max(lineW, commentW + 16, 80);
    const h = m.comment ? 28 : 18;
    return { w, h };
  }

  function place(m: MetricDef, px: number, py: number, parentKey: string | null, depth: number) {
    const key = `metric_${metricPrefix}_${keyCounter++}`;
    const { w, h } = measure(m);
    result.push({ key, x: px, y: py, w, h, metric: m, parentKey, nodeId: graphNodeId, pinned: false, depth });

    if (m.children && m.children.length > 0 && expandedMetrics.has(key)) {
      let cy = py + h + 6;
      const cx = px + 16;
      m.children.forEach(child => {
        place(child, cx, cy, key, depth + 1);
        // Find the bottom of what we just placed
        const lastPlaced = result[result.length - 1];
        cy = lastPlaced.y + lastPlaced.h + 4;
        // Also account for any children placed
        const descendants = result.filter(r => r.key !== lastPlaced.key && r.y >= lastPlaced.y);
        if (descendants.length > 0) {
          cy = Math.max(cy, Math.max(...descendants.map(d => d.y + d.h)) + 4);
        }
      });
    }
  }

  place(metric, startX, startY, null, 0);
  return result;
}

// Pre-assign metric keys deterministically for expand tracking
function getMetricKeys(nodeId: string, metric: MetricDef): string[] {
  const keys: string[] = [];
  let counter = 0;
  function walk(m: MetricDef) {
    keys.push(`metric_${nodeId}_${counter++}`);
    if (m.children) m.children.forEach(walk);
  }
  walk(metric);
  return keys;
}

function layoutTree(expanded: Set<string>): { nodes: LayoutNode[]; width: number; height: number; visibleEdges: Edge[] } {
  const widthCache = new Map<string, number>();

  function subtreeWidth(id: string): number {
    if (widthCache.has(id)) return widthCache.get(id)!;
    const def = NODE_MAP.get(id)!;
    const nw = def.hidden ? HIDDEN_R * 2 + H_GAP : getNodeW(id) + H_GAP;
    if (!def.children || def.children.length === 0 || !expanded.has(id)) {
      widthCache.set(id, nw);
      return nw;
    }
    const childrenW = def.children.reduce((sum, cid) => sum + subtreeWidth(cid), 0);
    const result = Math.max(nw, childrenW);
    widthCache.set(id, result);
    return result;
  }

  subtreeWidth('vault');

  const result: LayoutNode[] = [];
  const visibleEdges: Edge[] = [];

  function place(id: string, left: number, top: number) {
    const def = NODE_MAP.get(id)!;
    const myW = subtreeWidth(id);
    const x = left + myW / 2;
    const y = top;
    const w = def.hidden ? HIDDEN_R * 2 : getNodeW(id);
    result.push({
      id, x, y, w, def, pinned: false,
      mx: x + (def.hidden ? 24 : w / 2 + 15),
      my: y - 24,
    });

    if (def.children && def.children.length > 0 && expanded.has(id)) {
      let cx = left;
      const childY = top + NODE_H + V_GAP;
      def.children.forEach(cid => {
        visibleEdges.push({ from: id, to: cid });
        const cw = subtreeWidth(cid);
        place(cid, cx, childY);
        cx += cw;
      });
    }
  }

  place('vault', 40, 50);

  const totalW = subtreeWidth('vault') + 80;
  const maxY = Math.max(...result.map(n => n.y)) + NODE_H + 60;

  return { nodes: result, width: Math.max(totalW, 1200), height: Math.max(maxY, 700), visibleEdges };
}

// --- Drawing ---
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, h1: boolean, h2: boolean) {
  const sy = y1 + (h1 ? HIDDEN_R : NODE_RADIUS);
  const ey = y2 - (h2 ? HIDDEN_R : NODE_RADIUS);
  ctx.beginPath(); ctx.moveTo(x1, sy); ctx.lineTo(x2, ey);
  ctx.strokeStyle = 'rgba(113, 145, 255, 0.3)'; ctx.lineWidth = 1.2; ctx.stroke();
  const dx = x2 - x1, dy = ey - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  ctx.beginPath();
  ctx.moveTo(x2, ey);
  ctx.lineTo(x2 - ux * 7 - uy * 3.5, ey - uy * 7 + ux * 3.5);
  ctx.moveTo(x2, ey);
  ctx.lineTo(x2 - ux * 7 + uy * 3.5, ey - uy * 7 - ux * 3.5);
  ctx.strokeStyle = 'rgba(113, 145, 255, 0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
}

const NODE_RADIUS = 30;

function drawNode(ctx: CanvasRenderingContext2D, n: LayoutNode, icons: Map<string, HTMLImageElement>, hover: boolean, isExpanded: boolean) {
  const { x, y, def } = n;

  if (def.hidden) {
    ctx.shadowColor = 'rgba(19,71,255,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
    ctx.beginPath(); ctx.arc(x, y, HIDDEN_R, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(x, y - 4, 0, x, y, HIDDEN_R);
    g.addColorStop(0, '#2A2A3A'); g.addColorStop(1, '#1C1C2A');
    ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = hover ? '#5588FF' : 'rgba(100,140,255,0.35)';
    ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = hover ? '#7799FF' : 'rgba(140,170,255,0.7)';
    ctx.font = '700 15px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+', x, y + 1);
    return;
  }

  const R = NODE_RADIUS;

  // Shadow + circle
  ctx.shadowColor = 'rgba(19,71,255,0.2)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(x, y - R * 0.3, R * 0.2, x, y, R);
  grad.addColorStop(0, hover ? '#2E3050' : '#222240');
  grad.addColorStop(1, hover ? '#1E2040' : '#181830');
  ctx.fillStyle = grad; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Border
  ctx.strokeStyle = hover ? '#5588FF' : 'rgba(90,130,255,0.45)';
  ctx.lineWidth = hover ? 2 : 1.3; ctx.stroke();

  // Icon (first one, centered)
  const ic = def.icons[0];
  if (ic) {
    const img = icons.get(ic);
    const ISZ = 20;
    let drawn = false;
    if (img && img.complete && img.naturalWidth > 0) {
      try { ctx.drawImage(img, x - ISZ / 2, y - ISZ / 2 - 3, ISZ, ISZ); drawn = true; } catch (_) {}
    }
    if (!drawn) {
      ctx.fillStyle = '#8899CC'; ctx.font = '700 13px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ic.charAt(0).toUpperCase(), x, y - 3);
    }
  }

  // Second icon (small, bottom-right overlay)
  if (def.icons.length > 1) {
    const ic2 = def.icons[1];
    const img2 = icons.get(ic2);
    const sx = x + 10, sy = y + 8, ss = 14;
    ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#1C1C2A'; ctx.fill();
    ctx.strokeStyle = 'rgba(90,130,255,0.3)'; ctx.lineWidth = 0.8; ctx.stroke();
    let drawn2 = false;
    if (img2 && img2.complete && img2.naturalWidth > 0) {
      try { ctx.drawImage(img2, sx - ss / 2, sy - ss / 2, ss, ss); drawn2 = true; } catch (_) {}
    }
    if (!drawn2) {
      ctx.fillStyle = '#8899CC'; ctx.font = '600 8px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ic2.charAt(0).toUpperCase(), sx, sy);
    }
  }

  // Text below circle
  ctx.fillStyle = '#E8EEFF'; ctx.font = '600 9px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(def.text, x, y + R + 4, n.w);

  // Expand/collapse toggle
  const hasKids = def.children && def.children.length > 0;
  if (hasKids) {
    const bx = x + R * 0.7, by = y - R * 0.7;
    ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(19,50,140,0.6)'; ctx.fill();
    ctx.strokeStyle = 'rgba(120,160,255,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = '#99BBFF'; ctx.font = '700 11px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(isExpanded ? '−' : '+', bx, by);
  }
}

function measureMetricBox(ctx: CanvasRenderingContext2D, m: MetricDef): { w: number; h: number } {
  ctx.font = '700 9px Inter';
  const labelW = ctx.measureText(m.label).width;
  ctx.font = '700 10px Inter';
  const valueW = ctx.measureText(m.value).width;
  const lineW = labelW + valueW + 8;
  ctx.font = '500 7px Inter';
  const commentW = m.comment ? ctx.measureText(m.comment).width : 0;
  const w = Math.max(lineW, commentW) + 16;
  const h = m.comment ? 28 : 18;
  return { w, h };
}

function drawMetricBox(ctx: CanvasRenderingContext2D, mx: number, my: number, m: MetricDef, bw: number, bh: number) {
  const lx = mx, ly = my;
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  roundRect(ctx, lx, ly, bw, bh, 5);
  ctx.fillStyle = '#252530'; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();

  const textY = m.comment ? my + bh / 2 - 5 : my + bh / 2;
  ctx.font = '700 9px Inter';
  const labelW = ctx.measureText(m.label).width;
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(m.label, lx + 8, textY);
  ctx.fillStyle = m.valueColor || '#fff'; ctx.font = '700 10px Inter';
  ctx.fillText(m.value, lx + 8 + labelW + 5, textY);
  if (m.comment) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '500 7px Inter';
    ctx.fillText(m.comment, lx + 8, textY + 12);
  }
}

function drawMetricTree(ctx: CanvasRenderingContext2D, mx: number, my: number, m: MetricDef): { bottomY: number } {
  const { w: bw, h: bh } = measureMetricBox(ctx, m);
  drawMetricBox(ctx, mx, my, m, bw, bh);

  if (!m.children || m.children.length === 0) return { bottomY: my + bh };

  const childX = mx + 18;
  let cy = my + bh + 6;

  m.children.forEach(child => {
    // Dashed connector line
    ctx.beginPath(); ctx.setLineDash([2, 2]);
    ctx.moveTo(mx + bw / 2, my + bh);
    ctx.lineTo(mx + bw / 2, cy + 4);
    ctx.lineTo(childX, cy + 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.setLineDash([]);

    const result = drawMetricTree(ctx, childX, cy, child);
    cy = result.bottomY + 4;
  });

  return { bottomY: cy };
}

function drawEmptyMetric(ctx: CanvasRenderingContext2D, mx: number, my: number) {
  const MW = 36, MH = 16;
  const lx = mx - MW / 2, ly = my - MH / 2;
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
  roundRect(ctx, lx, ly, MW, MH, 4);
  ctx.fillStyle = '#252530'; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '600 7px Inter';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TBD', mx, my);
}

function drawMetricNode(ctx: CanvasRenderingContext2D, mn: MetricLayoutNode, hover: boolean, isExpanded: boolean) {
  const { x, y, w, h, metric: m } = mn;
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  roundRect(ctx, x, y, w, h, 5);
  ctx.fillStyle = hover ? '#2A2A3A' : '#252530'; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = hover ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 0.8; ctx.stroke();

  const textY = m.comment ? y + h / 2 - 5 : y + h / 2;
  ctx.font = '700 9px Inter';
  const labelW = ctx.measureText(m.label).width;
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(m.label, x + 8, textY);
  ctx.fillStyle = m.valueColor || '#fff'; ctx.font = '700 10px Inter';
  ctx.fillText(m.value, x + 8 + labelW + 5, textY);
  if (m.comment) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '500 7px Inter';
    ctx.fillText(m.comment, x + 8, textY + 12);
  }

  // Expand/collapse toggle if has children
  if (m.children && m.children.length > 0) {
    const bx = x + w - 10, by = y + h / 2;
    ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(90,130,255,0.2)'; ctx.fill();
    ctx.strokeStyle = 'rgba(120,160,255,0.4)'; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.fillStyle = '#99BBFF'; ctx.font = '700 9px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(isExpanded ? '−' : '+', bx, by);
  }
}

function drawDashed(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath(); ctx.setLineDash([3, 3]); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
}

// Default: expand only first 3 levels (level 0, 1, 2)
function defaultExpanded(): Set<string> {
  const set = new Set<string>();
  NODES.forEach(n => {
    if (n.children && n.children.length > 0 && n.level < 2) set.add(n.id);
  });
  return set;
}

// Default expanded metrics: only the root metric (NAV Admin Score)
function defaultExpandedMetrics(): Set<string> {
  return new Set<string>(); // all collapsed except root which is always shown
}

// --- Component ---
export function RiskMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  const [expandedMetrics, setExpandedMetrics] = useState(defaultExpandedMetrics);
  const expandedMetricsRef = useRef(expandedMetrics);
  expandedMetricsRef.current = expandedMetrics;
  const metricNodesRef = useRef<MetricLayoutNode[]>([]);
  const layoutData = useRef(layoutTree(expanded));
  const edgesRef = useRef(layoutData.current.visibleEdges);
  const nodesRef = useRef(layoutData.current.nodes);
  const iconsRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const animRef = useRef(0);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const dragRef = useRef<{
    type: 'node' | 'pan';
    nodeId?: string;
    startX: number; startY: number;
    origX: number; origY: number;
    group?: Map<string, { x: number; y: number; kind: 'node' | 'metric' }>;
  } | null>(null);
  const hoverRef = useRef<string | null>(null);
  const needsFit = useRef(true);

  // Re-layout when expanded changes — preserve pinned positions and offset children
  useEffect(() => {
    // Save old pinned positions
    const oldPositions = new Map<string, { x: number; y: number }>();
    const oldDefaults = new Map<string, { x: number; y: number }>();
    nodesRef.current.forEach(n => {
      oldDefaults.set(n.id, { x: n.x, y: n.y });
      if (n.pinned) oldPositions.set(n.id, { x: n.x, y: n.y });
    });

    const result = layoutTree(expanded);
    const newMap = new Map(result.nodes.map(n => [n.id, n]));

    // For each pinned node, compute delta from its new default position
    // and apply that delta to all its descendants
    function getDescendants(id: string): string[] {
      const def = NODE_MAP.get(id);
      if (!def?.children) return [];
      const desc: string[] = [];
      def.children.forEach(cid => {
        desc.push(cid);
        desc.push(...getDescendants(cid));
      });
      return desc;
    }

    // Apply pinned positions and shift children
    const shifted = new Set<string>();
    oldPositions.forEach((oldPos, id) => {
      const newNode = newMap.get(id);
      if (!newNode) return;
      const dx = oldPos.x - newNode.x;
      const dy = oldPos.y - newNode.y;
      newNode.x = oldPos.x;
      newNode.y = oldPos.y;
      newNode.pinned = true;
      newNode.mx = newNode.x + (newNode.def.hidden ? 24 : newNode.w / 2 + 15);
      newNode.my = newNode.y - 24;
      shifted.add(id);

      // Shift all descendants by the same delta
      getDescendants(id).forEach(cid => {
        if (shifted.has(cid)) return;
        const child = newMap.get(cid);
        if (child) {
          child.x += dx;
          child.y += dy;
          child.mx = child.x + (child.def.hidden ? 24 : child.w / 2 + 15);
          child.my = child.y - 24;
          shifted.add(cid);
        }
      });
    });

    layoutData.current = result;
    nodesRef.current = result.nodes;
    edgesRef.current = result.visibleEdges;
  }, [expanded]);

  // Rebuild metric nodes when graph or metric expansion changes
  // Then push nodes/metrics down to avoid overlaps
  useEffect(() => {
    const nodes = nodesRef.current;
    const allMetrics: MetricLayoutNode[] = [];
    const oldPinned = new Map<string, { x: number; y: number }>();
    metricNodesRef.current.forEach(mn => {
      if (mn.pinned) oldPinned.set(mn.key, { x: mn.x, y: mn.y });
    });

    // Save original Y positions before any shifting
    const origY = new Map<string, number>();
    nodes.forEach(n => origY.set(n.id, n.y));

    // Group nodes by level to alternate metric sides
    const levelIndices = new Map<number, number>();

    // Build metrics for each node
    const nodeMetrics = new Map<string, MetricLayoutNode[]>();
    nodes.forEach(n => {
      if (n.def.metrics && n.def.metrics.length > 0) {
        // Alternate side: even index = right, odd index = left
        const idx = levelIndices.get(n.def.level) || 0;
        levelIndices.set(n.def.level, idx + 1);
        const isLeft = idx % 2 === 1;

        let my = n.my;
        const mns: MetricLayoutNode[] = [];
        n.def.metrics.forEach((metric, mi) => {
          // Place to left or right of node
          const mx = isLeft ? n.x - (n.def.hidden ? 24 : n.w / 2 + 15) : n.mx;
          const built = buildMetricNodes(n.id + '_m' + mi, metric, mx, my, expandedMetrics, n.id);
          if (isLeft) {
            // Shift built metrics so they extend to the left
            built.forEach(b => { b.x = b.x - b.w; });
          }
          mns.push(...built);
          const maxY = Math.max(...built.map(b => b.y + b.h));
          my = maxY + 6;
        });
        mns.forEach(mn => {
          const old = oldPinned.get(mn.key);
          if (old) { mn.x = old.x; mn.y = old.y; mn.pinned = true; }
        });
        nodeMetrics.set(n.id, mns);
        allMetrics.push(...mns);
      } else {
        // Count even nodes without metrics for alternation
        const idx = levelIndices.get(n.def.level) || 0;
        levelIndices.set(n.def.level, idx + 1);
      }
    });

    // --- Overlap resolution ---
    // Helper: get bounding box of a node + its metrics
    function getNodeBounds(n: LayoutNode): { minX: number; maxX: number; minY: number; maxY: number } {
      let minX = n.x - NODE_RADIUS, maxX = n.x + NODE_RADIUS;
      let minY = n.y - NODE_RADIUS, maxY = n.y + NODE_RADIUS + 20;
      const nMetrics = nodeMetrics.get(n.id);
      if (nMetrics) {
        nMetrics.forEach(mn => {
          if (!mn.pinned) {
            minX = Math.min(minX, mn.x);
            maxX = Math.max(maxX, mn.x + mn.w);
            minY = Math.min(minY, mn.y);
            maxY = Math.max(maxY, mn.y + mn.h);
          }
        });
      }
      return { minX, maxX, minY, maxY };
    }

    function shiftNode(n: LayoutNode, dx: number, dy: number) {
      if (n.pinned) return;
      n.x += dx; n.y += dy;
      n.mx = n.x + (n.def.hidden ? 24 : n.w / 2 + 15);
      n.my = n.y - 24;
      const nMetrics = nodeMetrics.get(n.id);
      if (nMetrics) {
        nMetrics.forEach(mn => { if (!mn.pinned) { mn.x += dx; mn.y += dy; } });
      }
    }

    // Group nodes by level
    const byLevel = new Map<number, LayoutNode[]>();
    nodes.forEach(n => {
      const list = byLevel.get(n.def.level) || [];
      list.push(n);
      byLevel.set(n.def.level, list);
    });
    const levelKeys = [...byLevel.keys()].sort((a, b) => a - b);

    // 1) Vertical: push down levels if metrics from above overflow
    for (let li = 1; li < levelKeys.length; li++) {
      const prevNodes = byLevel.get(levelKeys[li - 1]) || [];
      const currNodes = byLevel.get(levelKeys[li]) || [];

      let maxPrevBottom = 0;
      prevNodes.forEach(pn => {
        const b = getNodeBounds(pn);
        maxPrevBottom = Math.max(maxPrevBottom, b.maxY);
      });

      let minCurrTop = Infinity;
      currNodes.forEach(cn => {
        minCurrTop = Math.min(minCurrTop, cn.y - NODE_RADIUS);
      });

      const gap = 25;
      const overlap = maxPrevBottom + gap - minCurrTop;
      if (overlap > 0) {
        for (let lj = li; lj < levelKeys.length; lj++) {
          (byLevel.get(levelKeys[lj]) || []).forEach(n => shiftNode(n, 0, overlap));
        }
      }
    }

    // 2) Horizontal: push same-level siblings apart if metric boxes overlap
    for (const lvl of levelKeys) {
      const lvlNodes = (byLevel.get(lvl) || []).sort((a, b) => a.x - b.x);
      for (let i = 0; i < lvlNodes.length - 1; i++) {
        const a = lvlNodes[i], b = lvlNodes[i + 1];
        const ab = getNodeBounds(a), bb = getNodeBounds(b);
        const hGap = 20;
        const hOverlap = ab.maxX + hGap - bb.minX;
        if (hOverlap > 0) {
          // Push b and all nodes to its right
          for (let j = i + 1; j < lvlNodes.length; j++) {
            shiftNode(lvlNodes[j], hOverlap, 0);
          }
        }
      }
    }

    metricNodesRef.current = allMetrics;
  }, [expanded, expandedMetrics]);

  const fitToView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;
    const pad = 40;
    const mns = metricNodesRef.current;
    const allMinX = [
      ...nodes.map(n => n.x - (n.def.hidden ? HIDDEN_R : NODE_RADIUS) - 40),
      ...mns.map(m => m.x - 10),
    ];
    const allMaxX = [
      ...nodes.map(n => n.x + (n.def.hidden ? HIDDEN_R : NODE_RADIUS) + 60),
      ...mns.map(m => m.x + m.w + 10),
    ];
    const allMinY = [
      ...nodes.map(n => n.y - (n.def.hidden ? HIDDEN_R : NODE_RADIUS) - 30),
      ...mns.map(m => m.y - 10),
    ];
    const allMaxY = [
      ...nodes.map(n => n.y + (n.def.hidden ? HIDDEN_R : NODE_RADIUS) + 30),
      ...mns.map(m => m.y + m.h + 10),
    ];
    const minX = Math.min(...allMinX) - pad;
    const maxX = Math.max(...allMaxX) + pad;
    const minY = Math.min(...allMinY) - pad;
    const maxY = Math.max(...allMaxY) + pad;
    const tw = maxX - minX, th = maxY - minY;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const scale = Math.min(cw / tw, ch / th, 1) * 0.92;
    zoomRef.current = scale;
    panRef.current.x = (cw - tw * scale) / 2 - minX * scale;
    panRef.current.y = (ch - th * scale) / 2 - minY * scale;
  }, []);

  useEffect(() => {
    Object.entries(ICON_MAP).forEach(([key, url]) => {
      const img = new Image(); img.src = url;
      iconsRef.current.set(key, img);
    });
  }, []);

  const GRID = 20;
  const snap = (v: number) => Math.round(v / GRID) * GRID;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const px = panRef.current.x, py = panRef.current.y;
    const zoom = zoomRef.current;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(zoom, zoom);

    // Auto-fit after layout change
    if (needsFit.current) { fitToView(); needsFit.current = false; }

    const nodes = nodesRef.current;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Edges
    edgesRef.current.forEach(e => {
      const a = nodeMap.get(e.from), b = nodeMap.get(e.to);
      if (!a || !b) return;
      drawArrow(ctx, a.x, a.y, b.x, b.y, !!a.def.hidden, !!b.def.hidden);
    });

    // Metrics: dashed lines from nodes + metric boxes
    const metricNodes = metricNodesRef.current;
    // Dashed line from graph node to its root metric
    nodes.forEach(n => {
      if (!n.def.metrics) {
        // Empty metric
        const nx = n.x + (n.def.hidden ? HIDDEN_R : NODE_RADIUS * 0.7);
        const ny = n.y - (n.def.hidden ? HIDDEN_R : NODE_RADIUS * 0.7);
        drawDashed(ctx, nx, ny, n.mx, n.my);
        drawEmptyMetric(ctx, n.mx, n.my);
      }
    });

    // Draw metric connections and boxes
    const metricMap = new Map(metricNodes.map(mn => [mn.key, mn]));
    metricNodes.forEach(mn => {
      if (!mn.parentKey) {
        // Root metric: dashed line from graph node
        const gn = nodeMap.get(mn.nodeId);
        if (gn) {
          const nx = gn.x + NODE_RADIUS * 0.7;
          const ny = gn.y - NODE_RADIUS * 0.7;
          drawDashed(ctx, nx, ny, mn.x + mn.w / 2, mn.y + mn.h / 2);
        }
      } else {
        // Child metric: dashed line from parent metric
        const parent = metricMap.get(mn.parentKey);
        if (parent) {
          ctx.beginPath(); ctx.setLineDash([2, 2]);
          ctx.moveTo(parent.x + parent.w / 2, parent.y + parent.h);
          ctx.lineTo(parent.x + parent.w / 2, mn.y + mn.h / 2);
          ctx.lineTo(mn.x, mn.y + mn.h / 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 0.8; ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      const isHover = hoverRef.current === mn.key;
      const isExp = expandedMetricsRef.current.has(mn.key);
      drawMetricNode(ctx, mn, isHover, isExp);
    });

    // Nodes
    nodes.forEach(n => drawNode(ctx, n, iconsRef.current, hoverRef.current === n.id, expandedRef.current.has(n.id)));

    ctx.restore();
    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const findNode = (wx: number, wy: number): LayoutNode | null => {
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n = nodesRef.current[i];
      const dx = wx - n.x, dy = wy - n.y;
      const r = n.def.hidden ? HIDDEN_R + 4 : NODE_RADIUS + 6;
      if (dx * dx + dy * dy < r * r) return n;
    }
    return null;
  };

  const toWorld = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const z = zoomRef.current;
    return { wx: (e.clientX - rect.left - panRef.current.x) / z, wy: (e.clientY - rect.top - panRef.current.y) / z };
  };

  const findMetricNode = (wx: number, wy: number): MetricLayoutNode | null => {
    for (let i = metricNodesRef.current.length - 1; i >= 0; i--) {
      const mn = metricNodesRef.current[i];
      if (wx >= mn.x && wx <= mn.x + mn.w && wy >= mn.y && wy <= mn.y + mn.h) return mn;
    }
    return null;
  };

  // Collect all descendants of a graph node
  const getDescendantNodes = useCallback((id: string): string[] => {
    const def = NODE_MAP.get(id);
    if (!def?.children) return [];
    const desc: string[] = [];
    def.children.forEach(cid => {
      if (nodesRef.current.find(n => n.id === cid)) {
        desc.push(cid);
        desc.push(...getDescendantNodes(cid));
      }
    });
    return desc;
  }, []);

  // Build a drag group: the dragged item + all connected items
  const buildDragGroup = useCallback((draggedId: string, isMetric: boolean) => {
    const group = new Map<string, { x: number; y: number; kind: 'node' | 'metric' }>();

    if (isMetric) {
      // Dragging a metric: move all metrics of the same graph node together
      const mn = metricNodesRef.current.find(m => m.key === draggedId);
      if (mn) {
        metricNodesRef.current.filter(m => m.nodeId === mn.nodeId).forEach(m => {
          group.set(m.key, { x: m.x, y: m.y, kind: 'metric' });
        });
      }
    } else {
      // Dragging a graph node: move it + descendants + all their metrics
      const ids = [draggedId, ...getDescendantNodes(draggedId)];
      ids.forEach(nid => {
        const n = nodesRef.current.find(nn => nn.id === nid);
        if (n) {
          group.set(n.id, { x: n.x, y: n.y, kind: 'node' });
          // Add its metrics
          metricNodesRef.current.filter(m => m.nodeId === nid).forEach(m => {
            group.set(m.key, { x: m.x, y: m.y, kind: 'metric' });
          });
        }
      });
    }
    return group;
  }, [getDescendantNodes]);

  const onMouseDown = (e: React.MouseEvent) => {
    const { wx, wy } = toWorld(e);

    // Check metric nodes first
    const mn = findMetricNode(wx, wy);
    if (mn) {
      if (mn.metric.children && mn.metric.children.length > 0) {
        const bx = mn.x + mn.w - 10, by = mn.y + mn.h / 2;
        const dx = wx - bx, dy = wy - by;
        if (dx * dx + dy * dy < 8 * 8) {
          setExpandedMetrics(prev => {
            const next = new Set(prev);
            if (next.has(mn.key)) next.delete(mn.key); else next.add(mn.key);
            return next;
          });
          return;
        }
      }
      const group = buildDragGroup(mn.key, true);
      dragRef.current = { type: 'node', nodeId: mn.key, startX: e.clientX, startY: e.clientY, origX: mn.x, origY: mn.y, group };
      return;
    }

    const node = findNode(wx, wy);
    if (node) {
      const hasKids = node.def.children && node.def.children.length > 0 && !node.def.hidden;
      if (hasKids) {
        const bx = node.x + NODE_RADIUS * 0.7;
        const by = node.y - NODE_RADIUS * 0.7;
        const dx = wx - bx, dy = wy - by;
        if (dx * dx + dy * dy < 10 * 10) {
          setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
            return next;
          });
          return;
        }
      }
      const group = buildDragGroup(node.id, false);
      dragRef.current = { type: 'node', nodeId: node.id, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y, group };
    } else {
      dragRef.current = { type: 'pan', startX: e.clientX, startY: e.clientY, origX: panRef.current.x, origY: panRef.current.y };
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (dragRef.current.type === 'pan') {
        panRef.current.x = dragRef.current.origX + dx;
        panRef.current.y = dragRef.current.origY + dy;
      } else if (dragRef.current.group) {
        const z = zoomRef.current;
        const ddx = dx / z, ddy = dy / z;
        // Move entire group
        dragRef.current.group.forEach((orig, key) => {
          if (orig.kind === 'node') {
            const n = nodesRef.current.find(nn => nn.id === key);
            if (n) {
              n.x = orig.x + ddx; n.y = orig.y + ddy;
              n.mx = n.x + (n.def.hidden ? 24 : n.w / 2 + 15);
              n.my = n.y - 24;
            }
          } else {
            const m = metricNodesRef.current.find(mm => mm.key === key);
            if (m) { m.x = orig.x + ddx; m.y = orig.y + ddy; }
          }
        });
      }
    } else {
      const { wx, wy } = toWorld(e);
      const mn = findMetricNode(wx, wy);
      const h = mn ? null : findNode(wx, wy);
      hoverRef.current = mn?.key ?? h?.id ?? null;
      if (canvasRef.current) canvasRef.current.style.cursor = (mn || h) ? 'grab' : 'move';
    }
  };

  const onMouseUp = () => {
    if (dragRef.current?.type === 'node' && dragRef.current.group) {
      // Snap and pin all items in the group
      const first = dragRef.current.group.entries().next().value;
      if (first) {
        const [, orig] = first;
        // Calculate snap delta from the dragged item
        const dragged = dragRef.current.nodeId!;
        let currX = 0, currY = 0;
        const isMetric = metricNodesRef.current.find(m => m.key === dragged);
        if (isMetric) { currX = isMetric.x; currY = isMetric.y; }
        else { const n = nodesRef.current.find(nn => nn.id === dragged); if (n) { currX = n.x; currY = n.y; } }
        const snapDx = snap(currX) - currX;
        const snapDy = snap(currY) - currY;

        dragRef.current.group.forEach((_, key) => {
          const orig2 = dragRef.current!.group!.get(key)!;
          if (orig2.kind === 'node') {
            const n = nodesRef.current.find(nn => nn.id === key);
            if (n) {
              n.x += snapDx; n.y += snapDy;
              n.mx = n.x + (n.def.hidden ? 24 : n.w / 2 + 15);
              n.my = n.y - 24;
              n.pinned = true;
            }
          } else {
            const m = metricNodesRef.current.find(mm => mm.key === key);
            if (m) { m.x += snapDx; m.y += snapDy; m.pinned = true; }
          }
        });
      }
    }
    dragRef.current = null;
  };

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const oldZ = zoomRef.current;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZ = Math.max(0.15, Math.min(3, oldZ * delta));
    // Zoom toward mouse position
    panRef.current.x = mx - (mx - panRef.current.x) * (newZ / oldZ);
    panRef.current.y = my - (my - panRef.current.y) * (newZ / oldZ);
    zoomRef.current = newZ;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  return (
    <div className="risk-map">
      <canvas
        ref={canvasRef}
        className="rm-canvas"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
      <div className="rm-toolbar">
        <button className="rm-tool-btn" onClick={() => { setExpanded(defaultExpanded()); setExpandedMetrics(defaultExpandedMetrics()); needsFit.current = true; }} title="Collapse all">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2L7 6L11 2" /><path d="M3 12L7 8L11 12" />
          </svg>
        </button>
        <button className="rm-tool-btn" onClick={fitToView} title="Fit to view">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 5V1H5" /><path d="M9 1H13V5" /><path d="M13 9V13H9" /><path d="M5 13H1V9" />
            <circle cx="7" cy="7" r="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
