import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getOptimalBudgetReport } from '@/lib/optimal-budget-generator';
import { HealthcareFrontier } from './HealthcareFrontier';

describe('healthcare outcome bounds', () => {
  beforeAll(() => { vi.stubGlobal('React', React); });
  afterAll(() => { vi.unstubAllGlobals(); });
  const data = getOptimalBudgetReport().healthcare;
  const gap = data.defaultMaxHealthyYearGap;
  const render = (healthcare: typeof data) => renderToStaticMarkup(createElement(HealthcareFrontier, {
    data: healthcare, gap, countryId: 'USA', onGapChange: () => {},
  }));

  it('omits bounds when no system qualifies while retaining the unavailable state', () => {
    const html = render({ ...data, scenarios: data.scenarios.map(choice => ({ ...choice, selected: null })) });
    expect(html).toContain('No system with reported public financing meets this target.');
    expect(html).not.toContain('Mean annual WHO lower and upper estimates:');
  });

  it('keeps reported bounds for the selected system', () => {
    expect(render(data)).toContain('Mean annual WHO lower and upper estimates:');
  });
});
