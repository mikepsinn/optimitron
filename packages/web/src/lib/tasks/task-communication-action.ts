import {
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
} from "@/lib/tasks/accountability";

export interface TaskCommunicationEndpointLike {
  email?: string | null;
  id?: string | null;
  instructions?: string | null;
  isPrimary?: boolean | null;
  kind?: string | null;
  label?: string | null;
  priority?: number | null;
  url?: string | null;
}

export interface TaskCommunicationLike {
  assigneeOrganization?: {
    contactEmail?: string | null;
    name: string;
  } | null;
  assigneePerson?: {
    displayName: string;
  } | null;
  communicationEndpoints?: TaskCommunicationEndpointLike[] | null;
  roleTitle?: string | null;
  title: string;
}

export interface TaskCommunicationDelayStats {
  currentDelayDays: number;
  currentEconomicValueUsdLost: number | null;
  currentHumanLivesLost: number | null;
  currentSufferingHoursLost: number | null;
}

export interface TaskCommunicationAction {
  channel: "externalUrl" | "mailto";
  endpointId: string | null;
  href: string;
  label: string;
  message: string;
}

interface TaskCommunicationTemplateValues {
  delayDays: string;
  delayLabel: string;
  economicLoss: string;
  humanLives: string;
  roleTitle: string;
  sufferingHours: string;
  targetLabel: string;
  taskTitle: string;
  taskUrl: string;
}

function buildMailtoHref(base: string, subject: string, body: string) {
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildOfficeSearchHref(task: TaskCommunicationLike) {
  const parts = [
    task.assigneePerson?.displayName,
    task.roleTitle,
    task.assigneeOrganization?.name,
    "official contact",
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (parts.length === 0) {
    return null;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(parts.join(" "))}`;
}

function getTargetLabel(task: TaskCommunicationLike) {
  return task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;
}

function getPrimaryEndpoint(task: TaskCommunicationLike) {
  const endpoints = task.communicationEndpoints ?? [];
  return (
    endpoints.find((endpoint) => endpoint.isPrimary) ??
    [...endpoints].sort(
      (left, right) => (left.priority ?? 0) - (right.priority ?? 0),
    )[0] ??
    null
  );
}

function endpointUrl(endpoint: TaskCommunicationEndpointLike | null) {
  if (!endpoint) {
    return null;
  }

  if (endpoint.url?.trim()) {
    return endpoint.url.trim();
  }

  if (endpoint.email?.trim()) {
    return `mailto:${endpoint.email.trim()}`;
  }

  return null;
}

function buildTemplateValues(input: {
  delayStats: TaskCommunicationDelayStats;
  task: TaskCommunicationLike;
  taskUrl?: string | null;
}): TaskCommunicationTemplateValues {
  return {
    delayDays: String(input.delayStats.currentDelayDays),
    delayLabel:
      input.delayStats.currentDelayDays > 0
        ? `${formatDelayDuration(input.delayStats.currentDelayDays)} overdue`
        : "still unresolved",
    economicLoss: formatCompactCurrency(input.delayStats.currentEconomicValueUsdLost),
    humanLives: formatCompactCount(input.delayStats.currentHumanLivesLost),
    roleTitle: input.task.roleTitle ?? "",
    sufferingHours: formatCompactCount(input.delayStats.currentSufferingHoursLost),
    targetLabel: getTargetLabel(input.task),
    taskTitle: input.task.title,
    taskUrl: input.taskUrl ?? "",
  };
}

function interpolateTemplate(template: string, values: TaskCommunicationTemplateValues) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: keyof TaskCommunicationTemplateValues) => {
    return values[key] ?? "";
  });
}

export function buildTaskCommunicationMessage(input: {
  delayStats: TaskCommunicationDelayStats;
  task: TaskCommunicationLike;
  taskUrl?: string | null;
}) {
  const values = buildTemplateValues(input);
  const primaryEndpoint = getPrimaryEndpoint(input.task);
  const instructions = primaryEndpoint?.instructions?.trim();

  if (instructions) {
    return interpolateTemplate(instructions, values);
  }

  return `${values.targetLabel}, please complete "${values.taskTitle}". This task is ${values.delayLabel}. Estimated delay cost so far: ${values.humanLives} lives, ${values.sufferingHours} suffering hours, and ${values.economicLoss}.`;
}

export function resolveTaskCommunicationAction(input: {
  delayStats: TaskCommunicationDelayStats;
  task: TaskCommunicationLike;
  taskUrl?: string | null;
}): TaskCommunicationAction | null {
  const message = buildTaskCommunicationMessage(input);
  const subject = `Please complete: ${input.task.title}`;
  const primaryEndpoint = getPrimaryEndpoint(input.task);
  const explicitUrl = endpointUrl(primaryEndpoint);

  if (explicitUrl) {
    const isMailto = explicitUrl.toLowerCase().startsWith("mailto:");
    return {
      channel: isMailto ? "mailto" : "externalUrl",
      endpointId: primaryEndpoint?.id ?? null,
      href: isMailto ? buildMailtoHref(explicitUrl, subject, message) : explicitUrl,
      label: primaryEndpoint?.label?.trim() || "Contact assignee",
      message,
    };
  }

  const contactEmail = input.task.assigneeOrganization?.contactEmail?.trim();
  if (contactEmail) {
    return {
      channel: "mailto",
      endpointId: null,
      href: buildMailtoHref(`mailto:${contactEmail}`, subject, message),
      label: "Email assignee",
      message,
    };
  }

  const officeSearchHref = buildOfficeSearchHref(input.task);
  if (!officeSearchHref) {
    return null;
  }

  return {
    channel: "externalUrl",
    endpointId: null,
    href: officeSearchHref,
    label: "Find office contact",
    message,
  };
}
