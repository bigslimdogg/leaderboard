import { useMemo, useState } from 'react';
import { revenueRows } from '../revenueData';
import type { RevenueRow } from '../revenueData';
import './RevenueReconciliation.css';

const fmtUsd = (v: number, compact = false) => {
  if (compact && Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (compact && Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
};

const fmtNum = (v: number, dec = 2) =>
  v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const truncAddr = (a: string) => (a && a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || '—');

const REQUIRED_COLS: Array<keyof RevenueRow> = [
  'month', 'team', 'chain', 'project', 'token_id', 'revenue_tokens',
  'revenue_usd', 'type', 'source',
];

const ALLOWED_TYPES = new Set(['Staking revenue', 'Node Maintenance']);

function runValidations(rows: RevenueRow[]) {
  const checks = [
    {
      id: 'no-blanks', label: 'No blanks in required columns',
      detail: 'Month, team, chain, project, token_id, revenue_tokens, revenue_usd, type, Source',
      fails: rows.filter((r) =>
        REQUIRED_COLS.some((c) => r[c] === null || r[c] === undefined || r[c] === '')
      ).length,
    },
    {
      id: 'tokens-nonneg', label: 'revenue_tokens ≥ 0',
      detail: 'No negative token quantities permitted',
      fails: rows.filter((r) => r.revenue_tokens < 0).length,
    },
    {
      id: 'earned-le-tokens', label: 'revenue_earned ≤ revenue_tokens',
      detail: 'Recognized revenue cannot exceed earned tokens',
      fails: rows.filter((r) => r.revenue_earned > r.revenue_tokens + 1e-9).length,
    },
    {
      id: 'earned-in-month', label: 'revenue_earned_date within reporting month',
      detail: 'Earned date must fall in Feb 2026',
      fails: rows.filter((r) => r.revenue_earned_date && !r.revenue_earned_date.startsWith('2026-02')).length,
    },
    {
      id: 'usd-formula', label: 'revenue_usd = revenue_tokens × price (±0.01)',
      detail: 'USD computation reconciles to formula where price populated',
      fails: rows.filter((r) =>
        r.price && Math.abs(r.revenue_usd - r.revenue_tokens * r.price) > 0.01
      ).length,
    },
    {
      id: 'no-dupes', label: 'No duplicate (Month + chain + project + token_id)',
      detail: 'Composite key uniqueness enforced',
      fails: (() => {
        const seen = new Set<string>();
        let d = 0;
        for (const r of rows) {
          const k = `${r.month}|${r.chain}|${r.project}|${r.token_id}`;
          if (seen.has(k)) d++;
          seen.add(k);
        }
        return d;
      })(),
    },
    {
      id: 'type-allowed', label: "type ∈ {'Staking revenue', 'Node Maintenance'}",
      detail: 'Schema-restricted vocabulary; flags typos',
      fails: rows.filter((r) => !ALLOWED_TYPES.has(r.type)).length,
    },
    {
      id: 'month-match', label: 'Month matches reporting period',
      detail: 'All rows must reference Feb 2026',
      fails: rows.filter((r) => !r.month.startsWith('2026-02')).length,
    },
  ];
  return checks;
}

const SOC1_CONTROLS = [
  { name: 'Data Integrity', owner: 'Data Eng Lead', status: 'pass', desc: 'Tokens & USD reconcile to on-chain source data' },
  { name: 'Segregation of Duties', owner: 'Finance Manager', status: 'pending', desc: 'Generator ≠ Approver — awaiting sign-off' },
  { name: 'Access Control', owner: 'IT Security', status: 'pass', desc: 'ACLs current; quarterly review on file' },
  { name: 'Change Management', owner: 'Data Eng Lead', status: 'pass', desc: 'Schema v1.1 changes documented & approved' },
  { name: 'Completeness & Cutoff', owner: 'Data Eng Lead', status: 'warn', desc: '4 chains pending raw-layer ingestion' },
  { name: 'Reconciliation', owner: 'Finance Manager', status: 'warn', desc: 'Earned vs Claimed variance > $0 — see panel' },
  { name: 'Audit Trail', owner: 'Data Eng Lead', status: 'pass', desc: 'Source field populated on every record' },
  { name: 'Timely Reporting', owner: 'Data Eng Lead', status: 'pass', desc: 'On track for Day 1 delivery' },
];

const PALETTE = ['#1347FF', '#7191FF', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE', '#FB923C', '#FB7185', '#4ADE80'];

export function RevenueReconciliation() {
  const [period] = useState('Feb 2026');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [flagOnly, setFlagOnly] = useState(false);
  const [search, setSearch] = useState('');

  const totalsByTeam = useMemo(() => {
    const m = new Map<string, number>();
    revenueRows.forEach((r) => m.set(r.team, (m.get(r.team) || 0) + r.revenue_usd));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  const totalsByRewardType = useMemo(() => {
    const m = new Map<string, number>();
    revenueRows.forEach((r) => m.set(r.reward_type, (m.get(r.reward_type) || 0) + r.revenue_usd));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  const topChains = useMemo(() => {
    const m = new Map<string, number>();
    revenueRows.forEach((r) => m.set(r.chain, (m.get(r.chain) || 0) + r.revenue_usd));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, []);

  const totals = useMemo(() => {
    const totalUsd = revenueRows.reduce((s, r) => s + r.revenue_usd, 0);
    const earnedUsd = revenueRows.reduce((s, r) => s + r.revenue_earned_usd, 0);
    const claimedUsd = revenueRows.reduce((s, r) => s + r.revenue_claimed_usd, 0);
    const variance = earnedUsd - claimedUsd;
    const pricingGapRows = revenueRows.filter((r) => !r.price).length;
    const flaggedRows = revenueRows.filter((r) => r.flags.length > 0).length;
    const teams = new Set(revenueRows.map((r) => r.team)).size;
    const chains = new Set(revenueRows.map((r) => r.chain.toLowerCase())).size;
    return { totalUsd, earnedUsd, claimedUsd, variance, pricingGapRows, flaggedRows, teams, chains };
  }, []);

  const checks = useMemo(() => runValidations(revenueRows), []);
  const passCount = checks.filter((c) => c.fails === 0).length;

  const filteredRows = useMemo(() => {
    return revenueRows.filter((r) => {
      if (teamFilter !== 'all' && r.team !== teamFilter) return false;
      if (flagOnly && r.flags.length === 0) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${r.chain} ${r.project} ${r.token_id} ${r.team} ${r.source_address}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [teamFilter, flagOnly, search]);

  const teamMax = totalsByTeam[0]?.[1] ?? 1;
  const rewardMax = totalsByRewardType[0]?.[1] ?? 1;
  const chainMax = topChains[0]?.[1] ?? 1;

  const earnedClaimedRatio = totals.earnedUsd > 0 ? (totals.claimedUsd / totals.earnedUsd) * 100 : 0;

  return (
    <div className="recon">
      {/* Header */}
      <header className="recon-header">
        <div className="recon-header-top">
          <div>
            <div className="recon-eyebrow">
              <span>Monthly Revenue Report</span>
              <span className="recon-version">SOC 1 Compliant · v1.1</span>
            </div>
            <h1>Revenue Reconciliation — {period}</h1>
            <p className="recon-subtitle">
              Month-end revenue recognition · ASC 606 / IFRS 15 · {revenueRows.length} rows · {totals.teams} teams · {totals.chains} chains
            </p>
          </div>
          <div className="recon-header-actions">
            <div className="recon-deadline">
              <span className="recon-deadline-label">Day 1 Target</span>
              <span className="recon-deadline-date">Mar 1, 2026</span>
              <span className="recon-deadline-hard">Hard deadline · Mar 5</span>
            </div>
            <button className="primary-action-btn">Submit to Accounting</button>
          </div>
        </div>
        <div className="recon-status-row">
          <span className={`recon-status-pill ${passCount === checks.length ? 'pass' : passCount >= 6 ? 'warn' : 'fail'}`}>
            <span className="dot" />
            {passCount}/{checks.length} validations passing
          </span>
          <span className="recon-status-pill neutral">
            Pipeline: <strong>L1 Indexers → L2 Raw Tx → L3 Roll-up</strong>
          </span>
          <span className="recon-status-pill neutral">
            Pricing: month-end close · <em>FMV migration pending</em>
          </span>
          <span className="recon-status-pill neutral">
            Retention: 7 yrs (SOC 1)
          </span>
        </div>
      </header>

      {/* KPI strip */}
      <section className="recon-kpis">
        <div className="kpi-card">
          <div className="kpi-label">Total Revenue (USD)</div>
          <div className="kpi-value">{fmtUsd(totals.totalUsd, true)}</div>
          <div className="kpi-sub">{revenueRows.length} rows · {fmtUsd(totals.totalUsd / revenueRows.length, true)} avg</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Earned (recognizable)</div>
          <div className="kpi-value">{fmtUsd(totals.earnedUsd, true)}</div>
          <div className="kpi-sub">ASC 606 · perf. obligation satisfied</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Claimed (invoiced)</div>
          <div className="kpi-value">{fmtUsd(totals.claimedUsd, true)}</div>
          <div className="kpi-sub">{earnedClaimedRatio.toFixed(1)}% of earned</div>
        </div>
        <div className={`kpi-card ${totals.variance > 0 ? 'kpi-warn' : ''}`}>
          <div className="kpi-label">Earned − Claimed Variance</div>
          <div className="kpi-value">{fmtUsd(totals.variance, true)}</div>
          <div className="kpi-sub">{revenueRows.filter((r) => r.flags.includes('earned_vs_claimed_variance')).length} rows need write-up</div>
        </div>
        <div className={`kpi-card ${totals.pricingGapRows > 0 ? 'kpi-warn' : ''}`}>
          <div className="kpi-label">Pricing Gap</div>
          <div className="kpi-value">{totals.pricingGapRows}</div>
          <div className="kpi-sub">rows w/o month-end price</div>
        </div>
        <div className={`kpi-card ${totals.flaggedRows > 0 ? 'kpi-warn' : ''}`}>
          <div className="kpi-label">Flagged Rows</div>
          <div className="kpi-value">{totals.flaggedRows}</div>
          <div className="kpi-sub">{((totals.flaggedRows / revenueRows.length) * 100).toFixed(0)}% of total</div>
        </div>
      </section>

      {/* Charts row */}
      <section className="recon-grid-3">
        <div className="recon-panel">
          <div className="panel-header">
            <h3>Revenue by Team</h3>
            <span className="panel-meta">{totalsByTeam.length} business units</span>
          </div>
          <div className="bar-list">
            {totalsByTeam.map(([team, val], i) => (
              <div key={team} className="bar-row">
                <div className="bar-row-label">
                  <span className="dot-small" style={{ background: PALETTE[i % PALETTE.length] }} />
                  {team}
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(val / teamMax) * 100}%`, background: PALETTE[i % PALETTE.length] }}
                  />
                </div>
                <div className="bar-row-value">{fmtUsd(val, true)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="recon-panel">
          <div className="panel-header">
            <h3>Revenue by Reward Type</h3>
            <span className="panel-meta">SOC 1 v1.1 — NEW column</span>
          </div>
          <div className="bar-list">
            {totalsByRewardType.map(([rt, val], i) => (
              <div key={rt} className="bar-row">
                <div className="bar-row-label">
                  <span className="dot-small" style={{ background: PALETTE[(i + 2) % PALETTE.length] }} />
                  <code>{rt}</code>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(val / rewardMax) * 100}%`, background: PALETTE[(i + 2) % PALETTE.length] }}
                  />
                </div>
                <div className="bar-row-value">{fmtUsd(val, true)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="recon-panel">
          <div className="panel-header">
            <h3>Top Chains by Revenue</h3>
            <span className="panel-meta">{totals.chains} chains total</span>
          </div>
          <div className="bar-list">
            {topChains.map(([chain, val], i) => (
              <div key={chain} className="bar-row">
                <div className="bar-row-label">
                  <span className="dot-small" style={{ background: PALETTE[(i + 4) % PALETTE.length] }} />
                  {chain}
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(val / chainMax) * 100}%`, background: PALETTE[(i + 4) % PALETTE.length] }}
                  />
                </div>
                <div className="bar-row-value">{fmtUsd(val, true)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Validation + SOC1 controls + Pipeline */}
      <section className="recon-grid-2">
        <div className="recon-panel">
          <div className="panel-header">
            <h3>Automated Validation Checks</h3>
            <span className={`panel-status ${passCount === checks.length ? 'pass' : 'warn'}`}>
              {passCount}/{checks.length}
            </span>
          </div>
          <div className="check-list">
            {checks.map((c) => (
              <div key={c.id} className={`check-row ${c.fails === 0 ? 'pass' : 'fail'}`}>
                <div className="check-icon">
                  {c.fails === 0 ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div className="check-body">
                  <div className="check-label">{c.label}</div>
                  <div className="check-detail">{c.detail}</div>
                </div>
                <div className="check-count">
                  {c.fails === 0 ? 'PASS' : `${c.fails} fail`}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="recon-panel">
          <div className="panel-header">
            <h3>SOC 1 Key Controls</h3>
            <span className="panel-meta">v1.1 · 8 controls</span>
          </div>
          <div className="soc1-list">
            {SOC1_CONTROLS.map((c) => (
              <div key={c.name} className={`soc1-row soc1-${c.status}`}>
                <div className={`soc1-status soc1-${c.status}`}>
                  {c.status === 'pass' ? '✓' : c.status === 'warn' ? '!' : '○'}
                </div>
                <div className="soc1-body">
                  <div className="soc1-name">{c.name}</div>
                  <div className="soc1-desc">{c.desc}</div>
                </div>
                <div className="soc1-owner">{c.owner}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline + Submission */}
      <section className="recon-grid-2">
        <div className="recon-panel">
          <div className="panel-header">
            <h3>Data Pipeline (Layer 1 → 2 → 3)</h3>
            <span className="panel-meta">7-yr retention · system of record = L2</span>
          </div>
          <div className="pipeline">
            <div className="pipe-node pipe-pass">
              <div className="pipe-label">Layer 1</div>
              <div className="pipe-name">On-Chain Indexers</div>
              <div className="pipe-meta">{totals.chains} chains · live</div>
              <div className="pipe-badges">
                <span className="badge-pill">CoinGecko</span>
                <span className="badge-pill">Indexer</span>
              </div>
            </div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-node pipe-warn">
              <div className="pipe-label">Layer 2</div>
              <div className="pipe-name">Raw Transaction Store</div>
              <div className="pipe-meta">Tx-level · system of record</div>
              <div className="pipe-badges">
                <span className="badge-pill">Source: <code>reward_type</code></span>
              </div>
            </div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-node pipe-pass">
              <div className="pipe-label">Layer 3</div>
              <div className="pipe-name">Monthly Roll-up</div>
              <div className="pipe-meta">Aggregated · this report</div>
              <div className="pipe-badges">
                <span className="badge-pill">{revenueRows.length} rows</span>
              </div>
            </div>
          </div>
        </div>

        <div className="recon-panel">
          <div className="panel-header">
            <h3>Submission Workflow</h3>
            <span className="panel-meta">Day 1 target · Day 5 hard deadline</span>
          </div>
          <ol className="workflow">
            <li className="wf-done"><span className="wf-step">1</span><div><strong>Pipeline auto-run</strong><span>Day 1 · pulls prior-month revenue</span></div></li>
            <li className="wf-done"><span className="wf-step">2</span><div><strong>Automated validations</strong><span>{passCount}/{checks.length} checks passing</span></div></li>
            <li className="wf-active"><span className="wf-step">3</span><div><strong>Data Eng Lead review</strong><span>In progress · {totals.flaggedRows} flagged rows</span></div></li>
            <li className="wf-pending"><span className="wf-step">4</span><div><strong>Finance Manager sign-off</strong><span>Segregation of duties (different individual)</span></div></li>
            <li className="wf-pending"><span className="wf-step">5</span><div><strong>Deliver to accounting</strong><span>+ reconciliation summary</span></div></li>
            <li className="wf-pending"><span className="wf-step">6</span><div><strong>Archive</strong><span>Version-controlled · 7-yr retention</span></div></li>
          </ol>
        </div>
      </section>

      {/* Data table */}
      <section className="recon-panel recon-table-panel">
        <div className="panel-header table-header">
          <div>
            <h3>Layer 3 Roll-up · Schema v1.1</h3>
            <span className="panel-meta">
              {filteredRows.length} of {revenueRows.length} rows · scroll horizontally for full schema (21 columns)
            </span>
          </div>
          <div className="table-controls">
            <input
              className="recon-search"
              placeholder="Search chain / project / address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="recon-select" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              <option value="all">All teams</option>
              {totalsByTeam.map(([t]) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              className={`recon-toggle ${flagOnly ? 'on' : ''}`}
              onClick={() => setFlagOnly((v) => !v)}
            >
              {flagOnly ? '✓ ' : ''}Flagged only
            </button>
          </div>
        </div>
        <div className="table-scroll">
          <table className="recon-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Team</th>
                <th>Chain</th>
                <th>Project</th>
                <th>Token</th>
                <th className="col-new">Source addr <em>NEW</em></th>
                <th className="num">Price</th>
                <th className="num">Rev tokens</th>
                <th className="col-new">Reward type <em>NEW</em></th>
                <th className="num">Rev USD</th>
                <th>Type</th>
                <th>Source</th>
                <th className="num col-new">Earned <em>NEW</em></th>
                <th className="col-new">Earned date <em>NEW</em></th>
                <th className="num col-new">Claimed <em>NEW</em></th>
                <th className="col-new">Claimed date <em>NEW</em></th>
                <th className="col-new">Related 1 <em>NEW</em></th>
                <th className="col-new">Related 2 <em>NEW</em></th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
                <tr key={i} className={r.flags.length ? 'has-flags' : ''}>
                  <td className="mono">Feb 2026</td>
                  <td>{r.team}</td>
                  <td>{r.chain}</td>
                  <td>{r.project}</td>
                  <td className="mono">{r.token_id}</td>
                  <td className="mono">{truncAddr(r.source_address)}</td>
                  <td className="num mono">{r.price ? fmtNum(r.price, 4) : <span className="muted">—</span>}</td>
                  <td className="num mono">{fmtNum(r.revenue_tokens, 4)}</td>
                  <td><code className="reward-tag">{r.reward_type}</code></td>
                  <td className="num mono">{fmtUsd(r.revenue_usd)}</td>
                  <td>{r.type}</td>
                  <td className="muted">{r.source}</td>
                  <td className="num mono">{fmtNum(r.revenue_earned, 4)}</td>
                  <td className="mono">{r.revenue_earned_date}</td>
                  <td className="num mono">{fmtNum(r.revenue_claimed, 4)}</td>
                  <td className="mono">{r.revenue_claimed_date || <span className="muted">unclaimed</span>}</td>
                  <td className="mono">{truncAddr(r.related_address1)}</td>
                  <td className="mono">{truncAddr(r.related_address2)}</td>
                  <td>
                    {r.flags.length === 0 ? (
                      <span className="flag flag-ok">OK</span>
                    ) : (
                      r.flags.map((f) => (
                        <span key={f} className={`flag flag-${flagSeverity(f)}`} title={f}>
                          {flagShort(f)}
                        </span>
                      ))
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="recon-footer">
        <span>Owned by Data Engineering · Reviewed annually or on material change · Schema v1.1 · Apr 2026</span>
        <span>Variance &gt; 10% MoM requires Finance Manager approval · Manual entries flagged in Source field</span>
      </footer>
    </div>
  );
}

function flagShort(f: string) {
  const map: Record<string, string> = {
    missing_price: 'price?',
    usd_mismatch: 'usd Δ',
    earned_vs_claimed_variance: 'E≠C',
    typo_node_maintenance: 'spell',
    invalid_type: 'type!',
    missing_type: 'type?',
    negative_tokens: 'neg',
  };
  return map[f] || f;
}

function flagSeverity(f: string): 'warn' | 'err' | 'info' {
  if (['negative_tokens', 'invalid_type', 'usd_mismatch', 'missing_type'].includes(f)) return 'err';
  if (['earned_vs_claimed_variance', 'missing_price'].includes(f)) return 'warn';
  return 'info';
}
