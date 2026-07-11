export type TaskExecutorKind = 'human' | 'agent';

export type TaskCapabilityStatus = 'eligible' | 'unknown' | 'ineligible';

export interface TaskCapabilityRequirements {
  executionMode?: string | null;
  requiredAccessTags?: string[] | null;
  requiredCredentialTags?: string[] | null;
  requiredLanguageTags?: string[] | null;
  requiredToolTags?: string[] | null;
  skillTags?: string[] | null;
}

export interface TaskExecutorCapabilities {
  accessTags?: string[] | null;
  credentialTags?: string[] | null;
  executorKind: TaskExecutorKind;
  languageTags?: string[] | null;
  skillTags?: string[] | null;
  toolTags?: string[] | null;
}

export interface TaskCapabilityAssessment {
  missingProfileFields: string[];
  missingRequiredTags: string[];
  reasons: string[];
  status: TaskCapabilityStatus;
}

interface CapabilityDimension {
  available: string[] | null | undefined;
  label: string;
  profileField: string;
  required: string[] | null | undefined;
}

function normalizeTags(tags: string[] | null | undefined) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function executionModeReason(
  executionMode: string | null | undefined,
  executorKind: TaskExecutorKind,
) {
  const normalized = executionMode?.trim().toUpperCase() ?? 'HUMAN_OR_AGENT';
  if (normalized === 'HUMAN_ONLY' && executorKind === 'agent') {
    return 'This task requires a human executor.';
  }
  if (normalized === 'AGENT_ONLY' && executorKind === 'human') {
    return 'This task requires an agent executor.';
  }
  return null;
}

export function assessTaskCapability(input: {
  executor: TaskExecutorCapabilities;
  task: TaskCapabilityRequirements;
}): TaskCapabilityAssessment {
  const executionMismatch = executionModeReason(
    input.task.executionMode,
    input.executor.executorKind,
  );
  const dimensions: CapabilityDimension[] = [
    {
      available: input.executor.skillTags,
      label: 'skills',
      profileField: 'skillTags',
      required: input.task.skillTags,
    },
    {
      available: input.executor.credentialTags,
      label: 'credentials',
      profileField: 'credentialTags',
      required: input.task.requiredCredentialTags,
    },
    {
      available: input.executor.languageTags,
      label: 'languages',
      profileField: 'languageTags',
      required: input.task.requiredLanguageTags,
    },
    {
      available: input.executor.toolTags,
      label: 'tools',
      profileField: 'toolTags',
      required: input.task.requiredToolTags,
    },
    {
      available: input.executor.accessTags,
      label: 'access',
      profileField: 'accessTags',
      required: input.task.requiredAccessTags,
    },
  ];

  const missingProfileFields: string[] = [];
  const missingRequiredTags: string[] = [];
  const reasons: string[] = [];

  if (executionMismatch) {
    reasons.push(executionMismatch);
  }

  for (const dimension of dimensions) {
    const required = normalizeTags(dimension.required);
    if (required.length === 0) {
      continue;
    }

    const available = normalizeTags(dimension.available);
    if (available.length === 0) {
      missingProfileFields.push(dimension.profileField);
      reasons.push(`No ${dimension.label} are recorded for the target executor.`);
      continue;
    }

    const availableSet = new Set(available);
    const missing = required.filter((tag) => !availableSet.has(tag));
    if (missing.length > 0) {
      missingRequiredTags.push(...missing.map((tag) => `${dimension.profileField}:${tag}`));
      reasons.push(`Missing required ${dimension.label}: ${missing.join(', ')}.`);
    }
  }

  if (executionMismatch || missingRequiredTags.length > 0) {
    return {
      missingProfileFields,
      missingRequiredTags,
      reasons,
      status: 'ineligible',
    };
  }

  if (missingProfileFields.length > 0) {
    return {
      missingProfileFields,
      missingRequiredTags,
      reasons,
      status: 'unknown',
    };
  }

  return {
    missingProfileFields,
    missingRequiredTags,
    reasons:
      reasons.length > 0
        ? reasons
        : ['All recorded capability requirements are satisfied.'],
    status: 'eligible',
  };
}

export function taskCapabilityAllowsExecution(input: {
  executor: TaskExecutorCapabilities;
  task: TaskCapabilityRequirements;
}) {
  return assessTaskCapability(input).status === 'eligible';
}
