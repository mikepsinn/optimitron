import { describe, it, expect } from 'vitest';
import {
  PolicyTypeSchema,
  RecommendationTypeSchema,
  EvidenceGradeSchema,
  BlockingFactorSchema,
  PolicySchema,
  JurisdictionPolicySchema,
  PolicyRecommendationSchema,
  type PolicyType,
  type RecommendationType,
  type EvidenceGrade,
  type BlockingFactor,
  type Policy,
  type JurisdictionPolicy,
  type PolicyRecommendation,
} from '../policy.js';

// ─── PolicyTypeSchema ───────────────────────────────────────────────────────

describe('PolicyTypeSchema', () => {
  const validTypes: PolicyType[] = [
    'law', 'regulation', 'tax_policy', 'budget_allocation',
    'executive_order', 'court_ruling', 'treaty', 'local_ordinance',
  ];

  it('accepts all 8 valid policy types', () => {
    for (const type of validTypes) {
      expect(PolicyTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it('rejects invalid policy type', () => {
    expect(PolicyTypeSchema.safeParse('unknown').success).toBe(false);
    expect(PolicyTypeSchema.safeParse('').success).toBe(false);
    expect(PolicyTypeSchema.safeParse(42).success).toBe(false);
  });

  it('has exactly 8 types matching the paper', () => {
    expect(validTypes).toHaveLength(8);
  });
});

// ─── RecommendationTypeSchema ───────────────────────────────────────────────

describe('RecommendationTypeSchema', () => {
  const validTypes: RecommendationType[] = ['enact', 'replace', 'repeal', 'maintain'];

  it('accepts all 4 recommendation types', () => {
    for (const type of validTypes) {
      expect(RecommendationTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it('rejects invalid recommendation type', () => {
    expect(RecommendationTypeSchema.safeParse('adopt').success).toBe(false);
    expect(RecommendationTypeSchema.safeParse('').success).toBe(false);
  });

  it('has exactly 4 types: enact, replace, repeal, maintain', () => {
    expect(validTypes).toHaveLength(4);
  });
});

// ─── EvidenceGradeSchema ────────────────────────────────────────────────────

describe('EvidenceGradeSchema', () => {
  const validGrades: EvidenceGrade[] = ['A', 'B', 'C', 'D', 'F'];

  it('accepts all 5 evidence grades', () => {
    for (const grade of validGrades) {
      expect(EvidenceGradeSchema.safeParse(grade).success).toBe(true);
    }
  });

  it('rejects lowercase grades', () => {
    expect(EvidenceGradeSchema.safeParse('a').success).toBe(false);
    expect(EvidenceGradeSchema.safeParse('b').success).toBe(false);
  });

  it('rejects non-existent grades', () => {
    expect(EvidenceGradeSchema.safeParse('E').success).toBe(false);
    expect(EvidenceGradeSchema.safeParse('').success).toBe(false);
  });
});

// ─── BlockingFactorSchema ───────────────────────────────────────────────────

describe('BlockingFactorSchema', () => {
  const validFactors: BlockingFactor[] = [
    'constitutional', 'federal_preemption', 'political',
    'autonomy', 'implementation_capacity', 'budget_constraint',
  ];

  it('accepts all 6 blocking factors', () => {
    for (const factor of validFactors) {
      expect(BlockingFactorSchema.safeParse(factor).success).toBe(true);
    }
  });

  it('rejects invalid blocking factor', () => {
    expect(BlockingFactorSchema.safeParse('legal').success).toBe(false);
    expect(BlockingFactorSchema.safeParse('').success).toBe(false);
  });
});

// ─── PolicySchema ───────────────────────────────────────────────────────────

describe('PolicySchema', () => {
  it('validates a minimal policy', () => {
    const result = PolicySchema.safeParse({
      id: 'tobacco-tax',
      name: 'Tobacco Excise Tax',
      type: 'tax_policy',
    });
    expect(result.success).toBe(true);
  });

  it('validates a full policy with all optional fields', () => {
    const result = PolicySchema.safeParse({
      id: 'seat-belt-primary',
      name: 'Primary Seat Belt Enforcement',
      type: 'law',
      categoryId: 'traffic-safety',
      description: 'Allows police to stop vehicles for seatbelt violations',
      isContinuous: false,
      typicalOnsetDelayDays: 30,
      typicalDurationYears: 99,
    });
    expect(result.success).toBe(true);
  });

  it('defaults isContinuous to false', () => {
    const result = PolicySchema.parse({
      id: 'test',
      name: 'Test',
      type: 'law',
    });
    expect(result.isContinuous).toBe(false);
  });

  it('allows continuous policies (e.g., tax rates)', () => {
    const result = PolicySchema.parse({
      id: 'tobacco-tax',
      name: 'Tobacco Tax',
      type: 'tax_policy',
      isContinuous: true,
    });
    expect(result.isContinuous).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(PolicySchema.safeParse({ id: 'x' }).success).toBe(false);
    expect(PolicySchema.safeParse({ name: 'x' }).success).toBe(false);
    expect(PolicySchema.safeParse({}).success).toBe(false);
  });

  it('rejects invalid policy type', () => {
    expect(PolicySchema.safeParse({
      id: 'x',
      name: 'x',
      type: 'invalid',
    }).success).toBe(false);
  });
});

// ─── JurisdictionPolicySchema ───────────────────────────────────────────────

describe('JurisdictionPolicySchema', () => {
  it('validates a jurisdiction having a policy', () => {
    const result = JurisdictionPolicySchema.safeParse({
      jurisdictionId: 'TX',
      policyId: 'tobacco-tax',
      hasPolicy: true,
      policyStrength: 1.41,
    });
    expect(result.success).toBe(true);
  });

  it('validates a jurisdiction lacking a policy', () => {
    const result = JurisdictionPolicySchema.safeParse({
      jurisdictionId: 'TX',
      policyId: 'primary-seatbelt',
      hasPolicy: false,
    });
    expect(result.success).toBe(true);
  });

  it('validates with all optional fields', () => {
    const result = JurisdictionPolicySchema.safeParse({
      jurisdictionId: 'TX',
      policyId: 'tobacco-tax',
      hasPolicy: true,
      policyStrength: 1.41,
      implementationDate: '2009-01-01',
      dataSource: 'Texas Tax Code §154.021',
      lastVerified: '2024-06-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing jurisdictionId', () => {
    expect(JurisdictionPolicySchema.safeParse({
      policyId: 'x',
      hasPolicy: true,
    }).success).toBe(false);
  });

  it('rejects missing policyId', () => {
    expect(JurisdictionPolicySchema.safeParse({
      jurisdictionId: 'TX',
      hasPolicy: true,
    }).success).toBe(false);
  });

  it('rejects missing hasPolicy', () => {
    expect(JurisdictionPolicySchema.safeParse({
      jurisdictionId: 'TX',
      policyId: 'x',
    }).success).toBe(false);
  });
});

// ─── PolicyRecommendationSchema ─────────────────────────────────────────────

describe('PolicyRecommendationSchema', () => {
  const validRecommendation = {
    jurisdictionId: 'TX',
    policyId: 'primary-seatbelt',
    recommendationType: 'enact' as const,
    welfareEffect: {
      incomeEffect: 0.02,
      incomeEffectCILow: 0.01,
      incomeEffectCIHigh: 0.03,
      healthEffect: 0.15,
      healthEffectCILow: 0.10,
      healthEffectCIHigh: 0.20,
    },
    evidenceGrade: 'A' as const,
    policyImpactScore: 0.81,
    priorityScore: 0.75,
  };

  it('validates a complete recommendation', () => {
    const result = PolicyRecommendationSchema.safeParse(validRecommendation);
    expect(result.success).toBe(true);
  });

  it('validates recommendation with optional fields', () => {
    const result = PolicyRecommendationSchema.safeParse({
      ...validRecommendation,
      currentStatus: 'secondary enforcement only',
      recommendedTarget: 'primary enforcement',
      blockingFactors: ['political', 'autonomy'],
      similarJurisdictions: ['FL', 'CA'],
      rationale: 'Strong evidence from 8 similar states',
    });
    expect(result.success).toBe(true);
  });

  // Paper worked example: Texas tobacco tax
  it('validates Texas tobacco tax REPLACE recommendation', () => {
    const result = PolicyRecommendationSchema.safeParse({
      jurisdictionId: 'TX',
      policyId: 'tobacco-tax',
      recommendationType: 'replace',
      currentStatus: '$1.41/pack',
      recommendedTarget: '$2.50/pack',
      welfareEffect: {
        incomeEffect: -0.02,
        incomeEffectCILow: -0.04,
        incomeEffectCIHigh: 0.01,
        healthEffect: 0.25,
        healthEffectCILow: 0.18,
        healthEffectCIHigh: 0.32,
      },
      evidenceGrade: 'A',
      policyImpactScore: 0.85,
      priorityScore: 0.80,
      blockingFactors: ['political'],
      rationale: 'Below-median tobacco tax with strong evidence for increase',
    });
    expect(result.success).toBe(true);
  });

  // Paper example: Texas primary seat belt
  it('validates Texas seat belt ENACT recommendation', () => {
    const result = PolicyRecommendationSchema.safeParse({
      jurisdictionId: 'TX',
      policyId: 'primary-seatbelt',
      recommendationType: 'enact',
      welfareEffect: {
        incomeEffect: 0.02,
        incomeEffectCILow: 0.01,
        incomeEffectCIHigh: 0.03,
        healthEffect: 0.15,
        healthEffectCILow: 0.10,
        healthEffectCIHigh: 0.20,
      },
      evidenceGrade: 'A',
      policyImpactScore: 0.81,
      priorityScore: 0.75,
      similarJurisdictions: ['FL'],
    });
    expect(result.success).toBe(true);
  });

  it('validates MAINTAIN recommendation', () => {
    const result = PolicyRecommendationSchema.safeParse({
      jurisdictionId: 'TX',
      policyId: 'dui-threshold',
      recommendationType: 'maintain',
      currentStatus: '0.08 BAC',
      welfareEffect: {
        incomeEffect: 0,
        healthEffect: 0,
      },
      evidenceGrade: 'A',
      policyImpactScore: 0.90,
      priorityScore: 0,
    });
    expect(result.success).toBe(true);
  });

  it('validates REPEAL recommendation', () => {
    const result = PolicyRecommendationSchema.safeParse({
      jurisdictionId: 'XX',
      policyId: 'harmful-policy',
      recommendationType: 'repeal',
      welfareEffect: {
        incomeEffect: 0.10,
        healthEffect: 0.05,
      },
      evidenceGrade: 'B',
      policyImpactScore: 0.65,
      priorityScore: 0.50,
    });
    expect(result.success).toBe(true);
  });

  it('rejects policyImpactScore > 1', () => {
    expect(PolicyRecommendationSchema.safeParse({
      ...validRecommendation,
      policyImpactScore: 1.5,
    }).success).toBe(false);
  });

  it('rejects policyImpactScore < 0', () => {
    expect(PolicyRecommendationSchema.safeParse({
      ...validRecommendation,
      policyImpactScore: -0.1,
    }).success).toBe(false);
  });

  it('rejects invalid evidence grade', () => {
    expect(PolicyRecommendationSchema.safeParse({
      ...validRecommendation,
      evidenceGrade: 'E',
    }).success).toBe(false);
  });

  it('rejects invalid recommendation type', () => {
    expect(PolicyRecommendationSchema.safeParse({
      ...validRecommendation,
      recommendationType: 'adopt',
    }).success).toBe(false);
  });

  it('rejects missing welfare effect', () => {
    const { welfareEffect, ...rest } = validRecommendation;
    expect(PolicyRecommendationSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects invalid blocking factors', () => {
    expect(PolicyRecommendationSchema.safeParse({
      ...validRecommendation,
      blockingFactors: ['invalid_factor'],
    }).success).toBe(false);
  });
});
