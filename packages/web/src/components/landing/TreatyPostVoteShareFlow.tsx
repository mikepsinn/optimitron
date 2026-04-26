"use client";

import { nanoid } from "nanoid";
import { Check, Clipboard, Mail, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Textarea } from "@/components/retroui/Textarea";
import {
  TreatyFlowButtonRow,
  TreatyFlowParagraph,
  TreatyFlowShell,
  treatyInputClass,
  treatyPrimaryButtonClass,
  treatySecondaryButtonClass,
  treatyTextareaClass,
} from "@/components/landing/TreatyFlowShell";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { TreatyMechanismExplainer } from "@/components/shared/TreatyMechanismExplainer";
import {
  trackTreatyPostVoteDepthHook,
  trackTreatyPostVoteDetailsExpanded,
  trackTreatyPostVoteFeedback,
  trackTreatyPostVoteFormatChoice,
  trackTreatyPostVoteInvitationAction,
  trackTreatyPostVoteScreenAdvanced,
} from "@/lib/analytics";
import {
  HOURS_PER_YEAR,
  SAFE_COMPOUNDS_COUNT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  UNEXPLORED_RATIO,
} from "@optimitron/data/parameters";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  getReferralInvitationFirstName,
  type ReferralInvitationMessageFormat,
} from "@/lib/referral-invitation-copy";
import {
  buildReferralInvitationShareMessage,
  createReferralInvitationRequest,
  getReferralInvitationSenderName,
  updateReferralInvitationRequest,
  type ReferralInvitationClientRecord,
} from "@/lib/referral-invitation-client";
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
  formatFlowWords,
} from "@/lib/treaty-share-flow-parameters";
import { embedShareAttemptId } from "@/lib/share-channels";
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
  | "feedback";

interface TreatyPostVoteShareFlowProps {
  answer: "yes" | "no";
}

const primaryButtonClass = treatyPrimaryButtonClass;
const dismissButtonClass = treatySecondaryButtonClass;

const majorityHumanityText = formatFlowWords(FLOW_MAJORITY_OF_HUMANS_ON_EARTH, 1);
const statusQuoQueueYearsText = formatFlowWords(STATUS_QUO_QUEUE_CLEARANCE_YEARS, 3);
const voterLivesSavedText = formatFlowWords(FLOW_VOTER_LIVES_SAVED_ROUNDED, 2);

function FlowParagraph({
  children,
  dropCap = false,
}: {
  children: ReactNode;
  dropCap?: boolean;
}) {
  return (
    <TreatyFlowParagraph dropCap={dropCap}>
      {children}
    </TreatyFlowParagraph>
  );
}

function FlowButtonRow({ children }: { children: ReactNode }) {
  return <TreatyFlowButtonRow>{children}</TreatyFlowButtonRow>;
}

function DetailsBlock({
  children,
  summary = "Show the math",
  detailId,
  screen,
}: {
  children: ReactNode;
  summary?: string;
  detailId: string;
  screen: FlowScreen;
}) {
  return (
    <details
      className="border-y border-[#23180d]/25 py-3 text-center text-sm font-bold leading-7 text-[#2f2417] sm:text-left"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          trackTreatyPostVoteDetailsExpanded({ detailId, screen });
        }
      }}
    >
      <summary className="cursor-pointer font-black uppercase tracking-[0.12em] text-[#23180d]">{summary}</summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

function TaskPreview({ senderName }: { senderName: string }) {
  const assignedBy = senderName || "[Your name]";

  return (
    <div
      className="border border-[#23180d] bg-[#fffdf8] p-4 text-left text-sm font-bold leading-7 text-[#23180d]"
      data-testid="bossy-task-preview"
    >
      <p className="mb-4 text-center text-xs font-black uppercase tracking-[0.18em] text-[#5e513f]">
        Overdue Task
      </p>
      <dl className="space-y-3">
        <div>
          <dt className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#5e513f]">
            Task
          </dt>
          <dd className="text-base font-black">End War and Disease</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#5e513f]">
            Assigned By
          </dt>
          <dd>{assignedBy}</dd>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#5e513f]">
              Time
            </dt>
            <dd>30 seconds</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#5e513f]">
              Due
            </dt>
            <dd>about {statusQuoQueueYearsText} years ago</dd>
          </div>
        </div>
        <div>
          <dt className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#5e513f]">
            Action
          </dt>
          <dd>Vote on the 1% Treaty</dd>
        </div>
      </dl>
    </div>
  );
}

