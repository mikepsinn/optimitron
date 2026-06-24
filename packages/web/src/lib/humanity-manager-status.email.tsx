import { Section, Text } from "@react-email/components";
import * as React from "react";
import { EMAIL_STYLES } from "@/components/adaptive/email-styles";
import {
  CampaignCopyBlock,
  CampaignText,
} from "@/lib/email/react-email-components";
import {
  createHumanityManagerStatus,
  type HumanityManagerStatusCompletedEmployee,
  type HumanityManagerStatusInput,
  type HumanityManagerStatusReminder,
} from "@/lib/humanity-manager-status-content";

const ink = "#111827";
const muted = "#71717a";

function StatusSection({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p style={EMAIL_STYLES.eyebrow}>{children}</p>;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <p style={EMAIL_STYLES.largeHeadline}>{children}</p>;
}

function StatusText({
  children,
  muted: isMuted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <CampaignText muted={isMuted}>
      {children}
    </CampaignText>
  );
}

function formatMaybeDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function CompletedEmployees({
  employees,
  total,
}: {
  employees: HumanityManagerStatusCompletedEmployee[];
  total: number;
}) {
  if (employees.length === 0) return null;
  const extra = total > employees.length ? total - employees.length : 0;

  return (
    <Section
      style={{
        borderBottom: `2px solid ${ink}`,
        borderTop: `2px solid ${ink}`,
        margin: "0 0 24px",
        padding: "20px 0",
      }}
    >
      <Text
        style={{
          color: muted,
          fontSize: "13px",
          fontWeight: "700",
          letterSpacing: "0.12em",
          lineHeight: "1.6",
          margin: "0 0 12px",
          textTransform: "uppercase",
        }}
      >
        Employees who did the task
      </Text>
      <ul
        style={{
          color: ink,
          fontSize: "16px",
          fontWeight: "700",
          lineHeight: "1.7",
          margin: "0",
          paddingLeft: "20px",
        }}
      >
        {employees.slice(0, 8).map((person) => {
          const date = formatMaybeDate(person.completedAt);
          return (
            <li key={`${person.displayName}-${date ?? "completed"}`} style={{ margin: "0 0 8px" }}>
              <strong>{person.displayName}</strong>
              {date ? ` voted YES on ${date}.` : " voted YES."}
            </li>
          );
        })}
      </ul>
      {extra > 0 ? (
        <CampaignText muted>Plus {extra.toLocaleString("en-US")} more.</CampaignText>
      ) : null}
    </Section>
  );
}

function ReminderBlock({
  reminders,
}: {
  reminders: HumanityManagerStatusReminder[];
}) {
  if (reminders.length === 0) return null;

  return (
    <Section style={{ margin: "0 0 28px" }}>
      <Text
        style={{
          color: muted,
          fontSize: "13px",
          fontWeight: "700",
          letterSpacing: "0.12em",
          lineHeight: "1.6",
          margin: "0 0 8px",
          textTransform: "uppercase",
        }}
      >
        Open employee tasks
      </Text>
      {reminders.map((reminder) => (
        <Section key={reminder.id} style={{ margin: "0 0 18px" }}>
          <CampaignText>
            {reminder.title}: {reminder.label}
          </CampaignText>
          <CampaignCopyBlock>{reminder.message}</CampaignCopyBlock>
        </Section>
      ))}
    </Section>
  );
}

const HumanityManagerStatusEmailContent = createHumanityManagerStatus({
  CompletedEmployees,
  Eyebrow,
  Heading,
  ReminderBlock,
  Section: StatusSection,
  Text: StatusText,
});

export function HumanityManagerStatusEmail({
  input,
}: {
  input: HumanityManagerStatusInput;
}) {
  return <HumanityManagerStatusEmailContent input={input} />;
}
