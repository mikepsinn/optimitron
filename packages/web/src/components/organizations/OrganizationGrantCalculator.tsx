"use client";

import { useId, useMemo, useState } from "react";
import {
  fmtParamValueOnly,
  TREATY_REDUCTION_PCT,
} from "@optimitron/data/parameters";
import { Check, Copy } from "lucide-react";
import { Dialog } from "@/components/retroui/Dialog";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { copyTextToClipboard } from "@/lib/clipboard";
import { GLOBAL_SURVEY_NAME } from "@/lib/messaging";
import {
  FLOW_VOTER_LIVES_SAVED_ROUNDED,
  FLOW_VOTER_SUFFERING_YEARS_PREVENTED,
} from "@/lib/treaty-share-flow-parameters";

const DEFAULT_EMAIL_AUDIENCE = 10_000;
const DEFAULT_MONTHLY_VISITORS = 5_000;
const DEFAULT_SOCIAL_AUDIENCE = 10_000;
const DEFAULT_MONTHS_LIVE = 12;
const DEFAULT_REACH_RATE = 30;
const DEFAULT_VOTE_RATE = 2;
const DEFAULT_SHARE_MULTIPLIER = 1.5;
const DEFAULT_GRANT_COST_PER_VOTE = 2;
const treatyReduction = fmtParamValueOnly(TREATY_REDUCTION_PCT, 1);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parsePositiveNumber(value: string, fallback: number) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function formatCurrency(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits,
    style: "currency",
  }).format(value);
}

function formatGrantMetric(value: number) {
  return formatNumber(value, value < 10 ? 2 : 0);
}

function CalculatorInput({
  help,
  label,
  min = 0,
  onChange,
  step = 1,
  value,
}: {
  help: string;
  label: string;
  min?: number;
  onChange: (value: string) => void;
  step?: number;
  value: string;
}) {
  const inputId = useId();

  return (
    <div className="block">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        <label htmlFor={inputId}>{label}</label>
        <FieldHelp help={help} label={label} />
      </div>
      <input
        id={inputId}
        className="mt-1 w-full border-2 border-foreground bg-background px-3 py-2 text-sm font-black tabular-nums text-foreground outline-none focus:ring-2 focus:ring-foreground"
        inputMode="decimal"
        min={min}
        onChange={(event) => onChange(event.currentTarget.value)}
        step={step}
        type="number"
        value={value}
      />
    </div>
  );
}

