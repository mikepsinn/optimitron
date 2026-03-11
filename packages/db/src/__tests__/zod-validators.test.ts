import { describe, it, expect } from 'vitest';
import {
  // Enums
  CombinationOperationSchema,
  FillingTypeSchema,
  ValenceSchema,
  MeasurementScaleSchema,
  UnitCodeSystemSchema,
  AnalysisStatusSchema,
  StrengthLevelSchema,
  ConfidenceLevelSchema,
  RelationshipDirectionSchema,
  EvidenceGradeSchema,
  NotificationStatusSchema,
  PersonhoodProviderSchema,
  PersonhoodVerificationStatusSchema,
  JurisdictionTypeSchema,
  SubjectTypeSchema,
  VoteAnswerSchema,
  // Models
  AccountSchema,
  PersonhoodVerificationSchema,
  UserSchema,
  SessionSchema,
  UnitSchema,
  VariableCategorySchema,
  VerificationTokenSchema,
  GlobalVariableSchema,
  SubjectSchema,
  NOf1VariableSchema,
  MeasurementSchema,
  TrackingReminderSchema,
  TrackingReminderNotificationSchema,
  NOf1VariableRelationshipSchema,
  AggregateVariableRelationshipSchema,
  JurisdictionSchema,
  PoliticianSchema,
  PoliticianVoteSchema,
  AlignmentScoreSchema,
  PairwiseComparisonSchema,
  PreferenceWeightSchema,
  ItemSchema,
  ParticipantSchema,
  VoteSchema,
  WishocraticAllocationSchema,
  WishocraticCategorySelectionSchema,
  AggregationRunSchema,
  IntegrationProviderSchema,
  IntegrationConnectionSchema,
  IntegrationSyncLogSchema,
} from '../zod/index.js';

// ============================================================================
// Test helpers — valid data fixtures
// ============================================================================

const now = new Date();

