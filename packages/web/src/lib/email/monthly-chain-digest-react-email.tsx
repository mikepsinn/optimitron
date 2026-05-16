import { Section, Text } from "@react-email/components";
import * as React from "react";
import {
  CampaignButton,
  CampaignCopyBlock,
  CampaignEmailShell,
  CampaignEyebrow,
  CampaignHeading,
  CampaignMetricTable,
  CampaignShareFooter,
  CampaignText,
} from "@/lib/email/react-email-components";
import { ParameterValueEmail as ParameterValue } from "@/components/shared/ParameterValue.email";
import {
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  SHARING_TIME_MINUTES,
} from "@optimitron/data/parameters";
import { ReferralChainMath } from "@/lib/email/share-footer";
import { buildTaskShareTokens } from "@/lib/tasks/accountability";
import { renderTemplate } from "@/lib/tasks/render-template";
import { getShareTemplate } from "@/lib/tasks/share-templates";
import type {
  MonthlyChainDigestInput,
  MonthlyChainDigestLeader,
  MonthlyChainDigestPerson,
} from "@/lib/email/monthly-chain-digest-email";

const ink = "#111827";
const muted = "#71717a";
const HUMAN_REMINDER_TEMPLATE_ID = "lumbergh-one-human";
const PRESIDENT_REMINDER_TEMPLATE_ID = "lumbergh";

export function MonthlyChainDigestReactEmail({
  input,
}: {
  input: MonthlyChainDigestInput;
}) {
  return input.monthlyConversionCount > 0 ? (
    <PositiveMonthlyDigest input={input} />
  ) : (
    <ResendMonthlyDigest input={input} />
  );
}

function PositiveMonthlyDigest({ input }: { input: MonthlyChainDigestInput }) {
  const monthly = input.monthlyConversionCount.toLocaleString("en-US");
  const total = input.totalConversionCount.toLocaleString("en-US");
  const employeesLabel =
    input.monthlyConversionCount === 1 ? "employee" : "employees";
  const employeeReminderMessage = buildHumanReminderMessage(input);
  const presidentReminderMessage = buildPresidentReminderMessage(input);

  return (
    <CampaignEmailShell
      preview={`${monthly} ${employeesLabel} completed their 30-second task.`}
    >
      <CampaignEyebrow>
        Humanity Management Status Report - {input.monthLabel}
      </CampaignEyebrow>
      <CampaignHeading>
        {monthly} {employeesLabel} completed their{" "}
        <ParameterValue
          param={SHARING_TIME_MINUTES}
          valueOverride="30-second"
        />{" "}
        task.
      </CampaignHeading>
      <CampaignText>
        Total employees completed through your link, all time: {total}.
      </CampaignText>
      <CompletedEmployees employees={input.completedEmployees} total={input.monthlyConversionCount} />
      <StatusTable input={input} />
      {employeeReminderMessage ? (
        <ReminderSection
          eyebrow="Late employee reminder"
          intro={buildEmployeeIntro(input)}
          message={employeeReminderMessage}
        />
      ) : null}
      {presidentReminderMessage ? (
        <ReminderSection
          eyebrow="Late president reminder"
          intro={buildPresidentIntro(input)}
          message={presidentReminderMessage}
        />
      ) : null}
      <CampaignText>
        The math: <ReferralChainMath />.
        The chain only reaches that ceiling if managers keep reminding late
        employees. This is why management exists, unfortunately.
      </CampaignText>
      <CampaignButton href={input.dashboardUrl}>Open dashboard</CampaignButton>
      <CampaignShareFooter referralUrl={input.referralUrl} />
    </CampaignEmailShell>
  );
}

function ResendMonthlyDigest({ input }: { input: MonthlyChainDigestInput }) {
  const employeeReminderMessage = buildHumanReminderMessage(input);
  const presidentReminderMessage = buildPresidentReminderMessage(input);

  return (
    <CampaignEmailShell preview="No employees completed the 30-second task this month.">
      <CampaignEyebrow>
        Humanity Management Status Report - {input.monthLabel}
      </CampaignEyebrow>
      <CampaignHeading>
        No employees completed the{" "}
        <ParameterValue
          param={SHARING_TIME_MINUTES}
          valueOverride="30-second"
        />{" "}
        task through your link this month.
      </CampaignHeading>
      <StatusTable input={input} />
      {employeeReminderMessage ? (
        <ReminderSection
          eyebrow="Late employee reminder"
          intro={buildEmployeeIntro(input)}
          message={employeeReminderMessage}
        />
      ) : null}
      {presidentReminderMessage ? (
        <ReminderSection
          eyebrow="Late president reminder"
          intro={buildPresidentIntro(input)}
          message={presidentReminderMessage}
        />
      ) : null}
      <CampaignText>
        This is not a moral failing. It is a management report. The assigned
        humans have not clicked the small button yet. Please remind them.
      </CampaignText>
      <CampaignButton href={input.dashboardUrl}>Open dashboard</CampaignButton>
      <CampaignShareFooter referralUrl={input.referralUrl} />
    </CampaignEmailShell>
  );
}

