# Schema Usage Audit

- Schema: [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma)
- Models scanned: 164
- Enums scanned: 132
- Classification summary: core 13, runtime-live 127, tests-only 5, schema-only 0, generated-only 12, suspicious 7

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
| Account | `runtime-live` | 1 | 12 | 2 | 9 | 1 |
| Activity | `runtime-live` | 12 | 59 | 7 | 12 | 3 |
| AgentExecutor | `generated-only` | 0 | 0 | 0 | 11 | 0 |
| AgentTaskLease | `runtime-live` | 1 | 1 | 0 | 9 | 1 |
| AggregateVariableRelationship | `runtime-live` | 1 | 6 | 2 | 9 | 0 |
| AggregationRun | `runtime-live` | 3 | 3 | 1 | 11 | 0 |
| AlignmentScore | `runtime-live` | 2 | 3 | 2 | 11 | 1 |
| Badge | `runtime-live` | 1 | 11 | 0 | 9 | 1 |
| CitizenBillVote | `runtime-live` | 2 | 2 | 0 | 9 | 1 |
| CommerceEntitlement | `generated-only` | 0 | 0 | 0 | 12 | 0 |
| CommerceFulfillment | `runtime-live` | 2 | 2 | 0 | 9 | 0 |
| CommerceFulfillmentMapping | `runtime-live` | 1 | 1 | 0 | 8 | 0 |
| CommerceOffer | `runtime-live` | 4 | 4 | 0 | 10 | 0 |
| CommerceOfferVariant | `runtime-live` | 2 | 2 | 0 | 11 | 0 |
| CommerceOrder | `runtime-live` | 3 | 3 | 0 | 8 | 0 |
| CommerceOrderItem | `generated-only` | 0 | 0 | 0 | 12 | 0 |
| Conflict | `runtime-live` | 4 | 16 | 2 | 10 | 0 |
| ContentReport | `runtime-live` | 1 | 1 | 0 | 9 | 1 |
| CourtCase | `runtime-live` | 4 | 4 | 1 | 12 | 1 |
| CourtCaseClaim | `runtime-live` | 1 | 1 | 0 | 14 | 1 |
| CourtCaseEvidence | `runtime-live` | 1 | 1 | 0 | 15 | 1 |
| CourtCaseHarm | `runtime-live` | 1 | 1 | 0 | 14 | 1 |
| CourtCaseParty | `runtime-live` | 4 | 5 | 0 | 12 | 1 |
| CourtCaseRemedy | `runtime-live` | 1 | 1 | 0 | 13 | 1 |
| DatingBlock | `runtime-live` | 1 | 1 | 0 | 8 | 0 |
| DatingConversation | `runtime-live` | 1 | 1 | 0 | 9 | 0 |
| DatingDatePlan | `runtime-live` | 1 | 1 | 0 | 12 | 0 |
| DatingInteraction | `runtime-live` | 1 | 1 | 0 | 8 | 0 |
| DatingMatch | `runtime-live` | 1 | 1 | 0 | 10 | 1 |
| DatingMatchScore | `generated-only` | 0 | 0 | 0 | 8 | 0 |
| DatingMessage | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| DatingPreference | `generated-only` | 0 | 0 | 0 | 8 | 0 |
| DatingProfile | `runtime-live` | 1 | 1 | 0 | 10 | 1 |
| DatingProfilePhoto | `runtime-live` | 1 | 1 | 0 | 9 | 0 |
| DatingPrompt | `runtime-live` | 1 | 1 | 0 | 7 | 0 |
| DatingPromptAnswer | `generated-only` | 0 | 0 | 0 | 9 | 0 |
| DatingQuestion | `runtime-live` | 2 | 2 | 0 | 7 | 0 |
| DatingQuestionAnswer | `runtime-live` | 1 | 1 | 0 | 9 | 0 |
| DatingSafetyReport | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| EmailLog | `runtime-live` | 4 | 10 | 0 | 11 | 4 |
| GlobalVariable | `runtime-live` | 6 | 11 | 1 | 22 | 1 |
| GlobalVariableExternalCode | `runtime-live` | 2 | 2 | 1 | 10 | 0 |
| IntegrationConnection | `tests-only` | 0 | 0 | 1 | 12 | 1 |
| IntegrationProvider | `tests-only` | 0 | 0 | 1 | 11 | 0 |
| IntegrationSyncLog | `tests-only` | 0 | 0 | 1 | 9 | 1 |
| InterventionApprovalTimeline | `runtime-live` | 3 | 4 | 0 | 11 | 0 |
| InterventionExperience | `runtime-live` | 1 | 1 | 0 | 13 | 1 |
| InterventionExperienceOutcome | `runtime-live` | 1 | 1 | 0 | 12 | 1 |
| InterventionExperienceSideEffect | `runtime-live` | 1 | 1 | 0 | 10 | 1 |
| InterventionRankingRun | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| Jurisdiction | `runtime-live` | 7 | 23 | 5 | 28 | 0 |
| McpToolCallAudit | `runtime-live` | 1 | 1 | 0 | 11 | 1 |
| Measurement | `runtime-live` | 2 | 14 | 6 | 16 | 3 |
| NOf1Variable | `runtime-live` | 1 | 2 | 1 | 13 | 1 |
| NOf1VariableRelationship | `runtime-live` | 2 | 6 | 3 | 10 | 0 |
| Notification | `runtime-live` | 0 | 7 | 0 | 9 | 2 |
| NotificationPreference | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| OAuthAuthCode | `runtime-live` | 2 | 2 | 0 | 9 | 1 |
| OAuthClient | `runtime-live` | 3 | 3 | 0 | 8 | 1 |
| OAuthGrant | `runtime-live` | 3 | 3 | 0 | 10 | 1 |
| Organization | `core` | 22 | 46 | 6 | 23 | 4 |
| OrganizationMember | `core` | 5 | 6 | 0 | 10 | 0 |
| OrganizationReferendumPosition | `runtime-live` | 9 | 9 | 0 | 10 | 1 |
| Person | `core` | 29 | 62 | 15 | 24 | 5 |
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
| QuestionResponse | `suspicious` | 0 | 0 | 0 | 10 | 1 |
| RankedIntervention | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| ReasoningAssignmentRule | `runtime-live` | 3 | 3 | 0 | 8 | 1 |
| ReasoningBanditPolicyState | `runtime-live` | 2 | 2 | 0 | 7 | 0 |
| ReasoningBlacklistRule | `runtime-live` | 1 | 1 | 0 | 7 | 1 |
| ReasoningBundleVariant | `runtime-live` | 1 | 1 | 0 | 7 | 1 |
| ReasoningChainValueGuardSnapshot | `runtime-live` | 2 | 2 | 0 | 7 | 0 |
| ReasoningDistributionPolicyState | `runtime-live` | 2 | 2 | 0 | 7 | 1 |
| ReasoningDistributionSliceSnapshot | `suspicious` | 0 | 0 | 0 | 7 | 0 |
| ReasoningDistributionTarget | `runtime-live` | 4 | 4 | 0 | 7 | 1 |
| ReasoningDiversitySnapshot | `runtime-live` | 1 | 1 | 0 | 7 | 0 |
| ReasoningFraudFinding | `runtime-live` | 1 | 1 | 0 | 8 | 1 |
| ReasoningFraudPattern | `runtime-live` | 2 | 2 | 0 | 8 | 1 |
| ReasoningGenerationRequest | `runtime-live` | 1 | 1 | 0 | 8 | 1 |
| ReasoningHoldoutComparison | `runtime-live` | 2 | 2 | 0 | 7 | 0 |
| ReasoningLocaleConfig | `runtime-live` | 5 | 6 | 0 | 7 | 1 |
| ReasoningOrganizationDomain | `runtime-live` | 3 | 3 | 0 | 7 | 0 |
| ReasoningOrgFork | `runtime-live` | 2 | 2 | 0 | 8 | 0 |
| ReasoningOutcomeRecord | `runtime-live` | 8 | 8 | 0 | 7 | 1 |
| ReasoningPromotionDecision | `runtime-live` | 3 | 3 | 0 | 7 | 1 |
| ReasoningRGuardSnapshot | `runtime-live` | 4 | 4 | 0 | 7 | 1 |
| ReasoningShadowEvaluation | `runtime-live` | 1 | 1 | 0 | 8 | 1 |
| ReasoningSystemState | `runtime-live` | 7 | 7 | 0 | 7 | 1 |
| ReasoningTopologyVariant | `suspicious` | 0 | 0 | 0 | 7 | 1 |
| ReasoningVariantArm | `runtime-live` | 10 | 10 | 0 | 9 | 1 |
| ReasoningVariantExposure | `runtime-live` | 5 | 5 | 0 | 7 | 1 |
| ReasoningVariantSet | `runtime-live` | 4 | 4 | 0 | 7 | 1 |
| Referendum | `runtime-live` | 21 | 32 | 7 | 15 | 1 |
| ReferendumVote | `runtime-live` | 19 | 23 | 0 | 14 | 1 |
| Referral | `runtime-live` | 4 | 25 | 4 | 10 | 4 |
| ReferralClick | `runtime-live` | 1 | 2 | 0 | 8 | 1 |
| ReferralInvitation | `runtime-live` | 6 | 10 | 0 | 15 | 4 |
| Session | `runtime-live` | 0 | 10 | 2 | 9 | 1 |
| ShareAttempt | `runtime-live` | 4 | 7 | 0 | 16 | 4 |
| SocialAccount | `runtime-live` | 3 | 3 | 0 | 9 | 1 |
| SourceArtifact | `core` | 3 | 3 | 0 | 17 | 2 |
| Subject | `runtime-live` | 2 | 20 | 5 | 20 | 2 |
| Survey | `runtime-live` | 0 | 24 | 2 | 10 | 1 |
| SurveyQuestion | `generated-only` | 0 | 0 | 0 | 9 | 0 |
| SurveyResponse | `suspicious` | 0 | 0 | 0 | 11 | 0 |
| SurveySection | `generated-only` | 0 | 0 | 0 | 9 | 0 |
| Task | `core` | 41 | 87 | 16 | 32 | 13 |
| TaskApplication | `runtime-live` | 2 | 2 | 0 | 16 | 0 |
| TaskApplicationEvent | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| TaskCandidateMatch | `generated-only` | 0 | 0 | 0 | 15 | 0 |
| TaskClaim | `core` | 1 | 3 | 0 | 12 | 1 |
| TaskComment | `runtime-live` | 8 | 12 | 0 | 16 | 4 |
| TaskCommentVote | `runtime-live` | 1 | 1 | 0 | 9 | 1 |
| TaskCommunication | `runtime-live` | 8 | 11 | 0 | 21 | 4 |
| TaskCommunicationEndpoint | `runtime-live` | 2 | 2 | 0 | 9 | 3 |
| TaskCommunicationSpawnSpec | `runtime-live` | 2 | 3 | 0 | 8 | 2 |
| TaskCommunicationTemplate | `suspicious` | 0 | 0 | 0 | 10 | 1 |
| TaskCommunicationVariant | `suspicious` | 0 | 0 | 0 | 10 | 1 |
| TaskDistributionAttempt | `generated-only` | 0 | 0 | 0 | 14 | 0 |
| TaskDistributionTarget | `generated-only` | 0 | 0 | 0 | 10 | 0 |
| TaskEdge | `core` | 1 | 1 | 0 | 9 | 1 |
| TaskExecutionAttempt | `runtime-live` | 1 | 1 | 0 | 18 | 0 |
| TaskFundingEvent | `runtime-live` | 1 | 1 | 0 | 11 | 0 |
| TaskFundingPledge | `runtime-live` | 2 | 2 | 0 | 15 | 0 |
| TaskFundingTarget | `runtime-live` | 4 | 4 | 0 | 10 | 0 |
| TaskImpactEstimateSet | `core` | 4 | 4 | 0 | 9 | 3 |
| TaskImpactFrameEstimate | `core` | 5 | 5 | 0 | 9 | 2 |
| TaskImpactMetric | `core` | 4 | 4 | 0 | 9 | 2 |
| TaskImpactSourceArtifact | `core` | 1 | 1 | 0 | 10 | 1 |
| TaskManager | `runtime-live` | 1 | 1 | 0 | 10 | 0 |
| TaskMarketplaceListing | `generated-only` | 0 | 0 | 0 | 13 | 0 |
| TaskSourceArtifact | `core` | 2 | 2 | 0 | 10 | 1 |
| TaskSpawnSpec | `runtime-live` | 2 | 6 | 0 | 8 | 2 |
| TaskTrigger | `runtime-live` | 3 | 15 | 1 | 11 | 2 |
| TaskTriggerFire | `runtime-live` | 2 | 2 | 0 | 8 | 2 |
| TrackingReminder | `tests-only` | 0 | 0 | 1 | 11 | 2 |
| TrackingReminderNotification | `tests-only` | 0 | 0 | 1 | 9 | 1 |
| Unit | `runtime-live` | 3 | 26 | 3 | 18 | 1 |
| User | `core` | 64 | 93 | 21 | 54 | 6 |
| UserPreference | `runtime-live` | 4 | 4 | 0 | 9 | 1 |
| VariableCategory | `runtime-live` | 4 | 6 | 1 | 10 | 0 |
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

