import * as React from "react";
import type { ShareRecipientMode } from "@/lib/tasks/share-templates";

export interface HumanityManagerStatusPerson {
  completedAt?: Date | string | null;
  displayName: string;
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
  completedEmployees: HumanityManagerStatusPerson[];
  directConversionCount: number;
  downstreamConversionCount: number;
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
    employees: HumanityManagerStatusPerson[];
    total: number;
  }>;
  Eyebrow: React.ComponentType<{ children: React.ReactNode }>;
  Heading: React.ComponentType<{ children: React.ReactNode }>;
  MetricTable: React.ComponentType<{ rows: StatusMetric[] }>;
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

function formatPeopleSample(people: HumanityManagerStatusPerson[]): string {
  return people
    .slice(0, 5)
    .map((person) => person.displayName.trim())
    .filter(Boolean)
    .join(", ");
}

function formatLeaderSample(leaders: HumanityManagerStatusLeader[]): string {
  return leaders
    .slice(0, 5)
    .map((leader) => {
      const country = leader.countryLabel?.trim();
      return country
        ? `${leader.displayName.trim()} (${country})`
        : leader.displayName.trim();
    })
    .filter(Boolean)
    .join(", ");
}

function buildEmployeeStatus(input: HumanityManagerStatusInput): string {
  if (input.overdueEmployeeCount === 0) {
    return "No named employees are late. The machine is briefly behaving.";
  }
  const names = formatPeopleSample(input.overdueEmployees);
  const count = formatCount(input.overdueEmployeeCount);
  const noun = input.overdueEmployeeCount === 1 ? "employee" : "employees";
  return `${count} ${noun} still need the 30-second vote.${names ? ` Examples: ${names}.` : ""}`;
}

function buildPresidentStatus(input: HumanityManagerStatusInput): string {
  if (input.overduePresidentCount === 0) {
    return "No presidents are currently late. That would be new.";
  }
  const names = formatLeaderSample(input.overduePresidents);
  const count = formatCount(input.overduePresidentCount);
  return `${count} presidents and heads of government still have not signed the treaty.${names ? ` Examples: ${names}.` : ""}`;
}

export function createHumanityManagerStatus({
  CompletedEmployees,
  Eyebrow,
  Heading,
  MetricTable,
  ReminderBlock,
  Section,
  Text,
}: HumanityManagerStatusComponents) {
  return function HumanityManagerStatus({
    input,
  }: {
    input: HumanityManagerStatusInput;
  }) {
    const metrics: StatusMetric[] = [
      {
        label: "Employees completed",
        value: formatCount(input.directConversionCount),
      },
      {
        label: "Employees still late",
        value: formatCount(input.overdueEmployeeCount),
      },
      {
        label: "Late presidents",
        value: formatCount(input.overduePresidentCount),
      },
      {
        label: "Downstream conversions",
        value: formatCount(input.downstreamConversionCount),
      },
    ];

    return (
      <Section>
        <Eyebrow>Humanity Management Status</Eyebrow>
        <Heading>Your employees are either clicking or require management.</Heading>
        <Text>
          Direct employees are the humans you assigned. Full chain conversions
          include their employees, their employees' employees, and so on. Updated
          hourly.
        </Text>
        <MetricTable rows={metrics} />
        <CompletedEmployees
          employees={input.completedEmployees}
          total={input.directConversionCount}
        />
        <Text>{buildEmployeeStatus(input)}</Text>
        <Text>{buildPresidentStatus(input)}</Text>
        {input.reminders.length > 0 ? (
          <ReminderBlock reminders={input.reminders} />
        ) : (
          <Text muted>
            No copyable reminders yet. Assign one human or find one late
            president, and management becomes less ceremonial.
          </Text>
        )}
      </Section>
    );
  };
}
