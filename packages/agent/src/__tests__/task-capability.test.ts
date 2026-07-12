import { describe, expect, it } from 'vitest';
import { assessTaskCapability } from '../task-capability.js';

describe('assessTaskCapability', () => {
  it('allows tasks with no recorded requirements', () => {
    expect(
      assessTaskCapability({
        executor: { executorKind: 'human' },
        task: {},
      }).status,
    ).toBe('eligible');
  });

  it('reports unknown when a required capability has no profile evidence', () => {
    const assessment = assessTaskCapability({
      executor: { executorKind: 'human', skillTags: [] },
      task: { skillTags: ['bookkeeping'] },
    });

    expect(assessment.status).toBe('unknown');
    expect(assessment.missingProfileFields).toEqual(['skillTags']);
  });

  it('reports ineligible when recorded capabilities miss a requirement', () => {
    const assessment = assessTaskCapability({
      executor: { executorKind: 'human', skillTags: ['writing'] },
      task: { skillTags: ['bookkeeping'] },
    });

    expect(assessment.status).toBe('ineligible');
    expect(assessment.missingRequiredTags).toEqual(['skillTags:bookkeeping']);
  });

  it('enforces human-only and agent-only execution modes', () => {
    expect(
      assessTaskCapability({
        executor: { executorKind: 'agent' },
        task: { executionMode: 'HUMAN_ONLY' },
      }).status,
    ).toBe('ineligible');
    expect(
      assessTaskCapability({
        executor: { executorKind: 'human' },
        task: { executionMode: 'AGENT_ONLY' },
      }).status,
    ).toBe('ineligible');
  });

  it('requires every recorded hard capability dimension', () => {
    expect(
      assessTaskCapability({
        executor: {
          accessTags: ['mercury-account'],
          credentialTags: ['organization-admin'],
          executorKind: 'human',
          languageTags: ['en'],
          skillTags: ['bookkeeping'],
          toolTags: ['mercury'],
        },
        task: {
          requiredAccessTags: ['mercury-account'],
          requiredCredentialTags: ['organization-admin'],
          requiredLanguageTags: ['en'],
          requiredToolTags: ['mercury'],
          skillTags: ['bookkeeping'],
        },
      }).status,
    ).toBe('eligible');
  });
});
