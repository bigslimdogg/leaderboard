import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { vaults } from '../data';
import './VaultProfile.css';

function getRiskScoreColor(score: string): string {
  if (score.startsWith('A')) return '#00C087';
  if (score.startsWith('B')) return '#C4B000';
  if (score.startsWith('C')) return '#D03030';
  return '#505a6e';
}

function Sparkline({ data, color, width = 120, height = 32, animate = false }: {
  data: number[]; color: string; width?: number; height?: number; animate?: boolean;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const lastY = parseFloat(points.split(' ').pop()!.split(',')[1]);

  return (
    <svg width={width} height={height} className="sparkline">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'all 0.4s ease' }}
      />
      <circle
        cx={width}
        cy={lastY}
        r="2.5"
        fill={color}
        className={animate ? 'pulse-dot' : ''}
        style={{ transition: 'cy 0.4s ease' }}
      />
    </svg>
  );
}

function generateSparkData(base: number, count: number, volatility: number): number[] {
  const data: number[] = [base];
  for (let i = 1; i < count; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility * base;
    data.push(Math.max(0, data[i - 1] + change));
  }
  return data;
}

// Smooth number display with CSS transition
function AnimatedNumber({ value, prefix = '', suffix = '', className = '' }: {
  value: string; prefix?: string; suffix?: string; className?: string;
}) {
  return <span className={`metric-value ${className}`}>{prefix}{value}{suffix}</span>;
}

