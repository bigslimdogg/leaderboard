import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="10" width="3" height="7" rx="0.5" />
    <rect x="8.5" y="5" width="3" height="12" rx="0.5" />
    <rect x="14" y="3" width="3" height="14" rx="0.5" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2L3 5.5V9.5C3 13.6 5.8 17.4 10 18.5C14.2 17.4 17 13.6 17 9.5V5.5L10 2Z" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8.5" cy="8.5" r="5.5" />
    <path d="M12.5 12.5L17 17" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="16" height="10" rx="1.5" />
    <path d="M7 7V5C7 3.9 7.9 3 9 3H11C12.1 3 13 3.9 13 5V7" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="12" height="14" rx="1.5" />
    <path d="M7 2.5H13" />
    <path d="M8 2C8 1.4 8.4 1 9 1H11C11.6 1 12 1.4 12 2V3.5C12 4.1 11.6 4.5 11 4.5H9C8.4 4.5 8 4.1 8 3.5V2Z" />
    <path d="M7 9H13" />
    <path d="M7 12H11" />
  </svg>
);

const CodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6L2 10L6 14" />
    <path d="M14 6L18 10L14 14" />
    <path d="M11 4L9 16" />
  </svg>
);

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isVaultProfile = location.pathname.startsWith('/vault/');
  const isLeaderboard = location.pathname === '/';
  const isRevenue = location.pathname === '/revenue';

  const mainItems = [
    { id: 'leaderboard', label: 'Vaults Leaderboard', icon: <BarChartIcon />, active: isLeaderboard, onClick: () => navigate('/') },
    { id: 'vault-risk', label: 'Vault Risk Profile', icon: <ShieldIcon />, active: isVaultProfile || location.pathname === '/vault', onClick: () => navigate('/vault') },
    { id: 'revenue', label: 'Revenue Reconciliation', icon: <ClipboardIcon />, active: isRevenue, onClick: () => navigate('/revenue') },
    { id: 'pools', label: 'Pools Discovery', icon: <SearchIcon />, active: false, disabled: true },
  ];

  const bottomItems = [
    { id: 'portfolio', label: 'Portfolio', icon: <BriefcaseIcon />, active: false, highlight: true, onClick: () => window.open('https://app.lambda.p2p.org', '_blank') },
    { id: 'data-api', label: 'Data API', icon: <CodeIcon />, active: false, highlight: true, onClick: () => window.open('https://p2p-lambda.readme.io/v2.1-beta/reference/get_strategy_description', '_blank') },
  ];

  const renderItem = (item: typeof mainItems[0] & { highlight?: boolean }) => (
    <button
      key={item.id}
      className={`nav-item ${item.active ? 'active' : ''} ${item.highlight ? 'highlight' : ''}`}
      disabled={item.disabled}
      onClick={item.onClick}
    >
      <span className="nav-icon">{item.icon}</span>
      <span className="nav-label">{item.label}</span>
      {item.disabled && <span className="nav-soon">Soon</span>}
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="brand-block">
          <div className="brand-top">
            <svg className="vaulter-v" width="32" height="28" viewBox="0 0 32 28" fill="none">
              <path d="M2 3L16 25L30 3" stroke="url(#vGrad1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 3L16 21L26 3" stroke="url(#vGrad1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="vGrad1" x1="2" y1="3" x2="30" y2="25">
                  <stop offset="0%" stopColor="#7191FF" />
                  <stop offset="100%" stopColor="#1347FF" />
                </linearGradient>
              </defs>
            </svg>
            <span className="brand-name">Vaulter.ai</span>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {mainItems.map(renderItem)}
      </nav>
      <div className="sidebar-bottom">
        {bottomItems.map(renderItem)}
      </div>
      <div className="sidebar-footer">
        <img src="https://cdn.prod.website-files.com/661ce38fc2cbb4e39a655100/66fd12a53afee8c586f8d81c_p2p%20logo.svg" alt="P2P.org" height={14} className="footer-logo" />
        <span className="powered-by">Ratings by P2P.org</span>
      </div>
    </aside>
  );
}
