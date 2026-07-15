export const notionOperationalWorkspacesFixture = {
  workspaceId: "workspace-sanitized",
  workspaceName: "Sanitized operational workspace",
  organizations: [
    {
      sourceId: "org-eos",
      name: "Example Optimization Services",
      type: "COMPANY",
    },
    {
      sourceId: "org-apg",
      name: "Example Public Goods",
      type: "COMPANY",
    },
    {
      sourceId: "org-fedmi",
      name: "Example Medical Institute",
      type: "NONPROFIT",
    },
  ],
  tasks: [
    {
      sourceId: "task-eos-site",
      title: "Publish the organization website",
      acceptanceCriteria: ["The public page is available at its canonical URL."],
      estimatedEffortHours: 6,
    },
    {
      sourceId: "task-personal-application",
      title: "Submit the selected grant application",
      dependencySourceIds: ["task-eos-site"],
      dueAt: "2026-08-01T17:00:00.000Z",
      estimatedEffortHours: 3,
    },
  ],
  documents: [
    {
      sourceId: "document-ic2ewd-brief",
      organizationSourceId: "org-eos",
      title: "Campaign operating brief",
      markdown: "# Campaign operating brief\n\nA sanitized example document.",
      raw: {
        notionPageId: "page-sanitized",
        blocks: [
          { type: "synced_block", syncedFrom: "block-sanitized" },
          { type: "unsupported_future_block", payload: { retained: true } },
        ],
      },
    },
  ],
  collections: [
    {
      sourceId: "collection-eos-roadmap",
      organizationSourceId: "org-eos",
      name: "EOS Roadmap",
      raw: {
        notionDataSourceId: "data-source-eos-sanitized",
        properties: {
          Impact: { id: "formula-impact", type: "formula" },
          Related: { id: "relation-related", type: "relation" },
        },
      },
      fields: [
        { key: "name", name: "Name", type: "TEXT", required: true },
        {
          key: "status",
          name: "Status",
          type: "SELECT",
          optionsJson: {
            notionPropertyId: "status-sanitized",
            options: ["Proposed", "In progress", "Done"],
          },
        },
        {
          key: "related",
          name: "Related work",
          type: "RELATION",
          targetCollectionSourceId: "collection-eos-roadmap",
        },
        {
          key: "impact",
          name: "Impact",
          type: "FORMULA",
          optionsJson: {
            dependencies: ["probability", "value"],
            expression: "probability * value",
            notionFormula: "prop(\"Probability\") * prop(\"Value\")",
          },
        },
      ],
      records: [
        {
          sourceId: "record-eos-site",
          taskSourceId: "task-eos-site",
          values: {
            name: "Publish the organization website",
            status: "In progress",
            impact: 42.5,
          },
          relations: [
            {
              fieldKey: "related",
              targetCollectionSourceId: "collection-eos-roadmap",
              targetRecordSourceId: "record-eos-site",
            },
          ],
          raw: {
            formulaOutputs: { impact: { type: "number", number: 42.5 } },
          },
        },
      ],
      views: [
        {
          name: "Current work",
          isDefault: true,
          visibleFieldKeys: ["name", "status", "impact"],
        },
      ],
    },
    {
      sourceId: "collection-apg-products",
      organizationSourceId: "org-apg",
      name: "APG Products",
      fields: [
        { key: "name", name: "Name", type: "TEXT", required: true },
        {
          key: "related",
          name: "Related products",
          type: "RELATION",
          targetCollectionSourceId: "collection-apg-products",
        },
        {
          key: "projected_revenue",
          name: "Projected revenue",
          type: "FORMULA",
          optionsJson: {
            dependencies: ["units", "price"],
            expression: "units * price",
          },
        },
      ],
      records: [
        {
          sourceId: "record-apg-service",
          values: {
            name: "Example managed service",
            projected_revenue: 12000,
          },
          relations: [
            {
              fieldKey: "related",
              targetCollectionSourceId: "collection-apg-products",
              targetRecordSourceId: "record-apg-service",
            },
          ],
        },
      ],
      views: [
        {
          name: "Products",
          isDefault: true,
          visibleFieldKeys: ["name", "projected_revenue"],
        },
      ],
    },
    {
      sourceId: "collection-personal-tasks",
      name: "Personal Tasks",
      fields: [
        { key: "name", name: "Name", type: "TEXT", required: true },
        { key: "done", name: "Done", type: "BOOLEAN" },
        { key: "due", name: "Due", type: "DATE" },
        {
          key: "business",
          name: "Business",
          type: "RELATION",
          targetCollectionSourceId: "collection-apg-products",
        },
        {
          key: "business_total",
          name: "Business total",
          type: "ROLLUP",
          optionsJson: {
            function: "sum",
            relationProperty: "business",
            targetProperty: "projected_revenue",
          },
        },
        {
          key: "priority",
          name: "Priority",
          type: "FORMULA",
          optionsJson: {
            dependencies: ["expected_value", "hours"],
            expression: "expected_value / hours",
          },
        },
      ],
      records: [
        {
          sourceId: "record-personal-application",
          taskSourceId: "task-personal-application",
          values: {
            name: "Submit the selected grant application",
            done: false,
            due: "2026-08-01T17:00:00.000Z",
            business_total: 12000,
            priority: 17.25,
          },
          relations: [
            {
              fieldKey: "business",
              targetCollectionSourceId: "collection-apg-products",
              targetRecordSourceId: "record-apg-service",
            },
          ],
          raw: {
            rollupOutputs: { business_total: { type: "number", number: 12000 } },
            formulaOutputs: { priority: { type: "number", number: 17.25 } },
          },
        },
      ],
      views: [
        {
          name: "Next actions",
          isDefault: true,
          visibleFieldKeys: ["name", "due", "priority"],
        },
      ],
    },
    {
      sourceId: "collection-fedmi-grants",
      organizationSourceId: "org-fedmi",
      name: "FEDMI Grants",
      fields: [
        { key: "grant", name: "Grant", type: "TEXT", required: true },
        {
          key: "stage",
          name: "Stage",
          type: "SELECT",
          optionsJson: { options: ["Research", "Drafting", "Submitted"] },
        },
        { key: "amount", name: "Amount", type: "NUMBER" },
        { key: "notes", name: "Notes", type: "RICH_TEXT" },
      ],
      records: [
        {
          sourceId: "record-fedmi-grant",
          values: {
            grant: "Example research grant",
            stage: "Research",
            amount: 50000,
            notes: "Sanitized import fixture.",
          },
        },
      ],
      views: [
        {
          name: "Pipeline",
          isDefault: true,
          visibleFieldKeys: ["grant", "stage", "amount"],
        },
      ],
    },
  ],
  preservedArtifacts: [
    {
      sourceId: "artifact-ic2ewd-unsupported-blocks",
      artifactType: "NOTION_PAGE",
      title: "Unsupported IC2EWD blocks",
      raw: {
        blocks: [
          { id: "block-one", type: "unsupported_future_block", content: "kept" },
        ],
      },
    },
  ],
  export: {
    sourceId: "export-sanitized",
    title: "Sanitized Notion export",
    exportedAt: "2026-07-14T12:00:00.000Z",
    raw: { manifestVersion: 1, retained: true },
  },
} as const;