function useTvlAnimation(baseTvlUsd: number, baseTvlEth: number) {
  const [displayUsd, setDisplayUsd] = useState(baseTvlUsd);
  const [displayEth, setDisplayEth] = useState(baseTvlEth);
  const [sparkData, setSparkData] = useState(() => generateSparkData(baseTvlUsd, 30, 0.015));

  const targetUsd = useRef(baseTvlUsd);
  const targetEth = useRef(baseTvlEth);
  const currentUsd = useRef(baseTvlUsd);
  const currentEth = useRef(baseTvlEth);
  const rafId = useRef(0);

  // Set new target every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      const pctChange = (Math.random() - 0.5) * 0.06;
      targetUsd.current = Math.max(0, targetUsd.current * (1 + pctChange));
      targetEth.current = Math.max(0, targetEth.current * (1 + pctChange));

      setSparkData(prev => {
        const last = prev[prev.length - 1];
        return [...prev.slice(1), Math.max(0, last * (1 + pctChange))];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Smooth interpolation with rAF
  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const step = () => {
      currentUsd.current = lerp(currentUsd.current, targetUsd.current, 0.08);
      currentEth.current = lerp(currentEth.current, targetEth.current, 0.08);
      setDisplayUsd(currentUsd.current);
      setDisplayEth(currentEth.current);
      rafId.current = requestAnimationFrame(step);
    };
    rafId.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  return { tvlUsd: displayUsd, tvlEth: displayEth, sparkData };
}

function formatTvl(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function VaultProfile() {
  const { id } = useParams<{ id: string }>();
  const vault = vaults.find((v) => v.id === id);
  const { tvlUsd, tvlEth, sparkData } = useTvlAnimation(129_000_000, 62_700);
  const apyData = useRef(generateSparkData(5, 20, 0.1)).current;
  const [riskTab, setRiskTab] = useState(0);

  if (!vault) {
    return (
      <div className="vault-profile">
        <div className="profile-header">
          <Link to="/" className="back-link">&larr; Back to Leaderboard</Link>
          <h1>Vault not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-profile">
      <div className="profile-header">
        <Link to="/" className="back-link">&larr; Back to Leaderboard</Link>
        <div className="page-header-row">
          <div>
            <h1>{vault.name}</h1>
            <p className="profile-subtitle">Risk Dashboard</p>
          </div>
          <a href="https://widget.p2p.org/deposit" target="_blank" rel="noopener noreferrer" className="primary-action-btn">Deposit</a>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">TVL</span>
            <span className="metric-live">LIVE</span>
          </div>
          <div className="metric-body">
            <AnimatedNumber value={formatTvl(tvlUsd)} prefix="$" className="tvl-value" />
            <Sparkline data={sparkData} color="#4A90FF" animate />
          </div>
          <span className="metric-sub">{formatTvl(tvlEth)} ETH</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">7d APY</span>
          </div>
          <div className="metric-body">
            <span className="metric-value apy-value">{vault.apr7d}</span>
            <Sparkline data={apyData} color="#34D399" />
          </div>
          <span className="metric-sub">7-day average</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Fees</span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{vault.fees}</span>
          </div>
          <span className="metric-sub">Performance fee</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Risk Score</span>
          </div>
          <div className="metric-body">
            <span className="metric-value score-value" style={{ color: getRiskScoreColor(vault.institutionalRiskScore) }}>
              {vault.institutionalRiskScore}
            </span>
          </div>
          <span className="metric-sub">Institutional grade</span>
        </div>
      </div>

      {/* Middle section: Events + Scores */}
      <MiddleSection onNavigateTab={setRiskTab} vaultId={vault.id} />

      {/* Risk engine block */}
      <RiskEngine activeTab={riskTab} onTabChange={setRiskTab} vaultId={vault.id} />
    </div>
  );
}

const EVENT_TYPES = ['withdraw', 'supply', 'liquidation'] as const;
const TOKENS = ['USDC', 'ETH', 'USDT', 'wstETH', 'wETH'];
const RISKS = ['green', 'yellow', 'yellow', 'green', 'green'] as const;

function randomEvent(blockBase: number) {
  const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
  const amount = (Math.floor(Math.random() * 200) + 1) * 100;
  const block = blockBase + Math.floor(Math.random() * 50);
  let risk: string;
  if (type === 'supply') {
    risk = 'green';
  } else if (type === 'liquidation') {
    risk = 'yellow';
  } else {
    risk = amount >= 10000 ? 'yellow' : 'green';
  }
  return { type, amount: `${amount.toLocaleString()} ${token}`, block: String(block), time: 'just now', risk };
}

function initEvents(count: number) {
  const base = 19847200;
  return Array.from({ length: count }, (_, i) => {
    const ev = randomEvent(base - i * 30);
    ev.time = `${i * 2 + 1} min ago`;
    return ev;
  });
}

const TWEET_POOL = [
  { handle: '@LidoFinance', text: 'earnETH vault TVL surpasses $120M', time: '3m' },
  { handle: '@MellowProtocol', text: 'Restaking strategy live for DVstETH', time: '12m' },
  { handle: '@DeFiAlpha_', text: 'Lido v3 vaults 5% APY with AAA+ score', time: '28m' },
  { handle: '@ethlocker', text: 'ETH liquid staking vaults up 32% this week', time: '1h' },
  { handle: '@paborman', text: 'P2P risk engine scores updated for Q2', time: '2h' },
  { handle: '@CryptoRiskDAO', text: 'NAV administration audit passed for earnETH', time: '3h' },
  { handle: '@stakewise_io', text: 'wstETH allocations optimized for max yield', time: '4h' },
  { handle: '@naborman', text: 'Institutional flows into DeFi vaults accelerate', time: '5h' },
  { handle: '@MorphoLabs', text: 'Morpho vault integration live with Lido', time: '6h' },
  { handle: '@yeaborman', text: 'DVstETH collateral added to earnETH v3', time: '8h' },
  { handle: '@AaveAave', text: 'Flash loan protection enabled for vaults', time: '10h' },
  { handle: '@eigenlayer', text: 'Restaking rewards now flow to earnETH LPs', time: '12h' },
];

const ExpandIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 4V1H4" /><path d="M8 1H11V4" /><path d="M11 8V11H8" /><path d="M4 11H1V8" /></svg>
);

function MiddleSection({ onNavigateTab, vaultId }: { onNavigateTab: (tab: number) => void; vaultId: string }) {
  const [events, setEvents] = useState(() => initEvents(20));
  const blockRef = useRef(19847300);

  // Generate 1 new event every second
  useEffect(() => {
    const interval = setInterval(() => {
      blockRef.current += Math.floor(Math.random() * 5) + 1;
      const newEv = randomEvent(blockRef.current);
      setEvents(prev => [newEv, ...prev.slice(0, 49)]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [eventsPage, setEventsPage] = useState(0);
  const pageSize = 3;
  const totalPages = Math.ceil(events.length / pageSize);
  const visibleEvents = events.slice(eventsPage * pageSize, (eventsPage + 1) * pageSize);

  // Tweets with live generation
  const [tweets, setTweets] = useState(() => TWEET_POOL.slice(0, 4));
  const tweetIdx = useRef(4);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = TWEET_POOL[tweetIdx.current % TWEET_POOL.length];
      tweetIdx.current++;
      setTweets(prev => [next, ...prev.slice(0, 3)]);
    }, 40000);
    return () => clearInterval(interval);
  }, []);

  const scrollToRiskEngine = () => {
    document.querySelector('.risk-tabs')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="middle-grid">
      {/* Left column: Events + Twitter */}
      <div className="middle-left">
        <div className="events-card">
          <div className="events-header">
            <span className="events-title">Events</span>
            <div className="events-controls">
              <button className="events-nav" disabled={eventsPage === 0} onClick={() => setEventsPage((p) => p - 1)}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 3L4 6L7 9" /></svg>
              </button>
              <button className="events-nav" disabled={eventsPage >= totalPages - 1} onClick={() => setEventsPage((p) => p + 1)}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 3L8 6L5 9" /></svg>
              </button>
              <button className="events-fullscreen" title="Events stream" onClick={() => { onNavigateTab(4); scrollToRiskEngine(); }}>
                <ExpandIcon />
              </button>
            </div>
          </div>
          <div className="events-table-head">
            <span>Type</span><span>Amount</span><span>Block</span><span>Time</span><span>Risk</span>
          </div>
          {visibleEvents.map((ev, i) => (
            <div className="events-row" key={`${eventsPage}-${i}-${ev.block}`}>
              <span className={`event-type ${ev.type}`}>{ev.type}</span>
              <span className="event-amount">{ev.amount}</span>
              <span className="event-block">{ev.block}</span>
              <span className="event-time">{ev.time}</span>
              <span className={`event-risk-dot ${ev.risk}`} />
            </div>
          ))}
        </div>
        <div className="twitter-bar">
          <span className="twitter-title">Latest vault mentions on X</span>
          <div className="twitter-feed">
            {tweets.map((tw, i) => (
              <div className="tweet-row" key={`${tw.handle}-${i}`}>
                <span className="tweet-handle">{tw.handle}</span>
                <span className="tweet-text">{tw.text}</span>
                <span className="tweet-time">{tw.time}</span>
                <a href={`https://x.com/${tw.handle.slice(1)}`} target="_blank" rel="noopener noreferrer" className="tweet-link" title="View on X">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M3 1H9V7" /><path d="M9 1L1 9" /></svg>
                </a>
              </div>
            ))}
          </div>
          <div className="twitter-footer">
            <a href="https://x.com/i/grok" target="_blank" rel="noopener noreferrer" className="grok-btn">Ask Grok</a>
          </div>
        </div>
      </div>

      {/* Right column: Score blocks */}
      <div className="middle-right">
        <PlatformScoresCard onNavigate={() => { onNavigateTab(3); scrollToRiskEngine(); }} vaultId={vaultId} />
        <div className="score-card">
          <div className="score-card-header">
            <span className="score-card-title">NAV admin score</span>
            <button className="events-fullscreen" title="NAV administration" onClick={() => { onNavigateTab(2); scrollToRiskEngine(); }}><ExpandIcon /></button>
          </div>
          {vaultId === 'earn-eth-lido-mellow' ? (
            <div className="score-card-row"><span className="score-card-label">Lambda NAV</span><span className="score-card-value score-green">A+</span></div>
          ) : (
            <div className="score-card-row"><span className="score-card-label">&mdash;</span><span className="score-card-value" /></div>
          )}
        </div>
        <div className="score-card">
          <div className="score-card-header">
            <span className="score-card-title">Strategy score</span>
            <button className="events-fullscreen" title="Strategy risks" onClick={() => { onNavigateTab(1); scrollToRiskEngine(); }}><ExpandIcon /></button>
          </div>
          {vaultId === 'earn-eth-lido-mellow' ? (<>
            <div className="score-card-row"><span className="score-card-label">Financial risk:</span><span className="score-card-value score-green">A+</span></div>
            <div className="score-card-row"><span className="score-card-label">Protocol risk:</span><span className="score-card-value score-green">A+</span></div>
            <div className="score-card-row"><span className="score-card-label">Curator risk:</span><span className="score-card-value score-green">A+</span></div>
          </>) : (<>
            <div className="score-card-row"><span className="score-card-label">Financial risk:</span><span className="score-card-value">&mdash;</span></div>
            <div className="score-card-row"><span className="score-card-label">Protocol risk:</span><span className="score-card-value">&mdash;</span></div>
            <div className="score-card-row"><span className="score-card-label">Curator risk:</span><span className="score-card-value">&mdash;</span></div>
          </>)}
        </div>
      </div>
    </div>
  );
}

const PLATFORM_SCORES: Record<string, { label: string; score: string; scoreColor: string; weight: string }[]> = {
  'earn-eth-lido-mellow': [
    { label: 'Lido v3', score: 'A+', scoreColor: '#34D399', weight: '1' },
    { label: 'Mellow', score: 'A', scoreColor: '#34D399', weight: '1' },
    { label: 'Veda', score: 'B+', scoreColor: '#FBBF24', weight: '~ 0' },
  ],
};

const DEFAULT_PLATFORM_SCORES = [
  { label: '—', score: '', scoreColor: '', weight: '' },
  { label: '—', score: '', scoreColor: '', weight: '' },
];

function PlatformScoresCard({ onNavigate, vaultId }: { onNavigate: () => void; vaultId: string }) {
  const data = PLATFORM_SCORES[vaultId] || DEFAULT_PLATFORM_SCORES;
  const [page, setPage] = useState(0);
  const pageSize = 2;
  const totalPages = Math.ceil(data.length / pageSize);
  const visible = data.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="score-card">
      <div className="score-card-header">
        <span className="score-card-title">Platform scores</span>
        <div className="score-card-controls">
          <button className="events-nav" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 2.5L3.5 5L6 7.5" /></svg>
          </button>
          <button className="events-nav" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 2.5L6.5 5L4 7.5" /></svg>
          </button>
          <button className="events-fullscreen" title="Platform risks" onClick={onNavigate}><ExpandIcon /></button>
        </div>
      </div>
      <div className="score-card-body-fixed">
        {visible.map((row, i) => (
          <div className="score-card-row" key={page * pageSize + i}>
            <span className="score-card-label">{row.label}</span>
            <span className="score-card-right">
              {row.score && <span className="score-card-value" style={{ color: row.scoreColor }}>{row.score}</span>}
              {row.weight && <span className="score-card-weight">w={row.weight}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const RISK_TABS = ['Risk Map', 'Strategy risks', 'NAV administration', 'Platform risks', 'Events stream'] as const;

function RiskEngine({ activeTab, onTabChange, vaultId }: { activeTab: number; onTabChange: (t: number) => void; vaultId: string }) {
  return (
    <div className="profile-section">
      <h2 className="section-title">Risk engine</h2>
      <div className="risk-tabs">
        {RISK_TABS.map((tab, i) => (
          <button
            key={tab}
            className={`risk-tab ${i === activeTab ? 'active' : ''}`}
            onClick={() => onTabChange(i)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="risk-tab-content">
        {activeTab === 0 && vaultId === 'earn-eth-lido-mellow' ? (
          <RiskMapLazy />
        ) : (
          <span className="placeholder-text">{RISK_TABS[activeTab]} — coming soon</span>
        )}
      </div>
    </div>
  );
}

function RiskMapLazy() {
  const [Comp, setComp] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    import('./RiskMap').then((m) => setComp(() => m.RiskMap));
  }, []);
  if (!Comp) return <span className="placeholder-text">Loading Risk Map...</span>;
  return <Comp />;
}
