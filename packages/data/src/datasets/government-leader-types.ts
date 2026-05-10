/** Public DTO - one per head of government. No campaign-specific fields. */
export interface GovernmentLeaderRecord {
  contactEmail: string | null;
  contactLabel: string | null;
  contactUrl: string | null;
  /** ISO 3166-1 alpha-2 */
  countryCode: string;
  /** ISO 3166-1 alpha-3 */
  countryIso3: string;
  /** Human-readable, canonical country name */
  countryName: string;
  decisionMakerLabel: string;
  governmentName: string;
  governmentWebsite: string | null;
  leaderImageUrl: string | null;
  leaderName: string | null;
  leaderSourceRef: string | null;
  /** Annual military expenditure in absolute USD */
  militaryBudgetUsd: number;
  /**
   * Annual total general-government expenditure (IMF Fiscal Monitor, all
   * levels). Includes transfers, subsidies, debt service.
   */
  governmentBudgetUsd: number;
  officialSourceUrl: string | null;
  roleTitle: string;
  sortOrder: number;
}
