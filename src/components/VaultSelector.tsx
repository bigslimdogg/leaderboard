import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { vaults } from '../data';
import './VaultSelector.css';

export function VaultSelector() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedVault = vaults.find((v) => v.id === selected);

  return (
    <div className="vault-selector">
      <div className="selector-header">
        <Link to="/" className="back-link">&larr; Back to Leaderboard</Link>
        <h1>Vault Risk Profile</h1>
        <p className="selector-subtitle">Select a vault to view its risk profile</p>
      </div>
      <div className="selector-card">
        <label className="selector-label">Choose a vault</label>
        <div className="custom-dropdown" ref={ref}>
          <button className="dropdown-trigger" onClick={() => setOpen((o) => !o)}>
            <span className={selectedVault ? 'dropdown-value' : 'dropdown-placeholder'}>
              {selectedVault ? selectedVault.name : '— Select vault —'}
            </span>
            <svg className={`dropdown-chevron ${open ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5L6 8L9 5" />
            </svg>
          </button>
          {open && (
            <div className="dropdown-menu">
              {vaults.map((v) => (
                <button
                  key={v.id}
                  className={`dropdown-item ${v.id === selected ? 'active' : ''}`}
                  onClick={() => {
                    setSelected(v.id);
                    setOpen(false);
                    navigate(`/vault/${v.id}`);
                  }}
                >
                  {v.name}
                  <span className="dropdown-item-score" style={{ color: v.institutionalRiskScore.startsWith('A') ? '#00C087' : v.institutionalRiskScore.startsWith('B') ? '#C4B000' : '#D03030' }}>
                    {v.institutionalRiskScore}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
