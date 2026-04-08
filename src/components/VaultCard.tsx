import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Vault } from '../types';
import './VaultCard.css';

const EthereumIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 0L2.5 7.1L7 9.6L11.5 7.1L7 0Z" fill="#627EEA" />
    <path d="M2.5 7.9L7 14L11.5 7.9L7 10.4L2.5 7.9Z" fill="#627EEA" />
    <path d="M7 0L2.5 7.1L7 5.2L11.5 7.1L7 0Z" fill="#8EA8F0" opacity="0.6" />
  </svg>
);

const ArbitrumIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6.5" fill="#213147" stroke="#96BEDC" strokeWidth="1" />
    <path d="M7.8 4L10 9.5H8.6L7.2 5.8L5.4 9.5H4L7 4H7.8Z" fill="#96BEDC" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 7C1 7 3.5 3 7 3C10.5 3 13 7 13 7C13 7 10.5 11 7 11C3.5 11 1 7 1 7Z" />
    <circle cx="7" cy="7" r="2" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 7C1 7 3.5 3 7 3C10.5 3 13 7 13 7" />
    <path d="M1 7C1 7 3.5 11 7 11C10.5 11 13 7 13 7" />
    <path d="M2 2L12 12" />
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
    <path d="M4 6L8 10L12 6" />
  </svg>
);

const CRYPTO_ICON_BASE = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color';

const assetIconUrls: Record<string, string> = {
  ETH: `${CRYPTO_ICON_BASE}/eth.svg`,
  wETH: `${CRYPTO_ICON_BASE}/eth.svg`,
  wstETH: `${CRYPTO_ICON_BASE}/eth.svg`,
  strETH: `${CRYPTO_ICON_BASE}/eth.svg`,
  DVstETH: `${CRYPTO_ICON_BASE}/eth.svg`,
  GG: `${CRYPTO_ICON_BASE}/eth.svg`,
  USDC: `${CRYPTO_ICON_BASE}/usdc.svg`,
  USDT: `${CRYPTO_ICON_BASE}/usdt.svg`,
};

function getRiskScoreColor(score: string): string {
  if (score.startsWith('A')) return '#00C087';
  if (score.startsWith('B')) return '#C4B000';
  if (score.startsWith('C')) return '#D03030';
  return '#505a6e';
}

export function VaultCard({ vault, disableProfile = false, collapseSignal = 0 }: { vault: Vault; disableProfile?: boolean; collapseSignal?: number }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (collapseSignal > 0) setExpanded(false);
  }, [collapseSignal]);

  const toggle = () => {
    setExpanded((v) => !v);
  };

  return (
    <div className={`vault-row ${expanded ? 'expanded' : ''}`}>
      {/* Collapsed row — table-like */}
      <div className="vault-row-summary" onClick={toggle} role="button" tabIndex={0}>
        <span className="col-name">
          <span className="vault-name">{vault.name}</span>
        </span>
        <span className="col-tvl">
          <span className="row-value">{vault.tvl}</span>
          <span className="row-sub">{vault.tvlUsd}</span>
        </span>
        <span className="col-apr">
          <span className="row-value apr">{vault.apr7d}</span>
        </span>
        <span className="col-fees">
          <span className="row-value">{vault.fees}</span>
        </span>
        <span className="col-collateral">
          <span className="collateral-icons">
            {vault.collateralAssets.slice(0, 4).map((asset) => (
              <img
                key={asset}
                className="asset-icon-sm"
                src={assetIconUrls[asset]}
                alt={asset}
                title={asset}
                width={18}
                height={18}
              />
            ))}
            {vault.collateralAssets.length > 4 && (
              <span className="collateral-more">+{vault.collateralAssets.length - 4}</span>
            )}
          </span>
        </span>
        <span className="col-chain">
          {vault.chain === 'Ethereum' ? <EthereumIcon /> : <ArbitrumIcon />}
        </span>
        <span className="col-curator">
          <span className="curator-cell">
            {vault.riskCuratorIcon && (
              <img src={vault.riskCuratorIcon} alt="" width={14} height={14} className="curator-icon" />
            )}
            <span className="curator-name">{vault.riskCurator}</span>
          </span>
        </span>
        <span className="col-score">
          <span className="row-value risk-score" style={{ color: getRiskScoreColor(vault.institutionalRiskScore) }}>
            {vault.institutionalRiskScore}
          </span>
          <ChevronIcon expanded={expanded} />
        </span>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="vault-row-detail">
          <div className="detail-section">
            <div className="detail-grid">
              <div className="score-block">
                <span className="score-block-label">Strategy Score</span>
                <div className="score-block-content">
                  {vault.strategyScore && (
                    <span className="score-rating" style={{ color: getRiskScoreColor(vault.strategyScore) }}>{vault.strategyScore}</span>
                  )}
                  <span className={`allocation-badge ${vault.allocations}`}>
                    {vault.allocations === 'public' ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    Allocations
                  </span>
                </div>
              </div>
              <div className="score-block">
                <span className="score-block-label">NAV Admin Score</span>
                <div className="score-block-content">
                  {vault.navAdminScore && (
                    <span className="score-rating" style={{ color: getRiskScoreColor(vault.navAdminScore) }}>{vault.navAdminScore}</span>
                  )}
                  {vault.navAdminUrl ? (
                    <a href={vault.navAdminUrl} target="_blank" rel="noopener noreferrer" className="score-entity" onClick={(e) => e.stopPropagation()}>
                      {vault.navAdminLogo && (
                        <img src={vault.navAdminLogo} alt="" width={16} height={16} className="score-icon" />
                      )}
                      {vault.navAdmin}
                    </a>
                  ) : (
                    <span className="score-entity">{vault.navAdmin}</span>
                  )}
                  {vault.navAudit && (
                    vault.navAuditUrl ? (
                      <a href={vault.navAuditUrl} target="_blank" rel="noopener noreferrer" className="score-entity" onClick={(e) => e.stopPropagation()}>
                        <img src={vault.navAuditLogo || `https://www.google.com/s2/favicons?domain=${vault.navAudit}&sz=32`} alt="" width={16} height={16} className="score-icon" />
                        {vault.navAudit}
                      </a>
                    ) : (
                      <span className="score-entity">
                        <img src={vault.navAuditLogo || `https://www.google.com/s2/favicons?domain=${vault.navAudit}&sz=32`} alt="" width={16} height={16} className="score-icon" />
                        {vault.navAudit}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div className="score-block">
                <span className="score-block-label">Platform Score</span>
                <div className="score-block-content">
                  {vault.platformScore && (
                    <span className="score-rating" style={{ color: getRiskScoreColor(vault.platformScore) }}>{vault.platformScore}</span>
                  )}
                  <span className="score-entity">
                    {vault.platformIcons?.map((icon, i) => (
                      <img key={i} src={icon} alt="" width={16} height={16} className="score-icon" />
                    ))}
                    {vault.platformUrl ? (
                      <a href={vault.platformUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{vault.platform}</a>
                    ) : (
                      vault.platform
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="detail-actions">
              <button
                className={`view-profile-btn ${disableProfile ? 'disabled' : ''}`}
                disabled={disableProfile}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disableProfile) navigate(`/vault/${vault.id}`);
                }}
              >
                View profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
