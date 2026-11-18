# Schema Usage Audit

- Schema: [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma)
- Models scanned: 163
- Enums scanned: 143
- Classification summary: core 13, runtime-live 133, tests-only 5, schema-only 0, generated-only 6, suspicious 6

## Vote Model Clarification

- `CitizenBillVote` records a user's stance on an external legislative bill plus an optional CBA snapshot and share identifier.
- `Referendum` and `ReferendumVote` represent internal Optimitron platform questions with lifecycle, referral attribution, and VOTE token flows.
- There is no first-class `CitizenBill` table today because bill metadata is fetched from external Congress pipelines rather than persisted as a canonical local entity.

## Naming Collisions and Ambiguity

- **HIGH**: `UserPreference / NotificationPreference` — UserPreference stores single-row push reminder schedule settings, while NotificationPreference stores per-type/channel toggles. The overlapping names are likely to confuse future developers.

## Missing First-Class Model Candidates

### CitizenBill

- Classification: `missing-first-class-model-candidate`
- Summary: Legislative bill metadata is heavily used through external fetchers, classification flows, UI cards, and saved CitizenBillVote rows, but there is no first-class Prisma bill model yet.
- Evidence: 15 files / 113 matches
- Key files:
  - [apps/optimitron/src/components/chat/ChatPage.tsx](../apps/optimitron/src/components/chat/ChatPage.tsx) (37 matches)
  - [apps/optimitron/src/lib/alignment-legislative-sync.server.ts](../apps/optimitron/src/lib/alignment-legislative-sync.server.ts) (16 matches)
  - [apps/optimitron/src/app/api/civic/bills/route.ts](../apps/optimitron/src/app/api/civic/bills/route.ts) (11 matches)
  - [apps/optimitron/src/components/chat/BillListCard.tsx](../apps/optimitron/src/components/chat/BillListCard.tsx) (10 matches)
  - [apps/optimitron/src/components/chat/BillVoteCard.tsx](../apps/optimitron/src/components/chat/BillVoteCard.tsx) (9 matches)
  - [apps/optimitron/src/app/api/civic/votes/route.ts](../apps/optimitron/src/app/api/civic/votes/route.ts) (6 matches)
  - [apps/optimitron/src/components/chat/BillCard.tsx](../apps/optimitron/src/components/chat/BillCard.tsx) (6 matches)
  - [packages/data/src/fetchers/congress.ts](../packages/data/src/fetchers/congress.ts) (6 matches)

## Model Inventory

| Model | Classification | Runtime Prisma | Runtime Surface | Tests | Generated/Zod | Docs |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Account | `runtime-live` | 1 | 11 | 3 | 9 | 1 |
| Activity | `runtime-live` | 14 | 60 | 7 | 12 | 5 |
| AgentExecutor | `runtime-live` | 3 | 3 | 0 | 14 | 1 |
| AgentTaskLease | `runtime-live` | 2 | 2 | 0 | 9 | 1 |
| AggregateVariableRelationship | `runtime-live` | 1 | 6 | 2 | 9 | 0 |
| AggregationRun | `runtime-live` | 3 | 3 | 1 | 11 | 0 |
| AlignmentScore | `runtime-live` | 2 | 3 | 2 | 11 | 1 |
| Badge | `runtime-live` | 1 | 8 | 0 | 9 | 1 |
| CitizenBillVote | `runtime-live` | 3 | 3 | 0 | 9 | 1 |
| Collection | `runtime-live` | 2 | 14 | 2 | 13 | 1 |
| CollectionField | `runtime-live` | 2 | 6 | 0 | 10 | 0 |
| CollectionRecord | `runtime-live` | 4 | 7 | 0 | 16 | 0 |
| CollectionRelation | `runtime-live` | 2 | 3 | 0 | 14 | 0 |
| CollectionView | `runtime-live` | 2 | 5 | 0 | 9 | 0 |
| CommerceEntitlement | `generated-only` | 0 | 0 | 0 | 12 | 0 |
| CommerceFulfillment | `runtime-live` | 2 | 2 | 0 | 9 | 0 |
| CommerceFulfillmentMapping | `runtime-live` | 1 | 1 | 0 | 8 | 0 |
| CommerceOffer | `runtime-live` | 4 | 4 | 0 | 10 | 0 |
| CommerceOfferVariant | `runtime-live` | 2 | 2 | 0 | 11 | 0 |
| CommerceOrder | `runtime-live` | 5 | 5 | 0 | 9 | 0 |
| CommerceOrderItem | `generated-only` | 0 | 0 | 0 | 12 | 0 |
| Conflict | `runtime-live` | 3 | 15 | 2 | 10 | 0 |
| ContentAccessGrant | `runtime-live` | 1 | 1 | 0 | 11 | 1 |
| ContentAttachment | `runtime-live` | 4 | 4 | 0 | 12 | 1 |
| ContentReport | `runtime-live` | 1 | 1 | 0 | 9 | 1 |
| CourtCase | `runtime-live` | 3 | 3 | 1 | 12 | 1 |
| CourtCaseClaim | `suspicious` | 0 | 0 | 0 | 14 | 1 |
| CourtCaseEvidence | `runtime-live` | 1 | 2 | 0 | 15 | 1 |
| CourtCaseHarm | `suspicious` | 0 | 0 | 0 | 14 | 1 |
| CourtCaseParty | `runtime-live` | 0 | 1 | 0 | 12 | 1 |
| CourtCaseRemedy | `runtime-live` | 1 | 1 | 0 | 13 | 1 |
| DatingBlock | `runtime-live` | 1 | 1 | 0 | 8 | 0 |
| DatingConversation | `runtime-live` | 1 | 1 | 0 | 9 | 0 |
| DatingDatePlan | `runtime-live` | 2 | 2 | 0 | 12 | 0 |
| DatingInteraction | `runtime-live` | 1 | 1 | 0 | 8 | 0 |
| DatingMatch | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| DatingMatchScore | `generated-only` | 0 | 0 | 0 | 8 | 0 |
| DatingMessage | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| DatingPreference | `generated-only` | 0 | 0 | 0 | 8 | 0 |
| DatingProfile | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| DatingProfilePhoto | `runtime-live` | 1 | 1 | 0 | 9 | 0 |
| DatingPrompt | `runtime-live` | 1 | 1 | 0 | 7 | 0 |
| DatingPromptAnswer | `generated-only` | 0 | 0 | 0 | 9 | 0 |
| DatingQuestion | `runtime-live` | 2 | 2 | 0 | 7 | 0 |
| DatingQuestionAnswer | `runtime-live` | 1 | 1 | 0 | 9 | 0 |
| DatingSafetyReport | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| Document | `runtime-live` | 6 | 20 | 4 | 16 | 3 |
| DocumentRevision | `runtime-live` | 5 | 6 | 1 | 12 | 2 |
| EmailLog | `runtime-live` | 4 | 15 | 0 | 11 | 5 |
| ExternalActionRequest | `runtime-live` | 6 | 11 | 0 | 12 | 3 |
| Form | `runtime-live` | 1 | 14 | 2 | 13 | 3 |
| FormField | `runtime-live` | 1 | 5 | 1 | 10 | 1 |
| FormResponse | `runtime-live` | 1 | 2 | 1 | 13 | 1 |
| FormRevision | `runtime-live` | 1 | 1 | 0 | 11 | 2 |
| FormSection | `suspicious` | 0 | 0 | 0 | 10 | 1 |
| FormSubmission | `runtime-live` | 2 | 2 | 1 | 14 | 0 |
| GlobalVariable | `runtime-live` | 7 | 12 | 3 | 22 | 1 |
| GlobalVariableExternalCode | `runtime-live` | 2 | 2 | 1 | 10 | 0 |
| IntegrationConnection | `tests-only` | 0 | 0 | 1 | 12 | 1 |
| IntegrationProvider | `tests-only` | 0 | 0 | 1 | 11 | 0 |
| IntegrationSyncLog | `tests-only` | 0 | 0 | 1 | 9 | 1 |
| InterventionApprovalTimeline | `runtime-live` | 3 | 4 | 0 | 11 | 0 |
| InterventionExperience | `runtime-live` | 1 | 1 | 0 | 13 | 3 |
| InterventionExperienceOutcome | `runtime-live` | 1 | 1 | 0 | 12 | 1 |
| InterventionExperienceSideEffect | `runtime-live` | 1 | 1 | 0 | 10 | 1 |
| InterventionRankingRun | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| Jurisdiction | `runtime-live` | 6 | 22 | 5 | 31 | 1 |
| KnowledgeAnswer | `runtime-live` | 1 | 2 | 0 | 12 | 3 |
| McpToolCallAudit | `runtime-live` | 1 | 1 | 0 | 11 | 1 |
| Measurement | `runtime-live` | 2 | 15 | 8 | 16 | 6 |
| NOf1Variable | `runtime-live` | 2 | 4 | 3 | 13 | 1 |
| NOf1VariableRelationship | `runtime-live` | 2 | 6 | 3 | 10 | 0 |
| Notification | `runtime-live` | 0 | 7 | 0 | 9 | 2 |
| NotificationPreference | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| OAuthAuthCode | `runtime-live` | 2 | 2 | 0 | 9 | 1 |
| OAuthClient | `runtime-live` | 5 | 6 | 0 | 8 | 1 |
| OAuthGrant | `runtime-live` | 6 | 6 | 0 | 10 | 1 |
| Organization | `core` | 21 | 46 | 17 | 31 | 7 |
| OrganizationMember | `core` | 11 | 12 | 0 | 10 | 2 |
| OrganizationName | `runtime-live` | 1 | 2 | 0 | 11 | 0 |
| OrganizationReferendumPosition | `runtime-live` | 8 | 8 | 0 | 10 | 1 |
| ParameterDefinition | `runtime-live` | 3 | 3 | 0 | 10 | 0 |
| ParameterRevision | `runtime-live` | 3 | 3 | 0 | 10 | 0 |
| ParameterRevisionInput | `runtime-live` | 1 | 1 | 0 | 9 | 0 |
| ParameterRevisionSourceArtifact | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| Person | `core` | 29 | 68 | 20 | 28 | 9 |
| PersonCondition | `runtime-live` | 3 | 4 | 0 | 13 | 1 |
| PersonEfficacyLagEvidence | `runtime-live` | 2 | 4 | 0 | 12 | 1 |
| PersonhoodVerification | `runtime-live` | 5 | 5 | 1 | 9 | 1 |
| PersonMemorial | `runtime-live` | 6 | 7 | 0 | 12 | 1 |
| PersonMemorialEvidence | `runtime-live` | 1 | 2 | 0 | 12 | 1 |
| PersonMemorialResponsibleParty | `runtime-live` | 1 | 3 | 0 | 12 | 1 |
| PersonMemorialSubmission | `runtime-live` | 1 | 2 | 0 | 11 | 1 |
| PersonRelationship | `runtime-live` | 1 | 2 | 0 | 10 | 1 |
| PointMint | `runtime-live` | 5 | 6 | 0 | 10 | 0 |
| Politician | `runtime-live` | 2 | 16 | 4 | 11 | 3 |
| PoliticianVote | `runtime-live` | 1 | 1 | 1 | 10 | 0 |
| PreferenceWeight | `runtime-live` | 1 | 3 | 2 | 10 | 1 |
| PrizeTreasuryDeposit | `runtime-live` | 2 | 2 | 0 | 9 | 1 |
| PublicGoodsRecipient | `suspicious` | 0 | 0 | 0 | 9 | 1 |
| RankedIntervention | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| Referendum | `runtime-live` | 18 | 29 | 7 | 15 | 1 |
| ReferendumVote | `runtime-live` | 14 | 18 | 3 | 14 | 2 |
| Referral | `runtime-live` | 5 | 25 | 4 | 10 | 7 |
| ReferralClick | `suspicious` | 0 | 0 | 0 | 8 | 1 |
| ReferralInvitation | `runtime-live` | 7 | 11 | 0 | 15 | 4 |
| Session | `runtime-live` | 0 | 12 | 5 | 9 | 2 |
| ShareAttempt | `runtime-live` | 4 | 6 | 0 | 16 | 4 |
| SocialAccount | `runtime-live` | 3 | 3 | 0 | 9 | 1 |
| SourceArtifact | `core` | 12 | 12 | 0 | 24 | 5 |
| StripeConnectedAccount | `runtime-live` | 2 | 2 | 0 | 10 | 0 |
| Subject | `runtime-live` | 1 | 22 | 6 | 21 | 2 |
| Task | `core` | 65 | 135 | 36 | 37 | 18 |
| TaskApplication | `runtime-live` | 4 | 4 | 0 | 16 | 0 |
| TaskApplicationEvent | `runtime-live` | 2 | 2 | 0 | 11 | 0 |
| TaskCandidateMatch | `runtime-live` | 3 | 3 | 0 | 15 | 0 |
| TaskClaim | `core` | 5 | 7 | 0 | 13 | 1 |
| TaskComment | `runtime-live` | 12 | 16 | 0 | 17 | 6 |
| TaskCommentAttachment | `runtime-live` | 5 | 5 | 0 | 12 | 0 |
| TaskCommentVote | `runtime-live` | 1 | 1 | 0 | 9 | 1 |
| TaskCommunication | `runtime-live` | 11 | 15 | 0 | 21 | 4 |
| TaskCommunicationEndpoint | `runtime-live` | 3 | 3 | 0 | 9 | 3 |
| TaskCommunicationSpawnSpec | `runtime-live` | 2 | 3 | 0 | 8 | 2 |
| TaskCommunicationTemplate | `runtime-live` | 1 | 1 | 0 | 10 | 1 |
| TaskCommunicationVariant | `suspicious` | 0 | 0 | 0 | 10 | 1 |
| TaskDistributionAttempt | `runtime-live` | 1 | 1 | 0 | 14 | 0 |
| TaskDistributionTarget | `generated-only` | 0 | 0 | 0 | 10 | 0 |
| TaskEdge | `core` | 8 | 8 | 0 | 9 | 4 |
| TaskExecutionArtifact | `runtime-live` | 4 | 5 | 1 | 13 | 4 |
| TaskExecutionAttempt | `runtime-live` | 10 | 10 | 1 | 20 | 3 |
| TaskFundingEvent | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| TaskFundingPayment | `runtime-live` | 6 | 6 | 0 | 13 | 0 |
| TaskFundingPledge | `runtime-live` | 5 | 5 | 0 | 16 | 0 |
| TaskFundingTarget | `runtime-live` | 9 | 9 | 2 | 10 | 0 |
| TaskImpactEstimateInput | `runtime-live` | 2 | 2 | 0 | 9 | 0 |
| TaskImpactEstimateSet | `core` | 5 | 5 | 0 | 9 | 3 |
| TaskImpactFrameEstimate | `core` | 5 | 5 | 0 | 9 | 4 |
| TaskImpactMetric | `core` | 4 | 4 | 0 | 9 | 2 |
| TaskImpactSourceArtifact | `core` | 2 | 2 | 0 | 10 | 1 |
| TaskManager | `runtime-live` | 2 | 2 | 0 | 10 | 0 |
| TaskMarketplaceListing | `runtime-live` | 1 | 1 | 0 | 13 | 0 |
| TaskPayout | `runtime-live` | 3 | 4 | 0 | 12 | 0 |
| TaskSourceArtifact | `core` | 7 | 7 | 0 | 10 | 4 |
| TaskSpawnSpec | `runtime-live` | 2 | 7 | 0 | 8 | 2 |
| TaskTrigger | `runtime-live` | 3 | 16 | 1 | 11 | 6 |
| TaskTriggerFire | `runtime-live` | 2 | 2 | 0 | 8 | 2 |
| TaskVerification | `runtime-live` | 3 | 4 | 0 | 11 | 5 |
| TrackingReminder | `tests-only` | 0 | 0 | 2 | 11 | 5 |
| TrackingReminderNotification | `tests-only` | 0 | 0 | 1 | 9 | 1 |
| Unit | `runtime-live` | 3 | 26 | 4 | 18 | 10 |
| User | `core` | 87 | 121 | 26 | 70 | 9 |
| UserPreference | `runtime-live` | 4 | 4 | 0 | 9 | 1 |
| VariableCategory | `runtime-live` | 4 | 6 | 1 | 10 | 0 |
| VariableRelationshipEvidenceEstimate | `runtime-live` | 2 | 2 | 0 | 12 | 0 |
| VerificationToken | `runtime-live` | 1 | 1 | 2 | 8 | 1 |
| WebPushSubscription | `runtime-live` | 3 | 3 | 0 | 9 | 1 |
| WishocraticAllocation | `runtime-live` | 8 | 8 | 2 | 10 | 0 |
| WishocraticDistribution | `runtime-live` | 1 | 1 | 0 | 8 | 0 |
| WishocraticEncryptedAllocation | `runtime-live` | 2 | 2 | 0 | 9 | 1 |
| WishocraticItem | `runtime-live` | 4 | 5 | 1 | 14 | 0 |
| WishocraticItemAlignmentScore | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| WishocraticItemInclusion | `runtime-live` | 4 | 4 | 1 | 10 | 0 |
| WishPoint | `runtime-live` | 2 | 2 | 0 | 9 | 1 |

### Account

