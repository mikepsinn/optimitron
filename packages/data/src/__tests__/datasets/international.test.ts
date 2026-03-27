import { describe, it, expect } from 'vitest';
import {
  HEALTH_SYSTEM_COMPARISON,
  DRUG_POLICY_COMPARISON,
  EDUCATION_COMPARISON,
  CRIMINAL_JUSTICE_COMPARISON,
  rankCountries,
  getTopPerformers,
  getCountryComparison,
  getFullCountryComparison,
  type CountryHealthData,
  type CountryDrugPolicy,
  type CountryEducationData,
  type CountryCriminalJustice,
  type RankedCountry,
} from '../../datasets/international-comparisons';
import {
  POLICY_EXEMPLARS,
  getExemplarsByCategory,
  getExemplarsByTransferability,
  getTotalOutcomeCount,
  getExemplarCategories,
  type PolicyExemplar,
} from '../../datasets/policy-exemplars';

// ─── Valid ISO 3166-1 alpha-3 codes (superset including TWN) ─────────────────

const VALID_ISO3 = new Set([
  'AFG','ALB','DZA','ASM','AND','AGO','AIA','ATA','ATG','ARG','ARM','ABW','AUS','AUT','AZE',
  'BHS','BHR','BGD','BRB','BLR','BEL','BLZ','BEN','BMU','BTN','BOL','BES','BIH','BWA','BVT',
  'BRA','IOT','BRN','BGR','BFA','BDI','CPV','KHM','CMR','CAN','CYM','CAF','TCD','CHL','CHN',
  'CXR','CCK','COL','COM','COG','COD','COK','CRI','HRV','CUB','CUW','CYP','CZE','DNK','DJI',
  'DMA','DOM','ECU','EGY','SLV','GNQ','ERI','EST','SWZ','ETH','FLK','FRO','FJI','FIN','FRA',
  'GUF','PYF','ATF','GAB','GMB','GEO','DEU','GHA','GIB','GRC','GRL','GRD','GLP','GUM','GTM',
  'GGY','GIN','GNB','GUY','HTI','HMD','VAT','HND','HKG','HUN','ISL','IND','IDN','IRN','IRQ',
  'IRL','IMN','ISR','ITA','JAM','JPN','JEY','JOR','KAZ','KEN','KIR','PRK','KOR','KWT','KGZ',
  'LAO','LVA','LBN','LSO','LBR','LBY','LIE','LTU','LUX','MAC','MDG','MWI','MYS','MDV','MLI',
  'MLT','MHL','MTQ','MRT','MUS','MYT','MEX','FSM','MDA','MCO','MNG','MNE','MSR','MAR','MOZ',
  'MMR','NAM','NRU','NPL','NLD','NCL','NZL','NIC','NER','NGA','NIU','NFK','MKD','MNP','NOR',
  'OMN','PAK','PLW','PSE','PAN','PNG','PRY','PER','PHL','PCN','POL','PRT','PRI','QAT','REU',
  'ROU','RUS','RWA','BLM','SHN','KNA','LCA','MAF','SPM','VCT','WSM','SMR','STP','SAU','SEN',
  'SRB','SYC','SLE','SGP','SXM','SVK','SVN','SLB','SOM','ZAF','SGS','SSD','ESP','LKA','SDN',
  'SUR','SJM','SWE','CHE','SYR','TWN','TJK','TZA','THA','TLS','TGO','TKL','TON','TTO','TUN',
  'TUR','TKM','TCA','TUV','UGA','UKR','ARE','GBR','USA','UMI','URY','UZB','VUT','VEN','VNM',
  'VGB','VIR','WLF','ESH','YEM','ZMB','ZWE',
]);

// ─── Health System Comparison ────────────────────────────────────────────────

