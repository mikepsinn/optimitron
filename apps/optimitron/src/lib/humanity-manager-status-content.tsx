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

interface HumanityManagerStatusComponents {
  CompletedEmployees: React.ComponentType<{
    employees: HumanityManagerStatusCompletedEmployee[];
    total: number;
  }>;
  Eyebrow: React.ComponentType<{ children: React.ReactNode }>;
  Heading: React.ComponentType<{ children: React.ReactNode }>;
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

function buildHeading(input: HumanityManagerStatusInput): string {
  if (
    input.overdueEmployeeCount === 0 &&
    input.directConversionCount === 0
  ) {
    return "None assigned";
  }
  if (input.overdueEmployeeCount === 0) {
    return "All voted";
  }
  const count = formatCount(input.overdueEmployeeCount);
  return `${count} overdue`;
}

export function createHumanityManagerStatus({
  CompletedEmployees,
  Eyebrow,
  Heading,
  ReminderBlock,
  Section,
  Text,
}: HumanityManagerStatusComponents) {
  return function HumanityManagerStatus({
    input,
  }: {
    input: HumanityManagerStatusInput;
  }) {
    return (
      <Section>
        <Eyebrow>Your employees</Eyebrow>
        <Heading>{buildHeading(input)}</Heading>
        {input.reminders.length > 0 ? (
          <ReminderBlock reminders={input.reminders} />
        ) : (
          <Text muted>
            Assign employees above. Their status appears here.
          </Text>
        )}
        <CompletedEmployees
          employees={input.completedEmployees}
          total={input.directConversionCount}
        />
      </Section>
    );
  };
}
