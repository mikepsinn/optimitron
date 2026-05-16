# Preview Data Privacy

Vercel preview databases are production-shaped Neon branches. They must be
treated as unsafe until the `sync-preview-managed-data` GitHub Actions job has
run `packages/db/prisma/anonymization-setup.sql`, applied the generated
`packages/db/prisma/anonymization-updates.sql`, and verified sampled masked row
shapes.

The workflow fails closed. Missing Vercel preview env, SQL failures, or masking
verification failures fail the job before managed-data sync. Reviewers should
not treat a preview database as safe unless the CI summary says anonymization
and row-shape verification completed.

## Mechanism

1. The Preview job pulls branch-specific Vercel env with `vercel pull`.
2. It applies Prisma migrations to the preview database branch.
3. It runs `packages/db/prisma/anonymization-setup.sql` with `psql` to install
   `postgresql_anonymizer` and the local `public.dummy_safe_text()` helper.
4. It runs `packages/db/prisma/anonymization-updates.sql` with `psql`. This file
   is generated from `packages/db/prisma/anonymization-rules.sql` by
   `packages/db/scripts/generate-anonymization-updates.mjs`.
5. It runs `packages/web/scripts/verify-preview-masking.mjs`, which samples
   high-risk columns and asserts masked value shapes without logging sampled
   values.
6. It runs managed-data sync after masking. Managed data must remain public,
   synthetic, or campaign-system data only.

Do not weaken the failure behavior to best-effort masking.

## Mike Dashboard Tasks

- Keep `VERCEL_TOKEN` configured in the GitHub `Preview` environment so CI can
  pull branch-specific preview database env from Vercel.
- If preview masking fails, recreate or re-mask the preview branch before
  inspecting, screenshotting, or sharing preview-derived artifacts.

## Masked Columns

The source of truth is `packages/db/prisma/anonymization-rules.sql`. It masks
the columns below.