function FieldHelp({ help, label }: { help: string; label: string }) {
  return (
    <Dialog>
      <Dialog.Trigger asChild>
        <button
          aria-label={`What does ${label} mean?`}
          className="inline-flex h-5 w-5 items-center justify-center border border-foreground bg-background text-[11px] font-black leading-none text-foreground hover:bg-foreground hover:text-background"
          title={help}
          type="button"
        >
          ?
        </button>
      </Dialog.Trigger>
      <Dialog.Content
        className="max-w-[min(92vw,34rem)] border-2 border-foreground bg-background shadow-none"
        title={label}
      >
        <div className="border-b-2 border-foreground px-4 py-3">
          <h4 className="text-sm font-black uppercase tracking-[0.12em]">
            {label}
          </h4>
        </div>
        <div className="p-4">
          <p className="text-sm font-bold leading-7 text-muted-foreground">
            {help}
          </p>
        </div>
        <div className="border-t-2 border-foreground p-3 text-right">
          <Dialog.Close asChild>
            <button
              className="border-2 border-foreground bg-foreground px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-background hover:bg-background hover:text-foreground"
              type="button"
            >
              Got It
            </button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

function GrantCopyButton({ text }: { text: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  async function handleCopy() {
    try {
      await copyTextToClipboard(text);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2200);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex items-center justify-center gap-2 border-2 border-foreground bg-foreground px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-background hover:bg-background hover:text-foreground"
    >
      {copyState === "copied" ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {copyState === "copied"
        ? "Copied"
        : copyState === "error"
          ? "Copy Failed"
          : "Copy Request Draft"}
    </button>
  );
}

export function OrganizationGrantCalculator({
  organizationName,
}: {
  organizationName?: string | null;
}) {
  const [emailAudience, setEmailAudience] = useState(
    String(DEFAULT_EMAIL_AUDIENCE),
  );
  const [monthlyVisitors, setMonthlyVisitors] = useState(
    String(DEFAULT_MONTHLY_VISITORS),
  );
  const [socialAudience, setSocialAudience] = useState(
    String(DEFAULT_SOCIAL_AUDIENCE),
  );
  const [monthsLive, setMonthsLive] = useState(String(DEFAULT_MONTHS_LIVE));
  const [reachRate, setReachRate] = useState(String(DEFAULT_REACH_RATE));
  const [voteRate, setVoteRate] = useState(String(DEFAULT_VOTE_RATE));
  const [shareMultiplier, setShareMultiplier] = useState(
    String(DEFAULT_SHARE_MULTIPLIER),
  );
  const [grantCostPerVote, setGrantCostPerVote] = useState(
    String(DEFAULT_GRANT_COST_PER_VOTE),
  );

  const estimate = useMemo(() => {
    const email = parsePositiveNumber(emailAudience, DEFAULT_EMAIL_AUDIENCE);
    const visitors = parsePositiveNumber(
      monthlyVisitors,
      DEFAULT_MONTHLY_VISITORS,
    );
    const social = parsePositiveNumber(socialAudience, DEFAULT_SOCIAL_AUDIENCE);
    const months = parsePositiveNumber(monthsLive, DEFAULT_MONTHS_LIVE);
    const reach = clamp(
      parsePositiveNumber(reachRate, DEFAULT_REACH_RATE),
      0,
      100,
    );
    const conversion = clamp(
      parsePositiveNumber(voteRate, DEFAULT_VOTE_RATE),
      0,
      100,
    );
    const multiplier = clamp(
      parsePositiveNumber(shareMultiplier, DEFAULT_SHARE_MULTIPLIER),
      0,
      100,
    );
    const costPerVote = parsePositiveNumber(
      grantCostPerVote,
      DEFAULT_GRANT_COST_PER_VOTE,
    );

    const directReach = email * (reach / 100) + social * (reach / 100);
    const embedReach = visitors * months;
    const humansReached = directReach + embedReach;
    const verifiedVotes = humansReached * (conversion / 100) * multiplier;
    const livesSaved = verifiedVotes * FLOW_VOTER_LIVES_SAVED_ROUNDED.value;
    const sufferingYears =
      verifiedVotes * FLOW_VOTER_SUFFERING_YEARS_PREVENTED.value;
    const grantAsk = verifiedVotes * costPerVote;
    const costPerModeledLifeSaved = livesSaved > 0 ? grantAsk / livesSaved : 0;

    return {
      costPerModeledLifeSaved,
      costPerVote,
      grantAsk,
      humansReached,
      livesSaved,
      sufferingYears,
      verifiedVotes,
    };
  }, [
    emailAudience,
    grantCostPerVote,
    monthlyVisitors,
    monthsLive,
    reachRate,
    shareMultiplier,
    socialAudience,
    voteRate,
  ]);

  const grantApplicant = organizationName?.trim() || "Our organization";
  const grantApplicationText = useMemo(
    () =>
      [
        `Outreach grant request draft: ${formatCurrency(estimate.grantAsk)}`,
        "",
        `${grantApplicant} is applying for an outreach grant from the International Campaign to End War and Disease to conduct the ${GLOBAL_SURVEY_NAME} with our audience. The survey asks humans whether governments should redirect ${treatyReduction} of military spending to pragmatic clinical trials to help end war and disease.`,
        "",
        `With this grant, we estimate we can reach ${formatNumber(estimate.humansReached)} people through our email list, social channels, and website. At an estimated outreach cost of ${formatCurrency(estimate.costPerVote)} per verified survey response, the grant would support outreach expected to produce approximately ${formatNumber(estimate.verifiedVotes)} verified survey responses.`,
        "",
        `Campaign model impact: ${formatNumber(estimate.verifiedVotes)} verified survey responses x ${formatGrantMetric(FLOW_VOTER_LIVES_SAVED_ROUNDED.value)} lives and ${formatGrantMetric(FLOW_VOTER_SUFFERING_YEARS_PREVENTED.value)} years of suffering prevented per response = approximately ${formatNumber(estimate.livesSaved)} lives saved and ${formatNumber(estimate.sufferingYears)} years of suffering prevented.`,
        "",
        `Modeled cost per life saved: ${formatCurrency(estimate.costPerModeledLifeSaved, 2)}.`,
        "",
        "The grant will use campaign links, campaign embeds, attributed responses, and one shared impact model so the campaign can measure the cost per verified survey response.",
        "",
        "The outreach plan is simple: one member email, one post per channel, and a website embed that keeps collecting survey responses after the first announcement is old.",
      ].join("\n"),
    [estimate, grantApplicant],
  );

  return (
    <section className="border-2 border-foreground bg-background p-5">
      <h2 className="text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
        Apply for a campaign grant
      </h2>
      <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
        Estimate the outreach grant your organization could request from the
        International Campaign to End War and Disease to run the{" "}
        {GLOBAL_SURVEY_NAME} through your audience. Campaign links and embeds
        keep attribution and impact measurement in one system.
      </p>

      <div className="mt-4 space-y-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-foreground">
            Outreach capacity
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <CalculatorInput
              help="How many people can receive one email from your organization. Use your delivered list size if you know it. Subscriber count is fine if you do not."
              label="Email list"
              onChange={setEmailAudience}
              value={emailAudience}
            />
            <CalculatorInput
              help="How many people visit the page or site where the survey widget could live in an average month. The calculator counts these visitors for however many months the widget stays up."
              label="Monthly site visitors"
              onChange={setMonthlyVisitors}
              value={monthlyVisitors}
            />
            <CalculatorInput
              help="Rough total followers, subscribers, or members across the social channels where you would post once. This is allowed to be approximate. The calculator is not a tax form."
              label="Social reach"
              onChange={setSocialAudience}
              value={socialAudience}
            />
            <CalculatorInput
              help="How long the embedded survey stays on your website after the first announcement. This is why the website embed matters: it keeps working after the email is old."
              label="Months embedded"
              onChange={setMonthsLive}
              value={monthsLive}
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-foreground">
            Assumptions
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <CalculatorInput
              help="Only some subscribers and followers see a given email or post. This estimates the share who actually see it. Default 30% means 30 out of 100 people in your email and social audience see the ask."
              label="Message reach %"
              onChange={setReachRate}
              step={0.1}
              value={reachRate}
            />
            <CalculatorInput
              help="Of the people who see the ask or the website widget, this estimates how many complete a verified survey response. Default 2% means 2 out of 100 reached people respond."
              label="Survey response rate %"
              onChange={setVoteRate}
              step={0.1}
              value={voteRate}
            />
            <CalculatorInput
              help="Extra spread from members sharing after they respond. 1.0 means nobody shares. 1.5 means member sharing adds 50% more verified survey responses. 2.0 means it doubles."
              label="Member sharing lift"
              onChange={setShareMultiplier}
              step={0.1}
              value={shareMultiplier}
            />
            <CalculatorInput
              help="Estimated outreach dollars needed per verified survey response. This sets the grant request and does not change the modeled impact per response."
              label="Grant $ per response"
              onChange={setGrantCostPerVote}
              step={0.1}
              value={grantCostPerVote}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-foreground pt-5 sm:grid-cols-2">
        <div className="border-2 border-foreground bg-background p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Grant request
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums leading-none">
            {formatCurrency(estimate.grantAsk)}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            estimated outreach cost per response:{" "}
            {formatCurrency(estimate.costPerVote)}
          </p>
        </div>
        <div className="border-2 border-foreground bg-background p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Survey responses
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums leading-none">
            {formatNumber(estimate.verifiedVotes)}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            from {formatNumber(estimate.humansReached)} people reached
          </p>
        </div>
        <div className="border-2 border-foreground bg-background p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Modeled lives saved
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums leading-none">
            {formatNumber(estimate.livesSaved)}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            {formatCurrency(estimate.costPerModeledLifeSaved, 2)} per modeled
            life saved
          </p>
        </div>
        <div className="border-2 border-foreground bg-background p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Suffering prevented
          </p>
          <p className="mt-3 text-3xl font-black tabular-nums leading-none">
            {formatNumber(estimate.sufferingYears)}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            years of suffering prevented
          </p>
        </div>
      </div>

      <p className="mt-5 border-t border-foreground pt-4 text-sm font-bold leading-6 text-muted-foreground">
        {formatNumber(estimate.verifiedVotes)} verified survey responses ×{" "}
        <ParameterValue figures={2} param={FLOW_VOTER_LIVES_SAVED_ROUNDED} />{" "}
        lives and{" "}
        <ParameterValue
          figures={2}
          param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED}
        />{" "}
        years prevented per response. At an estimated outreach cost of{" "}
        {formatCurrency(parsePositiveNumber(grantCostPerVote, 2))} per response,
        the outreach request is {formatCurrency(estimate.grantAsk)}.
      </p>

      <div className="mt-5 border-t border-foreground pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-foreground">
            Grant request draft
          </h3>
          <GrantCopyButton text={grantApplicationText} />
        </div>
        <textarea
          readOnly
          className="mt-3 min-h-72 w-full border-2 border-foreground bg-background p-3 font-mono text-xs leading-6 text-foreground"
          value={grantApplicationText}
        />
      </div>
    </section>
  );
}