describe('Health System Comparison', () => {
  it('should have at least 20 countries', () => {
    expect(HEALTH_SYSTEM_COMPARISON.length).toBeGreaterThanOrEqual(20);
  });

  it('should have consistent structure for all entries', () => {
    HEALTH_SYSTEM_COMPARISON.forEach((c) => {
      expect(c.country).toBeTruthy();
      expect(c.iso3).toBeTruthy();
      expect(typeof c.healthSpendingPerCapita).toBe('number');
      expect(typeof c.healthSpendingPctGDP).toBe('number');
      expect(typeof c.lifeExpectancy).toBe('number');
      expect(typeof c.infantMortality).toBe('number');
      expect(typeof c.maternalMortality).toBe('number');
      expect(typeof c.uninsuredRate).toBe('number');
      expect(typeof c.outOfPocketPctTotal).toBe('number');
      expect(typeof c.physiciansPerThousand).toBe('number');
      expect(c.systemType).toBeTruthy();
      expect(typeof c.universalCoverage).toBe('boolean');
      expect(c.source).toBeTruthy();
    });
  });

  it('should have valid ISO3 codes', () => {
    HEALTH_SYSTEM_COMPARISON.forEach((c) => {
      expect(VALID_ISO3.has(c.iso3)).toBe(true);
    });
  });

  it('should have life expectancy in a reasonable range (40-90 years)', () => {
    HEALTH_SYSTEM_COMPARISON.forEach((c) => {
      expect(c.lifeExpectancy).toBeGreaterThan(40);
      expect(c.lifeExpectancy).toBeLessThan(90);
    });
  });

  it('should have positive spending values', () => {
    HEALTH_SYSTEM_COMPARISON.forEach((c) => {
      expect(c.healthSpendingPerCapita).toBeGreaterThan(0);
      expect(c.healthSpendingPctGDP).toBeGreaterThan(0);
    });
  });

  it('should have infant mortality in reasonable range (0-50 per 1000)', () => {
    HEALTH_SYSTEM_COMPARISON.forEach((c) => {
      expect(c.infantMortality).toBeGreaterThanOrEqual(0);
      expect(c.infantMortality).toBeLessThan(50);
    });
  });

  it('should include all specified countries', () => {
    const names = HEALTH_SYSTEM_COMPARISON.map((c) => c.country);
    expect(names).toContain('Singapore');
    expect(names).toContain('Japan');
    expect(names).toContain('United States');
    expect(names).toContain('India');
    expect(names).toContain('Costa Rica');
    expect(names).toContain('Taiwan');
  });

  it('should encode the Singapore vs US insight', () => {
    const sg = HEALTH_SYSTEM_COMPARISON.find((c) => c.iso3 === 'SGP')!;
    const us = HEALTH_SYSTEM_COMPARISON.find((c) => c.iso3 === 'USA')!;
    // Singapore spends much less but has higher life expectancy
    expect(sg.healthSpendingPerCapita).toBeLessThan(us.healthSpendingPerCapita * 0.5);
    expect(sg.lifeExpectancy).toBeGreaterThan(us.lifeExpectancy);
  });

  it('should have valid system types', () => {
    const validTypes = ['single-payer', 'multi-payer', 'beveridge', 'bismarck', 'private', 'mixed'];
    HEALTH_SYSTEM_COMPARISON.forEach((c) => {
      expect(validTypes).toContain(c.systemType);
    });
  });

  it('should have out-of-pocket rates between 0 and 100', () => {
    HEALTH_SYSTEM_COMPARISON.forEach((c) => {
      expect(c.outOfPocketPctTotal).toBeGreaterThanOrEqual(0);
      expect(c.outOfPocketPctTotal).toBeLessThanOrEqual(100);
    });
  });
});

// ─── Drug Policy Comparison ──────────────────────────────────────────────────