const validMeasurement = {
  id: 'clx1234567890',
  userId: 'user_abc',
  nOf1VariableId: 'uvar_abc',
  globalVariableId: 'gvar_abc',
  startTime: now,
  value: 200,
  unitId: 'unit_mg',
  originalValue: 200,
  originalUnitId: 'unit_mg',
  duration: null,
  note: 'Took with food',
  sourceName: 'manual',
  integrationConnectionId: null,
  latitude: null,
  longitude: null,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

const validUnit = {
  id: 'unit_mg',
  name: 'Milligrams',
  abbreviatedName: 'mg',
  codeSystem: 'UCUM' as const,
  ucumCode: 'mg',
  unitCategoryId: 'weight',
  minimumValue: 0,
  maximumValue: null,
  fillingType: 'NONE' as const,
  scale: 'RATIO' as const,
  conversionSteps: null,
  advanced: false,
  manualTracking: true,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

const validJurisdiction = {
  id: 'jur_us',
  name: 'United States',
  type: 'COUNTRY' as const,
  parentJurisdictionId: null,
  code: 'US',
  currency: 'USD',
  population: 330000000,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

const validSubject = {
  id: 'subject_1',
  subjectType: 'USER' as const,
  externalId: 'user_abc',
  displayName: 'Primary User',
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

const validNOf1VariableRelationship = {
  id: 'uvr_1',
  subjectId: 'entity_1',
  predictorGlobalVariableId: 'gv_pred',
  outcomeGlobalVariableId: 'gv_out',
  forwardPearsonCorrelation: 0.65,
  reversePearsonCorrelation: 0.12,
  numberOfPairs: 100,
  onsetDelay: 3600,
  durationOfAction: 86400,
  analyzedAt: now,
  createdAt: now,
  updatedAt: now,
};

// ============================================================================
// ENUM TESTS
// ============================================================================

describe('Enum schemas', () => {
  it('1. CombinationOperation — accepts valid values', () => {
    expect(CombinationOperationSchema.parse('SUM')).toBe('SUM');
    expect(CombinationOperationSchema.parse('MEAN')).toBe('MEAN');
  });

  it('2. CombinationOperation — rejects invalid value', () => {
    const result = CombinationOperationSchema.safeParse('AVERAGE');
    expect(result.success).toBe(false);
  });

  it('3. FillingType — accepts all valid values', () => {
    for (const val of ['ZERO', 'NONE', 'INTERPOLATION', 'VALUE']) {
      expect(FillingTypeSchema.parse(val)).toBe(val);
    }
  });

  it('4. FillingType — rejects invalid value', () => {
    expect(FillingTypeSchema.safeParse('LINEAR').success).toBe(false);
  });

  it('5. Valence — accepts POSITIVE, NEGATIVE, NEUTRAL', () => {
    expect(ValenceSchema.parse('POSITIVE')).toBe('POSITIVE');
    expect(ValenceSchema.parse('NEGATIVE')).toBe('NEGATIVE');
    expect(ValenceSchema.parse('NEUTRAL')).toBe('NEUTRAL');
  });

  it('6. MeasurementScale — accepts all 4 values', () => {
    for (const val of ['NOMINAL', 'ORDINAL', 'INTERVAL', 'RATIO']) {
      expect(MeasurementScaleSchema.parse(val)).toBe(val);
    }
  });

  it('7. UnitCodeSystem — only UCUM is allowed', () => {
    expect(UnitCodeSystemSchema.parse('UCUM')).toBe('UCUM');
    expect(UnitCodeSystemSchema.safeParse('SI').success).toBe(false);
  });

  it('8. AnalysisStatus — accepts valid, rejects invalid', () => {
    expect(AnalysisStatusSchema.parse('WAITING')).toBe('WAITING');
    expect(AnalysisStatusSchema.parse('DONE')).toBe('DONE');
    expect(AnalysisStatusSchema.safeParse('RUNNING').success).toBe(false);
  });

  it('9. StrengthLevel — accepts all 5 values', () => {
    for (const val of ['VERY_STRONG', 'STRONG', 'MODERATE', 'WEAK', 'VERY_WEAK']) {
      expect(StrengthLevelSchema.parse(val)).toBe(val);
    }
  });

  it('10. ConfidenceLevel — accepts HIGH, MEDIUM, LOW', () => {
    expect(ConfidenceLevelSchema.parse('HIGH')).toBe('HIGH');
    expect(ConfidenceLevelSchema.parse('LOW')).toBe('LOW');
  });

  it('11. RelationshipDirection — accepts valid, rejects "UP"', () => {
    expect(RelationshipDirectionSchema.parse('POSITIVE')).toBe('POSITIVE');
    expect(RelationshipDirectionSchema.safeParse('UP').success).toBe(false);
  });

  it('12. EvidenceGrade — accepts A through F', () => {
    for (const val of ['A', 'B', 'C', 'D', 'F']) {
      expect(EvidenceGradeSchema.parse(val)).toBe(val);
    }
  });

  it('13. EvidenceGrade — rejects "E" (not in enum)', () => {
    expect(EvidenceGradeSchema.safeParse('E').success).toBe(false);
  });

  it('14. NotificationStatus — accepts all 5 values', () => {
    for (const val of ['PENDING', 'SENT', 'TRACKED', 'SKIPPED', 'SNOOZED']) {
      expect(NotificationStatusSchema.parse(val)).toBe(val);
    }
  });

  it('15. JurisdictionType — accepts CITY, COUNTY, STATE, COUNTRY', () => {
    for (const val of ['CITY', 'COUNTY', 'STATE', 'COUNTRY']) {
      expect(JurisdictionTypeSchema.parse(val)).toBe(val);
    }
  });

  it('16. JurisdictionType — rejects "PROVINCE"', () => {
    expect(JurisdictionTypeSchema.safeParse('PROVINCE').success).toBe(false);
  });

  it('17. SubjectType — accepts all valid values', () => {
    for (const val of ['USER', 'JURISDICTION', 'COHORT', 'ORGANIZATION']) {
      expect(SubjectTypeSchema.parse(val)).toBe(val);
    }
  });

  it('18. SubjectType — rejects invalid value', () => {
    expect(SubjectTypeSchema.safeParse('TEAM').success).toBe(false);
  });

  it('19. VoteAnswer — accepts YES and NO', () => {
    expect(VoteAnswerSchema.parse('YES')).toBe('YES');
    expect(VoteAnswerSchema.parse('NO')).toBe('NO');
    expect(VoteAnswerSchema.safeParse('MAYBE').success).toBe(false);
  });

  it('20. PersonhoodProvider — accepts supported providers', () => {
    expect(PersonhoodProviderSchema.parse('WORLD_ID')).toBe('WORLD_ID');
    expect(PersonhoodProviderSchema.parse('HUMAN_PASSPORT')).toBe('HUMAN_PASSPORT');
    expect(PersonhoodProviderSchema.safeParse('HOLONYM').success).toBe(false);
  });

  it('21. PersonhoodVerificationStatus — accepts VERIFIED and REVOKED', () => {
    expect(PersonhoodVerificationStatusSchema.parse('VERIFIED')).toBe('VERIFIED');
    expect(PersonhoodVerificationStatusSchema.parse('REVOKED')).toBe('REVOKED');
    expect(PersonhoodVerificationStatusSchema.safeParse('PENDING').success).toBe(false);
  });
});

// ============================================================================
// MODEL TESTS — Measurement
// ============================================================================

describe('MeasurementSchema', () => {
  it('16. validates a correct Measurement', () => {
    const result = MeasurementSchema.safeParse(validMeasurement);
    expect(result.success).toBe(true);
  });

  it('17. fails when required field "value" is missing', () => {
    const { value, ...noValue } = validMeasurement;
    const result = MeasurementSchema.safeParse(noValue);
    expect(result.success).toBe(false);
  });

  it('18. fails when "value" has wrong type (string instead of number)', () => {
    const result = MeasurementSchema.safeParse({
      ...validMeasurement,
      value: 'not-a-number',
    });
    expect(result.success).toBe(false);
  });

  it('19. fails when required field "userId" is missing', () => {
    const { userId, ...noUser } = validMeasurement;
    const result = MeasurementSchema.safeParse(noUser);
    expect(result.success).toBe(false);
  });

  it('20. fails when required field "startTime" is missing', () => {
    const { startTime, ...noStart } = validMeasurement;
    const result = MeasurementSchema.safeParse(noStart);
    expect(result.success).toBe(false);
  });

  it('21. accepts string dates (coercion)', () => {
    const result = MeasurementSchema.safeParse({
      ...validMeasurement,
      startTime: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startTime).toBeInstanceOf(Date);
    }
  });

  it('22. allows optional fields to be omitted', () => {
    const minimal = {
      id: 'meas_1',
      userId: 'user_1',
      nOf1VariableId: 'uv_1',
      globalVariableId: 'gv_1',
      startTime: now,
      value: 5,
      unitId: 'unit_1',
      originalValue: 5,
      originalUnitId: 'unit_1',
      createdAt: now,
      updatedAt: now,
    };
    const result = MeasurementSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// MODEL TESTS — Unit
// ============================================================================

describe('UnitSchema', () => {
  it('23. validates a correct Unit', () => {
    const result = UnitSchema.safeParse(validUnit);
    expect(result.success).toBe(true);
  });

  it('24. fails when "name" is missing', () => {
    const { name, ...noName } = validUnit;
    const result = UnitSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it('25. applies defaults for codeSystem, fillingType, and scale', () => {
    const minimal = {
      id: 'u1',
      name: 'Grams',
      abbreviatedName: 'g',
      ucumCode: 'g',
      unitCategoryId: 'weight',
      createdAt: now,
      updatedAt: now,
    };
    const result = UnitSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.codeSystem).toBe('UCUM');
      expect(result.data.fillingType).toBe('NONE');
      expect(result.data.scale).toBe('RATIO');
      expect(result.data.advanced).toBe(false);
      expect(result.data.manualTracking).toBe(true);
    }
  });

  it('26. fails when "ucumCode" is missing', () => {
    const { ucumCode, ...noUcumCode } = validUnit;
    const result = UnitSchema.safeParse(noUcumCode);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// MODEL TESTS — Jurisdiction
// ============================================================================

describe('JurisdictionSchema', () => {
  it('27. validates a correct Jurisdiction', () => {
    const result = JurisdictionSchema.safeParse(validJurisdiction);
    expect(result.success).toBe(true);
  });

  it('28. fails with invalid JurisdictionType', () => {
    const result = JurisdictionSchema.safeParse({
      ...validJurisdiction,
      type: 'PROVINCE',
    });
    expect(result.success).toBe(false);
  });

  it('29. applies default currency "USD"', () => {
    const { currency, ...noCurrency } = validJurisdiction;
    const result = JurisdictionSchema.safeParse(noCurrency);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('USD');
    }
  });
});

// ============================================================================
// MODEL TESTS — Subject
// ============================================================================

describe('SubjectSchema', () => {
  it('30. validates a correct Subject', () => {
    const result = SubjectSchema.safeParse(validSubject);
    expect(result.success).toBe(true);
  });

  it('31. applies default SubjectType USER when omitted', () => {
    const { subjectType, ...noSubjectType } = validSubject;
    const result = SubjectSchema.safeParse(noSubjectType);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subjectType).toBe('USER');
    }
  });

  it('32. rejects invalid SubjectType', () => {
    const result = SubjectSchema.safeParse({
      ...validSubject,
      subjectType: 'TEAM',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// MODEL TESTS — Auth / referral models
// ============================================================================

describe('Auth and referral models', () => {
  it('34. validates a User', () => {
    const data = {
      id: 'user_1',
      email: 'user@example.com',
      name: 'Test User',
      username: 'test-user',
      referralCode: 'REFCODE1',
      newsletterSubscribed: true,
      referralEmailSequenceStep: 0,
      referralEmailSequenceLastSentAt: null,
      createdAt: now,
      updatedAt: now,
    };
    expect(UserSchema.safeParse(data).success).toBe(true);
  });

  it('35. validates a Vote', () => {
    const data = {
      id: 'vote_1',
      answer: 'YES' as const,
      userId: 'user_1',
      referredByUserId: 'user_2',
      createdAt: now,
      updatedAt: now,
    };
    expect(VoteSchema.safeParse(data).success).toBe(true);
  });

  it('36. validates an Account', () => {
    const data = {
      id: 'account_1',
      userId: 'user_1',
      type: 'oauth',
      provider: 'google',
      providerAccountId: 'google-123',
      access_token: 'token',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    expect(AccountSchema.safeParse(data).success).toBe(true);
  });

  it('37. validates a Session', () => {
    const data = {
      id: 'session_1',
      sessionToken: 'session-token',
      userId: 'user_1',
      expires: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    expect(SessionSchema.safeParse(data).success).toBe(true);
  });

  it('38. validates a VerificationToken', () => {
    const data = {
      identifier: 'user@example.com',
      token: 'verify-token',
      expires: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    expect(VerificationTokenSchema.safeParse(data).success).toBe(true);
  });

  it('39. validates a PersonhoodVerification', () => {
    const data = {
      id: 'pov_1',
      userId: 'user_1',
      provider: 'WORLD_ID' as const,
      status: 'VERIFIED' as const,
      externalId: '0xabc123',
      action: 'personhood',
      verificationLevel: 'orb',
      signalHash: '0xsignal',
      verifiedAt: now,
      lastVerifiedAt: now,
      metadataJson: '{"protocolVersion":"3.0"}',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    expect(PersonhoodVerificationSchema.safeParse(data).success).toBe(true);
  });

  it('40. validates a WishocraticAllocation', () => {
    const data = {
      id: 'wa_1',
      userId: 'user_1',
      categoryA: 'MILITARY_OPERATIONS',
      categoryB: 'PRAGMATIC_CLINICAL_TRIALS',
      allocationA: 60,
      allocationB: 40,
      createdAt: now,
      updatedAt: now,
    };
    expect(WishocraticAllocationSchema.safeParse(data).success).toBe(true);
  });

  it('41. validates a WishocraticCategorySelection', () => {
    const data = {
      id: 'wcs_1',
      userId: 'user_1',
      categoryId: 'PRAGMATIC_CLINICAL_TRIALS',
      selected: true,
      createdAt: now,
      updatedAt: now,
    };
    expect(WishocraticCategorySelectionSchema.safeParse(data).success).toBe(true);
  });
});

// ============================================================================
// MODEL TESTS — NOf1VariableRelationship
// ============================================================================

describe('NOf1VariableRelationshipSchema', () => {
  it('29. validates a correct NOf1VariableRelationship', () => {
    const result = NOf1VariableRelationshipSchema.safeParse(
      validNOf1VariableRelationship,
    );
    expect(result.success).toBe(true);
  });

  it('30. fails when subjectId is missing', () => {
    const { subjectId, ...noSubjectId } = validNOf1VariableRelationship;
    const result = NOf1VariableRelationshipSchema.safeParse(noSubjectId);
    expect(result.success).toBe(false);
  });

  it('31. fails when forwardPearsonCorrelation is missing', () => {
    const { forwardPearsonCorrelation, ...noCorr } = validNOf1VariableRelationship;
    const result = NOf1VariableRelationshipSchema.safeParse(noCorr);
    expect(result.success).toBe(false);
  });

  it('32. accepts nullable enum fields', () => {
    const result = NOf1VariableRelationshipSchema.safeParse({
      ...validNOf1VariableRelationship,
      strengthLevel: 'STRONG',
      confidenceLevel: 'HIGH',
      relationship: 'POSITIVE',
      evidenceGrade: 'A',
    });
    expect(result.success).toBe(true);
  });

  it('33. fails with invalid enum value for strengthLevel', () => {
    const result = NOf1VariableRelationshipSchema.safeParse({
      ...validNOf1VariableRelationship,
      strengthLevel: 'SUPER_STRONG',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// MODEL TESTS — AggregateVariableRelationship
// ============================================================================

describe('AggregateVariableRelationshipSchema', () => {
  it('38. validates a correct AggregateVariableRelationship', () => {
    const data = {
      id: 'gvr_1',
      predictorGlobalVariableId: 'gv_1',
      outcomeGlobalVariableId: 'gv_2',
      forwardPearsonCorrelation: 0.45,
      reversePearsonCorrelation: 0.1,
      numberOfPairs: 500,
      onsetDelay: 7200,
      durationOfAction: 172800,
      numberOfUnits: 25,
      analyzedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    expect(AggregateVariableRelationshipSchema.safeParse(data).success).toBe(true);
  });

  it('39. fails when numberOfUnits is missing', () => {
    const data = {
      id: 'gvr_1',
      predictorGlobalVariableId: 'gv_1',
      outcomeGlobalVariableId: 'gv_2',
      forwardPearsonCorrelation: 0.45,
      reversePearsonCorrelation: 0.1,
      numberOfPairs: 500,
      onsetDelay: 7200,
      durationOfAction: 172800,
      analyzedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    expect(AggregateVariableRelationshipSchema.safeParse(data).success).toBe(false);
  });
});

// ============================================================================
// MODEL TESTS — Politician, PoliticianVote, AlignmentScore
// ============================================================================

describe('Governance models', () => {
  it('40. validates a Politician', () => {
    const data = {
      id: 'pol_1',
      jurisdictionId: 'jur_us',
      name: 'Jane Smith',
      party: 'Independent',
      title: 'Senator',
      createdAt: now,
      updatedAt: now,
    };
    expect(PoliticianSchema.safeParse(data).success).toBe(true);
  });

  it('41. validates a PoliticianVote', () => {
    const data = {
      id: 'pv_1',
      politicianId: 'pol_1',
      itemCategory: 'Defense',
      allocationPct: 15.5,
      createdAt: now,
      updatedAt: now,
    };
    expect(PoliticianVoteSchema.safeParse(data).success).toBe(true);
  });

  it('42. validates an AlignmentScore', () => {
    const data = {
      id: 'as_1',
      politicianId: 'pol_1',
      aggregationRunId: 'run_1',
      score: 87.5,
      votesCompared: 42,
      createdAt: now,
      updatedAt: now,
    };
    expect(AlignmentScoreSchema.safeParse(data).success).toBe(true);
  });

  it('43. AlignmentScore fails when score is missing', () => {
    const data = {
      id: 'as_1',
      politicianId: 'pol_1',
      aggregationRunId: 'run_1',
      votesCompared: 42,
      createdAt: now,
      updatedAt: now,
    };
    expect(AlignmentScoreSchema.safeParse(data).success).toBe(false);
  });
});

// ============================================================================
// MODEL TESTS — PairwiseComparison, PreferenceWeight
// ============================================================================

describe('Preference elicitation models', () => {
  it('44. validates a PairwiseComparison', () => {
    const data = {
      id: 'pc_1',
      participantId: 'part_1',
      itemAId: 'item_1',
      itemBId: 'item_2',
      allocationA: 60,
      responseTimeMs: 3200,
      createdAt: now,
      updatedAt: now,
    };
    expect(PairwiseComparisonSchema.safeParse(data).success).toBe(true);
  });

  it('45. PairwiseComparison fails when allocationA is missing', () => {
    const data = {
      id: 'pc_1',
      participantId: 'part_1',
      itemAId: 'item_1',
      itemBId: 'item_2',
      createdAt: now,
      updatedAt: now,
    };
    expect(PairwiseComparisonSchema.safeParse(data).success).toBe(false);
  });

  it('46. validates a PreferenceWeight', () => {
    const data = {
      id: 'pw_1',
      aggregationRunId: 'run_1',
      itemId: 'item_1',
      weight: 0.15,
      rank: 3,
      createdAt: now,
      updatedAt: now,
    };
    expect(PreferenceWeightSchema.safeParse(data).success).toBe(true);
  });

  it('47. PreferenceWeight fails when rank is a float', () => {
    const data = {
      id: 'pw_1',
      aggregationRunId: 'run_1',
      itemId: 'item_1',
      weight: 0.15,
      rank: 3.7,
      createdAt: now,
      updatedAt: now,
    };
    const result = PreferenceWeightSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// MODEL TESTS — Remaining models
// ============================================================================

describe('Additional models', () => {
  it('48. validates a VariableCategory with defaults', () => {
    const data = {
      id: 'vc_1',
      name: 'Treatment',
      createdAt: now,
      updatedAt: now,
    };
    const result = VariableCategorySchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.combinationOperation).toBe('SUM');
      expect(result.data.onsetDelay).toBe(0);
      expect(result.data.durationOfAction).toBe(86400);
    }
  });

  it('49. validates a GlobalVariable', () => {
    const data = {
      id: 'gv_1',
      name: 'Overall Mood',
      variableCategoryId: 'vc_emotion',
      defaultUnitId: 'unit_rating',
      createdAt: now,
      updatedAt: now,
    };
    const result = GlobalVariableSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('50. validates a NOf1Variable', () => {
    const data = {
      id: 'uv_1',
      userId: 'user_1',
      subjectId: 'subject_1',
      globalVariableId: 'gv_1',
      createdAt: now,
      updatedAt: now,
    };
    expect(NOf1VariableSchema.safeParse(data).success).toBe(true);
  });

  it('51. validates a TrackingReminder', () => {
    const data = {
      id: 'tr_1',
      userId: 'user_1',
      nOf1VariableId: 'uv_1',
      globalVariableId: 'gv_1',
      reminderStartTime: '08:00',
      reminderFrequency: 86400,
      createdAt: now,
      updatedAt: now,
    };
    expect(TrackingReminderSchema.safeParse(data).success).toBe(true);
  });

  it('52. validates a TrackingReminderNotification', () => {
    const data = {
      id: 'trn_1',
      userId: 'user_1',
      trackingReminderId: 'tr_1',
      notifyAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const result = TrackingReminderNotificationSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('PENDING');
    }
  });

  it('53. validates an Item', () => {
    const data = {
      id: 'item_1',
      jurisdictionId: 'jur_1',
      name: 'National Defense',
      category: 'Discretionary',
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    expect(ItemSchema.safeParse(data).success).toBe(true);
  });

  it('54. validates a Participant', () => {
    const data = {
      id: 'part_1',
      jurisdictionId: 'jur_1',
      externalId: 'anon_xyz',
      ageRange: '25-34',
      region: 'US-CA',
      createdAt: now,
      updatedAt: now,
    };
    expect(ParticipantSchema.safeParse(data).success).toBe(true);
  });

  it('55. validates an AggregationRun', () => {
    const data = {
      id: 'run_1',
      jurisdictionId: 'jur_1',
      comparisonCount: 1500,
      participantCount: 200,
      consistencyRatio: 0.04,
      createdAt: now,
      updatedAt: now,
    };
    expect(AggregationRunSchema.safeParse(data).success).toBe(true);
  });

  it('56. validates an IntegrationProvider', () => {
    const data = {
      id: 'ip_1',
      key: 'fitbit',
      displayName: 'Fitbit',
      createdAt: now,
      updatedAt: now,
    };
    const result = IntegrationProviderSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enabled).toBe(true);
      expect(result.data.supportsWebhook).toBe(false);
      expect(result.data.defaultPollIntervalSeconds).toBe(3600);
    }
  });

  it('57. validates an IntegrationConnection', () => {
    const data = {
      id: 'ic_1',
      userId: 'user_1',
      integrationProviderId: 'ip_1',
      createdAt: now,
      updatedAt: now,
    };
    expect(IntegrationConnectionSchema.safeParse(data).success).toBe(true);
  });

  it('58. validates an IntegrationSyncLog', () => {
    const data = {
      id: 'isl_1',
      integrationConnectionId: 'ic_1',
      startedAt: now,
      createdAt: now,
    };
    const result = IntegrationSyncLogSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.success).toBe(false);
      expect(result.data.newMeasurements).toBe(0);
    }
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('Edge cases', () => {
  it('59. rejects completely empty object for Measurement', () => {
    expect(MeasurementSchema.safeParse({}).success).toBe(false);
  });

  it('60. rejects null for a required string field', () => {
    expect(
      MeasurementSchema.safeParse({ ...validMeasurement, id: null }).success,
    ).toBe(false);
  });

  it('61. rejects number for a string field', () => {
    expect(
      MeasurementSchema.safeParse({ ...validMeasurement, userId: 12345 }).success,
    ).toBe(false);
  });

  it('62. accepts extra properties (passthrough by default in zod)', () => {
    const withExtra = { ...validMeasurement, extraField: 'hello' };
    // zod strips unknown keys by default but doesn't fail
    const result = MeasurementSchema.safeParse(withExtra);
    expect(result.success).toBe(true);
  });

  it('63. GlobalVariable rejects non-integer for numberOfMeasurements', () => {
    const data = {
      id: 'gv_1',
      name: 'Test Var',
      variableCategoryId: 'vc_1',
      defaultUnitId: 'u_1',
      numberOfMeasurements: 5.5,
      createdAt: now,
      updatedAt: now,
    };
    expect(GlobalVariableSchema.safeParse(data).success).toBe(false);
  });

  it('64. TrackingReminderNotification rejects invalid status', () => {
    const data = {
      id: 'trn_1',
      userId: 'user_1',
      trackingReminderId: 'tr_1',
      notifyAt: now,
      status: 'DELIVERED',
      createdAt: now,
      updatedAt: now,
    };
    expect(TrackingReminderNotificationSchema.safeParse(data).success).toBe(false);
  });

  it('65. Unit rejects missing abbreviatedName', () => {
    const { abbreviatedName, ...noAbbrev } = validUnit;
    expect(UnitSchema.safeParse(noAbbrev).success).toBe(false);
  });

  it('66. User rejects an invalid email address', () => {
    expect(
      UserSchema.safeParse({
        id: 'user_1',
        email: 'not-an-email',
        referralCode: 'REFCODE1',
        createdAt: now,
        updatedAt: now,
      }).success,
    ).toBe(false);
  });
});
