import * as React from "react";
import type { ShareRecipientMode } from "@/lib/tasks/share-templates";

export interface HumanityManagerStatusPerson {
  completedAt?: Date | string | null;
  displayName: string;
}

export interface HumanityManagerStatusCompletedEmployee
  extends HumanityManagerStatusPerson {
  downstreamConversionCount: number;
}

export interface HumanityManagerStatusLeader {
  countryLabel?: string | null;
  displayName: string;
}

export interface HumanityManagerStatusReminder {
  id: string;
  label: string;
  message: string;
  recipientMode: ShareRecipientMode;
  title: string;
}

export interface HumanityManagerStatusInput {
  completedEmployees: HumanityManagerStatusCompletedEmployee[];
  directConversionCount: number;
  downstreamConversionCount: number;
  kFactor30d: number;
  overdueEmployeeCount: number;
  overdueEmployees: HumanityManagerStatusPerson[];
  overduePresidentCount: number;
  overduePresidents: HumanityManagerStatusLeader[];
  reminders: HumanityManagerStatusReminder[];
}

interface StatusMetric {
  label: string;
  value: string;
}

interface HumanityManagerStatusComponents {
  CompletedEmployees: React.ComponentType<{
    employees: HumanityManagerStatusCompletedEmployee[];
    total: number;
  }>;
  Eyebrow: React.ComponentType<{ children: React.ReactNode }>;
  Heading: React.ComponentType<{ children: React.ReactNode }>;
  MetricTable: React.ComponentType<{ rows: StatusMetric[] }>;
  PresidentAction?: React.ComponentType<{ overdueCount: number }>;
  ReminderBlock: React.ComponentType<{
    reminders: HumanityManagerStatusReminder[];
  }>;
  Section: React.ComponentType<{ children: React.ReactNode }>;
  Text: React.ComponentType<{
    children: React.ReactNode;
    muted?: boolean;
  }>;
}

function formatCount(value: number): string {
  return Math.max(0, value).toLocaleString("en-US");
}

function formatKFactor(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0.00";
  return value.toFixed(2);
}

function formatPeopleSample(people: HumanityManagerStatusPerson[]): string {
  return people
    .slice(0, 5)
    .map((person) => person.displayName.trim())
    .filter(Boolean)
    .join(", ");
}

function buildEmployeeStatus(input: HumanityManagerStatusInput): string {
  if (input.overdueEmployeeCount === 0) {
    return "No employees are late.";
  }
  const names = formatPeopleSample(input.overdueEmployees);
  const count = formatCount(input.overdueEmployeeCount);
  const noun = input.overdueEmployeeCount === 1 ? "employee" : "employees";
  return `${count} ${noun} still need the 30-second vote.${names ? ` First up: ${names}.` : ""}`;
}

function buildPresidentStatus(input: HumanityManagerStatusInput): string {
  if (input.overduePresidentCount === 0) {
    return "No presidents are currently late.";
  }
  const count = formatCount(input.overduePresidentCount);
  return `${count} presidents and heads of government still have not signed the treaty.`;
}

export function createHumanityManagerStatus({
  CompletedEmployees,
  Eyebrow,
  Heading,
  MetricTable,
  PresidentAction,
  ReminderBlock,
  Section,
  Text,
}: HumanityManagerStatusComponents) {
  return function HumanityManagerStatus({
    input,
  }: {
    input: HumanityManagerStatusInput;
  }) {
    const showPresidentAction =
      PresidentAction != null && input.overduePresidentCount > 0;
    const metrics: StatusMetric[] = [
      {
        label: "Employees completed",
        value: formatCount(input.directConversionCount),
      },
      {
        label: "Votes per invite (30d)",
        value: formatKFactor(input.kFactor30d),
      },
      {
        label: "Late employees",
        value: formatCount(input.overdueEmployeeCount),
      },
      {
        label: "Late presidents",
        value: formatCount(input.overduePresidentCount),
      },
      {
        label: "Downstream votes",
        value: formatCount(input.downstreamConversionCount),
      },
    ];

    return (
      <Section>
        <Eyebrow>Humanity Management Status</Eyebrow>
        <Heading>Who still needs management?</Heading>
        <Text>
          Direct employees are humans you asked to vote. Full-chain votes
          include the humans they invite, and the humans invited after that.
          Updated hourly.
        </Text>
        <MetricTable rows={metrics} />
        <CompletedEmployees
          employees={input.completedEmployees}
          total={input.directConversionCount}
        />
        <Text>{buildEmployeeStatus(input)}</Text>
        <Text>{buildPresidentStatus(input)}</Text>
        {showPresidentAction ? (
          <PresidentAction overdueCount={input.overduePresidentCount} />
        ) : null}
        {input.reminders.length > 0 ? (
          <ReminderBlock reminders={input.reminders} />
        ) : showPresidentAction ? null : (
          <Text muted>
            No employee reminders to send right now.
          </Text>
        )}
      </Section>
    );
  };
}