| Table | Columns | Rationale |
| --- | --- | --- |
| `Account` | `providerAccountId`, `refresh_token`, `access_token`, `scope`, `id_token`, `session_state`, `oauth_token_secret`, `oauth_token` | OAuth/provider identifiers and credentials. |
| `Activity` | `description`, `metadata` | User-specific activity text and context. |
| `AgentComputeDeposit` | `externalRef`, `memo` | Payment references and depositor notes. |
| `AgentRunCost` | `runId`, `outputSummary` | Agent run identifiers and output summaries. |
| `AgentTaskLease` | `agentId` | Caller-supplied agent identity. |
| `Badge` | `metadata` | User action context. |
| `CitizenBillVote` | `reasoning`, `shareIdentifier`, `cbaSnapshot` | Political reasoning and shareable identifiers. |
| `ContentReport` | `message`, `correctionJson`, `sourceUrl`, `resolutionNote` | Reporter notes, proposed corrections, and source links. |
| `CourtCase` | `title`, `summary`, `metadataJson` | Case captions and legal context can name humans. |
| `CourtCaseClaim` | `title`, `claimType`, `argumentMarkdown`, `requestedFinding`, `metadataJson` | Legal arguments and metadata. |
| `CourtCaseEvidence` | `evidenceKey`, `evidenceType`, `title`, `bodyMarkdown`, `sourceUrl`, `contentHash`, `metadataJson` | Evidence text, source links, and payload metadata. |
| `CourtCaseHarm` | `harmType`, `title`, `bodyMarkdown`, `unit`, `metadataJson` | Harm narratives and context. |
| `CourtCaseParty` | `partyKey`, `displayNameSnapshot`, `standingTheory`, `metadataJson` | Plaintiff/respondent snapshots and standing theories. |
| `CourtCaseRemedy` | `remedyKey`, `remedyType`, `title`, `bodyMarkdown`, `metadataJson` | Remedy text and metadata. |
| `EmailLog` | `toAddress`, `subject`, `providerMessageId`, `subjectTemplate`, `sendContext`, `errorMessage`, `dedupeKey` | Email recipient, provider, and render forensics. |
| `IntegrationConnection` | `accessToken`, `refreshToken`, `tokenExpiresAt`, `lastSyncAt`, `nextSyncAt`, `lastSyncError` | External integration secrets and sync diagnostics. |
| `IntegrationSyncLog` | `errorMessage` | Sync errors can contain raw provider context. |
| `InterventionExperience` | `status`, `startedAt`, `endedAt`, `doseValue`, `frequencyText`, `notes` | Personal health/intervention report data. |
| `InterventionExperienceOutcome` | `rating`, `value`, `publicComment` | Personal outcome report data. |
| `InterventionExperienceSideEffect` | `severity`, `onsetAt`, `resolvedAt`, `isSerious`, `actionTaken`, `publicComment` | Side-effect report data. |
| `McpToolCallAudit` | `agentId`, `runId`, `inputHash`, `inputSummaryJson`, `outputSummaryJson`, `errorSummary` | Tool-call identifiers, summaries, and errors. |
| `Measurement` | `startTime`, `value`, `originalValue`, `duration`, `note`, `sourceName`, `latitude`, `longitude` | Health/time-series values, notes, source, and location. |
| `NOf1Variable` | `fillingValue`, `minimumAllowedValue`, `maximumAllowedValue`, `numberOfMeasurements`, `latestMeasurementStartAt`, `earliestMeasurementStartAt`, `mean`, `median`, `standardDeviation`, `variance`, `kurtosis`, `skewness`, `minimumRecordedValue`, `maximumRecordedValue` | Per-subject health/statistical aggregates. |
| `Notification` | `title`, `message`, `link` | User-specific notifications and deep links. |
| `OAuthAuthCode` | `code`, `redirectUri`, `codeChallenge` | Short-lived OAuth credentials. |
| `OAuthClient` | `clientName`, `redirectUris`, `scope`, `clientUri` | Connected-app registration metadata. |
| `OAuthGrant` | `refreshTokenHash` | OAuth refresh-token lookup material. |
| `Organization` | `description`, `website`, `squareLogoUrl`, `wordmarkLogoUrl`, `donationUrl`, `sourceUrl`, `sourceRef`, `contactEmail` | Pending org submissions can contain personal contacts. |
| `OrganizationReferendumPosition` | `statement` | User-authored organization statement. |
| `Person` | `handle`, `displayName`, `firstName`, `middleName`, `lastName`, `email`, `image`, `bio`, `birthDate`, `deathDate`, `links`, `currentAffiliation`, `countryCode`, `headline`, `coverImage`, `website`, `sourceUrl`, `sourceRef` | Human identity, profile, and provenance data. |
| `PersonCondition` | `conditionName`, `conditionCodeSystem`, `conditionCode`, `status`, `sourceUrl` | Health/cause data tied to a human. |
| `PersonEfficacyLagEvidence` | `explanation` | Death/approval-lag explanation text. |
| `PersonhoodVerification` | `externalId`, `action`, `verificationLevel`, `signalHash`, `providerMetadata` | Proof-of-personhood identifiers and provider metadata. |
| `PersonMemorial` | `causeCategory`, `deathCountryCode`, `deathLocation`, `civilianStatus`, `wasChild`, `circumstances` | Death, location, and memorial context. |
| `PersonMemorialEvidence` | `title`, `description`, `sourceUrl` | Memorial evidence details and source links. |
| `PersonMemorialResponsibleParty` | `name`, `sourceUrl`, `privateNotes` | Attribution names and private notes. |
| `PersonMemorialSubmission` | `memorialMessage`, `consentPublicDisplayAt`, `consentCourtEvidenceAt` | Submitter testimony and consent timing. |
| `PersonRelationship` | `relationshipType` | Human relationship labels. |
| `PrizeTreasuryDeposit` | `depositorAddress`, `txHash` | Donor wallet and transaction identifiers. |
| `PublicGoodsRecipient` | `walletAddress` | Recipient wallet identifier. |
| `QuestionResponse` | `answer` | Survey answers can contain free-text PII or sensitive views. |
| `ReasoningAssignmentRule` | `relationshipBucket`, `audienceTag`, `referralSource`, `device` | Segmentation fields can identify cohorts. |
| `ReasoningBlacklistRule` | `pattern`, `reason` | Moderation/fraud rules may contain identifying patterns. |
| `ReasoningBundleVariant` | `description`, `armBindings` | Generated/published reasoning payloads. |
| `ReasoningDistributionPolicyState` | `effortSpent` | Operational payload. |
| `ReasoningDistributionTarget` | `notes` | Operator notes. |
| `ReasoningFraudFinding` | `sessionId`, `details` | Fraud session and details. |
| `ReasoningFraudPattern` | `pattern`, `reason` | Fraud pattern payload. |
| `ReasoningGenerationRequest` | `toneProfile`, `aiPrompt` | Human/AI prompt context. |
| `ReasoningLocaleConfig` | `reviewerUserIds` | Reviewer identifiers. |
| `ReasoningOutcomeRecord` | `sessionId`, `channel`, `audienceTag`, `relationshipBucket` | Visitor/session analytics. |
| `ReasoningPromotionDecision` | `chainValueEvidence`, `fraudEvidence`, `rGuardSnapshot`, `chainValueGuardSnapshot`, `rationale` | Decision evidence and rationale payloads. |
| `ReasoningRGuardSnapshot` | `components` | Guard payload. |
| `ReasoningShadowEvaluation` | `rationale` | Evaluation rationale. |
| `ReasoningSystemState` | `lastFreezeReason` | Operator reason text. |
| `ReasoningTopologyVariant` | `description`, `grammarPatch` | Generated topology payload. |
| `ReasoningVariantArm` | `content`, `validatorViolations` | Generated/human-edited variant content. |
| `ReasoningVariantExposure` | `sessionId`, `relationshipBucket`, `referralSource`, `device`, `returningVsFirst` | Visitor/session analytics. |
| `ReasoningVariantSet` | `description` | Human-authored set description. |
| `ReferendumVote` | `publicComment`, `originUrl` | Voter comment and attribution URL. |
| `ReferralClick` | `code`, `refererUrl`, `userAgent`, `countryCode` | Referral click forensics. |
| `ReferralInvitation` | `inviteToken`, `recipientName`, `recipientEmail`, `messageText`, `originUrl` | Named-invite recipient and message data. |
| `Session` | `sessionToken` | Login session credential. |
| `ShareAttempt` | `templateHash`, `templateBody`, `renderedMessage`, `renderedHash`, `context` | Exact share-message forensic payload. |
| `SocialAccount` | `accountId`, `username`, `walletAddress` | Social/wallet identity. |
| `SourceArtifact` | `externalKey`, `versionKey`, `title`, `sourceUrl`, `sourceRef`, `payloadJson` | Imported raw/source payloads. |
| `Subject` | `externalId`, `displayName` | Generic subject identifiers and labels. |
| `Task` | `title`, `description`, `impactStatement`, `roleTitle`, `assigneeAffiliationSnapshot`, `skillTags`, `interestTags`, `contextJson`, `completionEvidence` | User-authored task copy, snapshots, and JSON context. |
| `TaskClaim` | `completionEvidence`, `verificationNote` | Claimant evidence and reviewer notes. |
| `TaskComment` | `authorNameSnapshot`, `message`, `mediaUrl`, `mentionedUserIds`, `citationsJson`, `moderationReason` | Thread body, author snapshot, media, mentions, and citations. |
| `TaskCommentVote` | `ipHash`, `userAgentHash` | Anti-abuse forensics. |
| `TaskCommunication` | `recipientEmail`, `recipientNameSnapshot`, `senderNameSnapshot`, `unsubscribeToken`, `externalUrl`, `errorMessage`, `providerMessageId`, `metadataJson` | Recipient/sender snapshots, tokens, provider IDs, and metadata. |
| `TaskCommunicationEndpoint` | `label`, `url`, `email`, `instructions`, `sourceUrl` | Assignee contact methods and instructions. |
| `TaskCommunicationSpawnSpec` | `subjectTemplate`, `bodyTextTemplate`, `bodyHtmlTemplate`, `commentTemplate`, `emailScope`, `dedupeKeyTemplate`, `metadata` | Spawned communication templates and metadata. |
| `TaskCommunicationTemplate` | `label` | Admin/debug communication label. |
| `TaskCommunicationVariant` | `subject`, `htmlBody`, `textBody`, `senderIdentity`, `signature`, `footer` | Rendered outbound communication content. |
| `TaskEdge` | `assumptionsJson`, `notes` | User-authored assumptions and notes. |
| `TaskImpactEstimateSet` | `assumptionsJson` | Impact assumptions payload. |
| `TaskImpactFrameEstimate` | `customFrameLabel`, `summaryStatsJson` | Custom labels and summary payloads. |
| `TaskImpactMetric` | `valueJson`, `summaryStatsJson`, `metadataJson` | Metric payloads. |
| `TaskSpawnSpec` | `titleTemplate`, `descriptionTemplate`, `impactStatementTemplate`, `roleTitleTemplate`, `skillTagTemplates`, `interestTagTemplates`, `actionLinkUrlTemplate`, `actionLinkLabelTemplate`, `actionLinkInstructionsTemplate`, `metadata` | Generated task templates and metadata. |
| `TaskTrigger` | `eventFilter`, `disabledReason`, `idempotencyKeyTemplate`, `completionGate`, `notes`, `metadata` | Trigger filters, notes, and payloads. |
| `TaskTriggerFire` | `idempotencyKey`, `context`, `error`, `spawnedTaskKeys`, `spawnedTaskIds` | Fire-time event context and produced identifiers. |
| `TrackingReminder` | `defaultValue`, `reminderStartTime`, `reminderEndTime`, `reminderFrequency`, `instructions`, `lastTracked`, `startTrackingDate`, `stopTrackingDate` | Personal health/reminder schedule. |
| `TrackingReminderNotification` | `notifyAt`, `notifiedAt`, `receivedAt`, `trackedValue`, `status` | Reminder delivery and response data. |
| `User` | `email`, `password`, `referralCode`, `signupLandingUrl`, `unsubscribedScopes`, `timeZone`, `countryCode`, `regionCode`, `city`, `postalCode`, `latitude`, `longitude`, `annualHouseholdIncomeUsd`, `annualPersonalIncomeUsd`, `householdSize`, `birthYear`, `educationLevel`, `employmentStatus`, `genderIdentity`, `censusNotes`, `biologicalSex`, `ethnicityOrRace`, `maritalStatus`, `numberOfDependents`, `primaryLanguage`, `healthInsuranceType`, `chronicConditionCount`, `disabilityStatus`, `smokingStatus`, `alcoholFrequency`, `heightCm`, `annualTaxesPaidUsd`, `monthlyHousingCostUsd`, `housingStatus`, `hoursWorkedPerWeek`, `industryOrSector`, `citizenshipStatus`, `internetAccessType`, `skillTags`, `interestTags`, `availableHoursPerWeek`, `maxTaskDifficulty`, `phoneNumber` | Auth, contact, location, census, income, health, and capability data. |
| `UserPreference` | `reminderStartTime`, `quietHoursStart`, `lastPushSentAt`, `lastCheckInAt` | User schedule and check-in timing. |
| `VerificationToken` | `identifier`, `token` | Magic-link identifier and token. |
| `VoteTokenMint` | `nullifierHash`, `walletAddress`, `txHash` | Personhood/wallet/transaction identifiers. |
| `WebPushSubscription` | `endpoint`, `p256dh`, `auth`, `userAgent` | Push endpoint and browser secrets. |
| `WishocraticEncryptedAllocation` | `ciphertext`, `iv` | Encrypted personal allocation payload. |
| `WishPoint` | `metadata` | User action context. |

