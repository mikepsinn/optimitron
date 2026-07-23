# Schema Usage Audit

- Schema: [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma)
- Models scanned: 163
- Enums scanned: 143
- Classification summary: core 13, runtime-live 138, tests-only 3, schema-only 0, generated-only 6, suspicious 3

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
- Evidence: 14 files / 112 matches
- Key files:
  - [packages/web/src/components/chat/ChatPage.tsx](../packages/web/src/components/chat/ChatPage.tsx) (37 matches)
  - [packages/web/src/lib/alignment-legislative-sync.server.ts](../packages/web/src/lib/alignment-legislative-sync.server.ts) (16 matches)
  - [packages/web/src/app/api/civic/bills/route.ts](../packages/web/src/app/api/civic/bills/route.ts) (11 matches)
  - [packages/web/src/components/chat/BillListCard.tsx](../packages/web/src/components/chat/BillListCard.tsx) (10 matches)
  - [packages/web/src/components/chat/BillVoteCard.tsx](../packages/web/src/components/chat/BillVoteCard.tsx) (9 matches)
  - [packages/data/src/fetchers/congress.ts](../packages/data/src/fetchers/congress.ts) (6 matches)
  - [packages/web/src/app/api/civic/votes/route.ts](../packages/web/src/app/api/civic/votes/route.ts) (6 matches)
  - [packages/web/src/components/chat/BillCard.tsx](../packages/web/src/components/chat/BillCard.tsx) (6 matches)

## Model Inventory

| Model | Classification | Runtime Prisma | Runtime Surface | Tests | Generated/Zod | Docs |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Account | `runtime-live` | 1 | 11 | 4 | 9 | 1 |
| Activity | `runtime-live` | 14 | 62 | 7 | 12 | 4 |
| AgentExecutor | `runtime-live` | 3 | 3 | 0 | 14 | 1 |
| AgentTaskLease | `runtime-live` | 2 | 2 | 0 | 9 | 1 |
| AggregateVariableRelationship | `runtime-live` | 1 | 6 | 2 | 9 | 1 |
| AggregationRun | `runtime-live` | 3 | 3 | 1 | 11 | 0 |
| AlignmentScore | `runtime-live` | 2 | 3 | 2 | 11 | 1 |
| Badge | `runtime-live` | 1 | 11 | 0 | 9 | 1 |
| CitizenBillVote | `runtime-live` | 2 | 2 | 0 | 9 | 1 |
| Collection | `runtime-live` | 3 | 15 | 2 | 13 | 1 |
| CollectionField | `runtime-live` | 2 | 6 | 0 | 10 | 0 |
| CollectionRecord | `runtime-live` | 5 | 8 | 0 | 16 | 0 |
| CollectionRelation | `runtime-live` | 2 | 3 | 0 | 14 | 0 |
| CollectionView | `runtime-live` | 2 | 5 | 0 | 9 | 0 |
| CommerceEntitlement | `generated-only` | 0 | 0 | 0 | 12 | 0 |
| CommerceFulfillment | `runtime-live` | 2 | 2 | 0 | 9 | 0 |
| CommerceFulfillmentMapping | `runtime-live` | 1 | 1 | 0 | 8 | 0 |
| CommerceOffer | `runtime-live` | 4 | 4 | 0 | 10 | 1 |
| CommerceOfferVariant | `runtime-live` | 2 | 2 | 0 | 11 | 0 |
| CommerceOrder | `runtime-live` | 5 | 5 | 0 | 9 | 1 |
| CommerceOrderItem | `generated-only` | 0 | 0 | 0 | 12 | 0 |
| Conflict | `runtime-live` | 4 | 17 | 2 | 10 | 1 |
| ContentAccessGrant | `runtime-live` | 1 | 1 | 0 | 11 | 1 |
| ContentAttachment | `runtime-live` | 4 | 4 | 0 | 12 | 1 |
| ContentReport | `runtime-live` | 1 | 1 | 0 | 9 | 1 |
| CourtCase | `runtime-live` | 5 | 5 | 1 | 12 | 2 |
| CourtCaseClaim | `runtime-live` | 1 | 1 | 0 | 14 | 1 |
| CourtCaseEvidence | `runtime-live` | 1 | 1 | 0 | 15 | 1 |
| CourtCaseHarm | `runtime-live` | 1 | 1 | 0 | 14 | 1 |
| CourtCaseParty | `runtime-live` | 4 | 5 | 0 | 12 | 2 |
| CourtCaseRemedy | `runtime-live` | 2 | 2 | 0 | 13 | 1 |
| DatingBlock | `runtime-live` | 1 | 1 | 0 | 8 | 0 |
| DatingConversation | `runtime-live` | 1 | 1 | 0 | 9 | 0 |
| DatingDatePlan | `runtime-live` | 2 | 2 | 0 | 12 | 1 |
| DatingInteraction | `runtime-live` | 1 | 1 | 0 | 8 | 0 |
| DatingMatch | `runtime-live` | 1 | 1 | 0 | 10 | 1 |
| DatingMatchScore | `generated-only` | 0 | 0 | 0 | 8 | 0 |
| DatingMessage | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| DatingPreference | `generated-only` | 0 | 0 | 0 | 8 | 0 |
| DatingProfile | `runtime-live` | 1 | 1 | 0 | 10 | 2 |
| DatingProfilePhoto | `runtime-live` | 1 | 1 | 0 | 9 | 0 |
| DatingPrompt | `runtime-live` | 1 | 1 | 0 | 7 | 0 |
| DatingPromptAnswer | `generated-only` | 0 | 0 | 0 | 9 | 0 |
| DatingQuestion | `runtime-live` | 2 | 2 | 0 | 7 | 0 |
| DatingQuestionAnswer | `runtime-live` | 1 | 1 | 0 | 9 | 0 |
| DatingSafetyReport | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| Document | `runtime-live` | 5 | 16 | 3 | 16 | 2 |
| DocumentRevision | `runtime-live` | 3 | 4 | 1 | 12 | 2 |
| EmailLog | `runtime-live` | 4 | 14 | 0 | 11 | 6 |
| ExternalActionRequest | `runtime-live` | 3 | 5 | 0 | 12 | 3 |
| Form | `runtime-live` | 1 | 14 | 1 | 13 | 5 |
| FormField | `runtime-live` | 1 | 5 | 0 | 10 | 1 |
| FormResponse | `runtime-live` | 1 | 2 | 0 | 13 | 1 |
| FormRevision | `runtime-live` | 1 | 1 | 0 | 11 | 2 |
| FormSection | `suspicious` | 0 | 0 | 0 | 10 | 1 |
| FormSubmission | `runtime-live` | 2 | 2 | 0 | 14 | 0 |
| GlobalVariable | `runtime-live` | 7 | 11 | 1 | 22 | 2 |
| GlobalVariableExternalCode | `runtime-live` | 2 | 2 | 1 | 10 | 0 |
| IntegrationConnection | `tests-only` | 0 | 0 | 1 | 12 | 1 |
| IntegrationProvider | `tests-only` | 0 | 0 | 1 | 11 | 0 |
| IntegrationSyncLog | `tests-only` | 0 | 0 | 1 | 9 | 1 |
| InterventionApprovalTimeline | `runtime-live` | 3 | 4 | 0 | 11 | 0 |
| InterventionExperience | `runtime-live` | 1 | 1 | 0 | 13 | 3 |
| InterventionExperienceOutcome | `runtime-live` | 1 | 1 | 0 | 12 | 1 |
| InterventionExperienceSideEffect | `runtime-live` | 1 | 1 | 0 | 10 | 1 |
| InterventionRankingRun | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| Jurisdiction | `runtime-live` | 7 | 23 | 5 | 31 | 1 |
| KnowledgeAnswer | `runtime-live` | 1 | 2 | 0 | 12 | 3 |
| McpToolCallAudit | `runtime-live` | 1 | 1 | 0 | 11 | 1 |
| Measurement | `runtime-live` | 3 | 15 | 7 | 16 | 7 |
| NOf1Variable | `runtime-live` | 2 | 3 | 1 | 13 | 2 |
| NOf1VariableRelationship | `runtime-live` | 2 | 6 | 3 | 10 | 2 |
| Notification | `runtime-live` | 0 | 7 | 0 | 9 | 2 |
| NotificationPreference | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| OAuthAuthCode | `runtime-live` | 2 | 2 | 0 | 9 | 1 |
| OAuthClient | `runtime-live` | 4 | 5 | 0 | 8 | 1 |
| OAuthGrant | `runtime-live` | 5 | 5 | 0 | 10 | 1 |
| Organization | `core` | 23 | 50 | 11 | 31 | 8 |
| OrganizationMember | `core` | 10 | 11 | 0 | 10 | 2 |
| OrganizationName | `runtime-live` | 1 | 2 | 0 | 11 | 0 |
| OrganizationReferendumPosition | `runtime-live` | 9 | 9 | 0 | 10 | 1 |
| ParameterDefinition | `runtime-live` | 3 | 3 | 0 | 10 | 0 |
| ParameterRevision | `runtime-live` | 3 | 3 | 0 | 10 | 0 |
| ParameterRevisionInput | `runtime-live` | 1 | 1 | 0 | 9 | 0 |
| ParameterRevisionSourceArtifact | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| Person | `core` | 31 | 69 | 17 | 28 | 10 |
| PersonCondition | `runtime-live` | 5 | 6 | 0 | 13 | 1 |
| PersonEfficacyLagEvidence | `runtime-live` | 2 | 4 | 0 | 12 | 1 |
| PersonhoodVerification | `runtime-live` | 5 | 5 | 1 | 9 | 1 |
| PersonMemorial | `runtime-live` | 7 | 8 | 0 | 12 | 1 |
| PersonMemorialEvidence | `runtime-live` | 3 | 4 | 0 | 12 | 1 |
| PersonMemorialResponsibleParty | `runtime-live` | 3 | 5 | 0 | 12 | 1 |
| PersonMemorialSubmission | `runtime-live` | 3 | 4 | 0 | 11 | 1 |
| PersonRelationship | `runtime-live` | 3 | 4 | 0 | 10 | 1 |
| PointMint | `runtime-live` | 5 | 6 | 0 | 10 | 0 |
| Politician | `runtime-live` | 2 | 17 | 3 | 11 | 2 |
| PoliticianVote | `runtime-live` | 1 | 2 | 1 | 10 | 0 |
| PreferenceWeight | `runtime-live` | 1 | 3 | 2 | 10 | 1 |
| PrizeTreasuryDeposit | `runtime-live` | 2 | 2 | 0 | 9 | 1 |
| PublicGoodsRecipient | `suspicious` | 0 | 0 | 0 | 9 | 1 |
| RankedIntervention | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| Referendum | `runtime-live` | 21 | 31 | 7 | 15 | 1 |
| ReferendumVote | `runtime-live` | 19 | 23 | 0 | 14 | 2 |
| Referral | `runtime-live` | 4 | 24 | 4 | 10 | 7 |
| ReferralClick | `runtime-live` | 1 | 2 | 0 | 8 | 1 |
| ReferralInvitation | `runtime-live` | 7 | 11 | 0 | 15 | 5 |
| Session | `runtime-live` | 0 | 12 | 3 | 9 | 1 |
| ShareAttempt | `runtime-live` | 5 | 8 | 0 | 16 | 5 |
| SocialAccount | `runtime-live` | 3 | 3 | 0 | 9 | 1 |
| SourceArtifact | `core` | 13 | 13 | 0 | 24 | 5 |
| StripeConnectedAccount | `runtime-live` | 2 | 2 | 0 | 10 | 0 |
| Subject | `runtime-live` | 3 | 24 | 5 | 21 | 2 |
| Task | `core` | 59 | 120 | 29 | 37 | 20 |
| TaskApplication | `runtime-live` | 4 | 4 | 0 | 16 | 0 |
| TaskApplicationEvent | `runtime-live` | 2 | 2 | 0 | 11 | 0 |
| TaskCandidateMatch | `runtime-live` | 3 | 3 | 0 | 15 | 0 |
| TaskClaim | `core` | 3 | 5 | 0 | 13 | 1 |
| TaskComment | `runtime-live` | 10 | 14 | 0 | 17 | 7 |
| TaskCommentAttachment | `runtime-live` | 4 | 4 | 0 | 12 | 0 |
| TaskCommentVote | `runtime-live` | 1 | 1 | 0 | 9 | 1 |
| TaskCommunication | `runtime-live` | 10 | 15 | 0 | 21 | 5 |
| TaskCommunicationEndpoint | `runtime-live` | 3 | 3 | 0 | 9 | 4 |
| TaskCommunicationSpawnSpec | `runtime-live` | 2 | 3 | 0 | 8 | 2 |
| TaskCommunicationTemplate | `runtime-live` | 1 | 1 | 0 | 10 | 1 |
| TaskCommunicationVariant | `suspicious` | 0 | 0 | 0 | 10 | 1 |
| TaskDistributionAttempt | `runtime-live` | 1 | 1 | 0 | 14 | 0 |
| TaskDistributionTarget | `generated-only` | 0 | 0 | 0 | 10 | 0 |
| TaskEdge | `core` | 7 | 7 | 0 | 9 | 5 |
| TaskExecutionArtifact | `runtime-live` | 1 | 2 | 0 | 13 | 4 |
| TaskExecutionAttempt | `runtime-live` | 7 | 7 | 0 | 20 | 3 |
| TaskFundingEvent | `runtime-live` | 1 | 1 | 0 | 11 | 1 |
| TaskFundingPayment | `runtime-live` | 6 | 6 | 0 | 13 | 1 |
| TaskFundingPledge | `runtime-live` | 5 | 5 | 0 | 16 | 1 |
| TaskFundingTarget | `runtime-live` | 8 | 8 | 2 | 10 | 1 |
| TaskImpactEstimateInput | `runtime-live` | 2 | 2 | 0 | 9 | 0 |
| TaskImpactEstimateSet | `core` | 5 | 5 | 0 | 9 | 4 |
| TaskImpactFrameEstimate | `core` | 5 | 5 | 0 | 9 | 4 |
| TaskImpactMetric | `core` | 4 | 4 | 0 | 9 | 2 |
| TaskImpactSourceArtifact | `core` | 2 | 2 | 0 | 10 | 1 |
| TaskManager | `runtime-live` | 2 | 2 | 0 | 10 | 0 |
| TaskMarketplaceListing | `runtime-live` | 1 | 1 | 0 | 13 | 0 |
| TaskPayout | `runtime-live` | 3 | 3 | 0 | 12 | 1 |
| TaskSourceArtifact | `core` | 8 | 8 | 0 | 10 | 4 |
| TaskSpawnSpec | `runtime-live` | 2 | 7 | 0 | 8 | 2 |
| TaskTrigger | `runtime-live` | 3 | 16 | 1 | 11 | 7 |
| TaskTriggerFire | `runtime-live` | 2 | 2 | 0 | 8 | 2 |
| TaskVerification | `runtime-live` | 2 | 3 | 0 | 11 | 5 |
| TrackingReminder | `runtime-live` | 1 | 1 | 1 | 11 | 7 |
| TrackingReminderNotification | `runtime-live` | 1 | 1 | 1 | 9 | 3 |
| Unit | `runtime-live` | 4 | 25 | 4 | 18 | 7 |
| User | `core` | 82 | 117 | 22 | 70 | 12 |
| UserPreference | `runtime-live` | 4 | 4 | 0 | 9 | 1 |
| VariableCategory | `runtime-live` | 5 | 7 | 1 | 10 | 1 |
| VariableRelationshipEvidenceEstimate | `runtime-live` | 2 | 2 | 0 | 12 | 0 |
| VerificationToken | `runtime-live` | 1 | 1 | 1 | 8 | 1 |
| WebPushSubscription | `runtime-live` | 3 | 3 | 0 | 9 | 1 |
| WishocraticAllocation | `runtime-live` | 8 | 8 | 1 | 10 | 0 |
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
  - `tests`: 4 files / 5 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 209 matches
  - `zod`: 1 files / 1 matches
  - `other`: 21 files / 28 matches
- Key files:
  - [packages/web/src/app/api/social-accounts/disconnect/route.ts](../packages/web/src/app/api/social-accounts/disconnect/route.ts) (2 matches)
  - [packages/web/src/app/privacy/page.tsx](../packages/web/src/app/privacy/page.tsx) (1 matches)
  - [packages/web/src/components/donate/WaysToGiveCard.tsx](../packages/web/src/components/donate/WaysToGiveCard.tsx) (2 matches)
  - [packages/web/src/components/auth/AuthForm.tsx](../packages/web/src/components/auth/AuthForm.tsx) (1 matches)
  - [packages/data/src/datasets/medical-data/references.json](../packages/data/src/datasets/medical-data/references.json) (2 matches)
  - [packages/data/src/datasets/natural-experiments.ts](../packages/data/src/datasets/natural-experiments.ts) (1 matches)
  - [packages/data/src/fetchers/usaspending.ts](../packages/data/src/fetchers/usaspending.ts) (1 matches)
  - [packages/data/src/importers/strava.ts](../packages/data/src/importers/strava.ts) (1 matches)
- Notes:
  - none

### Activity

