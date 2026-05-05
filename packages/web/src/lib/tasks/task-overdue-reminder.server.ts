export const MAX_OVERDUE_REMINDER_COMMENTS = 1;

export interface OverdueReminderTaskInput {
  description: string | null;
  dueAt: Date | null;
  id: string;
  title: string;
}

export interface OverdueReminderCommentInput {
  now?: Date;
  sendCount: number;
  task: OverdueReminderTaskInput;
}

export interface OverdueReminderCommentDraft {
  message: string;
  subject: string;
}

function buildSubject(title: string) {
  return `Task overdue: ${title}`;
}

function daysOverdue(dueAt: Date | null, now: Date) {
  if (!dueAt) return 0;
  const ms = now.getTime() - dueAt.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function buildOverdueReminderComment(
  input: OverdueReminderCommentInput,
): OverdueReminderCommentDraft {
  const now = input.now ?? new Date();
  const daysLate = daysOverdue(input.task.dueAt, now);
  const days = Math.max(daysLate, 1);
  const dayLabel = `${days} day${days === 1 ? "" : "s"}`;

  return {
    message: [
      `This task is ${dayLabel} overdue: ${input.task.title}.`,
      "",
      "Please mark it complete or post a status update.",
    ].join("\n"),
    subject: buildSubject(input.task.title),
  };
}