- Schema: [packages/db/prisma/schema.prisma#L2095](../packages/db/prisma/schema.prisma#L2095)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `api-routes`: 1 files / 1 matches
  - `pages`: 1 files / 1 matches
  - `components`: 2 files / 3 matches
  - `runtime-libraries`: 7 files / 8 matches
  - `tests`: 3 files / 4 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 209 matches
  - `zod`: 1 files / 1 matches
  - `other`: 30 files / 38 matches
- Key files:
  - [apps/optimitron/src/app/api/social-accounts/disconnect/route.ts](../apps/optimitron/src/app/api/social-accounts/disconnect/route.ts) (2 matches)
  - [apps/optimitron/src/app/privacy/page.tsx](../apps/optimitron/src/app/privacy/page.tsx) (1 matches)
  - [apps/optimitron/src/components/donate/WaysToGiveCard.tsx](../apps/optimitron/src/components/donate/WaysToGiveCard.tsx) (2 matches)
  - [apps/optimitron/src/components/auth/AuthForm.tsx](../apps/optimitron/src/components/auth/AuthForm.tsx) (1 matches)
  - [packages/data/src/datasets/medical-data/references.json](../packages/data/src/datasets/medical-data/references.json) (2 matches)
  - [apps/optimitron/src/lib/person.server.ts](../apps/optimitron/src/lib/person.server.ts) (1 matches)
  - [packages/data/src/datasets/natural-experiments.ts](../packages/data/src/datasets/natural-experiments.ts) (1 matches)
  - [packages/data/src/fetchers/usaspending.ts](../packages/data/src/fetchers/usaspending.ts) (1 matches)
- Notes:
  - none

### Activity

- Schema: [packages/db/prisma/schema.prisma#L5499](../packages/db/prisma/schema.prisma#L5499)
- Classification: `runtime-live`
- Direct Prisma usage: 14 files / 17 matches
- Usage counts by bucket:
  - `runtime-prisma`: 14 files / 17 matches
  - `api-routes`: 6 files / 8 matches
  - `components`: 1 files / 1 matches
  - `runtime-libraries`: 53 files / 183 matches
  - `tests`: 7 files / 24 matches
  - `docs`: 5 files / 10 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 7 matches
  - `generated`: 11 files / 184 matches
  - `zod`: 1 files / 1 matches
  - `other`: 27 files / 87 matches
- Key files:
  - [apps/optimitron/src/app/api/admin/organizations/[id]/route.ts](../apps/optimitron/src/app/api/admin/organizations/[id]/route.ts) (4 matches)
  - [apps/optimitron/src/lib/content-access.server.ts](../apps/optimitron/src/lib/content-access.server.ts) (4 matches)
  - [apps/optimitron/src/lib/email/suppression.server.ts](../apps/optimitron/src/lib/email/suppression.server.ts) (4 matches)
  - [apps/optimitron/src/app/api/referendums/[slug]/vote/route.ts](../apps/optimitron/src/app/api/referendums/[slug]/vote/route.ts) (3 matches)
  - [apps/optimitron/src/lib/tasks/task-comments.server.ts](../apps/optimitron/src/lib/tasks/task-comments.server.ts) (3 matches)
  - [apps/optimitron/src/app/api/game-stats/route.ts](../apps/optimitron/src/app/api/game-stats/route.ts) (2 matches)
  - [apps/optimitron/src/app/api/social-accounts/connect-wallet/route.ts](../apps/optimitron/src/app/api/social-accounts/connect-wallet/route.ts) (2 matches)
  - [apps/optimitron/src/app/api/social-accounts/disconnect/route.ts](../apps/optimitron/src/app/api/social-accounts/disconnect/route.ts) (2 matches)
- Notes:
  - none

### AgentExecutor

- Schema: [packages/db/prisma/schema.prisma#L6559](../packages/db/prisma/schema.prisma#L6559)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 6 matches
  - `runtime-libraries`: 3 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 8 matches
  - `migrations`: 2 files / 16 matches
  - `generated`: 13 files / 278 matches
  - `zod`: 1 files / 1 matches
  - `other`: 3 files / 6 matches
- Key files:
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (10 matches)
  - [apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts](../apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/personal-planning.server.ts](../apps/optimitron/src/lib/tasks/personal-planning.server.ts) (2 matches)
  - [docs/plans/phased-approach-optimitron.md](../docs/plans/phased-approach-optimitron.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (8 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (12 matches)
  - [packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql](../packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/AgentExecutor.ts](../packages/db/src/generated/prisma/models/AgentExecutor.ts) (221 matches)
- Notes:
  - none

### AgentTaskLease

- Schema: [packages/db/prisma/schema.prisma#L10612](../packages/db/prisma/schema.prisma#L10612)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 13 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 13 matches
  - `runtime-libraries`: 2 files / 13 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 9 files / 174 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/agent-lease.server.ts](../apps/optimitron/src/lib/tasks/agent-lease.server.ts) (20 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (6 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (7 matches)
  - [packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql](../packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/AgentTaskLease.ts](../packages/db/src/generated/prisma/models/AgentTaskLease.ts) (137 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
- Notes:
  - none

### AggregateVariableRelationship

- Schema: [packages/db/prisma/schema.prisma#L3335](../packages/db/prisma/schema.prisma#L3335)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 6 files / 11 matches
  - `tests`: 2 files / 5 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 12 matches
  - `generated`: 8 files / 405 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/aggregate-relationships.server.ts](../apps/optimitron/src/lib/aggregate-relationships.server.ts) (5 matches)
  - [packages/optimizer/src/outcome-mega-study-ranking.ts](../packages/optimizer/src/outcome-mega-study-ranking.ts) (2 matches)
  - [packages/optimizer/src/statistics.ts](../packages/optimizer/src/statistics.ts) (2 matches)
  - [packages/optimizer/src/variable-relationship-runner.ts](../packages/optimizer/src/variable-relationship-runner.ts) (2 matches)
  - [packages/opg/src/bradford-hill.ts](../packages/opg/src/bradford-hill.ts) (1 matches)
  - [packages/optimizer/src/types.ts](../packages/optimizer/src/types.ts) (1 matches)
  - [packages/optimizer/src/__tests__/outcome-mega-study-ranking.test.ts](../packages/optimizer/src/__tests__/outcome-mega-study-ranking.test.ts) (3 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (2 matches)
- Notes:
  - none

### AggregationRun

- Schema: [packages/db/prisma/schema.prisma#L4286](../packages/db/prisma/schema.prisma#L4286)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 4 matches
  - `runtime-libraries`: 3 files / 8 matches
  - `tests`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 2 files / 9 matches
  - `generated`: 10 files / 195 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/aggregate-alignment.server.ts](../apps/optimitron/src/lib/aggregate-alignment.server.ts) (6 matches)
  - [apps/optimitron/src/lib/score-merkle.server.ts](../apps/optimitron/src/lib/score-merkle.server.ts) (3 matches)
  - [apps/optimitron/src/lib/score-publication.server.ts](../apps/optimitron/src/lib/score-publication.server.ts) (3 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (5 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/AggregationRun.ts](../packages/db/src/generated/prisma/models/AggregationRun.ts) (153 matches)
- Notes:
  - none

### AlignmentScore

- Schema: [packages/db/prisma/schema.prisma#L4415](../packages/db/prisma/schema.prisma#L4415)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `runtime-libraries`: 3 files / 12 matches
  - `tests`: 2 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 3 files / 10 matches
  - `generated`: 10 files / 189 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 5 matches
- Key files:
  - [apps/optimitron/src/lib/aggregate-alignment.server.ts](../apps/optimitron/src/lib/aggregate-alignment.server.ts) (10 matches)
  - [apps/optimitron/src/lib/score-publication.server.ts](../apps/optimitron/src/lib/score-publication.server.ts) (3 matches)
  - [apps/optimitron/src/lib/wishocracy-alignment.ts](../apps/optimitron/src/lib/wishocracy-alignment.ts) (3 matches)
  - [packages/wishocracy/src/__tests__/alignment.test.ts](../packages/wishocracy/src/__tests__/alignment.test.ts) (5 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (3 matches)
  - [docs/TYPE_SYSTEM.md](../docs/TYPE_SYSTEM.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (5 matches)
- Notes:
  - none

### Badge

- Schema: [packages/db/prisma/schema.prisma#L9403](../packages/db/prisma/schema.prisma#L9403)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `components`: 7 files / 24 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 8 files / 151 matches
  - `zod`: 1 files / 1 matches
  - `other`: 18 files / 119 matches
- Key files:
  - [apps/optimitron/src/lib/badges.server.ts](../apps/optimitron/src/lib/badges.server.ts) (2 matches)
  - [apps/optimitron/src/components/personhood/PersonhoodStatusBadge.tsx](../apps/optimitron/src/components/personhood/PersonhoodStatusBadge.tsx) (6 matches)
  - [apps/optimitron/src/components/shared/ParameterValue.tsx](../apps/optimitron/src/components/shared/ParameterValue.tsx) (6 matches)
  - [apps/optimitron/src/components/tasks/ApplicationReviewUI.tsx](../apps/optimitron/src/components/tasks/ApplicationReviewUI.tsx) (4 matches)
  - [apps/optimitron/src/components/ui/badge.tsx](../apps/optimitron/src/components/ui/badge.tsx) (4 matches)
  - [apps/optimitron/src/components/prize/CitizenDashboard.tsx](../apps/optimitron/src/components/prize/CitizenDashboard.tsx) (2 matches)
  - [apps/optimitron/src/components/dashboard/NotificationPreferencesCard.tsx](../apps/optimitron/src/components/dashboard/NotificationPreferencesCard.tsx) (1 matches)
  - [apps/optimitron/src/components/retroui/Badge.tsx](../apps/optimitron/src/components/retroui/Badge.tsx) (1 matches)
- Notes:
  - none

### CitizenBillVote

- Schema: [packages/db/prisma/schema.prisma#L4504](../packages/db/prisma/schema.prisma#L4504)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 5 matches
  - `api-routes`: 1 files / 2 matches
  - `pages`: 1 files / 2 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 8 matches
  - `generated`: 8 files / 178 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [apps/optimitron/src/app/api/civic/votes/route.ts](../apps/optimitron/src/app/api/civic/votes/route.ts) (4 matches)
  - [apps/optimitron/src/app/civic/votes/[identifier]/page.tsx](../apps/optimitron/src/app/civic/votes/[identifier]/page.tsx) (4 matches)
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (8 matches)
  - [packages/db/src/generated/prisma/models/CitizenBillVote.ts](../packages/db/src/generated/prisma/models/CitizenBillVote.ts) (145 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
- Notes:
  - External bill stance record. Bill metadata currently comes from the Congress fetchers rather than a first-class Prisma bill table.

### Collection

- Schema: [packages/db/prisma/schema.prisma#L6292](../packages/db/prisma/schema.prisma#L6292)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 11 matches
  - `api-routes`: 2 files / 3 matches
  - `pages`: 2 files / 2 matches
  - `runtime-libraries`: 10 files / 27 matches
  - `tests`: 2 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 10 matches
  - `migrations`: 1 files / 18 matches
  - `generated`: 13 files / 289 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/collections.server.ts](../apps/optimitron/src/lib/collections.server.ts) (25 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (2 matches)
  - [apps/optimitron/src/app/api/collections/[id]/records/[recordId]/route.ts](../apps/optimitron/src/app/api/collections/[id]/records/[recordId]/route.ts) (2 matches)
  - [apps/optimitron/src/app/api/collections/[id]/route.ts](../apps/optimitron/src/app/api/collections/[id]/route.ts) (1 matches)
  - [apps/optimitron/src/app/collections/[id]/page.tsx](../apps/optimitron/src/app/collections/[id]/page.tsx) (1 matches)
  - [apps/optimitron/src/app/search/page.tsx](../apps/optimitron/src/app/search/page.tsx) (1 matches)
  - [apps/optimitron/src/lib/developer-openapi.ts](../apps/optimitron/src/lib/developer-openapi.ts) (3 matches)
  - [apps/optimitron/src/lib/content-access.server.ts](../apps/optimitron/src/lib/content-access.server.ts) (2 matches)
- Notes:
  - none

### CollectionField

- Schema: [packages/db/prisma/schema.prisma#L6336](../packages/db/prisma/schema.prisma#L6336)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `components`: 2 files / 14 matches
  - `runtime-libraries`: 4 files / 8 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 10 files / 217 matches
- Key files:
  - [apps/optimitron/src/lib/collections.server.ts](../apps/optimitron/src/lib/collections.server.ts) (6 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (2 matches)
  - [apps/optimitron/src/components/collections/collection-records-grid.tsx](../apps/optimitron/src/components/collections/collection-records-grid.tsx) (9 matches)
  - [apps/optimitron/src/components/collections/collection-records-client.tsx](../apps/optimitron/src/components/collections/collection-records-client.tsx) (5 matches)
  - [apps/optimitron/src/lib/developer-openapi.ts](../apps/optimitron/src/lib/developer-openapi.ts) (3 matches)
  - [apps/optimitron/src/lib/content-search.server.ts](../apps/optimitron/src/lib/content-search.server.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql](../packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql) (10 matches)
- Notes:
  - none

### CollectionRecord

- Schema: [packages/db/prisma/schema.prisma#L6369](../packages/db/prisma/schema.prisma#L6369)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 18 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 18 matches
  - `components`: 2 files / 29 matches
  - `runtime-libraries`: 5 files / 19 matches
  - `schema`: 1 files / 11 matches
  - `migrations`: 1 files / 22 matches
  - `generated`: 16 files / 316 matches
- Key files:
  - [apps/optimitron/src/lib/collections.server.ts](../apps/optimitron/src/lib/collections.server.ts) (28 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (4 matches)
  - [apps/optimitron/src/lib/content-attachments.server.ts](../apps/optimitron/src/lib/content-attachments.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [apps/optimitron/src/components/collections/collection-records-grid.tsx](../apps/optimitron/src/components/collections/collection-records-grid.tsx) (20 matches)
  - [apps/optimitron/src/components/collections/collection-records-client.tsx](../apps/optimitron/src/components/collections/collection-records-client.tsx) (9 matches)
  - [apps/optimitron/src/lib/content-search.server.ts](../apps/optimitron/src/lib/content-search.server.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (11 matches)
- Notes:
  - none

### CollectionRelation

- Schema: [packages/db/prisma/schema.prisma#L6424](../packages/db/prisma/schema.prisma#L6424)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 8 matches
  - `runtime-libraries`: 3 files / 11 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 1 files / 22 matches
  - `generated`: 14 files / 267 matches
- Key files:
  - [apps/optimitron/src/lib/collections.server.ts](../apps/optimitron/src/lib/collections.server.ts) (14 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [apps/optimitron/src/lib/developer-openapi.ts](../apps/optimitron/src/lib/developer-openapi.ts) (3 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (9 matches)
  - [packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql](../packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql) (22 matches)
  - [packages/db/src/generated/prisma/models/CollectionRelation.ts](../packages/db/src/generated/prisma/models/CollectionRelation.ts) (206 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (35 matches)
  - [packages/db/src/generated/prisma/models/CollectionRecord.ts](../packages/db/src/generated/prisma/models/CollectionRecord.ts) (4 matches)
- Notes:
  - none

### CollectionView

- Schema: [packages/db/prisma/schema.prisma#L6464](../packages/db/prisma/schema.prisma#L6464)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 5 matches
  - `components`: 3 files / 9 matches
  - `runtime-libraries`: 2 files / 5 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 188 matches
- Key files:
  - [apps/optimitron/src/lib/collections.server.ts](../apps/optimitron/src/lib/collections.server.ts) (8 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (2 matches)
  - [apps/optimitron/src/components/collections/collection-records-grid.tsx](../apps/optimitron/src/components/collections/collection-records-grid.tsx) (5 matches)
  - [apps/optimitron/src/components/collections/collection-records-client.tsx](../apps/optimitron/src/components/collections/collection-records-client.tsx) (3 matches)
  - [apps/optimitron/src/components/collections/collection-column-settings.ts](../apps/optimitron/src/components/collections/collection-column-settings.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql](../packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/CollectionView.ts](../packages/db/src/generated/prisma/models/CollectionView.ts) (151 matches)
- Notes:
  - none

### CommerceEntitlement

- Schema: [packages/db/prisma/schema.prisma#L10569](../packages/db/prisma/schema.prisma#L10569)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 15 matches
  - `generated`: 12 files / 261 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (14 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/CommerceEntitlement.ts](../packages/db/src/generated/prisma/models/CommerceEntitlement.ts) (212 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### CommerceFulfillment

- Schema: [packages/db/prisma/schema.prisma#L10526](../packages/db/prisma/schema.prisma#L10526)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 7 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 7 matches
  - `api-routes`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 5 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 9 files / 233 matches
- Key files:
  - [apps/optimitron/src/lib/shirt-fulfillment.server.ts](../apps/optimitron/src/lib/shirt-fulfillment.server.ts) (10 matches)
  - [apps/optimitron/src/app/api/stripe/webhook/route.ts](../apps/optimitron/src/app/api/stripe/webhook/route.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/CommerceFulfillment.ts](../packages/db/src/generated/prisma/models/CommerceFulfillment.ts) (196 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### CommerceFulfillmentMapping

- Schema: [packages/db/prisma/schema.prisma#L10388](../packages/db/prisma/schema.prisma#L10388)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 8 files / 179 matches
- Key files:
  - [packages/db/src/managed-data/managed-commerce-catalog.ts](../packages/db/src/managed-data/managed-commerce-catalog.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (5 matches)
  - [packages/db/src/generated/prisma/models/CommerceFulfillmentMapping.ts](../packages/db/src/generated/prisma/models/CommerceFulfillmentMapping.ts) (146 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### CommerceOffer

- Schema: [packages/db/prisma/schema.prisma#L10293](../packages/db/prisma/schema.prisma#L10293)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 6 matches
  - `runtime-libraries`: 4 files / 6 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 8 matches
  - `generated`: 10 files / 241 matches
- Key files:
  - [apps/optimitron/src/lib/commerce-catalog.server.ts](../apps/optimitron/src/lib/commerce-catalog.server.ts) (4 matches)
  - [packages/db/src/managed-data/managed-commerce-catalog.ts](../packages/db/src/managed-data/managed-commerce-catalog.ts) (4 matches)
  - [apps/optimitron/src/lib/task-funding/conversion.server.ts](../apps/optimitron/src/lib/task-funding/conversion.server.ts) (2 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (7 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/CommerceOffer.ts](../packages/db/src/generated/prisma/models/CommerceOffer.ts) (198 matches)
- Notes:
  - none

### CommerceOfferVariant

- Schema: [packages/db/prisma/schema.prisma#L10339](../packages/db/prisma/schema.prisma#L10339)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 11 files / 266 matches
- Key files:
  - [packages/db/src/managed-data/managed-commerce-catalog.ts](../packages/db/src/managed-data/managed-commerce-catalog.ts) (4 matches)
  - [apps/optimitron/src/lib/commerce-catalog.server.ts](../apps/optimitron/src/lib/commerce-catalog.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (9 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/CommerceOfferVariant.ts](../packages/db/src/generated/prisma/models/CommerceOfferVariant.ts) (219 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### CommerceOrder

- Schema: [packages/db/prisma/schema.prisma#L10414](../packages/db/prisma/schema.prisma#L10414)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 23 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 23 matches
  - `api-routes`: 2 files / 8 matches
  - `runtime-libraries`: 3 files / 15 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 13 matches
  - `generated`: 9 files / 307 matches
- Key files:
  - [apps/optimitron/src/lib/task-funding/payments.server.ts](../apps/optimitron/src/lib/task-funding/payments.server.ts) (14 matches)
  - [apps/optimitron/src/app/api/stripe/create-checkout/route.ts](../apps/optimitron/src/app/api/stripe/create-checkout/route.ts) (12 matches)
  - [apps/optimitron/src/lib/shirt-fulfillment.server.ts](../apps/optimitron/src/lib/shirt-fulfillment.server.ts) (8 matches)
  - [apps/optimitron/src/lib/task-funding/escrow.server.ts](../apps/optimitron/src/lib/task-funding/escrow.server.ts) (8 matches)
  - [apps/optimitron/src/app/api/stripe/webhook/route.ts](../apps/optimitron/src/app/api/stripe/webhook/route.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (12 matches)
  - [packages/db/prisma/migrations/20260701120000_add_task_funding_payments_and_payouts/migration.sql](../packages/db/prisma/migrations/20260701120000_add_task_funding_payments_and_payouts/migration.sql) (1 matches)
- Notes:
  - none

### CommerceOrderItem

- Schema: [packages/db/prisma/schema.prisma#L10479](../packages/db/prisma/schema.prisma#L10479)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 11 matches
  - `generated`: 12 files / 287 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (11 matches)
  - [packages/db/src/generated/prisma/models/CommerceOrderItem.ts](../packages/db/src/generated/prisma/models/CommerceOrderItem.ts) (238 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts](../packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### Conflict

- Schema: [packages/db/prisma/schema.prisma#L1357](../packages/db/prisma/schema.prisma#L1357)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 4 matches
  - `api-routes`: 2 files / 2 matches
  - `pages`: 1 files / 1 matches
  - `components`: 1 files / 1 matches
  - `runtime-libraries`: 9 files / 49 matches
  - `scripts`: 2 files / 2 matches
  - `tests`: 2 files / 2 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 9 files / 200 matches
  - `zod`: 1 files / 1 matches
  - `other`: 5 files / 14 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (5 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (3 matches)
  - [apps/optimitron/src/app/api/conflicts/search/route.ts](../apps/optimitron/src/app/api/conflicts/search/route.ts) (2 matches)
  - [apps/optimitron/src/app/api/tasks/[id]/pledge/route.ts](../apps/optimitron/src/app/api/tasks/[id]/pledge/route.ts) (1 matches)
  - [apps/optimitron/src/app/agencies/ddod/page.tsx](../apps/optimitron/src/app/agencies/ddod/page.tsx) (1 matches)
  - [apps/optimitron/src/components/people/RepresentedPersonForm.tsx](../apps/optimitron/src/components/people/RepresentedPersonForm.tsx) (1 matches)
  - [packages/data/src/parameters/parameters-calculations-citations.ts](../packages/data/src/parameters/parameters-calculations-citations.ts) (24 matches)
  - [packages/data/src/datasets/medical-data/references.json](../packages/data/src/datasets/medical-data/references.json) (10 matches)
- Notes:
  - none

### ContentAccessGrant

- Schema: [packages/db/prisma/schema.prisma#L6492](../packages/db/prisma/schema.prisma#L6492)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 6 matches
  - `runtime-libraries`: 1 files / 6 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 16 matches
  - `generated`: 11 files / 230 matches
- Key files:
  - [apps/optimitron/src/lib/content-access.server.ts](../apps/optimitron/src/lib/content-access.server.ts) (12 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql](../packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql) (16 matches)
  - [packages/db/src/generated/prisma/models/ContentAccessGrant.ts](../packages/db/src/generated/prisma/models/ContentAccessGrant.ts) (181 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### ContentAttachment

- Schema: [packages/db/prisma/schema.prisma#L6524](../packages/db/prisma/schema.prisma#L6524)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 16 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 16 matches
  - `runtime-libraries`: 3 files / 15 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 12 matches
  - `generated`: 12 files / 260 matches
- Key files:
  - [apps/optimitron/src/lib/content-attachments.server.ts](../apps/optimitron/src/lib/content-attachments.server.ts) (26 matches)
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (2 matches)
  - [apps/optimitron/src/lib/content-export.server.ts](../apps/optimitron/src/lib/content-export.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts](../apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts) (2 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql](../packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql) (11 matches)
  - [packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql](../packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql) (1 matches)
- Notes:
  - none

### ContentReport

- Schema: [packages/db/prisma/schema.prisma#L10850](../packages/db/prisma/schema.prisma#L10850)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 8 matches
  - `generated`: 8 files / 223 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 4 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (4 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (8 matches)
  - [packages/db/src/generated/prisma/models/ContentReport.ts](../packages/db/src/generated/prisma/models/ContentReport.ts) (186 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### CourtCase

- Schema: [packages/db/prisma/schema.prisma#L4855](../packages/db/prisma/schema.prisma#L4855)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 6 matches
  - `runtime-libraries`: 3 files / 8 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 12 matches
  - `migrations`: 2 files / 25 matches
  - `generated`: 11 files / 321 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 4 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (8 matches)
  - [packages/db/src/managed-data/managed-humanity-v-government.ts](../packages/db/src/managed-data/managed-humanity-v-government.ts) (4 matches)
  - [packages/db/src/managed-data/managed-famous-disease-deaths.ts](../packages/db/src/managed-data/managed-famous-disease-deaths.ts) (2 matches)
  - [apps/courtofhumanity/tests/integration/court-data.test.ts](../apps/courtofhumanity/tests/integration/court-data.test.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (12 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (22 matches)
  - [packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql](../packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql) (3 matches)
- Notes:
  - none

### CourtCaseClaim

- Schema: [packages/db/prisma/schema.prisma#L4998](../packages/db/prisma/schema.prisma#L4998)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 13 matches
  - `generated`: 13 files / 261 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (13 matches)
  - [packages/db/src/generated/prisma/models/CourtCaseClaim.ts](../packages/db/src/generated/prisma/models/CourtCaseClaim.ts) (208 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (31 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### CourtCaseEvidence

- Schema: [packages/db/prisma/schema.prisma#L5154](../packages/db/prisma/schema.prisma#L5154)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 10 matches
  - `migrations`: 1 files / 21 matches
  - `generated`: 14 files / 332 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 7 matches
- Key files:
  - [packages/db/src/managed-data/managed-famous-disease-deaths.ts](../packages/db/src/managed-data/managed-famous-disease-deaths.ts) (4 matches)
  - [packages/db/src/constants.ts](../packages/db/src/constants.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (10 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (21 matches)
  - [packages/db/src/generated/prisma/models/CourtCaseEvidence.ts](../packages/db/src/generated/prisma/models/CourtCaseEvidence.ts) (271 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (37 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### CourtCaseHarm

- Schema: [packages/db/prisma/schema.prisma#L5063](../packages/db/prisma/schema.prisma#L5063)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 17 matches
  - `generated`: 13 files / 305 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (17 matches)
  - [packages/db/src/generated/prisma/models/CourtCaseHarm.ts](../packages/db/src/generated/prisma/models/CourtCaseHarm.ts) (252 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (31 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### CourtCaseParty

- Schema: [packages/db/prisma/schema.prisma#L4927](../packages/db/prisma/schema.prisma#L4927)
- Classification: `runtime-live`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 12 matches
  - `generated`: 11 files / 242 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 5 matches
- Key files:
  - [apps/optimitron/src/lib/people-dedup.server.ts](../apps/optimitron/src/lib/people-dedup.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (12 matches)
  - [packages/db/src/generated/prisma/models/CourtCaseParty.ts](../packages/db/src/generated/prisma/models/CourtCaseParty.ts) (197 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (27 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### CourtCaseRemedy

- Schema: [packages/db/prisma/schema.prisma#L5252](../packages/db/prisma/schema.prisma#L5252)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 16 matches
  - `generated`: 12 files / 285 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (15 matches)
  - [packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql](../packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/CourtCaseRemedy.ts](../packages/db/src/generated/prisma/models/CourtCaseRemedy.ts) (236 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### DatingBlock

- Schema: [packages/db/prisma/schema.prisma#L10169](../packages/db/prisma/schema.prisma#L10169)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 163 matches
- Key files:
  - [apps/optimitron/src/lib/dating.server.ts](../apps/optimitron/src/lib/dating.server.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (6 matches)
  - [packages/db/src/generated/prisma/models/DatingBlock.ts](../packages/db/src/generated/prisma/models/DatingBlock.ts) (126 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### DatingConversation

- Schema: [packages/db/prisma/schema.prisma#L10075](../packages/db/prisma/schema.prisma#L10075)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 4 matches
  - `runtime-libraries`: 1 files / 4 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 165 matches
- Key files:
  - [apps/optimitron/src/lib/dating.server.ts](../apps/optimitron/src/lib/dating.server.ts) (8 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/DatingConversation.ts](../packages/db/src/generated/prisma/models/DatingConversation.ts) (126 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### DatingDatePlan

- Schema: [packages/db/prisma/schema.prisma#L10122](../packages/db/prisma/schema.prisma#L10122)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 14 matches
  - `generated`: 12 files / 295 matches
- Key files:
  - [apps/optimitron/src/lib/dating.server.ts](../apps/optimitron/src/lib/dating.server.ts) (4 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (14 matches)
  - [packages/db/src/generated/prisma/models/DatingDatePlan.ts](../packages/db/src/generated/prisma/models/DatingDatePlan.ts) (242 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (31 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### DatingInteraction

- Schema: [packages/db/prisma/schema.prisma#L10023](../packages/db/prisma/schema.prisma#L10023)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 8 files / 173 matches
- Key files:
  - [apps/optimitron/src/lib/dating.server.ts](../apps/optimitron/src/lib/dating.server.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/DatingInteraction.ts](../packages/db/src/generated/prisma/models/DatingInteraction.ts) (136 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### DatingMatch

- Schema: [packages/db/prisma/schema.prisma#L10047](../packages/db/prisma/schema.prisma#L10047)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 5 matches
  - `runtime-libraries`: 1 files / 5 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 10 files / 200 matches
- Key files:
  - [apps/optimitron/src/lib/dating.server.ts](../apps/optimitron/src/lib/dating.server.ts) (10 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (10 matches)
  - [packages/db/src/generated/prisma/models/DatingMatch.ts](../packages/db/src/generated/prisma/models/DatingMatch.ts) (153 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (28 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (4 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (3 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (3 matches)
- Notes:
  - none

### DatingMatchScore

- Schema: [packages/db/prisma/schema.prisma#L9990](../packages/db/prisma/schema.prisma#L9990)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 8 files / 198 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/DatingMatchScore.ts](../packages/db/src/generated/prisma/models/DatingMatchScore.ts) (161 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### DatingMessage

- Schema: [packages/db/prisma/schema.prisma#L10094](../packages/db/prisma/schema.prisma#L10094)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 8 matches
  - `generated`: 10 files / 188 matches
- Key files:
  - [apps/optimitron/src/lib/dating.server.ts](../apps/optimitron/src/lib/dating.server.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (8 matches)
  - [packages/db/src/generated/prisma/models/DatingMessage.ts](../packages/db/src/generated/prisma/models/DatingMessage.ts) (147 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### DatingPreference

- Schema: [packages/db/prisma/schema.prisma#L9967](../packages/db/prisma/schema.prisma#L9967)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 164 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (6 matches)
  - [packages/db/src/generated/prisma/models/DatingPreference.ts](../packages/db/src/generated/prisma/models/DatingPreference.ts) (131 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts](../packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### DatingProfile

- Schema: [packages/db/prisma/schema.prisma#L9771](../packages/db/prisma/schema.prisma#L9771)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 8 matches
  - `runtime-libraries`: 1 files / 8 matches
  - `schema`: 1 files / 19 matches
  - `migrations`: 1 files / 24 matches
  - `generated`: 10 files / 359 matches
- Key files:
  - [apps/optimitron/src/lib/dating.server.ts](../apps/optimitron/src/lib/dating.server.ts) (16 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (19 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (24 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (288 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (55 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### DatingProfilePhoto

- Schema: [packages/db/prisma/schema.prisma#L9834](../packages/db/prisma/schema.prisma#L9834)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 208 matches
- Key files:
  - [apps/optimitron/src/lib/dating.server.ts](../apps/optimitron/src/lib/dating.server.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/DatingProfilePhoto.ts](../packages/db/src/generated/prisma/models/DatingProfilePhoto.ts) (171 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### DatingPrompt

- Schema: [packages/db/prisma/schema.prisma#L9865](../packages/db/prisma/schema.prisma#L9865)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 7 files / 167 matches
- Key files:
  - [packages/db/src/managed-data/managed-dating-catalog.ts](../packages/db/src/managed-data/managed-dating-catalog.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (5 matches)
  - [packages/db/src/generated/prisma/models/DatingPrompt.ts](../packages/db/src/generated/prisma/models/DatingPrompt.ts) (136 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### DatingPromptAnswer

- Schema: [packages/db/prisma/schema.prisma#L9886](../packages/db/prisma/schema.prisma#L9886)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 168 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/DatingPromptAnswer.ts](../packages/db/src/generated/prisma/models/DatingPromptAnswer.ts) (131 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts](../packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### DatingQuestion

- Schema: [packages/db/prisma/schema.prisma#L9911](../packages/db/prisma/schema.prisma#L9911)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 2 matches
  - `runtime-libraries`: 2 files / 2 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 7 files / 179 matches
- Key files:
  - [apps/optimitron/src/lib/dating.server.ts](../apps/optimitron/src/lib/dating.server.ts) (2 matches)
  - [packages/db/src/managed-data/managed-dating-catalog.ts](../packages/db/src/managed-data/managed-dating-catalog.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (5 matches)
  - [packages/db/src/generated/prisma/models/DatingQuestion.ts](../packages/db/src/generated/prisma/models/DatingQuestion.ts) (148 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### DatingQuestionAnswer

- Schema: [packages/db/prisma/schema.prisma#L9938](../packages/db/prisma/schema.prisma#L9938)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 8 matches
  - `generated`: 9 files / 188 matches
- Key files:
  - [apps/optimitron/src/lib/dating.server.ts](../apps/optimitron/src/lib/dating.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (8 matches)
  - [packages/db/src/generated/prisma/models/DatingQuestionAnswer.ts](../packages/db/src/generated/prisma/models/DatingQuestionAnswer.ts) (151 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### DatingSafetyReport

- Schema: [packages/db/prisma/schema.prisma#L10189](../packages/db/prisma/schema.prisma#L10189)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 13 matches
  - `generated`: 11 files / 250 matches
- Key files:
  - [apps/optimitron/src/lib/dating.server.ts](../apps/optimitron/src/lib/dating.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (13 matches)
  - [packages/db/src/generated/prisma/models/DatingSafetyReport.ts](../packages/db/src/generated/prisma/models/DatingSafetyReport.ts) (201 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### Document

- Schema: [packages/db/prisma/schema.prisma#L6168](../packages/db/prisma/schema.prisma#L6168)
- Classification: `runtime-live`
- Direct Prisma usage: 6 files / 20 matches
- Usage counts by bucket:
  - `runtime-prisma`: 6 files / 20 matches
  - `pages`: 2 files / 2 matches
  - `components`: 5 files / 6 matches
  - `runtime-libraries`: 12 files / 37 matches
  - `scripts`: 1 files / 3 matches
  - `tests`: 4 files / 15 matches
  - `docs`: 3 files / 5 matches
  - `schema`: 1 files / 14 matches
  - `migrations`: 3 files / 43 matches
  - `generated`: 16 files / 341 matches
  - `other`: 6 files / 7 matches
- Key files:
  - [apps/optimitron/src/lib/documents.server.ts](../apps/optimitron/src/lib/documents.server.ts) (21 matches)
  - [apps/optimitron/src/lib/tasks/document-review.server.ts](../apps/optimitron/src/lib/tasks/document-review.server.ts) (13 matches)
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (6 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (4 matches)
  - [apps/optimitron/src/lib/tasks/private-work-portability.server.ts](../apps/optimitron/src/lib/tasks/private-work-portability.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [apps/optimitron/src/app/documents/[id]/page.tsx](../apps/optimitron/src/app/documents/[id]/page.tsx) (1 matches)
  - [apps/optimitron/src/app/search/page.tsx](../apps/optimitron/src/app/search/page.tsx) (1 matches)
- Notes:
  - none

### DocumentRevision

- Schema: [packages/db/prisma/schema.prisma#L6250](../packages/db/prisma/schema.prisma#L6250)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 12 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 12 matches
  - `runtime-libraries`: 5 files / 12 matches
  - `scripts`: 1 files / 1 matches
  - `tests`: 1 files / 1 matches
  - `docs`: 2 files / 3 matches
  - `schema`: 1 files / 8 matches
  - `migrations`: 3 files / 17 matches
  - `generated`: 12 files / 231 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/document-review.server.ts](../apps/optimitron/src/lib/tasks/document-review.server.ts) (10 matches)
  - [apps/optimitron/src/lib/documents.server.ts](../apps/optimitron/src/lib/documents.server.ts) (8 matches)
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts](../apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts) (2 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (2 matches)
  - [apps/optimitron/src/lib/content-search.server.ts](../apps/optimitron/src/lib/content-search.server.ts) (1 matches)
  - [apps/optimitron/src/lib/__tests__/content-search.server.test.ts](../apps/optimitron/src/lib/__tests__/content-search.server.test.ts) (1 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (2 matches)
- Notes:
  - none

### EmailLog

- Schema: [packages/db/prisma/schema.prisma#L9506](../packages/db/prisma/schema.prisma#L9506)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 13 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 13 matches
  - `runtime-libraries`: 13 files / 32 matches
  - `scripts`: 2 files / 2 matches
  - `docs`: 5 files / 8 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 6 files / 22 matches
  - `generated`: 10 files / 246 matches
  - `zod`: 1 files / 1 matches
  - `other`: 6 files / 14 matches
- Key files:
  - [apps/optimitron/src/lib/email/resend-webhook.ts](../apps/optimitron/src/lib/email/resend-webhook.ts) (16 matches)
  - [apps/optimitron/src/lib/tasks/task-notifications.server.ts](../apps/optimitron/src/lib/tasks/task-notifications.server.ts) (5 matches)
  - [apps/optimitron/src/lib/admin-communications.server.ts](../apps/optimitron/src/lib/admin-communications.server.ts) (4 matches)
  - [apps/optimitron/src/lib/email/email-log.server.ts](../apps/optimitron/src/lib/email/email-log.server.ts) (4 matches)
  - [apps/optimitron/src/lib/email/send-deduped-email.server.ts](../apps/optimitron/src/lib/email/send-deduped-email.server.ts) (3 matches)
  - [apps/optimitron/src/lib/task-funding/escrow.server.ts](../apps/optimitron/src/lib/task-funding/escrow.server.ts) (3 matches)
  - [apps/optimitron/src/lib/email/suppression.server.ts](../apps/optimitron/src/lib/email/suppression.server.ts) (2 matches)
  - [apps/optimitron/src/lib/email/task-funding-pledge-confirmation-email.ts](../apps/optimitron/src/lib/email/task-funding-pledge-confirmation-email.ts) (2 matches)
- Notes:
  - none

### ExternalActionRequest

- Schema: [packages/db/prisma/schema.prisma#L6915](../packages/db/prisma/schema.prisma#L6915)
- Classification: `runtime-live`
- Direct Prisma usage: 6 files / 20 matches
- Usage counts by bucket:
  - `runtime-prisma`: 6 files / 20 matches
  - `runtime-libraries`: 10 files / 26 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 3 files / 3 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 2 files / 20 matches
  - `generated`: 12 files / 332 matches
  - `other`: 2 files / 5 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/external-action.server.ts](../apps/optimitron/src/lib/tasks/external-action.server.ts) (26 matches)
  - [apps/optimitron/src/lib/email/outbound-authorization.server.ts](../apps/optimitron/src/lib/email/outbound-authorization.server.ts) (4 matches)
  - [apps/optimitron/src/lib/email/outbound-message-dispatch.server.ts](../apps/optimitron/src/lib/email/outbound-message-dispatch.server.ts) (4 matches)
  - [apps/optimitron/src/lib/weekly-metrics.server.ts](../apps/optimitron/src/lib/weekly-metrics.server.ts) (4 matches)
  - [apps/optimitron/src/lib/mcp-tools/private-execution.ts](../apps/optimitron/src/lib/mcp-tools/private-execution.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [apps/optimitron/src/lib/email/outbound-message-approval.server.ts](../apps/optimitron/src/lib/email/outbound-message-approval.server.ts) (1 matches)
  - [apps/optimitron/src/lib/email/resend.ts](../apps/optimitron/src/lib/email/resend.ts) (1 matches)
- Notes:
  - none

### Form

- Schema: [packages/db/prisma/schema.prisma#L9162](../packages/db/prisma/schema.prisma#L9162)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `components`: 3 files / 5 matches
  - `runtime-libraries`: 10 files / 39 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 2 files / 9 matches
  - `docs`: 3 files / 4 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 18 matches
  - `generated`: 12 files / 270 matches
  - `zod`: 1 files / 1 matches
  - `other`: 17 files / 34 matches
- Key files:
  - [apps/optimitron/src/lib/form-responses.server.ts](../apps/optimitron/src/lib/form-responses.server.ts) (21 matches)
  - [apps/optimitron/src/components/donate/WaysToGiveCard.tsx](../apps/optimitron/src/components/donate/WaysToGiveCard.tsx) (3 matches)
  - [apps/optimitron/src/components/demo/slides/sierra/slide-trial-acceleration-12x.tsx](../apps/optimitron/src/components/demo/slides/sierra/slide-trial-acceleration-12x.tsx) (1 matches)
  - [apps/optimitron/src/components/prize/VoterPrizeTreasuryDeposit.tsx](../apps/optimitron/src/components/prize/VoterPrizeTreasuryDeposit.tsx) (1 matches)
  - [packages/data/src/datasets/medical-data/references.json](../packages/data/src/datasets/medical-data/references.json) (11 matches)
  - [packages/data/src/datasets/medical-data/treatments/irritable-bowel-syndrome.json](../packages/data/src/datasets/medical-data/treatments/irritable-bowel-syndrome.json) (2 matches)
  - [apps/optimitron/src/lib/mcp-tools/form-responses.ts](../apps/optimitron/src/lib/mcp-tools/form-responses.ts) (1 matches)
  - [apps/optimitron/src/lib/nonprofit-identity.ts](../apps/optimitron/src/lib/nonprofit-identity.ts) (1 matches)
- Notes:
  - none

### FormField

- Schema: [packages/db/prisma/schema.prisma#L9262](../packages/db/prisma/schema.prisma#L9262)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `components`: 3 files / 55 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 9 files / 221 matches
  - `zod`: 1 files / 1 matches
  - `other`: 3 files / 12 matches
- Key files:
  - [apps/optimitron/src/lib/form-responses.server.ts](../apps/optimitron/src/lib/form-responses.server.ts) (4 matches)
  - [apps/optimitron/src/components/profile/ProfileSnapshotForm.tsx](../apps/optimitron/src/components/profile/ProfileSnapshotForm.tsx) (51 matches)
  - [apps/optimitron/src/components/profile/DailyCheckInCard.tsx](../apps/optimitron/src/components/profile/DailyCheckInCard.tsx) (3 matches)
  - [apps/optimitron/src/components/ui/form-field.tsx](../apps/optimitron/src/components/ui/form-field.tsx) (1 matches)
  - [apps/optimitron/scripts/verify-preview-masking.mjs](../apps/optimitron/scripts/verify-preview-masking.mjs) (2 matches)
  - [apps/trialabundancesurvey/tests/e2e/auth-email.spec.ts](../apps/trialabundancesurvey/tests/e2e/auth-email.spec.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
- Notes:
  - none

### FormResponse

- Schema: [packages/db/prisma/schema.prisma#L9369](../packages/db/prisma/schema.prisma#L9369)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 12 matches
  - `generated`: 12 files / 225 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/form-responses.server.ts](../apps/optimitron/src/lib/form-responses.server.ts) (2 matches)
  - [apps/optimitron/scripts/verify-preview-masking.mjs](../apps/optimitron/scripts/verify-preview-masking.mjs) (2 matches)
  - [apps/trialabundancesurvey/tests/e2e/auth-email.spec.ts](../apps/trialabundancesurvey/tests/e2e/auth-email.spec.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql](../packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql) (12 matches)
  - [packages/db/src/generated/prisma/models/FormResponse.ts](../packages/db/src/generated/prisma/models/FormResponse.ts) (176 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
- Notes:
  - none

### FormRevision

- Schema: [packages/db/prisma/schema.prisma#L9203](../packages/db/prisma/schema.prisma#L9203)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 3 matches
  - `runtime-libraries`: 1 files / 3 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 8 matches
  - `migrations`: 1 files / 15 matches
  - `generated`: 10 files / 241 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [apps/optimitron/src/lib/form-responses.server.ts](../apps/optimitron/src/lib/form-responses.server.ts) (6 matches)
  - [docs/PRD.md](../docs/PRD.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (8 matches)
  - [packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql](../packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql) (15 matches)
  - [packages/db/src/generated/prisma/models/FormRevision.ts](../packages/db/src/generated/prisma/models/FormRevision.ts) (190 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (33 matches)
  - [packages/db/src/generated/prisma/models/Form.ts](../packages/db/src/generated/prisma/models/Form.ts) (4 matches)
- Notes:
  - none

### FormSection

- Schema: [packages/db/prisma/schema.prisma#L9238](../packages/db/prisma/schema.prisma#L9238)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 179 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql](../packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/FormSection.ts](../packages/db/src/generated/prisma/models/FormSection.ts) (142 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### FormSubmission

- Schema: [packages/db/prisma/schema.prisma#L9326](../packages/db/prisma/schema.prisma#L9326)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 10 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 10 matches
  - `runtime-libraries`: 2 files / 10 matches
  - `tests`: 1 files / 1 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 1 files / 20 matches
  - `generated`: 13 files / 290 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/form-responses.server.ts](../apps/optimitron/src/lib/form-responses.server.ts) (10 matches)
  - [apps/optimitron/src/lib/tasks/external-action.server.ts](../apps/optimitron/src/lib/tasks/external-action.server.ts) (10 matches)
  - [apps/trialabundancesurvey/tests/e2e/auth-email.spec.ts](../apps/trialabundancesurvey/tests/e2e/auth-email.spec.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (9 matches)
  - [packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql](../packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql) (20 matches)
  - [packages/db/src/generated/prisma/models/FormSubmission.ts](../packages/db/src/generated/prisma/models/FormSubmission.ts) (231 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (35 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
- Notes:
  - none

### GlobalVariable

- Schema: [packages/db/prisma/schema.prisma#L2400](../packages/db/prisma/schema.prisma#L2400)
- Classification: `runtime-live`
- Direct Prisma usage: 7 files / 13 matches
- Usage counts by bucket:
  - `runtime-prisma`: 7 files / 13 matches
  - `api-routes`: 2 files / 3 matches
  - `runtime-libraries`: 9 files / 22 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 3 files / 5 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 37 matches
  - `migrations`: 3 files / 29 matches
  - `generated`: 21 files / 544 matches
  - `zod`: 1 files / 1 matches
  - `other`: 8 files / 29 matches
- Key files:
  - [apps/optimitron/src/lib/profile.server.ts](../apps/optimitron/src/lib/profile.server.ts) (8 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (7 matches)
  - [apps/optimitron/src/lib/measurement-summaries-backfill.server.ts](../apps/optimitron/src/lib/measurement-summaries-backfill.server.ts) (5 matches)
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (4 matches)
  - [apps/optimitron/src/app/api/health-analysis/submit/route.ts](../apps/optimitron/src/app/api/health-analysis/submit/route.ts) (3 matches)
  - [apps/optimitron/src/app/api/conditions/search/route.ts](../apps/optimitron/src/app/api/conditions/search/route.ts) (2 matches)
  - [apps/optimitron/src/lib/global-variable-lookup.server.ts](../apps/optimitron/src/lib/global-variable-lookup.server.ts) (2 matches)
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (3 matches)
- Notes:
  - none

### GlobalVariableExternalCode

- Schema: [packages/db/prisma/schema.prisma#L2558](../packages/db/prisma/schema.prisma#L2558)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `runtime-libraries`: 2 files / 4 matches
  - `tests`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 8 matches
  - `generated`: 9 files / 188 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (6 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (8 matches)
  - [packages/db/src/generated/prisma/models/GlobalVariableExternalCode.ts](../packages/db/src/generated/prisma/models/GlobalVariableExternalCode.ts) (151 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### IntegrationConnection

- Schema: [packages/db/prisma/schema.prisma#L3774](../packages/db/prisma/schema.prisma#L3774)
- Classification: `tests-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `tests`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 2 files / 9 matches
  - `generated`: 11 files / 226 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (8 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/IntegrationConnection.ts](../packages/db/src/generated/prisma/models/IntegrationConnection.ts) (179 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### IntegrationProvider

- Schema: [packages/db/prisma/schema.prisma#L3712](../packages/db/prisma/schema.prisma#L3712)
- Classification: `tests-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `tests`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 6 matches
  - `generated`: 10 files / 218 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (4 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/IntegrationProvider.ts](../packages/db/src/generated/prisma/models/IntegrationProvider.ts) (176 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (27 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### IntegrationSyncLog

- Schema: [packages/db/prisma/schema.prisma#L3833](../packages/db/prisma/schema.prisma#L3833)
- Classification: `tests-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `tests`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 4 matches
  - `generated`: 8 files / 174 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/IntegrationSyncLog.ts](../packages/db/src/generated/prisma/models/IntegrationSyncLog.ts) (141 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### InterventionApprovalTimeline

- Schema: [packages/db/prisma/schema.prisma#L1632](../packages/db/prisma/schema.prisma#L1632)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 6 matches
  - `runtime-libraries`: 3 files / 7 matches
  - `scripts`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 10 files / 284 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (8 matches)
  - [apps/optimitron/src/lib/efficacy-lag-matcher.server.ts](../apps/optimitron/src/lib/efficacy-lag-matcher.server.ts) (3 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [apps/optimitron/scripts/recompute-efficacy-lag.ts](../apps/optimitron/scripts/recompute-efficacy-lag.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (6 matches)
  - [packages/db/src/generated/prisma/models/InterventionApprovalTimeline.ts](../packages/db/src/generated/prisma/models/InterventionApprovalTimeline.ts) (237 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
- Notes:
  - none

### InterventionExperience

- Schema: [packages/db/prisma/schema.prisma#L2869](../packages/db/prisma/schema.prisma#L2869)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 3 matches
  - `docs`: 3 files / 5 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 12 files / 285 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (5 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (2 matches)
  - [docs/PRD.md](../docs/PRD.md) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (9 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/InterventionExperience.ts](../packages/db/src/generated/prisma/models/InterventionExperience.ts) (228 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (35 matches)
- Notes:
  - none

### InterventionExperienceOutcome

- Schema: [packages/db/prisma/schema.prisma#L2933](../packages/db/prisma/schema.prisma#L2933)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 11 files / 235 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (6 matches)
  - [packages/db/src/generated/prisma/models/InterventionExperienceOutcome.ts](../packages/db/src/generated/prisma/models/InterventionExperienceOutcome.ts) (186 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/models/Measurement.ts](../packages/db/src/generated/prisma/models/Measurement.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### InterventionExperienceSideEffect

- Schema: [packages/db/prisma/schema.prisma#L2982](../packages/db/prisma/schema.prisma#L2982)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 9 files / 193 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/InterventionExperienceSideEffect.ts](../packages/db/src/generated/prisma/models/InterventionExperienceSideEffect.ts) (156 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### InterventionRankingRun

- Schema: [packages/db/prisma/schema.prisma#L3603](../packages/db/prisma/schema.prisma#L3603)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 10 files / 210 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (10 matches)
  - [packages/db/src/generated/prisma/models/InterventionRankingRun.ts](../packages/db/src/generated/prisma/models/InterventionRankingRun.ts) (167 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (26 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (3 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (3 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### Jurisdiction

- Schema: [packages/db/prisma/schema.prisma#L3876](../packages/db/prisma/schema.prisma#L3876)
- Classification: `runtime-live`
- Direct Prisma usage: 6 files / 10 matches
- Usage counts by bucket:
  - `runtime-prisma`: 6 files / 10 matches
  - `components`: 1 files / 1 matches
  - `runtime-libraries`: 19 files / 37 matches
  - `scripts`: 2 files / 2 matches
  - `tests`: 5 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 35 matches
  - `migrations`: 10 files / 31 matches
  - `generated`: 30 files / 426 matches
  - `zod`: 1 files / 1 matches
  - `other`: 6 files / 6 matches
- Key files:
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (8 matches)
  - [apps/optimitron/src/lib/aggregate-alignment.server.ts](../apps/optimitron/src/lib/aggregate-alignment.server.ts) (5 matches)
  - [apps/optimitron/scripts/import-treaty-policy-model.ts](../apps/optimitron/scripts/import-treaty-policy-model.ts) (2 matches)
  - [apps/optimitron/src/lib/alignment-politicians.server.ts](../apps/optimitron/src/lib/alignment-politicians.server.ts) (2 matches)
  - [apps/optimitron/src/lib/jurisdiction-search.server.ts](../apps/optimitron/src/lib/jurisdiction-search.server.ts) (2 matches)
  - [packages/db/src/wishocracy-catalog.ts](../packages/db/src/wishocracy-catalog.ts) (2 matches)
  - [apps/optimitron/src/components/scoreboard/PoliticianAlignmentDashboard.tsx](../apps/optimitron/src/components/scoreboard/PoliticianAlignmentDashboard.tsx) (1 matches)
  - [packages/obg/src/country-report.ts](../packages/obg/src/country-report.ts) (4 matches)
- Notes:
  - none

### KnowledgeAnswer

- Schema: [packages/db/prisma/schema.prisma#L9295](../packages/db/prisma/schema.prisma#L9295)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 5 matches
  - `runtime-libraries`: 1 files / 6 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 3 files / 3 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 11 matches
  - `generated`: 11 files / 206 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [apps/optimitron/src/lib/form-responses.server.ts](../apps/optimitron/src/lib/form-responses.server.ts) (11 matches)
  - [apps/optimitron/scripts/verify-preview-masking.mjs](../apps/optimitron/scripts/verify-preview-masking.mjs) (2 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [docs/PRD.md](../docs/PRD.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql](../packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql) (11 matches)
  - [packages/db/src/generated/prisma/models/KnowledgeAnswer.ts](../packages/db/src/generated/prisma/models/KnowledgeAnswer.ts) (161 matches)
- Notes:
  - none

### McpToolCallAudit

- Schema: [packages/db/prisma/schema.prisma#L10785](../packages/db/prisma/schema.prisma#L10785)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 12 matches
  - `generated`: 10 files / 242 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (12 matches)
  - [packages/db/src/generated/prisma/models/McpToolCallAudit.ts](../packages/db/src/generated/prisma/models/McpToolCallAudit.ts) (201 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### Measurement

- Schema: [packages/db/prisma/schema.prisma#L2773](../packages/db/prisma/schema.prisma#L2773)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 6 matches
  - `runtime-libraries`: 14 files / 32 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 8 files / 28 matches
  - `docs`: 6 files / 18 matches
  - `schema`: 1 files / 18 matches
  - `migrations`: 3 files / 30 matches
  - `generated`: 15 files / 301 matches
  - `zod`: 1 files / 2 matches
  - `other`: 10 files / 31 matches
- Key files:
  - [apps/optimitron/src/lib/profile.server.ts](../apps/optimitron/src/lib/profile.server.ts) (10 matches)
  - [apps/optimitron/src/lib/census-aggregation.server.ts](../apps/optimitron/src/lib/census-aggregation.server.ts) (2 matches)
  - [packages/data/src/importers/types.ts](../packages/data/src/importers/types.ts) (4 matches)
  - [packages/optimizer/src/temporal-alignment.ts](../packages/optimizer/src/temporal-alignment.ts) (4 matches)
  - [packages/optimizer/src/types.ts](../packages/optimizer/src/types.ts) (4 matches)
  - [packages/data/src/importers/standard-variable-names.ts](../packages/data/src/importers/standard-variable-names.ts) (3 matches)
  - [apps/optimitron/src/lib/measurement-summaries-backfill.server.ts](../apps/optimitron/src/lib/measurement-summaries-backfill.server.ts) (2 matches)
  - [packages/data/src/pipelines/fetch-country-timeseries.ts](../packages/data/src/pipelines/fetch-country-timeseries.ts) (2 matches)
- Notes:
  - none

### NOf1Variable

- Schema: [packages/db/prisma/schema.prisma#L2666](../packages/db/prisma/schema.prisma#L2666)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `runtime-libraries`: 3 files / 6 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 3 files / 4 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 2 files / 17 matches
  - `generated`: 12 files / 298 matches
  - `zod`: 1 files / 1 matches
  - `other`: 7 files / 30 matches
- Key files:
  - [apps/optimitron/src/lib/measurement-summaries-backfill.server.ts](../apps/optimitron/src/lib/measurement-summaries-backfill.server.ts) (5 matches)
  - [apps/optimitron/src/lib/profile.server.ts](../apps/optimitron/src/lib/profile.server.ts) (2 matches)
  - [packages/data/src/variable-statistics.ts](../packages/data/src/variable-statistics.ts) (2 matches)
  - [apps/optimitron/scripts/backfill-measurement-summaries.ts](../apps/optimitron/scripts/backfill-measurement-summaries.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (2 matches)
  - [apps/optimitron/src/lib/__tests__/mcp-server.test.ts](../apps/optimitron/src/lib/__tests__/mcp-server.test.ts) (1 matches)
  - [apps/optimitron/src/lib/__tests__/measurement-summaries.integration.test.ts](../apps/optimitron/src/lib/__tests__/measurement-summaries.integration.test.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### NOf1VariableRelationship

- Schema: [packages/db/prisma/schema.prisma#L3145](../packages/db/prisma/schema.prisma#L3145)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `api-routes`: 1 files / 2 matches
  - `runtime-libraries`: 5 files / 16 matches
  - `tests`: 3 files / 7 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 9 files / 394 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/aggregate-relationships.server.ts](../apps/optimitron/src/lib/aggregate-relationships.server.ts) (9 matches)
  - [apps/optimitron/src/app/api/health-analysis/submit/route.ts](../apps/optimitron/src/app/api/health-analysis/submit/route.ts) (3 matches)
  - [packages/optimizer/src/statistics.ts](../packages/optimizer/src/statistics.ts) (3 matches)
  - [packages/optimizer/src/variable-relationship-runner.ts](../packages/optimizer/src/variable-relationship-runner.ts) (3 matches)
  - [packages/extension/src/workers/analysis.worker.ts](../packages/extension/src/workers/analysis.worker.ts) (2 matches)
  - [packages/optimizer/src/types.ts](../packages/optimizer/src/types.ts) (1 matches)
  - [packages/optimizer/src/__tests__/aggregate-variable-relationship.test.ts](../packages/optimizer/src/__tests__/aggregate-variable-relationship.test.ts) (3 matches)
  - [apps/optimitron/src/lib/__tests__/aggregate-relationships.test.ts](../apps/optimitron/src/lib/__tests__/aggregate-relationships.test.ts) (2 matches)
- Notes:
  - none

### Notification

- Schema: [packages/db/prisma/schema.prisma#L5535](../packages/db/prisma/schema.prisma#L5535)
- Classification: `runtime-live`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `components`: 2 files / 3 matches
  - `runtime-libraries`: 5 files / 7 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 8 files / 175 matches
  - `zod`: 1 files / 1 matches
  - `other`: 6 files / 8 matches
- Key files:
  - [apps/optimitron/src/components/notifications/PushNotificationPrompt.tsx](../apps/optimitron/src/components/notifications/PushNotificationPrompt.tsx) (2 matches)
  - [apps/optimitron/src/components/settings/SettingsClient.tsx](../apps/optimitron/src/components/settings/SettingsClient.tsx) (1 matches)
  - [apps/optimitron/src/lib/routes.ts](../apps/optimitron/src/lib/routes.ts) (2 matches)
  - [packages/extension/src/background/service-worker.ts](../packages/extension/src/background/service-worker.ts) (2 matches)
  - [apps/optimitron/src/lib/push-notifications.ts](../apps/optimitron/src/lib/push-notifications.ts) (1 matches)
  - [apps/optimitron/src/lib/tasks/share-templates.ts](../apps/optimitron/src/lib/tasks/share-templates.ts) (1 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### NotificationPreference

- Schema: [packages/db/prisma/schema.prisma#L5572](../packages/db/prisma/schema.prisma#L5572)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `api-routes`: 1 files / 2 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 4 matches
  - `generated`: 9 files / 153 matches
  - `zod`: 1 files / 2 matches
- Key files:
  - [apps/optimitron/src/app/api/dashboard/notification-preferences/route.ts](../apps/optimitron/src/app/api/dashboard/notification-preferences/route.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/NotificationPreference.ts](../packages/db/src/generated/prisma/models/NotificationPreference.ts) (116 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (22 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (3 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (3 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - Per-type, per-channel delivery toggle. The current name collides conceptually with UserPreference.

### OAuthAuthCode

- Schema: [packages/db/prisma/schema.prisma#L10690](../packages/db/prisma/schema.prisma#L10690)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `api-routes`: 2 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 5 files / 16 matches
  - `generated`: 9 files / 187 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [apps/optimitron/src/app/api/mcp/oauth/token/route.ts](../apps/optimitron/src/app/api/mcp/oauth/token/route.ts) (4 matches)
  - [apps/optimitron/src/app/api/mcp/oauth/consent/route.ts](../apps/optimitron/src/app/api/mcp/oauth/consent/route.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql](../packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql) (9 matches)
  - [packages/db/prisma/migrations/20260425250000_mcp_scope_enum/migration.sql](../packages/db/prisma/migrations/20260425250000_mcp_scope_enum/migration.sql) (3 matches)
  - [packages/db/prisma/migrations/20260428125500_drop_legacy_mcp_scopes/migration.sql](../packages/db/prisma/migrations/20260428125500_drop_legacy_mcp_scopes/migration.sql) (2 matches)
  - [packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql](../packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql) (1 matches)
- Notes:
  - none

### OAuthClient

- Schema: [packages/db/prisma/schema.prisma#L10654](../packages/db/prisma/schema.prisma#L10654)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 5 matches
  - `api-routes`: 3 files / 3 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 2 files / 5 matches
  - `generated`: 8 files / 181 matches
  - `other`: 1 files / 4 matches
- Key files:
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (2 matches)
  - [apps/optimitron/src/app/api/mcp/oauth/authorize/route.ts](../apps/optimitron/src/app/api/mcp/oauth/authorize/route.ts) (2 matches)
  - [apps/optimitron/src/app/api/mcp/oauth/consent/route.ts](../apps/optimitron/src/app/api/mcp/oauth/consent/route.ts) (2 matches)
  - [apps/optimitron/src/app/api/mcp/oauth/register/route.ts](../apps/optimitron/src/app/api/mcp/oauth/register/route.ts) (2 matches)
  - [apps/optimitron/src/app/mcp/authorize/page.tsx](../apps/optimitron/src/app/mcp/authorize/page.tsx) (2 matches)
  - [apps/optimitron/src/lib/developer-openapi.ts](../apps/optimitron/src/lib/developer-openapi.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
- Notes:
  - none

### OAuthGrant

- Schema: [packages/db/prisma/schema.prisma#L10738](../packages/db/prisma/schema.prisma#L10738)
- Classification: `runtime-live`
- Direct Prisma usage: 6 files / 10 matches
- Usage counts by bucket:
  - `runtime-prisma`: 6 files / 10 matches
  - `api-routes`: 3 files / 7 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 6 files / 19 matches
  - `generated`: 10 files / 192 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/app/api/mcp/oauth/token/route.ts](../apps/optimitron/src/app/api/mcp/oauth/token/route.ts) (8 matches)
  - [apps/optimitron/src/app/api/mcp/oauth/revoke/route.ts](../apps/optimitron/src/app/api/mcp/oauth/revoke/route.ts) (4 matches)
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (2 matches)
  - [apps/optimitron/src/app/api/mcp/route.ts](../apps/optimitron/src/app/api/mcp/route.ts) (2 matches)
  - [apps/optimitron/src/app/mcp/authorize/page.tsx](../apps/optimitron/src/app/mcp/authorize/page.tsx) (2 matches)
  - [apps/optimitron/src/lib/auth-utils.ts](../apps/optimitron/src/lib/auth-utils.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
- Notes:
  - none

### Organization

- Schema: [packages/db/prisma/schema.prisma#L5600](../packages/db/prisma/schema.prisma#L5600)
- Classification: `core`
- Direct Prisma usage: 21 files / 51 matches
- Usage counts by bucket:
  - `runtime-prisma`: 21 files / 51 matches
  - `api-routes`: 8 files / 24 matches
  - `pages`: 4 files / 7 matches
  - `components`: 7 files / 15 matches
  - `runtime-libraries`: 25 files / 108 matches
  - `scripts`: 2 files / 3 matches
  - `tests`: 17 files / 35 matches
  - `docs`: 7 files / 12 matches
  - `schema`: 1 files / 38 matches
  - `migrations`: 15 files / 49 matches
  - `generated`: 30 files / 484 matches
  - `zod`: 1 files / 1 matches
  - `other`: 51 files / 176 matches
- Key files:
  - [apps/optimitron/src/lib/organization.server.ts](../apps/optimitron/src/lib/organization.server.ts) (42 matches)
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (32 matches)
  - [apps/optimitron/src/app/api/admin/organizations/[id]/route.ts](../apps/optimitron/src/app/api/admin/organizations/[id]/route.ts) (13 matches)
  - [packages/db/src/managed-data/managed-iam-organization.ts](../packages/db/src/managed-data/managed-iam-organization.ts) (11 matches)
  - [apps/optimitron/src/app/api/organizations/[id]/route.ts](../apps/optimitron/src/app/api/organizations/[id]/route.ts) (6 matches)
  - [packages/db/src/managed-data/managed-demo-user.ts](../packages/db/src/managed-data/managed-demo-user.ts) (6 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (6 matches)
  - [apps/optimitron/src/app/api/referendums/[slug]/organization-position/route.ts](../apps/optimitron/src/app/api/referendums/[slug]/organization-position/route.ts) (5 matches)
- Notes:
  - none

### OrganizationMember

- Schema: [packages/db/prisma/schema.prisma#L5764](../packages/db/prisma/schema.prisma#L5764)
- Classification: `core`
- Direct Prisma usage: 11 files / 21 matches
- Usage counts by bucket:
  - `runtime-prisma`: 11 files / 21 matches
  - `api-routes`: 2 files / 2 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 8 files / 19 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 2 files / 3 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 9 matches
  - `generated`: 9 files / 153 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 2 matches
- Key files:
  - [apps/optimitron/src/lib/organization.server.ts](../apps/optimitron/src/lib/organization.server.ts) (23 matches)
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (2 matches)
  - [apps/optimitron/src/app/api/mcp/oauth/consent/route.ts](../apps/optimitron/src/app/api/mcp/oauth/consent/route.ts) (2 matches)
  - [apps/optimitron/src/app/api/mcp/route.ts](../apps/optimitron/src/app/api/mcp/route.ts) (2 matches)
  - [apps/optimitron/src/app/mcp/authorize/page.tsx](../apps/optimitron/src/app/mcp/authorize/page.tsx) (2 matches)
  - [apps/optimitron/src/lib/auth-utils.ts](../apps/optimitron/src/lib/auth-utils.ts) (2 matches)
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (2 matches)
  - [apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts](../apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
- Notes:
  - none

### OrganizationName

- Schema: [packages/db/prisma/schema.prisma#L5696](../packages/db/prisma/schema.prisma#L5696)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 3 matches
  - `runtime-libraries`: 2 files / 4 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 16 matches
  - `generated`: 10 files / 250 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/db/src/managed-data/managed-iam-organization.ts](../packages/db/src/managed-data/managed-iam-organization.ts) (6 matches)
  - [packages/db/src/organization-name.ts](../packages/db/src/organization-name.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260720170000_add_organization_names/migration.sql](../packages/db/prisma/migrations/20260720170000_add_organization_names/migration.sql) (16 matches)
  - [packages/db/src/generated/prisma/models/OrganizationName.ts](../packages/db/src/generated/prisma/models/OrganizationName.ts) (205 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (27 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### OrganizationReferendumPosition

- Schema: [packages/db/prisma/schema.prisma#L5792](../packages/db/prisma/schema.prisma#L5792)
- Classification: `runtime-live`
- Direct Prisma usage: 8 files / 15 matches
- Usage counts by bucket:
  - `runtime-prisma`: 8 files / 15 matches
  - `api-routes`: 3 files / 6 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 4 files / 9 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 12 matches
  - `generated`: 10 files / 211 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (7 matches)
  - [apps/optimitron/src/lib/referendum-site.server.ts](../apps/optimitron/src/lib/referendum-site.server.ts) (6 matches)
  - [apps/optimitron/src/app/api/admin/referendum-positions/[id]/route.ts](../apps/optimitron/src/app/api/admin/referendum-positions/[id]/route.ts) (4 matches)
  - [apps/optimitron/src/app/api/admin/referendum-positions/route.ts](../apps/optimitron/src/app/api/admin/referendum-positions/route.ts) (4 matches)
  - [apps/optimitron/src/app/api/referendums/[slug]/organization-position/route.ts](../apps/optimitron/src/app/api/referendums/[slug]/organization-position/route.ts) (4 matches)
  - [apps/optimitron/src/app/admin/referendum-positions/page.tsx](../apps/optimitron/src/app/admin/referendum-positions/page.tsx) (2 matches)
  - [packages/db/src/managed-data/managed-demo-user.ts](../packages/db/src/managed-data/managed-demo-user.ts) (2 matches)
  - [packages/db/src/managed-data/managed-iam-organization.ts](../packages/db/src/managed-data/managed-iam-organization.ts) (2 matches)
- Notes:
  - none

### ParameterDefinition

- Schema: [packages/db/prisma/schema.prisma#L7775](../packages/db/prisma/schema.prisma#L7775)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 11 matches
  - `runtime-libraries`: 3 files / 12 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 189 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/parameters/parameter-catalog.server.ts](../apps/optimitron/src/lib/parameters/parameter-catalog.server.ts) (19 matches)
  - [apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts](../apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/import-task-bundle.server.ts](../apps/optimitron/src/lib/tasks/import-task-bundle.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql](../packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/ParameterDefinition.ts](../packages/db/src/generated/prisma/models/ParameterDefinition.ts) (150 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### ParameterRevision

- Schema: [packages/db/prisma/schema.prisma#L7793](../packages/db/prisma/schema.prisma#L7793)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 11 matches
  - `runtime-libraries`: 3 files / 11 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 1 files / 15 matches
  - `generated`: 9 files / 394 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/parameters/parameter-catalog.server.ts](../apps/optimitron/src/lib/parameters/parameter-catalog.server.ts) (18 matches)
  - [apps/optimitron/src/lib/parameters/parameter-staleness.server.ts](../apps/optimitron/src/lib/parameters/parameter-staleness.server.ts) (2 matches)
  - [apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts](../apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (9 matches)
  - [packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql](../packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql) (15 matches)
  - [packages/db/src/generated/prisma/models/ParameterRevision.ts](../packages/db/src/generated/prisma/models/ParameterRevision.ts) (341 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (35 matches)
  - [packages/db/src/generated/prisma/models/ParameterDefinition.ts](../packages/db/src/generated/prisma/models/ParameterDefinition.ts) (4 matches)
- Notes:
  - none

### ParameterRevisionInput

- Schema: [packages/db/prisma/schema.prisma#L7853](../packages/db/prisma/schema.prisma#L7853)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 3 matches
  - `runtime-libraries`: 1 files / 3 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 8 files / 168 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/parameters/parameter-catalog.server.ts](../apps/optimitron/src/lib/parameters/parameter-catalog.server.ts) (6 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql](../packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/ParameterRevisionInput.ts](../packages/db/src/generated/prisma/models/ParameterRevisionInput.ts) (131 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/models/ParameterRevision.ts](../packages/db/src/generated/prisma/models/ParameterRevision.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### ParameterRevisionSourceArtifact

- Schema: [packages/db/prisma/schema.prisma#L7873](../packages/db/prisma/schema.prisma#L7873)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 9 files / 163 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/parameters/parameter-catalog.server.ts](../apps/optimitron/src/lib/parameters/parameter-catalog.server.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql](../packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql) (6 matches)
  - [packages/db/src/generated/prisma/models/ParameterRevisionSourceArtifact.ts](../packages/db/src/generated/prisma/models/ParameterRevisionSourceArtifact.ts) (126 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### Person

- Schema: [packages/db/prisma/schema.prisma#L1146](../packages/db/prisma/schema.prisma#L1146)
- Classification: `core`
- Direct Prisma usage: 29 files / 62 matches
- Usage counts by bucket:
  - `runtime-prisma`: 29 files / 62 matches
  - `api-routes`: 7 files / 13 matches
  - `pages`: 3 files / 4 matches
  - `components`: 3 files / 3 matches
  - `runtime-libraries`: 49 files / 177 matches
  - `scripts`: 6 files / 21 matches
  - `tests`: 20 files / 50 matches
  - `docs`: 9 files / 18 matches
  - `schema`: 1 files / 39 matches
  - `migrations`: 15 files / 80 matches
  - `generated`: 27 files / 487 matches
  - `zod`: 1 files / 1 matches
  - `other`: 29 files / 124 matches
- Key files:
  - [apps/optimitron/src/lib/person.server.ts](../apps/optimitron/src/lib/person.server.ts) (43 matches)
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (31 matches)
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (15 matches)
  - [apps/optimitron/src/lib/tasks.server.ts](../apps/optimitron/src/lib/tasks.server.ts) (8 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (8 matches)
  - [apps/optimitron/scripts/import-dih-users-votes.ts](../apps/optimitron/scripts/import-dih-users-votes.ts) (6 matches)
  - [apps/optimitron/src/app/api/tasks/route.ts](../apps/optimitron/src/app/api/tasks/route.ts) (6 matches)
  - [apps/optimitron/src/lib/profile-identity.server.ts](../apps/optimitron/src/lib/profile-identity.server.ts) (6 matches)
- Notes:
  - none

### PersonCondition

- Schema: [packages/db/prisma/schema.prisma#L1302](../packages/db/prisma/schema.prisma#L1302)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 4 matches
  - `runtime-libraries`: 4 files / 5 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 13 matches
  - `generated`: 12 files / 237 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (4 matches)
  - [apps/optimitron/src/lib/efficacy-lag-matcher.server.ts](../apps/optimitron/src/lib/efficacy-lag-matcher.server.ts) (2 matches)
  - [packages/db/src/managed-data/managed-grandma-kay.ts](../packages/db/src/managed-data/managed-grandma-kay.ts) (2 matches)
  - [apps/optimitron/src/lib/prosecution-data.server.ts](../apps/optimitron/src/lib/prosecution-data.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (13 matches)
  - [packages/db/src/generated/prisma/models/PersonCondition.ts](../packages/db/src/generated/prisma/models/PersonCondition.ts) (188 matches)
- Notes:
  - none

### PersonEfficacyLagEvidence

- Schema: [packages/db/prisma/schema.prisma#L1710](../packages/db/prisma/schema.prisma#L1710)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 2 matches
  - `runtime-libraries`: 3 files / 4 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 8 matches
  - `generated`: 11 files / 226 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 2 matches
- Key files:
  - [apps/optimitron/src/lib/efficacy-lag-matcher.server.ts](../apps/optimitron/src/lib/efficacy-lag-matcher.server.ts) (3 matches)
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (2 matches)
  - [apps/optimitron/src/lib/prosecution-data.server.ts](../apps/optimitron/src/lib/prosecution-data.server.ts) (1 matches)
  - [apps/optimitron/scripts/recompute-efficacy-lag.ts](../apps/optimitron/scripts/recompute-efficacy-lag.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (8 matches)
  - [packages/db/src/generated/prisma/models/PersonEfficacyLagEvidence.ts](../packages/db/src/generated/prisma/models/PersonEfficacyLagEvidence.ts) (181 matches)
- Notes:
  - none

### PersonhoodVerification

- Schema: [packages/db/prisma/schema.prisma#L2213](../packages/db/prisma/schema.prisma#L2213)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 6 matches
  - `api-routes`: 1 files / 1 matches
  - `runtime-libraries`: 4 files / 5 matches
  - `tests`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 2 files / 9 matches
  - `generated`: 8 files / 199 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [apps/optimitron/src/lib/personhood.server.ts](../apps/optimitron/src/lib/personhood.server.ts) (4 matches)
  - [apps/optimitron/src/app/api/treasury/register-ubi/route.ts](../apps/optimitron/src/app/api/treasury/register-ubi/route.ts) (2 matches)
  - [apps/optimitron/src/lib/census-aggregation.server.ts](../apps/optimitron/src/lib/census-aggregation.server.ts) (2 matches)
  - [apps/optimitron/src/lib/referral-point-mint.server.ts](../apps/optimitron/src/lib/referral-point-mint.server.ts) (2 matches)
  - [apps/optimitron/src/lib/wishocracy-community.ts](../apps/optimitron/src/lib/wishocracy-community.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
- Notes:
  - none

### PersonMemorial

- Schema: [packages/db/prisma/schema.prisma#L1403](../packages/db/prisma/schema.prisma#L1403)
- Classification: `runtime-live`
- Direct Prisma usage: 6 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 6 files / 11 matches
  - `api-routes`: 1 files / 1 matches
  - `runtime-libraries`: 5 files / 13 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 2 files / 20 matches
  - `generated`: 11 files / 263 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (9 matches)
  - [apps/optimitron/src/lib/prosecution-data.server.ts](../apps/optimitron/src/lib/prosecution-data.server.ts) (5 matches)
  - [packages/db/src/managed-data/managed-famous-disease-deaths.ts](../packages/db/src/managed-data/managed-famous-disease-deaths.ts) (4 matches)
  - [apps/optimitron/src/lib/evidence-package.server.ts](../apps/optimitron/src/lib/evidence-package.server.ts) (3 matches)
  - [apps/optimitron/scripts/recompute-efficacy-lag.ts](../apps/optimitron/scripts/recompute-efficacy-lag.ts) (2 matches)
  - [apps/optimitron/src/lib/efficacy-lag-matcher.server.ts](../apps/optimitron/src/lib/efficacy-lag-matcher.server.ts) (2 matches)
  - [apps/optimitron/src/app/api/people/[id]/evidence-package/route.ts](../apps/optimitron/src/app/api/people/[id]/evidence-package/route.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### PersonMemorialEvidence

- Schema: [packages/db/prisma/schema.prisma#L1574](../packages/db/prisma/schema.prisma#L1574)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 5 matches
  - `runtime-libraries`: 2 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 11 files / 240 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (11 matches)
  - [apps/optimitron/src/lib/evidence-package.server.ts](../apps/optimitron/src/lib/evidence-package.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/PersonMemorialEvidence.ts](../packages/db/src/generated/prisma/models/PersonMemorialEvidence.ts) (191 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (31 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### PersonMemorialResponsibleParty

- Schema: [packages/db/prisma/schema.prisma#L1514](../packages/db/prisma/schema.prisma#L1514)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 5 matches
  - `runtime-libraries`: 3 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 11 files / 241 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (11 matches)
  - [apps/optimitron/src/lib/evidence-package.server.ts](../apps/optimitron/src/lib/evidence-package.server.ts) (1 matches)
  - [apps/optimitron/src/lib/prosecution-data.server.ts](../apps/optimitron/src/lib/prosecution-data.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (10 matches)
  - [packages/db/src/generated/prisma/models/PersonMemorialResponsibleParty.ts](../packages/db/src/generated/prisma/models/PersonMemorialResponsibleParty.ts) (196 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (27 matches)
- Notes:
  - none

### PersonMemorialSubmission

- Schema: [packages/db/prisma/schema.prisma#L1465](../packages/db/prisma/schema.prisma#L1465)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 3 matches
  - `runtime-libraries`: 2 files / 4 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 10 files / 208 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (6 matches)
  - [apps/optimitron/src/lib/evidence-package.server.ts](../apps/optimitron/src/lib/evidence-package.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/PersonMemorialSubmission.ts](../packages/db/src/generated/prisma/models/PersonMemorialSubmission.ts) (167 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### PersonRelationship

- Schema: [packages/db/prisma/schema.prisma#L1263](../packages/db/prisma/schema.prisma#L1263)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 3 matches
  - `runtime-libraries`: 2 files / 4 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 187 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (6 matches)
  - [apps/optimitron/src/lib/evidence-package.server.ts](../apps/optimitron/src/lib/evidence-package.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/PersonRelationship.ts](../packages/db/src/generated/prisma/models/PersonRelationship.ts) (146 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/models/Person.ts](../packages/db/src/generated/prisma/models/Person.ts) (4 matches)
- Notes:
  - none

### PointMint

- Schema: [packages/db/prisma/schema.prisma#L5348](../packages/db/prisma/schema.prisma#L5348)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 10 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 10 matches
  - `api-routes`: 3 files / 6 matches
  - `components`: 1 files / 2 matches
  - `runtime-libraries`: 2 files / 4 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 4 matches
  - `generated`: 9 files / 188 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [apps/optimitron/src/app/api/cron/point-mint/route.ts](../apps/optimitron/src/app/api/cron/point-mint/route.ts) (8 matches)
  - [apps/optimitron/src/lib/referral-point-mint.server.ts](../apps/optimitron/src/lib/referral-point-mint.server.ts) (6 matches)
  - [apps/optimitron/src/app/api/points/balance/route.ts](../apps/optimitron/src/app/api/points/balance/route.ts) (2 matches)
  - [apps/optimitron/src/app/api/prize-treasury/status/route.ts](../apps/optimitron/src/app/api/prize-treasury/status/route.ts) (2 matches)
  - [apps/optimitron/src/lib/impact-receipts.server.ts](../apps/optimitron/src/lib/impact-receipts.server.ts) (2 matches)
  - [apps/optimitron/src/components/prize/EarthOptimizationPointsBalanceCard.tsx](../apps/optimitron/src/components/prize/EarthOptimizationPointsBalanceCard.tsx) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260607120000_rename_vote_token_mint_to_point_mint/migration.sql](../packages/db/prisma/migrations/20260607120000_rename_vote_token_mint_to_point_mint/migration.sql) (4 matches)
- Notes:
  - none

### Politician

- Schema: [packages/db/prisma/schema.prisma#L4328](../packages/db/prisma/schema.prisma#L4328)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `api-routes`: 1 files / 1 matches
  - `pages`: 3 files / 5 matches
  - `components`: 5 files / 8 matches
  - `runtime-libraries`: 7 files / 9 matches
  - `tests`: 4 files / 7 matches
  - `docs`: 3 files / 4 matches
  - `schema`: 1 files / 8 matches
  - `migrations`: 2 files / 8 matches
  - `generated`: 10 files / 204 matches
  - `zod`: 1 files / 1 matches
  - `other`: 7 files / 14 matches
- Key files:
  - [apps/optimitron/src/lib/alignment-politicians.server.ts](../apps/optimitron/src/lib/alignment-politicians.server.ts) (4 matches)
  - [apps/optimitron/src/lib/aggregate-alignment.server.ts](../apps/optimitron/src/lib/aggregate-alignment.server.ts) (2 matches)
  - [apps/optimitron/src/app/api/scores/[jurisdictionCode]/[politicianExternalId]/route.ts](../apps/optimitron/src/app/api/scores/[jurisdictionCode]/[politicianExternalId]/route.ts) (1 matches)
  - [apps/optimitron/src/app/governments/[code]/page.tsx](../apps/optimitron/src/app/governments/[code]/page.tsx) (2 matches)
  - [apps/optimitron/src/app/governments/[code]/politicians/[bioguideId]/page.tsx](../apps/optimitron/src/app/governments/[code]/politicians/[bioguideId]/page.tsx) (2 matches)
  - [apps/optimitron/src/app/iab/page.tsx](../apps/optimitron/src/app/iab/page.tsx) (1 matches)
  - [apps/optimitron/src/components/alignment/AlignmentReport.tsx](../apps/optimitron/src/components/alignment/AlignmentReport.tsx) (2 matches)
  - [apps/optimitron/src/components/treasury/TreasuryAllocationViz.tsx](../apps/optimitron/src/components/treasury/TreasuryAllocationViz.tsx) (2 matches)
- Notes:
  - none

### PoliticianVote

- Schema: [packages/db/prisma/schema.prisma#L4375](../packages/db/prisma/schema.prisma#L4375)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `tests`: 1 files / 2 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 2 files / 8 matches
  - `generated`: 9 files / 174 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/alignment-politicians.server.ts](../apps/optimitron/src/lib/alignment-politicians.server.ts) (4 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (4 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/PoliticianVote.ts](../packages/db/src/generated/prisma/models/PoliticianVote.ts) (136 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (24 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### PreferenceWeight

- Schema: [packages/db/prisma/schema.prisma#L4244](../packages/db/prisma/schema.prisma#L4244)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 3 files / 7 matches
  - `tests`: 2 files / 22 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 9 files / 179 matches
  - `zod`: 1 files / 1 matches
  - `other`: 5 files / 13 matches
- Key files:
  - [apps/optimitron/src/lib/aggregate-alignment.server.ts](../apps/optimitron/src/lib/aggregate-alignment.server.ts) (4 matches)
  - [apps/optimitron/src/lib/wishocracy-alignment.ts](../apps/optimitron/src/lib/wishocracy-alignment.ts) (2 matches)
  - [packages/db/src/types.ts](../packages/db/src/types.ts) (2 matches)
  - [packages/wishocracy/src/__tests__/alignment.test.ts](../packages/wishocracy/src/__tests__/alignment.test.ts) (19 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (3 matches)
  - [docs/TYPE_SYSTEM.md](../docs/TYPE_SYSTEM.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (5 matches)
- Notes:
  - none

### PrizeTreasuryDeposit

- Schema: [packages/db/prisma/schema.prisma#L5397](../packages/db/prisma/schema.prisma#L5397)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 2 matches
  - `api-routes`: 1 files / 1 matches
  - `pages`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 4 matches
  - `generated`: 8 files / 158 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [apps/optimitron/src/app/api/prize-treasury/status/route.ts](../apps/optimitron/src/app/api/prize-treasury/status/route.ts) (2 matches)
  - [apps/optimitron/src/app/prize/page.tsx](../apps/optimitron/src/app/prize/page.tsx) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/PrizeTreasuryDeposit.ts](../packages/db/src/generated/prisma/models/PrizeTreasuryDeposit.ts) (127 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (20 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### PublicGoodsRecipient

- Schema: [packages/db/prisma/schema.prisma#L5436](../packages/db/prisma/schema.prisma#L5436)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 8 files / 163 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/PublicGoodsRecipient.ts](../packages/db/src/generated/prisma/models/PublicGoodsRecipient.ts) (130 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### RankedIntervention

- Schema: [packages/db/prisma/schema.prisma#L3648](../packages/db/prisma/schema.prisma#L3648)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 11 matches
  - `generated`: 10 files / 217 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (11 matches)
  - [packages/db/src/generated/prisma/models/RankedIntervention.ts](../packages/db/src/generated/prisma/models/RankedIntervention.ts) (176 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### Referendum

- Schema: [packages/db/prisma/schema.prisma#L4718](../packages/db/prisma/schema.prisma#L4718)
- Classification: `runtime-live`
- Direct Prisma usage: 18 files / 29 matches
- Usage counts by bucket:
  - `runtime-prisma`: 18 files / 29 matches
  - `api-routes`: 3 files / 10 matches
  - `pages`: 6 files / 9 matches
  - `components`: 4 files / 4 matches
  - `runtime-libraries`: 14 files / 37 matches
  - `scripts`: 2 files / 3 matches
  - `tests`: 7 files / 16 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 12 matches
  - `migrations`: 6 files / 22 matches
  - `generated`: 14 files / 297 matches
  - `zod`: 1 files / 1 matches
  - `other`: 16 files / 27 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (14 matches)
  - [apps/optimitron/src/app/api/referendums/[slug]/vote/route.ts](../apps/optimitron/src/app/api/referendums/[slug]/vote/route.ts) (7 matches)
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (7 matches)
  - [apps/optimitron/src/app/agencies/dcongress/referendums/[slug]/page.tsx](../apps/optimitron/src/app/agencies/dcongress/referendums/[slug]/page.tsx) (6 matches)
  - [apps/optimitron/src/app/api/referendums/route.ts](../apps/optimitron/src/app/api/referendums/route.ts) (6 matches)
  - [packages/db/src/managed-data/managed-referendums.ts](../packages/db/src/managed-data/managed-referendums.ts) (5 matches)
  - [apps/optimitron/scripts/import-dih-users-votes.ts](../apps/optimitron/scripts/import-dih-users-votes.ts) (4 matches)
  - [apps/optimitron/src/lib/referendum-site.server.ts](../apps/optimitron/src/lib/referendum-site.server.ts) (4 matches)
- Notes:
  - none

### ReferendumVote

- Schema: [packages/db/prisma/schema.prisma#L4787](../packages/db/prisma/schema.prisma#L4787)
- Classification: `runtime-live`
- Direct Prisma usage: 14 files / 40 matches
- Usage counts by bucket:
  - `runtime-prisma`: 14 files / 40 matches
  - `api-routes`: 1 files / 2 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 15 files / 41 matches
  - `scripts`: 1 files / 7 matches
  - `tests`: 3 files / 3 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 5 files / 29 matches
  - `generated`: 13 files / 246 matches
  - `zod`: 1 files / 1 matches
  - `other`: 17 files / 29 matches
- Key files:
  - [apps/optimitron/src/lib/verified-votes.server.ts](../apps/optimitron/src/lib/verified-votes.server.ts) (16 matches)
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (13 matches)
  - [apps/optimitron/src/lib/referendum-site.server.ts](../apps/optimitron/src/lib/referendum-site.server.ts) (12 matches)
  - [apps/optimitron/scripts/import-dih-users-votes.ts](../apps/optimitron/scripts/import-dih-users-votes.ts) (11 matches)
  - [apps/optimitron/src/lib/email/monthly-chain-digest.server.ts](../apps/optimitron/src/lib/email/monthly-chain-digest.server.ts) (6 matches)
  - [apps/optimitron/src/app/api/referendums/[slug]/vote/route.ts](../apps/optimitron/src/app/api/referendums/[slug]/vote/route.ts) (4 matches)
  - [apps/optimitron/src/lib/daily-activity-digest.server.ts](../apps/optimitron/src/lib/daily-activity-digest.server.ts) (4 matches)
  - [apps/optimitron/src/lib/referral-point-mint.server.ts](../apps/optimitron/src/lib/referral-point-mint.server.ts) (4 matches)
- Notes:
  - Internal platform vote tied to a real Referendum row, referral attribution, and VOTE token / reward flows.

### Referral

- Schema: [packages/db/prisma/schema.prisma#L3995](../packages/db/prisma/schema.prisma#L3995)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 8 matches
  - `api-routes`: 4 files / 7 matches
  - `pages`: 1 files / 1 matches
  - `components`: 8 files / 12 matches
  - `runtime-libraries`: 12 files / 17 matches
  - `tests`: 4 files / 7 matches
  - `docs`: 7 files / 8 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 3 files / 10 matches
  - `generated`: 9 files / 196 matches
  - `zod`: 1 files / 1 matches
  - `other`: 14 files / 18 matches
- Key files:
  - [apps/optimitron/src/lib/referral.server.ts](../apps/optimitron/src/lib/referral.server.ts) (8 matches)
  - [apps/optimitron/src/lib/weekly-metrics.server.ts](../apps/optimitron/src/lib/weekly-metrics.server.ts) (3 matches)
  - [apps/optimitron/src/app/api/game-stats/route.ts](../apps/optimitron/src/app/api/game-stats/route.ts) (2 matches)
  - [apps/optimitron/src/lib/badges.server.ts](../apps/optimitron/src/lib/badges.server.ts) (2 matches)
  - [apps/optimitron/src/lib/daily-activity-digest.server.ts](../apps/optimitron/src/lib/daily-activity-digest.server.ts) (2 matches)
  - [apps/optimitron/src/app/api/referendums/[slug]/vote/route.ts](../apps/optimitron/src/app/api/referendums/[slug]/vote/route.ts) (4 matches)
  - [apps/optimitron/src/app/api/cron/point-mint/route.ts](../apps/optimitron/src/app/api/cron/point-mint/route.ts) (1 matches)
  - [apps/optimitron/src/app/api/personhood/world-id/verify/route.ts](../apps/optimitron/src/app/api/personhood/world-id/verify/route.ts) (1 matches)
- Notes:
  - none

### ReferralClick

- Schema: [packages/db/prisma/schema.prisma#L4034](../packages/db/prisma/schema.prisma#L4034)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 8 files / 179 matches
  - `other`: 3 files / 6 matches
- Key files:
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260417_share_attempts_and_email_variants/migration.sql](../packages/db/prisma/migrations/20260417_share_attempts_and_email_variants/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/ReferralClick.ts](../packages/db/src/generated/prisma/models/ReferralClick.ts) (146 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### ReferralInvitation

- Schema: [packages/db/prisma/schema.prisma#L4076](../packages/db/prisma/schema.prisma#L4076)
- Classification: `runtime-live`
- Direct Prisma usage: 7 files / 27 matches
- Usage counts by bucket:
  - `runtime-prisma`: 7 files / 27 matches
  - `api-routes`: 1 files / 3 matches
  - `runtime-libraries`: 8 files / 25 matches
  - `scripts`: 2 files / 7 matches
  - `docs`: 4 files / 7 matches
  - `schema`: 1 files / 12 matches
  - `migrations`: 8 files / 32 matches
  - `generated`: 15 files / 325 matches
  - `other`: 8 files / 12 matches
- Key files:
  - [apps/optimitron/src/lib/referral-invitations.server.ts](../apps/optimitron/src/lib/referral-invitations.server.ts) (23 matches)
  - [apps/optimitron/src/lib/humanity-manager-status.server.ts](../apps/optimitron/src/lib/humanity-manager-status.server.ts) (11 matches)
  - [apps/optimitron/scripts/import-dih-users-votes.ts](../apps/optimitron/scripts/import-dih-users-votes.ts) (9 matches)
  - [apps/optimitron/src/app/api/referral-invitations/route.ts](../apps/optimitron/src/app/api/referral-invitations/route.ts) (6 matches)
  - [apps/optimitron/src/lib/email/monthly-chain-digest.server.ts](../apps/optimitron/src/lib/email/monthly-chain-digest.server.ts) (4 matches)
  - [apps/optimitron/src/lib/person.server.ts](../apps/optimitron/src/lib/person.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [apps/optimitron/src/lib/jobs/refresh-user-downstream-cache.server.ts](../apps/optimitron/src/lib/jobs/refresh-user-downstream-cache.server.ts) (1 matches)
- Notes:
  - none

### Session

- Schema: [packages/db/prisma/schema.prisma#L2157](../packages/db/prisma/schema.prisma#L2157)
- Classification: `runtime-live`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `api-routes`: 1 files / 7 matches
  - `components`: 1 files / 1 matches
  - `runtime-libraries`: 10 files / 24 matches
  - `tests`: 5 files / 17 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 158 matches
  - `zod`: 1 files / 1 matches
  - `other`: 17 files / 27 matches
- Key files:
  - [apps/optimitron/src/app/api/stripe/webhook/route.ts](../apps/optimitron/src/app/api/stripe/webhook/route.ts) (7 matches)
  - [apps/optimitron/src/components/treaty/TreatyNameSignatureBox.tsx](../apps/optimitron/src/components/treaty/TreatyNameSignatureBox.tsx) (1 matches)
  - [apps/optimitron/src/lib/shirt-fulfillment.server.ts](../apps/optimitron/src/lib/shirt-fulfillment.server.ts) (6 matches)
  - [apps/optimitron/src/lib/voice-session.ts](../apps/optimitron/src/lib/voice-session.ts) (4 matches)
  - [apps/optimitron/src/lib/task-funding/payments.server.ts](../apps/optimitron/src/lib/task-funding/payments.server.ts) (3 matches)
  - [apps/optimitron/src/lib/referendum-vote-sync.ts](../apps/optimitron/src/lib/referendum-vote-sync.ts) (2 matches)
  - [apps/optimitron/src/lib/wishocracy-state-utils.ts](../apps/optimitron/src/lib/wishocracy-state-utils.ts) (2 matches)
  - [apps/optimitron/src/lib/wishocracy-utils.ts](../apps/optimitron/src/lib/wishocracy-utils.ts) (2 matches)
- Notes:
  - none

### ShareAttempt

- Schema: [packages/db/prisma/schema.prisma#L9585](../packages/db/prisma/schema.prisma#L9585)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 4 matches
  - `api-routes`: 1 files / 1 matches
  - `runtime-libraries`: 5 files / 5 matches
  - `docs`: 4 files / 10 matches
  - `schema`: 1 files / 14 matches
  - `migrations`: 6 files / 25 matches
  - `generated`: 16 files / 295 matches
  - `other`: 3 files / 7 matches
- Key files:
  - [apps/optimitron/src/app/api/share-attempts/route.ts](../apps/optimitron/src/app/api/share-attempts/route.ts) (2 matches)
  - [apps/optimitron/src/lib/referral.server.ts](../apps/optimitron/src/lib/referral.server.ts) (2 matches)
  - [apps/optimitron/src/lib/share-attempts.server.ts](../apps/optimitron/src/lib/share-attempts.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [apps/optimitron/src/lib/share-channels.ts](../apps/optimitron/src/lib/share-channels.ts) (1 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (1 matches)
  - [docs/TREATY_REFERRAL_MODEL_AUDIT.md](../docs/TREATY_REFERRAL_MODEL_AUDIT.md) (6 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (2 matches)
- Notes:
  - none

### SocialAccount

- Schema: [packages/db/prisma/schema.prisma#L9461](../packages/db/prisma/schema.prisma#L9461)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 3 matches
  - `api-routes`: 2 files / 2 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 8 files / 179 matches
  - `zod`: 1 files / 1 matches
  - `other`: 4 files / 6 matches
- Key files:
  - [apps/optimitron/src/app/api/social-accounts/connect-wallet/route.ts](../apps/optimitron/src/app/api/social-accounts/connect-wallet/route.ts) (2 matches)
  - [apps/optimitron/src/app/api/social-accounts/disconnect/route.ts](../apps/optimitron/src/app/api/social-accounts/disconnect/route.ts) (2 matches)
  - [apps/optimitron/src/lib/referral-point-mint.server.ts](../apps/optimitron/src/lib/referral-point-mint.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/SocialAccount.ts](../packages/db/src/generated/prisma/models/SocialAccount.ts) (146 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
- Notes:
  - none

### SourceArtifact

- Schema: [packages/db/prisma/schema.prisma#L7691](../packages/db/prisma/schema.prisma#L7691)
- Classification: `core`
- Direct Prisma usage: 12 files / 18 matches
- Usage counts by bucket:
  - `runtime-prisma`: 12 files / 18 matches
  - `runtime-libraries`: 11 files / 16 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 5 files / 8 matches
  - `schema`: 1 files / 21 matches
  - `migrations`: 7 files / 31 matches
  - `generated`: 23 files / 392 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [apps/optimitron/src/lib/parameters/parameter-catalog.server.ts](../apps/optimitron/src/lib/parameters/parameter-catalog.server.ts) (6 matches)
  - [apps/optimitron/scripts/extract-tasks-from-manual.ts](../apps/optimitron/scripts/extract-tasks-from-manual.ts) (4 matches)
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (4 matches)
  - [apps/optimitron/src/lib/source-artifact-visibility.server.ts](../apps/optimitron/src/lib/source-artifact-visibility.server.ts) (4 matches)
  - [apps/optimitron/src/lib/tasks/private-work-portability.server.ts](../apps/optimitron/src/lib/tasks/private-work-portability.server.ts) (4 matches)
  - [apps/optimitron/src/lib/form-responses.server.ts](../apps/optimitron/src/lib/form-responses.server.ts) (2 matches)
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (2 matches)
  - [apps/optimitron/src/lib/mcp-tools/private-execution.ts](../apps/optimitron/src/lib/mcp-tools/private-execution.ts) (2 matches)
- Notes:
  - none

### StripeConnectedAccount

- Schema: [packages/db/prisma/schema.prisma#L7380](../packages/db/prisma/schema.prisma#L7380)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 12 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 12 matches
  - `runtime-libraries`: 2 files / 14 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 10 files / 256 matches
- Key files:
  - [apps/optimitron/src/lib/stripe-connect.server.ts](../apps/optimitron/src/lib/stripe-connect.server.ts) (18 matches)
  - [apps/optimitron/src/lib/task-payouts.server.ts](../apps/optimitron/src/lib/task-payouts.server.ts) (8 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260701120000_add_task_funding_payments_and_payouts/migration.sql](../packages/db/prisma/migrations/20260701120000_add_task_funding_payments_and_payouts/migration.sql) (10 matches)
  - [packages/db/src/generated/prisma/models/StripeConnectedAccount.ts](../packages/db/src/generated/prisma/models/StripeConnectedAccount.ts) (215 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### Subject

- Schema: [packages/db/prisma/schema.prisma#L2603](../packages/db/prisma/schema.prisma#L2603)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `pages`: 2 files / 5 matches
  - `components`: 1 files / 1 matches
  - `runtime-libraries`: 18 files / 22 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 6 files / 11 matches
  - `docs`: 2 files / 9 matches
  - `schema`: 1 files / 31 matches
  - `migrations`: 4 files / 32 matches
  - `generated`: 20 files / 358 matches
  - `zod`: 1 files / 1 matches
  - `other`: 10 files / 12 matches
- Key files:
  - [apps/optimitron/src/lib/form-responses.server.ts](../apps/optimitron/src/lib/form-responses.server.ts) (4 matches)
  - [apps/optimitron/src/app/admin/communications/page.tsx](../apps/optimitron/src/app/admin/communications/page.tsx) (3 matches)
  - [apps/optimitron/src/app/organizations/[id]/page.tsx](../apps/optimitron/src/app/organizations/[id]/page.tsx) (2 matches)
  - [apps/optimitron/src/components/tasks/TaskExternalActionApprovals.tsx](../apps/optimitron/src/components/tasks/TaskExternalActionApprovals.tsx) (1 matches)
  - [apps/optimitron/src/lib/email/preview-envelope.ts](../apps/optimitron/src/lib/email/preview-envelope.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/task-comment-notification.email.md](../apps/optimitron/src/lib/tasks/task-comment-notification.email.md) (2 matches)
  - [packages/data/src/datasets/medical-data/treatments/hemophilia.json](../packages/data/src/datasets/medical-data/treatments/hemophilia.json) (2 matches)
  - [apps/optimitron/src/lib/email/inbound-monitor-forward.ts](../apps/optimitron/src/lib/email/inbound-monitor-forward.ts) (1 matches)
- Notes:
  - none

### Task

- Schema: [packages/db/prisma/schema.prisma#L5846](../packages/db/prisma/schema.prisma#L5846)
- Classification: `core`
- Direct Prisma usage: 65 files / 218 matches
- Usage counts by bucket:
  - `runtime-prisma`: 65 files / 218 matches
  - `api-routes`: 14 files / 39 matches
  - `pages`: 8 files / 22 matches
  - `components`: 13 files / 17 matches
  - `runtime-libraries`: 86 files / 419 matches
  - `scripts`: 14 files / 32 matches
  - `tests`: 36 files / 92 matches
  - `docs`: 18 files / 69 matches
  - `schema`: 1 files / 64 matches
  - `migrations`: 26 files / 134 matches
  - `generated`: 36 files / 880 matches
  - `zod`: 1 files / 1 matches
  - `other`: 31 files / 127 matches
- Key files:
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (133 matches)
  - [apps/optimitron/src/lib/tasks.server.ts](../apps/optimitron/src/lib/tasks.server.ts) (86 matches)
  - [apps/optimitron/src/lib/tasks/document-review.server.ts](../apps/optimitron/src/lib/tasks/document-review.server.ts) (33 matches)
  - [apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts](../apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts) (28 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (20 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (19 matches)
  - [apps/optimitron/src/lib/tasks/private-task-bundle.server.ts](../apps/optimitron/src/lib/tasks/private-task-bundle.server.ts) (16 matches)
  - [apps/optimitron/src/lib/triggers/fire-handlers.ts](../apps/optimitron/src/lib/triggers/fire-handlers.ts) (16 matches)
- Notes:
  - none

### TaskApplication

- Schema: [packages/db/prisma/schema.prisma#L7469](../packages/db/prisma/schema.prisma#L7469)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 12 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 12 matches
  - `api-routes`: 1 files / 1 matches
  - `runtime-libraries`: 3 files / 12 matches
  - `schema`: 1 files / 11 matches
  - `migrations`: 1 files / 22 matches
  - `generated`: 15 files / 371 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (8 matches)
  - [apps/optimitron/src/lib/task-applications.server.ts](../apps/optimitron/src/lib/task-applications.server.ts) (8 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (7 matches)
  - [apps/optimitron/src/app/api/tasks/[id]/applications/[applicationId]/route.ts](../apps/optimitron/src/app/api/tasks/[id]/applications/[applicationId]/route.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (11 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (22 matches)
  - [packages/db/src/generated/prisma/models/TaskApplication.ts](../packages/db/src/generated/prisma/models/TaskApplication.ts) (304 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (39 matches)
- Notes:
  - none

### TaskApplicationEvent

- Schema: [packages/db/prisma/schema.prisma#L7577](../packages/db/prisma/schema.prisma#L7577)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 10 files / 217 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (4 matches)
  - [apps/optimitron/src/lib/task-applications.server.ts](../apps/optimitron/src/lib/task-applications.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/TaskApplicationEvent.ts](../packages/db/src/generated/prisma/models/TaskApplicationEvent.ts) (176 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### TaskCandidateMatch

- Schema: [packages/db/prisma/schema.prisma#L6630](../packages/db/prisma/schema.prisma#L6630)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 7 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 7 matches
  - `runtime-libraries`: 3 files / 7 matches
  - `schema`: 1 files / 8 matches
  - `migrations`: 1 files / 17 matches
  - `generated`: 14 files / 304 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (6 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (6 matches)
  - [apps/optimitron/src/lib/tasks/personal-planning.server.ts](../apps/optimitron/src/lib/tasks/personal-planning.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (8 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (17 matches)
  - [packages/db/src/generated/prisma/models/TaskCandidateMatch.ts](../packages/db/src/generated/prisma/models/TaskCandidateMatch.ts) (247 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (33 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### TaskClaim

- Schema: [packages/db/prisma/schema.prisma#L7630](../packages/db/prisma/schema.prisma#L7630)
- Classification: `core`
- Direct Prisma usage: 5 files / 19 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 19 matches
  - `runtime-libraries`: 6 files / 23 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 4 files / 14 matches
  - `generated`: 12 files / 241 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [apps/optimitron/src/lib/tasks.server.ts](../apps/optimitron/src/lib/tasks.server.ts) (26 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (7 matches)
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (2 matches)
  - [apps/optimitron/src/lib/flyer-hang/ensure-nearby.server.ts](../apps/optimitron/src/lib/flyer-hang/ensure-nearby.server.ts) (2 matches)
  - [apps/optimitron/src/lib/task-payouts.server.ts](../apps/optimitron/src/lib/task-payouts.server.ts) (2 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (3 matches)
  - [apps/optimitron/src/lib/tasks/agent-lease.server.ts](../apps/optimitron/src/lib/tasks/agent-lease.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### TaskComment

- Schema: [packages/db/prisma/schema.prisma#L7892](../packages/db/prisma/schema.prisma#L7892)
- Classification: `runtime-live`
- Direct Prisma usage: 12 files / 38 matches
- Usage counts by bucket:
  - `runtime-prisma`: 12 files / 38 matches
  - `runtime-libraries`: 13 files / 47 matches
  - `scripts`: 3 files / 4 matches
  - `docs`: 6 files / 13 matches
  - `schema`: 1 files / 21 matches
  - `migrations`: 6 files / 38 matches
  - `generated`: 17 files / 411 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/task-comments.server.ts](../apps/optimitron/src/lib/tasks/task-comments.server.ts) (32 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (11 matches)
  - [apps/optimitron/src/lib/tasks/user-treaty-task-progress.server.ts](../apps/optimitron/src/lib/tasks/user-treaty-task-progress.server.ts) (10 matches)
  - [apps/optimitron/src/lib/referral-invitations.server.ts](../apps/optimitron/src/lib/referral-invitations.server.ts) (6 matches)
  - [apps/optimitron/src/lib/triggers/fire-handlers.ts](../apps/optimitron/src/lib/triggers/fire-handlers.ts) (5 matches)
  - [apps/optimitron/src/lib/email/inbound-reply.ts](../apps/optimitron/src/lib/email/inbound-reply.ts) (4 matches)
  - [apps/optimitron/src/lib/tasks/document-review.server.ts](../apps/optimitron/src/lib/tasks/document-review.server.ts) (3 matches)
  - [apps/optimitron/src/lib/tasks/task-comment-notifications.server.ts](../apps/optimitron/src/lib/tasks/task-comment-notifications.server.ts) (3 matches)
- Notes:
  - none

### TaskCommentAttachment

- Schema: [packages/db/prisma/schema.prisma#L8013](../packages/db/prisma/schema.prisma#L8013)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 19 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 19 matches
  - `runtime-libraries`: 4 files / 18 matches
  - `scripts`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 11 files / 231 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/task-comment-attachments.server.ts](../apps/optimitron/src/lib/tasks/task-comment-attachments.server.ts) (18 matches)
  - [apps/optimitron/src/lib/tasks/task-comments.server.ts](../apps/optimitron/src/lib/tasks/task-comments.server.ts) (14 matches)
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts](../apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260713160000_add_private_task_comment_attachments/migration.sql](../packages/db/prisma/migrations/20260713160000_add_private_task_comment_attachments/migration.sql) (9 matches)
  - [packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql](../packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql) (1 matches)
- Notes:
  - none

### TaskCommentVote

- Schema: [packages/db/prisma/schema.prisma#L8062](../packages/db/prisma/schema.prisma#L8062)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 9 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 9 matches
  - `runtime-libraries`: 1 files / 9 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 9 files / 168 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/task-comments.server.ts](../apps/optimitron/src/lib/tasks/task-comments.server.ts) (18 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260425200000_create_task_comment_tables/migration.sql](../packages/db/prisma/migrations/20260425200000_create_task_comment_tables/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/TaskCommentVote.ts](../packages/db/src/generated/prisma/models/TaskCommentVote.ts) (131 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### TaskCommunication

- Schema: [packages/db/prisma/schema.prisma#L8672](../packages/db/prisma/schema.prisma#L8672)
- Classification: `runtime-live`
- Direct Prisma usage: 11 files / 35 matches
- Usage counts by bucket:
  - `runtime-prisma`: 11 files / 35 matches
  - `runtime-libraries`: 14 files / 45 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 4 files / 20 matches
  - `schema`: 1 files / 20 matches
  - `migrations`: 4 files / 48 matches
  - `generated`: 21 files / 487 matches
  - `other`: 4 files / 11 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/task-notifications.server.ts](../apps/optimitron/src/lib/tasks/task-notifications.server.ts) (29 matches)
  - [apps/optimitron/src/lib/email/inbound-reply.ts](../apps/optimitron/src/lib/email/inbound-reply.ts) (10 matches)
  - [apps/optimitron/src/lib/triggers/fire-handlers.ts](../apps/optimitron/src/lib/triggers/fire-handlers.ts) (9 matches)
  - [apps/optimitron/src/lib/communications-audit.server.ts](../apps/optimitron/src/lib/communications-audit.server.ts) (7 matches)
  - [apps/optimitron/src/lib/tasks/task-communications.server.ts](../apps/optimitron/src/lib/tasks/task-communications.server.ts) (6 matches)
  - [apps/optimitron/src/lib/admin-communications.server.ts](../apps/optimitron/src/lib/admin-communications.server.ts) (4 matches)
  - [apps/optimitron/src/lib/tasks/task-recipient-rate-limit.server.ts](../apps/optimitron/src/lib/tasks/task-recipient-rate-limit.server.ts) (4 matches)
  - [apps/optimitron/scripts/soft-delete-funding-tasks.ts](../apps/optimitron/scripts/soft-delete-funding-tasks.ts) (2 matches)
- Notes:
  - none

### TaskCommunicationEndpoint

- Schema: [packages/db/prisma/schema.prisma#L8503](../packages/db/prisma/schema.prisma#L8503)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 8 matches
  - `runtime-libraries`: 3 files / 10 matches
  - `docs`: 3 files / 4 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 9 files / 209 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (8 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (6 matches)
  - [apps/optimitron/src/lib/triggers/fire-handlers.ts](../apps/optimitron/src/lib/triggers/fire-handlers.ts) (4 matches)
  - [docs/TASK_COMMUNICATION_MODEL.md](../docs/TASK_COMMUNICATION_MODEL.md) (2 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260425220000_task_communication_system/migration.sql](../packages/db/prisma/migrations/20260425220000_task_communication_system/migration.sql) (9 matches)
- Notes:
  - none

### TaskCommunicationSpawnSpec

- Schema: [packages/db/prisma/schema.prisma#L9034](../packages/db/prisma/schema.prisma#L9034)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `runtime-libraries`: 3 files / 6 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 3 files / 8 matches
  - `generated`: 8 files / 214 matches
  - `other`: 1 files / 7 matches
- Key files:
  - [packages/db/src/managed-data/managed-task-triggers.ts](../packages/db/src/managed-data/managed-task-triggers.ts) (5 matches)
  - [apps/optimitron/src/lib/triggers/admin.ts](../apps/optimitron/src/lib/triggers/admin.ts) (4 matches)
  - [apps/optimitron/src/lib/triggers/iteration-sources.ts](../apps/optimitron/src/lib/triggers/iteration-sources.ts) (1 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260428130000_add_task_triggers/migration.sql](../packages/db/prisma/migrations/20260428130000_add_task_triggers/migration.sql) (4 matches)
  - [packages/db/prisma/migrations/20260429180000_add_trigger_schedule_sendcount/migration.sql](../packages/db/prisma/migrations/20260429180000_add_trigger_schedule_sendcount/migration.sql) (3 matches)
- Notes:
  - none

### TaskCommunicationTemplate

- Schema: [packages/db/prisma/schema.prisma#L8562](../packages/db/prisma/schema.prisma#L8562)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 3 matches
  - `runtime-libraries`: 1 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 3 files / 14 matches
  - `generated`: 10 files / 191 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (6 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260425220000_task_communication_system/migration.sql](../packages/db/prisma/migrations/20260425220000_task_communication_system/migration.sql) (10 matches)
  - [packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql](../packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql) (3 matches)
  - [packages/db/prisma/migrations/20260425230000_add_user_is_system/migration.sql](../packages/db/prisma/migrations/20260425230000_add_user_is_system/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/TaskCommunicationTemplate.ts](../packages/db/src/generated/prisma/models/TaskCommunicationTemplate.ts) (148 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (26 matches)
- Notes:
  - none

### TaskCommunicationVariant

- Schema: [packages/db/prisma/schema.prisma#L8605](../packages/db/prisma/schema.prisma#L8605)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 9 matches
  - `generated`: 10 files / 231 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260425220000_task_communication_system/migration.sql](../packages/db/prisma/migrations/20260425220000_task_communication_system/migration.sql) (8 matches)
  - [packages/db/prisma/migrations/20260425230000_add_user_is_system/migration.sql](../packages/db/prisma/migrations/20260425230000_add_user_is_system/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/TaskCommunicationVariant.ts](../packages/db/src/generated/prisma/models/TaskCommunicationVariant.ts) (188 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (26 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/models/ShareAttempt.ts](../packages/db/src/generated/prisma/models/ShareAttempt.ts) (3 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### TaskDistributionAttempt

- Schema: [packages/db/prisma/schema.prisma#L7095](../packages/db/prisma/schema.prisma#L7095)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 8 matches
  - `migrations`: 1 files / 24 matches
  - `generated`: 13 files / 353 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (8 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (24 matches)
  - [packages/db/src/generated/prisma/models/TaskDistributionAttempt.ts](../packages/db/src/generated/prisma/models/TaskDistributionAttempt.ts) (296 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (33 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### TaskDistributionTarget

- Schema: [packages/db/prisma/schema.prisma#L7041](../packages/db/prisma/schema.prisma#L7041)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 8 matches
  - `generated`: 9 files / 213 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (8 matches)
  - [packages/db/src/generated/prisma/models/TaskDistributionTarget.ts](../packages/db/src/generated/prisma/models/TaskDistributionTarget.ts) (176 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts](../packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### TaskEdge

- Schema: [packages/db/prisma/schema.prisma#L8127](../packages/db/prisma/schema.prisma#L8127)
- Classification: `core`
- Direct Prisma usage: 8 files / 29 matches
- Usage counts by bucket:
  - `runtime-prisma`: 8 files / 29 matches
  - `runtime-libraries`: 8 files / 29 matches
  - `docs`: 4 files / 5 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 12 matches
  - `generated`: 8 files / 208 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 3 matches
- Key files:
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (28 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (16 matches)
  - [apps/optimitron/src/lib/tasks.server.ts](../apps/optimitron/src/lib/tasks.server.ts) (4 matches)
  - [apps/optimitron/src/lib/form-responses.server.ts](../apps/optimitron/src/lib/form-responses.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/personal-planning.server.ts](../apps/optimitron/src/lib/tasks/personal-planning.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/private-task-bundle.server.ts](../apps/optimitron/src/lib/tasks/private-task-bundle.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/private-work-portability.server.ts](../apps/optimitron/src/lib/tasks/private-work-portability.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/task-tree-steward.server.ts](../apps/optimitron/src/lib/tasks/task-tree-steward.server.ts) (2 matches)
- Notes:
  - none

### TaskExecutionArtifact

- Schema: [packages/db/prisma/schema.prisma#L6837](../packages/db/prisma/schema.prisma#L6837)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 12 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 12 matches
  - `runtime-libraries`: 3 files / 11 matches
  - `scripts`: 2 files / 3 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 4 files / 4 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 15 matches
  - `generated`: 13 files / 269 matches
  - `other`: 2 files / 8 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/document-review.server.ts](../apps/optimitron/src/lib/tasks/document-review.server.ts) (16 matches)
  - [apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts](../apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts) (4 matches)
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/document-review-invalidation.server.ts](../apps/optimitron/src/lib/tasks/document-review-invalidation.server.ts) (2 matches)
  - [apps/optimitron/scripts/verify-preview-masking.mjs](../apps/optimitron/scripts/verify-preview-masking.mjs) (2 matches)
  - [apps/optimitron/src/lib/tasks/document-review.integration.test.ts](../apps/optimitron/src/lib/tasks/document-review.integration.test.ts) (2 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [docs/plans/phased-approach-optimitron.md](../docs/plans/phased-approach-optimitron.md) (1 matches)
- Notes:
  - none

### TaskExecutionAttempt

- Schema: [packages/db/prisma/schema.prisma#L6712](../packages/db/prisma/schema.prisma#L6712)
- Classification: `runtime-live`
- Direct Prisma usage: 10 files / 18 matches
- Usage counts by bucket:
  - `runtime-prisma`: 10 files / 18 matches
  - `api-routes`: 1 files / 1 matches
  - `runtime-libraries`: 8 files / 16 matches
  - `scripts`: 1 files / 1 matches
  - `tests`: 1 files / 1 matches
  - `docs`: 3 files / 4 matches
  - `schema`: 1 files / 15 matches
  - `migrations`: 3 files / 31 matches
  - `generated`: 19 files / 436 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts](../apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts) (10 matches)
  - [apps/optimitron/src/lib/tasks/document-review.server.ts](../apps/optimitron/src/lib/tasks/document-review.server.ts) (6 matches)
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (4 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (4 matches)
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (2 matches)
  - [apps/optimitron/src/app/api/extension/tasks/[id]/done/route.ts](../apps/optimitron/src/app/api/extension/tasks/[id]/done/route.ts) (2 matches)
  - [apps/optimitron/src/lib/mcp-tools/private-execution.ts](../apps/optimitron/src/lib/mcp-tools/private-execution.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/agent-lease.server.ts](../apps/optimitron/src/lib/tasks/agent-lease.server.ts) (2 matches)
- Notes:
  - none

### TaskFundingEvent

- Schema: [packages/db/prisma/schema.prisma#L7300](../packages/db/prisma/schema.prisma#L7300)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 2 files / 8 matches
  - `generated`: 10 files / 206 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/task-funding/pledges.server.ts](../apps/optimitron/src/lib/task-funding/pledges.server.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (6 matches)
  - [packages/db/prisma/migrations/20260521184500_add_task_funding_event_deleted_at/migration.sql](../packages/db/prisma/migrations/20260521184500_add_task_funding_event_deleted_at/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/TaskFundingEvent.ts](../packages/db/src/generated/prisma/models/TaskFundingEvent.ts) (165 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### TaskFundingPayment

- Schema: [packages/db/prisma/schema.prisma#L7324](../packages/db/prisma/schema.prisma#L7324)
- Classification: `runtime-live`
- Direct Prisma usage: 6 files / 29 matches
- Usage counts by bucket:
  - `runtime-prisma`: 6 files / 29 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 5 files / 30 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 2 files / 19 matches
  - `generated`: 13 files / 311 matches
  - `other`: 2 files / 3 matches
- Key files:
  - [apps/optimitron/src/lib/task-funding/payments.server.ts](../apps/optimitron/src/lib/task-funding/payments.server.ts) (24 matches)
  - [apps/optimitron/src/lib/task-funding/escrow.server.ts](../apps/optimitron/src/lib/task-funding/escrow.server.ts) (22 matches)
  - [apps/optimitron/src/lib/task-funding/status.server.ts](../apps/optimitron/src/lib/task-funding/status.server.ts) (8 matches)
  - [apps/optimitron/src/app/admin/task-payouts/page.tsx](../apps/optimitron/src/app/admin/task-payouts/page.tsx) (2 matches)
  - [apps/optimitron/src/lib/task-payouts.server.ts](../apps/optimitron/src/lib/task-payouts.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260701120000_add_task_funding_payments_and_payouts/migration.sql](../packages/db/prisma/migrations/20260701120000_add_task_funding_payments_and_payouts/migration.sql) (16 matches)
- Notes:
  - none

### TaskFundingPledge

- Schema: [packages/db/prisma/schema.prisma#L7240](../packages/db/prisma/schema.prisma#L7240)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 25 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 25 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 4 files / 27 matches
  - `schema`: 1 files / 10 matches
  - `migrations`: 2 files / 18 matches
  - `generated`: 15 files / 401 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/task-funding/escrow.server.ts](../apps/optimitron/src/lib/task-funding/escrow.server.ts) (30 matches)
  - [apps/optimitron/src/lib/task-funding/pledges.server.ts](../apps/optimitron/src/lib/task-funding/pledges.server.ts) (11 matches)
  - [apps/optimitron/src/lib/task-funding/status.server.ts](../apps/optimitron/src/lib/task-funding/status.server.ts) (8 matches)
  - [apps/optimitron/src/app/admin/task-payouts/page.tsx](../apps/optimitron/src/app/admin/task-payouts/page.tsx) (2 matches)
  - [apps/optimitron/src/lib/task-funding/payments.server.ts](../apps/optimitron/src/lib/task-funding/payments.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (10 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (15 matches)
  - [packages/db/prisma/migrations/20260703050000_add_assurance_escrow_pledges/migration.sql](../packages/db/prisma/migrations/20260703050000_add_assurance_escrow_pledges/migration.sql) (3 matches)
- Notes:
  - none

### TaskFundingTarget

- Schema: [packages/db/prisma/schema.prisma#L7211](../packages/db/prisma/schema.prisma#L7211)
- Classification: `runtime-live`
- Direct Prisma usage: 9 files / 21 matches
- Usage counts by bucket:
  - `runtime-prisma`: 9 files / 21 matches
  - `api-routes`: 1 files / 1 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 7 files / 21 matches
  - `tests`: 2 files / 3 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 7 matches
  - `generated`: 9 files / 246 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/task-funding/escrow.server.ts](../apps/optimitron/src/lib/task-funding/escrow.server.ts) (12 matches)
  - [apps/optimitron/src/lib/task-funding/payments.server.ts](../apps/optimitron/src/lib/task-funding/payments.server.ts) (8 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (7 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (5 matches)
  - [apps/optimitron/src/lib/task-funding/pledges.server.ts](../apps/optimitron/src/lib/task-funding/pledges.server.ts) (4 matches)
  - [apps/optimitron/src/app/admin/task-payouts/page.tsx](../apps/optimitron/src/app/admin/task-payouts/page.tsx) (2 matches)
  - [apps/optimitron/src/app/api/tasks/[id]/pledge/route.ts](../apps/optimitron/src/app/api/tasks/[id]/pledge/route.ts) (2 matches)
  - [apps/optimitron/src/lib/public-task-page.server.ts](../apps/optimitron/src/lib/public-task-page.server.ts) (2 matches)
- Notes:
  - none

### TaskImpactEstimateInput

- Schema: [packages/db/prisma/schema.prisma#L8257](../packages/db/prisma/schema.prisma#L8257)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 168 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/import-task-bundle.server.ts](../apps/optimitron/src/lib/tasks/import-task-bundle.server.ts) (4 matches)
  - [apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts](../apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql](../packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/TaskImpactEstimateInput.ts](../packages/db/src/generated/prisma/models/TaskImpactEstimateInput.ts) (131 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### TaskImpactEstimateSet

- Schema: [packages/db/prisma/schema.prisma#L8187](../packages/db/prisma/schema.prisma#L8187)
- Classification: `core`
- Direct Prisma usage: 5 files / 17 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 17 matches
  - `runtime-libraries`: 5 files / 17 matches
  - `docs`: 3 files / 3 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 3 files / 15 matches
  - `generated`: 8 files / 248 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/import-task-bundle.server.ts](../apps/optimitron/src/lib/tasks/import-task-bundle.server.ts) (10 matches)
  - [apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts](../apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts) (8 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (8 matches)
  - [apps/optimitron/src/lib/tasks/per-verified-voter-impact.server.ts](../apps/optimitron/src/lib/tasks/per-verified-voter-impact.server.ts) (4 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (4 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (1 matches)
- Notes:
  - none

### TaskImpactFrameEstimate

- Schema: [packages/db/prisma/schema.prisma#L8277](../packages/db/prisma/schema.prisma#L8277)
- Classification: `core`
- Direct Prisma usage: 5 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 5 matches
  - `runtime-libraries`: 5 files / 5 matches
  - `docs`: 4 files / 4 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 337 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts](../apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/import-task-bundle.server.ts](../apps/optimitron/src/lib/tasks/import-task-bundle.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/per-verified-voter-impact.server.ts](../apps/optimitron/src/lib/tasks/per-verified-voter-impact.server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/wishonia-task-reply.server.ts](../apps/optimitron/src/lib/tasks/wishonia-task-reply.server.ts) (2 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [docs/ROADMAP.md](../docs/ROADMAP.md) (1 matches)
- Notes:
  - none

### TaskImpactMetric

- Schema: [packages/db/prisma/schema.prisma#L8411](../packages/db/prisma/schema.prisma#L8411)
- Classification: `core`
- Direct Prisma usage: 4 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 6 matches
  - `runtime-libraries`: 4 files / 6 matches
  - `docs`: 2 files / 3 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 194 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/import-task-bundle.server.ts](../apps/optimitron/src/lib/tasks/import-task-bundle.server.ts) (4 matches)
  - [apps/optimitron/src/lib/tasks/per-verified-voter-impact.server.ts](../apps/optimitron/src/lib/tasks/per-verified-voter-impact.server.ts) (4 matches)
  - [apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts](../apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (6 matches)
- Notes:
  - none

### TaskImpactSourceArtifact

- Schema: [packages/db/prisma/schema.prisma#L8464](../packages/db/prisma/schema.prisma#L8464)
- Classification: `core`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `runtime-libraries`: 2 files / 4 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 158 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/import-task-bundle.server.ts](../apps/optimitron/src/lib/tasks/import-task-bundle.server.ts) (6 matches)
  - [apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts](../apps/optimitron/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/TaskImpactSourceArtifact.ts](../packages/db/src/generated/prisma/models/TaskImpactSourceArtifact.ts) (121 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### TaskManager

- Schema: [packages/db/prisma/schema.prisma#L6126](../packages/db/prisma/schema.prisma#L6126)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `runtime-libraries`: 2 files / 4 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 9 files / 187 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (6 matches)
  - [apps/optimitron/src/lib/task-applications.server.ts](../apps/optimitron/src/lib/task-applications.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/TaskManager.ts](../packages/db/src/generated/prisma/models/TaskManager.ts) (146 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### TaskMarketplaceListing

- Schema: [packages/db/prisma/schema.prisma#L6967](../packages/db/prisma/schema.prisma#L6967)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 15 matches
  - `generated`: 12 files / 270 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (15 matches)
  - [packages/db/src/generated/prisma/models/TaskMarketplaceListing.ts](../packages/db/src/generated/prisma/models/TaskMarketplaceListing.ts) (221 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### TaskPayout

- Schema: [packages/db/prisma/schema.prisma#L7420](../packages/db/prisma/schema.prisma#L7420)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 19 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 19 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 3 files / 20 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 16 matches
  - `generated`: 12 files / 307 matches
- Key files:
  - [apps/optimitron/src/lib/task-payouts.server.ts](../apps/optimitron/src/lib/task-payouts.server.ts) (32 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (5 matches)
  - [apps/optimitron/src/app/admin/task-payouts/page.tsx](../apps/optimitron/src/app/admin/task-payouts/page.tsx) (2 matches)
  - [apps/optimitron/src/lib/tasks.server.ts](../apps/optimitron/src/lib/tasks.server.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260701120000_add_task_funding_payments_and_payouts/migration.sql](../packages/db/prisma/migrations/20260701120000_add_task_funding_payments_and_payouts/migration.sql) (16 matches)
  - [packages/db/src/generated/prisma/models/TaskPayout.ts](../packages/db/src/generated/prisma/models/TaskPayout.ts) (254 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (31 matches)
- Notes:
  - none

### TaskSourceArtifact

- Schema: [packages/db/prisma/schema.prisma#L8097](../packages/db/prisma/schema.prisma#L8097)
- Classification: `core`
- Direct Prisma usage: 7 files / 13 matches
- Usage counts by bucket:
  - `runtime-prisma`: 7 files / 13 matches
  - `runtime-libraries`: 6 files / 11 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 4 files / 5 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 9 files / 158 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/import-task-bundle.server.ts](../apps/optimitron/src/lib/tasks/import-task-bundle.server.ts) (6 matches)
  - [apps/optimitron/src/lib/tasks/task-merge.server.ts](../apps/optimitron/src/lib/tasks/task-merge.server.ts) (6 matches)
  - [apps/optimitron/scripts/extract-tasks-from-manual.ts](../apps/optimitron/scripts/extract-tasks-from-manual.ts) (4 matches)
  - [apps/optimitron/src/lib/tasks/private-task-bundle.server.ts](../apps/optimitron/src/lib/tasks/private-task-bundle.server.ts) (4 matches)
  - [apps/optimitron/src/lib/form-responses.server.ts](../apps/optimitron/src/lib/form-responses.server.ts) (2 matches)
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/private-work-portability.server.ts](../apps/optimitron/src/lib/tasks/private-work-portability.server.ts) (2 matches)
  - [docs/plans/phased-approach-optimitron.md](../docs/plans/phased-approach-optimitron.md) (2 matches)
- Notes:
  - none

### TaskSpawnSpec

- Schema: [packages/db/prisma/schema.prisma#L8939](../packages/db/prisma/schema.prisma#L8939)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `runtime-libraries`: 6 files / 8 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 3 files / 6 matches
  - `generated`: 8 files / 259 matches
  - `other`: 2 files / 12 matches
- Key files:
  - [apps/optimitron/src/lib/triggers/admin.ts](../apps/optimitron/src/lib/triggers/admin.ts) (4 matches)
  - [packages/db/src/managed-data/managed-task-triggers.ts](../packages/db/src/managed-data/managed-task-triggers.ts) (4 matches)
  - [apps/optimitron/src/lib/triggers/completion-gate.ts](../apps/optimitron/src/lib/triggers/completion-gate.ts) (1 matches)
  - [apps/optimitron/src/lib/triggers/fire-types.ts](../apps/optimitron/src/lib/triggers/fire-types.ts) (1 matches)
  - [apps/optimitron/src/lib/triggers/fire.ts](../apps/optimitron/src/lib/triggers/fire.ts) (1 matches)
  - [apps/optimitron/src/lib/triggers/resolvers.ts](../apps/optimitron/src/lib/triggers/resolvers.ts) (1 matches)
  - [apps/optimitron/scripts/verify-preview-masking.mjs](../apps/optimitron/scripts/verify-preview-masking.mjs) (2 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
- Notes:
  - none

### TaskTrigger

- Schema: [packages/db/prisma/schema.prisma#L8835](../packages/db/prisma/schema.prisma#L8835)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 11 matches
  - `api-routes`: 1 files / 3 matches
  - `runtime-libraries`: 13 files / 28 matches
  - `scripts`: 2 files / 4 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 6 files / 10 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 3 files / 14 matches
  - `generated`: 11 files / 265 matches
  - `other`: 5 files / 47 matches
- Key files:
  - [apps/optimitron/src/lib/triggers/admin.ts](../apps/optimitron/src/lib/triggers/admin.ts) (13 matches)
  - [packages/db/src/managed-data/managed-task-triggers.ts](../packages/db/src/managed-data/managed-task-triggers.ts) (8 matches)
  - [apps/optimitron/src/app/api/cron/run-due-triggers/route.ts](../apps/optimitron/src/app/api/cron/run-due-triggers/route.ts) (4 matches)
  - [apps/optimitron/src/lib/mcp-tools/task-triggers.ts](../apps/optimitron/src/lib/mcp-tools/task-triggers.ts) (6 matches)
  - [apps/optimitron/src/lib/mcp-tools/task-templates.ts](../apps/optimitron/src/lib/mcp-tools/task-templates.ts) (2 matches)
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (1 matches)
  - [apps/optimitron/src/lib/post-signin-sync.server.ts](../apps/optimitron/src/lib/post-signin-sync.server.ts) (1 matches)
  - [apps/optimitron/src/lib/referral-invitation-tasks.server.ts](../apps/optimitron/src/lib/referral-invitation-tasks.server.ts) (1 matches)
- Notes:
  - none

### TaskTriggerFire

- Schema: [packages/db/prisma/schema.prisma#L9111](../packages/db/prisma/schema.prisma#L9111)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `api-routes`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 2 files / 7 matches
  - `generated`: 8 files / 180 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [apps/optimitron/src/lib/triggers/fire.ts](../apps/optimitron/src/lib/triggers/fire.ts) (4 matches)
  - [apps/optimitron/src/app/api/cron/run-due-triggers/route.ts](../apps/optimitron/src/app/api/cron/run-due-triggers/route.ts) (2 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260428130000_add_task_triggers/migration.sql](../packages/db/prisma/migrations/20260428130000_add_task_triggers/migration.sql) (6 matches)
  - [packages/db/prisma/migrations/20260509230000_delete_generic_overdue_reminder_trigger/migration.sql](../packages/db/prisma/migrations/20260509230000_delete_generic_overdue_reminder_trigger/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/TaskTriggerFire.ts](../packages/db/src/generated/prisma/models/TaskTriggerFire.ts) (141 matches)
- Notes:
  - none

### TaskVerification

- Schema: [packages/db/prisma/schema.prisma#L6878](../packages/db/prisma/schema.prisma#L6878)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 6 matches
  - `runtime-libraries`: 3 files / 6 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 5 files / 6 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 12 matches
  - `generated`: 11 files / 247 matches
  - `other`: 2 files / 5 matches
- Key files:
  - [apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts](../apps/optimitron/src/lib/tasks/execution-lifecycle.server.ts) (8 matches)
  - [apps/optimitron/src/lib/mcp-tools/private-execution.ts](../apps/optimitron/src/lib/mcp-tools/private-execution.ts) (2 matches)
  - [apps/optimitron/src/lib/tasks/document-review.server.ts](../apps/optimitron/src/lib/tasks/document-review.server.ts) (2 matches)
  - [apps/optimitron/scripts/verify-preview-masking.mjs](../apps/optimitron/scripts/verify-preview-masking.mjs) (2 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (2 matches)
  - [docs/plans/phased-approach-optimitron.md](../docs/plans/phased-approach-optimitron.md) (1 matches)
  - [docs/PRD.md](../docs/PRD.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### TrackingReminder

- Schema: [packages/db/prisma/schema.prisma#L3030](../packages/db/prisma/schema.prisma#L3030)
- Classification: `tests-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `tests`: 2 files / 3 matches
  - `docs`: 5 files / 6 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 2 files / 9 matches
  - `generated`: 10 files / 223 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 11 matches
- Key files:
  - [apps/optimitron/src/lib/__tests__/mcp-server.test.ts](../apps/optimitron/src/lib/__tests__/mcp-server.test.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (2 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
  - [docs/PRD.md](../docs/PRD.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [docs/ROADMAP.md](../docs/ROADMAP.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### TrackingReminderNotification

- Schema: [packages/db/prisma/schema.prisma#L3098](../packages/db/prisma/schema.prisma#L3098)
- Classification: `tests-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `tests`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 8 files / 184 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (5 matches)
  - [packages/db/src/generated/prisma/models/TrackingReminderNotification.ts](../packages/db/src/generated/prisma/models/TrackingReminderNotification.ts) (147 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (3 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (3 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### Unit

- Schema: [packages/db/prisma/schema.prisma#L2278](../packages/db/prisma/schema.prisma#L2278)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 4 matches
  - `api-routes`: 1 files / 2 matches
  - `components`: 2 files / 2 matches
  - `runtime-libraries`: 23 files / 32 matches
  - `tests`: 4 files / 6 matches
  - `docs`: 10 files / 14 matches
  - `schema`: 1 files / 24 matches
  - `migrations`: 2 files / 13 matches
  - `generated`: 17 files / 288 matches
  - `zod`: 1 files / 1 matches
  - `other`: 20 files / 42 matches
- Key files:
  - [apps/optimitron/src/lib/profile.server.ts](../apps/optimitron/src/lib/profile.server.ts) (4 matches)
  - [apps/optimitron/src/app/api/health-analysis/submit/route.ts](../apps/optimitron/src/app/api/health-analysis/submit/route.ts) (3 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [apps/optimitron/src/components/site/EarthOptimizationServicesLandingPage.tsx](../apps/optimitron/src/components/site/EarthOptimizationServicesLandingPage.tsx) (1 matches)
  - [apps/optimitron/src/components/task-funding/TaskFundingProgress.tsx](../apps/optimitron/src/components/task-funding/TaskFundingProgress.tsx) (1 matches)
  - [packages/data/src/measurement-validation.ts](../packages/data/src/measurement-validation.ts) (3 matches)
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (2 matches)
  - [packages/data/src/datasets/medical-data/treatments/covid-19.json](../packages/data/src/datasets/medical-data/treatments/covid-19.json) (2 matches)
- Notes:
  - none

### User

- Schema: [packages/db/prisma/schema.prisma#L1763](../packages/db/prisma/schema.prisma#L1763)
- Classification: `core`
- Direct Prisma usage: 87 files / 157 matches
- Usage counts by bucket:
  - `runtime-prisma`: 87 files / 157 matches
  - `api-routes`: 17 files / 26 matches
  - `pages`: 5 files / 7 matches
  - `components`: 5 files / 6 matches
  - `runtime-libraries`: 88 files / 202 matches
  - `scripts`: 6 files / 30 matches
  - `tests`: 26 files / 62 matches
  - `docs`: 9 files / 29 matches
  - `schema`: 1 files / 160 matches
  - `migrations`: 38 files / 217 matches
  - `generated`: 69 files / 1481 matches
  - `zod`: 1 files / 1 matches
  - `other`: 65 files / 164 matches
- Key files:
  - [apps/optimitron/src/lib/mcp-server.ts](../apps/optimitron/src/lib/mcp-server.ts) (24 matches)
  - [apps/optimitron/scripts/import-dih-users-votes.ts](../apps/optimitron/scripts/import-dih-users-votes.ts) (20 matches)
  - [apps/optimitron/src/lib/tasks.server.ts](../apps/optimitron/src/lib/tasks.server.ts) (18 matches)
  - [apps/optimitron/src/lib/profile.server.ts](../apps/optimitron/src/lib/profile.server.ts) (12 matches)
  - [apps/optimitron/src/lib/auth-utils.ts](../apps/optimitron/src/lib/auth-utils.ts) (9 matches)
  - [apps/optimitron/src/lib/person.server.ts](../apps/optimitron/src/lib/person.server.ts) (9 matches)
  - [apps/optimitron/src/lib/profile-identity.server.ts](../apps/optimitron/src/lib/profile-identity.server.ts) (9 matches)
  - [apps/optimitron/scripts/seed-visual-review-fixtures.ts](../apps/optimitron/scripts/seed-visual-review-fixtures.ts) (8 matches)
- Notes:
  - none

### UserPreference

- Schema: [packages/db/prisma/schema.prisma#L4589](../packages/db/prisma/schema.prisma#L4589)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 6 matches
  - `api-routes`: 3 files / 5 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 8 files / 173 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 4 matches
- Key files:
  - [apps/optimitron/src/app/api/cron/push-notifications/route.ts](../apps/optimitron/src/app/api/cron/push-notifications/route.ts) (4 matches)
  - [apps/optimitron/src/app/api/push/preferences/route.ts](../apps/optimitron/src/app/api/push/preferences/route.ts) (4 matches)
  - [apps/optimitron/src/app/api/push/subscribe/route.ts](../apps/optimitron/src/app/api/push/subscribe/route.ts) (2 matches)
  - [apps/optimitron/src/lib/profile.server.ts](../apps/optimitron/src/lib/profile.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/UserPreference.ts](../packages/db/src/generated/prisma/models/UserPreference.ts) (134 matches)
- Notes:
  - Single-row push reminder schedule settings. The current name collides conceptually with NotificationPreference.

### VariableCategory

- Schema: [packages/db/prisma/schema.prisma#L2346](../packages/db/prisma/schema.prisma#L2346)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 6 matches
  - `api-routes`: 1 files / 2 matches
  - `runtime-libraries`: 5 files / 10 matches
  - `tests`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 9 files / 213 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 4 matches
- Key files:
  - [apps/optimitron/src/lib/profile.server.ts](../apps/optimitron/src/lib/profile.server.ts) (6 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (4 matches)
  - [apps/optimitron/src/app/api/health-analysis/submit/route.ts](../apps/optimitron/src/app/api/health-analysis/submit/route.ts) (3 matches)
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (2 matches)
  - [packages/data/src/importers/standard-variable-names.ts](../packages/data/src/importers/standard-variable-names.ts) (2 matches)
  - [packages/data/src/variable-registry.ts](../packages/data/src/variable-registry.ts) (1 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
- Notes:
  - none

### VariableRelationshipEvidenceEstimate

- Schema: [packages/db/prisma/schema.prisma#L3529](../packages/db/prisma/schema.prisma#L3529)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 5 matches
  - `runtime-libraries`: 2 files / 5 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 15 matches
  - `generated`: 11 files / 270 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/earth-data.server.ts](../apps/optimitron/src/lib/earth-data.server.ts) (6 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (15 matches)
  - [packages/db/src/generated/prisma/models/VariableRelationshipEvidenceEstimate.ts](../packages/db/src/generated/prisma/models/VariableRelationshipEvidenceEstimate.ts) (217 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (31 matches)
  - [packages/db/src/generated/prisma/models/GlobalVariable.ts](../packages/db/src/generated/prisma/models/GlobalVariable.ts) (6 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### VerificationToken

- Schema: [packages/db/prisma/schema.prisma#L2188](../packages/db/prisma/schema.prisma#L2188)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `tests`: 2 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 7 files / 144 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [apps/optimitron/src/lib/auth-spam-guard.server.ts](../apps/optimitron/src/lib/auth-spam-guard.server.ts) (2 matches)
  - [apps/trialabundancesurvey/tests/e2e/auth-email.spec.ts](../apps/trialabundancesurvey/tests/e2e/auth-email.spec.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260311234000_nextauth_auth_tables/migration.sql](../packages/db/prisma/migrations/20260311234000_nextauth_auth_tables/migration.sql) (5 matches)
  - [packages/db/src/generated/prisma/models/VerificationToken.ts](../packages/db/src/generated/prisma/models/VerificationToken.ts) (115 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
- Notes:
  - none

### WebPushSubscription

- Schema: [packages/db/prisma/schema.prisma#L4549](../packages/db/prisma/schema.prisma#L4549)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 6 matches
  - `api-routes`: 2 files / 2 matches
  - `runtime-libraries`: 1 files / 4 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 8 files / 173 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 4 matches
- Key files:
  - [apps/optimitron/src/lib/push-sender.server.ts](../apps/optimitron/src/lib/push-sender.server.ts) (8 matches)
  - [apps/optimitron/src/app/api/push/subscribe/route.ts](../apps/optimitron/src/app/api/push/subscribe/route.ts) (2 matches)
  - [apps/optimitron/src/app/api/push/unsubscribe/route.ts](../apps/optimitron/src/app/api/push/unsubscribe/route.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (5 matches)
  - [packages/db/src/generated/prisma/models/WebPushSubscription.ts](../packages/db/src/generated/prisma/models/WebPushSubscription.ts) (140 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
- Notes:
  - Kept intentionally specific: this stores browser Web Push protocol material, not a generic contact point abstraction.

### WishocraticAllocation

- Schema: [packages/db/prisma/schema.prisma#L4165](../packages/db/prisma/schema.prisma#L4165)
- Classification: `runtime-live`
- Direct Prisma usage: 8 files / 22 matches
- Usage counts by bucket:
  - `runtime-prisma`: 8 files / 22 matches
  - `api-routes`: 3 files / 13 matches
  - `runtime-libraries`: 4 files / 6 matches
  - `scripts`: 1 files / 7 matches
  - `tests`: 2 files / 6 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 2 files / 14 matches
  - `generated`: 9 files / 177 matches
  - `zod`: 1 files / 1 matches
  - `other`: 3 files / 5 matches
- Key files:
  - [apps/optimitron/src/app/api/wishocracy/allocations/route.ts](../apps/optimitron/src/app/api/wishocracy/allocations/route.ts) (18 matches)
  - [apps/optimitron/scripts/import-dih-users-votes.ts](../apps/optimitron/scripts/import-dih-users-votes.ts) (12 matches)
  - [apps/optimitron/src/app/api/wishocracy/sync/route.ts](../apps/optimitron/src/app/api/wishocracy/sync/route.ts) (6 matches)
  - [apps/optimitron/src/lib/aggregate-alignment.server.ts](../apps/optimitron/src/lib/aggregate-alignment.server.ts) (4 matches)
  - [apps/optimitron/src/app/api/wishocracy/preferences/route.ts](../apps/optimitron/src/app/api/wishocracy/preferences/route.ts) (2 matches)
  - [apps/optimitron/src/lib/alignment-report.server.ts](../apps/optimitron/src/lib/alignment-report.server.ts) (2 matches)
  - [apps/optimitron/src/lib/badges.server.ts](../apps/optimitron/src/lib/badges.server.ts) (2 matches)
  - [apps/optimitron/src/lib/wishocracy-community.ts](../apps/optimitron/src/lib/wishocracy-community.ts) (2 matches)
- Notes:
  - none

### WishocraticDistribution

- Schema: [packages/db/prisma/schema.prisma#L5466](../packages/db/prisma/schema.prisma#L5466)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 2 matches
  - `generated`: 7 files / 152 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/wishocratic-treasury.server.ts](../apps/optimitron/src/lib/wishocratic-treasury.server.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/WishocraticDistribution.ts](../packages/db/src/generated/prisma/models/WishocraticDistribution.ts) (123 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### WishocraticEncryptedAllocation

- Schema: [packages/db/prisma/schema.prisma#L4630](../packages/db/prisma/schema.prisma#L4630)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 2 matches
  - `api-routes`: 2 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 8 files / 155 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [apps/optimitron/src/app/api/wishocracy/allocations/route.ts](../apps/optimitron/src/app/api/wishocracy/allocations/route.ts) (2 matches)
  - [apps/optimitron/src/app/api/wishocracy/sync/route.ts](../apps/optimitron/src/app/api/wishocracy/sync/route.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/WishocraticEncryptedAllocation.ts](../packages/db/src/generated/prisma/models/WishocraticEncryptedAllocation.ts) (122 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - Coexists with normalized WishocraticAllocation rows today; comments should be read as historical intent rather than exclusive authority.

### WishocraticItem

- Schema: [packages/db/prisma/schema.prisma#L3942](../packages/db/prisma/schema.prisma#L3942)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 4 matches
  - `runtime-libraries`: 3 files / 5 matches
  - `scripts`: 2 files / 8 matches
  - `tests`: 1 files / 1 matches
  - `schema`: 1 files / 19 matches
  - `migrations`: 1 files / 1 matches
  - `generated`: 13 files / 254 matches
  - `zod`: 1 files / 1 matches
  - `other`: 3 files / 4 matches
- Key files:
  - [apps/optimitron/scripts/import-dih-users-votes.ts](../apps/optimitron/scripts/import-dih-users-votes.ts) (7 matches)
  - [apps/optimitron/scripts/probe-wishocratic-items.ts](../apps/optimitron/scripts/probe-wishocratic-items.ts) (3 matches)
  - [packages/db/src/wishocracy-catalog.ts](../packages/db/src/wishocracy-catalog.ts) (3 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/db/src/types.ts](../packages/db/src/types.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (19 matches)
  - [packages/db/prisma/migrations/20260318000000_schema_naming_cleanup/migration.sql](../packages/db/prisma/migrations/20260318000000_schema_naming_cleanup/migration.sql) (1 matches)
- Notes:
  - none

### WishocraticItemAlignmentScore

- Schema: [packages/db/prisma/schema.prisma#L4462](../packages/db/prisma/schema.prisma#L4462)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 9 files / 148 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/aggregate-alignment.server.ts](../apps/optimitron/src/lib/aggregate-alignment.server.ts) (3 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (6 matches)
  - [packages/db/src/generated/prisma/models/WishocraticItemAlignmentScore.ts](../packages/db/src/generated/prisma/models/WishocraticItemAlignmentScore.ts) (111 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### WishocraticItemInclusion

- Schema: [packages/db/prisma/schema.prisma#L4209](../packages/db/prisma/schema.prisma#L4209)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 9 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 9 matches
  - `api-routes`: 2 files / 5 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `scripts`: 1 files / 3 matches
  - `tests`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 9 files / 163 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/scripts/import-dih-users-votes.ts](../apps/optimitron/scripts/import-dih-users-votes.ts) (6 matches)
  - [apps/optimitron/src/app/api/wishocracy/item-inclusions/route.ts](../apps/optimitron/src/app/api/wishocracy/item-inclusions/route.ts) (6 matches)
  - [apps/optimitron/src/app/api/wishocracy/sync/route.ts](../apps/optimitron/src/app/api/wishocracy/sync/route.ts) (4 matches)
  - [apps/optimitron/src/lib/alignment-report.server.ts](../apps/optimitron/src/lib/alignment-report.server.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/WishocraticItemInclusion.ts](../packages/db/src/generated/prisma/models/WishocraticItemInclusion.ts) (126 matches)
- Notes:
  - none

### WishPoint

- Schema: [packages/db/prisma/schema.prisma#L9429](../packages/db/prisma/schema.prisma#L9429)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 6 matches
  - `runtime-libraries`: 2 files / 9 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 9 files / 173 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [apps/optimitron/src/lib/wishes.server.ts](../apps/optimitron/src/lib/wishes.server.ts) (11 matches)
  - [apps/optimitron/src/lib/dashboard.server.ts](../apps/optimitron/src/lib/dashboard.server.ts) (4 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (6 matches)
  - [packages/db/src/generated/prisma/models/WishPoint.ts](../packages/db/src/generated/prisma/models/WishPoint.ts) (136 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

## Enum Inventory

| Enum | Schema | Reference Files | Total References |
| --- | --- | ---: | ---: |
| ActivityType | [packages/db/prisma/schema.prisma#L309](../packages/db/prisma/schema.prisma#L309) | 34 | 176 |
| AgentExecutorStatus | [packages/db/prisma/schema.prisma#L571](../packages/db/prisma/schema.prisma#L571) | 13 | 104 |
| AnalysisStatus | [packages/db/prisma/schema.prisma#L100](../packages/db/prisma/schema.prisma#L100) | 10 | 197 |
| BadgeType | [packages/db/prisma/schema.prisma#L433](../packages/db/prisma/schema.prisma#L433) | 14 | 103 |
| CollectionFieldType | [packages/db/prisma/schema.prisma#L821](../packages/db/prisma/schema.prisma#L821) | 9 | 107 |
| CombinationOperation | [packages/db/prisma/schema.prisma#L54](../packages/db/prisma/schema.prisma#L54) | 22 | 372 |
| CommerceEntitlementStatus | [packages/db/prisma/schema.prisma#L10283](../packages/db/prisma/schema.prisma#L10283) | 8 | 78 |
| CommerceFulfillmentKind | [packages/db/prisma/schema.prisma#L10244](../packages/db/prisma/schema.prisma#L10244) | 17 | 194 |
| CommerceFulfillmentProvider | [packages/db/prisma/schema.prisma#L10256](../packages/db/prisma/schema.prisma#L10256) | 13 | 101 |
| CommerceFulfillmentStatus | [packages/db/prisma/schema.prisma#L10274](../packages/db/prisma/schema.prisma#L10274) | 10 | 72 |
| CommerceOfferKind | [packages/db/prisma/schema.prisma#L10229](../packages/db/prisma/schema.prisma#L10229) | 14 | 87 |
| CommerceOfferStatus | [packages/db/prisma/schema.prisma#L10238](../packages/db/prisma/schema.prisma#L10238) | 15 | 86 |
| CommerceOrderStatus | [packages/db/prisma/schema.prisma#L10263](../packages/db/prisma/schema.prisma#L10263) | 16 | 100 |
| CommercePaymentProvider | [packages/db/prisma/schema.prisma#L10251](../packages/db/prisma/schema.prisma#L10251) | 9 | 68 |
| ConfidenceLevel | [packages/db/prisma/schema.prisma#L121](../packages/db/prisma/schema.prisma#L121) | 10 | 101 |
| ContentAccessLevel | [packages/db/prisma/schema.prisma#L811](../packages/db/prisma/schema.prisma#L811) | 19 | 206 |
| ContentReportStatus | [packages/db/prisma/schema.prisma#L1075](../packages/db/prisma/schema.prisma#L1075) | 10 | 68 |
| ContentVisibility | [packages/db/prisma/schema.prisma#L804](../packages/db/prisma/schema.prisma#L804) | 50 | 509 |
| CourtCaseItemStatus | [packages/db/prisma/schema.prisma#L4710](../packages/db/prisma/schema.prisma#L4710) | 14 | 259 |
| CourtCasePartyCapacity | [packages/db/prisma/schema.prisma#L4701](../packages/db/prisma/schema.prisma#L4701) | 9 | 74 |
| CourtCasePartyRole | [packages/db/prisma/schema.prisma#L4691](../packages/db/prisma/schema.prisma#L4691) | 17 | 97 |
| CourtCaseStatus | [packages/db/prisma/schema.prisma#L4682](../packages/db/prisma/schema.prisma#L4682) | 11 | 112 |
| DatingBlockScope | [packages/db/prisma/schema.prisma#L9755](../packages/db/prisma/schema.prisma#L9755) | 10 | 82 |
| DatingConversationStatus | [packages/db/prisma/schema.prisma#L9733](../packages/db/prisma/schema.prisma#L9733) | 9 | 65 |
| DatingDatePlanStatus | [packages/db/prisma/schema.prisma#L9746](../packages/db/prisma/schema.prisma#L9746) | 8 | 84 |
| DatingInteractionKind | [packages/db/prisma/schema.prisma#L9714](../packages/db/prisma/schema.prisma#L9714) | 11 | 73 |
| DatingInteractionStatus | [packages/db/prisma/schema.prisma#L9721](../packages/db/prisma/schema.prisma#L9721) | 9 | 65 |
| DatingMatchStatus | [packages/db/prisma/schema.prisma#L9727](../packages/db/prisma/schema.prisma#L9727) | 9 | 77 |
| DatingMessageStatus | [packages/db/prisma/schema.prisma#L9739](../packages/db/prisma/schema.prisma#L9739) | 8 | 66 |
| DatingPreferenceImportance | [packages/db/prisma/schema.prisma#L9709](../packages/db/prisma/schema.prisma#L9709) | 8 | 56 |
| DatingProfilePhotoStatus | [packages/db/prisma/schema.prisma#L9683](../packages/db/prisma/schema.prisma#L9683) | 10 | 68 |
| DatingProfileStatus | [packages/db/prisma/schema.prisma#L9664](../packages/db/prisma/schema.prisma#L9664) | 12 | 136 |
| DatingQuestionAnswerVisibility | [packages/db/prisma/schema.prisma#L9696](../packages/db/prisma/schema.prisma#L9696) | 9 | 65 |
| DatingQuestionImportance | [packages/db/prisma/schema.prisma#L9701](../packages/db/prisma/schema.prisma#L9701) | 10 | 68 |
| DatingQuestionStatus | [packages/db/prisma/schema.prisma#L9690](../packages/db/prisma/schema.prisma#L9690) | 10 | 58 |
| DatingRelationshipIntent | [packages/db/prisma/schema.prisma#L9673](../packages/db/prisma/schema.prisma#L9673) | 11 | 134 |
| DatingSafetyReportStatus | [packages/db/prisma/schema.prisma#L9761](../packages/db/prisma/schema.prisma#L9761) | 8 | 80 |
| EfficacyLagEvidenceStatus | [packages/db/prisma/schema.prisma#L238](../packages/db/prisma/schema.prisma#L238) | 11 | 83 |
| EmailLogStatus | [packages/db/prisma/schema.prisma#L1132](../packages/db/prisma/schema.prisma#L1132) | 18 | 110 |
| EvidenceGrade | [packages/db/prisma/schema.prisma#L135](../packages/db/prisma/schema.prisma#L135) | 22 | 189 |
| ExternalActionRequestStatus | [packages/db/prisma/schema.prisma#L560](../packages/db/prisma/schema.prisma#L560) | 20 | 180 |
| FillingType | [packages/db/prisma/schema.prisma#L60](../packages/db/prisma/schema.prisma#L60) | 23 | 455 |
| FormFieldType | [packages/db/prisma/schema.prisma#L1100](../packages/db/prisma/schema.prisma#L1100) | 14 | 115 |
| FormPurpose | [packages/db/prisma/schema.prisma#L1083](../packages/db/prisma/schema.prisma#L1083) | 16 | 102 |
| FormStatus | [packages/db/prisma/schema.prisma#L1092](../packages/db/prisma/schema.prisma#L1092) | 13 | 94 |
| FormSubmissionStatus | [packages/db/prisma/schema.prisma#L1116](../packages/db/prisma/schema.prisma#L1116) | 15 | 119 |
| InterventionExperienceStatus | [packages/db/prisma/schema.prisma#L245](../packages/db/prisma/schema.prisma#L245) | 9 | 97 |
| InterventionOutcomeRating | [packages/db/prisma/schema.prisma#L254](../packages/db/prisma/schema.prisma#L254) | 9 | 83 |
| InterventionRankingRunStatus | [packages/db/prisma/schema.prisma#L303](../packages/db/prisma/schema.prisma#L303) | 9 | 69 |
| InterventionSideEffectSeverity | [packages/db/prisma/schema.prisma#L264](../packages/db/prisma/schema.prisma#L264) | 9 | 65 |
| JurisdictionType | [packages/db/prisma/schema.prisma#L153](../packages/db/prisma/schema.prisma#L153) | 19 | 185 |
| KnowledgeSensitivity | [packages/db/prisma/schema.prisma#L1124](../packages/db/prisma/schema.prisma#L1124) | 10 | 83 |
| McpScope | [packages/db/prisma/schema.prisma#L1052](../packages/db/prisma/schema.prisma#L1052) | 80 | 725 |
| McpToolCallStatus | [packages/db/prisma/schema.prisma#L1069](../packages/db/prisma/schema.prisma#L1069) | 10 | 78 |
| MeasurementScale | [packages/db/prisma/schema.prisma#L82](../packages/db/prisma/schema.prisma#L82) | 11 | 128 |
| ModelRevisionStatus | [packages/db/prisma/schema.prisma#L892](../packages/db/prisma/schema.prisma#L892) | 16 | 168 |
| NotificationChannel | [packages/db/prisma/schema.prisma#L372](../packages/db/prisma/schema.prisma#L372) | 8 | 57 |
| NotificationStatus | [packages/db/prisma/schema.prisma#L144](../packages/db/prisma/schema.prisma#L144) | 12 | 148 |
| NotificationType | [packages/db/prisma/schema.prisma#L359](../packages/db/prisma/schema.prisma#L359) | 12 | 92 |
| OrganizationMemberRole | [packages/db/prisma/schema.prisma#L658](../packages/db/prisma/schema.prisma#L658) | 30 | 139 |
| OrganizationNameKind | [packages/db/prisma/schema.prisma#L406](../packages/db/prisma/schema.prisma#L406) | 10 | 97 |
| OrganizationReferendumPositionStatus | [packages/db/prisma/schema.prisma#L416](../packages/db/prisma/schema.prisma#L416) | 22 | 129 |
| OrgStatus | [packages/db/prisma/schema.prisma#L399](../packages/db/prisma/schema.prisma#L399) | 51 | 321 |
| OrgType | [packages/db/prisma/schema.prisma#L380](../packages/db/prisma/schema.prisma#L380) | 47 | 291 |
| ParameterDistributionType | [packages/db/prisma/schema.prisma#L881](../packages/db/prisma/schema.prisma#L881) | 9 | 90 |
| ParameterSourceType | [packages/db/prisma/schema.prisma#L872](../packages/db/prisma/schema.prisma#L872) | 8 | 88 |
| PersonCivilianStatus | [packages/db/prisma/schema.prisma#L220](../packages/db/prisma/schema.prisma#L220) | 13 | 106 |
| PersonConditionStatus | [packages/db/prisma/schema.prisma#L201](../packages/db/prisma/schema.prisma#L201) | 19 | 108 |
| PersonDeathCauseCategory | [packages/db/prisma/schema.prisma#L209](../packages/db/prisma/schema.prisma#L209) | 21 | 162 |
| PersonhoodProvider | [packages/db/prisma/schema.prisma#L181](../packages/db/prisma/schema.prisma#L181) | 14 | 86 |
| PersonhoodVerificationStatus | [packages/db/prisma/schema.prisma#L187](../packages/db/prisma/schema.prisma#L187) | 17 | 88 |
| PersonLifeStatus | [packages/db/prisma/schema.prisma#L194](../packages/db/prisma/schema.prisma#L194) | 46 | 306 |
| PersonMemorialEvidenceKind | [packages/db/prisma/schema.prisma#L227](../packages/db/prisma/schema.prisma#L227) | 17 | 127 |
| PointMintStatus | [packages/db/prisma/schema.prisma#L5338](../packages/db/prisma/schema.prisma#L5338) | 9 | 65 |
| ReferendumKind | [packages/db/prisma/schema.prisma#L4671](../packages/db/prisma/schema.prisma#L4671) | 19 | 134 |
| ReferendumStatus | [packages/db/prisma/schema.prisma#L4663](../packages/db/prisma/schema.prisma#L4663) | 28 | 155 |
| ReferendumVoteSource | [packages/db/prisma/schema.prisma#L4498](../packages/db/prisma/schema.prisma#L4498) | 21 | 143 |
| ReferralAnswer | [packages/db/prisma/schema.prisma#L175](../packages/db/prisma/schema.prisma#L175) | 10 | 63 |
| ReferralInvitationContactMethod | [packages/db/prisma/schema.prisma#L351](../packages/db/prisma/schema.prisma#L351) | 15 | 136 |
| ReferralInvitationMessageFormat | [packages/db/prisma/schema.prisma#L345](../packages/db/prisma/schema.prisma#L345) | 17 | 123 |
| ReferralInvitationStatus | [packages/db/prisma/schema.prisma#L335](../packages/db/prisma/schema.prisma#L335) | 22 | 164 |
| RelationshipDirection | [packages/db/prisma/schema.prisma#L128](../packages/db/prisma/schema.prisma#L128) | 10 | 101 |
| ShareSource | [packages/db/prisma/schema.prisma#L329](../packages/db/prisma/schema.prisma#L329) | 13 | 99 |
| SocialPlatform | [packages/db/prisma/schema.prisma#L423](../packages/db/prisma/schema.prisma#L423) | 14 | 86 |
| SourceArtifactType | [packages/db/prisma/schema.prisma#L854](../packages/db/prisma/schema.prisma#L854) | 25 | 190 |
| SourceSystem | [packages/db/prisma/schema.prisma#L842](../packages/db/prisma/schema.prisma#L842) | 25 | 227 |
| StrengthLevel | [packages/db/prisma/schema.prisma#L112](../packages/db/prisma/schema.prisma#L112) | 10 | 101 |
| StripeConnectedAccountStatus | [packages/db/prisma/schema.prisma#L774](../packages/db/prisma/schema.prisma#L774) | 10 | 80 |
| StripeTransferCapabilityStatus | [packages/db/prisma/schema.prisma#L783](../packages/db/prisma/schema.prisma#L783) | 10 | 83 |
| SubjectType | [packages/db/prisma/schema.prisma#L161](../packages/db/prisma/schema.prisma#L161) | 19 | 148 |
| TaskApplicationEventType | [packages/db/prisma/schema.prisma#L699](../packages/db/prisma/schema.prisma#L699) | 12 | 79 |
| TaskApplicationPolicy | [packages/db/prisma/schema.prisma#L678](../packages/db/prisma/schema.prisma#L678) | 15 | 245 |
| TaskApplicationStatus | [packages/db/prisma/schema.prisma#L685](../packages/db/prisma/schema.prisma#L685) | 15 | 247 |
| TaskCandidateKind | [packages/db/prisma/schema.prisma#L517](../packages/db/prisma/schema.prisma#L517) | 14 | 211 |
| TaskCandidateMatchStatus | [packages/db/prisma/schema.prisma#L526](../packages/db/prisma/schema.prisma#L526) | 12 | 115 |
| TaskCategory | [packages/db/prisma/schema.prisma#L459](../packages/db/prisma/schema.prisma#L459) | 45 | 417 |
| TaskClaimPolicy | [packages/db/prisma/schema.prisma#L640](../packages/db/prisma/schema.prisma#L640) | 61 | 466 |
| TaskClaimStatus | [packages/db/prisma/schema.prisma#L711](../packages/db/prisma/schema.prisma#L711) | 24 | 196 |
| TaskCommentKind | [packages/db/prisma/schema.prisma#L1026](../packages/db/prisma/schema.prisma#L1026) | 21 | 142 |
| TaskCommentSource | [packages/db/prisma/schema.prisma#L1041](../packages/db/prisma/schema.prisma#L1041) | 21 | 144 |
| TaskCommentVisibility | [packages/db/prisma/schema.prisma#L1035](../packages/db/prisma/schema.prisma#L1035) | 12 | 118 |
| TaskCommunicationAudience | [packages/db/prisma/schema.prisma#L927](../packages/db/prisma/schema.prisma#L927) | 14 | 176 |
| TaskCommunicationChannel | [packages/db/prisma/schema.prisma#L982](../packages/db/prisma/schema.prisma#L982) | 17 | 157 |
| TaskCommunicationDirection | [packages/db/prisma/schema.prisma#L976](../packages/db/prisma/schema.prisma#L976) | 11 | 136 |
| TaskCommunicationEndpointKind | [packages/db/prisma/schema.prisma#L1007](../packages/db/prisma/schema.prisma#L1007) | 13 | 88 |
| TaskCommunicationEndpointVerificationStatus | [packages/db/prisma/schema.prisma#L1018](../packages/db/prisma/schema.prisma#L1018) | 12 | 74 |
| TaskCommunicationFormat | [packages/db/prisma/schema.prisma#L969](../packages/db/prisma/schema.prisma#L969) | 10 | 164 |
| TaskCommunicationPurpose | [packages/db/prisma/schema.prisma#L939](../packages/db/prisma/schema.prisma#L939) | 14 | 182 |
| TaskCommunicationStatus | [packages/db/prisma/schema.prisma#L993](../packages/db/prisma/schema.prisma#L993) | 22 | 184 |
| TaskCompensationCadence | [packages/db/prisma/schema.prisma#L493](../packages/db/prisma/schema.prisma#L493) | 14 | 241 |
| TaskCompensationKind | [packages/db/prisma/schema.prisma#L483](../packages/db/prisma/schema.prisma#L483) | 16 | 259 |
| TaskDeadlinePolicy | [packages/db/prisma/schema.prisma#L666](../packages/db/prisma/schema.prisma#L666) | 13 | 249 |
| TaskDistributionAttemptStatus | [packages/db/prisma/schema.prisma#L629](../packages/db/prisma/schema.prisma#L629) | 8 | 92 |
| TaskDistributionChannel | [packages/db/prisma/schema.prisma#L601](../packages/db/prisma/schema.prisma#L601) | 9 | 122 |
| TaskDistributionOperation | [packages/db/prisma/schema.prisma#L614](../packages/db/prisma/schema.prisma#L614) | 8 | 92 |
| TaskDistributionTargetStatus | [packages/db/prisma/schema.prisma#L622](../packages/db/prisma/schema.prisma#L622) | 8 | 60 |
| TaskEdgeType | [packages/db/prisma/schema.prisma#L721](../packages/db/prisma/schema.prisma#L721) | 22 | 141 |
| TaskEngagementKind | [packages/db/prisma/schema.prisma#L474](../packages/db/prisma/schema.prisma#L474) | 15 | 245 |
| TaskExecutionAttemptStatus | [packages/db/prisma/schema.prisma#L534](../packages/db/prisma/schema.prisma#L534) | 23 | 193 |
| TaskExecutionMode | [packages/db/prisma/schema.prisma#L510](../packages/db/prisma/schema.prisma#L510) | 21 | 264 |
| TaskFundingEventType | [packages/db/prisma/schema.prisma#L756](../packages/db/prisma/schema.prisma#L756) | 10 | 77 |
| TaskFundingPaymentSource | [packages/db/prisma/schema.prisma#L751](../packages/db/prisma/schema.prisma#L751) | 10 | 93 |
| TaskFundingPaymentStatus | [packages/db/prisma/schema.prisma#L765](../packages/db/prisma/schema.prisma#L765) | 17 | 151 |
| TaskFundingPledgerKind | [packages/db/prisma/schema.prisma#L735](../packages/db/prisma/schema.prisma#L735) | 17 | 141 |
| TaskFundingPledgeStatus | [packages/db/prisma/schema.prisma#L740](../packages/db/prisma/schema.prisma#L740) | 22 | 173 |
| TaskFundingTargetStatus | [packages/db/prisma/schema.prisma#L728](../packages/db/prisma/schema.prisma#L728) | 28 | 145 |
| TaskImpactEstimateKind | [packages/db/prisma/schema.prisma#L900](../packages/db/prisma/schema.prisma#L900) | 15 | 91 |
| TaskImpactFrameKey | [packages/db/prisma/schema.prisma#L915](../packages/db/prisma/schema.prisma#L915) | 35 | 154 |
| TaskImpactPublicationStatus | [packages/db/prisma/schema.prisma#L907](../packages/db/prisma/schema.prisma#L907) | 18 | 103 |
| TaskMarketplaceFeePolicy | [packages/db/prisma/schema.prisma#L584](../packages/db/prisma/schema.prisma#L584) | 8 | 80 |
| TaskMarketplaceListingKind | [packages/db/prisma/schema.prisma#L578](../packages/db/prisma/schema.prisma#L578) | 8 | 80 |
| TaskMarketplaceListingStatus | [packages/db/prisma/schema.prisma#L591](../packages/db/prisma/schema.prisma#L591) | 8 | 80 |
| TaskPayoutStatus | [packages/db/prisma/schema.prisma#L792](../packages/db/prisma/schema.prisma#L792) | 10 | 133 |
| TaskRemotePolicy | [packages/db/prisma/schema.prisma#L502](../packages/db/prisma/schema.prisma#L502) | 13 | 239 |
| TaskStatus | [packages/db/prisma/schema.prisma#L650](../packages/db/prisma/schema.prisma#L650) | 98 | 761 |
| TaskVerificationMethod | [packages/db/prisma/schema.prisma#L544](../packages/db/prisma/schema.prisma#L544) | 13 | 88 |
| TaskVerificationResult | [packages/db/prisma/schema.prisma#L552](../packages/db/prisma/schema.prisma#L552) | 16 | 101 |
| UnitCodeSystem | [packages/db/prisma/schema.prisma#L94](../packages/db/prisma/schema.prisma#L94) | 9 | 82 |
| Valence | [packages/db/prisma/schema.prisma#L72](../packages/db/prisma/schema.prisma#L72) | 13 | 286 |
| VariableEvidenceMetricKind | [packages/db/prisma/schema.prisma#L275](../packages/db/prisma/schema.prisma#L275) | 10 | 92 |
| VariableRelationshipEvidenceSourceType | [packages/db/prisma/schema.prisma#L292](../packages/db/prisma/schema.prisma#L292) | 10 | 92 |
| VotePosition | [packages/db/prisma/schema.prisma#L4491](../packages/db/prisma/schema.prisma#L4491) | 57 | 338 |
| WishReason | [packages/db/prisma/schema.prisma#L444](../packages/db/prisma/schema.prisma#L444) | 10 | 71 |