- Schema: [packages/db/prisma/schema.prisma#L5499](../packages/db/prisma/schema.prisma#L5499)
- Classification: `runtime-live`
- Direct Prisma usage: 14 files / 17 matches
- Usage counts by bucket:
  - `runtime-prisma`: 14 files / 17 matches
  - `api-routes`: 6 files / 8 matches
  - `components`: 2 files / 3 matches
  - `runtime-libraries`: 54 files / 184 matches
  - `tests`: 7 files / 24 matches
  - `docs`: 4 files / 8 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 7 matches
  - `generated`: 11 files / 184 matches
  - `zod`: 1 files / 1 matches
  - `other`: 4 files / 23 matches
- Key files:
  - [packages/web/src/app/api/admin/organizations/[id]/route.ts](../packages/web/src/app/api/admin/organizations/[id]/route.ts) (4 matches)
  - [packages/web/src/lib/content-access.server.ts](../packages/web/src/lib/content-access.server.ts) (4 matches)
  - [packages/web/src/lib/email/suppression.server.ts](../packages/web/src/lib/email/suppression.server.ts) (4 matches)
  - [packages/web/src/app/api/referendums/[slug]/vote/route.ts](../packages/web/src/app/api/referendums/[slug]/vote/route.ts) (3 matches)
  - [packages/web/src/lib/tasks/task-comments.server.ts](../packages/web/src/lib/tasks/task-comments.server.ts) (3 matches)
  - [packages/web/src/app/api/game-stats/route.ts](../packages/web/src/app/api/game-stats/route.ts) (2 matches)
  - [packages/web/src/app/api/social-accounts/connect-wallet/route.ts](../packages/web/src/app/api/social-accounts/connect-wallet/route.ts) (2 matches)
  - [packages/web/src/app/api/social-accounts/disconnect/route.ts](../packages/web/src/app/api/social-accounts/disconnect/route.ts) (2 matches)
- Notes:
  - none

### AgentExecutor

- Schema: [packages/db/prisma/schema.prisma#L6555](../packages/db/prisma/schema.prisma#L6555)
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
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (10 matches)
  - [packages/web/src/lib/tasks/execution-lifecycle.server.ts](../packages/web/src/lib/tasks/execution-lifecycle.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/personal-planning.server.ts](../packages/web/src/lib/tasks/personal-planning.server.ts) (2 matches)
  - [docs/plans/phased-approach-optimitron.md](../docs/plans/phased-approach-optimitron.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (8 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (12 matches)
  - [packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql](../packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/AgentExecutor.ts](../packages/db/src/generated/prisma/models/AgentExecutor.ts) (221 matches)
- Notes:
  - none

### AgentTaskLease

- Schema: [packages/db/prisma/schema.prisma#L10608](../packages/db/prisma/schema.prisma#L10608)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 11 matches
  - `runtime-libraries`: 2 files / 11 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 9 files / 174 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/tasks/agent-lease.server.ts](../packages/web/src/lib/tasks/agent-lease.server.ts) (16 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (6 matches)
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
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 12 matches
  - `generated`: 8 files / 405 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/aggregate-relationships.server.ts](../packages/web/src/lib/aggregate-relationships.server.ts) (5 matches)
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
  - [packages/web/src/lib/aggregate-alignment.server.ts](../packages/web/src/lib/aggregate-alignment.server.ts) (6 matches)
  - [packages/web/src/lib/score-merkle.server.ts](../packages/web/src/lib/score-merkle.server.ts) (3 matches)
  - [packages/web/src/lib/score-publication.server.ts](../packages/web/src/lib/score-publication.server.ts) (3 matches)
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
  - [packages/web/src/lib/aggregate-alignment.server.ts](../packages/web/src/lib/aggregate-alignment.server.ts) (10 matches)
  - [packages/web/src/lib/score-publication.server.ts](../packages/web/src/lib/score-publication.server.ts) (3 matches)
  - [packages/web/src/lib/wishocracy-alignment.ts](../packages/web/src/lib/wishocracy-alignment.ts) (3 matches)
  - [packages/wishocracy/src/__tests__/alignment.test.ts](../packages/wishocracy/src/__tests__/alignment.test.ts) (5 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (3 matches)
  - [docs/TYPE_SYSTEM.md](../docs/TYPE_SYSTEM.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (5 matches)
- Notes:
  - none

### Badge

- Schema: [packages/db/prisma/schema.prisma#L9399](../packages/db/prisma/schema.prisma#L9399)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `components`: 10 files / 63 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 8 files / 151 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/badges.server.ts](../packages/web/src/lib/badges.server.ts) (2 matches)
  - [packages/web/src/components/shared/TrialCard.tsx](../packages/web/src/components/shared/TrialCard.tsx) (21 matches)
  - [packages/web/src/components/treatment/HealthEconomicsDisplay.tsx](../packages/web/src/components/treatment/HealthEconomicsDisplay.tsx) (15 matches)
  - [packages/web/src/components/personhood/PersonhoodStatusBadge.tsx](../packages/web/src/components/personhood/PersonhoodStatusBadge.tsx) (6 matches)
  - [packages/web/src/components/shared/ParameterValue.tsx](../packages/web/src/components/shared/ParameterValue.tsx) (6 matches)
  - [packages/web/src/components/tasks/ApplicationReviewUI.tsx](../packages/web/src/components/tasks/ApplicationReviewUI.tsx) (4 matches)
  - [packages/web/src/components/ui/badge.tsx](../packages/web/src/components/ui/badge.tsx) (4 matches)
  - [packages/web/src/components/medical/TreatmentReport.tsx](../packages/web/src/components/medical/TreatmentReport.tsx) (3 matches)
- Notes:
  - none

### CitizenBillVote

- Schema: [packages/db/prisma/schema.prisma#L4504](../packages/db/prisma/schema.prisma#L4504)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `api-routes`: 1 files / 2 matches
  - `pages`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 8 matches
  - `generated`: 8 files / 178 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [packages/web/src/app/api/civic/votes/route.ts](../packages/web/src/app/api/civic/votes/route.ts) (4 matches)
  - [packages/web/src/app/civic/votes/[identifier]/page.tsx](../packages/web/src/app/civic/votes/[identifier]/page.tsx) (4 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (8 matches)
  - [packages/db/src/generated/prisma/models/CitizenBillVote.ts](../packages/db/src/generated/prisma/models/CitizenBillVote.ts) (145 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - External bill stance record. Bill metadata currently comes from the Congress fetchers rather than a first-class Prisma bill table.

### Collection

- Schema: [packages/db/prisma/schema.prisma#L6288](../packages/db/prisma/schema.prisma#L6288)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 14 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 14 matches
  - `api-routes`: 2 files / 3 matches
  - `pages`: 2 files / 2 matches
  - `runtime-libraries`: 11 files / 33 matches
  - `tests`: 2 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 10 matches
  - `migrations`: 1 files / 18 matches
  - `generated`: 13 files / 289 matches
- Key files:
  - [packages/web/src/lib/collections.server.ts](../packages/web/src/lib/collections.server.ts) (25 matches)
  - [packages/web/src/lib/notion-import.server.ts](../packages/web/src/lib/notion-import.server.ts) (9 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (2 matches)
  - [packages/web/src/app/api/collections/[id]/records/[recordId]/route.ts](../packages/web/src/app/api/collections/[id]/records/[recordId]/route.ts) (2 matches)
  - [packages/web/src/app/api/collections/[id]/route.ts](../packages/web/src/app/api/collections/[id]/route.ts) (1 matches)
  - [packages/web/src/app/collections/[id]/page.tsx](../packages/web/src/app/collections/[id]/page.tsx) (1 matches)
  - [packages/web/src/app/search/page.tsx](../packages/web/src/app/search/page.tsx) (1 matches)
  - [packages/web/src/lib/developer-openapi.ts](../packages/web/src/lib/developer-openapi.ts) (3 matches)
- Notes:
  - none

### CollectionField

- Schema: [packages/db/prisma/schema.prisma#L6332](../packages/db/prisma/schema.prisma#L6332)
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
  - [packages/web/src/lib/collections.server.ts](../packages/web/src/lib/collections.server.ts) (6 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (2 matches)
  - [packages/web/src/components/collections/collection-records-grid.tsx](../packages/web/src/components/collections/collection-records-grid.tsx) (9 matches)
  - [packages/web/src/components/collections/collection-records-client.tsx](../packages/web/src/components/collections/collection-records-client.tsx) (5 matches)
  - [packages/web/src/lib/developer-openapi.ts](../packages/web/src/lib/developer-openapi.ts) (3 matches)
  - [packages/web/src/lib/content-search.server.ts](../packages/web/src/lib/content-search.server.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql](../packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql) (10 matches)
- Notes:
  - none

### CollectionRecord

- Schema: [packages/db/prisma/schema.prisma#L6365](../packages/db/prisma/schema.prisma#L6365)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 21 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 21 matches
  - `components`: 2 files / 29 matches
  - `runtime-libraries`: 6 files / 22 matches
  - `schema`: 1 files / 11 matches
  - `migrations`: 1 files / 22 matches
  - `generated`: 16 files / 316 matches
- Key files:
  - [packages/web/src/lib/collections.server.ts](../packages/web/src/lib/collections.server.ts) (28 matches)
  - [packages/web/src/lib/notion-import.server.ts](../packages/web/src/lib/notion-import.server.ts) (8 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (2 matches)
  - [packages/web/src/lib/content-attachments.server.ts](../packages/web/src/lib/content-attachments.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/web/src/components/collections/collection-records-grid.tsx](../packages/web/src/components/collections/collection-records-grid.tsx) (20 matches)
  - [packages/web/src/components/collections/collection-records-client.tsx](../packages/web/src/components/collections/collection-records-client.tsx) (9 matches)
  - [packages/web/src/lib/content-search.server.ts](../packages/web/src/lib/content-search.server.ts) (1 matches)
- Notes:
  - none

### CollectionRelation

- Schema: [packages/db/prisma/schema.prisma#L6420](../packages/db/prisma/schema.prisma#L6420)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 8 matches
  - `runtime-libraries`: 3 files / 11 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 1 files / 22 matches
  - `generated`: 14 files / 267 matches
- Key files:
  - [packages/web/src/lib/collections.server.ts](../packages/web/src/lib/collections.server.ts) (14 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/web/src/lib/developer-openapi.ts](../packages/web/src/lib/developer-openapi.ts) (3 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (9 matches)
  - [packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql](../packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql) (22 matches)
  - [packages/db/src/generated/prisma/models/CollectionRelation.ts](../packages/db/src/generated/prisma/models/CollectionRelation.ts) (206 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (35 matches)
  - [packages/db/src/generated/prisma/models/CollectionRecord.ts](../packages/db/src/generated/prisma/models/CollectionRecord.ts) (4 matches)
- Notes:
  - none

### CollectionView

- Schema: [packages/db/prisma/schema.prisma#L6460](../packages/db/prisma/schema.prisma#L6460)
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
  - [packages/web/src/lib/collections.server.ts](../packages/web/src/lib/collections.server.ts) (8 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (2 matches)
  - [packages/web/src/components/collections/collection-records-grid.tsx](../packages/web/src/components/collections/collection-records-grid.tsx) (5 matches)
  - [packages/web/src/components/collections/collection-records-client.tsx](../packages/web/src/components/collections/collection-records-client.tsx) (3 matches)
  - [packages/web/src/components/collections/collection-column-settings.ts](../packages/web/src/components/collections/collection-column-settings.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql](../packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/CollectionView.ts](../packages/db/src/generated/prisma/models/CollectionView.ts) (151 matches)
- Notes:
  - none

### CommerceEntitlement

- Schema: [packages/db/prisma/schema.prisma#L10565](../packages/db/prisma/schema.prisma#L10565)
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

- Schema: [packages/db/prisma/schema.prisma#L10522](../packages/db/prisma/schema.prisma#L10522)
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
  - [packages/web/src/lib/shirt-fulfillment.server.ts](../packages/web/src/lib/shirt-fulfillment.server.ts) (10 matches)
  - [packages/web/src/app/api/stripe/webhook/route.ts](../packages/web/src/app/api/stripe/webhook/route.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/CommerceFulfillment.ts](../packages/db/src/generated/prisma/models/CommerceFulfillment.ts) (196 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### CommerceFulfillmentMapping

- Schema: [packages/db/prisma/schema.prisma#L10384](../packages/db/prisma/schema.prisma#L10384)
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

- Schema: [packages/db/prisma/schema.prisma#L10289](../packages/db/prisma/schema.prisma#L10289)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 6 matches
  - `runtime-libraries`: 4 files / 6 matches
  - `docs`: 1 files / 2 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 8 matches
  - `generated`: 10 files / 241 matches
- Key files:
  - [packages/db/src/managed-data/managed-commerce-catalog.ts](../packages/db/src/managed-data/managed-commerce-catalog.ts) (4 matches)
  - [packages/web/src/lib/commerce-catalog.server.ts](../packages/web/src/lib/commerce-catalog.server.ts) (4 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/web/src/lib/task-funding/conversion.server.ts](../packages/web/src/lib/task-funding/conversion.server.ts) (2 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (7 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (1 matches)
- Notes:
  - none

### CommerceOfferVariant

- Schema: [packages/db/prisma/schema.prisma#L10335](../packages/db/prisma/schema.prisma#L10335)
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
  - [packages/web/src/lib/commerce-catalog.server.ts](../packages/web/src/lib/commerce-catalog.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (9 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/CommerceOfferVariant.ts](../packages/db/src/generated/prisma/models/CommerceOfferVariant.ts) (219 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### CommerceOrder

- Schema: [packages/db/prisma/schema.prisma#L10410](../packages/db/prisma/schema.prisma#L10410)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 23 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 23 matches
  - `api-routes`: 2 files / 8 matches
  - `runtime-libraries`: 3 files / 15 matches
  - `docs`: 1 files / 2 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 13 matches
  - `generated`: 9 files / 307 matches
- Key files:
  - [packages/web/src/lib/task-funding/payments.server.ts](../packages/web/src/lib/task-funding/payments.server.ts) (14 matches)
  - [packages/web/src/app/api/stripe/create-checkout/route.ts](../packages/web/src/app/api/stripe/create-checkout/route.ts) (12 matches)
  - [packages/web/src/lib/shirt-fulfillment.server.ts](../packages/web/src/lib/shirt-fulfillment.server.ts) (8 matches)
  - [packages/web/src/lib/task-funding/escrow.server.ts](../packages/web/src/lib/task-funding/escrow.server.ts) (8 matches)
  - [packages/web/src/app/api/stripe/webhook/route.ts](../packages/web/src/app/api/stripe/webhook/route.ts) (4 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (12 matches)
- Notes:
  - none

### CommerceOrderItem

- Schema: [packages/db/prisma/schema.prisma#L10475](../packages/db/prisma/schema.prisma#L10475)
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
- Direct Prisma usage: 4 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 5 matches
  - `api-routes`: 3 files / 4 matches
  - `pages`: 1 files / 1 matches
  - `components`: 2 files / 2 matches
  - `runtime-libraries`: 9 files / 49 matches
  - `scripts`: 2 files / 2 matches
  - `tests`: 2 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 9 files / 200 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (5 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (3 matches)
  - [packages/web/src/app/api/referendums/[slug]/represented-people/route.ts](../packages/web/src/app/api/referendums/[slug]/represented-people/route.ts) (3 matches)
  - [packages/web/src/app/api/conflicts/search/route.ts](../packages/web/src/app/api/conflicts/search/route.ts) (2 matches)
  - [packages/web/src/app/api/tasks/[id]/pledge/route.ts](../packages/web/src/app/api/tasks/[id]/pledge/route.ts) (1 matches)
  - [packages/web/src/app/agencies/ddod/page.tsx](../packages/web/src/app/agencies/ddod/page.tsx) (1 matches)
  - [packages/web/src/components/people/PeopleFilterBar.tsx](../packages/web/src/components/people/PeopleFilterBar.tsx) (1 matches)
  - [packages/web/src/components/people/RepresentedPersonForm.tsx](../packages/web/src/components/people/RepresentedPersonForm.tsx) (1 matches)
- Notes:
  - none

### ContentAccessGrant

- Schema: [packages/db/prisma/schema.prisma#L6488](../packages/db/prisma/schema.prisma#L6488)
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
  - [packages/web/src/lib/content-access.server.ts](../packages/web/src/lib/content-access.server.ts) (12 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L6520](../packages/db/prisma/schema.prisma#L6520)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 20 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 20 matches
  - `runtime-libraries`: 4 files / 20 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 12 matches
  - `generated`: 12 files / 260 matches
- Key files:
  - [packages/web/src/lib/content-attachments.server.ts](../packages/web/src/lib/content-attachments.server.ts) (26 matches)
  - [packages/web/src/lib/notion-import.server.ts](../packages/web/src/lib/notion-import.server.ts) (10 matches)
  - [packages/web/src/lib/content-export.server.ts](../packages/web/src/lib/content-export.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/execution-lifecycle.server.ts](../packages/web/src/lib/tasks/execution-lifecycle.server.ts) (2 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql](../packages/db/prisma/migrations/20260714233000_add_notion_replacement_foundation/migration.sql) (11 matches)
  - [packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql](../packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql) (1 matches)
- Notes:
  - none

### ContentReport

- Schema: [packages/db/prisma/schema.prisma#L10840](../packages/db/prisma/schema.prisma#L10840)
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
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (4 matches)
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
- Direct Prisma usage: 5 files / 14 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 14 matches
  - `runtime-libraries`: 5 files / 16 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 12 matches
  - `migrations`: 2 files / 25 matches
  - `generated`: 11 files / 321 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [packages/web/src/lib/court-data.server.ts](../packages/web/src/lib/court-data.server.ts) (12 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (8 matches)
  - [packages/db/src/managed-data/managed-humanity-v-government.ts](../packages/db/src/managed-data/managed-humanity-v-government.ts) (4 matches)
  - [packages/web/src/lib/humanity-v-government-case.server.ts](../packages/web/src/lib/humanity-v-government-case.server.ts) (4 matches)
  - [packages/web/src/lib/represented-people.server.ts](../packages/web/src/lib/represented-people.server.ts) (2 matches)
  - [packages/web/src/lib/__tests__/campaign-structured-data.test.ts](../packages/web/src/lib/__tests__/campaign-structured-data.test.ts) (2 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### CourtCaseClaim

- Schema: [packages/db/prisma/schema.prisma#L4998](../packages/db/prisma/schema.prisma#L4998)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 13 matches
  - `generated`: 13 files / 261 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [packages/web/src/lib/court-data.server.ts](../packages/web/src/lib/court-data.server.ts) (4 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (13 matches)
  - [packages/db/src/generated/prisma/models/CourtCaseClaim.ts](../packages/db/src/generated/prisma/models/CourtCaseClaim.ts) (208 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (31 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### CourtCaseEvidence

- Schema: [packages/db/prisma/schema.prisma#L5154](../packages/db/prisma/schema.prisma#L5154)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 10 matches
  - `migrations`: 1 files / 21 matches
  - `generated`: 14 files / 332 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 7 matches
- Key files:
  - [packages/web/src/lib/court-data.server.ts](../packages/web/src/lib/court-data.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (10 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (21 matches)
  - [packages/db/src/generated/prisma/models/CourtCaseEvidence.ts](../packages/db/src/generated/prisma/models/CourtCaseEvidence.ts) (271 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (37 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### CourtCaseHarm

- Schema: [packages/db/prisma/schema.prisma#L5063](../packages/db/prisma/schema.prisma#L5063)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 17 matches
  - `generated`: 13 files / 305 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [packages/web/src/lib/court-data.server.ts](../packages/web/src/lib/court-data.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (17 matches)
  - [packages/db/src/generated/prisma/models/CourtCaseHarm.ts](../packages/db/src/generated/prisma/models/CourtCaseHarm.ts) (252 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (31 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### CourtCaseParty

- Schema: [packages/db/prisma/schema.prisma#L4927](../packages/db/prisma/schema.prisma#L4927)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 9 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 9 matches
  - `api-routes`: 1 files / 2 matches
  - `runtime-libraries`: 4 files / 8 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 12 matches
  - `generated`: 11 files / 242 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 4 matches
- Key files:
  - [packages/web/src/lib/represented-people.server.ts](../packages/web/src/lib/represented-people.server.ts) (8 matches)
  - [packages/web/src/app/api/people/[id]/route.ts](../packages/web/src/app/api/people/[id]/route.ts) (4 matches)
  - [packages/web/src/lib/humanity-v-government-case.server.ts](../packages/web/src/lib/humanity-v-government-case.server.ts) (4 matches)
  - [packages/web/src/lib/court-data.server.ts](../packages/web/src/lib/court-data.server.ts) (2 matches)
  - [packages/web/src/lib/people-dedup.server.ts](../packages/web/src/lib/people-dedup.server.ts) (1 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
- Notes:
  - none

### CourtCaseRemedy

- Schema: [packages/db/prisma/schema.prisma#L5252](../packages/db/prisma/schema.prisma#L5252)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 2 matches
  - `runtime-libraries`: 2 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 16 matches
  - `generated`: 12 files / 285 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [packages/web/src/lib/court-data.server.ts](../packages/web/src/lib/court-data.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (15 matches)
  - [packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql](../packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/CourtCaseRemedy.ts](../packages/db/src/generated/prisma/models/CourtCaseRemedy.ts) (236 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
- Notes:
  - none

### DatingBlock

- Schema: [packages/db/prisma/schema.prisma#L10165](../packages/db/prisma/schema.prisma#L10165)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 163 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (4 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L10071](../packages/db/prisma/schema.prisma#L10071)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 4 matches
  - `runtime-libraries`: 1 files / 4 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 165 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (8 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L10118](../packages/db/prisma/schema.prisma#L10118)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 14 matches
  - `generated`: 12 files / 295 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (4 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (14 matches)
  - [packages/db/src/generated/prisma/models/DatingDatePlan.ts](../packages/db/src/generated/prisma/models/DatingDatePlan.ts) (242 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (31 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (4 matches)
- Notes:
  - none

### DatingInteraction

- Schema: [packages/db/prisma/schema.prisma#L10019](../packages/db/prisma/schema.prisma#L10019)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 8 files / 173 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (4 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L10043](../packages/db/prisma/schema.prisma#L10043)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 5 matches
  - `runtime-libraries`: 1 files / 5 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 10 files / 200 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (10 matches)
  - [docs/archive/earth-optimization-date-2026-05-20.md](../docs/archive/earth-optimization-date-2026-05-20.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (10 matches)
  - [packages/db/src/generated/prisma/models/DatingMatch.ts](../packages/db/src/generated/prisma/models/DatingMatch.ts) (153 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (28 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (4 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (3 matches)
- Notes:
  - none

### DatingMatchScore

- Schema: [packages/db/prisma/schema.prisma#L9986](../packages/db/prisma/schema.prisma#L9986)
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

- Schema: [packages/db/prisma/schema.prisma#L10090](../packages/db/prisma/schema.prisma#L10090)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 8 matches
  - `generated`: 10 files / 188 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (4 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L9963](../packages/db/prisma/schema.prisma#L9963)
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

- Schema: [packages/db/prisma/schema.prisma#L9767](../packages/db/prisma/schema.prisma#L9767)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 8 matches
  - `runtime-libraries`: 1 files / 8 matches
  - `docs`: 2 files / 3 matches
  - `schema`: 1 files / 19 matches
  - `migrations`: 1 files / 24 matches
  - `generated`: 10 files / 359 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (16 matches)
  - [docs/archive/earth-optimization-date-2026-05-20.md](../docs/archive/earth-optimization-date-2026-05-20.md) (2 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (19 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (24 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (288 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (55 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### DatingProfilePhoto

- Schema: [packages/db/prisma/schema.prisma#L9830](../packages/db/prisma/schema.prisma#L9830)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 208 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (4 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L9861](../packages/db/prisma/schema.prisma#L9861)
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

- Schema: [packages/db/prisma/schema.prisma#L9882](../packages/db/prisma/schema.prisma#L9882)
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

- Schema: [packages/db/prisma/schema.prisma#L9907](../packages/db/prisma/schema.prisma#L9907)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 2 matches
  - `runtime-libraries`: 2 files / 2 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 7 files / 179 matches
- Key files:
  - [packages/db/src/managed-data/managed-dating-catalog.ts](../packages/db/src/managed-data/managed-dating-catalog.ts) (2 matches)
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (5 matches)
  - [packages/db/src/generated/prisma/models/DatingQuestion.ts](../packages/db/src/generated/prisma/models/DatingQuestion.ts) (148 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### DatingQuestionAnswer

- Schema: [packages/db/prisma/schema.prisma#L9934](../packages/db/prisma/schema.prisma#L9934)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 8 matches
  - `generated`: 9 files / 188 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (2 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L10185](../packages/db/prisma/schema.prisma#L10185)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 13 matches
  - `generated`: 11 files / 250 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (2 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L6164](../packages/db/prisma/schema.prisma#L6164)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 16 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 16 matches
  - `pages`: 2 files / 2 matches
  - `components`: 4 files / 4 matches
  - `runtime-libraries`: 10 files / 30 matches
  - `tests`: 3 files / 8 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 14 matches
  - `migrations`: 3 files / 43 matches
  - `generated`: 16 files / 341 matches
- Key files:
  - [packages/web/src/lib/documents.server.ts](../packages/web/src/lib/documents.server.ts) (21 matches)
  - [packages/web/src/lib/notion-import.server.ts](../packages/web/src/lib/notion-import.server.ts) (8 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (4 matches)
  - [packages/web/src/lib/tasks/private-work-portability.server.ts](../packages/web/src/lib/tasks/private-work-portability.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/web/src/app/documents/[id]/page.tsx](../packages/web/src/app/documents/[id]/page.tsx) (1 matches)
  - [packages/web/src/app/search/page.tsx](../packages/web/src/app/search/page.tsx) (1 matches)
  - [packages/web/src/components/documents/task-documents-list.tsx](../packages/web/src/components/documents/task-documents-list.tsx) (1 matches)
- Notes:
  - none

### DocumentRevision

- Schema: [packages/db/prisma/schema.prisma#L6246](../packages/db/prisma/schema.prisma#L6246)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 6 matches
  - `runtime-libraries`: 4 files / 7 matches
  - `tests`: 1 files / 1 matches
  - `docs`: 2 files / 3 matches
  - `schema`: 1 files / 8 matches
  - `migrations`: 3 files / 17 matches
  - `generated`: 12 files / 231 matches
- Key files:
  - [packages/web/src/lib/documents.server.ts](../packages/web/src/lib/documents.server.ts) (8 matches)
  - [packages/db/src/managed-data/managed-demo-content.ts](../packages/db/src/managed-data/managed-demo-content.ts) (2 matches)
  - [packages/web/src/lib/tasks/execution-lifecycle.server.ts](../packages/web/src/lib/tasks/execution-lifecycle.server.ts) (2 matches)
  - [packages/web/src/lib/content-search.server.ts](../packages/web/src/lib/content-search.server.ts) (1 matches)
  - [packages/web/src/lib/__tests__/content-search.server.test.ts](../packages/web/src/lib/__tests__/content-search.server.test.ts) (1 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (2 matches)
  - [docs/PRD.md](../docs/PRD.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (8 matches)
- Notes:
  - none

### EmailLog

- Schema: [packages/db/prisma/schema.prisma#L9502](../packages/db/prisma/schema.prisma#L9502)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 12 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 12 matches
  - `runtime-libraries`: 12 files / 30 matches
  - `scripts`: 2 files / 2 matches
  - `docs`: 6 files / 9 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 6 files / 22 matches
  - `generated`: 10 files / 246 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 7 matches
- Key files:
  - [packages/web/src/lib/email/resend-webhook.ts](../packages/web/src/lib/email/resend-webhook.ts) (16 matches)
  - [packages/web/src/lib/admin-communications.server.ts](../packages/web/src/lib/admin-communications.server.ts) (4 matches)
  - [packages/web/src/lib/email/email-log.server.ts](../packages/web/src/lib/email/email-log.server.ts) (4 matches)
  - [packages/web/src/lib/tasks/task-notifications.server.ts](../packages/web/src/lib/tasks/task-notifications.server.ts) (3 matches)
  - [packages/web/src/lib/email/send-deduped-email.server.ts](../packages/web/src/lib/email/send-deduped-email.server.ts) (3 matches)
  - [packages/web/src/lib/task-funding/escrow.server.ts](../packages/web/src/lib/task-funding/escrow.server.ts) (3 matches)
  - [packages/web/src/lib/email/suppression.server.ts](../packages/web/src/lib/email/suppression.server.ts) (2 matches)
  - [packages/web/src/lib/email/task-funding-pledge-confirmation-email.ts](../packages/web/src/lib/email/task-funding-pledge-confirmation-email.ts) (2 matches)
- Notes:
  - none

### ExternalActionRequest

- Schema: [packages/db/prisma/schema.prisma#L6911](../packages/db/prisma/schema.prisma#L6911)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 12 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 12 matches
  - `runtime-libraries`: 4 files / 13 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 3 files / 3 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 2 files / 20 matches
  - `generated`: 12 files / 332 matches
  - `other`: 2 files / 5 matches
- Key files:
  - [packages/web/src/lib/tasks/external-action.server.ts](../packages/web/src/lib/tasks/external-action.server.ts) (20 matches)
  - [packages/web/src/lib/mcp-tools/private-execution.ts](../packages/web/src/lib/mcp-tools/private-execution.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/web/src/lib/mcp-instructions.ts](../packages/web/src/lib/mcp-instructions.ts) (1 matches)
  - [packages/web/scripts/verify-preview-masking.mjs](../packages/web/scripts/verify-preview-masking.mjs) (2 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [docs/plans/phased-approach-optimitron.md](../docs/plans/phased-approach-optimitron.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### Form

- Schema: [packages/db/prisma/schema.prisma#L9158](../packages/db/prisma/schema.prisma#L9158)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `components`: 3 files / 5 matches
  - `runtime-libraries`: 10 files / 39 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 1 files / 7 matches
  - `docs`: 5 files / 6 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 18 matches
  - `generated`: 12 files / 270 matches
  - `zod`: 1 files / 1 matches
  - `other`: 6 files / 12 matches
- Key files:
  - [packages/web/src/lib/form-responses.server.ts](../packages/web/src/lib/form-responses.server.ts) (21 matches)
  - [packages/web/src/components/donate/WaysToGiveCard.tsx](../packages/web/src/components/donate/WaysToGiveCard.tsx) (3 matches)
  - [packages/web/src/components/demo/slides/sierra/slide-trial-acceleration-12x.tsx](../packages/web/src/components/demo/slides/sierra/slide-trial-acceleration-12x.tsx) (1 matches)
  - [packages/web/src/components/prize/VoterPrizeTreasuryDeposit.tsx](../packages/web/src/components/prize/VoterPrizeTreasuryDeposit.tsx) (1 matches)
  - [packages/data/src/datasets/medical-data/references.json](../packages/data/src/datasets/medical-data/references.json) (11 matches)
  - [packages/data/src/datasets/medical-data/treatments/irritable-bowel-syndrome.json](../packages/data/src/datasets/medical-data/treatments/irritable-bowel-syndrome.json) (2 matches)
  - [packages/data/src/datasets/medical-data/treatments/anxiety-disorder.json](../packages/data/src/datasets/medical-data/treatments/anxiety-disorder.json) (1 matches)
  - [packages/data/src/datasets/medical-data/treatments/genital-prolapse.json](../packages/data/src/datasets/medical-data/treatments/genital-prolapse.json) (1 matches)
- Notes:
  - none

### FormField

- Schema: [packages/db/prisma/schema.prisma#L9258](../packages/db/prisma/schema.prisma#L9258)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `components`: 3 files / 55 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 9 files / 221 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 4 matches
- Key files:
  - [packages/web/src/lib/form-responses.server.ts](../packages/web/src/lib/form-responses.server.ts) (4 matches)
  - [packages/web/src/components/profile/ProfileSnapshotForm.tsx](../packages/web/src/components/profile/ProfileSnapshotForm.tsx) (51 matches)
  - [packages/web/src/components/profile/DailyCheckInCard.tsx](../packages/web/src/components/profile/DailyCheckInCard.tsx) (3 matches)
  - [packages/web/src/components/ui/form-field.tsx](../packages/web/src/components/ui/form-field.tsx) (1 matches)
  - [packages/web/scripts/verify-preview-masking.mjs](../packages/web/scripts/verify-preview-masking.mjs) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql](../packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql) (10 matches)
- Notes:
  - none

### FormResponse

- Schema: [packages/db/prisma/schema.prisma#L9365](../packages/db/prisma/schema.prisma#L9365)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 12 matches
  - `generated`: 12 files / 225 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/form-responses.server.ts](../packages/web/src/lib/form-responses.server.ts) (2 matches)
  - [packages/web/scripts/verify-preview-masking.mjs](../packages/web/scripts/verify-preview-masking.mjs) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql](../packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql) (12 matches)
  - [packages/db/src/generated/prisma/models/FormResponse.ts](../packages/db/src/generated/prisma/models/FormResponse.ts) (176 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### FormRevision

- Schema: [packages/db/prisma/schema.prisma#L9199](../packages/db/prisma/schema.prisma#L9199)
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
  - [packages/web/src/lib/form-responses.server.ts](../packages/web/src/lib/form-responses.server.ts) (6 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L9234](../packages/db/prisma/schema.prisma#L9234)
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

- Schema: [packages/db/prisma/schema.prisma#L9322](../packages/db/prisma/schema.prisma#L9322)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 9 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 9 matches
  - `runtime-libraries`: 2 files / 9 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 1 files / 20 matches
  - `generated`: 13 files / 290 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/form-responses.server.ts](../packages/web/src/lib/form-responses.server.ts) (10 matches)
  - [packages/web/src/lib/tasks/external-action.server.ts](../packages/web/src/lib/tasks/external-action.server.ts) (8 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (9 matches)
  - [packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql](../packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql) (20 matches)
  - [packages/db/src/generated/prisma/models/FormSubmission.ts](../packages/db/src/generated/prisma/models/FormSubmission.ts) (231 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (35 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### GlobalVariable

- Schema: [packages/db/prisma/schema.prisma#L2400](../packages/db/prisma/schema.prisma#L2400)
- Classification: `runtime-live`
- Direct Prisma usage: 7 files / 15 matches
- Usage counts by bucket:
  - `runtime-prisma`: 7 files / 15 matches
  - `api-routes`: 2 files / 3 matches
  - `components`: 1 files / 1 matches
  - `runtime-libraries`: 8 files / 24 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 37 matches
  - `migrations`: 3 files / 29 matches
  - `generated`: 21 files / 544 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (10 matches)
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (10 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (7 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (4 matches)
  - [packages/web/src/app/api/health-analysis/submit/route.ts](../packages/web/src/app/api/health-analysis/submit/route.ts) (3 matches)
  - [packages/web/src/app/api/conditions/search/route.ts](../packages/web/src/app/api/conditions/search/route.ts) (2 matches)
  - [packages/web/src/lib/global-variable-lookup.server.ts](../packages/web/src/lib/global-variable-lookup.server.ts) (2 matches)
  - [packages/web/src/components/medical/medical-pages.tsx](../packages/web/src/components/medical/medical-pages.tsx) (1 matches)
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
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (6 matches)
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
- Key files:
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (8 matches)
  - [packages/web/src/lib/efficacy-lag-matcher.server.ts](../packages/web/src/lib/efficacy-lag-matcher.server.ts) (3 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/web/scripts/recompute-efficacy-lag.ts](../packages/web/scripts/recompute-efficacy-lag.ts) (1 matches)
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
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (5 matches)
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
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (2 matches)
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
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (2 matches)
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
- Direct Prisma usage: 7 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 7 files / 11 matches
  - `api-routes`: 1 files / 1 matches
  - `components`: 1 files / 1 matches
  - `runtime-libraries`: 19 files / 37 matches
  - `scripts`: 2 files / 2 matches
  - `tests`: 5 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 35 matches
  - `migrations`: 10 files / 31 matches
  - `generated`: 30 files / 426 matches
  - `zod`: 1 files / 1 matches
  - `other`: 5 files / 13 matches
- Key files:
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (8 matches)
  - [packages/web/src/lib/aggregate-alignment.server.ts](../packages/web/src/lib/aggregate-alignment.server.ts) (5 matches)
  - [packages/web/scripts/import-treaty-policy-model.ts](../packages/web/scripts/import-treaty-policy-model.ts) (2 matches)
  - [packages/web/src/app/api/referendums/[slug]/represented-people/route.ts](../packages/web/src/app/api/referendums/[slug]/represented-people/route.ts) (2 matches)
  - [packages/web/src/lib/alignment-politicians.server.ts](../packages/web/src/lib/alignment-politicians.server.ts) (2 matches)
  - [packages/web/src/lib/jurisdiction-search.server.ts](../packages/web/src/lib/jurisdiction-search.server.ts) (2 matches)
  - [packages/web/src/lib/wishocracy-catalog.server.ts](../packages/web/src/lib/wishocracy-catalog.server.ts) (2 matches)
  - [packages/web/src/components/scoreboard/PoliticianAlignmentDashboard.tsx](../packages/web/src/components/scoreboard/PoliticianAlignmentDashboard.tsx) (1 matches)
- Notes:
  - none

### KnowledgeAnswer

- Schema: [packages/db/prisma/schema.prisma#L9291](../packages/db/prisma/schema.prisma#L9291)
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
  - [packages/web/src/lib/form-responses.server.ts](../packages/web/src/lib/form-responses.server.ts) (11 matches)
  - [packages/web/scripts/verify-preview-masking.mjs](../packages/web/scripts/verify-preview-masking.mjs) (2 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [docs/PRD.md](../docs/PRD.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql](../packages/db/prisma/migrations/20260722120000_normalize_forms_and_reusable_answers/migration.sql) (11 matches)
  - [packages/db/src/generated/prisma/models/KnowledgeAnswer.ts](../packages/db/src/generated/prisma/models/KnowledgeAnswer.ts) (161 matches)
- Notes:
  - none

### McpToolCallAudit

- Schema: [packages/db/prisma/schema.prisma#L10775](../packages/db/prisma/schema.prisma#L10775)
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
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (2 matches)
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
- Direct Prisma usage: 3 files / 9 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 9 matches
  - `runtime-libraries`: 14 files / 33 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 7 files / 27 matches
  - `docs`: 7 files / 20 matches
  - `schema`: 1 files / 18 matches
  - `migrations`: 3 files / 30 matches
  - `generated`: 15 files / 301 matches
  - `zod`: 1 files / 2 matches
  - `other`: 3 files / 14 matches
- Key files:
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (14 matches)
  - [packages/web/src/lib/census-aggregation.server.ts](../packages/web/src/lib/census-aggregation.server.ts) (2 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (2 matches)
  - [packages/data/src/importers/types.ts](../packages/data/src/importers/types.ts) (4 matches)
  - [packages/optimizer/src/temporal-alignment.ts](../packages/optimizer/src/temporal-alignment.ts) (4 matches)
  - [packages/optimizer/src/types.ts](../packages/optimizer/src/types.ts) (4 matches)
  - [packages/data/src/importers/standard-variable-names.ts](../packages/data/src/importers/standard-variable-names.ts) (3 matches)
  - [packages/data/src/pipelines/fetch-country-timeseries.ts](../packages/data/src/pipelines/fetch-country-timeseries.ts) (2 matches)
- Notes:
  - none

### NOf1Variable

- Schema: [packages/db/prisma/schema.prisma#L2666](../packages/db/prisma/schema.prisma#L2666)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `runtime-libraries`: 3 files / 6 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 2 files / 17 matches
  - `generated`: 12 files / 298 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 15 matches
- Key files:
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (6 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (2 matches)
  - [packages/data/src/variable-statistics.ts](../packages/data/src/variable-statistics.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (2 matches)
  - [docs/archive/REFERENCES.md](../docs/archive/REFERENCES.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (9 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (10 matches)
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
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 9 files / 394 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/aggregate-relationships.server.ts](../packages/web/src/lib/aggregate-relationships.server.ts) (9 matches)
  - [packages/web/src/app/api/health-analysis/submit/route.ts](../packages/web/src/app/api/health-analysis/submit/route.ts) (3 matches)
  - [packages/optimizer/src/statistics.ts](../packages/optimizer/src/statistics.ts) (3 matches)
  - [packages/optimizer/src/variable-relationship-runner.ts](../packages/optimizer/src/variable-relationship-runner.ts) (3 matches)
  - [packages/extension/src/workers/analysis.worker.ts](../packages/extension/src/workers/analysis.worker.ts) (2 matches)
  - [packages/optimizer/src/types.ts](../packages/optimizer/src/types.ts) (1 matches)
  - [packages/optimizer/src/__tests__/aggregate-variable-relationship.test.ts](../packages/optimizer/src/__tests__/aggregate-variable-relationship.test.ts) (3 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (2 matches)
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
  - `other`: 4 files / 9 matches
- Key files:
  - [packages/web/src/components/notifications/PushNotificationPrompt.tsx](../packages/web/src/components/notifications/PushNotificationPrompt.tsx) (2 matches)
  - [packages/web/src/components/settings/SettingsClient.tsx](../packages/web/src/components/settings/SettingsClient.tsx) (1 matches)
  - [packages/extension/src/background/service-worker.ts](../packages/extension/src/background/service-worker.ts) (2 matches)
  - [packages/web/src/lib/routes.ts](../packages/web/src/lib/routes.ts) (2 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (1 matches)
  - [packages/web/src/lib/push-notifications.ts](../packages/web/src/lib/push-notifications.ts) (1 matches)
  - [packages/web/src/lib/tasks/share-templates.ts](../packages/web/src/lib/tasks/share-templates.ts) (1 matches)
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
  - [packages/web/src/app/api/dashboard/notification-preferences/route.ts](../packages/web/src/app/api/dashboard/notification-preferences/route.ts) (4 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L10686](../packages/db/prisma/schema.prisma#L10686)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `api-routes`: 2 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 4 files / 15 matches
  - `generated`: 9 files / 182 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [packages/web/src/app/api/mcp/oauth/token/route.ts](../packages/web/src/app/api/mcp/oauth/token/route.ts) (4 matches)
  - [packages/web/src/app/api/mcp/oauth/consent/route.ts](../packages/web/src/app/api/mcp/oauth/consent/route.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql](../packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql) (9 matches)
  - [packages/db/prisma/migrations/20260425250000_mcp_scope_enum/migration.sql](../packages/db/prisma/migrations/20260425250000_mcp_scope_enum/migration.sql) (3 matches)
  - [packages/db/prisma/migrations/20260428125500_drop_legacy_mcp_scopes/migration.sql](../packages/db/prisma/migrations/20260428125500_drop_legacy_mcp_scopes/migration.sql) (2 matches)
  - [packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql](../packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql) (1 matches)
- Notes:
  - none

### OAuthClient

- Schema: [packages/db/prisma/schema.prisma#L10650](../packages/db/prisma/schema.prisma#L10650)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 4 matches
  - `api-routes`: 3 files / 3 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 2 files / 5 matches
  - `generated`: 8 files / 181 matches
  - `other`: 1 files / 4 matches
- Key files:
  - [packages/web/src/app/api/mcp/oauth/authorize/route.ts](../packages/web/src/app/api/mcp/oauth/authorize/route.ts) (2 matches)
  - [packages/web/src/app/api/mcp/oauth/consent/route.ts](../packages/web/src/app/api/mcp/oauth/consent/route.ts) (2 matches)
  - [packages/web/src/app/api/mcp/oauth/register/route.ts](../packages/web/src/app/api/mcp/oauth/register/route.ts) (2 matches)
  - [packages/web/src/app/mcp/authorize/page.tsx](../packages/web/src/app/mcp/authorize/page.tsx) (2 matches)
  - [packages/web/src/lib/developer-openapi.ts](../packages/web/src/lib/developer-openapi.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql](../packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql) (4 matches)
- Notes:
  - none

### OAuthGrant

- Schema: [packages/db/prisma/schema.prisma#L10731](../packages/db/prisma/schema.prisma#L10731)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 7 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 7 matches
  - `api-routes`: 3 files / 5 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 5 files / 17 matches
  - `generated`: 10 files / 187 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/app/api/mcp/oauth/revoke/route.ts](../packages/web/src/app/api/mcp/oauth/revoke/route.ts) (4 matches)
  - [packages/web/src/app/api/mcp/oauth/token/route.ts](../packages/web/src/app/api/mcp/oauth/token/route.ts) (4 matches)
  - [packages/web/src/app/api/mcp/route.ts](../packages/web/src/app/api/mcp/route.ts) (2 matches)
  - [packages/web/src/app/mcp/authorize/page.tsx](../packages/web/src/app/mcp/authorize/page.tsx) (2 matches)
  - [packages/web/src/lib/auth-utils.ts](../packages/web/src/lib/auth-utils.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql](../packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql) (10 matches)
- Notes:
  - none

### Organization

- Schema: [packages/db/prisma/schema.prisma#L5600](../packages/db/prisma/schema.prisma#L5600)
- Classification: `core`
- Direct Prisma usage: 23 files / 57 matches
- Usage counts by bucket:
  - `runtime-prisma`: 23 files / 57 matches
  - `api-routes`: 7 files / 20 matches
  - `pages`: 6 files / 9 matches
  - `components`: 7 files / 15 matches
  - `runtime-libraries`: 28 files / 114 matches
  - `scripts`: 2 files / 3 matches
  - `tests`: 11 files / 20 matches
  - `docs`: 8 files / 13 matches
  - `schema`: 1 files / 38 matches
  - `migrations`: 14 files / 45 matches
  - `generated`: 30 files / 479 matches
  - `zod`: 1 files / 1 matches
  - `other`: 8 files / 31 matches
- Key files:
  - [packages/web/src/lib/organization.server.ts](../packages/web/src/lib/organization.server.ts) (40 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (30 matches)
  - [packages/web/src/lib/notion-import.server.ts](../packages/web/src/lib/notion-import.server.ts) (14 matches)
  - [packages/db/src/managed-data/managed-iam-organization.ts](../packages/db/src/managed-data/managed-iam-organization.ts) (11 matches)
  - [packages/web/src/app/api/admin/organizations/[id]/route.ts](../packages/web/src/app/api/admin/organizations/[id]/route.ts) (11 matches)
  - [packages/db/src/managed-data/managed-demo-user.ts](../packages/db/src/managed-data/managed-demo-user.ts) (6 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (6 matches)
  - [packages/web/src/app/api/organizations/[id]/route.ts](../packages/web/src/app/api/organizations/[id]/route.ts) (6 matches)
- Notes:
  - none

### OrganizationMember

- Schema: [packages/db/prisma/schema.prisma#L5760](../packages/db/prisma/schema.prisma#L5760)
- Classification: `core`
- Direct Prisma usage: 10 files / 20 matches
- Usage counts by bucket:
  - `runtime-prisma`: 10 files / 20 matches
  - `api-routes`: 2 files / 2 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 8 files / 19 matches
  - `docs`: 2 files / 3 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 9 matches
  - `generated`: 9 files / 153 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/organization.server.ts](../packages/web/src/lib/organization.server.ts) (23 matches)
  - [packages/db/src/managed-data/managed-demo-user.ts](../packages/db/src/managed-data/managed-demo-user.ts) (2 matches)
  - [packages/db/src/managed-data/managed-iam-organization.ts](../packages/db/src/managed-data/managed-iam-organization.ts) (2 matches)
  - [packages/web/src/app/api/mcp/oauth/consent/route.ts](../packages/web/src/app/api/mcp/oauth/consent/route.ts) (2 matches)
  - [packages/web/src/app/api/mcp/route.ts](../packages/web/src/app/api/mcp/route.ts) (2 matches)
  - [packages/web/src/app/mcp/authorize/page.tsx](../packages/web/src/app/mcp/authorize/page.tsx) (2 matches)
  - [packages/web/src/lib/auth-utils.ts](../packages/web/src/lib/auth-utils.ts) (2 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (2 matches)
- Notes:
  - none

### OrganizationName

- Schema: [packages/db/prisma/schema.prisma#L5692](../packages/db/prisma/schema.prisma#L5692)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 3 matches
  - `runtime-libraries`: 2 files / 4 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 16 matches
  - `generated`: 10 files / 250 matches
  - `zod`: 1 files / 1 matches
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

- Schema: [packages/db/prisma/schema.prisma#L5788](../packages/db/prisma/schema.prisma#L5788)
- Classification: `runtime-live`
- Direct Prisma usage: 9 files / 16 matches
- Usage counts by bucket:
  - `runtime-prisma`: 9 files / 16 matches
  - `api-routes`: 3 files / 6 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 5 files / 10 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 12 matches
  - `generated`: 10 files / 211 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (7 matches)
  - [packages/web/src/lib/referendum-site.server.ts](../packages/web/src/lib/referendum-site.server.ts) (6 matches)
  - [packages/web/src/app/api/admin/referendum-positions/[id]/route.ts](../packages/web/src/app/api/admin/referendum-positions/[id]/route.ts) (4 matches)
  - [packages/web/src/app/api/admin/referendum-positions/route.ts](../packages/web/src/app/api/admin/referendum-positions/route.ts) (4 matches)
  - [packages/web/src/app/api/referendums/[slug]/organization-position/route.ts](../packages/web/src/app/api/referendums/[slug]/organization-position/route.ts) (4 matches)
  - [packages/db/src/managed-data/managed-demo-user.ts](../packages/db/src/managed-data/managed-demo-user.ts) (2 matches)
  - [packages/db/src/managed-data/managed-iam-organization.ts](../packages/db/src/managed-data/managed-iam-organization.ts) (2 matches)
  - [packages/web/src/app/admin/referendum-positions/page.tsx](../packages/web/src/app/admin/referendum-positions/page.tsx) (2 matches)
- Notes:
  - none

### ParameterDefinition

- Schema: [packages/db/prisma/schema.prisma#L7771](../packages/db/prisma/schema.prisma#L7771)
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
  - [packages/web/src/lib/parameters/parameter-catalog.server.ts](../packages/web/src/lib/parameters/parameter-catalog.server.ts) (19 matches)
  - [packages/web/src/lib/parameters/task-impact-calculation.server.ts](../packages/web/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql](../packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/ParameterDefinition.ts](../packages/db/src/generated/prisma/models/ParameterDefinition.ts) (150 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### ParameterRevision

- Schema: [packages/db/prisma/schema.prisma#L7789](../packages/db/prisma/schema.prisma#L7789)
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
  - [packages/web/src/lib/parameters/parameter-catalog.server.ts](../packages/web/src/lib/parameters/parameter-catalog.server.ts) (18 matches)
  - [packages/web/src/lib/parameters/parameter-staleness.server.ts](../packages/web/src/lib/parameters/parameter-staleness.server.ts) (2 matches)
  - [packages/web/src/lib/parameters/task-impact-calculation.server.ts](../packages/web/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (9 matches)
  - [packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql](../packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql) (15 matches)
  - [packages/db/src/generated/prisma/models/ParameterRevision.ts](../packages/db/src/generated/prisma/models/ParameterRevision.ts) (341 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (35 matches)
  - [packages/db/src/generated/prisma/models/ParameterDefinition.ts](../packages/db/src/generated/prisma/models/ParameterDefinition.ts) (4 matches)
- Notes:
  - none

### ParameterRevisionInput

- Schema: [packages/db/prisma/schema.prisma#L7849](../packages/db/prisma/schema.prisma#L7849)
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
  - [packages/web/src/lib/parameters/parameter-catalog.server.ts](../packages/web/src/lib/parameters/parameter-catalog.server.ts) (6 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L7869](../packages/db/prisma/schema.prisma#L7869)
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
  - [packages/web/src/lib/parameters/parameter-catalog.server.ts](../packages/web/src/lib/parameters/parameter-catalog.server.ts) (4 matches)
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
- Direct Prisma usage: 31 files / 72 matches
- Usage counts by bucket:
  - `runtime-prisma`: 31 files / 72 matches
  - `api-routes`: 9 files / 22 matches
  - `pages`: 4 files / 6 matches
  - `components`: 3 files / 3 matches
  - `runtime-libraries`: 48 files / 181 matches
  - `scripts`: 5 files / 19 matches
  - `tests`: 17 files / 45 matches
  - `docs`: 10 files / 25 matches
  - `schema`: 1 files / 39 matches
  - `migrations`: 15 files / 80 matches
  - `generated`: 27 files / 487 matches
  - `zod`: 1 files / 1 matches
  - `other`: 5 files / 24 matches
- Key files:
  - [packages/web/src/lib/person.server.ts](../packages/web/src/lib/person.server.ts) (43 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (31 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (15 matches)
  - [packages/web/src/lib/notion-import.server.ts](../packages/web/src/lib/notion-import.server.ts) (12 matches)
  - [packages/web/src/app/api/people/[id]/route.ts](../packages/web/src/app/api/people/[id]/route.ts) (10 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (8 matches)
  - [packages/web/src/lib/tasks.server.ts](../packages/web/src/lib/tasks.server.ts) (8 matches)
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (6 matches)
- Notes:
  - none

### PersonCondition

- Schema: [packages/db/prisma/schema.prisma#L1302](../packages/db/prisma/schema.prisma#L1302)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 10 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 10 matches
  - `api-routes`: 2 files / 6 matches
  - `runtime-libraries`: 4 files / 5 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 13 matches
  - `generated`: 12 files / 237 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [packages/web/src/app/api/people/[id]/route.ts](../packages/web/src/app/api/people/[id]/route.ts) (10 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (4 matches)
  - [packages/db/src/managed-data/managed-grandma-kay.ts](../packages/db/src/managed-data/managed-grandma-kay.ts) (2 matches)
  - [packages/web/src/app/api/referendums/[slug]/represented-people/route.ts](../packages/web/src/app/api/referendums/[slug]/represented-people/route.ts) (2 matches)
  - [packages/web/src/lib/efficacy-lag-matcher.server.ts](../packages/web/src/lib/efficacy-lag-matcher.server.ts) (2 matches)
  - [packages/web/src/lib/prosecution-data.server.ts](../packages/web/src/lib/prosecution-data.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
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
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/efficacy-lag-matcher.server.ts](../packages/web/src/lib/efficacy-lag-matcher.server.ts) (3 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (2 matches)
  - [packages/web/src/lib/prosecution-data.server.ts](../packages/web/src/lib/prosecution-data.server.ts) (1 matches)
  - [packages/web/scripts/recompute-efficacy-lag.ts](../packages/web/scripts/recompute-efficacy-lag.ts) (1 matches)
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
  - [packages/web/src/lib/personhood.server.ts](../packages/web/src/lib/personhood.server.ts) (4 matches)
  - [packages/web/src/app/api/treasury/register-ubi/route.ts](../packages/web/src/app/api/treasury/register-ubi/route.ts) (2 matches)
  - [packages/web/src/lib/census-aggregation.server.ts](../packages/web/src/lib/census-aggregation.server.ts) (2 matches)
  - [packages/web/src/lib/referral-point-mint.server.ts](../packages/web/src/lib/referral-point-mint.server.ts) (2 matches)
  - [packages/web/src/lib/wishocracy-community.ts](../packages/web/src/lib/wishocracy-community.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
- Notes:
  - none

### PersonMemorial

- Schema: [packages/db/prisma/schema.prisma#L1403](../packages/db/prisma/schema.prisma#L1403)
- Classification: `runtime-live`
- Direct Prisma usage: 7 files / 15 matches
- Usage counts by bucket:
  - `runtime-prisma`: 7 files / 15 matches
  - `api-routes`: 3 files / 6 matches
  - `runtime-libraries`: 4 files / 12 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 2 files / 20 matches
  - `generated`: 11 files / 263 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (9 matches)
  - [packages/web/src/app/api/people/[id]/route.ts](../packages/web/src/app/api/people/[id]/route.ts) (8 matches)
  - [packages/web/src/lib/prosecution-data.server.ts](../packages/web/src/lib/prosecution-data.server.ts) (7 matches)
  - [packages/web/src/lib/evidence-package.server.ts](../packages/web/src/lib/evidence-package.server.ts) (3 matches)
  - [packages/web/scripts/recompute-efficacy-lag.ts](../packages/web/scripts/recompute-efficacy-lag.ts) (2 matches)
  - [packages/web/src/app/api/referendums/[slug]/represented-people/route.ts](../packages/web/src/app/api/referendums/[slug]/represented-people/route.ts) (2 matches)
  - [packages/web/src/lib/efficacy-lag-matcher.server.ts](../packages/web/src/lib/efficacy-lag-matcher.server.ts) (2 matches)
  - [packages/web/src/app/api/people/[id]/evidence-package/route.ts](../packages/web/src/app/api/people/[id]/evidence-package/route.ts) (1 matches)
- Notes:
  - none

### PersonMemorialEvidence

- Schema: [packages/db/prisma/schema.prisma#L1574](../packages/db/prisma/schema.prisma#L1574)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 14 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 14 matches
  - `api-routes`: 2 files / 9 matches
  - `runtime-libraries`: 2 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 11 files / 240 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [packages/web/src/app/api/people/[id]/route.ts](../packages/web/src/app/api/people/[id]/route.ts) (16 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (11 matches)
  - [packages/web/src/app/api/referendums/[slug]/represented-people/route.ts](../packages/web/src/app/api/referendums/[slug]/represented-people/route.ts) (2 matches)
  - [packages/web/src/lib/evidence-package.server.ts](../packages/web/src/lib/evidence-package.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/PersonMemorialEvidence.ts](../packages/db/src/generated/prisma/models/PersonMemorialEvidence.ts) (191 matches)
- Notes:
  - none

### PersonMemorialResponsibleParty

- Schema: [packages/db/prisma/schema.prisma#L1514](../packages/db/prisma/schema.prisma#L1514)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 8 matches
  - `api-routes`: 2 files / 3 matches
  - `runtime-libraries`: 3 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 11 files / 241 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (11 matches)
  - [packages/web/src/app/api/people/[id]/route.ts](../packages/web/src/app/api/people/[id]/route.ts) (4 matches)
  - [packages/web/src/app/api/referendums/[slug]/represented-people/route.ts](../packages/web/src/app/api/referendums/[slug]/represented-people/route.ts) (2 matches)
  - [packages/web/src/lib/evidence-package.server.ts](../packages/web/src/lib/evidence-package.server.ts) (1 matches)
  - [packages/web/src/lib/prosecution-data.server.ts](../packages/web/src/lib/prosecution-data.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (10 matches)
- Notes:
  - none

### PersonMemorialSubmission

- Schema: [packages/db/prisma/schema.prisma#L1465](../packages/db/prisma/schema.prisma#L1465)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 9 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 9 matches
  - `api-routes`: 2 files / 6 matches
  - `runtime-libraries`: 2 files / 4 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 10 files / 208 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [packages/web/src/app/api/people/[id]/route.ts](../packages/web/src/app/api/people/[id]/route.ts) (10 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (6 matches)
  - [packages/web/src/app/api/referendums/[slug]/represented-people/route.ts](../packages/web/src/app/api/referendums/[slug]/represented-people/route.ts) (2 matches)
  - [packages/web/src/lib/evidence-package.server.ts](../packages/web/src/lib/evidence-package.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/PersonMemorialSubmission.ts](../packages/db/src/generated/prisma/models/PersonMemorialSubmission.ts) (167 matches)
- Notes:
  - none

### PersonRelationship

- Schema: [packages/db/prisma/schema.prisma#L1263](../packages/db/prisma/schema.prisma#L1263)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 9 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 9 matches
  - `api-routes`: 2 files / 6 matches
  - `runtime-libraries`: 2 files / 4 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 187 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/app/api/people/[id]/route.ts](../packages/web/src/app/api/people/[id]/route.ts) (10 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (6 matches)
  - [packages/web/src/app/api/referendums/[slug]/represented-people/route.ts](../packages/web/src/app/api/referendums/[slug]/represented-people/route.ts) (2 matches)
  - [packages/web/src/lib/evidence-package.server.ts](../packages/web/src/lib/evidence-package.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/PersonRelationship.ts](../packages/db/src/generated/prisma/models/PersonRelationship.ts) (146 matches)
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
  - [packages/web/src/app/api/cron/point-mint/route.ts](../packages/web/src/app/api/cron/point-mint/route.ts) (8 matches)
  - [packages/web/src/lib/referral-point-mint.server.ts](../packages/web/src/lib/referral-point-mint.server.ts) (6 matches)
  - [packages/web/src/app/api/points/balance/route.ts](../packages/web/src/app/api/points/balance/route.ts) (2 matches)
  - [packages/web/src/app/api/prize-treasury/status/route.ts](../packages/web/src/app/api/prize-treasury/status/route.ts) (2 matches)
  - [packages/web/src/lib/impact-receipts.server.ts](../packages/web/src/lib/impact-receipts.server.ts) (2 matches)
  - [packages/web/src/components/prize/EarthOptimizationPointsBalanceCard.tsx](../packages/web/src/components/prize/EarthOptimizationPointsBalanceCard.tsx) (2 matches)
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
  - `pages`: 3 files / 6 matches
  - `components`: 6 files / 9 matches
  - `runtime-libraries`: 7 files / 9 matches
  - `tests`: 3 files / 6 matches
  - `docs`: 2 files / 3 matches
  - `schema`: 1 files / 8 matches
  - `migrations`: 2 files / 8 matches
  - `generated`: 10 files / 204 matches
  - `zod`: 1 files / 1 matches
  - `other`: 10 files / 71 matches
- Key files:
  - [packages/web/src/lib/alignment-politicians.server.ts](../packages/web/src/lib/alignment-politicians.server.ts) (4 matches)
  - [packages/web/src/lib/aggregate-alignment.server.ts](../packages/web/src/lib/aggregate-alignment.server.ts) (2 matches)
  - [packages/web/src/app/api/scores/[jurisdictionCode]/[politicianExternalId]/route.ts](../packages/web/src/app/api/scores/[jurisdictionCode]/[politicianExternalId]/route.ts) (1 matches)
  - [packages/web/src/app/governments/[code]/page.tsx](../packages/web/src/app/governments/[code]/page.tsx) (3 matches)
  - [packages/web/src/app/governments/[code]/politicians/[bioguideId]/page.tsx](../packages/web/src/app/governments/[code]/politicians/[bioguideId]/page.tsx) (2 matches)
  - [packages/web/src/app/iab/page.tsx](../packages/web/src/app/iab/page.tsx) (1 matches)
  - [packages/web/src/components/alignment/AlignmentReport.tsx](../packages/web/src/components/alignment/AlignmentReport.tsx) (2 matches)
  - [packages/web/src/components/treasury/TreasuryAllocationViz.tsx](../packages/web/src/components/treasury/TreasuryAllocationViz.tsx) (2 matches)
- Notes:
  - none

### PoliticianVote

- Schema: [packages/db/prisma/schema.prisma#L4375](../packages/db/prisma/schema.prisma#L4375)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `pages`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `tests`: 1 files / 2 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 2 files / 8 matches
  - `generated`: 9 files / 174 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/alignment-politicians.server.ts](../packages/web/src/lib/alignment-politicians.server.ts) (4 matches)
  - [packages/web/src/app/governments/[code]/politicians/[bioguideId]/page.tsx](../packages/web/src/app/governments/[code]/politicians/[bioguideId]/page.tsx) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (4 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/PoliticianVote.ts](../packages/db/src/generated/prisma/models/PoliticianVote.ts) (136 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (24 matches)
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
  - `other`: 4 files / 11 matches
- Key files:
  - [packages/web/src/lib/aggregate-alignment.server.ts](../packages/web/src/lib/aggregate-alignment.server.ts) (4 matches)
  - [packages/db/src/types.ts](../packages/db/src/types.ts) (2 matches)
  - [packages/web/src/lib/wishocracy-alignment.ts](../packages/web/src/lib/wishocracy-alignment.ts) (2 matches)
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
  - [packages/web/src/app/api/prize-treasury/status/route.ts](../packages/web/src/app/api/prize-treasury/status/route.ts) (2 matches)
  - [packages/web/src/app/prize/page.tsx](../packages/web/src/app/prize/page.tsx) (2 matches)
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
- Direct Prisma usage: 21 files / 32 matches
- Usage counts by bucket:
  - `runtime-prisma`: 21 files / 32 matches
  - `api-routes`: 3 files / 10 matches
  - `pages`: 5 files / 8 matches
  - `components`: 4 files / 4 matches
  - `runtime-libraries`: 16 files / 39 matches
  - `scripts`: 3 files / 4 matches
  - `tests`: 7 files / 16 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 12 matches
  - `migrations`: 6 files / 22 matches
  - `generated`: 14 files / 297 matches
  - `zod`: 1 files / 1 matches
  - `other`: 5 files / 5 matches
- Key files:
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (14 matches)
  - [packages/web/src/app/api/referendums/[slug]/vote/route.ts](../packages/web/src/app/api/referendums/[slug]/vote/route.ts) (7 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (7 matches)
  - [packages/web/src/app/agencies/dcongress/referendums/[slug]/page.tsx](../packages/web/src/app/agencies/dcongress/referendums/[slug]/page.tsx) (6 matches)
  - [packages/web/src/app/api/referendums/route.ts](../packages/web/src/app/api/referendums/route.ts) (6 matches)
  - [packages/db/src/managed-data/managed-referendums.ts](../packages/db/src/managed-data/managed-referendums.ts) (5 matches)
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (4 matches)
  - [packages/web/src/lib/referendum-site.server.ts](../packages/web/src/lib/referendum-site.server.ts) (4 matches)
- Notes:
  - none

### ReferendumVote

- Schema: [packages/db/prisma/schema.prisma#L4787](../packages/db/prisma/schema.prisma#L4787)
- Classification: `runtime-live`
- Direct Prisma usage: 19 files / 45 matches
- Usage counts by bucket:
  - `runtime-prisma`: 19 files / 45 matches
  - `api-routes`: 1 files / 2 matches
  - `pages`: 4 files / 4 matches
  - `runtime-libraries`: 16 files / 42 matches
  - `scripts`: 2 files / 8 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 5 files / 29 matches
  - `generated`: 13 files / 246 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 4 matches
- Key files:
  - [packages/web/src/lib/verified-votes.server.ts](../packages/web/src/lib/verified-votes.server.ts) (16 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (13 matches)
  - [packages/web/src/lib/referendum-site.server.ts](../packages/web/src/lib/referendum-site.server.ts) (12 matches)
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (11 matches)
  - [packages/web/src/lib/email/monthly-chain-digest.server.ts](../packages/web/src/lib/email/monthly-chain-digest.server.ts) (6 matches)
  - [packages/web/src/app/api/referendums/[slug]/vote/route.ts](../packages/web/src/app/api/referendums/[slug]/vote/route.ts) (4 matches)
  - [packages/web/src/lib/daily-activity-digest.server.ts](../packages/web/src/lib/daily-activity-digest.server.ts) (4 matches)
  - [packages/web/src/lib/humanity-v-government-case.server.ts](../packages/web/src/lib/humanity-v-government-case.server.ts) (4 matches)
- Notes:
  - Internal platform vote tied to a real Referendum row, referral attribution, and VOTE token / reward flows.

### Referral

- Schema: [packages/db/prisma/schema.prisma#L3995](../packages/db/prisma/schema.prisma#L3995)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 7 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 7 matches
  - `api-routes`: 4 files / 7 matches
  - `pages`: 1 files / 1 matches
  - `components`: 8 files / 12 matches
  - `runtime-libraries`: 11 files / 15 matches
  - `tests`: 4 files / 7 matches
  - `docs`: 7 files / 8 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 3 files / 10 matches
  - `generated`: 9 files / 196 matches
  - `zod`: 1 files / 1 matches
  - `other`: 5 files / 11 matches
- Key files:
  - [packages/web/src/lib/referral.server.ts](../packages/web/src/lib/referral.server.ts) (8 matches)
  - [packages/web/src/app/api/game-stats/route.ts](../packages/web/src/app/api/game-stats/route.ts) (2 matches)
  - [packages/web/src/lib/badges.server.ts](../packages/web/src/lib/badges.server.ts) (2 matches)
  - [packages/web/src/lib/daily-activity-digest.server.ts](../packages/web/src/lib/daily-activity-digest.server.ts) (2 matches)
  - [packages/web/src/app/api/referendums/[slug]/vote/route.ts](../packages/web/src/app/api/referendums/[slug]/vote/route.ts) (4 matches)
  - [packages/web/src/app/api/cron/point-mint/route.ts](../packages/web/src/app/api/cron/point-mint/route.ts) (1 matches)
  - [packages/web/src/app/api/personhood/world-id/verify/route.ts](../packages/web/src/app/api/personhood/world-id/verify/route.ts) (1 matches)
  - [packages/web/src/app/prize/page.tsx](../packages/web/src/app/prize/page.tsx) (1 matches)
- Notes:
  - none

### ReferralClick

- Schema: [packages/db/prisma/schema.prisma#L4034](../packages/db/prisma/schema.prisma#L4034)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 8 files / 179 matches
  - `other`: 1 files / 4 matches
- Key files:
  - [packages/web/src/lib/referral-redirect.server.ts](../packages/web/src/lib/referral-redirect.server.ts) (2 matches)
  - [packages/web/src/app/r/[code]/page.tsx](../packages/web/src/app/r/[code]/page.tsx) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260417_share_attempts_and_email_variants/migration.sql](../packages/db/prisma/migrations/20260417_share_attempts_and_email_variants/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/ReferralClick.ts](../packages/db/src/generated/prisma/models/ReferralClick.ts) (146 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### ReferralInvitation

- Schema: [packages/db/prisma/schema.prisma#L4076](../packages/db/prisma/schema.prisma#L4076)
- Classification: `runtime-live`
- Direct Prisma usage: 7 files / 27 matches
- Usage counts by bucket:
  - `runtime-prisma`: 7 files / 27 matches
  - `api-routes`: 1 files / 3 matches
  - `runtime-libraries`: 8 files / 25 matches
  - `scripts`: 2 files / 7 matches
  - `docs`: 5 files / 8 matches
  - `schema`: 1 files / 12 matches
  - `migrations`: 8 files / 32 matches
  - `generated`: 15 files / 325 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [packages/web/src/lib/referral-invitations.server.ts](../packages/web/src/lib/referral-invitations.server.ts) (23 matches)
  - [packages/web/src/lib/humanity-manager-status.server.ts](../packages/web/src/lib/humanity-manager-status.server.ts) (11 matches)
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (9 matches)
  - [packages/web/src/app/api/referral-invitations/route.ts](../packages/web/src/app/api/referral-invitations/route.ts) (6 matches)
  - [packages/web/src/lib/email/monthly-chain-digest.server.ts](../packages/web/src/lib/email/monthly-chain-digest.server.ts) (4 matches)
  - [packages/web/src/lib/person.server.ts](../packages/web/src/lib/person.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (1 matches)
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
  - `tests`: 3 files / 7 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 158 matches
  - `zod`: 1 files / 1 matches
  - `other`: 4 files / 7 matches
- Key files:
  - [packages/web/src/app/api/stripe/webhook/route.ts](../packages/web/src/app/api/stripe/webhook/route.ts) (7 matches)
  - [packages/web/src/components/treaty/TreatyNameSignatureBox.tsx](../packages/web/src/components/treaty/TreatyNameSignatureBox.tsx) (1 matches)
  - [packages/web/src/lib/shirt-fulfillment.server.ts](../packages/web/src/lib/shirt-fulfillment.server.ts) (6 matches)
  - [packages/web/src/lib/voice-session.ts](../packages/web/src/lib/voice-session.ts) (4 matches)
  - [packages/web/src/lib/task-funding/payments.server.ts](../packages/web/src/lib/task-funding/payments.server.ts) (3 matches)
  - [packages/data/src/datasets/wishonia-agencies.ts](../packages/data/src/datasets/wishonia-agencies.ts) (2 matches)
  - [packages/web/src/lib/referendum-vote-sync.ts](../packages/web/src/lib/referendum-vote-sync.ts) (2 matches)
  - [packages/web/src/lib/wishocracy-state-utils.ts](../packages/web/src/lib/wishocracy-state-utils.ts) (2 matches)
- Notes:
  - none

### ShareAttempt

- Schema: [packages/db/prisma/schema.prisma#L9581](../packages/db/prisma/schema.prisma#L9581)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 5 matches
  - `api-routes`: 1 files / 1 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 6 files / 6 matches
  - `docs`: 5 files / 11 matches
  - `schema`: 1 files / 14 matches
  - `migrations`: 6 files / 25 matches
  - `generated`: 16 files / 295 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [packages/web/src/app/api/share-attempts/route.ts](../packages/web/src/app/api/share-attempts/route.ts) (2 matches)
  - [packages/web/src/lib/referral-redirect.server.ts](../packages/web/src/lib/referral-redirect.server.ts) (2 matches)
  - [packages/web/src/lib/referral.server.ts](../packages/web/src/lib/referral.server.ts) (2 matches)
  - [packages/web/src/lib/share-attempts.server.ts](../packages/web/src/lib/share-attempts.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/web/src/app/r/[code]/page.tsx](../packages/web/src/app/r/[code]/page.tsx) (1 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (1 matches)
  - [packages/web/src/lib/share-channels.ts](../packages/web/src/lib/share-channels.ts) (1 matches)
- Notes:
  - none

### SocialAccount

- Schema: [packages/db/prisma/schema.prisma#L9457](../packages/db/prisma/schema.prisma#L9457)
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
  - `other`: 1 files / 3 matches
- Key files:
  - [packages/web/src/app/api/social-accounts/connect-wallet/route.ts](../packages/web/src/app/api/social-accounts/connect-wallet/route.ts) (2 matches)
  - [packages/web/src/app/api/social-accounts/disconnect/route.ts](../packages/web/src/app/api/social-accounts/disconnect/route.ts) (2 matches)
  - [packages/web/src/lib/referral-point-mint.server.ts](../packages/web/src/lib/referral-point-mint.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/SocialAccount.ts](../packages/db/src/generated/prisma/models/SocialAccount.ts) (146 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
- Notes:
  - none

### SourceArtifact

- Schema: [packages/db/prisma/schema.prisma#L7687](../packages/db/prisma/schema.prisma#L7687)
- Classification: `core`
- Direct Prisma usage: 13 files / 26 matches
- Usage counts by bucket:
  - `runtime-prisma`: 13 files / 26 matches
  - `runtime-libraries`: 12 files / 24 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 5 files / 8 matches
  - `schema`: 1 files / 21 matches
  - `migrations`: 7 files / 31 matches
  - `generated`: 23 files / 392 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [packages/web/src/lib/notion-import.server.ts](../packages/web/src/lib/notion-import.server.ts) (16 matches)
  - [packages/web/src/lib/parameters/parameter-catalog.server.ts](../packages/web/src/lib/parameters/parameter-catalog.server.ts) (6 matches)
  - [packages/web/scripts/extract-tasks-from-manual.ts](../packages/web/scripts/extract-tasks-from-manual.ts) (4 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (4 matches)
  - [packages/web/src/lib/source-artifact-visibility.server.ts](../packages/web/src/lib/source-artifact-visibility.server.ts) (4 matches)
  - [packages/web/src/lib/tasks/private-work-portability.server.ts](../packages/web/src/lib/tasks/private-work-portability.server.ts) (4 matches)
  - [packages/web/src/lib/form-responses.server.ts](../packages/web/src/lib/form-responses.server.ts) (2 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (2 matches)
- Notes:
  - none

### StripeConnectedAccount

- Schema: [packages/db/prisma/schema.prisma#L7376](../packages/db/prisma/schema.prisma#L7376)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 12 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 12 matches
  - `runtime-libraries`: 2 files / 14 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 10 files / 256 matches
- Key files:
  - [packages/web/src/lib/stripe-connect.server.ts](../packages/web/src/lib/stripe-connect.server.ts) (18 matches)
  - [packages/web/src/lib/task-payouts.server.ts](../packages/web/src/lib/task-payouts.server.ts) (8 matches)
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
- Direct Prisma usage: 3 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 6 matches
  - `pages`: 2 files / 5 matches
  - `runtime-libraries`: 21 files / 27 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 5 files / 10 matches
  - `docs`: 2 files / 9 matches
  - `schema`: 1 files / 31 matches
  - `migrations`: 4 files / 32 matches
  - `generated`: 20 files / 358 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 3 matches
- Key files:
  - [packages/web/src/lib/subject.server.ts](../packages/web/src/lib/subject.server.ts) (6 matches)
  - [packages/web/src/lib/form-responses.server.ts](../packages/web/src/lib/form-responses.server.ts) (4 matches)
  - [packages/web/src/lib/court-data.server.ts](../packages/web/src/lib/court-data.server.ts) (2 matches)
  - [packages/web/src/app/admin/communications/page.tsx](../packages/web/src/app/admin/communications/page.tsx) (3 matches)
  - [packages/web/src/app/organizations/[id]/page.tsx](../packages/web/src/app/organizations/[id]/page.tsx) (2 matches)
  - [packages/data/src/datasets/medical-data/treatments/hemophilia.json](../packages/data/src/datasets/medical-data/treatments/hemophilia.json) (2 matches)
  - [packages/web/src/lib/email/preview-envelope.ts](../packages/web/src/lib/email/preview-envelope.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-comment-notification.email.md](../packages/web/src/lib/tasks/task-comment-notification.email.md) (2 matches)
- Notes:
  - none

### Task

- Schema: [packages/db/prisma/schema.prisma#L5842](../packages/db/prisma/schema.prisma#L5842)
- Classification: `core`
- Direct Prisma usage: 59 files / 180 matches
- Usage counts by bucket:
  - `runtime-prisma`: 59 files / 180 matches
  - `api-routes`: 14 files / 39 matches
  - `pages`: 6 files / 19 matches
  - `components`: 12 files / 16 matches
  - `runtime-libraries`: 76 files / 368 matches
  - `scripts`: 12 files / 24 matches
  - `tests`: 29 files / 76 matches
  - `docs`: 20 files / 111 matches
  - `schema`: 1 files / 64 matches
  - `migrations`: 25 files / 132 matches
  - `generated`: 36 files / 880 matches
  - `zod`: 1 files / 1 matches
  - `other`: 13 files / 39 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (123 matches)
  - [packages/web/src/lib/tasks.server.ts](../packages/web/src/lib/tasks.server.ts) (59 matches)
  - [packages/web/src/lib/tasks/execution-lifecycle.server.ts](../packages/web/src/lib/tasks/execution-lifecycle.server.ts) (28 matches)
  - [packages/web/src/lib/notion-import.server.ts](../packages/web/src/lib/notion-import.server.ts) (27 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (19 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (18 matches)
  - [packages/web/src/lib/tasks/private-task-bundle.server.ts](../packages/web/src/lib/tasks/private-task-bundle.server.ts) (16 matches)
  - [packages/web/src/lib/triggers/fire-handlers.ts](../packages/web/src/lib/triggers/fire-handlers.ts) (16 matches)
- Notes:
  - none

### TaskApplication

- Schema: [packages/db/prisma/schema.prisma#L7465](../packages/db/prisma/schema.prisma#L7465)
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
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (8 matches)
  - [packages/web/src/lib/task-applications.server.ts](../packages/web/src/lib/task-applications.server.ts) (8 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (7 matches)
  - [packages/web/src/app/api/tasks/[id]/applications/[applicationId]/route.ts](../packages/web/src/app/api/tasks/[id]/applications/[applicationId]/route.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (11 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (22 matches)
  - [packages/db/src/generated/prisma/models/TaskApplication.ts](../packages/db/src/generated/prisma/models/TaskApplication.ts) (304 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (39 matches)
- Notes:
  - none

### TaskApplicationEvent

- Schema: [packages/db/prisma/schema.prisma#L7573](../packages/db/prisma/schema.prisma#L7573)
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
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (4 matches)
  - [packages/web/src/lib/task-applications.server.ts](../packages/web/src/lib/task-applications.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/TaskApplicationEvent.ts](../packages/db/src/generated/prisma/models/TaskApplicationEvent.ts) (176 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### TaskCandidateMatch

- Schema: [packages/db/prisma/schema.prisma#L6626](../packages/db/prisma/schema.prisma#L6626)
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
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (6 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (6 matches)
  - [packages/web/src/lib/tasks/personal-planning.server.ts](../packages/web/src/lib/tasks/personal-planning.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (8 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (17 matches)
  - [packages/db/src/generated/prisma/models/TaskCandidateMatch.ts](../packages/db/src/generated/prisma/models/TaskCandidateMatch.ts) (247 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (33 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### TaskClaim

- Schema: [packages/db/prisma/schema.prisma#L7626](../packages/db/prisma/schema.prisma#L7626)
- Classification: `core`
- Direct Prisma usage: 3 files / 13 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 13 matches
  - `runtime-libraries`: 5 files / 18 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 4 files / 14 matches
  - `generated`: 12 files / 241 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [packages/web/src/lib/tasks.server.ts](../packages/web/src/lib/tasks.server.ts) (18 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (7 matches)
  - [packages/web/src/lib/task-payouts.server.ts](../packages/web/src/lib/task-payouts.server.ts) (2 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (3 matches)
  - [packages/web/src/lib/tasks/agent-lease.server.ts](../packages/web/src/lib/tasks/agent-lease.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (9 matches)
- Notes:
  - none

### TaskComment

- Schema: [packages/db/prisma/schema.prisma#L7888](../packages/db/prisma/schema.prisma#L7888)
- Classification: `runtime-live`
- Direct Prisma usage: 10 files / 34 matches
- Usage counts by bucket:
  - `runtime-prisma`: 10 files / 34 matches
  - `runtime-libraries`: 12 files / 43 matches
  - `scripts`: 2 files / 3 matches
  - `docs`: 7 files / 15 matches
  - `schema`: 1 files / 21 matches
  - `migrations`: 6 files / 38 matches
  - `generated`: 17 files / 411 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [packages/web/src/lib/tasks/task-comments.server.ts](../packages/web/src/lib/tasks/task-comments.server.ts) (28 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (11 matches)
  - [packages/web/src/lib/tasks/user-treaty-task-progress.server.ts](../packages/web/src/lib/tasks/user-treaty-task-progress.server.ts) (10 matches)
  - [packages/web/src/lib/referral-invitations.server.ts](../packages/web/src/lib/referral-invitations.server.ts) (6 matches)
  - [packages/web/src/lib/triggers/fire-handlers.ts](../packages/web/src/lib/triggers/fire-handlers.ts) (5 matches)
  - [packages/web/src/lib/email/inbound-reply.ts](../packages/web/src/lib/email/inbound-reply.ts) (4 matches)
  - [packages/web/src/lib/tasks/task-comment-notifications.server.ts](../packages/web/src/lib/tasks/task-comment-notifications.server.ts) (3 matches)
  - [packages/web/src/lib/tasks/task-notifications.server.ts](../packages/web/src/lib/tasks/task-notifications.server.ts) (3 matches)
- Notes:
  - none

### TaskCommentAttachment

- Schema: [packages/db/prisma/schema.prisma#L8009](../packages/db/prisma/schema.prisma#L8009)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 18 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 18 matches
  - `runtime-libraries`: 4 files / 18 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 11 files / 231 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/tasks/task-comment-attachments.server.ts](../packages/web/src/lib/tasks/task-comment-attachments.server.ts) (18 matches)
  - [packages/web/src/lib/tasks/task-comments.server.ts](../packages/web/src/lib/tasks/task-comments.server.ts) (14 matches)
  - [packages/web/src/lib/tasks/execution-lifecycle.server.ts](../packages/web/src/lib/tasks/execution-lifecycle.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260713160000_add_private_task_comment_attachments/migration.sql](../packages/db/prisma/migrations/20260713160000_add_private_task_comment_attachments/migration.sql) (9 matches)
  - [packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql](../packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/TaskCommentAttachment.ts](../packages/db/src/generated/prisma/models/TaskCommentAttachment.ts) (186 matches)
- Notes:
  - none

### TaskCommentVote

- Schema: [packages/db/prisma/schema.prisma#L8058](../packages/db/prisma/schema.prisma#L8058)
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
  - [packages/web/src/lib/tasks/task-comments.server.ts](../packages/web/src/lib/tasks/task-comments.server.ts) (18 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L8668](../packages/db/prisma/schema.prisma#L8668)
- Classification: `runtime-live`
- Direct Prisma usage: 10 files / 35 matches
- Usage counts by bucket:
  - `runtime-prisma`: 10 files / 35 matches
  - `runtime-libraries`: 14 files / 46 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 5 files / 21 matches
  - `schema`: 1 files / 20 matches
  - `migrations`: 4 files / 48 matches
  - `generated`: 21 files / 487 matches
  - `other`: 1 files / 8 matches
- Key files:
  - [packages/web/src/lib/tasks/task-notifications.server.ts](../packages/web/src/lib/tasks/task-notifications.server.ts) (29 matches)
  - [packages/web/src/lib/triggers/fire-handlers.ts](../packages/web/src/lib/triggers/fire-handlers.ts) (11 matches)
  - [packages/web/src/lib/email/inbound-reply.ts](../packages/web/src/lib/email/inbound-reply.ts) (10 matches)
  - [packages/web/src/lib/communications-audit.server.ts](../packages/web/src/lib/communications-audit.server.ts) (7 matches)
  - [packages/web/src/lib/tasks/task-communications.server.ts](../packages/web/src/lib/tasks/task-communications.server.ts) (6 matches)
  - [packages/web/src/lib/admin-communications.server.ts](../packages/web/src/lib/admin-communications.server.ts) (4 matches)
  - [packages/web/src/lib/tasks/task-recipient-rate-limit.server.ts](../packages/web/src/lib/tasks/task-recipient-rate-limit.server.ts) (4 matches)
  - [packages/web/scripts/soft-delete-funding-tasks.ts](../packages/web/scripts/soft-delete-funding-tasks.ts) (2 matches)
- Notes:
  - none

### TaskCommunicationEndpoint

- Schema: [packages/db/prisma/schema.prisma#L8499](../packages/db/prisma/schema.prisma#L8499)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 8 matches
  - `runtime-libraries`: 3 files / 10 matches
  - `docs`: 4 files / 5 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 9 files / 209 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (8 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (6 matches)
  - [packages/web/src/lib/triggers/fire-handlers.ts](../packages/web/src/lib/triggers/fire-handlers.ts) (4 matches)
  - [docs/TASK_COMMUNICATION_MODEL.md](../docs/TASK_COMMUNICATION_MODEL.md) (2 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (1 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
- Notes:
  - none

### TaskCommunicationSpawnSpec

- Schema: [packages/db/prisma/schema.prisma#L9030](../packages/db/prisma/schema.prisma#L9030)
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
  - [packages/web/src/lib/triggers/admin.ts](../packages/web/src/lib/triggers/admin.ts) (4 matches)
  - [packages/web/src/lib/triggers/iteration-sources.ts](../packages/web/src/lib/triggers/iteration-sources.ts) (1 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260428130000_add_task_triggers/migration.sql](../packages/db/prisma/migrations/20260428130000_add_task_triggers/migration.sql) (4 matches)
  - [packages/db/prisma/migrations/20260429180000_add_trigger_schedule_sendcount/migration.sql](../packages/db/prisma/migrations/20260429180000_add_trigger_schedule_sendcount/migration.sql) (3 matches)
- Notes:
  - none

### TaskCommunicationTemplate

- Schema: [packages/db/prisma/schema.prisma#L8558](../packages/db/prisma/schema.prisma#L8558)
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
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (6 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L8601](../packages/db/prisma/schema.prisma#L8601)
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

- Schema: [packages/db/prisma/schema.prisma#L7091](../packages/db/prisma/schema.prisma#L7091)
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
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L7037](../packages/db/prisma/schema.prisma#L7037)
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

- Schema: [packages/db/prisma/schema.prisma#L8123](../packages/db/prisma/schema.prisma#L8123)
- Classification: `core`
- Direct Prisma usage: 7 files / 32 matches
- Usage counts by bucket:
  - `runtime-prisma`: 7 files / 32 matches
  - `runtime-libraries`: 7 files / 32 matches
  - `docs`: 5 files / 7 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 12 matches
  - `generated`: 8 files / 208 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 3 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (26 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (16 matches)
  - [packages/web/src/lib/notion-import.server.ts](../packages/web/src/lib/notion-import.server.ts) (14 matches)
  - [packages/web/src/lib/form-responses.server.ts](../packages/web/src/lib/form-responses.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/personal-planning.server.ts](../packages/web/src/lib/tasks/personal-planning.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/private-task-bundle.server.ts](../packages/web/src/lib/tasks/private-task-bundle.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/private-work-portability.server.ts](../packages/web/src/lib/tasks/private-work-portability.server.ts) (2 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (2 matches)
- Notes:
  - none

### TaskExecutionArtifact

- Schema: [packages/db/prisma/schema.prisma#L6833](../packages/db/prisma/schema.prisma#L6833)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 4 files / 4 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 15 matches
  - `generated`: 13 files / 269 matches
  - `other`: 2 files / 8 matches
- Key files:
  - [packages/web/src/lib/tasks/execution-lifecycle.server.ts](../packages/web/src/lib/tasks/execution-lifecycle.server.ts) (4 matches)
  - [packages/web/scripts/verify-preview-masking.mjs](../packages/web/scripts/verify-preview-masking.mjs) (2 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [docs/plans/phased-approach-optimitron.md](../docs/plans/phased-approach-optimitron.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql](../packages/db/prisma/migrations/20260715180000_private_execution_system/migration.sql) (15 matches)
- Notes:
  - none

### TaskExecutionAttempt

- Schema: [packages/db/prisma/schema.prisma#L6708](../packages/db/prisma/schema.prisma#L6708)
- Classification: `runtime-live`
- Direct Prisma usage: 7 files / 12 matches
- Usage counts by bucket:
  - `runtime-prisma`: 7 files / 12 matches
  - `api-routes`: 1 files / 1 matches
  - `runtime-libraries`: 6 files / 11 matches
  - `docs`: 3 files / 4 matches
  - `schema`: 1 files / 15 matches
  - `migrations`: 3 files / 31 matches
  - `generated`: 19 files / 436 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/tasks/execution-lifecycle.server.ts](../packages/web/src/lib/tasks/execution-lifecycle.server.ts) (10 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (4 matches)
  - [packages/web/src/app/api/extension/tasks/[id]/done/route.ts](../packages/web/src/app/api/extension/tasks/[id]/done/route.ts) (2 matches)
  - [packages/web/src/lib/mcp-tools/private-execution.ts](../packages/web/src/lib/mcp-tools/private-execution.ts) (2 matches)
  - [packages/web/src/lib/tasks/external-action.server.ts](../packages/web/src/lib/tasks/external-action.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/personal-planning.server.ts](../packages/web/src/lib/tasks/personal-planning.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [docs/plans/phased-approach-optimitron.md](../docs/plans/phased-approach-optimitron.md) (2 matches)
- Notes:
  - none

### TaskFundingEvent

- Schema: [packages/db/prisma/schema.prisma#L7296](../packages/db/prisma/schema.prisma#L7296)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 2 files / 8 matches
  - `generated`: 10 files / 206 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/task-funding/pledges.server.ts](../packages/web/src/lib/task-funding/pledges.server.ts) (4 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (6 matches)
  - [packages/db/prisma/migrations/20260521184500_add_task_funding_event_deleted_at/migration.sql](../packages/db/prisma/migrations/20260521184500_add_task_funding_event_deleted_at/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/TaskFundingEvent.ts](../packages/db/src/generated/prisma/models/TaskFundingEvent.ts) (165 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### TaskFundingPayment

- Schema: [packages/db/prisma/schema.prisma#L7320](../packages/db/prisma/schema.prisma#L7320)
- Classification: `runtime-live`
- Direct Prisma usage: 6 files / 29 matches
- Usage counts by bucket:
  - `runtime-prisma`: 6 files / 29 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 5 files / 30 matches
  - `docs`: 1 files / 2 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 2 files / 19 matches
  - `generated`: 13 files / 311 matches
- Key files:
  - [packages/web/src/lib/task-funding/payments.server.ts](../packages/web/src/lib/task-funding/payments.server.ts) (24 matches)
  - [packages/web/src/lib/task-funding/escrow.server.ts](../packages/web/src/lib/task-funding/escrow.server.ts) (22 matches)
  - [packages/web/src/lib/task-funding/status.server.ts](../packages/web/src/lib/task-funding/status.server.ts) (8 matches)
  - [packages/web/src/app/admin/task-payouts/page.tsx](../packages/web/src/app/admin/task-payouts/page.tsx) (2 matches)
  - [packages/web/src/lib/task-payouts.server.ts](../packages/web/src/lib/task-payouts.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
- Notes:
  - none

### TaskFundingPledge

- Schema: [packages/db/prisma/schema.prisma#L7236](../packages/db/prisma/schema.prisma#L7236)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 25 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 25 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 4 files / 27 matches
  - `docs`: 1 files / 2 matches
  - `schema`: 1 files / 10 matches
  - `migrations`: 2 files / 18 matches
  - `generated`: 15 files / 401 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/task-funding/escrow.server.ts](../packages/web/src/lib/task-funding/escrow.server.ts) (30 matches)
  - [packages/web/src/lib/task-funding/pledges.server.ts](../packages/web/src/lib/task-funding/pledges.server.ts) (11 matches)
  - [packages/web/src/lib/task-funding/status.server.ts](../packages/web/src/lib/task-funding/status.server.ts) (8 matches)
  - [packages/web/src/app/admin/task-payouts/page.tsx](../packages/web/src/app/admin/task-payouts/page.tsx) (2 matches)
  - [packages/web/src/lib/task-funding/payments.server.ts](../packages/web/src/lib/task-funding/payments.server.ts) (2 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (10 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (15 matches)
- Notes:
  - none

### TaskFundingTarget

- Schema: [packages/db/prisma/schema.prisma#L7207](../packages/db/prisma/schema.prisma#L7207)
- Classification: `runtime-live`
- Direct Prisma usage: 8 files / 20 matches
- Usage counts by bucket:
  - `runtime-prisma`: 8 files / 20 matches
  - `api-routes`: 1 files / 1 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 6 files / 20 matches
  - `tests`: 2 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 7 matches
  - `generated`: 9 files / 246 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/task-funding/escrow.server.ts](../packages/web/src/lib/task-funding/escrow.server.ts) (12 matches)
  - [packages/web/src/lib/task-funding/payments.server.ts](../packages/web/src/lib/task-funding/payments.server.ts) (8 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (7 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (5 matches)
  - [packages/web/src/lib/task-funding/pledges.server.ts](../packages/web/src/lib/task-funding/pledges.server.ts) (4 matches)
  - [packages/web/src/app/admin/task-payouts/page.tsx](../packages/web/src/app/admin/task-payouts/page.tsx) (2 matches)
  - [packages/web/src/app/api/tasks/[id]/pledge/route.ts](../packages/web/src/app/api/tasks/[id]/pledge/route.ts) (2 matches)
  - [packages/web/src/lib/task-funding/status.server.ts](../packages/web/src/lib/task-funding/status.server.ts) (2 matches)
- Notes:
  - none

### TaskImpactEstimateInput

- Schema: [packages/db/prisma/schema.prisma#L8253](../packages/db/prisma/schema.prisma#L8253)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 168 matches
- Key files:
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (4 matches)
  - [packages/web/src/lib/parameters/task-impact-calculation.server.ts](../packages/web/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql](../packages/db/prisma/migrations/20260713010000_add_normalized_parameters_and_task_impacts/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/TaskImpactEstimateInput.ts](../packages/db/src/generated/prisma/models/TaskImpactEstimateInput.ts) (131 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### TaskImpactEstimateSet

- Schema: [packages/db/prisma/schema.prisma#L8183](../packages/db/prisma/schema.prisma#L8183)
- Classification: `core`
- Direct Prisma usage: 5 files / 17 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 17 matches
  - `runtime-libraries`: 5 files / 17 matches
  - `docs`: 4 files / 4 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 3 files / 15 matches
  - `generated`: 8 files / 248 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (10 matches)
  - [packages/web/src/lib/parameters/task-impact-calculation.server.ts](../packages/web/src/lib/parameters/task-impact-calculation.server.ts) (8 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (8 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (4 matches)
  - [packages/web/src/lib/tasks/per-verified-voter-impact.server.ts](../packages/web/src/lib/tasks/per-verified-voter-impact.server.ts) (4 matches)
  - [docs/archive/shirt-distribution-thesis-2026-05-20.md](../docs/archive/shirt-distribution-thesis-2026-05-20.md) (1 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### TaskImpactFrameEstimate

- Schema: [packages/db/prisma/schema.prisma#L8273](../packages/db/prisma/schema.prisma#L8273)
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
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/web/src/lib/parameters/task-impact-calculation.server.ts](../packages/web/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/per-verified-voter-impact.server.ts](../packages/web/src/lib/tasks/per-verified-voter-impact.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/wishonia-task-reply.server.ts](../packages/web/src/lib/tasks/wishonia-task-reply.server.ts) (2 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [docs/ROADMAP.md](../docs/ROADMAP.md) (1 matches)
- Notes:
  - none

### TaskImpactMetric

- Schema: [packages/db/prisma/schema.prisma#L8407](../packages/db/prisma/schema.prisma#L8407)
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
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (4 matches)
  - [packages/web/src/lib/tasks/per-verified-voter-impact.server.ts](../packages/web/src/lib/tasks/per-verified-voter-impact.server.ts) (4 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/web/src/lib/parameters/task-impact-calculation.server.ts](../packages/web/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (6 matches)
- Notes:
  - none

### TaskImpactSourceArtifact

- Schema: [packages/db/prisma/schema.prisma#L8460](../packages/db/prisma/schema.prisma#L8460)
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
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (6 matches)
  - [packages/web/src/lib/parameters/task-impact-calculation.server.ts](../packages/web/src/lib/parameters/task-impact-calculation.server.ts) (2 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/TaskImpactSourceArtifact.ts](../packages/db/src/generated/prisma/models/TaskImpactSourceArtifact.ts) (121 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### TaskManager

- Schema: [packages/db/prisma/schema.prisma#L6122](../packages/db/prisma/schema.prisma#L6122)
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
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (6 matches)
  - [packages/web/src/lib/task-applications.server.ts](../packages/web/src/lib/task-applications.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/TaskManager.ts](../packages/db/src/generated/prisma/models/TaskManager.ts) (146 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### TaskMarketplaceListing

- Schema: [packages/db/prisma/schema.prisma#L6963](../packages/db/prisma/schema.prisma#L6963)
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
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (2 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L7416](../packages/db/prisma/schema.prisma#L7416)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 19 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 19 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 2 files / 19 matches
  - `docs`: 1 files / 3 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 16 matches
  - `generated`: 12 files / 307 matches
- Key files:
  - [packages/web/src/lib/task-payouts.server.ts](../packages/web/src/lib/task-payouts.server.ts) (32 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (5 matches)
  - [packages/web/src/app/admin/task-payouts/page.tsx](../packages/web/src/app/admin/task-payouts/page.tsx) (2 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (3 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260701120000_add_task_funding_payments_and_payouts/migration.sql](../packages/db/prisma/migrations/20260701120000_add_task_funding_payments_and_payouts/migration.sql) (16 matches)
  - [packages/db/src/generated/prisma/models/TaskPayout.ts](../packages/db/src/generated/prisma/models/TaskPayout.ts) (254 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (31 matches)
- Notes:
  - none

### TaskSourceArtifact

- Schema: [packages/db/prisma/schema.prisma#L8093](../packages/db/prisma/schema.prisma#L8093)
- Classification: `core`
- Direct Prisma usage: 8 files / 15 matches
- Usage counts by bucket:
  - `runtime-prisma`: 8 files / 15 matches
  - `runtime-libraries`: 7 files / 13 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 4 files / 5 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 9 files / 158 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (6 matches)
  - [packages/web/src/lib/tasks/task-merge.server.ts](../packages/web/src/lib/tasks/task-merge.server.ts) (6 matches)
  - [packages/web/scripts/extract-tasks-from-manual.ts](../packages/web/scripts/extract-tasks-from-manual.ts) (4 matches)
  - [packages/web/src/lib/notion-import.server.ts](../packages/web/src/lib/notion-import.server.ts) (4 matches)
  - [packages/web/src/lib/tasks/private-task-bundle.server.ts](../packages/web/src/lib/tasks/private-task-bundle.server.ts) (4 matches)
  - [packages/web/src/lib/form-responses.server.ts](../packages/web/src/lib/form-responses.server.ts) (2 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (2 matches)
  - [packages/web/src/lib/tasks/private-work-portability.server.ts](../packages/web/src/lib/tasks/private-work-portability.server.ts) (2 matches)
- Notes:
  - none

### TaskSpawnSpec

- Schema: [packages/db/prisma/schema.prisma#L8935](../packages/db/prisma/schema.prisma#L8935)
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
  - [packages/db/src/managed-data/managed-task-triggers.ts](../packages/db/src/managed-data/managed-task-triggers.ts) (4 matches)
  - [packages/web/src/lib/triggers/admin.ts](../packages/web/src/lib/triggers/admin.ts) (4 matches)
  - [packages/web/src/lib/triggers/completion-gate.ts](../packages/web/src/lib/triggers/completion-gate.ts) (1 matches)
  - [packages/web/src/lib/triggers/fire-types.ts](../packages/web/src/lib/triggers/fire-types.ts) (1 matches)
  - [packages/web/src/lib/triggers/fire.ts](../packages/web/src/lib/triggers/fire.ts) (1 matches)
  - [packages/web/src/lib/triggers/resolvers.ts](../packages/web/src/lib/triggers/resolvers.ts) (1 matches)
  - [packages/web/scripts/verify-preview-masking.mjs](../packages/web/scripts/verify-preview-masking.mjs) (2 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
- Notes:
  - none

### TaskTrigger

- Schema: [packages/db/prisma/schema.prisma#L8831](../packages/db/prisma/schema.prisma#L8831)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 11 matches
  - `api-routes`: 1 files / 3 matches
  - `runtime-libraries`: 13 files / 28 matches
  - `scripts`: 2 files / 4 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 7 files / 12 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 3 files / 14 matches
  - `generated`: 11 files / 265 matches
  - `other`: 2 files / 26 matches
- Key files:
  - [packages/web/src/lib/triggers/admin.ts](../packages/web/src/lib/triggers/admin.ts) (13 matches)
  - [packages/db/src/managed-data/managed-task-triggers.ts](../packages/db/src/managed-data/managed-task-triggers.ts) (8 matches)
  - [packages/web/src/app/api/cron/run-due-triggers/route.ts](../packages/web/src/app/api/cron/run-due-triggers/route.ts) (4 matches)
  - [packages/web/src/lib/mcp-tools/task-triggers.ts](../packages/web/src/lib/mcp-tools/task-triggers.ts) (6 matches)
  - [packages/web/src/lib/mcp-tools/task-templates.ts](../packages/web/src/lib/mcp-tools/task-templates.ts) (2 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (1 matches)
  - [packages/web/src/lib/post-signin-sync.server.ts](../packages/web/src/lib/post-signin-sync.server.ts) (1 matches)
  - [packages/web/src/lib/referral-invitation-tasks.server.ts](../packages/web/src/lib/referral-invitation-tasks.server.ts) (1 matches)
- Notes:
  - none

### TaskTriggerFire

- Schema: [packages/db/prisma/schema.prisma#L9107](../packages/db/prisma/schema.prisma#L9107)
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
  - [packages/web/src/lib/triggers/fire.ts](../packages/web/src/lib/triggers/fire.ts) (4 matches)
  - [packages/web/src/app/api/cron/run-due-triggers/route.ts](../packages/web/src/app/api/cron/run-due-triggers/route.ts) (2 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260428130000_add_task_triggers/migration.sql](../packages/db/prisma/migrations/20260428130000_add_task_triggers/migration.sql) (6 matches)
  - [packages/db/prisma/migrations/20260509230000_delete_generic_overdue_reminder_trigger/migration.sql](../packages/db/prisma/migrations/20260509230000_delete_generic_overdue_reminder_trigger/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/TaskTriggerFire.ts](../packages/db/src/generated/prisma/models/TaskTriggerFire.ts) (141 matches)
- Notes:
  - none

### TaskVerification

- Schema: [packages/db/prisma/schema.prisma#L6874](../packages/db/prisma/schema.prisma#L6874)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 5 matches
  - `runtime-libraries`: 2 files / 5 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 5 files / 6 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 12 matches
  - `generated`: 11 files / 247 matches
  - `other`: 2 files / 5 matches
- Key files:
  - [packages/web/src/lib/tasks/execution-lifecycle.server.ts](../packages/web/src/lib/tasks/execution-lifecycle.server.ts) (8 matches)
  - [packages/web/src/lib/mcp-tools/private-execution.ts](../packages/web/src/lib/mcp-tools/private-execution.ts) (2 matches)
  - [packages/web/scripts/verify-preview-masking.mjs](../packages/web/scripts/verify-preview-masking.mjs) (2 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (2 matches)
  - [docs/plans/phased-approach-optimitron.md](../docs/plans/phased-approach-optimitron.md) (1 matches)
  - [docs/PRD.md](../docs/PRD.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (1 matches)
- Notes:
  - none

### TrackingReminder

- Schema: [packages/db/prisma/schema.prisma#L3030](../packages/db/prisma/schema.prisma#L3030)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 5 matches
  - `runtime-libraries`: 1 files / 6 matches
  - `tests`: 1 files / 1 matches
  - `docs`: 7 files / 9 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 2 files / 9 matches
  - `generated`: 10 files / 223 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (11 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (3 matches)
  - [docs/archive/REFERENCES.md](../docs/archive/REFERENCES.md) (1 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (1 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
  - [docs/PRD.md](../docs/PRD.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### TrackingReminderNotification

- Schema: [packages/db/prisma/schema.prisma#L3098](../packages/db/prisma/schema.prisma#L3098)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 4 matches
  - `runtime-libraries`: 1 files / 4 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 3 files / 3 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 8 files / 184 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (8 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (2 matches)
  - [docs/archive/TODO-history-2026-07.md](../docs/archive/TODO-history-2026-07.md) (1 matches)
  - [docs/FEATURES.md](../docs/FEATURES.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (5 matches)
  - [packages/db/src/generated/prisma/models/TrackingReminderNotification.ts](../packages/db/src/generated/prisma/models/TrackingReminderNotification.ts) (147 matches)
- Notes:
  - none

### Unit

- Schema: [packages/db/prisma/schema.prisma#L2278](../packages/db/prisma/schema.prisma#L2278)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 7 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 7 matches
  - `api-routes`: 1 files / 2 matches
  - `components`: 2 files / 2 matches
  - `runtime-libraries`: 22 files / 34 matches
  - `tests`: 4 files / 6 matches
  - `docs`: 7 files / 8 matches
  - `schema`: 1 files / 24 matches
  - `migrations`: 2 files / 13 matches
  - `generated`: 17 files / 288 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 7 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (8 matches)
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (4 matches)
  - [packages/web/src/app/api/health-analysis/submit/route.ts](../packages/web/src/app/api/health-analysis/submit/route.ts) (3 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/web/src/components/site/EarthOptimizationServicesLandingPage.tsx](../packages/web/src/components/site/EarthOptimizationServicesLandingPage.tsx) (1 matches)
  - [packages/web/src/components/task-funding/TaskFundingProgress.tsx](../packages/web/src/components/task-funding/TaskFundingProgress.tsx) (1 matches)
  - [packages/data/src/measurement-validation.ts](../packages/data/src/measurement-validation.ts) (3 matches)
  - [packages/data/src/datasets/medical-data/treatments/covid-19.json](../packages/data/src/datasets/medical-data/treatments/covid-19.json) (2 matches)
- Notes:
  - none

### User

- Schema: [packages/db/prisma/schema.prisma#L1763](../packages/db/prisma/schema.prisma#L1763)
- Classification: `core`
- Direct Prisma usage: 82 files / 142 matches
- Usage counts by bucket:
  - `runtime-prisma`: 82 files / 142 matches
  - `api-routes`: 16 files / 22 matches
  - `pages`: 5 files / 7 matches
  - `components`: 5 files / 6 matches
  - `runtime-libraries`: 86 files / 194 matches
  - `scripts`: 5 files / 26 matches
  - `tests`: 22 files / 50 matches
  - `docs`: 12 files / 33 matches
  - `schema`: 1 files / 160 matches
  - `migrations`: 38 files / 217 matches
  - `generated`: 69 files / 1481 matches
  - `zod`: 1 files / 1 matches
  - `other`: 10 files / 62 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (30 matches)
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (20 matches)
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (12 matches)
  - [packages/web/src/lib/tasks.server.ts](../packages/web/src/lib/tasks.server.ts) (12 matches)
  - [packages/web/src/lib/auth-utils.ts](../packages/web/src/lib/auth-utils.ts) (9 matches)
  - [packages/web/src/lib/person.server.ts](../packages/web/src/lib/person.server.ts) (9 matches)
  - [packages/web/src/lib/profile-identity.server.ts](../packages/web/src/lib/profile-identity.server.ts) (9 matches)
  - [packages/web/src/lib/email/suppression.server.ts](../packages/web/src/lib/email/suppression.server.ts) (8 matches)
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
  - [packages/web/src/app/api/cron/push-notifications/route.ts](../packages/web/src/app/api/cron/push-notifications/route.ts) (4 matches)
  - [packages/web/src/app/api/push/preferences/route.ts](../packages/web/src/app/api/push/preferences/route.ts) (4 matches)
  - [packages/web/src/app/api/push/subscribe/route.ts](../packages/web/src/app/api/push/subscribe/route.ts) (2 matches)
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/UserPreference.ts](../packages/db/src/generated/prisma/models/UserPreference.ts) (134 matches)
- Notes:
  - Single-row push reminder schedule settings. The current name collides conceptually with NotificationPreference.

### VariableCategory

- Schema: [packages/db/prisma/schema.prisma#L2346](../packages/db/prisma/schema.prisma#L2346)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 7 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 7 matches
  - `api-routes`: 1 files / 2 matches
  - `runtime-libraries`: 6 files / 11 matches
  - `tests`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 9 files / 213 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 4 matches
- Key files:
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (6 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (4 matches)
  - [packages/web/src/app/api/health-analysis/submit/route.ts](../packages/web/src/app/api/health-analysis/submit/route.ts) (3 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (2 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (2 matches)
  - [packages/data/src/importers/standard-variable-names.ts](../packages/data/src/importers/standard-variable-names.ts) (2 matches)
  - [packages/data/src/variable-registry.ts](../packages/data/src/variable-registry.ts) (1 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
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
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (6 matches)
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
  - `tests`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 7 files / 144 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [packages/web/src/lib/auth-spam-guard.server.ts](../packages/web/src/lib/auth-spam-guard.server.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260311234000_nextauth_auth_tables/migration.sql](../packages/db/prisma/migrations/20260311234000_nextauth_auth_tables/migration.sql) (5 matches)
  - [packages/db/src/generated/prisma/models/VerificationToken.ts](../packages/db/src/generated/prisma/models/VerificationToken.ts) (115 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
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
  - [packages/web/src/lib/push-sender.server.ts](../packages/web/src/lib/push-sender.server.ts) (8 matches)
  - [packages/web/src/app/api/push/subscribe/route.ts](../packages/web/src/app/api/push/subscribe/route.ts) (2 matches)
  - [packages/web/src/app/api/push/unsubscribe/route.ts](../packages/web/src/app/api/push/unsubscribe/route.ts) (2 matches)
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
  - `tests`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 2 files / 14 matches
  - `generated`: 9 files / 177 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/app/api/wishocracy/allocations/route.ts](../packages/web/src/app/api/wishocracy/allocations/route.ts) (18 matches)
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (12 matches)
  - [packages/web/src/app/api/wishocracy/sync/route.ts](../packages/web/src/app/api/wishocracy/sync/route.ts) (6 matches)
  - [packages/web/src/lib/aggregate-alignment.server.ts](../packages/web/src/lib/aggregate-alignment.server.ts) (4 matches)
  - [packages/web/src/app/api/wishocracy/preferences/route.ts](../packages/web/src/app/api/wishocracy/preferences/route.ts) (2 matches)
  - [packages/web/src/lib/alignment-report.server.ts](../packages/web/src/lib/alignment-report.server.ts) (2 matches)
  - [packages/web/src/lib/badges.server.ts](../packages/web/src/lib/badges.server.ts) (2 matches)
  - [packages/web/src/lib/wishocracy-community.ts](../packages/web/src/lib/wishocracy-community.ts) (2 matches)
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
  - [packages/web/src/lib/wishocratic-treasury.server.ts](../packages/web/src/lib/wishocratic-treasury.server.ts) (4 matches)
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
  - [packages/web/src/app/api/wishocracy/allocations/route.ts](../packages/web/src/app/api/wishocracy/allocations/route.ts) (2 matches)
  - [packages/web/src/app/api/wishocracy/sync/route.ts](../packages/web/src/app/api/wishocracy/sync/route.ts) (2 matches)
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
  - `runtime-libraries`: 3 files / 4 matches
  - `scripts`: 2 files / 8 matches
  - `tests`: 1 files / 1 matches
  - `schema`: 1 files / 19 matches
  - `migrations`: 1 files / 1 matches
  - `generated`: 13 files / 254 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (7 matches)
  - [packages/web/scripts/probe-wishocratic-items.ts](../packages/web/scripts/probe-wishocratic-items.ts) (3 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/web/src/lib/wishocracy-catalog.server.ts](../packages/web/src/lib/wishocracy-catalog.server.ts) (2 matches)
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
  - [packages/web/src/lib/aggregate-alignment.server.ts](../packages/web/src/lib/aggregate-alignment.server.ts) (3 matches)
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
- Key files:
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (6 matches)
  - [packages/web/src/app/api/wishocracy/item-inclusions/route.ts](../packages/web/src/app/api/wishocracy/item-inclusions/route.ts) (6 matches)
  - [packages/web/src/app/api/wishocracy/sync/route.ts](../packages/web/src/app/api/wishocracy/sync/route.ts) (4 matches)
  - [packages/web/src/lib/alignment-report.server.ts](../packages/web/src/lib/alignment-report.server.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/WishocraticItemInclusion.ts](../packages/db/src/generated/prisma/models/WishocraticItemInclusion.ts) (126 matches)
- Notes:
  - none

### WishPoint

- Schema: [packages/db/prisma/schema.prisma#L9425](../packages/db/prisma/schema.prisma#L9425)
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
  - [packages/web/src/lib/wishes.server.ts](../packages/web/src/lib/wishes.server.ts) (11 matches)
  - [packages/web/src/lib/dashboard.server.ts](../packages/web/src/lib/dashboard.server.ts) (4 matches)
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
| ActivityType | [packages/db/prisma/schema.prisma#L309](../packages/db/prisma/schema.prisma#L309) | 27 | 128 |
| AgentExecutorStatus | [packages/db/prisma/schema.prisma#L571](../packages/db/prisma/schema.prisma#L571) | 13 | 104 |
| AnalysisStatus | [packages/db/prisma/schema.prisma#L100](../packages/db/prisma/schema.prisma#L100) | 10 | 197 |
| BadgeType | [packages/db/prisma/schema.prisma#L433](../packages/db/prisma/schema.prisma#L433) | 11 | 78 |
| CollectionFieldType | [packages/db/prisma/schema.prisma#L821](../packages/db/prisma/schema.prisma#L821) | 11 | 111 |
| CombinationOperation | [packages/db/prisma/schema.prisma#L54](../packages/db/prisma/schema.prisma#L54) | 21 | 371 |
| CommerceEntitlementStatus | [packages/db/prisma/schema.prisma#L10279](../packages/db/prisma/schema.prisma#L10279) | 8 | 78 |
| CommerceFulfillmentKind | [packages/db/prisma/schema.prisma#L10240](../packages/db/prisma/schema.prisma#L10240) | 17 | 194 |
| CommerceFulfillmentProvider | [packages/db/prisma/schema.prisma#L10252](../packages/db/prisma/schema.prisma#L10252) | 13 | 101 |
| CommerceFulfillmentStatus | [packages/db/prisma/schema.prisma#L10270](../packages/db/prisma/schema.prisma#L10270) | 10 | 72 |
| CommerceOfferKind | [packages/db/prisma/schema.prisma#L10225](../packages/db/prisma/schema.prisma#L10225) | 14 | 87 |
| CommerceOfferStatus | [packages/db/prisma/schema.prisma#L10234](../packages/db/prisma/schema.prisma#L10234) | 15 | 86 |
| CommerceOrderStatus | [packages/db/prisma/schema.prisma#L10259](../packages/db/prisma/schema.prisma#L10259) | 16 | 100 |
| CommercePaymentProvider | [packages/db/prisma/schema.prisma#L10247](../packages/db/prisma/schema.prisma#L10247) | 9 | 68 |
| ConfidenceLevel | [packages/db/prisma/schema.prisma#L121](../packages/db/prisma/schema.prisma#L121) | 10 | 101 |
| ContentAccessLevel | [packages/db/prisma/schema.prisma#L811](../packages/db/prisma/schema.prisma#L811) | 18 | 208 |
| ContentReportStatus | [packages/db/prisma/schema.prisma#L1075](../packages/db/prisma/schema.prisma#L1075) | 10 | 68 |
| ContentVisibility | [packages/db/prisma/schema.prisma#L804](../packages/db/prisma/schema.prisma#L804) | 22 | 274 |
| CourtCaseItemStatus | [packages/db/prisma/schema.prisma#L4710](../packages/db/prisma/schema.prisma#L4710) | 13 | 258 |
| CourtCasePartyCapacity | [packages/db/prisma/schema.prisma#L4701](../packages/db/prisma/schema.prisma#L4701) | 10 | 76 |
| CourtCasePartyRole | [packages/db/prisma/schema.prisma#L4691](../packages/db/prisma/schema.prisma#L4691) | 15 | 97 |
| CourtCaseStatus | [packages/db/prisma/schema.prisma#L4682](../packages/db/prisma/schema.prisma#L4682) | 12 | 116 |
| DatingBlockScope | [packages/db/prisma/schema.prisma#L9751](../packages/db/prisma/schema.prisma#L9751) | 10 | 82 |
| DatingConversationStatus | [packages/db/prisma/schema.prisma#L9729](../packages/db/prisma/schema.prisma#L9729) | 9 | 65 |
| DatingDatePlanStatus | [packages/db/prisma/schema.prisma#L9742](../packages/db/prisma/schema.prisma#L9742) | 8 | 84 |
| DatingInteractionKind | [packages/db/prisma/schema.prisma#L9710](../packages/db/prisma/schema.prisma#L9710) | 11 | 73 |
| DatingInteractionStatus | [packages/db/prisma/schema.prisma#L9717](../packages/db/prisma/schema.prisma#L9717) | 9 | 65 |
| DatingMatchStatus | [packages/db/prisma/schema.prisma#L9723](../packages/db/prisma/schema.prisma#L9723) | 9 | 77 |
| DatingMessageStatus | [packages/db/prisma/schema.prisma#L9735](../packages/db/prisma/schema.prisma#L9735) | 8 | 66 |
| DatingPreferenceImportance | [packages/db/prisma/schema.prisma#L9705](../packages/db/prisma/schema.prisma#L9705) | 8 | 56 |
| DatingProfilePhotoStatus | [packages/db/prisma/schema.prisma#L9679](../packages/db/prisma/schema.prisma#L9679) | 10 | 68 |
| DatingProfileStatus | [packages/db/prisma/schema.prisma#L9660](../packages/db/prisma/schema.prisma#L9660) | 11 | 134 |
| DatingQuestionAnswerVisibility | [packages/db/prisma/schema.prisma#L9692](../packages/db/prisma/schema.prisma#L9692) | 9 | 65 |
| DatingQuestionImportance | [packages/db/prisma/schema.prisma#L9697](../packages/db/prisma/schema.prisma#L9697) | 10 | 68 |
| DatingQuestionStatus | [packages/db/prisma/schema.prisma#L9686](../packages/db/prisma/schema.prisma#L9686) | 10 | 58 |
| DatingRelationshipIntent | [packages/db/prisma/schema.prisma#L9669](../packages/db/prisma/schema.prisma#L9669) | 11 | 134 |
| DatingSafetyReportStatus | [packages/db/prisma/schema.prisma#L9757](../packages/db/prisma/schema.prisma#L9757) | 8 | 80 |
| EfficacyLagEvidenceStatus | [packages/db/prisma/schema.prisma#L238](../packages/db/prisma/schema.prisma#L238) | 10 | 80 |
| EmailLogStatus | [packages/db/prisma/schema.prisma#L1132](../packages/db/prisma/schema.prisma#L1132) | 15 | 99 |
| EvidenceGrade | [packages/db/prisma/schema.prisma#L135](../packages/db/prisma/schema.prisma#L135) | 22 | 189 |
| ExternalActionRequestStatus | [packages/db/prisma/schema.prisma#L560](../packages/db/prisma/schema.prisma#L560) | 13 | 139 |
| FillingType | [packages/db/prisma/schema.prisma#L60](../packages/db/prisma/schema.prisma#L60) | 22 | 450 |
| FormFieldType | [packages/db/prisma/schema.prisma#L1100](../packages/db/prisma/schema.prisma#L1100) | 9 | 68 |
| FormPurpose | [packages/db/prisma/schema.prisma#L1083](../packages/db/prisma/schema.prisma#L1083) | 11 | 90 |
| FormStatus | [packages/db/prisma/schema.prisma#L1092](../packages/db/prisma/schema.prisma#L1092) | 11 | 90 |
| FormSubmissionStatus | [packages/db/prisma/schema.prisma#L1116](../packages/db/prisma/schema.prisma#L1116) | 11 | 108 |
| InterventionExperienceStatus | [packages/db/prisma/schema.prisma#L245](../packages/db/prisma/schema.prisma#L245) | 9 | 97 |
| InterventionOutcomeRating | [packages/db/prisma/schema.prisma#L254](../packages/db/prisma/schema.prisma#L254) | 9 | 83 |
| InterventionRankingRunStatus | [packages/db/prisma/schema.prisma#L303](../packages/db/prisma/schema.prisma#L303) | 9 | 69 |
| InterventionSideEffectSeverity | [packages/db/prisma/schema.prisma#L264](../packages/db/prisma/schema.prisma#L264) | 9 | 65 |
| JurisdictionType | [packages/db/prisma/schema.prisma#L153](../packages/db/prisma/schema.prisma#L153) | 16 | 172 |
| KnowledgeSensitivity | [packages/db/prisma/schema.prisma#L1124](../packages/db/prisma/schema.prisma#L1124) | 10 | 83 |
| McpScope | [packages/db/prisma/schema.prisma#L1052](../packages/db/prisma/schema.prisma#L1052) | 64 | 633 |
| McpToolCallStatus | [packages/db/prisma/schema.prisma#L1069](../packages/db/prisma/schema.prisma#L1069) | 9 | 75 |
| MeasurementScale | [packages/db/prisma/schema.prisma#L82](../packages/db/prisma/schema.prisma#L82) | 11 | 128 |
| ModelRevisionStatus | [packages/db/prisma/schema.prisma#L892](../packages/db/prisma/schema.prisma#L892) | 14 | 164 |
| NotificationChannel | [packages/db/prisma/schema.prisma#L372](../packages/db/prisma/schema.prisma#L372) | 8 | 57 |
| NotificationStatus | [packages/db/prisma/schema.prisma#L144](../packages/db/prisma/schema.prisma#L144) | 11 | 76 |
| NotificationType | [packages/db/prisma/schema.prisma#L359](../packages/db/prisma/schema.prisma#L359) | 10 | 87 |
| OrganizationMemberRole | [packages/db/prisma/schema.prisma#L658](../packages/db/prisma/schema.prisma#L658) | 27 | 134 |
| OrganizationNameKind | [packages/db/prisma/schema.prisma#L406](../packages/db/prisma/schema.prisma#L406) | 10 | 97 |
| OrganizationReferendumPositionStatus | [packages/db/prisma/schema.prisma#L416](../packages/db/prisma/schema.prisma#L416) | 20 | 123 |
| OrgStatus | [packages/db/prisma/schema.prisma#L399](../packages/db/prisma/schema.prisma#L399) | 42 | 265 |
| OrgType | [packages/db/prisma/schema.prisma#L380](../packages/db/prisma/schema.prisma#L380) | 43 | 257 |
| ParameterDistributionType | [packages/db/prisma/schema.prisma#L881](../packages/db/prisma/schema.prisma#L881) | 9 | 90 |
| ParameterSourceType | [packages/db/prisma/schema.prisma#L872](../packages/db/prisma/schema.prisma#L872) | 8 | 88 |
| PersonCivilianStatus | [packages/db/prisma/schema.prisma#L220](../packages/db/prisma/schema.prisma#L220) | 13 | 106 |
| PersonConditionStatus | [packages/db/prisma/schema.prisma#L201](../packages/db/prisma/schema.prisma#L201) | 18 | 106 |
| PersonDeathCauseCategory | [packages/db/prisma/schema.prisma#L209](../packages/db/prisma/schema.prisma#L209) | 18 | 149 |
| PersonhoodProvider | [packages/db/prisma/schema.prisma#L181](../packages/db/prisma/schema.prisma#L181) | 14 | 86 |
| PersonhoodVerificationStatus | [packages/db/prisma/schema.prisma#L187](../packages/db/prisma/schema.prisma#L187) | 16 | 86 |
| PersonLifeStatus | [packages/db/prisma/schema.prisma#L194](../packages/db/prisma/schema.prisma#L194) | 34 | 256 |
| PersonMemorialEvidenceKind | [packages/db/prisma/schema.prisma#L227](../packages/db/prisma/schema.prisma#L227) | 15 | 112 |
| PointMintStatus | [packages/db/prisma/schema.prisma#L5338](../packages/db/prisma/schema.prisma#L5338) | 9 | 65 |
| ReferendumKind | [packages/db/prisma/schema.prisma#L4671](../packages/db/prisma/schema.prisma#L4671) | 17 | 124 |
| ReferendumStatus | [packages/db/prisma/schema.prisma#L4663](../packages/db/prisma/schema.prisma#L4663) | 22 | 137 |
| ReferendumVoteSource | [packages/db/prisma/schema.prisma#L4498](../packages/db/prisma/schema.prisma#L4498) | 16 | 121 |
| ReferralAnswer | [packages/db/prisma/schema.prisma#L175](../packages/db/prisma/schema.prisma#L175) | 10 | 63 |
| ReferralInvitationContactMethod | [packages/db/prisma/schema.prisma#L351](../packages/db/prisma/schema.prisma#L351) | 12 | 120 |
| ReferralInvitationMessageFormat | [packages/db/prisma/schema.prisma#L345](../packages/db/prisma/schema.prisma#L345) | 14 | 116 |
| ReferralInvitationStatus | [packages/db/prisma/schema.prisma#L335](../packages/db/prisma/schema.prisma#L335) | 15 | 122 |
| RelationshipDirection | [packages/db/prisma/schema.prisma#L128](../packages/db/prisma/schema.prisma#L128) | 10 | 101 |
| ShareSource | [packages/db/prisma/schema.prisma#L329](../packages/db/prisma/schema.prisma#L329) | 10 | 92 |
| SocialPlatform | [packages/db/prisma/schema.prisma#L423](../packages/db/prisma/schema.prisma#L423) | 11 | 68 |
| SourceArtifactType | [packages/db/prisma/schema.prisma#L854](../packages/db/prisma/schema.prisma#L854) | 27 | 207 |
| SourceSystem | [packages/db/prisma/schema.prisma#L842](../packages/db/prisma/schema.prisma#L842) | 26 | 230 |
| StrengthLevel | [packages/db/prisma/schema.prisma#L112](../packages/db/prisma/schema.prisma#L112) | 10 | 101 |
| StripeConnectedAccountStatus | [packages/db/prisma/schema.prisma#L774](../packages/db/prisma/schema.prisma#L774) | 10 | 80 |
| StripeTransferCapabilityStatus | [packages/db/prisma/schema.prisma#L783](../packages/db/prisma/schema.prisma#L783) | 10 | 83 |
| SubjectType | [packages/db/prisma/schema.prisma#L161](../packages/db/prisma/schema.prisma#L161) | 15 | 141 |
| TaskApplicationEventType | [packages/db/prisma/schema.prisma#L699](../packages/db/prisma/schema.prisma#L699) | 12 | 79 |
| TaskApplicationPolicy | [packages/db/prisma/schema.prisma#L678](../packages/db/prisma/schema.prisma#L678) | 10 | 234 |
| TaskApplicationStatus | [packages/db/prisma/schema.prisma#L685](../packages/db/prisma/schema.prisma#L685) | 15 | 247 |
| TaskCandidateKind | [packages/db/prisma/schema.prisma#L517](../packages/db/prisma/schema.prisma#L517) | 12 | 202 |
| TaskCandidateMatchStatus | [packages/db/prisma/schema.prisma#L526](../packages/db/prisma/schema.prisma#L526) | 11 | 111 |
| TaskCategory | [packages/db/prisma/schema.prisma#L459](../packages/db/prisma/schema.prisma#L459) | 41 | 380 |
| TaskClaimPolicy | [packages/db/prisma/schema.prisma#L640](../packages/db/prisma/schema.prisma#L640) | 52 | 426 |
| TaskClaimStatus | [packages/db/prisma/schema.prisma#L711](../packages/db/prisma/schema.prisma#L711) | 17 | 129 |
| TaskCommentKind | [packages/db/prisma/schema.prisma#L1026](../packages/db/prisma/schema.prisma#L1026) | 22 | 144 |
| TaskCommentSource | [packages/db/prisma/schema.prisma#L1041](../packages/db/prisma/schema.prisma#L1041) | 21 | 143 |
| TaskCommentVisibility | [packages/db/prisma/schema.prisma#L1035](../packages/db/prisma/schema.prisma#L1035) | 9 | 110 |
| TaskCommunicationAudience | [packages/db/prisma/schema.prisma#L927](../packages/db/prisma/schema.prisma#L927) | 14 | 176 |
| TaskCommunicationChannel | [packages/db/prisma/schema.prisma#L982](../packages/db/prisma/schema.prisma#L982) | 17 | 156 |
| TaskCommunicationDirection | [packages/db/prisma/schema.prisma#L976](../packages/db/prisma/schema.prisma#L976) | 11 | 136 |
| TaskCommunicationEndpointKind | [packages/db/prisma/schema.prisma#L1007](../packages/db/prisma/schema.prisma#L1007) | 13 | 88 |
| TaskCommunicationEndpointVerificationStatus | [packages/db/prisma/schema.prisma#L1018](../packages/db/prisma/schema.prisma#L1018) | 12 | 74 |
| TaskCommunicationFormat | [packages/db/prisma/schema.prisma#L969](../packages/db/prisma/schema.prisma#L969) | 10 | 164 |
| TaskCommunicationPurpose | [packages/db/prisma/schema.prisma#L939](../packages/db/prisma/schema.prisma#L939) | 14 | 182 |
| TaskCommunicationStatus | [packages/db/prisma/schema.prisma#L993](../packages/db/prisma/schema.prisma#L993) | 18 | 171 |
| TaskCompensationCadence | [packages/db/prisma/schema.prisma#L493](../packages/db/prisma/schema.prisma#L493) | 14 | 241 |
| TaskCompensationKind | [packages/db/prisma/schema.prisma#L483](../packages/db/prisma/schema.prisma#L483) | 14 | 247 |
| TaskDeadlinePolicy | [packages/db/prisma/schema.prisma#L666](../packages/db/prisma/schema.prisma#L666) | 13 | 249 |
| TaskDistributionAttemptStatus | [packages/db/prisma/schema.prisma#L629](../packages/db/prisma/schema.prisma#L629) | 8 | 92 |
| TaskDistributionChannel | [packages/db/prisma/schema.prisma#L601](../packages/db/prisma/schema.prisma#L601) | 9 | 122 |
| TaskDistributionOperation | [packages/db/prisma/schema.prisma#L614](../packages/db/prisma/schema.prisma#L614) | 8 | 92 |
| TaskDistributionTargetStatus | [packages/db/prisma/schema.prisma#L622](../packages/db/prisma/schema.prisma#L622) | 8 | 60 |
| TaskEdgeType | [packages/db/prisma/schema.prisma#L721](../packages/db/prisma/schema.prisma#L721) | 19 | 119 |
| TaskEngagementKind | [packages/db/prisma/schema.prisma#L474](../packages/db/prisma/schema.prisma#L474) | 11 | 233 |
| TaskExecutionAttemptStatus | [packages/db/prisma/schema.prisma#L534](../packages/db/prisma/schema.prisma#L534) | 17 | 167 |
| TaskExecutionMode | [packages/db/prisma/schema.prisma#L510](../packages/db/prisma/schema.prisma#L510) | 14 | 244 |
| TaskFundingEventType | [packages/db/prisma/schema.prisma#L756](../packages/db/prisma/schema.prisma#L756) | 10 | 77 |
| TaskFundingPaymentSource | [packages/db/prisma/schema.prisma#L751](../packages/db/prisma/schema.prisma#L751) | 10 | 93 |
| TaskFundingPaymentStatus | [packages/db/prisma/schema.prisma#L765](../packages/db/prisma/schema.prisma#L765) | 16 | 148 |
| TaskFundingPledgerKind | [packages/db/prisma/schema.prisma#L735](../packages/db/prisma/schema.prisma#L735) | 16 | 138 |
| TaskFundingPledgeStatus | [packages/db/prisma/schema.prisma#L740](../packages/db/prisma/schema.prisma#L740) | 21 | 168 |
| TaskFundingTargetStatus | [packages/db/prisma/schema.prisma#L728](../packages/db/prisma/schema.prisma#L728) | 26 | 140 |
| TaskImpactEstimateKind | [packages/db/prisma/schema.prisma#L900](../packages/db/prisma/schema.prisma#L900) | 15 | 91 |
| TaskImpactFrameKey | [packages/db/prisma/schema.prisma#L915](../packages/db/prisma/schema.prisma#L915) | 33 | 148 |
| TaskImpactPublicationStatus | [packages/db/prisma/schema.prisma#L907](../packages/db/prisma/schema.prisma#L907) | 16 | 97 |
| TaskMarketplaceFeePolicy | [packages/db/prisma/schema.prisma#L584](../packages/db/prisma/schema.prisma#L584) | 8 | 80 |
| TaskMarketplaceListingKind | [packages/db/prisma/schema.prisma#L578](../packages/db/prisma/schema.prisma#L578) | 8 | 80 |
| TaskMarketplaceListingStatus | [packages/db/prisma/schema.prisma#L591](../packages/db/prisma/schema.prisma#L591) | 8 | 80 |
| TaskPayoutStatus | [packages/db/prisma/schema.prisma#L792](../packages/db/prisma/schema.prisma#L792) | 10 | 133 |
| TaskRemotePolicy | [packages/db/prisma/schema.prisma#L502](../packages/db/prisma/schema.prisma#L502) | 11 | 235 |
| TaskStatus | [packages/db/prisma/schema.prisma#L650](../packages/db/prisma/schema.prisma#L650) | 81 | 601 |
| TaskVerificationMethod | [packages/db/prisma/schema.prisma#L544](../packages/db/prisma/schema.prisma#L544) | 11 | 83 |
| TaskVerificationResult | [packages/db/prisma/schema.prisma#L552](../packages/db/prisma/schema.prisma#L552) | 13 | 93 |
| UnitCodeSystem | [packages/db/prisma/schema.prisma#L94](../packages/db/prisma/schema.prisma#L94) | 9 | 82 |
| Valence | [packages/db/prisma/schema.prisma#L72](../packages/db/prisma/schema.prisma#L72) | 13 | 286 |
| VariableEvidenceMetricKind | [packages/db/prisma/schema.prisma#L275](../packages/db/prisma/schema.prisma#L275) | 10 | 92 |
| VariableRelationshipEvidenceSourceType | [packages/db/prisma/schema.prisma#L292](../packages/db/prisma/schema.prisma#L292) | 10 | 92 |
| VotePosition | [packages/db/prisma/schema.prisma#L4491](../packages/db/prisma/schema.prisma#L4491) | 36 | 258 |
| WishReason | [packages/db/prisma/schema.prisma#L444](../packages/db/prisma/schema.prisma#L444) | 10 | 71 |
