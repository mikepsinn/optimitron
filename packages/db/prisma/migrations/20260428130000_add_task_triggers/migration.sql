-- CreateTable
CREATE TABLE "TaskTrigger" (
    "id" TEXT NOT NULL,
    "triggerKey" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventFilter" JSONB,
    "triggerKind" TEXT NOT NULL DEFAULT 'spawnTasks',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "disabledReason" TEXT,
    "idempotencyKeyTemplate" TEXT NOT NULL,
    "completionGate" JSONB,
    "jurisdictionId" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSpawnSpec" (
    "id" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "isParent" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "titleTemplate" TEXT NOT NULL,
    "descriptionTemplate" TEXT NOT NULL,
    "impactStatementTemplate" TEXT,
    "roleTitleTemplate" TEXT,
    "category" "TaskCategory" NOT NULL DEFAULT 'OTHER',
    "difficulty" "TaskDifficulty" NOT NULL DEFAULT 'TRIVIAL',
    "estimatedEffortHours" DOUBLE PRECISION,
    "dueDays" DOUBLE PRECISION,
    "availableInDays" DOUBLE PRECISION,
    "deadlinePolicy" TEXT,
    "claimPolicy" "TaskClaimPolicy" NOT NULL DEFAULT 'ASSIGNED_ONLY',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "skillTagTemplates" TEXT[],
    "interestTagTemplates" TEXT[],
    "actionLinkUrlTemplate" TEXT,
    "actionLinkLabelTemplate" TEXT,
    "actionLinkInstructionsTemplate" TEXT,
    "ownerResolver" TEXT NOT NULL DEFAULT 'actor',
    "assigneePersonResolver" TEXT NOT NULL DEFAULT 'none',
    "assigneeOrganizationResolver" TEXT NOT NULL DEFAULT 'none',
    "parentResolver" TEXT NOT NULL DEFAULT 'trigger.parentSpec',
    "contributesToGate" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "TaskSpawnSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCommunicationSpawnSpec" (
    "id" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "subjectTemplate" TEXT NOT NULL,
    "bodyTextTemplate" TEXT NOT NULL,
    "bodyHtmlTemplate" TEXT,
    "commentTemplate" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "audienceResolver" TEXT NOT NULL DEFAULT 'ASSIGNEE',
    "purpose" TEXT NOT NULL DEFAULT 'REMINDER',
    "emailScope" TEXT,
    "dedupeKeyTemplate" TEXT NOT NULL,
    "minHoursBetweenSends" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxSendsPerTask" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "TaskCommunicationSpawnSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTriggerFire" (
    "id" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "actorUserId" TEXT,
    "context" JSONB NOT NULL,
    "result" TEXT NOT NULL,
    "error" TEXT,
    "spawnedTaskKeys" TEXT[],
    "spawnedTaskIds" TEXT[],
    "firedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTriggerFire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskTrigger_triggerKey_key" ON "TaskTrigger"("triggerKey");

-- CreateIndex
CREATE INDEX "TaskTrigger_eventName_enabled_idx" ON "TaskTrigger"("eventName", "enabled");

-- CreateIndex
CREATE INDEX "TaskTrigger_jurisdictionId_eventName_idx" ON "TaskTrigger"("jurisdictionId", "eventName");

-- CreateIndex
CREATE INDEX "TaskTrigger_deletedAt_idx" ON "TaskTrigger"("deletedAt");

-- CreateIndex
CREATE INDEX "TaskSpawnSpec_triggerId_sortOrder_idx" ON "TaskSpawnSpec"("triggerId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TaskSpawnSpec_triggerId_kind_key" ON "TaskSpawnSpec"("triggerId", "kind");

-- CreateIndex
CREATE INDEX "TaskCommunicationSpawnSpec_triggerId_sortOrder_idx" ON "TaskCommunicationSpawnSpec"("triggerId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCommunicationSpawnSpec_triggerId_kind_key" ON "TaskCommunicationSpawnSpec"("triggerId", "kind");

-- CreateIndex
CREATE INDEX "TaskTriggerFire_triggerId_firedAt_idx" ON "TaskTriggerFire"("triggerId", "firedAt");

-- CreateIndex
CREATE INDEX "TaskTriggerFire_actorUserId_firedAt_idx" ON "TaskTriggerFire"("actorUserId", "firedAt");

-- CreateIndex
CREATE INDEX "TaskTriggerFire_result_firedAt_idx" ON "TaskTriggerFire"("result", "firedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTriggerFire_triggerId_idempotencyKey_key" ON "TaskTriggerFire"("triggerId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "TaskTrigger" ADD CONSTRAINT "TaskTrigger_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSpawnSpec" ADD CONSTRAINT "TaskSpawnSpec_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "TaskTrigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCommunicationSpawnSpec" ADD CONSTRAINT "TaskCommunicationSpawnSpec_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "TaskTrigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTriggerFire" ADD CONSTRAINT "TaskTriggerFire_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "TaskTrigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