describe('Drug Policy Comparison', () => {
  it('should have at least 15 countries', () => {
    expect(DRUG_POLICY_COMPARISON.length).toBeGreaterThanOrEqual(15);
  });

  it('should have consistent structure for all entries', () => {
    DRUG_POLICY_COMPARISON.forEach((c) => {
      expect(c.country).toBeTruthy();
      expect(c.iso3).toBeTruthy();
      expect(c.approach).toBeTruthy();
      expect(c.policyDescription).toBeTruthy();
      expect(typeof c.drugDeathsPer100K).toBe('number');
      expect(typeof c.incarcerationRatePer100K).toBe('number');
      expect(typeof c.hivRateAmongPWID).toBe('number');
      expect(typeof c.treatmentAccessRate).toBe('number');
      expect(c.outcomes.length).toBeGreaterThan(0);
      expect(c.source).toBeTruthy();
    });
  });

  it('should have valid ISO3 codes', () => {
    DRUG_POLICY_COMPARISON.forEach((c) => {
      expect(VALID_ISO3.has(c.iso3)).toBe(true);
    });
  });

  it('should include Portugal with decriminalization approach', () => {
    const pt = DRUG_POLICY_COMPARISON.find((c) => c.iso3 === 'PRT')!;
    expect(pt).toBeDefined();
    expect(pt.approach).toBe('decriminalization');
    expect(pt.yearImplemented).toBe(2001);
  });

  it('should have valid drug policy approaches', () => {
    const validApproaches = ['decriminalization', 'legalization', 'harm-reduction', 'prohibitionist', 'mixed'];
    DRUG_POLICY_COMPARISON.forEach((c) => {
      expect(validApproaches).toContain(c.approach);
    });
  });

  it('should have non-negative drug death rates', () => {
    DRUG_POLICY_COMPARISON.forEach((c) => {
      expect(c.drugDeathsPer100K).toBeGreaterThanOrEqual(0);
    });
  });
});

// ─── Education Comparison ────────────────────────────────────────────────────

describe('Education Comparison', () => {
  it('should have at least 20 countries', () => {
    expect(EDUCATION_COMPARISON.length).toBeGreaterThanOrEqual(20);
  });

  it('should have consistent structure for all entries', () => {
    EDUCATION_COMPARISON.forEach((c) => {
      expect(c.country).toBeTruthy();
      expect(c.iso3).toBeTruthy();
      expect(typeof c.educationSpendingPctGDP).toBe('number');
      expect(typeof c.pisaScoreMath).toBe('number');
      expect(typeof c.pisaScoreReading).toBe('number');
      expect(typeof c.pisaScoreScience).toBe('number');
      expect(typeof c.tertiaryEnrollmentRate).toBe('number');
      expect(typeof c.teacherSalaryRelativeToGDP).toBe('number');
      expect(typeof c.studentTeacherRatio).toBe('number');
      expect(typeof c.universalPreK).toBe('boolean');
      expect(c.source).toBeTruthy();
    });
  });

  it('should have valid ISO3 codes', () => {
    EDUCATION_COMPARISON.forEach((c) => {
      expect(VALID_ISO3.has(c.iso3)).toBe(true);
    });
  });

  it('should have PISA scores in a reasonable range (300-650)', () => {
    EDUCATION_COMPARISON.forEach((c) => {
      expect(c.pisaScoreMath).toBeGreaterThan(300);
      expect(c.pisaScoreMath).toBeLessThan(650);
      expect(c.pisaScoreReading).toBeGreaterThan(300);
      expect(c.pisaScoreReading).toBeLessThan(650);
      expect(c.pisaScoreScience).toBeGreaterThan(300);
      expect(c.pisaScoreScience).toBeLessThan(650);
    });
  });

  it('should have positive education spending', () => {
    EDUCATION_COMPARISON.forEach((c) => {
      expect(c.educationSpendingPctGDP).toBeGreaterThan(0);
    });
  });

  it('should include Singapore as a top math performer', () => {
    const sg = EDUCATION_COMPARISON.find((c) => c.iso3 === 'SGP')!;
    expect(sg).toBeDefined();
    const maxMath = Math.max(...EDUCATION_COMPARISON.map((c) => c.pisaScoreMath));
    expect(sg.pisaScoreMath).toBe(maxMath);
  });
});

