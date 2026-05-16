import { describe, expect, it } from 'vitest';
import {
  compileTaskTreeBundle,
  reviewTaskTreeBundle,
  summarizeTaskTree,
} from '../task-tree.js';

const roots = [
  {
    description: 'Get the treaty program operational and measurable.',
    estimatedEffortHours: 1,
    id: 'treaty_program',
    impact: {
      delayDalysLostPerDay: 20000,
      delayEconomicValueUsdLostPerDay: 700000000,
      expectedValuePerHourDalys: 4000,
      expectedValuePerHourUsd: 180000000,
    },
    roleTitle: 'Program Lead',
    sourceUrls: ['https://optimitron.com/tasks/program'],
    taskKey: 'program:one-percent-treaty',
    title: 'Run the 1% Treaty pressure program',
    children: [
      {
        assigneeOrganizationId: 'org_dz_gov',
        contactUrl: 'https://www.el-mouradia.dz/en/',
        description:
          'Send one evidence-based message to the Algerian office, then log any acknowledgment or reply.',
        estimatedEffortHours: 0.25,
        id: 'contact_dz_office',
        impact: {
          delayDalysLostPerDay: 2000,
          delayEconomicValueUsdLostPerDay: 12000000,
          expectedValuePerHourDalys: 800,
          expectedValuePerHourUsd: 3500000,
        },
        roleTitle: 'President',
        sourceUrls: ['https://www.el-mouradia.dz/en/'],
        taskKey: 'program:one-percent-treaty:signer:dz:support:contact-office',
        title: "Contact Algeria's presidential office",
      },
      {
        blockerRefs: ['contact_dz_office'],
        description:
          'Publish one country-specific explainer that makes the Algeria treaty ask shareable and understandable.',
        estimatedEffortHours: 1,
        id: 'publish_dz_explainer',
        impact: {
          delayDalysLostPerDay: 1500,
          delayEconomicValueUsdLostPerDay: 9000000,
          expectedValuePerHourDalys: 700,
          expectedValuePerHourUsd: 2500000,
        },
        roleTitle: 'Campaign Volunteer',
        sourceUrls: ['https://optimitron.com/tasks/dz'],
        taskKey: 'program:one-percent-treaty:signer:dz:support:publish-explainer',
        title: "Publish Algeria's treaty explainer",
      },
    ],
  },
] as const;

describe('task tree helpers', () => {
  it('compiles a nested tree into proposal candidates with parent refs', () => {
    const candidates = compileTaskTreeBundle({ roots: [...roots] });

    expect(candidates).toHaveLength(3);
    expect(candidates[0]?.parentTaskRef).toBeNull();
    expect(candidates[1]?.parentTaskRef).toBe('treaty_program');
    expect(candidates[2]?.parentTaskRef).toBe('treaty_program');
  });

  it('summarizes node, root, and leaf counts', () => {
    const summary = summarizeTaskTree([...roots]);

    expect(summary.rootCount).toBe(1);
    expect(summary.nodeCount).toBe(3);
    expect(summary.leafCount).toBe(2);
    expect(summary.deepestLevel).toBe(2);
    expect(summary.publicCount).toBe(3);
  });

  it('reviews the flattened tree through the normal proposal gate', () => {
    const result = reviewTaskTreeBundle({ roots: [...roots] });

    expect(result.summary.nodeCount).toBe(3);
    expect(result.candidates).toHaveLength(3);
    expect(result.review.promotableCount).toBe(3);
  });

  it('rejects duplicate node ids before flattening', () => {
    expect(() =>
      compileTaskTreeBundle({
        roots: [
          {
            ...roots[0],
            children: [
              roots[0].children[0],
              {
                ...roots[0].children[1],
                id: 'contact_dz_office',
              },
            ],
          },
        ],
      }),
    ).toThrow('Duplicate task-tree node id "contact_dz_office".');
  });
});
