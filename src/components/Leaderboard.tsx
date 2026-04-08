import { useState, useMemo, useRef, useEffect } from 'react';
import { vaults } from '../data';
import type { Vault } from '../types';
import { VaultCard } from './VaultCard';
import './Leaderboard.css';

const RISK_ORDER = [
  'AAA+','AAA','AAA-','AA+','AA','AA-','A+','A','A-',
  'BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-',
  'CCC+','CCC','CCC-','CC','C','D',
];

const ALL_RISK_SCORES = [...RISK_ORDER];

function parseTvlUsd(v: string): number {
  const m = v.replace('~', '').replace('$', '').trim();
  const num = parseFloat(m);
  if (m.endsWith('M')) return num * 1_000_000;
  if (m.endsWith('K')) return num * 1_000;
  if (m.endsWith('B')) return num * 1_000_000_000;
  return num;
}

function parsePercent(v: string): number {
  return parseFloat(v.replace('%', ''));
}

type SortKey = 'tvl' | 'apr' | 'fees' | 'score';
type SortDir = 'asc' | 'desc';
type CompareOp = '>' | '>=' | '<' | '<=' | '=';

const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`sort-icon ${active ? 'active' : ''}`}>
    <path d="M5 1L8 4.5H2L5 1Z" fill={active && dir === 'asc' ? 'var(--text-primary)' : 'var(--text-dim)'} />
    <path d="M5 9L2 5.5H8L5 9Z" fill={active && dir === 'desc' ? 'var(--text-primary)' : 'var(--text-dim)'} />
  </svg>
);

