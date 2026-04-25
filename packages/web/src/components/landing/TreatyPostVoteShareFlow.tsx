"use client";

import { Check, Clipboard, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Textarea } from "@/components/retroui/Textarea";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS,
  DFDA_TRIAL_SUBSIDIES_ANNUAL,
  DIH_TREASURY_TRIAL_SUBSIDIES_PCT,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  EFFICACY_LAG_YEARS,
  GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  HOURS_PER_YEAR,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  PMC_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PATIENT,
  RARE_DISEASES_COUNT_GLOBAL,
  SAFE_COMPOUNDS_COUNT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TREATY_ANNUAL_FUNDING,
  TREATY_REDUCTION_PCT,
  UNEXPLORED_RATIO,
} from "@optimitron/data/parameters";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  buildReferralInvitationMessage,
  getReferralInvitationFirstName,
  type ReferralInvitationMessageFormat,
} from "@/lib/referral-invitation-copy";
import { ROUTES } from "@/lib/routes";
import {
  FLOW_DISEASES_WITHOUT_EFFECTIVE_TREATMENT_PCT,
  FLOW_DOUBLING_MONTHS_AT_WEEKLY_PACE,
  FLOW_DOUBLING_ROUNDS_TO_TARGET,
  FLOW_GLOBAL_WARHEAD_COUNT,
  FLOW_MAJORITY_OF_HUMANS_ON_EARTH,
  FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR,
  FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  FLOW_TOTAL_LIVES_SAVED,
  FLOW_TOTAL_SUFFERING_HOURS,
  FLOW_VOTER_LIVES_SAVED,
  FLOW_VOTER_LIVES_SAVED_ROUNDED,
  FLOW_VOTER_SUFFERING_HOURS_PREVENTED,
  FLOW_VOTER_SUFFERING_YEARS_PREVENTED,
  FLOW_WASTEFUL_APOCALYPSES,
  formatFlowCompactCurrency,
  formatFlowCompactParam,
  formatFlowWords,
} from "@/lib/treaty-share-flow-parameters";
import { buildUserInviteReferralUrl, getBaseUrl } from "@/lib/url";

type FlowScreen =
  | "opening"
  | "stakes"
  | "nuclear"
  | "math"
  | "neat"
  | "twoHumans"
  | "perVote"
  | "sendName"
  | "sendFormat"
  | "sendMessage"
  | "copyConfirm"
  | "sendConfirm"
  | "sendImpact"
  | "depthHook"
  | "close"
  | "feedback"
  | "submitted";

interface ReferralInvitation {
  id: string;
  inviteToken: string;
  recipientEmail: string | null;
  recipientName: string;
}

interface TreatyPostVoteShareFlowProps {
  answer: "yes" | "no";
}

const primaryButtonClass =
  "h-12 justify-center border-4 border-primary bg-brutal-cyan px-4 text-sm font-black uppercase text-brutal-cyan-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed";
const dismissButtonClass =
  "h-12 justify-center border-4 border-primary bg-background px-4 text-sm font-black uppercase text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed";

const majorityHumanityText = formatFlowWords(FLOW_MAJORITY_OF_HUMANS_ON_EARTH, 1);
const nuclearOverkillText = formatFlowWords(FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR, 3);
const statusQuoQueueYearsText = formatFlowWords(STATUS_QUO_QUEUE_CLEARANCE_YEARS, 3);
const dfdaQueueYearsText = formatFlowWords(DFDA_QUEUE_CLEARANCE_YEARS, 2);
const treatyReductionPctText = formatFlowWords(TREATY_REDUCTION_PCT, 1);
const treatyFundingCompact = formatFlowCompactCurrency(TREATY_ANNUAL_FUNDING, 3);
const globalMilitarySpendingCompact = formatFlowCompactCurrency(
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  3,
);
const dfdaPatientsFundableCompact = formatFlowCompactParam(DFDA_PATIENTS_FUNDABLE_ANNUALLY, 3);
const currentTrialSlotsCompact = formatFlowCompactParam(CURRENT_TRIAL_SLOTS_AVAILABLE, 2);
const trialCapacityMultiplierText = formatFlowWords(DFDA_TRIAL_CAPACITY_MULTIPLIER, 2);
const trialCapacityMultiplierPreciseText = formatFlowWords(DFDA_TRIAL_CAPACITY_MULTIPLIER, 3);
const totalLivesSavedText = formatFlowWords(FLOW_TOTAL_LIVES_SAVED, 3);
const totalSufferingHoursText = formatFlowWords(FLOW_TOTAL_SUFFERING_HOURS, 3);
const voterLivesSavedText = formatFlowWords(FLOW_VOTER_LIVES_SAVED_ROUNDED, 2);
const totalLivesSavedCi = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.confidenceInterval;
const totalSufferingHoursCi =
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS.confidenceInterval;
const totalLivesSavedCiText = totalLivesSavedCi
  ? `${formatFlowCompactParam({ value: totalLivesSavedCi[0] }, 2)}–${formatFlowCompactParam({ value: totalLivesSavedCi[1] }, 3)}`
  : "";