// ─── Criminal Justice Comparison ─────────────────────────────────────────────

describe('Criminal Justice Comparison', () => {
  it('should have at least 15 countries', () => {
    expect(CRIMINAL_JUSTICE_COMPARISON.length).toBeGreaterThanOrEqual(15);
  });

  it('should have consistent structure for all entries', () => {
    CRIMINAL_JUSTICE_COMPARISON.forEach((c) => {
      expect(c.country).toBeTruthy();
      expect(c.iso3).toBeTruthy();
      expect(typeof c.incarcerationRatePer100K).toBe('number');
      expect(typeof c.homicideRatePer100K).toBe('number');
      expect(typeof c.recidivismRate).toBe('number');
      expect(typeof c.policePerCapita).toBe('number');
      expect(typeof c.justiceSpendingPctGDP).toBe('number');
      expect(c.approach).toBeTruthy();
      expect(c.source).toBeTruthy();
    });
  });

  it('should have valid ISO3 codes', () => {
    CRIMINAL_JUSTICE_COMPARISON.forEach((c) => {
      expect(VALID_ISO3.has(c.iso3)).toBe(true);
    });
  });

  it('should encode the Norway vs US recidivism insight', () => {
    const no = CRIMINAL_JUSTICE_COMPARISON.find((c) => c.iso3 === 'NOR')!;
    const us = CRIMINAL_JUSTICE_COMPARISON.find((c) => c.iso3 === 'USA')!;
    expect(no.recidivismRate).toBe(20);
    expect(us.recidivismRate).toBe(76);
    expect(no.recidivismRate).toBeLessThan(us.recidivismRate * 0.5);
  });

  it('should have the US as the highest incarceration rate in the dataset', () => {
    const us = CRIMINAL_JUSTICE_COMPARISON.find((c) => c.iso3 === 'USA')!;
    const max = Math.max(...CRIMINAL_JUSTICE_COMPARISON.map((c) => c.incarcerationRatePer100K));
    expect(us.incarcerationRatePer100K).toBe(max);
  });

  it('should have positive incarceration rates', () => {
    CRIMINAL_JUSTICE_COMPARISON.forEach((c) => {
      expect(c.incarcerationRatePer100K).toBeGreaterThan(0);
    });
  });
});

// ─── Utility Functions ───────────────────────────────────────────────────────

describe('Utility Functions', () => {
  it('rankCountries should rank by life expectancy ascending', () => {
    const ranked = rankCountries(HEALTH_SYSTEM_COMPARISON, 'lifeExpectancy', true);
    expect(ranked.length).toBe(HEALTH_SYSTEM_COMPARISON.length);
    expect(ranked[0].rank).toBe(1);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].value).toBeGreaterThanOrEqual(ranked[i - 1].value);
    }
  });

  it('rankCountries should rank descending when specified', () => {
    const ranked = rankCountries(HEALTH_SYSTEM_COMPARISON, 'lifeExpectancy', false);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].value).toBeLessThanOrEqual(ranked[i - 1].value);
    }
  });

  it('getTopPerformers should return the correct number of results', () => {
    const top5 = getTopPerformers(HEALTH_SYSTEM_COMPARISON, 'infantMortality', 5, true);
    expect(top5.length).toBe(5);
    // Ascending = lowest infant mortality first (best performers)
    top5.forEach((c) => {
      expect(c.value).toBeLessThan(5); // top 5 should all be low
    });
  });

  it('getCountryComparison should return differences for two countries', () => {
    const result = getCountryComparison('Singapore', 'United States', HEALTH_SYSTEM_COMPARISON, 'health');
    expect(result).not.toBeNull();
    expect(result!.dataset).toBe('health');
    expect(result!.differences['healthSpendingPerCapita']).toBeLessThan(0); // SG spends less
    expect(result!.differences['lifeExpectancy']).toBeGreaterThan(0); // SG lives longer
  });

  it('getCountryComparison should return null for unknown country', () => {
    const result = getCountryComparison('Atlantis', 'United States', HEALTH_SYSTEM_COMPARISON, 'health');
    expect(result).toBeNull();
  });

  it('getCountryComparison should work with ISO3 codes', () => {
    const result = getCountryComparison('SGP', 'USA', HEALTH_SYSTEM_COMPARISON, 'health');
    expect(result).not.toBeNull();
  });

  it('getFullCountryComparison should return results for all four datasets', () => {
    const result = getFullCountryComparison('Norway', 'United States');
    expect(result.health).not.toBeNull();
    expect(result.drugPolicy).not.toBeNull();
    // Education: Norway is in education dataset
    expect(result.education).not.toBeNull();
    expect(result.criminalJustice).not.toBeNull();
  });
});