function MultiSelect({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };

  return (
    <div className="filter-dropdown" ref={ref}>
      <button className={`filter-trigger ${selected.length > 0 ? 'has-value' : ''}`} onClick={() => setOpen((o) => !o)}>
        {label}{selected.length > 0 && <span className="filter-count">{selected.length}</span>}
        <svg className={`filter-chevron ${open ? 'open' : ''}`} width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 4L5 6.5L7.5 4" />
        </svg>
      </button>
      {open && (
        <div className="filter-menu">
          {options.map((o) => (
            <label key={o} className="filter-option">
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} />
              <span className="filter-check">{selected.includes(o) ? '✓' : ''}</span>
              {o}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

const OPS: CompareOp[] = ['>', '>=', '<', '<=', '='];

function NumericFilter({ label, op, value, onOpChange, onValueChange }: {
  label: string; op: CompareOp; value: string;
  onOpChange: (o: CompareOp) => void; onValueChange: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [opOpen, setOpOpen] = useState(false);
  const opRef = useRef<HTMLDivElement>(null);
  const hasValue = value !== '';

  useEffect(() => {
    const h = (e: MouseEvent) => { if (opRef.current && !opRef.current.contains(e.target as Node)) setOpOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className={`numeric-inline ${expanded || hasValue ? 'expanded' : ''}`}>
      <button className={`filter-trigger ${hasValue ? 'has-value' : ''}`} onClick={() => setExpanded((e) => !e)}>
        {label}
      </button>
      {(expanded || hasValue) && (
        <>
          <div className="numeric-op-wrap" ref={opRef}>
            <button className="numeric-op-btn" onClick={() => setOpOpen((o) => !o)}>{op}</button>
            {opOpen && (
              <div className="numeric-op-menu">
                {OPS.map((o) => (
                  <button key={o} className={`numeric-op-item ${o === op ? 'active' : ''}`} onClick={() => { onOpChange(o); setOpOpen(false); }}>{o}</button>
                ))}
              </div>
            )}
          </div>
          <input
            className="numeric-input"
            type="number"
            placeholder="0"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            autoFocus={expanded && !hasValue}
          />
          {hasValue && (
            <button className="numeric-clear-x" onClick={() => { onValueChange(''); setExpanded(false); }} title="Clear">&times;</button>
          )}
        </>
      )}
    </div>
  );
}

function applyCompare(actual: number, op: CompareOp, target: number): boolean {
  switch (op) {
    case '>': return actual > target;
    case '>=': return actual >= target;
    case '<': return actual < target;
    case '<=': return actual <= target;
    case '=': return actual === target;
  }
}

// Extract unique values
const allCollateral = [...new Set(vaults.flatMap((v) => v.collateralAssets))].sort();
const allChains = [...new Set(vaults.map((v) => v.chain))].sort();
const allCurators = [...new Set(vaults.map((v) => v.riskCurator))].sort();

export function Leaderboard() {
  const [collapseSignal, setCollapseSignal] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Filters
  const [fCollateral, setFCollateral] = useState<string[]>([]);
  const [fChain, setFChain] = useState<string[]>([]);
  const [fCurator, setFCurator] = useState<string[]>([]);
  const [fRiskScore, setFRiskScore] = useState<string[]>([]);
  const [tvlOp, setTvlOp] = useState<CompareOp>('>');
  const [tvlVal, setTvlVal] = useState('');
  const [aprOp, setAprOp] = useState<CompareOp>('>');
  const [aprVal, setAprVal] = useState('');
  const [feesOp, setFeesOp] = useState<CompareOp>('>');
  const [feesVal, setFeesVal] = useState('');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let result = [...vaults];

    if (fCollateral.length > 0) {
      result = result.filter((v) => fCollateral.some((c) => v.collateralAssets.includes(c)));
    }
    if (fChain.length > 0) {
      result = result.filter((v) => fChain.includes(v.chain));
    }
    if (fCurator.length > 0) {
      result = result.filter((v) => fCurator.includes(v.riskCurator));
    }
    if (fRiskScore.length > 0) {
      result = result.filter((v) => fRiskScore.includes(v.institutionalRiskScore));
    }
    if (tvlVal !== '') {
      const target = parseFloat(tvlVal) * 1_000_000;
      result = result.filter((v) => applyCompare(parseTvlUsd(v.tvlUsd), tvlOp, target));
    }
    if (aprVal !== '') {
      const target = parseFloat(aprVal);
      result = result.filter((v) => applyCompare(parsePercent(v.apr7d), aprOp, target));
    }
    if (feesVal !== '') {
      const target = parseFloat(feesVal);
      result = result.filter((v) => applyCompare(parsePercent(v.fees), feesOp, target));
    }

    return result;
  }, [fCollateral, fChain, fCurator, fRiskScore, tvlOp, tvlVal, aprOp, aprVal, feesOp, feesVal]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (!sortKey) {
      return arr.sort((a, b) => {
        const ai = RISK_ORDER.indexOf(a.institutionalRiskScore);
        const bi = RISK_ORDER.indexOf(b.institutionalRiskScore);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    }

    const cmp = (a: Vault, b: Vault): number => {
      switch (sortKey) {
        case 'tvl': return parseTvlUsd(a.tvlUsd) - parseTvlUsd(b.tvlUsd);
        case 'apr': return parsePercent(a.apr7d) - parsePercent(b.apr7d);
        case 'fees': return parsePercent(a.fees) - parsePercent(b.fees);
        case 'score': {
          const ai = RISK_ORDER.indexOf(a.institutionalRiskScore);
          const bi = RISK_ORDER.indexOf(b.institutionalRiskScore);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        }
      }
    };

    return arr.sort((a, b) => sortDir === 'asc' ? cmp(a, b) : -cmp(a, b));
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="page-header-row">
          <div>
            <h1>Vaults Leaderboard</h1>
            <p className="leaderboard-subtitle">
              Institutional-grade vault ratings powered by P2P.org
            </p>
          </div>
          <a href="https://lambda.p2p.org/#get_access" target="_blank" rel="noopener noreferrer" className="primary-action-btn">Rate my vault for LP</a>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <MultiSelect label="Collateral" options={allCollateral} selected={fCollateral} onChange={setFCollateral} />
        <MultiSelect label="Chain" options={allChains} selected={fChain} onChange={setFChain} />
        <MultiSelect label="Risk Curator" options={allCurators} selected={fCurator} onChange={setFCurator} />
        <NumericFilter label="TVL" op={tvlOp} value={tvlVal} onOpChange={setTvlOp} onValueChange={setTvlVal} />
        <NumericFilter label="7d APR" op={aprOp} value={aprVal} onOpChange={setAprOp} onValueChange={setAprVal} />
        <NumericFilter label="Fees" op={feesOp} value={feesVal} onOpChange={setFeesOp} onValueChange={setFeesVal} />
        <MultiSelect label="Risk Score" options={ALL_RISK_SCORES} selected={fRiskScore} onChange={setFRiskScore} />
      </div>

      <div className="vault-table">
        <div className="vault-table-header">
          <span className="col-name">Name</span>
          <span className="col-tvl sortable" onClick={() => toggleSort('tvl')}>
            TVL <SortIcon active={sortKey === 'tvl'} dir={sortDir} />
          </span>
          <span className="col-apr sortable" onClick={() => toggleSort('apr')}>
            7d APR <SortIcon active={sortKey === 'apr'} dir={sortDir} />
          </span>
          <span className="col-fees sortable" onClick={() => toggleSort('fees')}>
            Fees <SortIcon active={sortKey === 'fees'} dir={sortDir} />
          </span>
          <span className="col-collateral">Collateral</span>
          <span className="col-chain">Chain</span>
          <span className="col-curator">Risk Curator</span>
          <span className="col-score sortable" onClick={() => toggleSort('score')}>
            Risk Score <SortIcon active={sortKey === 'score'} dir={sortDir} />
            <button className="collapse-all-icon" title="Collapse all" onClick={(e) => { e.stopPropagation(); setCollapseSignal((s) => s + 1); }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2L7 6L11 2" />
                <path d="M3 12L7 8L11 12" />
              </svg>
            </button>
          </span>
        </div>
        {sorted.map((vault) => (
          <VaultCard
            key={vault.id}
            vault={vault}
            disableProfile={vault.category === 'C'}
            collapseSignal={collapseSignal}
          />
        ))}
        {sorted.length === 0 && (
          <div className="no-results">No vaults match the current filters</div>
        )}
      </div>
    </div>
  );
}