const totalSufferingHoursCiText = totalSufferingHoursCi
  ? `${formatFlowCompactParam({ value: totalSufferingHoursCi[0] }, 3)}–${formatFlowCompactParam({ value: totalSufferingHoursCi[1] }, 3)}`
  : "";

function FlowParagraph({ children }: { children: ReactNode }) {
  return <p className="text-lg font-bold leading-snug sm:text-xl">{children}</p>;
}

function FlowButtonRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 [&>*:only-child]:sm:col-span-2">{children}</div>;
}

function DetailsBlock({
  children,
  summary = "Show the math",
}: {
  children: ReactNode;
  summary?: string;
}) {
  return (
    <details className="border-4 border-primary bg-background p-4 text-sm font-bold leading-snug">
      <summary className="cursor-pointer font-black uppercase">{summary}</summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

function TaskPreview({ senderName }: { senderName: string }) {
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap border-4 border-primary bg-background p-4 text-xs font-black leading-snug">
{`┌──────────────────────────────────────┐
│ ⚠️ [OVERDUE] End War and Disease     │
│                                      │
│ TASK: End War and Disease             │
│ ASSIGNED BY: ${senderName || "[Your name]"}
│ STATUS: Overdue (by approximately     │
│         ${statusQuoQueueYearsText} years)                    │
│ PRIORITY: Critical                    │
│ ESTIMATED TIME: 30 seconds            │
│                                       │
│ ACTION REQUIRED: Vote on the          │
│ 1% Treaty at warondisease.org         │
│                                       │
│ NOTE: This task was originally due     │
│ several centuries ago but kept         │
│ getting deprioritized in favor of      │
│ building ${nuclearOverkillText} apocalypses worth of      │
│ nuclear weapons. Management            │
│ apologizes for the delay.              │
└──────────────────────────────────────┘`}
    </pre>
  );
}

function milestoneCopy(sentCount: number) {
  const milestoneLives = formatLives(sentCount * FLOW_VOTER_LIVES_SAVED_ROUNDED.value);

  if (sentCount === 5) {
    return `Five. Five full human lifetimes of suffering, prevented. ${milestoneLives} lives. More than most humans save in a lifetime of caring about things.`;
  }
  if (sentCount === 10) {
    return "Ten. You've now done more for humanity than most world leaders. Which, to be fair, is a low bar.";
  }
  if (sentCount === 20) {
    return `Twenty lifetimes. ${milestoneLives} lives. At this point you are just showing off. Please continue.`;
  }
  if (sentCount === 40) {
    return "Forty. You've either messaged everyone you love, or you've discovered you love more people than you thought. Both are good outcomes.";
  }
  if (sentCount === 100) {
    return `One hundred lifetimes. ${milestoneLives} lives. A village worth of people who will not die of a curable disease. Specifically because of you.`;
  }
  return null;
}

function formatLives(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function TreatyPostVoteShareFlow({ answer }: TreatyPostVoteShareFlowProps) {
  const { data: session } = useSession();
  const [screen, setScreen] = useState<FlowScreen>("opening");
  const [alt, setAlt] = useState(false);
  const [dismissiveCount, setDismissiveCount] = useState(0);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [messageFormat, setMessageFormat] =
    useState<ReferralInvitationMessageFormat>("TASK_NOTIFICATION");
  const [showFormatSwitch, setShowFormatSwitch] = useState(false);
  const [invitation, setInvitation] = useState<ReferralInvitation | null>(null);
  const [message, setMessage] = useState("");
  const [sentCount, setSentCount] = useState(0);
  const [lastRecipientName, setLastRecipientName] = useState("");
  const [completedInvitationIds, setCompletedInvitationIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  const senderName =
    session?.user?.name?.trim() ||
    session?.user?.username?.trim() ||
    "A voter";
  const firstName = getReferralInvitationFirstName(recipientName);
  const displayName = firstName || "Jake";
  const pendingLives = formatLives(sentCount * FLOW_VOTER_LIVES_SAVED_ROUNDED.value);

  const go = useCallback((next: FlowScreen, dismissive = false) => {
    setAlt(dismissive);
    if (dismissive) {
      setDismissiveCount((count) => count + 1);
    }
    setScreen(next);
  }, []);

  const resetCurrentRecipient = useCallback(() => {
    setRecipientName("");
    setRecipientEmail("");
    setInvitation(null);
    setMessage("");
    setCopyState("idle");
    setError(null);
    setShowFormatSwitch(false);
  }, []);

  const createInvitation = useCallback(async () => {
    if (invitation) return invitation;

    const trimmedName = recipientName.trim();
    if (!trimmedName) {
      setError("First name is required.");
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/referral-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: trimmedName,
          recipientEmail: recipientEmail.trim() || null,
          contactMethod: recipientEmail.trim() ? "EMAIL" : "COPY",
          messageFormat,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        invitation?: ReferralInvitation;
      };

      if (!response.ok || !payload.invitation) {
        throw new Error(payload.error || "Could not create this invitation.");
      }

      setInvitation(payload.invitation);
      return payload.invitation;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create this invitation.");
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [invitation, messageFormat, recipientEmail, recipientName]);

  useEffect(() => {
    if (screen !== "sendMessage" || invitation || isCreating) return;
    void createInvitation();
  }, [createInvitation, invitation, isCreating, screen]);

  useEffect(() => {
    if (!invitation) return;
    const createdUrl = buildUserInviteReferralUrl(
      session?.user,
      invitation.inviteToken,
      getBaseUrl(),
    );
    setMessage(
      buildReferralInvitationMessage({
        inviteUrl: createdUrl,
        messageFormat,
        recipientName: invitation.recipientName,
        senderName,
      }),
    );
  }, [invitation, messageFormat, senderName, session?.user]);

  const completeCurrentInvitation = useCallback(() => {
    if (!invitation || completedInvitationIds.has(invitation.id)) {
      setScreen("sendImpact");
      return;
    }

    setCompletedInvitationIds((ids) => {
      const next = new Set(ids);
      next.add(invitation.id);
      return next;
    });
    setLastRecipientName(getReferralInvitationFirstName(invitation.recipientName));
    setSentCount((count) => count + 1);
    setScreen("sendImpact");
  }, [completedInvitationIds, invitation]);

  const handleNameContinue = useCallback((dismissive = false) => {
    if (!recipientName.trim()) {
      setError("First name is required.");
      return;
    }
    setError(null);
    setAlt(dismissive);
    if (dismissive) setDismissiveCount((count) => count + 1);
    setScreen("sendFormat");
  }, [recipientName]);

  const handleCopy = useCallback(async () => {
    const created = await createInvitation();
    if (!created) return;

    const text = message || buildReferralInvitationMessage({
      inviteUrl: buildUserInviteReferralUrl(session?.user, created.inviteToken, getBaseUrl()),
      messageFormat,
      recipientName: created.recipientName,
      senderName,
    });

    try {
      await copyTextToClipboard(text);
      await fetch("/api/referral-invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: created.id,
          action: "markCopied",
          messageText: text,
        }),
      });
      setCopyState("copied");
      setScreen("copyConfirm");
    } catch {
      setCopyState("error");
      setError("Copy failed.");
    }
  }, [createInvitation, message, messageFormat, senderName, session?.user]);

  const handleSendEmail = useCallback(async () => {
    const created = await createInvitation();
    if (!created?.recipientEmail) return;

    setIsSending(true);
    setError(null);
    try {
      const response = await fetch("/api/referral-invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: created.id,
          action: "sendEmail",
          messageText: message,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        invitation?: ReferralInvitation;
        status?: string;
      };

      if (!response.ok || payload.status !== "sent") {
        throw new Error(payload.error || "Could not send this invitation.");
      }
      if (payload.invitation) {
        setInvitation(payload.invitation);
      }
      setScreen("sendConfirm");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send this invitation.");
    } finally {
      setIsSending(false);
    }
  }, [createInvitation, message]);

  const handleDepthHook = useCallback(async (wantsNudge: boolean) => {
    if (wantsNudge && invitation) {
      await fetch("/api/referral-invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: invitation.id,
          action: "nudgeOptIn",
        }),
      }).catch(() => undefined);
    }
    go("close", !wantsNudge);
  }, [go, invitation]);

  const goDashboard = useCallback(() => {
    window.location.href = ROUTES.dashboard;
  }, []);

  useEffect(() => {
    if (screen !== "submitted") return;
    const timeout = window.setTimeout(goDashboard, 1200);
    return () => window.clearTimeout(timeout);
  }, [goDashboard, screen]);

  const renderScreen = () => {
    switch (screen) {
      case "opening":
        return (
          <>
            <div className="space-y-4">
              <FlowParagraph>
                {answer === "no"
                  ? "You voted no. Totally fine. But I'm going to keep talking anyway because this is kind of the most important thing in the universe and it will only take a few moments of your time."
                  : "I'm very sorry to bother you, but this is kind of the most important thing in the universe and it will only take a few moments of your time."}
              </FlowParagraph>
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => go("stakes", true)}>
                Go to hell
              </Button>
              <Button className={primaryButtonClass} onClick={() => go("stakes")}>
                Fine
              </Button>
            </FlowButtonRow>
          </>
        );

      case "stakes":
        return (
          <>
            <div className="space-y-4">
              {alt ? <FlowParagraph>{"I'm sorry but I still have to tell you this anyway."}</FlowParagraph> : null}
              <FlowParagraph>
                Statistically, you and/or someone you love will get a horrible disease.{" "}
                <ParameterValue param={FLOW_DISEASES_WITHOUT_EFFECTIVE_TREATMENT_PCT} figures={2} />{" "}
                of diseases have zero FDA-approved treatments.{" "}
                <ParameterValue param={SAFE_COMPOUNDS_COUNT} figures={2} /> known-safe compounds sit on shelves, and{" "}
                <ParameterValue param={UNEXPLORED_RATIO} figures={3} /> of their potential uses have never been tested — because the money was busy turning into missiles.
              </FlowParagraph>
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => go("nuclear", true)}>
                I have chosen disease
              </Button>
              <Button className={primaryButtonClass} onClick={() => go("nuclear")}>
                Okay, go on
              </Button>
            </FlowButtonRow>
          </>
        );

      case "nuclear":
        return (
          <>
            <div className="space-y-4">
              {alt ? <FlowParagraph>Fair. One more math thing though.</FlowParagraph> : null}
              <FlowParagraph>
                <ParameterValue param={FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD} figures={1} /> nuclear weapons exploding triggers a nuclear winter that collapses the food chain and kills most humans. Call that one apocalypse.
              </FlowParagraph>
              <FlowParagraph>
                Humanity has about <ParameterValue param={FLOW_GLOBAL_WARHEAD_COUNT} figures={2} /> nuclear weapons. That&apos;s <ParameterValue param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} figures={3} /> apocalypses of mass murder capacity.
              </FlowParagraph>
              <FlowParagraph>You can only ruin Earth once. The other <ParameterValue param={FLOW_WASTEFUL_APOCALYPSES} figures={3} /> are just wasteful.</FlowParagraph>
              <FlowParagraph>The 1% Treaty asks you to trade one apocalypse for something slightly nicer.</FlowParagraph>
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => go("math", true)}>
                Seriously, stop
              </Button>
              <Button className={primaryButtonClass} onClick={() => go("math")}>
                Go on
              </Button>
            </FlowButtonRow>
          </>
        );

      case "math":
        return (
          <>
            {alt ? (
              <div className="space-y-4">
                <FlowParagraph>Fine, show your work:</FlowParagraph>
                <FlowParagraph>
                  {treatyFundingCompact}/year ({treatyReductionPctText} of {globalMilitarySpendingCompact} military) → {formatFlowCompactParam(DFDA_PATIENTS_FUNDABLE_ANNUALLY, 2)} patients tested (at {formatFlowCompactCurrency(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT, 3)} each, not {formatFlowCompactCurrency(TRADITIONAL_PHASE3_COST_PER_PATIENT, 2)}) → {trialCapacityMultiplierText}x research capacity → {statusQuoQueueYearsText} years eradication becomes {dfdaQueueYearsText} → {totalLivesSavedText} avoidable deaths averted + {totalSufferingHoursText} hours of suffering.
                </FlowParagraph>
                <FlowParagraph>
                  Expand any number for the derivation. Everything has a citation at manual.warondisease.org.
                </FlowParagraph>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-xl font-black leading-tight">
                  <ParameterValue param={TREATY_REDUCTION_PCT} figures={1} /> of global military spending ={" "}
                  <ParameterValue param={TREATY_ANNUAL_FUNDING} figures={3} /> per year.
                </p>
                <DetailsBlock>
                  <p>
                    Global military spending 2024 ={" "}
                    <ParameterValue param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024} figures={3} /> (SIPRI).{" "}
                    <ParameterValue param={TREATY_REDUCTION_PCT} figures={1} /> of that = {treatyFundingCompact}.
                  </p>
                </DetailsBlock>
                <p className="text-xl font-black leading-tight">
                  Pragmatic clinical trials cost{" "}
                  <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} display="withUnit" figures={3} />, not{" "}
                  <ParameterValue param={{ ...TRADITIONAL_PHASE3_COST_PER_PATIENT, unit: "USD" }} figures={3} />. So {treatyFundingCompact} funds{" "}
                  <ParameterValue param={DFDA_PATIENTS_FUNDABLE_ANNUALLY} figures={2} /> patients per year — instead of today&apos;s{" "}
                  <ParameterValue param={CURRENT_TRIAL_SLOTS_AVAILABLE} figures={2} />.
                </p>
                <DetailsBlock>
                  <p>
                    Traditional Phase 3 trials: median{" "}
                    <ParameterValue param={TRADITIONAL_PHASE3_COST_PER_PATIENT} display="withUnit" figures={3} /> (FDA data). Pragmatic trials:{" "}
                    <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} display="withUnit" figures={3} /> (ADAPTABLE trial real-world cost). Meta-analysis of 64 pragmatic trials finds median{" "}
                    <ParameterValue param={PMC_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PATIENT} display="withUnit" figures={2} /> (Ramsberg & Platt 2018). Using conservative{" "}
                    <ParameterValue param={{ ...DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT, unit: "USD" }} figures={3} />. {treatyFundingCompact} ×{" "}
                    <ParameterValue param={DIH_TREASURY_TRIAL_SUBSIDIES_PCT} figures={1} /> allocated to patient subsidies ={" "}
                    {formatFlowCompactCurrency(DFDA_TRIAL_SUBSIDIES_ANNUAL, 3)} ÷{" "}
                    <ParameterValue param={{ ...DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT, unit: "USD" }} figures={3} /> = {dfdaPatientsFundableCompact} patients tested per year. Current global trial participation: {currentTrialSlotsCompact} patients/year (IQVIA 2022).
                  </p>
                </DetailsBlock>
                <p className="text-xl font-black leading-tight">
                  That&apos;s <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} display="withUnit" figures={2} /> more clinical trial capacity. Disease eradication compresses from{" "}
                  <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} display="integer" /> years to{" "}
                  <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} display="integer" />.
                </p>
                <DetailsBlock>
                  <p>
                    {dfdaPatientsFundableCompact} funded patients ÷ {currentTrialSlotsCompact} current = {trialCapacityMultiplierPreciseText}x multiplier.{" "}
                    <ParameterValue param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT} figures={3} /> diseases currently have no effective treatment (<ParameterValue param={FLOW_DISEASES_WITHOUT_EFFECTIVE_TREATMENT_PCT} figures={2} /> of ~<ParameterValue param={RARE_DISEASES_COUNT_GLOBAL} figures={1} /> rare diseases per Orphanet 2024). At today&apos;s rate, first-ever treatments emerge for{" "}
                    <ParameterValue param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR} figures={2} /> new diseases/year.{" "}
                    <ParameterValue param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT} figures={3} /> ÷{" "}
                    <ParameterValue param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR} figures={2} /> = <strong><ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} display="integer" /> years</strong> to clear the queue. With {trialCapacityMultiplierPreciseText}x capacity: {statusQuoQueueYearsText} ÷ {trialCapacityMultiplierPreciseText} = <strong><ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} display="integer" /> years</strong>.
                  </p>
                </DetailsBlock>
                <p className="text-xl font-black leading-tight">
                  <ParameterValue param={FLOW_TOTAL_LIVES_SAVED} figures={3} /> people don&apos;t die of a curable disease while waiting. Plus{" "}
                  <ParameterValue param={FLOW_TOTAL_SUFFERING_HOURS} figures={3} /> hours of suffering doesn&apos;t happen.
                </p>
                <DetailsBlock>
                  <p>
                    Average treatment arrival accelerates by{" "}
                    <ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS} figures={3} /> years (<ParameterValue param={DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS} figures={3} /> from more trials +{" "}
                    <ParameterValue param={EFFICACY_LAG_YEARS} figures={2} /> from eliminating FDA&apos;s efficacy-testing lag). Over that window: global disease deaths (~{formatFlowCompactParam(GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES, 2)}/year) × avoidable fraction × years ={" "}
                    <ParameterValue param={FLOW_TOTAL_LIVES_SAVED} figures={3} /> deaths prevented (95% CI: {totalLivesSavedCiText}). Suffering:{" "}
                    <ParameterValue param={FLOW_TOTAL_SUFFERING_HOURS} figures={3} /> hours (95% CI: {totalSufferingHoursCiText}) from DALY YLD component × hours per year. Full calculation at manual.warondisease.org.
                  </p>
                </DetailsBlock>
                <FlowParagraph>Every number above has a citation. This math is not my opinion.</FlowParagraph>
              </div>
            )}
            <FlowButtonRow>
              <Button asChild className={dismissButtonClass}>
                <a
                  href="https://manual.warondisease.org"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => go("neat", true)}
                >
                  I want to check that
                </a>
              </Button>
              <Button className={primaryButtonClass} onClick={() => go("neat")}>
                Okay, I buy it
              </Button>
            </FlowButtonRow>
          </>
        );

      case "neat":
        return (
          <>
            <div className="space-y-4">
              {alt ? (
                <>
                  <FlowParagraph>Respect. Still, imagine:</FlowParagraph>
                  <FlowParagraph>
                    You trigger a chain reaction that gets a majority of humanity — <ParameterValue param={FLOW_MAJORITY_OF_HUMANS_ON_EARTH} figures={1} /> people — to collectively agree: &quot;Yes, we are willing to sacrifice one apocalypse of our <ParameterValue param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} figures={3} /> apocalypse capacity in exchange for eradicating disease within our lifetimes.&quot;
                  </FlowParagraph>
                </>
              ) : (
                <>
                  <FlowParagraph>
                    Imagine you triggered a chain reaction that got a majority of humanity — <ParameterValue param={FLOW_MAJORITY_OF_HUMANS_ON_EARTH} figures={1} /> people — to collectively agree:
                  </FlowParagraph>
                  <FlowParagraph>
                    &quot;Yes, we are willing to sacrifice one apocalypse of our <ParameterValue param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} figures={3} /> apocalypse capacity in exchange for eradicating disease within our lifetimes.&quot;
                  </FlowParagraph>
                </>
              )}
              <FlowParagraph>{"Wouldn't that be neat?"}</FlowParagraph>
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => go("twoHumans", true)}>
                Not neat
              </Button>
              <Button className={primaryButtonClass} onClick={() => go("twoHumans")}>
                Neat
              </Button>
            </FlowButtonRow>
          </>
        );

      case "twoHumans":
        return (
          <>
            <div className="space-y-4">
              {alt ? (
                <>
                  <FlowParagraph>{"Fair. But here's why it's easier than you think:"}</FlowParagraph>
                  <FlowParagraph>Only 2 of your contacts need to keep going. Two humans. Not 2 percent. Everyone else can ignore you.</FlowParagraph>
                  <FlowParagraph>2 → 4 → 8 → 16... {FLOW_DOUBLING_ROUNDS_TO_TARGET} rounds reaches {majorityHumanityText}. One per week = {FLOW_DOUBLING_MONTHS_AT_WEEKLY_PACE} months.</FlowParagraph>
                  <FlowParagraph>Yes, this is technically a chain letter. The old ones threatened 7 years of bad luck if you broke the chain. If this chain breaks, you and everyone you love will suffer and die of curable diseases. Which is also bad luck.</FlowParagraph>
                </>
              ) : (
                <>
                  <FlowParagraph>For that chain reaction to reach {majorityHumanityText}, only 2 of your contacts need to keep going. Two humans. Not 2 percent. Everyone else can ignore you.</FlowParagraph>
                  <FlowParagraph>Why only 2? If 2 people each tell 2 more, and each of those tells 2 more: {FLOW_DOUBLING_ROUNDS_TO_TARGET} rounds reaches {majorityHumanityText}. At one per day, {FLOW_DOUBLING_ROUNDS_TO_TARGET} days. At one per week, {FLOW_DOUBLING_MONTHS_AT_WEEKLY_PACE} months.</FlowParagraph>
                  <FlowParagraph>Yes, this is technically a chain letter. The old ones threatened 7 years of bad luck if you broke the chain. If this chain breaks, you and everyone you love will suffer and die of curable diseases. Which is also bad luck.</FlowParagraph>
                  <DetailsBlock summary="Has a chain letter ever actually worked?">
                    <p>{"In 1935, a billion people handwrote letters, bought stamps, and mailed actual money to strangers because a piece of paper promised them $1,562.50 that didn't exist. The promise was a lie. The threat was fake. Some of them probably died driving to the post office."}</p>
                    <p>This one requires touching a glowing rectangle a few times. It costs nothing. There are no stamps. And the threat — that you and everyone you love will suffer and die of curable diseases if nobody funds the research — is not a superstition. It is an epidemiological fact.</p>
                    <p>So it should probably do fine.</p>
                  </DetailsBlock>
                </>
              )}
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => go("perVote", true)}>
                Still too much
              </Button>
              <Button className={primaryButtonClass} onClick={() => go("perVote")}>
                Okay, two humans
              </Button>
            </FlowButtonRow>
          </>
        );

      case "perVote":
        return (
          <>
            <div className="space-y-4">
              {alt ? (
                <>
                  <FlowParagraph>I know. Math again. Last one that matters:</FlowParagraph>
                  <FlowParagraph>Majority of humanity ({majorityHumanityText}) agreeing the 1% Treaty is a good idea makes it politically unstoppable.</FlowParagraph>
                  <p className="text-xl font-black leading-tight">One vote = 1 lifetime of suffering prevented. One vote = {voterLivesSavedText} lives saved.</p>
                  <FlowParagraph>Every person you get to vote adds another lifetime to your Inverse Kills Score.</FlowParagraph>
                </>
              ) : (
                <>
                  <p className="text-xl font-black leading-tight">One vote = 1 full human lifetime of suffering prevented. (<ParameterValue param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED} figures={2} /> years of it.)</p>
                  <p className="text-xl font-black leading-tight">One vote = <ParameterValue param={FLOW_VOTER_LIVES_SAVED_ROUNDED} figures={2} /> lives saved.</p>
                  <DetailsBlock>
                    <p>
                      Getting a majority of humanity ({majorityHumanityText} people) to agree the treaty is a good idea makes it politically unstoppable.{" "}
                      <ParameterValue param={FLOW_TOTAL_LIVES_SAVED} figures={3} /> deaths prevented ÷ {majorityHumanityText} voters ={" "}
                      <strong><ParameterValue param={FLOW_VOTER_LIVES_SAVED} figures={4} /> lives per vote</strong>.{" "}
                      <ParameterValue param={FLOW_TOTAL_SUFFERING_HOURS} figures={3} /> hours of suffering prevented ÷ {majorityHumanityText} voters ={" "}
                      <strong><ParameterValue param={FLOW_VOTER_SUFFERING_HOURS_PREVENTED} figures={4} /> hours per vote</strong>. At{" "}
                      <ParameterValue param={HOURS_PER_YEAR} figures={3} /> hours/year ={" "}
                      <strong>~<ParameterValue param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED} figures={2} /> person-years</strong> = roughly one full human lifetime.
                    </p>
                  </DetailsBlock>
                  <FlowParagraph>Your vote already did this. Every person you get to vote adds another lifetime to your Inverse Kills Score.</FlowParagraph>
                </>
              )}
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => go("sendName", true)}>
                I reject mathematics
              </Button>
              <Button className={primaryButtonClass} onClick={() => go("sendName")}>
                Show me mine
              </Button>
            </FlowButtonRow>
          </>
        );

      case "sendName":
        return (
          <>
            <div className="space-y-5">
              {alt ? <FlowParagraph>One at a time. Bear with me.</FlowParagraph> : null}
              <FlowParagraph>{sentCount === 0 ? "Who do you want to tell first?" : "Who's next?"}</FlowParagraph>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase" htmlFor="post-vote-recipient-name">
                    First name
                  </Label>
                  <Input
                    id="post-vote-recipient-name"
                    value={recipientName}
                    onChange={(event) => {
                      setRecipientName(event.target.value);
                      setInvitation(null);
                      setMessage("");
                      setError(null);
                    }}
                    placeholder="Jake"
                    className="border-4 border-primary bg-background font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase" htmlFor="post-vote-recipient-email">
                    Their email {sentCount === 0 ? "(optional — we'll nudge them so you don't have to)" : "(optional)"}
                  </Label>
                  <Input
                    id="post-vote-recipient-email"
                    value={recipientEmail}
                    onChange={(event) => {
                      setRecipientEmail(event.target.value);
                      setInvitation(null);
                      setMessage("");
                      setError(null);
                    }}
                    placeholder="jake@example.com"
                    className="border-4 border-primary bg-background font-bold"
                    type="email"
                  />
                </div>
              </div>
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => handleNameContinue(true)}>
                Let me just copy
              </Button>
              <Button className={primaryButtonClass} onClick={() => handleNameContinue(false)}>
                Continue
              </Button>
            </FlowButtonRow>
          </>
        );

      case "sendFormat":
        if (sentCount > 0 && !showFormatSwitch) {
          return (
            <>
              <FlowParagraph>Same format for {displayName}, or switch?</FlowParagraph>
              <FlowButtonRow>
                <Button className={dismissButtonClass} onClick={() => go("sendMessage")}>
                  Same
                </Button>
                <Button className={primaryButtonClass} onClick={() => setShowFormatSwitch(true)}>
                  Switch
                </Button>
              </FlowButtonRow>
            </>
          );
        }

        return (
          <>
            <div className="space-y-4">
              <FlowParagraph>How do you want to tell {displayName}?</FlowParagraph>
              <TaskPreview senderName={senderName} />
              <div className="border-4 border-primary bg-background p-4 text-sm font-bold leading-snug">
                {`"Hi ${displayName}. I love you very much and I don't want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease? warondisease.org"`}
              </div>
            </div>
            <FlowButtonRow>
              <Button
                className={dismissButtonClass}
                onClick={() => {
                  setMessageFormat("TASK_NOTIFICATION");
                  go("sendMessage");
                }}
              >
                Assign the task
              </Button>
              <Button
                className={primaryButtonClass}
                onClick={() => {
                  setMessageFormat("SINCERE");
                  go("sendMessage");
                }}
              >
                Send the nice one
              </Button>
            </FlowButtonRow>
          </>
        );

      case "sendMessage":
        return (
          <>
            <div className="space-y-4">
              <FlowParagraph>
                {messageFormat === "TASK_NOTIFICATION"
                  ? `Here's ${displayName}'s task assignment:`
                  : `Here's your message to ${displayName}:`}
              </FlowParagraph>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-72 border-4 border-primary bg-background font-mono text-sm"
                disabled={isCreating}
              />
            </div>
            <FlowButtonRow>
              <Button className={primaryButtonClass} onClick={() => void handleCopy()} disabled={isCreating}>
                <Clipboard className="mr-2 h-5 w-5" aria-hidden="true" />
                {copyState === "copied" ? "Copied" : "Copy"}
              </Button>
              {recipientEmail.trim() ? (
                <Button className={dismissButtonClass} onClick={() => void handleSendEmail()} disabled={isCreating || isSending}>
                  <Mail className="mr-2 h-5 w-5" aria-hidden="true" />
                  <span className="min-w-0 truncate">
                    {isSending ? "Sending..." : `Send email to ${recipientEmail.trim()} for me`}
                  </span>
                </Button>
              ) : null}
            </FlowButtonRow>
          </>
        );

      case "copyConfirm":
        return (
          <>
            <FlowParagraph>{`Now paste it into your texts, WhatsApp, email, Signal — whichever gets to ${displayName} fastest. Come back here when you've sent it.`}</FlowParagraph>
            <Button className={primaryButtonClass} onClick={completeCurrentInvitation}>
              I sent it
            </Button>
          </>
        );

      case "sendConfirm":
        return (
          <>
            <FlowParagraph>{`Sent to ${recipientEmail.trim()}. We'll gently nudge them in 3 days if they haven't voted yet.`}</FlowParagraph>
            <Button className={primaryButtonClass} onClick={completeCurrentInvitation}>
              Continue
            </Button>
          </>
        );

      case "sendImpact": {
        const milestone = milestoneCopy(sentCount);
        return (
          <>
            {sentCount <= 1 ? (
              <div className="space-y-4">
                <p className="text-xl font-black leading-tight">When {lastRecipientName || displayName} votes: +1 lifetime of suffering prevented. +{voterLivesSavedText} lives saved.</p>
                <FlowParagraph>Your pending totals:</FlowParagraph>
                <FlowParagraph>Lifetimes of suffering prevented: <strong>{sentCount}</strong></FlowParagraph>
                <FlowParagraph>Inverse Kills Score: <strong>{pendingLives} lives</strong></FlowParagraph>
                <FlowParagraph>{`We'll email you the moment ${lastRecipientName || displayName} votes. Pending numbers turn into locked-in numbers.`}</FlowParagraph>
                <FlowParagraph>Most humans stop here. Which is statistically disappointing, but fine.</FlowParagraph>
                <FlowParagraph>One more?</FlowParagraph>
              </div>
            ) : (
              <div className="space-y-4">
                <FlowParagraph>Sent to {lastRecipientName || displayName}.</FlowParagraph>
                <FlowParagraph>Lifetimes of suffering prevented (pending): <strong>{sentCount}</strong></FlowParagraph>
                <FlowParagraph>Inverse Kills Score (pending): <strong>{pendingLives} lives</strong></FlowParagraph>
                {milestone ? <FlowParagraph>{milestone}</FlowParagraph> : null}
                <FlowParagraph>One more?</FlowParagraph>
              </div>
            )}
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => go("depthHook", true)}>
                {sentCount <= 1 ? "No, I'm done" : "I'm done"}
              </Button>
              <Button
                className={primaryButtonClass}
                onClick={() => {
                  resetCurrentRecipient();
                  go("sendName");
                }}
              >
                {sentCount <= 1 ? "Yes, one more" : "One more"}
              </Button>
            </FlowButtonRow>
          </>
        );
      }

      case "depthHook":
        return (
          <>
            <div className="space-y-4">
              {alt ? <FlowParagraph>Fine. One optional thing:</FlowParagraph> : <FlowParagraph>You just messaged {sentCount} people.</FlowParagraph>}
              <FlowParagraph>The chain continues past round 2 only if someone keeps going. Want us to email you in a few days to send to one more?</FlowParagraph>
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => void handleDepthHook(false)}>
                No thanks
              </Button>
              <Button className={primaryButtonClass} onClick={() => void handleDepthHook(true)}>
                Yes, nudge me
              </Button>
            </FlowButtonRow>
          </>
        );

      case "close":
        return (
          <>
            <div className="space-y-4">
              {dismissiveCount >= 5 ? (
                <FlowParagraph>{`You clicked "go to hell" ${dismissiveCount} times and you're still reading. That is data.`}</FlowParagraph>
              ) : null}
              <FlowParagraph>{"The chain only breaks if one human says \"later.\" Is that human you?"}</FlowParagraph>
              <FlowParagraph>{`In ${FLOW_DOUBLING_ROUNDS_TO_TARGET} rounds we run out of humans to ask. That's months, not decades.`}</FlowParagraph>
              <FlowParagraph>Then you get to go back to whatever you were doing before the most important thing in the universe rudely interrupted.</FlowParagraph>
            </div>
            <Button className={primaryButtonClass} onClick={() => go("feedback")}>
              Done
            </Button>
          </>
        );

      case "feedback":
        return (
          <>
            <div className="space-y-4">
              {sentCount === 0 ? (
                <>
                  <FlowParagraph>{"You went through this entire thing and didn't send it to anyone. That's useful data for us."}</FlowParagraph>
                  <FlowParagraph>What would we have to change to make you send it to everyone you love?</FlowParagraph>
                </>
              ) : sentCount >= 5 ? (
                <>
                  <FlowParagraph>{`You sent to ${sentCount} people. You're clearly not the problem.`}</FlowParagraph>
                  <FlowParagraph>{"What would make this work better for the people who aren't you?"}</FlowParagraph>
                </>
              ) : (
                <>
                  <FlowParagraph>{"One last thing. We're trying to make this the most effective chain letter in history."}</FlowParagraph>
                  <FlowParagraph>What would we have to change about this to make you send it to everyone you love?</FlowParagraph>
                </>
              )}
              <Textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                className="min-h-40 border-4 border-primary bg-background font-bold"
              />
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={goDashboard}>
                Skip
              </Button>
              <Button className={primaryButtonClass} onClick={() => setScreen("submitted")}>
                Submit
              </Button>
            </FlowButtonRow>
          </>
        );

      case "submitted":
        return (
          <>
            <FlowParagraph>Noted. Thank you for helping us end disease slightly faster.</FlowParagraph>
          </>
        );
    }
  };

  return (
    <Card className="overflow-hidden border-4 border-primary bg-background p-0 text-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="space-y-6 p-5">
        {renderScreen()}
        {error ? (
          <p className="border-4 border-primary bg-brutal-pink px-3 py-2 text-sm font-black text-brutal-pink-foreground">
            {error}
          </p>
        ) : null}
        {copyState === "copied" && screen !== "copyConfirm" ? (
          <p className="flex items-center gap-2 text-sm font-black uppercase">
            <Check className="h-4 w-4" aria-hidden="true" />
            Copied
          </p>
        ) : null}
      </div>
    </Card>
  );
}
