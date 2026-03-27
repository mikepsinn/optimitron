import type { FetchOptions } from '../types';

export type MedianIncomeConcept =
  | 'median_income'
  | 'after_tax_median_disposable_income';

export type MedianIncomePriceBasis = 'nominal' | 'real';

export type MedianIncomePurchasingPower = 'national_currency' | 'ppp';

export type MedianIncomeDerivation = 'direct' | 'derived';

export type MedianIncomeSource =
  | 'OECD IDD'
  | 'Eurostat EU-SILC'
  | 'World Bank PIP';

export type MedianIncomeTaxScope =
  | 'after_direct_taxes_and_cash_transfers'
  | 'unknown';

export type MedianIncomeTreatment = 'included' | 'excluded' | 'unknown';

export interface MedianIncomeSeriesRecord {
  jurisdictionIso3: string;
  jurisdictionName: string;
  year: number;
  value: number;
  unit: string;
  concept: MedianIncomeConcept;
  priceBasis: MedianIncomePriceBasis;
  purchasingPower: MedianIncomePurchasingPower;
  source: MedianIncomeSource;
  derivation: MedianIncomeDerivation;
  isAfterTax: boolean;
  taxScope: MedianIncomeTaxScope;
  consumptionTaxTreatment?: MedianIncomeTreatment;
  inKindTransferTreatment?: MedianIncomeTreatment;
  priceIndexNote?: string;
  pppBasisNote?: string;
  welfareType?: 'income' | 'consumption';
  methodology?: string;
  definition?: string;
  isInterpolated?: boolean;
  surveyYear?: number;
  surveyAcronym?: string;
  estimateType?: string;
  estimationType?: string;
  distributionType?: string;
  surveyCoverage?: string;
  surveyComparability?: string;
  comparableSpell?: string;
  sourceUrl: string;
}

export interface MedianIncomeSeriesMetadata {
  generatedAt: string;
  recordCount: number;
  sources: MedianIncomeSource[];
  caveats: string[];
}

export interface MedianIncomeSeriesQuery
  extends Pick<FetchOptions, 'jurisdictions' | 'period'> {
  source?: MedianIncomeSource;
  concept?: MedianIncomeConcept;
  priceBasis?: MedianIncomePriceBasis;
  purchasingPower?: MedianIncomePurchasingPower;
  isAfterTax?: boolean;
  taxScope?: MedianIncomeTaxScope;
  excludeInterpolated?: boolean;
  strictAfterTaxOnly?: boolean;
}
