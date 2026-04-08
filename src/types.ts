export type StrategyTag = 'DeFi' | 'DeFi+CeFi' | 'RWA';
export type RiskCategory = 'A' | 'B' | 'C';
export type AllocationVisibility = 'public' | 'private';

export interface Vault {
  id: string;
  name: string;
  strategyTags: StrategyTag[];
  tvl: string;
  tvlUsd: string;
  apr7d: string;
  collateralAssets: string[];
  chain: string;
  platform: string;
  platformIcons?: string[];
  platformUrl?: string;
  riskCurator: string;
  riskCuratorIcon?: string;
  riskCuratorUrl?: string;
  navAdmin: string;
  navAudit: string | null;
  navAuditUrl?: string;
  navAuditLogo?: string;
  navAdminUrl?: string;
  navAdminLogo?: string;
  fees: string;
  strategyScore?: string;
  navAdminScore?: string;
  platformScore?: string;
  institutionalRiskScore: string;
  allocations: AllocationVisibility;
  usersScore: string;
  category: RiskCategory;
}