- Schema: [packages/db/prisma/schema.prisma#L1876](../packages/db/prisma/schema.prisma#L1876)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `api-routes`: 1 files / 1 matches
  - `pages`: 1 files / 1 matches
  - `components`: 2 files / 3 matches
  - `runtime-libraries`: 7 files / 8 matches
  - `scripts`: 1 files / 1 matches
  - `tests`: 2 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 209 matches
  - `zod`: 1 files / 1 matches
  - `other`: 36 files / 75 matches
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

- Schema: [packages/db/prisma/schema.prisma#L5275](../packages/db/prisma/schema.prisma#L5275)
- Classification: `runtime-live`
- Direct Prisma usage: 12 files / 14 matches
- Usage counts by bucket:
  - `runtime-prisma`: 12 files / 14 matches
  - `api-routes`: 6 files / 8 matches
  - `components`: 2 files / 3 matches
  - `runtime-libraries`: 51 files / 180 matches
  - `tests`: 7 files / 24 matches
  - `docs`: 3 files / 7 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 7 matches
  - `generated`: 11 files / 184 matches
  - `zod`: 1 files / 1 matches
  - `other`: 13 files / 36 matches
- Key files:
  - [packages/web/src/app/api/admin/organizations/[id]/route.ts](../packages/web/src/app/api/admin/organizations/[id]/route.ts) (4 matches)
  - [packages/web/src/lib/email/suppression.server.ts](../packages/web/src/lib/email/suppression.server.ts) (4 matches)
  - [packages/web/src/app/api/referendums/[slug]/vote/route.ts](../packages/web/src/app/api/referendums/[slug]/vote/route.ts) (3 matches)
  - [packages/web/src/lib/tasks/task-comments.server.ts](../packages/web/src/lib/tasks/task-comments.server.ts) (3 matches)
  - [packages/web/src/app/api/game-stats/route.ts](../packages/web/src/app/api/game-stats/route.ts) (2 matches)
  - [packages/web/src/app/api/social-accounts/connect-wallet/route.ts](../packages/web/src/app/api/social-accounts/connect-wallet/route.ts) (2 matches)
  - [packages/web/src/app/api/social-accounts/disconnect/route.ts](../packages/web/src/app/api/social-accounts/disconnect/route.ts) (2 matches)
  - [packages/web/src/app/api/stripe/webhook/route.ts](../packages/web/src/app/api/stripe/webhook/route.ts) (2 matches)
- Notes:
  - none

### AgentExecutor

- Schema: [packages/db/prisma/schema.prisma#L5860](../packages/db/prisma/schema.prisma#L5860)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 12 matches
  - `generated`: 10 files / 238 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (12 matches)
  - [packages/db/src/generated/prisma/models/AgentExecutor.ts](../packages/db/src/generated/prisma/models/AgentExecutor.ts) (197 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts](../packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### AgentTaskLease

- Schema: [packages/db/prisma/schema.prisma#L9363](../packages/db/prisma/schema.prisma#L9363)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 8 matches
  - `runtime-libraries`: 1 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 9 files / 174 matches
  - `other`: 2 files / 2 matches
- Key files:
  - [packages/web/src/lib/tasks/agent-lease.server.ts](../packages/web/src/lib/tasks/agent-lease.server.ts) (16 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (7 matches)
  - [packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql](../packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/AgentTaskLease.ts](../packages/db/src/generated/prisma/models/AgentTaskLease.ts) (137 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### AggregateVariableRelationship

- Schema: [packages/db/prisma/schema.prisma#L3114](../packages/db/prisma/schema.prisma#L3114)
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
  - `other`: 1 files / 1 matches
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

- Schema: [packages/db/prisma/schema.prisma#L4062](../packages/db/prisma/schema.prisma#L4062)
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

- Schema: [packages/db/prisma/schema.prisma#L4191](../packages/db/prisma/schema.prisma#L4191)
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

- Schema: [packages/db/prisma/schema.prisma#L8155](../packages/db/prisma/schema.prisma#L8155)
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
  - `other`: 5 files / 17 matches
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

- Schema: [packages/db/prisma/schema.prisma#L4280](../packages/db/prisma/schema.prisma#L4280)
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
  - `other`: 2 files / 9 matches
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

### CommerceEntitlement

- Schema: [packages/db/prisma/schema.prisma#L9320](../packages/db/prisma/schema.prisma#L9320)
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

- Schema: [packages/db/prisma/schema.prisma#L9277](../packages/db/prisma/schema.prisma#L9277)
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

- Schema: [packages/db/prisma/schema.prisma#L9140](../packages/db/prisma/schema.prisma#L9140)
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

- Schema: [packages/db/prisma/schema.prisma#L9045](../packages/db/prisma/schema.prisma#L9045)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 6 matches
  - `runtime-libraries`: 4 files / 6 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 8 matches
  - `generated`: 10 files / 241 matches
  - `other`: 6 files / 9 matches
- Key files:
  - [packages/db/src/managed-data/managed-commerce-catalog.ts](../packages/db/src/managed-data/managed-commerce-catalog.ts) (4 matches)
  - [packages/web/src/lib/commerce-catalog.server.ts](../packages/web/src/lib/commerce-catalog.server.ts) (4 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/web/src/lib/task-funding/conversion.server.ts](../packages/web/src/lib/task-funding/conversion.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (7 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/CommerceOffer.ts](../packages/db/src/generated/prisma/models/CommerceOffer.ts) (198 matches)
- Notes:
  - none

### CommerceOfferVariant

- Schema: [packages/db/prisma/schema.prisma#L9091](../packages/db/prisma/schema.prisma#L9091)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 11 files / 266 matches
  - `other`: 4 files / 6 matches
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

- Schema: [packages/db/prisma/schema.prisma#L9166](../packages/db/prisma/schema.prisma#L9166)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 12 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 12 matches
  - `api-routes`: 2 files / 8 matches
  - `runtime-libraries`: 1 files / 4 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 12 matches
  - `generated`: 8 files / 297 matches
  - `other`: 3 files / 3 matches
- Key files:
  - [packages/web/src/app/api/stripe/create-checkout/route.ts](../packages/web/src/app/api/stripe/create-checkout/route.ts) (12 matches)
  - [packages/web/src/lib/shirt-fulfillment.server.ts](../packages/web/src/lib/shirt-fulfillment.server.ts) (8 matches)
  - [packages/web/src/app/api/stripe/webhook/route.ts](../packages/web/src/app/api/stripe/webhook/route.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql](../packages/db/prisma/migrations/20260520030000_add_commerce_ledger/migration.sql) (12 matches)
  - [packages/db/src/generated/prisma/models/CommerceOrder.ts](../packages/db/src/generated/prisma/models/CommerceOrder.ts) (260 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### CommerceOrderItem

- Schema: [packages/db/prisma/schema.prisma#L9230](../packages/db/prisma/schema.prisma#L9230)
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

- Schema: [packages/db/prisma/schema.prisma#L1169](../packages/db/prisma/schema.prisma#L1169)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 5 matches
  - `api-routes`: 3 files / 4 matches
  - `pages`: 1 files / 1 matches
  - `components`: 2 files / 2 matches
  - `runtime-libraries`: 9 files / 49 matches
  - `scripts`: 1 files / 1 matches
  - `tests`: 2 files / 2 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 9 files / 200 matches
  - `zod`: 1 files / 1 matches
  - `other`: 3 files / 3 matches
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

### ContentReport

- Schema: [packages/db/prisma/schema.prisma#L9589](../packages/db/prisma/schema.prisma#L9589)
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
  - `other`: 2 files / 12 matches
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

- Schema: [packages/db/prisma/schema.prisma#L4631](../packages/db/prisma/schema.prisma#L4631)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 11 matches
  - `runtime-libraries`: 4 files / 11 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 12 matches
  - `migrations`: 2 files / 25 matches
  - `generated`: 11 files / 321 matches
  - `zod`: 1 files / 1 matches
  - `other`: 4 files / 13 matches
- Key files:
  - [packages/web/src/lib/court-data.server.ts](../packages/web/src/lib/court-data.server.ts) (12 matches)
  - [packages/db/src/managed-data/managed-humanity-v-government.ts](../packages/db/src/managed-data/managed-humanity-v-government.ts) (4 matches)
  - [packages/web/src/lib/humanity-v-government-case.server.ts](../packages/web/src/lib/humanity-v-government-case.server.ts) (4 matches)
  - [packages/web/src/lib/represented-people.server.ts](../packages/web/src/lib/represented-people.server.ts) (2 matches)
  - [packages/web/src/lib/__tests__/campaign-structured-data.test.ts](../packages/web/src/lib/__tests__/campaign-structured-data.test.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (12 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (22 matches)
- Notes:
  - none

### CourtCaseClaim

- Schema: [packages/db/prisma/schema.prisma#L4774](../packages/db/prisma/schema.prisma#L4774)
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
  - `other`: 2 files / 11 matches
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

- Schema: [packages/db/prisma/schema.prisma#L4930](../packages/db/prisma/schema.prisma#L4930)
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
  - `other`: 2 files / 17 matches
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

- Schema: [packages/db/prisma/schema.prisma#L4839](../packages/db/prisma/schema.prisma#L4839)
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
  - `other`: 2 files / 11 matches
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

- Schema: [packages/db/prisma/schema.prisma#L4703](../packages/db/prisma/schema.prisma#L4703)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 9 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 9 matches
  - `api-routes`: 1 files / 2 matches
  - `runtime-libraries`: 4 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 12 matches
  - `generated`: 11 files / 242 matches
  - `zod`: 1 files / 1 matches
  - `other`: 3 files / 13 matches
- Key files:
  - [packages/web/src/lib/represented-people.server.ts](../packages/web/src/lib/represented-people.server.ts) (8 matches)
  - [packages/web/src/app/api/people/[id]/route.ts](../packages/web/src/app/api/people/[id]/route.ts) (4 matches)
  - [packages/web/src/lib/humanity-v-government-case.server.ts](../packages/web/src/lib/humanity-v-government-case.server.ts) (4 matches)
  - [packages/web/src/lib/court-data.server.ts](../packages/web/src/lib/court-data.server.ts) (2 matches)
  - [packages/web/src/lib/people-dedup.server.ts](../packages/web/src/lib/people-dedup.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql](../packages/db/prisma/migrations/20260503090000_add_court_of_humanity_schema/migration.sql) (12 matches)
- Notes:
  - none

### CourtCaseRemedy

- Schema: [packages/db/prisma/schema.prisma#L5028](../packages/db/prisma/schema.prisma#L5028)
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
  - `other`: 2 files / 10 matches
- Key files:
  - [packages/web/src/lib/court-data.server.ts](../packages/web/src/lib/court-data.server.ts) (2 matches)
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

- Schema: [packages/db/prisma/schema.prisma#L8921](../packages/db/prisma/schema.prisma#L8921)
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

- Schema: [packages/db/prisma/schema.prisma#L8827](../packages/db/prisma/schema.prisma#L8827)
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

- Schema: [packages/db/prisma/schema.prisma#L8874](../packages/db/prisma/schema.prisma#L8874)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 1 files / 14 matches
  - `generated`: 12 files / 295 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (14 matches)
  - [packages/db/src/generated/prisma/models/DatingDatePlan.ts](../packages/db/src/generated/prisma/models/DatingDatePlan.ts) (242 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (31 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### DatingInteraction

- Schema: [packages/db/prisma/schema.prisma#L8775](../packages/db/prisma/schema.prisma#L8775)
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

- Schema: [packages/db/prisma/schema.prisma#L8799](../packages/db/prisma/schema.prisma#L8799)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 5 matches
  - `runtime-libraries`: 1 files / 5 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 10 files / 200 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (10 matches)
  - [docs/earth-optimization-date-2026-05-20.md](../docs/earth-optimization-date-2026-05-20.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (10 matches)
  - [packages/db/src/generated/prisma/models/DatingMatch.ts](../packages/db/src/generated/prisma/models/DatingMatch.ts) (153 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (28 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (4 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (3 matches)
- Notes:
  - none

### DatingMatchScore

- Schema: [packages/db/prisma/schema.prisma#L8742](../packages/db/prisma/schema.prisma#L8742)
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

- Schema: [packages/db/prisma/schema.prisma#L8846](../packages/db/prisma/schema.prisma#L8846)
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

- Schema: [packages/db/prisma/schema.prisma#L8719](../packages/db/prisma/schema.prisma#L8719)
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

- Schema: [packages/db/prisma/schema.prisma#L8523](../packages/db/prisma/schema.prisma#L8523)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 8 matches
  - `runtime-libraries`: 1 files / 8 matches
  - `docs`: 1 files / 2 matches
  - `schema`: 1 files / 19 matches
  - `migrations`: 1 files / 24 matches
  - `generated`: 10 files / 359 matches
  - `other`: 2 files / 2 matches
- Key files:
  - [packages/web/src/lib/dating.server.ts](../packages/web/src/lib/dating.server.ts) (16 matches)
  - [docs/earth-optimization-date-2026-05-20.md](../docs/earth-optimization-date-2026-05-20.md) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (19 matches)
  - [packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql](../packages/db/prisma/migrations/20260520043000_add_dating_foundation/migration.sql) (24 matches)
  - [packages/db/src/generated/prisma/models/DatingProfile.ts](../packages/db/src/generated/prisma/models/DatingProfile.ts) (288 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (55 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### DatingProfilePhoto

- Schema: [packages/db/prisma/schema.prisma#L8586](../packages/db/prisma/schema.prisma#L8586)
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

- Schema: [packages/db/prisma/schema.prisma#L8617](../packages/db/prisma/schema.prisma#L8617)
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

- Schema: [packages/db/prisma/schema.prisma#L8638](../packages/db/prisma/schema.prisma#L8638)
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

- Schema: [packages/db/prisma/schema.prisma#L8663](../packages/db/prisma/schema.prisma#L8663)
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

- Schema: [packages/db/prisma/schema.prisma#L8690](../packages/db/prisma/schema.prisma#L8690)
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

- Schema: [packages/db/prisma/schema.prisma#L8941](../packages/db/prisma/schema.prisma#L8941)
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

### EmailLog

- Schema: [packages/db/prisma/schema.prisma#L8258](../packages/db/prisma/schema.prisma#L8258)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 12 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 12 matches
  - `runtime-libraries`: 8 files / 21 matches
  - `scripts`: 2 files / 2 matches
  - `docs`: 4 files / 7 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 6 files / 22 matches
  - `generated`: 10 files / 246 matches
  - `zod`: 1 files / 1 matches
  - `other`: 5 files / 24 matches
- Key files:
  - [packages/web/src/lib/email/resend-webhook.ts](../packages/web/src/lib/email/resend-webhook.ts) (16 matches)
  - [packages/web/src/lib/admin-communications.server.ts](../packages/web/src/lib/admin-communications.server.ts) (4 matches)
  - [packages/web/src/lib/email/email-log.server.ts](../packages/web/src/lib/email/email-log.server.ts) (4 matches)
  - [packages/web/src/lib/tasks/task-notifications.server.ts](../packages/web/src/lib/tasks/task-notifications.server.ts) (2 matches)
  - [packages/web/src/lib/email/send-deduped-email.server.ts](../packages/web/src/lib/email/send-deduped-email.server.ts) (3 matches)
  - [packages/web/src/lib/email/suppression.server.ts](../packages/web/src/lib/email/suppression.server.ts) (2 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (1 matches)
  - [packages/web/src/lib/email/monthly-chain-digest.server.ts](../packages/web/src/lib/email/monthly-chain-digest.server.ts) (1 matches)
- Notes:
  - none

### GlobalVariable

- Schema: [packages/db/prisma/schema.prisma#L2181](../packages/db/prisma/schema.prisma#L2181)
- Classification: `runtime-live`
- Direct Prisma usage: 6 files / 12 matches
- Usage counts by bucket:
  - `runtime-prisma`: 6 files / 12 matches
  - `api-routes`: 2 files / 3 matches
  - `components`: 1 files / 1 matches
  - `runtime-libraries`: 8 files / 20 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 37 matches
  - `migrations`: 3 files / 29 matches
  - `generated`: 21 files / 544 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 3 matches
- Key files:
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (10 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (7 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (4 matches)
  - [packages/web/src/app/api/health-analysis/submit/route.ts](../packages/web/src/app/api/health-analysis/submit/route.ts) (3 matches)
  - [packages/web/src/app/api/conditions/search/route.ts](../packages/web/src/app/api/conditions/search/route.ts) (2 matches)
  - [packages/web/src/lib/global-variable-lookup.server.ts](../packages/web/src/lib/global-variable-lookup.server.ts) (2 matches)
  - [packages/web/src/components/medical/medical-pages.tsx](../packages/web/src/components/medical/medical-pages.tsx) (1 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (3 matches)
- Notes:
  - none

### GlobalVariableExternalCode

- Schema: [packages/db/prisma/schema.prisma#L2339](../packages/db/prisma/schema.prisma#L2339)
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

- Schema: [packages/db/prisma/schema.prisma#L3553](../packages/db/prisma/schema.prisma#L3553)
- Classification: `tests-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `tests`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 2 files / 9 matches
  - `generated`: 11 files / 226 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 11 matches
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

- Schema: [packages/db/prisma/schema.prisma#L3491](../packages/db/prisma/schema.prisma#L3491)
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

- Schema: [packages/db/prisma/schema.prisma#L3612](../packages/db/prisma/schema.prisma#L3612)
- Classification: `tests-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `tests`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 4 matches
  - `generated`: 8 files / 174 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 3 matches
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

- Schema: [packages/db/prisma/schema.prisma#L1444](../packages/db/prisma/schema.prisma#L1444)
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

- Schema: [packages/db/prisma/schema.prisma#L2648](../packages/db/prisma/schema.prisma#L2648)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 12 files / 285 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 7 matches
- Key files:
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (5 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (9 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/InterventionExperience.ts](../packages/db/src/generated/prisma/models/InterventionExperience.ts) (228 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (35 matches)
  - [packages/db/src/generated/prisma/models/GlobalVariable.ts](../packages/db/src/generated/prisma/models/GlobalVariable.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### InterventionExperienceOutcome

- Schema: [packages/db/prisma/schema.prisma#L2712](../packages/db/prisma/schema.prisma#L2712)
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

- Schema: [packages/db/prisma/schema.prisma#L2761](../packages/db/prisma/schema.prisma#L2761)
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

- Schema: [packages/db/prisma/schema.prisma#L3382](../packages/db/prisma/schema.prisma#L3382)
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

- Schema: [packages/db/prisma/schema.prisma#L3655](../packages/db/prisma/schema.prisma#L3655)
- Classification: `runtime-live`
- Direct Prisma usage: 7 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 7 files / 11 matches
  - `api-routes`: 1 files / 1 matches
  - `components`: 1 files / 1 matches
  - `runtime-libraries`: 19 files / 37 matches
  - `scripts`: 2 files / 2 matches
  - `tests`: 5 files / 8 matches
  - `schema`: 1 files / 31 matches
  - `migrations`: 6 files / 26 matches
  - `generated`: 27 files / 394 matches
  - `zod`: 1 files / 1 matches
  - `other`: 7 files / 23 matches
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

### McpToolCallAudit

- Schema: [packages/db/prisma/schema.prisma#L9524](../packages/db/prisma/schema.prisma#L9524)
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
  - `other`: 2 files / 13 matches
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

- Schema: [packages/db/prisma/schema.prisma#L2552](../packages/db/prisma/schema.prisma#L2552)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 8 matches
  - `runtime-libraries`: 13 files / 32 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 6 files / 24 matches
  - `docs`: 3 files / 7 matches
  - `schema`: 1 files / 18 matches
  - `migrations`: 3 files / 30 matches
  - `generated`: 15 files / 301 matches
  - `zod`: 1 files / 2 matches
  - `other`: 6 files / 30 matches
- Key files:
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (14 matches)
  - [packages/web/src/lib/census-aggregation.server.ts](../packages/web/src/lib/census-aggregation.server.ts) (2 matches)
  - [packages/data/src/importers/types.ts](../packages/data/src/importers/types.ts) (4 matches)
  - [packages/optimizer/src/temporal-alignment.ts](../packages/optimizer/src/temporal-alignment.ts) (4 matches)
  - [packages/optimizer/src/types.ts](../packages/optimizer/src/types.ts) (4 matches)
  - [packages/data/src/importers/standard-variable-names.ts](../packages/data/src/importers/standard-variable-names.ts) (3 matches)
  - [packages/data/src/pipelines/fetch-country-timeseries.ts](../packages/data/src/pipelines/fetch-country-timeseries.ts) (2 matches)
  - [packages/obg/src/country-analysis.ts](../packages/obg/src/country-analysis.ts) (2 matches)
- Notes:
  - none

### NOf1Variable

- Schema: [packages/db/prisma/schema.prisma#L2445](../packages/db/prisma/schema.prisma#L2445)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 3 matches
  - `runtime-libraries`: 2 files / 5 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 2 files / 17 matches
  - `generated`: 12 files / 298 matches
  - `zod`: 1 files / 1 matches
  - `other`: 4 files / 28 matches
- Key files:
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (6 matches)
  - [packages/data/src/variable-statistics.ts](../packages/data/src/variable-statistics.ts) (2 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (9 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (10 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/NOf1Variable.ts](../packages/db/src/generated/prisma/models/NOf1Variable.ts) (248 matches)
- Notes:
  - none

### NOf1VariableRelationship

- Schema: [packages/db/prisma/schema.prisma#L2924](../packages/db/prisma/schema.prisma#L2924)
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
  - `other`: 3 files / 9 matches
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

- Schema: [packages/db/prisma/schema.prisma#L5311](../packages/db/prisma/schema.prisma#L5311)
- Classification: `runtime-live`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `components`: 2 files / 3 matches
  - `runtime-libraries`: 5 files / 6 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 8 files / 175 matches
  - `zod`: 1 files / 1 matches
  - `other`: 30 files / 63 matches
- Key files:
  - [packages/web/src/components/notifications/PushNotificationPrompt.tsx](../packages/web/src/components/notifications/PushNotificationPrompt.tsx) (2 matches)
  - [packages/web/src/components/settings/SettingsClient.tsx](../packages/web/src/components/settings/SettingsClient.tsx) (1 matches)
  - [packages/web/src/lib/routes.ts](../packages/web/src/lib/routes.ts) (2 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (1 matches)
  - [packages/extension/src/background/service-worker.ts](../packages/extension/src/background/service-worker.ts) (1 matches)
  - [packages/web/src/lib/push-notifications.ts](../packages/web/src/lib/push-notifications.ts) (1 matches)
  - [packages/web/src/lib/tasks/share-templates.ts](../packages/web/src/lib/tasks/share-templates.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### NotificationPreference

- Schema: [packages/db/prisma/schema.prisma#L5348](../packages/db/prisma/schema.prisma#L5348)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `api-routes`: 1 files / 2 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 4 matches
  - `generated`: 9 files / 153 matches
  - `zod`: 1 files / 2 matches
  - `other`: 1 files / 1 matches
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

- Schema: [packages/db/prisma/schema.prisma#L9441](../packages/db/prisma/schema.prisma#L9441)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `api-routes`: 2 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 3 files / 14 matches
  - `generated`: 9 files / 177 matches
  - `other`: 2 files / 8 matches
- Key files:
  - [packages/web/src/app/api/mcp/oauth/token/route.ts](../packages/web/src/app/api/mcp/oauth/token/route.ts) (4 matches)
  - [packages/web/src/app/api/mcp/oauth/consent/route.ts](../packages/web/src/app/api/mcp/oauth/consent/route.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql](../packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql) (9 matches)
  - [packages/db/prisma/migrations/20260425250000_mcp_scope_enum/migration.sql](../packages/db/prisma/migrations/20260425250000_mcp_scope_enum/migration.sql) (3 matches)
  - [packages/db/prisma/migrations/20260428125500_drop_legacy_mcp_scopes/migration.sql](../packages/db/prisma/migrations/20260428125500_drop_legacy_mcp_scopes/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/OAuthAuthCode.ts](../packages/db/src/generated/prisma/models/OAuthAuthCode.ts) (140 matches)
- Notes:
  - none

### OAuthClient

- Schema: [packages/db/prisma/schema.prisma#L9405](../packages/db/prisma/schema.prisma#L9405)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 3 matches
  - `api-routes`: 3 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 2 files / 5 matches
  - `generated`: 8 files / 181 matches
  - `other`: 2 files / 9 matches
- Key files:
  - [packages/web/src/app/api/mcp/oauth/authorize/route.ts](../packages/web/src/app/api/mcp/oauth/authorize/route.ts) (2 matches)
  - [packages/web/src/app/api/mcp/oauth/consent/route.ts](../packages/web/src/app/api/mcp/oauth/consent/route.ts) (2 matches)
  - [packages/web/src/app/api/mcp/oauth/register/route.ts](../packages/web/src/app/api/mcp/oauth/register/route.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql](../packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql) (4 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/OAuthClient.ts](../packages/db/src/generated/prisma/models/OAuthClient.ts) (144 matches)
- Notes:
  - none

### OAuthGrant

- Schema: [packages/db/prisma/schema.prisma#L9483](../packages/db/prisma/schema.prisma#L9483)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 6 matches
  - `api-routes`: 3 files / 6 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 4 files / 16 matches
  - `generated`: 10 files / 182 matches
  - `other`: 2 files / 4 matches
- Key files:
  - [packages/web/src/app/api/mcp/oauth/token/route.ts](../packages/web/src/app/api/mcp/oauth/token/route.ts) (6 matches)
  - [packages/web/src/app/api/mcp/oauth/revoke/route.ts](../packages/web/src/app/api/mcp/oauth/revoke/route.ts) (4 matches)
  - [packages/web/src/app/api/mcp/route.ts](../packages/web/src/app/api/mcp/route.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql](../packages/db/prisma/migrations/20260425245000_create_oauth_tables/migration.sql) (10 matches)
  - [packages/db/prisma/migrations/20260425250000_mcp_scope_enum/migration.sql](../packages/db/prisma/migrations/20260425250000_mcp_scope_enum/migration.sql) (3 matches)
  - [packages/db/prisma/migrations/20260428125500_drop_legacy_mcp_scopes/migration.sql](../packages/db/prisma/migrations/20260428125500_drop_legacy_mcp_scopes/migration.sql) (2 matches)
- Notes:
  - none

### Organization

- Schema: [packages/db/prisma/schema.prisma#L5376](../packages/db/prisma/schema.prisma#L5376)
- Classification: `core`
- Direct Prisma usage: 22 files / 48 matches
- Usage counts by bucket:
  - `runtime-prisma`: 22 files / 48 matches
  - `api-routes`: 7 files / 20 matches
  - `pages`: 8 files / 12 matches
  - `components`: 6 files / 12 matches
  - `runtime-libraries`: 23 files / 94 matches
  - `scripts`: 2 files / 3 matches
  - `tests`: 6 files / 10 matches
  - `docs`: 4 files / 5 matches
  - `schema`: 1 files / 28 matches
  - `migrations`: 9 files / 29 matches
  - `generated`: 22 files / 396 matches
  - `zod`: 1 files / 1 matches
  - `other`: 29 files / 129 matches
- Key files:
  - [packages/web/src/lib/organization.server.ts](../packages/web/src/lib/organization.server.ts) (38 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (28 matches)
  - [packages/web/src/app/api/admin/organizations/[id]/route.ts](../packages/web/src/app/api/admin/organizations/[id]/route.ts) (11 matches)
  - [packages/db/src/managed-data/managed-iam-organization.ts](../packages/db/src/managed-data/managed-iam-organization.ts) (7 matches)
  - [packages/db/src/managed-data/managed-demo-user.ts](../packages/db/src/managed-data/managed-demo-user.ts) (6 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (6 matches)
  - [packages/web/src/app/api/organizations/[id]/route.ts](../packages/web/src/app/api/organizations/[id]/route.ts) (6 matches)
  - [packages/web/scripts/smoke-test-iam-outreach.ts](../packages/web/scripts/smoke-test-iam-outreach.ts) (4 matches)
- Notes:
  - none

### OrganizationMember

- Schema: [packages/db/prisma/schema.prisma#L5458](../packages/db/prisma/schema.prisma#L5458)
- Classification: `core`
- Direct Prisma usage: 5 files / 14 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 14 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 5 files / 15 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 9 files / 153 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 6 matches
- Key files:
  - [packages/web/src/lib/organization.server.ts](../packages/web/src/lib/organization.server.ts) (21 matches)
  - [packages/db/src/managed-data/managed-demo-user.ts](../packages/db/src/managed-data/managed-demo-user.ts) (2 matches)
  - [packages/db/src/managed-data/managed-iam-organization.ts](../packages/db/src/managed-data/managed-iam-organization.ts) (2 matches)
  - [packages/web/src/app/orgs/[slug]/admin/reasoning/page.tsx](../packages/web/src/app/orgs/[slug]/admin/reasoning/page.tsx) (2 matches)
  - [packages/web/src/lib/task-applications.server.ts](../packages/web/src/lib/task-applications.server.ts) (2 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (6 matches)
- Notes:
  - none

### OrganizationReferendumPosition

- Schema: [packages/db/prisma/schema.prisma#L5486](../packages/db/prisma/schema.prisma#L5486)
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
  - `other`: 3 files / 10 matches
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

### Person

- Schema: [packages/db/prisma/schema.prisma#L962](../packages/db/prisma/schema.prisma#L962)
- Classification: `core`
- Direct Prisma usage: 29 files / 64 matches
- Usage counts by bucket:
  - `runtime-prisma`: 29 files / 64 matches
  - `api-routes`: 8 files / 21 matches
  - `pages`: 4 files / 6 matches
  - `components`: 2 files / 2 matches
  - `runtime-libraries`: 43 files / 163 matches
  - `scripts`: 5 files / 19 matches
  - `tests`: 15 files / 41 matches
  - `docs`: 5 files / 11 matches
  - `schema`: 1 files / 34 matches
  - `migrations`: 13 files / 76 matches
  - `generated`: 23 files / 446 matches
  - `zod`: 1 files / 1 matches
  - `other`: 33 files / 134 matches
- Key files:
  - [packages/web/src/lib/person.server.ts](../packages/web/src/lib/person.server.ts) (43 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (26 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (15 matches)
  - [packages/web/src/app/api/people/[id]/route.ts](../packages/web/src/app/api/people/[id]/route.ts) (10 matches)
  - [packages/web/src/lib/tasks.server.ts](../packages/web/src/lib/tasks.server.ts) (10 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (8 matches)
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (6 matches)
  - [packages/web/src/app/api/referendums/[slug]/represented-people/route.ts](../packages/web/src/app/api/referendums/[slug]/represented-people/route.ts) (6 matches)
- Notes:
  - none

### PersonCondition

- Schema: [packages/db/prisma/schema.prisma#L1114](../packages/db/prisma/schema.prisma#L1114)
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
  - `other`: 2 files / 13 matches
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

- Schema: [packages/db/prisma/schema.prisma#L1522](../packages/db/prisma/schema.prisma#L1522)
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
  - `other`: 2 files / 5 matches
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

- Schema: [packages/db/prisma/schema.prisma#L1994](../packages/db/prisma/schema.prisma#L1994)
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

- Schema: [packages/db/prisma/schema.prisma#L1215](../packages/db/prisma/schema.prisma#L1215)
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
  - `other`: 2 files / 17 matches
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

- Schema: [packages/db/prisma/schema.prisma#L1386](../packages/db/prisma/schema.prisma#L1386)
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
  - `other`: 2 files / 14 matches
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

- Schema: [packages/db/prisma/schema.prisma#L1326](../packages/db/prisma/schema.prisma#L1326)
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
  - `other`: 2 files / 9 matches
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

- Schema: [packages/db/prisma/schema.prisma#L1277](../packages/db/prisma/schema.prisma#L1277)
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
  - `other`: 2 files / 10 matches
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

- Schema: [packages/db/prisma/schema.prisma#L1075](../packages/db/prisma/schema.prisma#L1075)
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
  - `other`: 2 files / 5 matches
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

- Schema: [packages/db/prisma/schema.prisma#L5124](../packages/db/prisma/schema.prisma#L5124)
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
  - `other`: 2 files / 6 matches
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

- Schema: [packages/db/prisma/schema.prisma#L4104](../packages/db/prisma/schema.prisma#L4104)
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
  - `other`: 12 files / 120 matches
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

- Schema: [packages/db/prisma/schema.prisma#L4151](../packages/db/prisma/schema.prisma#L4151)
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

- Schema: [packages/db/prisma/schema.prisma#L4020](../packages/db/prisma/schema.prisma#L4020)
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

- Schema: [packages/db/prisma/schema.prisma#L5173](../packages/db/prisma/schema.prisma#L5173)
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
  - `other`: 2 files / 4 matches
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

- Schema: [packages/db/prisma/schema.prisma#L5212](../packages/db/prisma/schema.prisma#L5212)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 8 files / 163 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 3 matches
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

### QuestionResponse

- Schema: [packages/db/prisma/schema.prisma#L8115](../packages/db/prisma/schema.prisma#L8115)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 168 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 3 matches
- Key files:
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/QuestionResponse.ts](../packages/db/src/generated/prisma/models/QuestionResponse.ts) (131 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### RankedIntervention

- Schema: [packages/db/prisma/schema.prisma#L3427](../packages/db/prisma/schema.prisma#L3427)
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

### ReasoningAssignmentRule

- Schema: [packages/db/prisma/schema.prisma#L9777](../packages/db/prisma/schema.prisma#L9777)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 5 matches
  - `api-routes`: 1 files / 1 matches
  - `runtime-libraries`: 2 files / 4 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 4 matches
  - `generated`: 8 files / 204 matches
  - `other`: 2 files / 13 matches
- Key files:
  - [packages/db/src/managed-data/managed-reasoning-data.ts](../packages/db/src/managed-data/managed-reasoning-data.ts) (6 matches)
  - [packages/web/src/app/api/admin/reasoning/pin/route.ts](../packages/web/src/app/api/admin/reasoning/pin/route.ts) (2 matches)
  - [packages/web/src/lib/reasoning/resolve-variant.server.ts](../packages/web/src/lib/reasoning/resolve-variant.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/ReasoningAssignmentRule.ts](../packages/db/src/generated/prisma/models/ReasoningAssignmentRule.ts) (171 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
- Notes:
  - none

### ReasoningBanditPolicyState

- Schema: [packages/db/prisma/schema.prisma#L9800](../packages/db/prisma/schema.prisma#L9800)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 5 matches
  - `runtime-libraries`: 2 files / 5 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 7 files / 152 matches
- Key files:
  - [packages/web/src/lib/reasoning/evaluator.server.ts](../packages/web/src/lib/reasoning/evaluator.server.ts) (6 matches)
  - [packages/web/src/lib/reasoning/allocator.server.ts](../packages/web/src/lib/reasoning/allocator.server.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/ReasoningBanditPolicyState.ts](../packages/db/src/generated/prisma/models/ReasoningBanditPolicyState.ts) (123 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### ReasoningBlacklistRule

- Schema: [packages/db/prisma/schema.prisma#L9980](../packages/db/prisma/schema.prisma#L9980)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `api-routes`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 2 matches
  - `generated`: 7 files / 152 matches
  - `other`: 2 files / 5 matches
- Key files:
  - [packages/web/src/app/api/admin/reasoning/blacklist/route.ts](../packages/web/src/app/api/admin/reasoning/blacklist/route.ts) (4 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/ReasoningBlacklistRule.ts](../packages/db/src/generated/prisma/models/ReasoningBlacklistRule.ts) (123 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### ReasoningBundleVariant

- Schema: [packages/db/prisma/schema.prisma#L10159](../packages/db/prisma/schema.prisma#L10159)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 3 matches
  - `runtime-libraries`: 1 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 7 files / 171 matches
  - `other`: 2 files / 4 matches
- Key files:
  - [packages/web/src/lib/reasoning/bundle-variants.server.ts](../packages/web/src/lib/reasoning/bundle-variants.server.ts) (6 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/ReasoningBundleVariant.ts](../packages/db/src/generated/prisma/models/ReasoningBundleVariant.ts) (142 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### ReasoningChainValueGuardSnapshot

- Schema: [packages/db/prisma/schema.prisma#L10014](../packages/db/prisma/schema.prisma#L10014)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 2 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 2 matches
  - `generated`: 7 files / 144 matches
- Key files:
  - [packages/web/src/app/admin/reasoning/r-guard/page.tsx](../packages/web/src/app/admin/reasoning/r-guard/page.tsx) (2 matches)
  - [packages/web/src/lib/reasoning/r-guard.server.ts](../packages/web/src/lib/reasoning/r-guard.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/ReasoningChainValueGuardSnapshot.ts](../packages/db/src/generated/prisma/models/ReasoningChainValueGuardSnapshot.ts) (115 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### ReasoningDistributionPolicyState

- Schema: [packages/db/prisma/schema.prisma#L10088](../packages/db/prisma/schema.prisma#L10088)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 7 files / 172 matches
  - `other`: 2 files / 3 matches
- Key files:
  - [packages/web/src/lib/reasoning/distribution-optimizer.server.ts](../packages/web/src/lib/reasoning/distribution-optimizer.server.ts) (4 matches)
  - [packages/web/src/app/admin/reasoning/distribution/page.tsx](../packages/web/src/app/admin/reasoning/distribution/page.tsx) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/ReasoningDistributionPolicyState.ts](../packages/db/src/generated/prisma/models/ReasoningDistributionPolicyState.ts) (143 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### ReasoningDistributionSliceSnapshot

- Schema: [packages/db/prisma/schema.prisma#L10107](../packages/db/prisma/schema.prisma#L10107)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 2 matches
  - `generated`: 7 files / 160 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/ReasoningDistributionSliceSnapshot.ts](../packages/db/src/generated/prisma/models/ReasoningDistributionSliceSnapshot.ts) (131 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts](../packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### ReasoningDistributionTarget

- Schema: [packages/db/prisma/schema.prisma#L10141](../packages/db/prisma/schema.prisma#L10141)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 8 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 8 matches
  - `api-routes`: 1 files / 4 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 7 files / 168 matches
  - `other`: 2 files / 4 matches
- Key files:
  - [packages/web/src/app/api/admin/reasoning/distribution-targets/route.ts](../packages/web/src/app/api/admin/reasoning/distribution-targets/route.ts) (8 matches)
  - [packages/db/src/managed-data/managed-reasoning-data.ts](../packages/db/src/managed-data/managed-reasoning-data.ts) (4 matches)
  - [packages/web/src/app/admin/reasoning/distribution/page.tsx](../packages/web/src/app/admin/reasoning/distribution/page.tsx) (2 matches)
  - [packages/web/src/lib/reasoning/distribution-optimizer.server.ts](../packages/web/src/lib/reasoning/distribution-optimizer.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/ReasoningDistributionTarget.ts](../packages/db/src/generated/prisma/models/ReasoningDistributionTarget.ts) (139 matches)
- Notes:
  - none

### ReasoningDiversitySnapshot

- Schema: [packages/db/prisma/schema.prisma#L10058](../packages/db/prisma/schema.prisma#L10058)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 7 files / 152 matches
- Key files:
  - [packages/web/src/lib/reasoning/diversity-guard.server.ts](../packages/web/src/lib/reasoning/diversity-guard.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/ReasoningDiversitySnapshot.ts](../packages/db/src/generated/prisma/models/ReasoningDiversitySnapshot.ts) (123 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### ReasoningFraudFinding

- Schema: [packages/db/prisma/schema.prisma#L9918](../packages/db/prisma/schema.prisma#L9918)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 8 files / 179 matches
  - `other`: 2 files / 5 matches
- Key files:
  - [packages/web/src/lib/reasoning/fraud.server.ts](../packages/web/src/lib/reasoning/fraud.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (5 matches)
  - [packages/db/src/generated/prisma/models/ReasoningFraudFinding.ts](../packages/db/src/generated/prisma/models/ReasoningFraudFinding.ts) (146 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### ReasoningFraudPattern

- Schema: [packages/db/prisma/schema.prisma#L9904](../packages/db/prisma/schema.prisma#L9904)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 8 files / 162 matches
  - `other`: 2 files / 3 matches
- Key files:
  - [packages/db/src/managed-data/managed-reasoning-data.ts](../packages/db/src/managed-data/managed-reasoning-data.ts) (4 matches)
  - [packages/web/src/lib/reasoning/fraud.server.ts](../packages/web/src/lib/reasoning/fraud.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/ReasoningFraudPattern.ts](../packages/db/src/generated/prisma/models/ReasoningFraudPattern.ts) (129 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### ReasoningGenerationRequest

- Schema: [packages/db/prisma/schema.prisma#L9945](../packages/db/prisma/schema.prisma#L9945)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `api-routes`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 2 matches
  - `generated`: 8 files / 178 matches
  - `other`: 2 files / 4 matches
- Key files:
  - [packages/web/src/app/api/admin/reasoning/generate/route.ts](../packages/web/src/app/api/admin/reasoning/generate/route.ts) (4 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/ReasoningGenerationRequest.ts](../packages/db/src/generated/prisma/models/ReasoningGenerationRequest.ts) (145 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### ReasoningHoldoutComparison

- Schema: [packages/db/prisma/schema.prisma#L9882](../packages/db/prisma/schema.prisma#L9882)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 3 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 3 matches
  - `generated`: 7 files / 184 matches
- Key files:
  - [packages/web/src/lib/reasoning/winners.server.ts](../packages/web/src/lib/reasoning/winners.server.ts) (4 matches)
  - [packages/web/src/lib/reasoning/promoter.server.ts](../packages/web/src/lib/reasoning/promoter.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/ReasoningHoldoutComparison.ts](../packages/db/src/generated/prisma/models/ReasoningHoldoutComparison.ts) (155 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### ReasoningLocaleConfig

- Schema: [packages/db/prisma/schema.prisma#L10072](../packages/db/prisma/schema.prisma#L10072)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 7 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 7 matches
  - `api-routes`: 1 files / 2 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 4 files / 5 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 2 matches
  - `generated`: 7 files / 171 matches
  - `other`: 2 files / 6 matches
- Key files:
  - [packages/web/src/app/api/admin/reasoning/locales/route.ts](../packages/web/src/app/api/admin/reasoning/locales/route.ts) (4 matches)
  - [packages/web/src/lib/reasoning/locale.server.ts](../packages/web/src/lib/reasoning/locale.server.ts) (4 matches)
  - [packages/db/src/managed-data/managed-reasoning-data.ts](../packages/db/src/managed-data/managed-reasoning-data.ts) (2 matches)
  - [packages/web/src/app/admin/reasoning/locales/page.tsx](../packages/web/src/app/admin/reasoning/locales/page.tsx) (2 matches)
  - [packages/web/src/lib/reasoning/resolve-variant.server.ts](../packages/web/src/lib/reasoning/resolve-variant.server.ts) (2 matches)
  - [packages/web/src/lib/reasoning/validator.ts](../packages/web/src/lib/reasoning/validator.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
- Notes:
  - none

### ReasoningOrganizationDomain

- Schema: [packages/db/prisma/schema.prisma#L10122](../packages/db/prisma/schema.prisma#L10122)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 4 matches
  - `api-routes`: 1 files / 2 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 4 matches
  - `generated`: 7 files / 171 matches
  - `other`: 1 files / 5 matches
- Key files:
  - [packages/web/src/app/api/admin/reasoning/organization-domains/route.ts](../packages/web/src/app/api/admin/reasoning/organization-domains/route.ts) (4 matches)
  - [packages/web/src/lib/reasoning/host-resolution.server.ts](../packages/web/src/lib/reasoning/host-resolution.server.ts) (3 matches)
  - [packages/web/src/app/admin/reasoning/orgs/page.tsx](../packages/web/src/app/admin/reasoning/orgs/page.tsx) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/ReasoningOrganizationDomain.ts](../packages/db/src/generated/prisma/models/ReasoningOrganizationDomain.ts) (142 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### ReasoningOrgFork

- Schema: [packages/db/prisma/schema.prisma#L9935](../packages/db/prisma/schema.prisma#L9935)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 2 matches
  - `pages`: 2 files / 2 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 4 matches
  - `generated`: 8 files / 146 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [packages/web/src/app/admin/reasoning/orgs/page.tsx](../packages/web/src/app/admin/reasoning/orgs/page.tsx) (2 matches)
  - [packages/web/src/app/orgs/[slug]/admin/reasoning/page.tsx](../packages/web/src/app/orgs/[slug]/admin/reasoning/page.tsx) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/ReasoningOrgFork.ts](../packages/db/src/generated/prisma/models/ReasoningOrgFork.ts) (113 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### ReasoningOutcomeRecord

- Schema: [packages/db/prisma/schema.prisma#L9848](../packages/db/prisma/schema.prisma#L9848)
- Classification: `runtime-live`
- Direct Prisma usage: 8 files / 18 matches
- Usage counts by bucket:
  - `runtime-prisma`: 8 files / 18 matches
  - `api-routes`: 2 files / 3 matches
  - `runtime-libraries`: 6 files / 15 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 7 files / 216 matches
  - `other`: 2 files / 10 matches
- Key files:
  - [packages/web/src/lib/reasoning/r-guard.server.ts](../packages/web/src/lib/reasoning/r-guard.server.ts) (14 matches)
  - [packages/web/src/lib/reasoning/fraud.server.ts](../packages/web/src/lib/reasoning/fraud.server.ts) (6 matches)
  - [packages/web/src/app/api/cron/reasoning/evaluator/route.ts](../packages/web/src/app/api/cron/reasoning/evaluator/route.ts) (4 matches)
  - [packages/web/src/lib/reasoning/shadow-evaluator.server.ts](../packages/web/src/lib/reasoning/shadow-evaluator.server.ts) (4 matches)
  - [packages/web/src/app/api/reasoning/outcomes/route.ts](../packages/web/src/app/api/reasoning/outcomes/route.ts) (2 matches)
  - [packages/web/src/lib/reasoning/distribution-optimizer.server.ts](../packages/web/src/lib/reasoning/distribution-optimizer.server.ts) (2 matches)
  - [packages/web/src/lib/reasoning/evaluator.server.ts](../packages/web/src/lib/reasoning/evaluator.server.ts) (2 matches)
  - [packages/web/src/lib/reasoning/session.server.ts](../packages/web/src/lib/reasoning/session.server.ts) (2 matches)
- Notes:
  - none

### ReasoningPromotionDecision

- Schema: [packages/db/prisma/schema.prisma#L9961](../packages/db/prisma/schema.prisma#L9961)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 4 matches
  - `api-routes`: 2 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 2 matches
  - `generated`: 7 files / 176 matches
  - `other`: 2 files / 11 matches
- Key files:
  - [packages/web/src/lib/reasoning/promoter.server.ts](../packages/web/src/lib/reasoning/promoter.server.ts) (4 matches)
  - [packages/web/src/app/api/admin/reasoning/promote/route.ts](../packages/web/src/app/api/admin/reasoning/promote/route.ts) (2 matches)
  - [packages/web/src/app/api/admin/reasoning/retire/route.ts](../packages/web/src/app/api/admin/reasoning/retire/route.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/ReasoningPromotionDecision.ts](../packages/db/src/generated/prisma/models/ReasoningPromotionDecision.ts) (147 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
- Notes:
  - none

### ReasoningRGuardSnapshot

- Schema: [packages/db/prisma/schema.prisma#L10004](../packages/db/prisma/schema.prisma#L10004)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 5 matches
  - `pages`: 2 files / 2 matches
  - `runtime-libraries`: 2 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 2 matches
  - `generated`: 7 files / 140 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/reasoning/promoter.server.ts](../packages/web/src/lib/reasoning/promoter.server.ts) (4 matches)
  - [packages/web/src/app/admin/reasoning/page.tsx](../packages/web/src/app/admin/reasoning/page.tsx) (2 matches)
  - [packages/web/src/app/admin/reasoning/r-guard/page.tsx](../packages/web/src/app/admin/reasoning/r-guard/page.tsx) (2 matches)
  - [packages/web/src/lib/reasoning/r-guard.server.ts](../packages/web/src/lib/reasoning/r-guard.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/ReasoningRGuardSnapshot.ts](../packages/db/src/generated/prisma/models/ReasoningRGuardSnapshot.ts) (111 matches)
- Notes:
  - none

### ReasoningShadowEvaluation

- Schema: [packages/db/prisma/schema.prisma#L10037](../packages/db/prisma/schema.prisma#L10037)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 4 matches
  - `generated`: 8 files / 194 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/reasoning/shadow-evaluator.server.ts](../packages/web/src/lib/reasoning/shadow-evaluator.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (4 matches)
  - [packages/db/src/generated/prisma/models/ReasoningShadowEvaluation.ts](../packages/db/src/generated/prisma/models/ReasoningShadowEvaluation.ts) (161 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (21 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### ReasoningSystemState

- Schema: [packages/db/prisma/schema.prisma#L10025](../packages/db/prisma/schema.prisma#L10025)
- Classification: `runtime-live`
- Direct Prisma usage: 7 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 7 files / 11 matches
  - `pages`: 2 files / 2 matches
  - `runtime-libraries`: 5 files / 9 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 1 matches
  - `generated`: 7 files / 156 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/reasoning/promoter.server.ts](../packages/web/src/lib/reasoning/promoter.server.ts) (8 matches)
  - [packages/web/src/lib/reasoning/r-guard.server.ts](../packages/web/src/lib/reasoning/r-guard.server.ts) (4 matches)
  - [packages/db/src/managed-data/managed-reasoning-data.ts](../packages/db/src/managed-data/managed-reasoning-data.ts) (2 matches)
  - [packages/web/src/app/admin/reasoning/page.tsx](../packages/web/src/app/admin/reasoning/page.tsx) (2 matches)
  - [packages/web/src/app/admin/reasoning/r-guard/page.tsx](../packages/web/src/app/admin/reasoning/r-guard/page.tsx) (2 matches)
  - [packages/web/src/lib/reasoning/allocator.server.ts](../packages/web/src/lib/reasoning/allocator.server.ts) (2 matches)
  - [packages/web/src/lib/reasoning/bundle-variants.server.ts](../packages/web/src/lib/reasoning/bundle-variants.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### ReasoningTopologyVariant

- Schema: [packages/db/prisma/schema.prisma#L9993](../packages/db/prisma/schema.prisma#L9993)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 2 matches
  - `generated`: 7 files / 151 matches
  - `other`: 1 files / 2 matches
- Key files:
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/ReasoningTopologyVariant.ts](../packages/db/src/generated/prisma/models/ReasoningTopologyVariant.ts) (122 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (19 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### ReasoningVariantArm

- Schema: [packages/db/prisma/schema.prisma#L9740](../packages/db/prisma/schema.prisma#L9740)
- Classification: `runtime-live`
- Direct Prisma usage: 10 files / 22 matches
- Usage counts by bucket:
  - `runtime-prisma`: 10 files / 22 matches
  - `api-routes`: 4 files / 6 matches
  - `runtime-libraries`: 6 files / 16 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 11 matches
  - `generated`: 9 files / 285 matches
  - `other`: 2 files / 4 matches
- Key files:
  - [packages/web/src/lib/reasoning/promoter.server.ts](../packages/web/src/lib/reasoning/promoter.server.ts) (10 matches)
  - [packages/db/src/managed-data/managed-reasoning-data.ts](../packages/db/src/managed-data/managed-reasoning-data.ts) (8 matches)
  - [packages/web/src/app/api/admin/reasoning/promote/route.ts](../packages/web/src/app/api/admin/reasoning/promote/route.ts) (4 matches)
  - [packages/web/src/app/api/admin/reasoning/retire/route.ts](../packages/web/src/app/api/admin/reasoning/retire/route.ts) (4 matches)
  - [packages/web/src/lib/reasoning/generator.server.ts](../packages/web/src/lib/reasoning/generator.server.ts) (4 matches)
  - [packages/web/src/lib/reasoning/resolve-variant.server.ts](../packages/web/src/lib/reasoning/resolve-variant.server.ts) (4 matches)
  - [packages/web/src/lib/reasoning/shadow-evaluator.server.ts](../packages/web/src/lib/reasoning/shadow-evaluator.server.ts) (4 matches)
  - [packages/web/src/app/api/admin/reasoning/freeze/route.ts](../packages/web/src/app/api/admin/reasoning/freeze/route.ts) (2 matches)
- Notes:
  - none

### ReasoningVariantExposure

- Schema: [packages/db/prisma/schema.prisma#L9814](../packages/db/prisma/schema.prisma#L9814)
- Classification: `runtime-live`
- Direct Prisma usage: 5 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 5 matches
  - `api-routes`: 1 files / 1 matches
  - `runtime-libraries`: 4 files / 4 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 1 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 7 files / 208 matches
  - `other`: 2 files / 15 matches
- Key files:
  - [packages/web/src/app/api/cron/reasoning/evaluator/route.ts](../packages/web/src/app/api/cron/reasoning/evaluator/route.ts) (2 matches)
  - [packages/web/src/lib/reasoning/distribution-optimizer.server.ts](../packages/web/src/lib/reasoning/distribution-optimizer.server.ts) (2 matches)
  - [packages/web/src/lib/reasoning/diversity-guard.server.ts](../packages/web/src/lib/reasoning/diversity-guard.server.ts) (2 matches)
  - [packages/web/src/lib/reasoning/promoter.server.ts](../packages/web/src/lib/reasoning/promoter.server.ts) (2 matches)
  - [packages/web/src/lib/reasoning/session.server.ts](../packages/web/src/lib/reasoning/session.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (1 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (9 matches)
- Notes:
  - none

### ReasoningVariantSet

- Schema: [packages/db/prisma/schema.prisma#L9718](../packages/db/prisma/schema.prisma#L9718)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 10 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 10 matches
  - `pages`: 2 files / 2 matches
  - `runtime-libraries`: 2 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 7 files / 222 matches
  - `other`: 2 files / 3 matches
- Key files:
  - [packages/db/src/managed-data/managed-reasoning-data.ts](../packages/db/src/managed-data/managed-reasoning-data.ts) (12 matches)
  - [packages/web/src/lib/reasoning/resolve-variant.server.ts](../packages/web/src/lib/reasoning/resolve-variant.server.ts) (4 matches)
  - [packages/web/src/app/admin/reasoning/[setId]/page.tsx](../packages/web/src/app/admin/reasoning/[setId]/page.tsx) (2 matches)
  - [packages/web/src/app/admin/reasoning/page.tsx](../packages/web/src/app/admin/reasoning/page.tsx) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260420_reasoning_base/migration.sql](../packages/db/prisma/migrations/20260420_reasoning_base/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/ReasoningVariantSet.ts](../packages/db/src/generated/prisma/models/ReasoningVariantSet.ts) (183 matches)
- Notes:
  - none

### Referendum

- Schema: [packages/db/prisma/schema.prisma#L4494](../packages/db/prisma/schema.prisma#L4494)
- Classification: `runtime-live`
- Direct Prisma usage: 21 files / 31 matches
- Usage counts by bucket:
  - `runtime-prisma`: 21 files / 31 matches
  - `api-routes`: 3 files / 8 matches
  - `pages`: 6 files / 9 matches
  - `components`: 4 files / 4 matches
  - `runtime-libraries`: 16 files / 39 matches
  - `scripts`: 3 files / 4 matches
  - `tests`: 7 files / 16 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 12 matches
  - `migrations`: 5 files / 21 matches
  - `generated`: 14 files / 297 matches
  - `zod`: 1 files / 1 matches
  - `other`: 6 files / 7 matches
- Key files:
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (14 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (7 matches)
  - [packages/web/src/app/agencies/dcongress/referendums/[slug]/page.tsx](../packages/web/src/app/agencies/dcongress/referendums/[slug]/page.tsx) (6 matches)
  - [packages/web/src/app/api/referendums/route.ts](../packages/web/src/app/api/referendums/route.ts) (6 matches)
  - [packages/db/src/managed-data/managed-referendums.ts](../packages/db/src/managed-data/managed-referendums.ts) (5 matches)
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (4 matches)
  - [packages/web/src/app/api/referendums/[slug]/vote/route.ts](../packages/web/src/app/api/referendums/[slug]/vote/route.ts) (4 matches)
  - [packages/web/src/lib/referendum-site.server.ts](../packages/web/src/lib/referendum-site.server.ts) (4 matches)
- Notes:
  - none

### ReferendumVote

- Schema: [packages/db/prisma/schema.prisma#L4563](../packages/db/prisma/schema.prisma#L4563)
- Classification: `runtime-live`
- Direct Prisma usage: 19 files / 44 matches
- Usage counts by bucket:
  - `runtime-prisma`: 19 files / 44 matches
  - `api-routes`: 1 files / 1 matches
  - `pages`: 4 files / 4 matches
  - `runtime-libraries`: 16 files / 42 matches
  - `scripts`: 2 files / 8 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 5 files / 29 matches
  - `generated`: 13 files / 246 matches
  - `zod`: 1 files / 1 matches
  - `other`: 7 files / 45 matches
- Key files:
  - [packages/web/src/lib/verified-votes.server.ts](../packages/web/src/lib/verified-votes.server.ts) (16 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (13 matches)
  - [packages/web/src/lib/referendum-site.server.ts](../packages/web/src/lib/referendum-site.server.ts) (12 matches)
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (11 matches)
  - [packages/web/src/lib/email/monthly-chain-digest.server.ts](../packages/web/src/lib/email/monthly-chain-digest.server.ts) (6 matches)
  - [packages/web/src/lib/daily-activity-digest.server.ts](../packages/web/src/lib/daily-activity-digest.server.ts) (4 matches)
  - [packages/web/src/lib/humanity-v-government-case.server.ts](../packages/web/src/lib/humanity-v-government-case.server.ts) (4 matches)
  - [packages/web/src/lib/referral-point-mint.server.ts](../packages/web/src/lib/referral-point-mint.server.ts) (4 matches)
- Notes:
  - Internal platform vote tied to a real Referendum row, referral attribution, and VOTE token / reward flows.

### Referral

- Schema: [packages/db/prisma/schema.prisma#L3771](../packages/db/prisma/schema.prisma#L3771)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 7 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 7 matches
  - `api-routes`: 4 files / 7 matches
  - `pages`: 1 files / 1 matches
  - `components`: 9 files / 13 matches
  - `runtime-libraries`: 11 files / 15 matches
  - `tests`: 4 files / 7 matches
  - `docs`: 4 files / 5 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 3 files / 10 matches
  - `generated`: 9 files / 196 matches
  - `zod`: 1 files / 1 matches
  - `other`: 15 files / 34 matches
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

- Schema: [packages/db/prisma/schema.prisma#L3810](../packages/db/prisma/schema.prisma#L3810)
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
  - `other`: 5 files / 23 matches
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

- Schema: [packages/db/prisma/schema.prisma#L3852](../packages/db/prisma/schema.prisma#L3852)
- Classification: `runtime-live`
- Direct Prisma usage: 6 files / 26 matches
- Usage counts by bucket:
  - `runtime-prisma`: 6 files / 26 matches
  - `api-routes`: 1 files / 3 matches
  - `runtime-libraries`: 7 files / 24 matches
  - `scripts`: 2 files / 7 matches
  - `docs`: 4 files / 6 matches
  - `schema`: 1 files / 12 matches
  - `migrations`: 8 files / 32 matches
  - `generated`: 15 files / 325 matches
  - `other`: 6 files / 43 matches
- Key files:
  - [packages/web/src/lib/referral-invitations.server.ts](../packages/web/src/lib/referral-invitations.server.ts) (23 matches)
  - [packages/web/src/lib/humanity-manager-status.server.ts](../packages/web/src/lib/humanity-manager-status.server.ts) (11 matches)
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (9 matches)
  - [packages/web/src/app/api/referral-invitations/route.ts](../packages/web/src/app/api/referral-invitations/route.ts) (6 matches)
  - [packages/web/src/lib/email/monthly-chain-digest.server.ts](../packages/web/src/lib/email/monthly-chain-digest.server.ts) (4 matches)
  - [packages/web/src/lib/person.server.ts](../packages/web/src/lib/person.server.ts) (2 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (1 matches)
  - [packages/web/src/lib/jobs/refresh-user-downstream-cache.server.ts](../packages/web/src/lib/jobs/refresh-user-downstream-cache.server.ts) (1 matches)
- Notes:
  - none

### Session

- Schema: [packages/db/prisma/schema.prisma#L1938](../packages/db/prisma/schema.prisma#L1938)
- Classification: `runtime-live`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `api-routes`: 1 files / 3 matches
  - `runtime-libraries`: 9 files / 21 matches
  - `tests`: 2 files / 5 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 158 matches
  - `zod`: 1 files / 1 matches
  - `other`: 7 files / 13 matches
- Key files:
  - [packages/web/src/app/api/stripe/webhook/route.ts](../packages/web/src/app/api/stripe/webhook/route.ts) (3 matches)
  - [packages/web/src/lib/shirt-fulfillment.server.ts](../packages/web/src/lib/shirt-fulfillment.server.ts) (6 matches)
  - [packages/web/src/lib/voice-session.ts](../packages/web/src/lib/voice-session.ts) (4 matches)
  - [packages/data/src/datasets/wishonia-agencies.ts](../packages/data/src/datasets/wishonia-agencies.ts) (2 matches)
  - [packages/web/src/lib/referendum-vote-sync.ts](../packages/web/src/lib/referendum-vote-sync.ts) (2 matches)
  - [packages/web/src/lib/wishocracy-state-utils.ts](../packages/web/src/lib/wishocracy-state-utils.ts) (2 matches)
  - [packages/web/src/lib/wishocracy-utils.ts](../packages/web/src/lib/wishocracy-utils.ts) (2 matches)
  - [packages/data/src/fetchers/congress.ts](../packages/data/src/fetchers/congress.ts) (1 matches)
- Notes:
  - none

### ShareAttempt

- Schema: [packages/db/prisma/schema.prisma#L8337](../packages/db/prisma/schema.prisma#L8337)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 4 matches
  - `api-routes`: 1 files / 1 matches
  - `pages`: 1 files / 1 matches
  - `runtime-libraries`: 5 files / 5 matches
  - `docs`: 4 files / 9 matches
  - `schema`: 1 files / 14 matches
  - `migrations`: 6 files / 25 matches
  - `generated`: 16 files / 295 matches
  - `other`: 5 files / 23 matches
- Key files:
  - [packages/web/src/app/api/share-attempts/route.ts](../packages/web/src/app/api/share-attempts/route.ts) (2 matches)
  - [packages/web/src/lib/referral-redirect.server.ts](../packages/web/src/lib/referral-redirect.server.ts) (2 matches)
  - [packages/web/src/lib/referral.server.ts](../packages/web/src/lib/referral.server.ts) (2 matches)
  - [packages/web/src/lib/share-attempts.server.ts](../packages/web/src/lib/share-attempts.server.ts) (2 matches)
  - [packages/web/src/app/r/[code]/page.tsx](../packages/web/src/app/r/[code]/page.tsx) (1 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (1 matches)
  - [packages/web/src/lib/share-channels.ts](../packages/web/src/lib/share-channels.ts) (1 matches)
  - [docs/TREATY_REFERRAL_MODEL_AUDIT.md](../docs/TREATY_REFERRAL_MODEL_AUDIT.md) (6 matches)
- Notes:
  - none

### SocialAccount

- Schema: [packages/db/prisma/schema.prisma#L8213](../packages/db/prisma/schema.prisma#L8213)
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
  - `other`: 2 files / 8 matches
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

- Schema: [packages/db/prisma/schema.prisma#L6697](../packages/db/prisma/schema.prisma#L6697)
- Classification: `core`
- Direct Prisma usage: 3 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 4 matches
  - `runtime-libraries`: 2 files / 2 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 2 files / 3 matches
  - `schema`: 1 files / 13 matches
  - `migrations`: 3 files / 19 matches
  - `generated`: 16 files / 277 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 15 matches
- Key files:
  - [packages/web/scripts/extract-tasks-from-manual.ts](../packages/web/scripts/extract-tasks-from-manual.ts) (4 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (2 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (13 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (10 matches)
  - [packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql](../packages/db/prisma/migrations/20260502010000_person_centered_referendum_votes/migration.sql) (7 matches)
- Notes:
  - none

### Subject

- Schema: [packages/db/prisma/schema.prisma#L2384](../packages/db/prisma/schema.prisma#L2384)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `pages`: 2 files / 5 matches
  - `runtime-libraries`: 17 files / 22 matches
  - `scripts`: 1 files / 2 matches
  - `tests`: 5 files / 10 matches
  - `docs`: 2 files / 9 matches
  - `schema`: 1 files / 29 matches
  - `migrations`: 3 files / 30 matches
  - `generated`: 19 files / 340 matches
  - `zod`: 1 files / 1 matches
  - `other`: 4 files / 7 matches
- Key files:
  - [packages/web/src/lib/subject.server.ts](../packages/web/src/lib/subject.server.ts) (6 matches)
  - [packages/web/src/lib/court-data.server.ts](../packages/web/src/lib/court-data.server.ts) (2 matches)
  - [packages/web/src/app/admin/communications/page.tsx](../packages/web/src/app/admin/communications/page.tsx) (3 matches)
  - [packages/web/src/app/organizations/[id]/page.tsx](../packages/web/src/app/organizations/[id]/page.tsx) (2 matches)
  - [packages/data/src/datasets/medical-data/treatments/hemophilia.json](../packages/data/src/datasets/medical-data/treatments/hemophilia.json) (2 matches)
  - [packages/web/src/lib/email/preview-envelope.ts](../packages/web/src/lib/email/preview-envelope.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-comment-notification.email.md](../packages/web/src/lib/tasks/task-comment-notification.email.md) (2 matches)
  - [packages/data/src/datasets/medical-data/treatments/rosacea.json](../packages/data/src/datasets/medical-data/treatments/rosacea.json) (1 matches)
- Notes:
  - none

### Survey

- Schema: [packages/db/prisma/schema.prisma#L7948](../packages/db/prisma/schema.prisma#L7948)
- Classification: `runtime-live`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `pages`: 1 files / 2 matches
  - `components`: 3 files / 4 matches
  - `runtime-libraries`: 20 files / 51 matches
  - `tests`: 2 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 10 matches
  - `generated`: 9 files / 215 matches
  - `zod`: 1 files / 1 matches
  - `other`: 15 files / 43 matches
- Key files:
  - [packages/web/src/app/organizations/[id]/page.tsx](../packages/web/src/app/organizations/[id]/page.tsx) (2 matches)
  - [packages/web/src/components/organizations/OrganizationGrantCalculator.tsx](../packages/web/src/components/organizations/OrganizationGrantCalculator.tsx) (2 matches)
  - [packages/web/src/components/dashboard/NotificationPreferencesCard.tsx](../packages/web/src/components/dashboard/NotificationPreferencesCard.tsx) (1 matches)
  - [packages/web/src/components/dashboard/OrganizationEmailSignatureCard.tsx](../packages/web/src/components/dashboard/OrganizationEmailSignatureCard.tsx) (1 matches)
  - [packages/data/src/datasets/medical-data/references.json](../packages/data/src/datasets/medical-data/references.json) (13 matches)
  - [packages/data/src/datasets/us-federal-budget.ts](../packages/data/src/datasets/us-federal-budget.ts) (7 matches)
  - [packages/web/src/lib/routes.ts](../packages/web/src/lib/routes.ts) (6 matches)
  - [packages/data/src/campaign.ts](../packages/data/src/campaign.ts) (4 matches)
- Notes:
  - none

### SurveyQuestion

- Schema: [packages/db/prisma/schema.prisma#L8030](../packages/db/prisma/schema.prisma#L8030)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 192 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (6 matches)
  - [packages/db/src/generated/prisma/models/SurveyQuestion.ts](../packages/db/src/generated/prisma/models/SurveyQuestion.ts) (157 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts](../packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### SurveyResponse

- Schema: [packages/db/prisma/schema.prisma#L8077](../packages/db/prisma/schema.prisma#L8077)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 10 files / 190 matches
  - `zod`: 1 files / 1 matches
  - `other`: 1 files / 3 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (7 matches)
  - [packages/db/prisma/migrations/20260429120000_add_org_vote_survey_attribution/migration.sql](../packages/db/prisma/migrations/20260429120000_add_org_vote_survey_attribution/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/SurveyResponse.ts](../packages/db/src/generated/prisma/models/SurveyResponse.ts) (147 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (27 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### SurveySection

- Schema: [packages/db/prisma/schema.prisma#L7992](../packages/db/prisma/schema.prisma#L7992)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 177 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (6 matches)
  - [packages/db/src/generated/prisma/models/SurveySection.ts](../packages/db/src/generated/prisma/models/SurveySection.ts) (142 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts](../packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### Task

- Schema: [packages/db/prisma/schema.prisma#L5540](../packages/db/prisma/schema.prisma#L5540)
- Classification: `core`
- Direct Prisma usage: 41 files / 115 matches
- Usage counts by bucket:
  - `runtime-prisma`: 41 files / 115 matches
  - `api-routes`: 7 files / 19 matches
  - `pages`: 5 files / 13 matches
  - `components`: 12 files / 14 matches
  - `runtime-libraries`: 52 files / 202 matches
  - `scripts`: 11 files / 22 matches
  - `tests`: 16 files / 27 matches
  - `docs`: 13 files / 68 matches
  - `schema`: 1 files / 53 matches
  - `migrations`: 18 files / 116 matches
  - `generated`: 31 files / 807 matches
  - `zod`: 1 files / 1 matches
  - `other`: 53 files / 181 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (103 matches)
  - [packages/web/src/lib/tasks.server.ts](../packages/web/src/lib/tasks.server.ts) (43 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (19 matches)
  - [packages/web/src/lib/triggers/fire-handlers.ts](../packages/web/src/lib/triggers/fire-handlers.ts) (16 matches)
  - [packages/web/src/lib/tasks/user-treaty-task-progress.server.ts](../packages/web/src/lib/tasks/user-treaty-task-progress.server.ts) (10 matches)
  - [packages/web/scripts/extract-tasks-from-manual.ts](../packages/web/scripts/extract-tasks-from-manual.ts) (8 matches)
  - [packages/web/src/app/api/tasks/[id]/pledge/route.ts](../packages/web/src/app/api/tasks/[id]/pledge/route.ts) (7 matches)
  - [packages/web/src/lib/tasks/wishonia-task-reply.server.ts](../packages/web/src/lib/tasks/wishonia-task-reply.server.ts) (6 matches)
- Notes:
  - none

### TaskApplication

- Schema: [packages/db/prisma/schema.prisma#L6476](../packages/db/prisma/schema.prisma#L6476)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 5 matches
  - `api-routes`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 4 matches
  - `schema`: 1 files / 11 matches
  - `migrations`: 1 files / 22 matches
  - `generated`: 15 files / 371 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/task-applications.server.ts](../packages/web/src/lib/task-applications.server.ts) (8 matches)
  - [packages/web/src/app/api/tasks/[id]/applications/[applicationId]/route.ts](../packages/web/src/app/api/tasks/[id]/applications/[applicationId]/route.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (11 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (22 matches)
  - [packages/db/src/generated/prisma/models/TaskApplication.ts](../packages/db/src/generated/prisma/models/TaskApplication.ts) (304 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (39 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### TaskApplicationEvent

- Schema: [packages/db/prisma/schema.prisma#L6584](../packages/db/prisma/schema.prisma#L6584)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 10 files / 217 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/task-applications.server.ts](../packages/web/src/lib/task-applications.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/TaskApplicationEvent.ts](../packages/db/src/generated/prisma/models/TaskApplicationEvent.ts) (176 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### TaskCandidateMatch

- Schema: [packages/db/prisma/schema.prisma#L5927](../packages/db/prisma/schema.prisma#L5927)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 8 matches
  - `migrations`: 1 files / 17 matches
  - `generated`: 14 files / 304 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (8 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (17 matches)
  - [packages/db/src/generated/prisma/models/TaskCandidateMatch.ts](../packages/db/src/generated/prisma/models/TaskCandidateMatch.ts) (247 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (33 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts](../packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### TaskClaim

- Schema: [packages/db/prisma/schema.prisma#L6637](../packages/db/prisma/schema.prisma#L6637)
- Classification: `core`
- Direct Prisma usage: 1 files / 9 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 9 matches
  - `runtime-libraries`: 3 files / 13 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 6 matches
  - `migrations`: 3 files / 13 matches
  - `generated`: 11 files / 231 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 8 matches
- Key files:
  - [packages/web/src/lib/tasks.server.ts](../packages/web/src/lib/tasks.server.ts) (18 matches)
  - [packages/db/src/cleanup-test-data.ts](../packages/db/src/cleanup-test-data.ts) (3 matches)
  - [packages/web/src/lib/tasks/agent-lease.server.ts](../packages/web/src/lib/tasks/agent-lease.server.ts) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (9 matches)
  - [packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql](../packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql) (3 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (1 matches)
- Notes:
  - none

### TaskComment

- Schema: [packages/db/prisma/schema.prisma#L6762](../packages/db/prisma/schema.prisma#L6762)
- Classification: `runtime-live`
- Direct Prisma usage: 8 files / 26 matches
- Usage counts by bucket:
  - `runtime-prisma`: 8 files / 26 matches
  - `runtime-libraries`: 10 files / 34 matches
  - `scripts`: 2 files / 3 matches
  - `docs`: 4 files / 11 matches
  - `schema`: 1 files / 20 matches
  - `migrations`: 5 files / 37 matches
  - `generated`: 16 files / 401 matches
  - `other`: 3 files / 24 matches
- Key files:
  - [packages/web/src/lib/tasks/task-comments.server.ts](../packages/web/src/lib/tasks/task-comments.server.ts) (24 matches)
  - [packages/web/src/lib/tasks/user-treaty-task-progress.server.ts](../packages/web/src/lib/tasks/user-treaty-task-progress.server.ts) (10 matches)
  - [packages/web/src/lib/referral-invitations.server.ts](../packages/web/src/lib/referral-invitations.server.ts) (6 matches)
  - [packages/web/src/lib/triggers/fire-handlers.ts](../packages/web/src/lib/triggers/fire-handlers.ts) (5 matches)
  - [packages/web/src/lib/email/inbound-reply.ts](../packages/web/src/lib/email/inbound-reply.ts) (4 matches)
  - [packages/web/src/lib/tasks/task-comment-notifications.server.ts](../packages/web/src/lib/tasks/task-comment-notifications.server.ts) (3 matches)
  - [packages/web/src/lib/tasks/task-notifications.server.ts](../packages/web/src/lib/tasks/task-notifications.server.ts) (3 matches)
  - [packages/web/src/lib/tasks/task-communications.server.ts](../packages/web/src/lib/tasks/task-communications.server.ts) (2 matches)
- Notes:
  - none

### TaskCommentVote

- Schema: [packages/db/prisma/schema.prisma#L6881](../packages/db/prisma/schema.prisma#L6881)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 9 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 9 matches
  - `runtime-libraries`: 1 files / 9 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 9 files / 168 matches
  - `other`: 2 files / 5 matches
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

- Schema: [packages/db/prisma/schema.prisma#L7458](../packages/db/prisma/schema.prisma#L7458)
- Classification: `runtime-live`
- Direct Prisma usage: 8 files / 31 matches
- Usage counts by bucket:
  - `runtime-prisma`: 8 files / 31 matches
  - `runtime-libraries`: 10 files / 38 matches
  - `scripts`: 1 files / 1 matches
  - `docs`: 4 files / 21 matches
  - `schema`: 1 files / 20 matches
  - `migrations`: 4 files / 48 matches
  - `generated`: 21 files / 487 matches
  - `other`: 3 files / 25 matches
- Key files:
  - [packages/web/src/lib/tasks/task-notifications.server.ts](../packages/web/src/lib/tasks/task-notifications.server.ts) (28 matches)
  - [packages/web/src/lib/triggers/fire-handlers.ts](../packages/web/src/lib/triggers/fire-handlers.ts) (11 matches)
  - [packages/web/src/lib/email/inbound-reply.ts](../packages/web/src/lib/email/inbound-reply.ts) (10 matches)
  - [packages/web/src/lib/tasks/task-communications.server.ts](../packages/web/src/lib/tasks/task-communications.server.ts) (6 matches)
  - [packages/web/src/lib/admin-communications.server.ts](../packages/web/src/lib/admin-communications.server.ts) (4 matches)
  - [packages/web/src/lib/tasks/task-recipient-rate-limit.server.ts](../packages/web/src/lib/tasks/task-recipient-rate-limit.server.ts) (4 matches)
  - [packages/web/scripts/soft-delete-funding-tasks.ts](../packages/web/scripts/soft-delete-funding-tasks.ts) (2 matches)
  - [packages/web/src/lib/tasks/task-comment-notifications.server.ts](../packages/web/src/lib/tasks/task-comment-notifications.server.ts) (2 matches)
- Notes:
  - none

### TaskCommunicationEndpoint

- Schema: [packages/db/prisma/schema.prisma#L7289](../packages/db/prisma/schema.prisma#L7289)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 5 matches
  - `runtime-libraries`: 2 files / 7 matches
  - `docs`: 3 files / 4 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 9 files / 209 matches
  - `other`: 3 files / 14 matches
- Key files:
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (8 matches)
  - [packages/web/src/lib/triggers/fire-handlers.ts](../packages/web/src/lib/triggers/fire-handlers.ts) (4 matches)
  - [docs/TASK_COMMUNICATION_MODEL.md](../docs/TASK_COMMUNICATION_MODEL.md) (2 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260425220000_task_communication_system/migration.sql](../packages/db/prisma/migrations/20260425220000_task_communication_system/migration.sql) (9 matches)
  - [packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql](../packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql) (1 matches)
- Notes:
  - none

### TaskCommunicationSpawnSpec

- Schema: [packages/db/prisma/schema.prisma#L7821](../packages/db/prisma/schema.prisma#L7821)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `runtime-libraries`: 3 files / 6 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 3 files / 8 matches
  - `generated`: 8 files / 214 matches
  - `other`: 2 files / 14 matches
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

- Schema: [packages/db/prisma/schema.prisma#L7348](../packages/db/prisma/schema.prisma#L7348)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 3 files / 14 matches
  - `generated`: 10 files / 191 matches
  - `other`: 1 files / 1 matches
- Key files:
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260425220000_task_communication_system/migration.sql](../packages/db/prisma/migrations/20260425220000_task_communication_system/migration.sql) (10 matches)
  - [packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql](../packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql) (3 matches)
  - [packages/db/prisma/migrations/20260425230000_add_user_is_system/migration.sql](../packages/db/prisma/migrations/20260425230000_add_user_is_system/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/TaskCommunicationTemplate.ts](../packages/db/src/generated/prisma/models/TaskCommunicationTemplate.ts) (148 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (26 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (3 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### TaskCommunicationVariant

- Schema: [packages/db/prisma/schema.prisma#L7391](../packages/db/prisma/schema.prisma#L7391)
- Classification: `suspicious`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 9 matches
  - `generated`: 10 files / 231 matches
  - `other`: 2 files / 14 matches
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

- Schema: [packages/db/prisma/schema.prisma#L6258](../packages/db/prisma/schema.prisma#L6258)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 8 matches
  - `migrations`: 1 files / 24 matches
  - `generated`: 13 files / 353 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (8 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (24 matches)
  - [packages/db/src/generated/prisma/models/TaskDistributionAttempt.ts](../packages/db/src/generated/prisma/models/TaskDistributionAttempt.ts) (296 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (33 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### TaskDistributionTarget

- Schema: [packages/db/prisma/schema.prisma#L6204](../packages/db/prisma/schema.prisma#L6204)
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

- Schema: [packages/db/prisma/schema.prisma#L6946](../packages/db/prisma/schema.prisma#L6946)
- Classification: `core`
- Direct Prisma usage: 1 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 11 matches
  - `runtime-libraries`: 1 files / 11 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 12 matches
  - `generated`: 8 files / 208 matches
  - `zod`: 1 files / 1 matches
  - `other`: 4 files / 10 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (22 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (7 matches)
  - [packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql](../packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql) (5 matches)
  - [packages/db/src/generated/prisma/models/TaskEdge.ts](../packages/db/src/generated/prisma/models/TaskEdge.ts) (171 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/models/Task.ts](../packages/db/src/generated/prisma/models/Task.ts) (4 matches)
- Notes:
  - none

### TaskExecutionAttempt

- Schema: [packages/db/prisma/schema.prisma#L6009](../packages/db/prisma/schema.prisma#L6009)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 11 matches
  - `migrations`: 1 files / 26 matches
  - `generated`: 17 files / 400 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (11 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (26 matches)
  - [packages/db/src/generated/prisma/models/TaskExecutionAttempt.ts](../packages/db/src/generated/prisma/models/TaskExecutionAttempt.ts) (331 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (39 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
- Notes:
  - none

### TaskFundingEvent

- Schema: [packages/db/prisma/schema.prisma#L6452](../packages/db/prisma/schema.prisma#L6452)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 2 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 2 matches
  - `runtime-libraries`: 1 files / 2 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 2 files / 8 matches
  - `generated`: 10 files / 206 matches
  - `zod`: 1 files / 1 matches
  - `other`: 5 files / 15 matches
- Key files:
  - [packages/web/src/lib/task-funding/pledges.server.ts](../packages/web/src/lib/task-funding/pledges.server.ts) (4 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (6 matches)
  - [packages/db/prisma/migrations/20260521184500_add_task_funding_event_deleted_at/migration.sql](../packages/db/prisma/migrations/20260521184500_add_task_funding_event_deleted_at/migration.sql) (2 matches)
  - [packages/db/src/generated/prisma/models/TaskFundingEvent.ts](../packages/db/src/generated/prisma/models/TaskFundingEvent.ts) (165 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### TaskFundingPledge

- Schema: [packages/db/prisma/schema.prisma#L6402](../packages/db/prisma/schema.prisma#L6402)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 7 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 7 matches
  - `runtime-libraries`: 2 files / 10 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 1 files / 15 matches
  - `generated`: 14 files / 367 matches
  - `zod`: 1 files / 1 matches
  - `other`: 5 files / 24 matches
- Key files:
  - [packages/web/src/lib/task-funding/pledges.server.ts](../packages/web/src/lib/task-funding/pledges.server.ts) (11 matches)
  - [packages/web/src/lib/task-funding/status.server.ts](../packages/web/src/lib/task-funding/status.server.ts) (6 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (9 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (15 matches)
  - [packages/db/src/generated/prisma/models/TaskFundingPledge.ts](../packages/db/src/generated/prisma/models/TaskFundingPledge.ts) (306 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (35 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
- Notes:
  - none

### TaskFundingTarget

- Schema: [packages/db/prisma/schema.prisma#L6374](../packages/db/prisma/schema.prisma#L6374)
- Classification: `runtime-live`
- Direct Prisma usage: 4 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 6 matches
  - `api-routes`: 1 files / 1 matches
  - `runtime-libraries`: 3 files / 6 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 9 files / 238 matches
  - `zod`: 1 files / 1 matches
  - `other`: 7 files / 27 matches
- Key files:
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (5 matches)
  - [packages/web/src/lib/task-funding/pledges.server.ts](../packages/web/src/lib/task-funding/pledges.server.ts) (4 matches)
  - [packages/web/src/app/api/tasks/[id]/pledge/route.ts](../packages/web/src/app/api/tasks/[id]/pledge/route.ts) (2 matches)
  - [packages/web/src/lib/task-funding/status.server.ts](../packages/web/src/lib/task-funding/status.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
  - [packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql](../packages/db/prisma/migrations/20260520181737_add_task_funding_primitive/migration.sql) (6 matches)
  - [packages/db/src/generated/prisma/models/TaskFundingTarget.ts](../packages/db/src/generated/prisma/models/TaskFundingTarget.ts) (197 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (27 matches)
- Notes:
  - none

### TaskImpactEstimateSet

- Schema: [packages/db/prisma/schema.prisma#L7006](../packages/db/prisma/schema.prisma#L7006)
- Classification: `core`
- Direct Prisma usage: 4 files / 14 matches
- Usage counts by bucket:
  - `runtime-prisma`: 4 files / 14 matches
  - `runtime-libraries`: 4 files / 14 matches
  - `docs`: 3 files / 3 matches
  - `schema`: 1 files / 5 matches
  - `migrations`: 2 files / 13 matches
  - `generated`: 8 files / 220 matches
  - `zod`: 1 files / 1 matches
  - `other`: 5 files / 7 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (10 matches)
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (10 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (4 matches)
  - [packages/web/src/lib/tasks/per-verified-voter-impact.server.ts](../packages/web/src/lib/tasks/per-verified-voter-impact.server.ts) (4 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [docs/shirt-distribution-thesis-2026-05-20.md](../docs/shirt-distribution-thesis-2026-05-20.md) (1 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (5 matches)
- Notes:
  - none

### TaskImpactFrameEstimate

- Schema: [packages/db/prisma/schema.prisma#L7063](../packages/db/prisma/schema.prisma#L7063)
- Classification: `core`
- Direct Prisma usage: 5 files / 7 matches
- Usage counts by bucket:
  - `runtime-prisma`: 5 files / 7 matches
  - `runtime-libraries`: 5 files / 7 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 8 files / 337 matches
  - `zod`: 1 files / 1 matches
  - `other`: 4 files / 5 matches
- Key files:
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (6 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/per-verified-voter-impact.server.ts](../packages/web/src/lib/tasks/per-verified-voter-impact.server.ts) (2 matches)
  - [packages/web/src/lib/tasks/wishonia-task-reply.server.ts](../packages/web/src/lib/tasks/wishonia-task-reply.server.ts) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
- Notes:
  - none

### TaskImpactMetric

- Schema: [packages/db/prisma/schema.prisma#L7197](../packages/db/prisma/schema.prisma#L7197)
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
  - `other`: 2 files / 6 matches
- Key files:
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (4 matches)
  - [packages/web/src/lib/tasks/per-verified-voter-impact.server.ts](../packages/web/src/lib/tasks/per-verified-voter-impact.server.ts) (4 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (2 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (2 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (2 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (6 matches)
- Notes:
  - none

### TaskImpactSourceArtifact

- Schema: [packages/db/prisma/schema.prisma#L7250](../packages/db/prisma/schema.prisma#L7250)
- Classification: `core`
- Direct Prisma usage: 1 files / 3 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 3 matches
  - `runtime-libraries`: 1 files / 3 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 7 matches
  - `generated`: 9 files / 158 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (6 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (7 matches)
  - [packages/db/src/generated/prisma/models/TaskImpactSourceArtifact.ts](../packages/db/src/generated/prisma/models/TaskImpactSourceArtifact.ts) (121 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### TaskManager

- Schema: [packages/db/prisma/schema.prisma#L5819](../packages/db/prisma/schema.prisma#L5819)
- Classification: `runtime-live`
- Direct Prisma usage: 1 files / 1 matches
- Usage counts by bucket:
  - `runtime-prisma`: 1 files / 1 matches
  - `runtime-libraries`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 9 matches
  - `generated`: 9 files / 187 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/task-applications.server.ts](../packages/web/src/lib/task-applications.server.ts) (2 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (4 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (9 matches)
  - [packages/db/src/generated/prisma/models/TaskManager.ts](../packages/db/src/generated/prisma/models/TaskManager.ts) (146 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (25 matches)
  - [packages/db/src/generated/prisma/models/User.ts](../packages/db/src/generated/prisma/models/User.ts) (4 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
- Notes:
  - none

### TaskMarketplaceListing

- Schema: [packages/db/prisma/schema.prisma#L6130](../packages/db/prisma/schema.prisma#L6130)
- Classification: `generated-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `schema`: 1 files / 6 matches
  - `migrations`: 1 files / 15 matches
  - `generated`: 12 files / 270 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
  - [packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql](../packages/db/prisma/migrations/20260614120000_add_task_applications/migration.sql) (15 matches)
  - [packages/db/src/generated/prisma/models/TaskMarketplaceListing.ts](../packages/db/src/generated/prisma/models/TaskMarketplaceListing.ts) (221 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (29 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespace.ts](../packages/db/src/generated/prisma/internal/prismaNamespace.ts) (3 matches)
  - [packages/db/src/generated/prisma/browser.ts](../packages/db/src/generated/prisma/browser.ts) (2 matches)
  - [packages/db/src/generated/prisma/client.ts](../packages/db/src/generated/prisma/client.ts) (2 matches)
  - [packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts](../packages/db/src/generated/prisma/internal/prismaNamespaceBrowser.ts) (2 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### TaskSourceArtifact

- Schema: [packages/db/prisma/schema.prisma#L6916](../packages/db/prisma/schema.prisma#L6916)
- Classification: `core`
- Direct Prisma usage: 2 files / 5 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 5 matches
  - `runtime-libraries`: 1 files / 3 matches
  - `scripts`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 2 files / 10 matches
  - `generated`: 9 files / 158 matches
  - `zod`: 1 files / 1 matches
- Key files:
  - [packages/web/src/lib/tasks/import-task-bundle.server.ts](../packages/web/src/lib/tasks/import-task-bundle.server.ts) (6 matches)
  - [packages/web/scripts/extract-tasks-from-manual.ts](../packages/web/scripts/extract-tasks-from-manual.ts) (4 matches)
  - [docs/TASK_MODEL.md](../docs/TASK_MODEL.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (3 matches)
  - [packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql](../packages/db/prisma/migrations/20260409212751_task_schema_freeze/migration.sql) (7 matches)
  - [packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql](../packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql) (3 matches)
  - [packages/db/src/generated/prisma/models/TaskSourceArtifact.ts](../packages/db/src/generated/prisma/models/TaskSourceArtifact.ts) (121 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (23 matches)
- Notes:
  - none

### TaskSpawnSpec

- Schema: [packages/db/prisma/schema.prisma#L7725](../packages/db/prisma/schema.prisma#L7725)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 4 matches
  - `runtime-libraries`: 6 files / 8 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 2 matches
  - `migrations`: 2 files / 5 matches
  - `generated`: 8 files / 264 matches
  - `other`: 2 files / 17 matches
- Key files:
  - [packages/db/src/managed-data/managed-task-triggers.ts](../packages/db/src/managed-data/managed-task-triggers.ts) (4 matches)
  - [packages/web/src/lib/triggers/admin.ts](../packages/web/src/lib/triggers/admin.ts) (4 matches)
  - [packages/web/src/lib/triggers/completion-gate.ts](../packages/web/src/lib/triggers/completion-gate.ts) (1 matches)
  - [packages/web/src/lib/triggers/fire-types.ts](../packages/web/src/lib/triggers/fire-types.ts) (1 matches)
  - [packages/web/src/lib/triggers/fire.ts](../packages/web/src/lib/triggers/fire.ts) (1 matches)
  - [packages/web/src/lib/triggers/resolvers.ts](../packages/web/src/lib/triggers/resolvers.ts) (1 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
- Notes:
  - none

### TaskTrigger

- Schema: [packages/db/prisma/schema.prisma#L7621](../packages/db/prisma/schema.prisma#L7621)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 11 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 11 matches
  - `api-routes`: 1 files / 3 matches
  - `runtime-libraries`: 13 files / 28 matches
  - `scripts`: 1 files / 1 matches
  - `tests`: 1 files / 2 matches
  - `docs`: 2 files / 3 matches
  - `schema`: 1 files / 9 matches
  - `migrations`: 3 files / 14 matches
  - `generated`: 11 files / 265 matches
  - `other`: 3 files / 12 matches
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

- Schema: [packages/db/prisma/schema.prisma#L7898](../packages/db/prisma/schema.prisma#L7898)
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
  - `other`: 2 files / 10 matches
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

### TrackingReminder

- Schema: [packages/db/prisma/schema.prisma#L2809](../packages/db/prisma/schema.prisma#L2809)
- Classification: `tests-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `tests`: 1 files / 1 matches
  - `docs`: 2 files / 2 matches
  - `schema`: 1 files / 7 matches
  - `migrations`: 2 files / 9 matches
  - `generated`: 10 files / 223 matches
  - `zod`: 1 files / 1 matches
  - `other`: 3 files / 14 matches
- Key files:
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [docs/MCP_SERVER.md](../docs/MCP_SERVER.md) (1 matches)
  - [docs/PREVIEW_DATA_PRIVACY.md](../docs/PREVIEW_DATA_PRIVACY.md) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (7 matches)
  - [packages/db/prisma/migrations/20260311211431_init/migration.sql](../packages/db/prisma/migrations/20260311211431_init/migration.sql) (8 matches)
  - [packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql](../packages/db/prisma/migrations/20260318010000_schema_structural_improvements/migration.sql) (1 matches)
  - [packages/db/src/generated/prisma/models/TrackingReminder.ts](../packages/db/src/generated/prisma/models/TrackingReminder.ts) (178 matches)
  - [packages/db/src/generated/prisma/internal/class.ts](../packages/db/src/generated/prisma/internal/class.ts) (28 matches)
- Notes:
  - No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.

### TrackingReminderNotification

- Schema: [packages/db/prisma/schema.prisma#L2877](../packages/db/prisma/schema.prisma#L2877)
- Classification: `tests-only`
- Direct Prisma usage: 0 files / 0 matches
- Usage counts by bucket:
  - `tests`: 1 files / 2 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 4 matches
  - `migrations`: 1 files / 5 matches
  - `generated`: 8 files / 184 matches
  - `zod`: 1 files / 1 matches
  - `other`: 2 files / 10 matches
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

- Schema: [packages/db/prisma/schema.prisma#L2059](../packages/db/prisma/schema.prisma#L2059)
- Classification: `runtime-live`
- Direct Prisma usage: 3 files / 4 matches
- Usage counts by bucket:
  - `runtime-prisma`: 3 files / 4 matches
  - `api-routes`: 1 files / 2 matches
  - `components`: 1 files / 1 matches
  - `runtime-libraries`: 24 files / 33 matches
  - `tests`: 3 files / 5 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 24 matches
  - `migrations`: 2 files / 13 matches
  - `generated`: 17 files / 288 matches
  - `zod`: 1 files / 1 matches
  - `other`: 6 files / 12 matches
- Key files:
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (4 matches)
  - [packages/web/src/app/api/health-analysis/submit/route.ts](../packages/web/src/app/api/health-analysis/submit/route.ts) (3 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (2 matches)
  - [packages/web/src/components/task-funding/TaskFundingProgress.tsx](../packages/web/src/components/task-funding/TaskFundingProgress.tsx) (1 matches)
  - [packages/data/src/measurement-validation.ts](../packages/data/src/measurement-validation.ts) (3 matches)
  - [packages/data/src/datasets/medical-data/treatments/covid-19.json](../packages/data/src/datasets/medical-data/treatments/covid-19.json) (2 matches)
  - [packages/data/src/importers/standard-variable-names.ts](../packages/data/src/importers/standard-variable-names.ts) (2 matches)
  - [packages/data/src/unit-conversion.ts](../packages/data/src/unit-conversion.ts) (2 matches)
- Notes:
  - none

### User

- Schema: [packages/db/prisma/schema.prisma#L1575](../packages/db/prisma/schema.prisma#L1575)
- Classification: `core`
- Direct Prisma usage: 64 files / 102 matches
- Usage counts by bucket:
  - `runtime-prisma`: 64 files / 102 matches
  - `api-routes`: 14 files / 20 matches
  - `pages`: 3 files / 5 matches
  - `components`: 4 files / 5 matches
  - `runtime-libraries`: 67 files / 146 matches
  - `scripts`: 5 files / 24 matches
  - `tests`: 21 files / 42 matches
  - `docs`: 6 files / 20 matches
  - `schema`: 1 files / 124 matches
  - `migrations`: 28 files / 182 matches
  - `generated`: 53 files / 1192 matches
  - `zod`: 1 files / 1 matches
  - `other`: 34 files / 186 matches
- Key files:
  - [packages/web/scripts/import-dih-users-votes.ts](../packages/web/scripts/import-dih-users-votes.ts) (20 matches)
  - [packages/web/src/lib/mcp-server.ts](../packages/web/src/lib/mcp-server.ts) (18 matches)
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (12 matches)
  - [packages/web/src/lib/person.server.ts](../packages/web/src/lib/person.server.ts) (9 matches)
  - [packages/web/src/lib/profile-identity.server.ts](../packages/web/src/lib/profile-identity.server.ts) (9 matches)
  - [packages/web/src/lib/email/suppression.server.ts](../packages/web/src/lib/email/suppression.server.ts) (8 matches)
  - [packages/web/src/lib/dashboard.server.ts](../packages/web/src/lib/dashboard.server.ts) (7 matches)
  - [packages/db/src/managed-data/managed-demo-user.ts](../packages/db/src/managed-data/managed-demo-user.ts) (6 matches)
- Notes:
  - none

### UserPreference

- Schema: [packages/db/prisma/schema.prisma#L4365](../packages/db/prisma/schema.prisma#L4365)
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

- Schema: [packages/db/prisma/schema.prisma#L2127](../packages/db/prisma/schema.prisma#L2127)
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
  - `other`: 2 files / 5 matches
- Key files:
  - [packages/web/src/lib/profile.server.ts](../packages/web/src/lib/profile.server.ts) (6 matches)
  - [packages/db/src/managed-data/managed-seed-data.ts](../packages/db/src/managed-data/managed-seed-data.ts) (4 matches)
  - [packages/web/src/app/api/health-analysis/submit/route.ts](../packages/web/src/app/api/health-analysis/submit/route.ts) (3 matches)
  - [packages/web/src/lib/earth-data.server.ts](../packages/web/src/lib/earth-data.server.ts) (2 matches)
  - [packages/data/src/importers/standard-variable-names.ts](../packages/data/src/importers/standard-variable-names.ts) (2 matches)
  - [packages/data/src/variable-registry.ts](../packages/data/src/variable-registry.ts) (1 matches)
  - [packages/db/src/__tests__/zod-validators.test.ts](../packages/db/src/__tests__/zod-validators.test.ts) (1 matches)
  - [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma) (6 matches)
- Notes:
  - none

### VariableRelationshipEvidenceEstimate

- Schema: [packages/db/prisma/schema.prisma#L3308](../packages/db/prisma/schema.prisma#L3308)
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

- Schema: [packages/db/prisma/schema.prisma#L1969](../packages/db/prisma/schema.prisma#L1969)
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
  - `other`: 3 files / 13 matches
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

- Schema: [packages/db/prisma/schema.prisma#L4325](../packages/db/prisma/schema.prisma#L4325)
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
  - `other`: 2 files / 10 matches
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

- Schema: [packages/db/prisma/schema.prisma#L3941](../packages/db/prisma/schema.prisma#L3941)
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
  - `other`: 1 files / 5 matches
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

- Schema: [packages/db/prisma/schema.prisma#L5242](../packages/db/prisma/schema.prisma#L5242)
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

- Schema: [packages/db/prisma/schema.prisma#L4406](../packages/db/prisma/schema.prisma#L4406)
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
  - `other`: 2 files / 5 matches
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

- Schema: [packages/db/prisma/schema.prisma#L3718](../packages/db/prisma/schema.prisma#L3718)
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

- Schema: [packages/db/prisma/schema.prisma#L4238](../packages/db/prisma/schema.prisma#L4238)
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

- Schema: [packages/db/prisma/schema.prisma#L3985](../packages/db/prisma/schema.prisma#L3985)
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
  - `other`: 1 files / 3 matches
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

- Schema: [packages/db/prisma/schema.prisma#L8181](../packages/db/prisma/schema.prisma#L8181)
- Classification: `runtime-live`
- Direct Prisma usage: 2 files / 6 matches
- Usage counts by bucket:
  - `runtime-prisma`: 2 files / 6 matches
  - `runtime-libraries`: 2 files / 9 matches
  - `docs`: 1 files / 1 matches
  - `schema`: 1 files / 3 matches
  - `migrations`: 1 files / 6 matches
  - `generated`: 9 files / 173 matches
  - `other`: 2 files / 3 matches
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
| ActivityType | [packages/db/prisma/schema.prisma#L309](../packages/db/prisma/schema.prisma#L309) | 24 | 121 |
| AgentExecutorStatus | [packages/db/prisma/schema.prisma#L556](../packages/db/prisma/schema.prisma#L556) | 8 | 64 |
| AnalysisStatus | [packages/db/prisma/schema.prisma#L100](../packages/db/prisma/schema.prisma#L100) | 10 | 197 |
| BadgeType | [packages/db/prisma/schema.prisma#L422](../packages/db/prisma/schema.prisma#L422) | 11 | 78 |
| CombinationOperation | [packages/db/prisma/schema.prisma#L54](../packages/db/prisma/schema.prisma#L54) | 20 | 368 |
| CommerceEntitlementStatus | [packages/db/prisma/schema.prisma#L9035](../packages/db/prisma/schema.prisma#L9035) | 8 | 78 |
| CommerceFulfillmentKind | [packages/db/prisma/schema.prisma#L8996](../packages/db/prisma/schema.prisma#L8996) | 15 | 190 |
| CommerceFulfillmentProvider | [packages/db/prisma/schema.prisma#L9008](../packages/db/prisma/schema.prisma#L9008) | 13 | 101 |
| CommerceFulfillmentStatus | [packages/db/prisma/schema.prisma#L9026](../packages/db/prisma/schema.prisma#L9026) | 10 | 72 |
| CommerceOfferKind | [packages/db/prisma/schema.prisma#L8981](../packages/db/prisma/schema.prisma#L8981) | 14 | 87 |
| CommerceOfferStatus | [packages/db/prisma/schema.prisma#L8990](../packages/db/prisma/schema.prisma#L8990) | 15 | 86 |
| CommerceOrderStatus | [packages/db/prisma/schema.prisma#L9015](../packages/db/prisma/schema.prisma#L9015) | 11 | 72 |
| CommercePaymentProvider | [packages/db/prisma/schema.prisma#L9003](../packages/db/prisma/schema.prisma#L9003) | 9 | 64 |
| ConfidenceLevel | [packages/db/prisma/schema.prisma#L121](../packages/db/prisma/schema.prisma#L121) | 10 | 101 |
| ContentReportStatus | [packages/db/prisma/schema.prisma#L932](../packages/db/prisma/schema.prisma#L932) | 10 | 68 |
| CourtCaseItemStatus | [packages/db/prisma/schema.prisma#L4486](../packages/db/prisma/schema.prisma#L4486) | 13 | 258 |
| CourtCasePartyCapacity | [packages/db/prisma/schema.prisma#L4477](../packages/db/prisma/schema.prisma#L4477) | 10 | 76 |
| CourtCasePartyRole | [packages/db/prisma/schema.prisma#L4467](../packages/db/prisma/schema.prisma#L4467) | 15 | 97 |
| CourtCaseStatus | [packages/db/prisma/schema.prisma#L4458](../packages/db/prisma/schema.prisma#L4458) | 12 | 116 |
| DatingBlockScope | [packages/db/prisma/schema.prisma#L8507](../packages/db/prisma/schema.prisma#L8507) | 10 | 82 |
| DatingConversationStatus | [packages/db/prisma/schema.prisma#L8485](../packages/db/prisma/schema.prisma#L8485) | 9 | 65 |
| DatingDatePlanStatus | [packages/db/prisma/schema.prisma#L8498](../packages/db/prisma/schema.prisma#L8498) | 8 | 84 |
| DatingInteractionKind | [packages/db/prisma/schema.prisma#L8466](../packages/db/prisma/schema.prisma#L8466) | 11 | 73 |
| DatingInteractionStatus | [packages/db/prisma/schema.prisma#L8473](../packages/db/prisma/schema.prisma#L8473) | 9 | 65 |
| DatingMatchStatus | [packages/db/prisma/schema.prisma#L8479](../packages/db/prisma/schema.prisma#L8479) | 9 | 77 |
| DatingMessageStatus | [packages/db/prisma/schema.prisma#L8491](../packages/db/prisma/schema.prisma#L8491) | 8 | 66 |
| DatingPreferenceImportance | [packages/db/prisma/schema.prisma#L8461](../packages/db/prisma/schema.prisma#L8461) | 8 | 56 |
| DatingProfilePhotoStatus | [packages/db/prisma/schema.prisma#L8435](../packages/db/prisma/schema.prisma#L8435) | 10 | 68 |
| DatingProfileStatus | [packages/db/prisma/schema.prisma#L8416](../packages/db/prisma/schema.prisma#L8416) | 11 | 134 |
| DatingQuestionAnswerVisibility | [packages/db/prisma/schema.prisma#L8448](../packages/db/prisma/schema.prisma#L8448) | 9 | 65 |
| DatingQuestionImportance | [packages/db/prisma/schema.prisma#L8453](../packages/db/prisma/schema.prisma#L8453) | 10 | 68 |
| DatingQuestionStatus | [packages/db/prisma/schema.prisma#L8442](../packages/db/prisma/schema.prisma#L8442) | 10 | 58 |
| DatingRelationshipIntent | [packages/db/prisma/schema.prisma#L8425](../packages/db/prisma/schema.prisma#L8425) | 11 | 134 |
| DatingSafetyReportStatus | [packages/db/prisma/schema.prisma#L8513](../packages/db/prisma/schema.prisma#L8513) | 8 | 80 |
| EfficacyLagEvidenceStatus | [packages/db/prisma/schema.prisma#L238](../packages/db/prisma/schema.prisma#L238) | 10 | 80 |
| EmailLogStatus | [packages/db/prisma/schema.prisma#L948](../packages/db/prisma/schema.prisma#L948) | 15 | 99 |
| EvidenceGrade | [packages/db/prisma/schema.prisma#L135](../packages/db/prisma/schema.prisma#L135) | 22 | 189 |
| FillingType | [packages/db/prisma/schema.prisma#L60](../packages/db/prisma/schema.prisma#L60) | 21 | 444 |
| InterventionExperienceStatus | [packages/db/prisma/schema.prisma#L245](../packages/db/prisma/schema.prisma#L245) | 9 | 97 |
| InterventionOutcomeRating | [packages/db/prisma/schema.prisma#L254](../packages/db/prisma/schema.prisma#L254) | 9 | 83 |
| InterventionRankingRunStatus | [packages/db/prisma/schema.prisma#L303](../packages/db/prisma/schema.prisma#L303) | 9 | 69 |
| InterventionSideEffectSeverity | [packages/db/prisma/schema.prisma#L264](../packages/db/prisma/schema.prisma#L264) | 9 | 65 |
| JurisdictionType | [packages/db/prisma/schema.prisma#L153](../packages/db/prisma/schema.prisma#L153) | 16 | 160 |
| McpScope | [packages/db/prisma/schema.prisma#L911](../packages/db/prisma/schema.prisma#L911) | 20 | 325 |
| McpToolCallStatus | [packages/db/prisma/schema.prisma#L926](../packages/db/prisma/schema.prisma#L926) | 9 | 73 |
| MeasurementScale | [packages/db/prisma/schema.prisma#L82](../packages/db/prisma/schema.prisma#L82) | 11 | 128 |
| NotificationChannel | [packages/db/prisma/schema.prisma#L371](../packages/db/prisma/schema.prisma#L371) | 8 | 57 |
| NotificationStatus | [packages/db/prisma/schema.prisma#L144](../packages/db/prisma/schema.prisma#L144) | 9 | 57 |
| NotificationType | [packages/db/prisma/schema.prisma#L358](../packages/db/prisma/schema.prisma#L358) | 10 | 87 |
| OrganizationReferendumPositionStatus | [packages/db/prisma/schema.prisma#L405](../packages/db/prisma/schema.prisma#L405) | 21 | 124 |
| OrgStatus | [packages/db/prisma/schema.prisma#L398](../packages/db/prisma/schema.prisma#L398) | 38 | 221 |
| OrgType | [packages/db/prisma/schema.prisma#L379](../packages/db/prisma/schema.prisma#L379) | 38 | 214 |
| PersonCivilianStatus | [packages/db/prisma/schema.prisma#L220](../packages/db/prisma/schema.prisma#L220) | 13 | 106 |
| PersonConditionStatus | [packages/db/prisma/schema.prisma#L201](../packages/db/prisma/schema.prisma#L201) | 18 | 106 |
| PersonDeathCauseCategory | [packages/db/prisma/schema.prisma#L209](../packages/db/prisma/schema.prisma#L209) | 18 | 149 |
| PersonhoodProvider | [packages/db/prisma/schema.prisma#L181](../packages/db/prisma/schema.prisma#L181) | 14 | 86 |
| PersonhoodVerificationStatus | [packages/db/prisma/schema.prisma#L187](../packages/db/prisma/schema.prisma#L187) | 16 | 86 |
| PersonLifeStatus | [packages/db/prisma/schema.prisma#L194](../packages/db/prisma/schema.prisma#L194) | 34 | 240 |
| PersonMemorialEvidenceKind | [packages/db/prisma/schema.prisma#L227](../packages/db/prisma/schema.prisma#L227) | 15 | 112 |
| PointMintStatus | [packages/db/prisma/schema.prisma#L5114](../packages/db/prisma/schema.prisma#L5114) | 10 | 67 |
| QuestionType | [packages/db/prisma/schema.prisma#L939](../packages/db/prisma/schema.prisma#L939) | 8 | 60 |
| ReasoningBanditLevel | [packages/db/prisma/schema.prisma#L9676](../packages/db/prisma/schema.prisma#L9676) | 8 | 85 |
| ReasoningGeneratorKind | [packages/db/prisma/schema.prisma#L9685](../packages/db/prisma/schema.prisma#L9685) | 9 | 117 |
| ReasoningOutcomeKind | [packages/db/prisma/schema.prisma#L9691](../packages/db/prisma/schema.prisma#L9691) | 7 | 48 |
| ReasoningRiskTier | [packages/db/prisma/schema.prisma#L9670](../packages/db/prisma/schema.prisma#L9670) | 10 | 132 |
| ReasoningVariantFamily | [packages/db/prisma/schema.prisma#L9707](../packages/db/prisma/schema.prisma#L9707) | 7 | 75 |
| ReasoningVariantSlot | [packages/db/prisma/schema.prisma#L9660](../packages/db/prisma/schema.prisma#L9660) | 17 | 322 |
| ReasoningVariantStatus | [packages/db/prisma/schema.prisma#L9652](../packages/db/prisma/schema.prisma#L9652) | 11 | 193 |
| ReferendumKind | [packages/db/prisma/schema.prisma#L4447](../packages/db/prisma/schema.prisma#L4447) | 17 | 124 |
| ReferendumStatus | [packages/db/prisma/schema.prisma#L4439](../packages/db/prisma/schema.prisma#L4439) | 22 | 137 |
| ReferendumVoteSource | [packages/db/prisma/schema.prisma#L4274](../packages/db/prisma/schema.prisma#L4274) | 16 | 121 |
| ReferralAnswer | [packages/db/prisma/schema.prisma#L175](../packages/db/prisma/schema.prisma#L175) | 11 | 64 |
| ReferralInvitationContactMethod | [packages/db/prisma/schema.prisma#L350](../packages/db/prisma/schema.prisma#L350) | 12 | 120 |
| ReferralInvitationMessageFormat | [packages/db/prisma/schema.prisma#L344](../packages/db/prisma/schema.prisma#L344) | 14 | 116 |
| ReferralInvitationStatus | [packages/db/prisma/schema.prisma#L334](../packages/db/prisma/schema.prisma#L334) | 15 | 122 |
| RelationshipDirection | [packages/db/prisma/schema.prisma#L128](../packages/db/prisma/schema.prisma#L128) | 10 | 101 |
| ShareSource | [packages/db/prisma/schema.prisma#L328](../packages/db/prisma/schema.prisma#L328) | 10 | 92 |
| SocialPlatform | [packages/db/prisma/schema.prisma#L412](../packages/db/prisma/schema.prisma#L412) | 11 | 68 |
| SourceArtifactType | [packages/db/prisma/schema.prisma#L746](../packages/db/prisma/schema.prisma#L746) | 16 | 116 |
| SourceSystem | [packages/db/prisma/schema.prisma#L735](../packages/db/prisma/schema.prisma#L735) | 17 | 164 |
| StrengthLevel | [packages/db/prisma/schema.prisma#L112](../packages/db/prisma/schema.prisma#L112) | 10 | 101 |
| SubjectType | [packages/db/prisma/schema.prisma#L161](../packages/db/prisma/schema.prisma#L161) | 14 | 128 |
| TaskApplicationEventType | [packages/db/prisma/schema.prisma#L676](../packages/db/prisma/schema.prisma#L676) | 10 | 73 |
| TaskApplicationPolicy | [packages/db/prisma/schema.prisma#L655](../packages/db/prisma/schema.prisma#L655) | 8 | 188 |
| TaskApplicationStatus | [packages/db/prisma/schema.prisma#L662](../packages/db/prisma/schema.prisma#L662) | 13 | 236 |
| TaskCandidateKind | [packages/db/prisma/schema.prisma#L529](../packages/db/prisma/schema.prisma#L529) | 10 | 172 |
| TaskCandidateMatchStatus | [packages/db/prisma/schema.prisma#L538](../packages/db/prisma/schema.prisma#L538) | 8 | 90 |
| TaskCategory | [packages/db/prisma/schema.prisma#L457](../packages/db/prisma/schema.prisma#L457) | 44 | 352 |
| TaskClaimPolicy | [packages/db/prisma/schema.prisma#L625](../packages/db/prisma/schema.prisma#L625) | 46 | 354 |
| TaskClaimStatus | [packages/db/prisma/schema.prisma#L688](../packages/db/prisma/schema.prisma#L688) | 11 | 97 |
| TaskCommentKind | [packages/db/prisma/schema.prisma#L885](../packages/db/prisma/schema.prisma#L885) | 22 | 140 |
| TaskCommentSource | [packages/db/prisma/schema.prisma#L900](../packages/db/prisma/schema.prisma#L900) | 21 | 139 |
| TaskCommentVisibility | [packages/db/prisma/schema.prisma#L894](../packages/db/prisma/schema.prisma#L894) | 8 | 104 |
| TaskCommunicationAudience | [packages/db/prisma/schema.prisma#L786](../packages/db/prisma/schema.prisma#L786) | 14 | 176 |
| TaskCommunicationChannel | [packages/db/prisma/schema.prisma#L841](../packages/db/prisma/schema.prisma#L841) | 15 | 149 |
| TaskCommunicationDirection | [packages/db/prisma/schema.prisma#L835](../packages/db/prisma/schema.prisma#L835) | 11 | 136 |
| TaskCommunicationEndpointKind | [packages/db/prisma/schema.prisma#L866](../packages/db/prisma/schema.prisma#L866) | 13 | 88 |
| TaskCommunicationEndpointVerificationStatus | [packages/db/prisma/schema.prisma#L877](../packages/db/prisma/schema.prisma#L877) | 12 | 74 |
| TaskCommunicationFormat | [packages/db/prisma/schema.prisma#L828](../packages/db/prisma/schema.prisma#L828) | 10 | 164 |
| TaskCommunicationPurpose | [packages/db/prisma/schema.prisma#L798](../packages/db/prisma/schema.prisma#L798) | 14 | 182 |
| TaskCommunicationStatus | [packages/db/prisma/schema.prisma#L852](../packages/db/prisma/schema.prisma#L852) | 16 | 164 |
| TaskCompensationCadence | [packages/db/prisma/schema.prisma#L505](../packages/db/prisma/schema.prisma#L505) | 9 | 189 |
| TaskCompensationKind | [packages/db/prisma/schema.prisma#L495](../packages/db/prisma/schema.prisma#L495) | 9 | 191 |
| TaskDeadlinePolicy | [packages/db/prisma/schema.prisma#L643](../packages/db/prisma/schema.prisma#L643) | 11 | 207 |
| TaskDifficulty | [packages/db/prisma/schema.prisma#L448](../packages/db/prisma/schema.prisma#L448) | 41 | 672 |
| TaskDistributionAttemptStatus | [packages/db/prisma/schema.prisma#L614](../packages/db/prisma/schema.prisma#L614) | 8 | 92 |
| TaskDistributionChannel | [packages/db/prisma/schema.prisma#L586](../packages/db/prisma/schema.prisma#L586) | 9 | 122 |
| TaskDistributionOperation | [packages/db/prisma/schema.prisma#L599](../packages/db/prisma/schema.prisma#L599) | 8 | 92 |
| TaskDistributionTargetStatus | [packages/db/prisma/schema.prisma#L607](../packages/db/prisma/schema.prisma#L607) | 8 | 60 |
| TaskEdgeType | [packages/db/prisma/schema.prisma#L698](../packages/db/prisma/schema.prisma#L698) | 9 | 80 |
| TaskEngagementKind | [packages/db/prisma/schema.prisma#L486](../packages/db/prisma/schema.prisma#L486) | 8 | 188 |
| TaskExecutionAttemptStatus | [packages/db/prisma/schema.prisma#L546](../packages/db/prisma/schema.prisma#L546) | 9 | 115 |
| TaskExecutionMode | [packages/db/prisma/schema.prisma#L522](../packages/db/prisma/schema.prisma#L522) | 9 | 191 |
| TaskFundingEventType | [packages/db/prisma/schema.prisma#L725](../packages/db/prisma/schema.prisma#L725) | 12 | 82 |
| TaskFundingPledgerKind | [packages/db/prisma/schema.prisma#L712](../packages/db/prisma/schema.prisma#L712) | 17 | 127 |
| TaskFundingPledgeStatus | [packages/db/prisma/schema.prisma#L717](../packages/db/prisma/schema.prisma#L717) | 18 | 124 |
| TaskFundingTargetStatus | [packages/db/prisma/schema.prisma#L705](../packages/db/prisma/schema.prisma#L705) | 22 | 107 |
| TaskImpactEstimateKind | [packages/db/prisma/schema.prisma#L759](../packages/db/prisma/schema.prisma#L759) | 13 | 82 |
| TaskImpactFrameKey | [packages/db/prisma/schema.prisma#L774](../packages/db/prisma/schema.prisma#L774) | 29 | 140 |
| TaskImpactPublicationStatus | [packages/db/prisma/schema.prisma#L766](../packages/db/prisma/schema.prisma#L766) | 14 | 83 |
| TaskKind | [packages/db/prisma/schema.prisma#L472](../packages/db/prisma/schema.prisma#L472) | 8 | 188 |
| TaskMarketplaceFeePolicy | [packages/db/prisma/schema.prisma#L569](../packages/db/prisma/schema.prisma#L569) | 8 | 80 |
| TaskMarketplaceListingKind | [packages/db/prisma/schema.prisma#L563](../packages/db/prisma/schema.prisma#L563) | 8 | 80 |
| TaskMarketplaceListingStatus | [packages/db/prisma/schema.prisma#L576](../packages/db/prisma/schema.prisma#L576) | 8 | 80 |
| TaskRemotePolicy | [packages/db/prisma/schema.prisma#L514](../packages/db/prisma/schema.prisma#L514) | 9 | 191 |
| TaskStatus | [packages/db/prisma/schema.prisma#L635](../packages/db/prisma/schema.prisma#L635) | 60 | 463 |
| UnitCodeSystem | [packages/db/prisma/schema.prisma#L94](../packages/db/prisma/schema.prisma#L94) | 9 | 82 |
| Valence | [packages/db/prisma/schema.prisma#L72](../packages/db/prisma/schema.prisma#L72) | 13 | 286 |
| VariableEvidenceMetricKind | [packages/db/prisma/schema.prisma#L275](../packages/db/prisma/schema.prisma#L275) | 10 | 92 |
| VariableRelationshipEvidenceSourceType | [packages/db/prisma/schema.prisma#L292](../packages/db/prisma/schema.prisma#L292) | 10 | 92 |
| VotePosition | [packages/db/prisma/schema.prisma#L4267](../packages/db/prisma/schema.prisma#L4267) | 38 | 264 |
| WishReason | [packages/db/prisma/schema.prisma#L433](../packages/db/prisma/schema.prisma#L433) | 10 | 71 |