## Masking Policy

- Unique identifiers that must remain unique use deterministic synthetic values,
  usually with a `preview.invalid` email domain or a table-specific prefix. The
  rules file may express these as `anon.hash(...)`; the generated update SQL
  rewrites that to Postgres `md5(...)` because Neon's managed anonymizer build
  does not expose the `anon.salt` session setting required by `anon.hash()`.
- Names use `anon.fake_first_name()` / `anon.fake_last_name()`.
- Non-unique email/contact surfaces use `anon.fake_email()`.
- Free text uses `anon.dummy_safe_text()`, defined in the SQL file if the Neon
  extension version does not provide it.
- JSON payloads are replaced with empty JSON objects.
- Nullable secrets, URLs, hashes, dates, and numeric health/demographic fields
  are nulled where possible.

## Verification

- Trust only aggregate CI output. Do not query raw preview rows looking for
  names, emails, URLs, message bodies, or payload contents.
- The CI summary should say direct SQL masking updates were applied and sampled
  masked row shapes were verified.
- Mask-check failures must not print sampled values. Treat that preview branch
  as unsafe until recreated or masked successfully.
- If a Prisma model adds a new user-authored, contact, auth, health, location,
  legal, survey, share, email, JSON, provider, wallet, or raw-payload column,
  add a rule to `packages/db/prisma/anonymization-rules.sql` in the same PR.
