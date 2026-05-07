"use client";

import { useId, useMemo, useState } from "react";
import { Dialog } from "@/components/retroui/Dialog";
import { ParameterValue } from "@/components/shared/ParameterValue";
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
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

export function OrganizationImpactCalculator() {
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

    return {
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

  return (
    <section className="mt-6 border-2 border-foreground bg-background p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
        Estimate your reach
      </p>
      <h3 className="mt-2 text-xl font-black uppercase leading-tight text-foreground">
        What could one hour do?
      </h3>
      <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
        Enter your audience size. The calculator estimates what one setup hour
        could do if you embed the survey, send one member email, and post once.
      </p>

      <div className="mt-4 space-y-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-foreground">
            Your audience
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <CalculatorInput
              help="How many humans can receive one email from your organization. Use your delivered list size if you know it. Subscriber count is fine if you do not."
              label="Email members"
              onChange={setEmailAudience}
              value={emailAudience}
            />
            <CalculatorInput
              help="How many humans visit the page or site where the survey widget could live in an average month. The calculator counts these visitors for however many months the widget stays up."
              label="Monthly site visitors"
              onChange={setMonthlyVisitors}
              value={monthlyVisitors}
            />
            <CalculatorInput
              help="Rough total followers, subscribers, or members across the social channels where you would post once. This is allowed to be approximate. The calculator is not a tax form."
              label="Social audience"
              onChange={setSocialAudience}
              value={socialAudience}
            />
            <CalculatorInput
              help="How long the embedded survey stays on your website after the first announcement. This is why the website embed matters: it keeps working after the email is old."
              label="Months on website"
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
              label="Audience that sees it %"
              onChange={setReachRate}
              step={0.1}
              value={reachRate}
            />
            <CalculatorInput
              help="Of the humans who see the ask or the website widget, this estimates how many complete a verified treaty vote. Default 2% means 2 out of 100 reached humans vote."
              label="Verified vote rate %"
              onChange={setVoteRate}
              step={0.1}
              value={voteRate}
            />
            <CalculatorInput
              help="Extra spread from members sharing after they vote. 1.0 means nobody shares. 1.5 means member sharing adds 50% more verified votes. 2.0 means it doubles."
              label="Member share multiplier"
              onChange={setShareMultiplier}
              step={0.1}
              value={shareMultiplier}
            />
            <CalculatorInput
              help="Estimated foundation dollars per verified vote acquired. This does not change the impact estimate. It estimates how much outreach funding the verified votes could justify."
              label="Foundation $ per vote"
              onChange={setGrantCostPerVote}
              step={0.1}
              value={grantCostPerVote}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-foreground pt-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Estimated humans reached
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums">
            {formatNumber(estimate.humansReached)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Verified treaty votes
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums">
            {formatNumber(estimate.verifiedVotes)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Estimated total lives saved
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums">
            {formatNumber(estimate.livesSaved)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Estimated total years of suffering prevented
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums">
            {formatNumber(estimate.sufferingYears)}
          </p>
        </div>
      </div>

      <p className="mt-4 border-t border-foreground pt-4 text-sm font-bold leading-6 text-muted-foreground">
        At {formatCurrency(parsePositiveNumber(grantCostPerVote, 2))} per
        verified vote, this supports a {formatCurrency(estimate.grantAsk)}{" "}
        outreach-grant ask. Foundations can compare the modeled
        cost-effectiveness to bed nets. These totals are the estimated verified
        votes multiplied by{" "}
        <ParameterValue figures={2} param={FLOW_VOTER_LIVES_SAVED_ROUNDED} />{" "}
        lives and{" "}
        <ParameterValue
          figures={2}
          param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED}
        />{" "}
        years of suffering prevented per vote.
      </p>
    </section>
  );
}
