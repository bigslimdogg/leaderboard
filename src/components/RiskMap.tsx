import { useState } from 'react';
import './RiskMap.css';

// --- Data types ---
interface MetricChild {
  label: string;
  value: string;
  color?: string;
  note?: string;
  children?: MetricChild[];
}

interface RiskNode {
  id: string;
  label: string;
  icon?: string;
  score?: string;
  scoreColor?: string;
  weight?: string;
  allocPct?: number; // fraction of total TVL (0–1)
  note?: string;
  metrics?: MetricChild[];
  children?: RiskNode[];
}

// --- Format helpers ---
function formatAlloc(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

// --- Icon URLs ---
const ICONS: Record<string, string> = {
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

const DEFAULT_DEPTH = 3;
const G = '#34D399';
const Y = '#FBBF24';

// --- earnETH Lido v3 tree ---
const EARN_ETH_TREE: RiskNode = {
  id: 'vault', label: 'Vault earnETH', icon: 'eth',
  score: 'AAA+', scoreColor: G, allocPct: 1.0,
  metrics: [
    { label: 'NAV Admin Score', value: 'A+', color: G, note: 'every hour, Lambda', children: [
      { label: '1h cashflow', value: '+3%', color: G },
      { label: 'oracle value', value: '64.2K ETH', color: G, note: '6 min ago', children: [
        { label: 'volatility cross source', value: '< 1%', color: G },
        { label: 'deviation w cashflow', value: '0.01%', color: G, note: 'last submit = 1h ago' },
        { label: 'deviation w/o cashflow', value: '3.01%', color: G, note: 'last submit = 1h ago' },
      ]},
      { label: 'liquid NAV', value: '61 ETH', color: G, children: [
        { label: 'oracle deviation', value: '<5%', color: G, note: '1 min ago' },
      ]},
    ]},
    { label: 'TVL', value: '__TVL__', color: G, note: 'live' },
    { label: 'Curator Score', value: 'A+', color: G, note: 'Mellow' },
  ],
  children: [
    { id: 'platform', label: 'Platform: lido v3', icon: 'lido',
      score: 'A+', scoreColor: G, weight: '1', allocPct: 1.0,
      metrics: [
        { label: 'Platform Score', value: 'A+', color: G, children: [
          { label: 'exploits history', value: 'none', color: G },
          { label: 'sc upgrades', value: 'audited', color: G, note: '1 month ago' },
          { label: 'multi-sigs concentration', value: 'low', color: G },
          { label: 'Failed withdraw', value: '< 0.01% TVL', color: G, note: '12 min ago' },
          { label: 'Biggest withdrawal', value: '< 1% TVL', color: G, note: '17h ago' },
        ]},
      ],
      children: [
        { id: 'hold_eth_3', label: 'Holdings in Ethereum', icon: 'eth',
          score: 'A+', scoreColor: G, allocPct: 0.006,
          children: [
            { id: 'eth_4', label: 'ETH', icon: 'eth', allocPct: 0.00565, score: 'A+', scoreColor: G,
              metrics: [
                { label: 'price', value: '$2,127.15', color: G, note: 'Chainlink, 15 min ago', children: [
                  { label: 'deviation last NAV', value: '< 1%', color: G },
                  { label: 'Swap Price deviation', value: '< 3%', color: G, note: 'DEXes, 1inch' },
                  { label: 'volatility', value: '< 1%', color: G, note: 'Redstone, Chainlink, CG' },
                ]},
                { label: 'balance', value: '530.50', color: G, note: 'block 13412345', children: [
                  { label: 'deviation last NAV', value: '< 0.001%', color: G },
                ]},
              ],
            },
            { id: 'weth_4', label: 'wETH', icon: 'eth', allocPct: 0.0003, score: 'A+', scoreColor: G,
              metrics: [{ label: 'peg deviation', value: '< 0.01%', color: G }],
            },
            { id: 'hex_4', label: 'HEX', icon: 'hex', allocPct: 0.00005, score: 'B+', scoreColor: Y,
              metrics: [{ label: 'liquidity depth', value: 'low', color: Y }],
            },
          ],
        },
        { id: 'strategy', label: 'Vault stRategy ETH', icon: 'mellow',
          score: 'A', scoreColor: G, allocPct: 0.604,
          children: [
            { id: 'hold_eth_4', label: 'Holdings in Ethereum', icon: 'eth', score: 'A+', scoreColor: G, allocPct: 0.15 },
            { id: 'hold_plasma_4', label: 'Holdings in Plasma', icon: 'plasma', score: 'A', scoreColor: G, allocPct: 0.075 },
            { id: 'hold_base_4', label: 'Holdings in Base', icon: 'base', score: 'A', scoreColor: G, allocPct: 0.05 },
            { id: 'aave_eth_4', label: 'Aave v3 in Ethereum', icon: 'aave', score: 'A+', scoreColor: G, allocPct: 0.125,
              metrics: [
                { label: 'DeFi Score', value: 'A+', color: G },
              ],
              children: [
              { id: 'steth_5', label: 'stETH', icon: 'lido', score: 'A+', scoreColor: G, allocPct: 0.05 },
              { id: 'usdt_5', label: 'USDT', icon: 'usdt', score: 'A', scoreColor: G, allocPct: 0.025 },
              { id: 'usdc_5', label: 'USDC', icon: 'usdc', score: 'A+', scoreColor: G, allocPct: 0.025 },
              { id: 'usde_5', label: 'USDe', icon: 'ethena', score: 'A', scoreColor: G, allocPct: 0.025 },
            ]},
            { id: 'aave_plasma_4', label: 'Aave v3 in Plasma', icon: 'aave', score: 'A', scoreColor: G, allocPct: 0.05,
              metrics: [
                { label: 'DeFi Score', value: 'A+', color: G },
              ],
            },
            { id: 'spark_4', label: 'Spark Lend', icon: 'spark', score: 'A', scoreColor: G, allocPct: 0.054 },
            { id: 'resolv_4', label: 'Resolv', icon: 'resolv', score: 'A-', scoreColor: G, allocPct: 0.04 },
            { id: 'mellow_4', label: 'Mellow', icon: 'mellow', score: 'A', scoreColor: G, allocPct: 0.035 },
            { id: 'lido_locked_4', label: 'Lido locked', icon: 'lido', score: 'A+', scoreColor: G, allocPct: 0.025 },
          ],
        },
        { id: 'lido_3', label: 'Lido', icon: 'lido', score: 'A+', scoreColor: G, allocPct: 0.25,
          metrics: [
            { label: 'Allocation threshold', value: '< 10%', color: G },
            { label: 'DeFi Score', value: 'A+', color: G, note: 'part of strategy score' },
          ],
          children: [
            { id: 'steth_4', label: 'stETH', icon: 'lido', score: 'A+', scoreColor: G, allocPct: 0.25,
              metrics: [
                { label: 'Type', value: 'liquid staking', color: G },
                { label: '7d APR', value: '3.5%', color: G },
                { label: 'Finance risk — Slashing', value: 'Low', color: G, note: 'part of strategy score' },
                { label: 'hack / exploits history', value: 'none', color: G },
                { label: 'sc upgrades', value: 'audited', color: G, note: '3m ago' },
                { label: 'multisigs score', value: 'A+', color: G },
                { label: 'depeg triggers', value: 'none', color: G },
                { label: 'price', value: '$2,127.15', color: G, note: 'Chainlink, 15 min ago', children: [
                  { label: 'volatility', value: '< 1%', color: G, note: 'across price sources' },
                  { label: 'Swap Price deviation', value: '< 3%', color: G },
                  { label: 'deviation last NAV submission', value: '< 1%', color: G },
                ]},
                { label: 'balance', value: '2,846', color: G, note: 'block 13412345', children: [
                  { label: 'deviation last NAV submission', value: '< 0.001%', color: G },
                ]},
              ],
            },
          ],
        },
        { id: 'lido_gg', label: 'Vault: GG', icon: 'veda', score: 'A', scoreColor: G, allocPct: 0.075,
          metrics: [
            { label: 'Curator Score', value: 'A+', color: G },
            { label: 'DeFi Score', value: 'A+', color: G, note: 'part of strategy score' },
            { label: 'Platform Score', value: 'B', color: Y },
            { label: 'TBD', value: '' },
          ],
          children: [
            { id: 'lido_gg_tbd', label: 'TBD', icon: 'veda', score: '', scoreColor: G, allocPct: 0.075 },
          ],
        },
        { id: 'lido_dvt', label: 'Lido simple DVT', icon: 'mellow', score: 'A', scoreColor: G, allocPct: 0.05 },
        { id: 'mellow_3', label: 'Mellow', icon: 'mellow', score: 'A', scoreColor: G, allocPct: 0.0,
          metrics: [
            { label: 'Platform Score', value: 'A+', color: G },
            { label: 'Curator Score', value: 'A+', color: G },
            { label: 'DeFi Score', value: 'A+', color: G, note: 'part of strategy score' },
          ],
          children: [
            { id: 'mellow_3_tbd', label: 'TBD', icon: 'mellow', score: '', scoreColor: G, allocPct: 0.0 },
          ],
        },
        { id: 'lido_locked_3', label: 'Lido (locked) - pending deposit', icon: 'lido', score: 'A+', scoreColor: G, allocPct: 0.015,
          metrics: [
            { label: 'Platform Score', value: 'A+', color: G },
            { label: 'TBD', value: '' },
          ],
          children: [
            { id: 'lido_locked_3_tbd', label: 'TBD', icon: 'lido', score: '', scoreColor: G, allocPct: 0.015 },
          ],
        },
      ],
    },
  ],
};

// --- Metric tree row ---
function MetricRow({ m, depth, forceOpen, tvl }: { m: MetricChild; depth: number; forceOpen: boolean; tvl: number }) {
  const [open, setOpen] = useState(forceOpen);
  const hasKids = m.children && m.children.length > 0;

  if (forceOpen && !open) setOpen(true);

  const displayValue = m.value === '__TVL__' ? formatAlloc(tvl) : (m.value || '—');

  return (<>
    <div className="rm-metric-row" style={{ paddingLeft: 24 + depth * 16 }}>
      <div className="rm-metric-left">
        {hasKids ? (
          <button className="rm-toggle" onClick={() => setOpen(!open)}>{open ? '▾' : '▸'}</button>
        ) : <span className="rm-toggle-spacer" />}
        <span className="rm-metric-label">{m.label}</span>
      </div>
      <div className="rm-metric-right">
        <span className="rm-metric-value" style={{ color: m.color || 'var(--text-muted)' }}>{displayValue}</span>
        {m.note && <span className="rm-metric-note">{m.note}</span>}
      </div>
      <div className="rm-metric-alloc-col" />
    </div>
    {open && m.children?.map((c, i) => <MetricRow key={i} m={c} depth={depth + 1} forceOpen={forceOpen} tvl={tvl} />)}
  </>);
}

// --- Node tree row ---
function NodeRow({ node, depth, expandMode, tvl }: { node: RiskNode; depth: number; expandMode: 'default' | 'all'; tvl: number }) {
  const shouldBeOpen = expandMode === 'all' || depth < DEFAULT_DEPTH;
  const showMetrics = expandMode === 'all';
  const [open, setOpen] = useState(shouldBeOpen);
  const [metricsOpen, setMetricsOpen] = useState(showMetrics);
  const hasKids = node.children && node.children.length > 0;
  const hasMetrics = node.metrics && node.metrics.length > 0;

  const alloc = node.allocPct != null ? formatAlloc(node.allocPct * tvl) : '';

  return (<>
    <div className={`rm-node-row depth-${Math.min(depth, 4)}`} style={{ paddingLeft: depth * 20 }}>
      <div className="rm-node-left">
        {hasKids ? (
          <button className="rm-toggle" onClick={() => setOpen(!open)}>{open ? '▾' : '▸'}</button>
        ) : <span className="rm-toggle-spacer" />}
        {node.icon && <img src={ICONS[node.icon] || ''} alt="" className="rm-node-icon" />}
        <span className="rm-node-label">{node.label}</span>
        {hasMetrics && (
          <button className={`rm-metrics-badge ${metricsOpen ? 'open' : ''}`} onClick={() => setMetricsOpen(!metricsOpen)}>
            {metricsOpen ? '✕ metrics' : `${node.metrics!.length} metrics`}
          </button>
        )}
      </div>
      <div className="rm-node-right">
        {node.weight && <span className="rm-node-weight">w={node.weight}</span>}
        {alloc && <><span className="rm-node-alloc">{alloc}</span><span className="rm-node-note">live</span></>}
      </div>
    </div>
    {metricsOpen && node.metrics?.map((m, i) => <MetricRow key={`m${i}`} m={m} depth={depth + 1} forceOpen={showMetrics} tvl={tvl} />)}
    {open && node.children?.map(child => (
      <NodeRow key={child.id} node={child} depth={depth + 1} expandMode={expandMode} tvl={tvl} />
    ))}
  </>);
}

// --- Main component ---
export function RiskMap({ tvlUsd }: { tvlUsd: number }) {
  const [expandMode, setExpandMode] = useState<'default' | 'all'>('default');
  const [resetKey, setResetKey] = useState(0);
  const tvl = tvlUsd;

  const handleToggle = () => {
    const next = expandMode === 'all' ? 'default' : 'all';
    setExpandMode(next);
    setResetKey(k => k + 1);
  };

  return (
    <div className="risk-map-tree">
      <div className="rm-tree-header">
        <div className="rm-tree-col-left">
          Name
          <button className="rm-expand-all" onClick={handleToggle}>
            {expandMode === 'all' ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
        <div className="rm-tree-col-right">
          <span>Score</span>
          <span>Allocation</span>
        </div>
      </div>
      <div className="rm-tree-body">
        <NodeRow key={resetKey} node={EARN_ETH_TREE} depth={0} expandMode={expandMode} tvl={tvl} />
      </div>
    </div>
  );
}