// ─── Policy Exemplars ────────────────────────────────────────────────────────

describe('Policy Exemplars', () => {
  it('should have at least 15 exemplars', () => {
    expect(POLICY_EXEMPLARS.length).toBeGreaterThanOrEqual(15);
  });

  it('should have consistent structure for all exemplars', () => {
    POLICY_EXEMPLARS.forEach((p) => {
      expect(p.name).toBeTruthy();
      expect(p.originCountry).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(typeof p.yearImplemented).toBe('number');
      expect(p.outcomes.length).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(p.estimatedTransferability);
      expect(p.adaptationNotes).toBeTruthy();
      expect(p.sources.length).toBeGreaterThan(0);
    });
  });

  it('should have outcomes with before/after values', () => {
    POLICY_EXEMPLARS.forEach((p) => {
      p.outcomes.forEach((o) => {
        expect(o.metric).toBeTruthy();
        expect(typeof o.beforeValue).toBe('number');
        expect(typeof o.afterValue).toBe('number');
        expect(typeof o.changePercent).toBe('number');
      });
    });
  });

  it('should include key exemplars from the specification', () => {
    const names = POLICY_EXEMPLARS.map((p) => p.name.toLowerCase());
    expect(names.some((n) => n.includes('singapore') && n.includes('health'))).toBe(true);
    expect(names.some((n) => n.includes('portugal'))).toBe(true);
    expect(names.some((n) => n.includes('finland') && n.includes('education'))).toBe(true);
    expect(names.some((n) => n.includes('norway') && n.includes('prison'))).toBe(true);
    expect(names.some((n) => n.includes('estonia'))).toBe(true);
    expect(names.some((n) => n.includes('australia') && n.includes('gun'))).toBe(true);
  });

  it('getExemplarsByCategory should find health exemplars', () => {
    const health = getExemplarsByCategory('Health');
    expect(health.length).toBeGreaterThanOrEqual(3);
  });

  it('getExemplarsByTransferability should filter correctly', () => {
    const high = getExemplarsByTransferability('high');
    expect(high.length).toBeGreaterThan(0);
    high.forEach((p) => {
      expect(p.estimatedTransferability).toBe('high');
    });
  });

  it('getTotalOutcomeCount should return a positive number', () => {
    const count = getTotalOutcomeCount();
    expect(count).toBeGreaterThan(40); // 15+ exemplars × ~4 outcomes each
  });

  it('getExemplarCategories should return unique categories', () => {
    const categories = getExemplarCategories();
    expect(categories.length).toBeGreaterThanOrEqual(4);
    // Should have no duplicates
    expect(new Set(categories).size).toBe(categories.length);
  });

  it('should have year implemented in a reasonable range', () => {
    POLICY_EXEMPLARS.forEach((p) => {
      expect(p.yearImplemented).toBeGreaterThanOrEqual(1940);
      expect(p.yearImplemented).toBeLessThanOrEqual(2025);
    });
  });

  it('should have at least one source per exemplar', () => {
    POLICY_EXEMPLARS.forEach((p) => {
      expect(p.sources.length).toBeGreaterThanOrEqual(1);
      p.sources.forEach((s) => {
        expect(s.length).toBeGreaterThan(10);
      });
    });
  });
});
