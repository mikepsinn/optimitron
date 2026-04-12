import {
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
} from "@/lib/tasks/accountability";

export interface TaskContactLike {
  assigneeOrganization?: {
    contactEmail?: string | null;
    name: string;
  } | null;
  assigneePerson?: {
    displayName: string;
  } | null;
  contactLabel?: string | null;
  contactTemplate?: string | null;
  contactUrl?: string | null;
  roleTitle?: string | null;
  title: string;
}

export interface TaskContactDelayStats {
  currentDelayDays: number;
  currentEconomicValueUsdLost: number | null;
  currentHumanLivesLost: number | null;
  currentSufferingHoursLost: number | null;
}

export interface TaskContactAction {
  channel: "email" | "link";
  href: string;
  label: string;
  message: string;
}

interface TaskContactTemplateValues {
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

function buildOfficeSearchHref(task: TaskContactLike) {
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

function getTargetLabel(task: TaskContactLike) {
  return task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;
}

function buildTemplateValues(input: {
  delayStats: TaskContactDelayStats;
  task: TaskContactLike;
  taskUrl?: string | null;
}): TaskContactTemplateValues {
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

function interpolateTemplate(template: string, values: TaskContactTemplateValues) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: keyof TaskContactTemplateValues) => {
    return values[key] ?? "";
  });
}

export function buildTaskContactMessage(input: {
  delayStats: TaskContactDelayStats;
  task: TaskContactLike;
  taskUrl?: string | null;
}) {
  const values = buildTemplateValues(input);

  if (input.task.contactTemplate?.trim()) {
    return interpolateTemplate(input.task.contactTemplate.trim(), values);
  }

  return `${values.targetLabel}, please complete "${values.taskTitle}". This task is ${values.delayLabel}. Estimated delay cost so far: ${values.humanLives} lives, ${values.sufferingHours} suffering hours, and ${values.economicLoss}.`;
}

export function resolveTaskContactAction(input: {
  delayStats: TaskContactDelayStats;
  task: TaskContactLike;
  taskUrl?: string | null;
}): TaskContactAction | null {
  const message = buildTaskContactMessage(input);
  const subject = `Please complete: ${input.task.title}`;
  const explicitUrl = input.task.contactUrl?.trim();

  if (explicitUrl) {
    return {
      channel: explicitUrl.startsWith("mailto:") ? "email" : "link",
      href:
        explicitUrl.startsWith("mailto:")
          ? buildMailtoHref(explicitUrl, subject, message)
          : explicitUrl,
      label: input.task.contactLabel?.trim() || "Contact office",
      message,
    };
  }

  const contactEmail = input.task.assigneeOrganization?.contactEmail?.trim();
  if (contactEmail) {
    return {
      channel: "email",
      href: buildMailtoHref(`mailto:${contactEmail}`, subject, message),
      label: input.task.contactLabel?.trim() || "Email assignee",
      message,
    };
  }

  const officeSearchHref = buildOfficeSearchHref(input.task);
  if (!officeSearchHref) {
    return null;
  }

  return {
    channel: "link",
    href: officeSearchHref,
    label: "Find office contact",
    message,
  };
}