function CompletedEmployees({
  employees,
  total,
}: {
  employees: MonthlyChainDigestPerson[];
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
              {date ? ` completed it on ${date}.` : " completed it."}
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

function StatusTable({ input }: { input: MonthlyChainDigestInput }) {
  return (
    <CampaignMetricTable
      rows={[
        {
          label: "Completed employees this month",
          value: input.monthlyConversionCount.toLocaleString("en-US"),
        },
        {
          label: "Completed employees all time",
          value: input.totalConversionCount.toLocaleString("en-US"),
        },
        {
          label: "Your late employees",
          value: input.overdueEmployeeCount.toLocaleString("en-US"),
        },
        {
          label: "Late presidents",
          value: input.overduePresidentCount.toLocaleString("en-US"),
        },
      ]}
    />
  );
}

function ReminderSection({
  eyebrow,
  intro,
  message,
}: {
  eyebrow: string;
  intro: string;
  message: string;
}) {
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
        {eyebrow}
      </Text>
      <CampaignText>{intro}</CampaignText>
      <CampaignCopyBlock>{message}</CampaignCopyBlock>
    </Section>
  );
}

function buildEmployeeIntro(input: MonthlyChainDigestInput): string {
  const names = formatPeopleSample(input.overdueEmployees);
  if (input.overdueEmployeeCount === 0) {
    return "You do not have any named late employees yet. Assign two humans and this section becomes less decorative.";
  }
  const count = input.overdueEmployeeCount.toLocaleString("en-US");
  const noun = input.overdueEmployeeCount === 1 ? "human has" : "humans have";
  return `${count} assigned ${noun} not completed the 30-second vote yet.${names ? ` Examples: ${names}.` : ""}`;
}

function buildPresidentIntro(input: MonthlyChainDigestInput): string {
  const names = formatLeaderSample(input.overduePresidents);
  if (input.overduePresidentCount === 0) {
    return "No presidents are currently late. This would be historically unusual and therefore suspicious.";
  }
  const count = input.overduePresidentCount.toLocaleString("en-US");
  return `${count} presidents and heads of government still have not completed their 30-second treaty task.${names ? ` Examples: ${names}.` : ""}`;
}

function buildHumanReminderMessage(
  input: MonthlyChainDigestInput,
): string | null {
  const person = input.overdueEmployees.find(hasTemplateDelay);
  if (!person) return null;

  const tokens = buildTaskShareTokens({
    currentDelayDays: person.currentDelayDays,
    currentEconomicValueUsdLost: null,
    currentHumanLivesLost: person.currentHumanLivesLost,
    taskTitle: "Vote on the 1% Treaty",
    targetLabel: person.displayName.trim() || "there",
    treatyUrl: input.referralUrl,
    variationSeed: `monthly-chain-digest:employee:${person.displayName}`,
  });

  return renderShareTemplate(HUMAN_REMINDER_TEMPLATE_ID, tokens);
}

function buildPresidentReminderMessage(
  input: MonthlyChainDigestInput,
): string | null {
  const leader = input.overduePresidents.find(hasTemplateDelay);
  if (!leader) return null;

  const tokens = buildTaskShareTokens({
    countryCode: leader.countryCode ?? null,
    currentDelayDays: leader.currentDelayDays,
    currentEconomicValueUsdLost: null,
    currentHumanLivesLost: leader.currentHumanLivesLost,
    militaryToClinicalTrialsRatio:
      MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value,
    taskTitle: "Sign the 1% Treaty",
    targetLabel: leader.displayName.trim() || "President",
    treatyUrl: input.referralUrl,
    variationSeed: `monthly-chain-digest:president:${leader.displayName}:${leader.countryCode ?? ""}`,
  });

  return renderShareTemplate(PRESIDENT_REMINDER_TEMPLATE_ID, tokens);
}

function renderShareTemplate(
  templateId: string,
  tokens: Record<string, string>,
): string {
  const template = getShareTemplate(templateId);
  if (!template) {
    throw new Error(`Unknown share template: ${templateId}`);
  }
  return renderTemplate(template.body, tokens);
}

function hasTemplateDelay<
  T extends {
    currentDelayDays?: number | null;
    currentHumanLivesLost?: number | null;
  },
>(value: T): value is T & {
  currentDelayDays: number;
  currentHumanLivesLost: number;
} {
  return (
    (value.currentDelayDays ?? 0) > 0 &&
    (value.currentHumanLivesLost ?? 0) > 0
  );
}

function formatPeopleSample(people: MonthlyChainDigestPerson[]): string {
  return people
    .slice(0, 5)
    .map((person) => person.displayName.trim())
    .filter(Boolean)
    .join(", ");
}

function formatLeaderSample(leaders: MonthlyChainDigestLeader[]): string {
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

function formatMaybeDate(
  value: Date | string | null | undefined,
): string | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