function SincerePreview({ displayName }: { displayName: string }) {
  return (
    <div className="border-y border-[#23180d]/25 py-4 text-center text-sm font-bold leading-7 text-[#2f2417] sm:text-left">
      {`"Hi ${displayName}. I love you very much and I don't want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease? warondisease.org"`}
    </div>
  );
}

function MessageModeToggle({
  value,
  onChange,
}: {
  value: ReferralInvitationMessageFormat;
  onChange: (value: ReferralInvitationMessageFormat) => void;
}) {
  const options: Array<{
    label: string;
    value: ReferralInvitationMessageFormat;
  }> = [
    { label: "Love mode", value: "SINCERE" },
    { label: "Bossy mode", value: "TASK_NOTIFICATION" },
  ];

  return (
    <div
      aria-label="Message mode"
      className="grid grid-cols-2 overflow-hidden border border-[#23180d]"
      role="group"
    >
      {options.map((option, index) => {
        const selected = value === option.value;
        return (
          <button
            aria-pressed={selected}
            className={[
              "min-h-14 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.16em] transition-colors sm:text-sm",
              index > 0 ? "border-l border-[#23180d]" : "",
              selected
                ? "bg-[#23180d] text-[#fffaf0]"
                : "bg-[#fbf7ee] text-[#23180d] hover:bg-[#efe4cf]",
            ].join(" ")}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function TreatyMathDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      aria-labelledby="treaty-math-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-[90] overflow-y-auto bg-[#fbf7ee] px-4 py-6 text-[#23180d] [font-family:var(--v0-font-libre-baskerville)] sm:px-8 sm:py-10"
      data-testid="treaty-math-dialog"
      role="dialog"
    >
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4 border-b border-[#23180d]/30 pb-4">
          <h2
            className="text-xl font-black uppercase tracking-[0.16em] text-[#23180d] sm:text-2xl"
            id="treaty-math-dialog-title"
          >
            Treaty Math
          </h2>
          <Button
            aria-label="Close math dialog"
            className={`${dismissButtonClass} min-h-11 px-3 py-2`}
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <TreatyMechanismExplainer detailMode="expanded" />

        <div className="grid gap-3 border-t border-[#23180d]/30 pt-4 sm:grid-cols-2">
          <Button asChild className={dismissButtonClass}>
            <a href="https://manual.warondisease.org" rel="noreferrer" target="_blank">
              Open Manual
            </a>
          </Button>
          <Button className={primaryButtonClass} onClick={onClose} type="button">
            Close Math
          </Button>
        </div>
      </div>
    </div>
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
    useState<ReferralInvitationMessageFormat>("SINCERE");
  const [showFormatSwitch, setShowFormatSwitch] = useState(false);
  const [invitation, setInvitation] = useState<ReferralInvitationClientRecord | null>(null);
  const [message, setMessage] = useState("");
  const [sentCount, setSentCount] = useState(0);
  const [lastRecipientName, setLastRecipientName] = useState("");
  const [completedInvitationIds, setCompletedInvitationIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mathDialogOpen, setMathDialogOpen] = useState(false);

  const senderName = getReferralInvitationSenderName(session?.user);
  const firstName = getReferralInvitationFirstName(recipientName);
  const displayName = firstName || "Jake";
  const pendingLives = formatLives(sentCount * FLOW_VOTER_LIVES_SAVED_ROUNDED.value);

  const advanceTo = useCallback((
    next: FlowScreen,
    options: { dismissive?: boolean; sentCount?: number } = {},
  ) => {
    const dismissive = options.dismissive ?? false;
    const trackedSentCount = options.sentCount ?? sentCount;
    const nextDismissiveCount = dismissive ? dismissiveCount + 1 : dismissiveCount;
    trackTreatyPostVoteScreenAdvanced({
      from: screen,
      to: next,
      dismissive,
      dismissiveCount: nextDismissiveCount,
      sentCount: trackedSentCount,
    });
    setAlt(dismissive);
    if (dismissive) {
      setDismissiveCount((count) => count + 1);
    }
    setScreen(next);
  }, [dismissiveCount, screen, sentCount]);

  const go = useCallback((next: FlowScreen, dismissive = false) => {
    advanceTo(next, { dismissive });
  }, [advanceTo]);

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
      const created = await createReferralInvitationRequest({
        recipientName: trimmedName,
        recipientEmail: recipientEmail.trim() || null,
        contactMethod: recipientEmail.trim() ? "EMAIL" : "COPY",
        messageFormat,
      });

      setInvitation(created);
      return created;
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
    setMessage(
      buildReferralInvitationShareMessage({
        invitation,
        messageFormat,
        senderName,
        user: session?.user,
      }),
    );
  }, [invitation, messageFormat, senderName, session?.user]);

  useEffect(() => {
    if (!mathDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMathDialogOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mathDialogOpen]);

  const openMathDialog = useCallback(() => {
    trackTreatyPostVoteDetailsExpanded({ detailId: "all-math", screen: "math" });
    setMathDialogOpen(true);
  }, []);

  const completeCurrentInvitation = useCallback(() => {
    if (!invitation || completedInvitationIds.has(invitation.id)) {
      advanceTo("sendImpact");
      return;
    }

    const nextSentCount = sentCount + 1;
    trackTreatyPostVoteInvitationAction({
      action: "sent_confirmed",
      messageFormat,
      hasEmail: Boolean(invitation.recipientEmail),
      sentCount: nextSentCount,
    });
    setCompletedInvitationIds((ids) => {
      const next = new Set(ids);
      next.add(invitation.id);
      return next;
    });
    setLastRecipientName(getReferralInvitationFirstName(invitation.recipientName));
    setSentCount((count) => count + 1);
    advanceTo("sendImpact", { sentCount: nextSentCount });
  }, [advanceTo, completedInvitationIds, invitation, messageFormat, sentCount]);

  const handleNameContinue = useCallback((dismissive = false) => {
    if (!recipientName.trim()) {
      setError("First name is required.");
      return;
    }
    setError(null);
    go("sendFormat", dismissive);
  }, [go, recipientName]);

  const handleCopy = useCallback(async () => {
    const created = await createInvitation();
    if (!created) return;

    const defaultText = buildReferralInvitationShareMessage({
      invitation: created,
      messageFormat,
      senderName,
      user: session?.user,
    });
    const text = message || defaultText;
    const shareAttemptId = nanoid();
    const inviteUrl = buildUserInviteReferralUrl(session?.user, created.inviteToken, getBaseUrl());
    const copiedText = embedShareAttemptId(text, inviteUrl, shareAttemptId);

    try {
      await copyTextToClipboard(copiedText);
      trackTreatyPostVoteInvitationAction({
        action: "copy",
        messageFormat,
        hasEmail: Boolean(created.recipientEmail),
        sentCount,
      });
      await updateReferralInvitationRequest({
        id: created.id,
        action: "markCopied",
        messageText: copiedText,
        shareAttemptId,
        wasEdited: text !== defaultText,
      });
      setMessage(copiedText);
      setCopyState("copied");
      advanceTo("copyConfirm");
    } catch {
      setCopyState("error");
      setError("Copy failed.");
    }
  }, [advanceTo, createInvitation, message, messageFormat, senderName, sentCount, session?.user]);

  const handleSendEmail = useCallback(async () => {
    const created = await createInvitation();
    if (!created?.recipientEmail) return;

    setIsSending(true);
    setError(null);
    try {
      const payload = await updateReferralInvitationRequest({
        id: created.id,
        action: "sendEmail",
        messageText: message,
      });

      if (payload.status !== "sent") {
        throw new Error("Could not send this invitation.");
      }
      if (payload.invitation) {
        setInvitation(payload.invitation);
      }
      trackTreatyPostVoteInvitationAction({
        action: "send_email",
        messageFormat,
        hasEmail: true,
        sentCount,
      });
      advanceTo("sendConfirm");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send this invitation.");
    } finally {
      setIsSending(false);
    }
  }, [advanceTo, createInvitation, message, messageFormat, sentCount]);

  const handleDepthHook = useCallback(async (wantsReminder: boolean) => {
    trackTreatyPostVoteDepthHook({ wantsReminder, sentCount });
    if (wantsReminder && invitation) {
      await updateReferralInvitationRequest({
        id: invitation.id,
        action: "senderReminderOptIn",
      }).catch(() => undefined);
    }
    go("close", !wantsReminder);
  }, [go, invitation, sentCount]);

  const goDashboard = useCallback(() => {
    window.location.href = ROUTES.dashboard;
  }, []);

  const handleFeedbackSkip = useCallback(() => {
    trackTreatyPostVoteFeedback({
      submitted: false,
      sentCount,
      characterCount: feedback.trim().length,
    });
    goDashboard();
  }, [feedback, goDashboard, sentCount]);

  const handleFeedbackSubmit = useCallback(() => {
    trackTreatyPostVoteFeedback({
      submitted: true,
      sentCount,
      characterCount: feedback.trim().length,
    });
    goDashboard();
  }, [feedback, goDashboard, sentCount]);

  const renderScreen = () => {
    switch (screen) {
      case "opening":
        return (
          <>
            <div className="space-y-4">
              <FlowParagraph dropCap>
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
                <TreatyMechanismExplainer detailMode="none" />
              </div>
            ) : (
              <TreatyMechanismExplainer
                detailMode="none"
              />
            )}
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={openMathDialog} type="button">
                Check the math
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
                    You trigger a chain reaction that gets a majority of humans on Earth — <ParameterValue param={FLOW_MAJORITY_OF_HUMANS_ON_EARTH} figures={1} /> people — to collectively agree: &quot;Yes, we are willing to sacrifice one apocalypse of our <ParameterValue param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} figures={3} /> apocalypse capacity in exchange for eradicating disease within our lifetimes.&quot;
                  </FlowParagraph>
                </>
              ) : (
                <>
                  <FlowParagraph>
                    Imagine you triggered a chain reaction that got a majority of humans on Earth — <ParameterValue param={FLOW_MAJORITY_OF_HUMANS_ON_EARTH} figures={1} /> people — to collectively agree:
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
                  <FlowParagraph>{"Fair. But here's the math:"}</FlowParagraph>
                  <FlowParagraph>Tell 2 friends. They tell 2. {FLOW_DOUBLING_ROUNDS_TO_TARGET} rounds reaches {majorityHumanityText}. {FLOW_DOUBLING_MONTHS_AT_WEEKLY_PACE} months at one per week.</FlowParagraph>
                  <FlowParagraph>Yes, technically a chain letter. The old ones threatened 7 years of bad luck. This one threatens dying of a curable disease. Which is also bad luck.</FlowParagraph>
                </>
              ) : (
                <>
                  <FlowParagraph>Tell 2 friends. They tell 2 friends. {FLOW_DOUBLING_ROUNDS_TO_TARGET} rounds reaches {majorityHumanityText} humans. That&apos;s {FLOW_DOUBLING_ROUNDS_TO_TARGET} days at one per day, {FLOW_DOUBLING_MONTHS_AT_WEEKLY_PACE} months at one per week. Everyone else can ignore you.</FlowParagraph>
                  <FlowParagraph>Yes, this is technically a chain letter. The old ones threatened 7 years of bad luck. This one threatens dying of a curable disease. Which is also bad luck.</FlowParagraph>
                  <DetailsBlock detailId="chain-letter-history" screen="twoHumans" summary="Has a chain letter ever actually worked?">
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
                  <FlowParagraph>A majority of humans on Earth ({majorityHumanityText}) agreeing the 1% Treaty is a good idea makes it politically unstoppable.</FlowParagraph>
                  <p className="text-center text-xl font-black leading-tight sm:text-left">One vote = 1 lifetime of suffering prevented. One vote = {voterLivesSavedText} lives saved.</p>
                  <FlowParagraph>Every person you get to vote adds another lifetime to your Inverse Kills Score.</FlowParagraph>
                </>
              ) : (
                <>
                  <p className="text-center text-xl font-black leading-tight sm:text-left">One vote = 1 full human lifetime of suffering prevented. (<ParameterValue param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED} figures={2} /> years of it.)</p>
                  <p className="text-center text-xl font-black leading-tight sm:text-left">One vote = <ParameterValue param={FLOW_VOTER_LIVES_SAVED_ROUNDED} figures={2} /> lives saved.</p>
                  <DetailsBlock detailId="per-vote-impact" screen="perVote">
                    <p>
                      Getting a majority of humans on Earth ({majorityHumanityText} people) to agree the treaty is a good idea makes it politically unstoppable.{" "}
                      <ParameterValue param={FLOW_TOTAL_LIVES_SAVED} figures={3} /> deaths prevented ÷ a majority of humans on Earth ({majorityHumanityText}) ={" "}
                      <strong><ParameterValue param={FLOW_VOTER_LIVES_SAVED} figures={4} /> lives per vote</strong>.{" "}
                      <ParameterValue param={FLOW_TOTAL_SUFFERING_HOURS} figures={3} /> hours of suffering prevented ÷ a majority of humans on Earth ({majorityHumanityText}) ={" "}
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
                    className={treatyInputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase" htmlFor="post-vote-recipient-email">
                    Their email {sentCount === 0 ? "(optional — we'll send task reminders so you don't have to)" : "(optional)"}
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
                    className={treatyInputClass}
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
          const currentMode = messageFormat === "SINCERE" ? "Love mode" : "Bossy mode";
          return (
            <>
              <FlowParagraph>Same mode ({currentMode}) for {displayName}, or switch?</FlowParagraph>
              <FlowButtonRow>
                <Button
                  className={dismissButtonClass}
                  onClick={() => {
                    trackTreatyPostVoteFormatChoice({
                      messageFormat,
                      sentCount,
                      switched: false,
                    });
                    go("sendMessage");
                  }}
                >
                  Same mode
                </Button>
                <Button className={primaryButtonClass} onClick={() => setShowFormatSwitch(true)}>
                  Switch mode
                </Button>
              </FlowButtonRow>
            </>
          );
        }

        return (
          <>
            <div className="space-y-4">
              <FlowParagraph>How do you want to tell {displayName}?</FlowParagraph>
              <MessageModeToggle
                value={messageFormat}
                onChange={(nextFormat) => {
                  setMessageFormat(nextFormat);
                  setInvitation(null);
                  setMessage("");
                  setError(null);
                }}
              />
              {messageFormat === "TASK_NOTIFICATION" ? (
                <TaskPreview senderName={senderName} />
              ) : (
                <SincerePreview displayName={displayName} />
              )}
            </div>
            <FlowButtonRow>
              <Button
                className={primaryButtonClass}
                onClick={() => {
                  trackTreatyPostVoteFormatChoice({
                    messageFormat,
                    sentCount,
                    switched: sentCount > 0,
                  });
                  go("sendMessage");
                }}
              >
                Continue
              </Button>
            </FlowButtonRow>
          </>
        );

      case "sendMessage":
        return (
          <>
            <div className="space-y-4">
              {messageFormat === "SINCERE" ? (
                <FlowParagraph>{`Here's your message to ${displayName}:`}</FlowParagraph>
              ) : null}
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className={`${treatyTextareaClass} min-h-72 font-mono text-sm`}
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
            <FlowParagraph>{`Sent to ${recipientEmail.trim()}. We'll send the first task reminder in 3 days if they haven't completed the vote task yet.`}</FlowParagraph>
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
                <p className="text-center text-xl font-black leading-tight sm:text-left">When {lastRecipientName || displayName} votes: +1 lifetime of suffering prevented. +{voterLivesSavedText} lives saved.</p>
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
              <FlowParagraph>The chain continues past round 2 only if someone keeps assigning the next Earth optimization task. Want us to email you in a few days to assign one more?</FlowParagraph>
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => void handleDepthHook(false)}>
                No thanks
              </Button>
              <Button className={primaryButtonClass} onClick={() => void handleDepthHook(true)}>
                Yes, send task reminder
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
                className={`${treatyTextareaClass} min-h-40 font-bold`}
              />
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={handleFeedbackSkip}>
                Skip
              </Button>
              <Button className={primaryButtonClass} onClick={handleFeedbackSubmit}>
                Submit
              </Button>
            </FlowButtonRow>
          </>
        );

    }
  };

  return (
    <>
      <TreatyFlowShell
        data-testid="treaty-post-vote-share-flow"
        contentClassName="max-w-3xl"
      >
        <div className="space-y-6 p-5">
          {renderScreen()}
          {error ? (
            <p className="border border-[#23180d] bg-[#fffdf8] px-3 py-2 text-sm font-black text-[#23180d]">
              {error}
            </p>
          ) : null}
          {copyState === "copied" && screen !== "copyConfirm" ? (
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[#23180d]">
              <Check className="h-4 w-4" aria-hidden="true" />
              Copied
            </p>
          ) : null}
        </div>
      </TreatyFlowShell>
      {mathDialogOpen ? (
        <TreatyMathDialog onClose={() => setMathDialogOpen(false)} />
      ) : null}
    </>
  );
}
