"use client";

import { nanoid } from "nanoid";
import { Check, Clipboard, Mail, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Textarea } from "@/components/retroui/Textarea";
import { RepresentedPersonForm } from "@/components/people/RepresentedPersonForm";
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
  trackTreatyPostVotePromotion,
  trackTreatyPostVoteDetailsExpanded,
  trackTreatyPostVoteFeedback,
  trackTreatyPostVoteFormatChoice,
  trackTreatyPostVoteInvitationAction,
  trackTreatyPostVoteScreenAdvanced,
} from "@/lib/analytics";
import type { TreatyFlowVariant } from "@/lib/treaty-flow-variants";
import {
  EVENTUALLY_AVOIDABLE_DEATH_PCT,
  GLOBAL_DISEASE_DEATHS_DAILY,
  HOURS_PER_YEAR,
  SAFE_COMPOUNDS_COUNT,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  UNEXPLORED_RATIO,
} from "@optimitron/data/parameters";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  buildReferralInvitationMessage,
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
import { buildUserInviteReferralUrl, buildUserReferralUrl, getBaseUrl } from "@/lib/url";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";

type FlowScreen =
  | "opening"
  | "stakes"
  | "nuclear"
  | "math"
  | "neat"
  | "twoHumans"
  | "perVote"
  | "representPerson"
  | "promotion"
  | "sendMessage"
  | "copyConfirm"
  | "sendConfirm"
  | "sendImpact"
  | "close"
  | "feedback";

interface TreatyPostVoteShareFlowProps {
  answer: "yes" | "no";
  flowVariant?: TreatyFlowVariant;
  initialAlt?: boolean;
  initialDismissiveCount?: number;
  initialScreen?: FlowScreen;
}

const primaryButtonClass = treatyPrimaryButtonClass;
const dismissButtonClass = treatySecondaryButtonClass;

const majorityHumanityText = formatFlowWords(FLOW_MAJORITY_OF_HUMANS_ON_EARTH, 1);
const voterLivesSavedText = formatFlowWords(FLOW_VOTER_LIVES_SAVED_ROUNDED, 2);
const draftInviteUrl = "warondisease.org";

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
  flowVariant,
  screen,
}: {
  children: ReactNode;
  summary?: string;
  detailId: string;
  flowVariant?: TreatyFlowVariant;
  screen: FlowScreen;
}) {
  return (
    <details
      className="border-y border-[var(--treaty-ink)]/25 py-3 text-center text-sm font-bold leading-7 text-[var(--treaty-ink-soft)] sm:text-left"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          trackTreatyPostVoteDetailsExpanded({ detailId, flowVariant, screen });
        }
      }}
    >
      <summary className="cursor-pointer font-black uppercase tracking-[0.12em] text-[var(--treaty-ink)]">{summary}</summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
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
      className="grid grid-cols-2 overflow-hidden border border-[var(--treaty-ink)]"
      role="group"
    >
      {options.map((option, index) => {
        const selected = value === option.value;
        return (
          <button
            aria-pressed={selected}
            className={[
              "min-h-14 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.16em] transition-colors sm:text-sm",
              index > 0 ? "border-l border-[var(--treaty-ink)]" : "",
              selected
                ? "bg-[var(--treaty-ink)] text-[#fffaf0]"
                : "bg-[var(--treaty-paper)] text-[var(--treaty-ink)] hover:bg-[#efe4cf]",
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

function buildDraftReferralMessage(input: {
  messageFormat: ReferralInvitationMessageFormat;
  recipientName: string;
  senderName: string;
}) {
  return buildReferralInvitationMessage({
    inviteUrl: draftInviteUrl,
    messageFormat: input.messageFormat,
    // When the user explicitly picks "Manage humanity" on the promotion screen
    // the recipient name is set to "humanity" and reads naturally in the
    // template ("Hi humanity. I love you..."). When they pick "Manage a friend"
    // the field is empty and we use "there" as a friendly placeholder until
    // they type a real name.
    recipientName: input.recipientName.trim() || "there",
    senderName: input.senderName,
  });
}

/**
 * Strip the draft `warondisease.org` placeholder from the editable message so
 * we can hand the remainder to ShareLinkButtons, which appends its own URL.
 */
function stripDraftInviteUrl(messageText: string): string {
  const draftUrlPattern = /\s*(?:https?:\/\/)?warondisease\.org\s*$/i;
  return messageText.replace(draftUrlPattern, "").trim();
}

function replaceDraftInviteUrl(messageText: string, inviteUrl: string) {
  const text = messageText.trim();
  if (!text) return inviteUrl;

  const draftUrlPattern = /https?:\/\/warondisease\.org|warondisease\.org/g;
  const textWithInviteUrl = text.replace(draftUrlPattern, inviteUrl);
  if (textWithInviteUrl !== text || textWithInviteUrl.includes(inviteUrl)) {
    return textWithInviteUrl;
  }

  return `${textWithInviteUrl}\n\n${inviteUrl}`;
}

const PREVENTABLE_DEATHS_PER_MS =
  (GLOBAL_DISEASE_DEATHS_DAILY.value * EVENTUALLY_AVOIDABLE_DEATH_PCT.value) /
  86_400_000;

type ContactPickerProperty = "name" | "email" | "tel" | "address" | "icon";

interface ContactInfo {
  name?: string[];
  email?: string[];
}

interface NavigatorContacts {
  select: (
    properties: ContactPickerProperty[],
    options?: { multiple?: boolean },
  ) => Promise<ContactInfo[]>;
}

interface NavigatorWithContacts extends Navigator {
  contacts?: NavigatorContacts;
}

function hasContactPickerSupport(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as NavigatorWithContacts;
  return Boolean(nav.contacts && typeof nav.contacts.select === "function");
}

async function pickContact(): Promise<ContactInfo | null> {
  if (!hasContactPickerSupport()) return null;
  const nav = navigator as NavigatorWithContacts;
  try {
    const contacts = await nav.contacts!.select(["name", "email"], {
      multiple: false,
    });
    return contacts[0] ?? null;
  } catch {
    return null;
  }
}

function useLivePreventableDeathCount(active: boolean): number {
  const COUNTER_WARMUP_MS = 2_000;
  const [count, setCount] = useState(() =>
    active ? Math.floor(COUNTER_WARMUP_MS * PREVENTABLE_DEATHS_PER_MS) : 0,
  );
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      startRef.current = null;
      setCount(0);
      return;
    }
    startRef.current = Date.now() - COUNTER_WARMUP_MS;
    const interval = setInterval(() => {
      if (!startRef.current) return;
      const elapsed = Date.now() - startRef.current;
      setCount(Math.floor(elapsed * PREVENTABLE_DEATHS_PER_MS));
    }, 100);
    return () => clearInterval(interval);
  }, [active]);

  return count;
}

function PromotionScreen({ onChoice }: { onChoice: (target: "friend" | "humanity") => void }) {
  const deathCount = useLivePreventableDeathCount(true);

  return (
    <>
      <div className="space-y-5">
        <p className="text-center text-2xl font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] sm:text-3xl">
          🎉 Congratulations
        </p>
        <FlowParagraph>
          You have been promoted to <strong>Humanity Manager</strong> at Earth Optimization Services, LLC.
        </FlowParagraph>
        <dl className="space-y-3 border-y border-[var(--treaty-ink)]/30 py-4 text-sm font-bold leading-7 text-[var(--treaty-ink-soft)] sm:text-base">
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink-muted)]">Direct reports</dt>
            <dd>~8 billion humans</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink-muted)]">Primary KPI</dt>
            <dd>Hours of human suffering prevented per week</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink-muted)]">Compensation</dt>
            <dd>~<ParameterValue param={TREATY_HALE_GAIN_YEAR_15} figures={3} /> extra years of healthy life + ~<ParameterValue param={TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA} figures={3} /> additional lifetime income. Vesting: treaty must pass. Forfeited on dismissal.</dd>
          </div>
        </dl>
        <FlowParagraph>
          <strong>Performance to date:</strong> ~<strong>{deathCount.toLocaleString()}</strong> preventable deaths since you started reading. Counter resets when you assign a task.
        </FlowParagraph>
      </div>
      <FlowButtonRow>
        <Button className={dismissButtonClass} onClick={() => onChoice("humanity")}>
          Manage humanity
        </Button>
        <Button className={primaryButtonClass} onClick={() => onChoice("friend")}>
          Manage a friend
        </Button>
      </FlowButtonRow>
    </>
  );
}

function TreatyMathDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      aria-labelledby="treaty-math-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-[90] overflow-y-auto bg-[var(--treaty-paper)] px-4 py-6 text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:px-8 sm:py-10"
      data-testid="treaty-math-dialog"
      role="dialog"
    >
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--treaty-ink)]/30 pb-4">
          <h2
            className="text-xl font-black uppercase tracking-[0.16em] text-[var(--treaty-ink)] sm:text-2xl"
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

        <div className="grid gap-3 border-t border-[var(--treaty-ink)]/30 pt-4 sm:grid-cols-2">
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

export function TreatyPostVoteShareFlow({
  answer,
  flowVariant,
  initialAlt = false,
  initialDismissiveCount = 0,
  initialScreen = "opening",
}: TreatyPostVoteShareFlowProps) {
  const { data: session } = useSession();
  const [screen, setScreen] = useState<FlowScreen>(initialScreen);
  const [alt, setAlt] = useState(initialAlt);
  const [dismissiveCount, setDismissiveCount] = useState(initialDismissiveCount);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [messageFormat, setMessageFormat] =
    useState<ReferralInvitationMessageFormat>("SINCERE");
  const [invitation, setInvitation] = useState<ReferralInvitationClientRecord | null>(null);
  const [message, setMessage] = useState("");
  const [messageEdited, setMessageEdited] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [lastRecipientName, setLastRecipientName] = useState("");
  const [completedInvitationIds, setCompletedInvitationIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mathDialogOpen, setMathDialogOpen] = useState(false);
  const [contactPickerSupported, setContactPickerSupported] = useState(false);

  useEffect(() => {
    setContactPickerSupported(hasContactPickerSupport());
  }, []);

  const handlePickContact = useCallback(async () => {
    const contact = await pickContact();
    if (!contact) return;
    const pickedName = contact.name?.[0]?.trim() ?? "";
    const pickedEmail = contact.email?.[0]?.trim() ?? "";
    if (pickedName) setRecipientName(pickedName);
    if (pickedEmail) setRecipientEmail(pickedEmail);
    setInvitation(null);
    setMessage("");
    setMessageEdited(false);
    setError(null);
  }, []);

  const senderName = getReferralInvitationSenderName(session?.user);
  const firstName = getReferralInvitationFirstName(recipientName);
  const displayName = firstName || "someone";
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
      flowVariant,
      sentCount: trackedSentCount,
    });
    setAlt(dismissive);
    if (dismissive) {
      setDismissiveCount((count) => count + 1);
    }
    setScreen(next);
  }, [dismissiveCount, flowVariant, screen, sentCount]);

  const go = useCallback((next: FlowScreen, dismissive = false) => {
    advanceTo(next, { dismissive });
  }, [advanceTo]);

  const resetCurrentRecipient = useCallback(() => {
    setRecipientName("");
    setRecipientEmail("");
    setInvitation(null);
    setMessage("");
    setMessageEdited(false);
    setCopyState("idle");
    setError(null);
  }, []);

  const createInvitation = useCallback(async (
    options: { messageText?: string | null } = {},
  ) => {
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
        messageText: options.messageText ?? null,
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
    if (screen !== "sendMessage" || invitation || messageEdited) return;
    setMessage(buildDraftReferralMessage({
      messageFormat,
      recipientName,
      senderName,
    }));
  }, [invitation, messageEdited, messageFormat, recipientName, screen, senderName]);

  useEffect(() => {
    if (screen !== "sendMessage" || !invitation || messageEdited) return;
    setMessage(
      buildReferralInvitationShareMessage({
        invitation,
        messageFormat,
        senderName,
        user: session?.user,
      }),
    );
  }, [invitation, messageEdited, messageFormat, screen, senderName, session?.user]);

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
    trackTreatyPostVoteDetailsExpanded({
      detailId: "all-math",
      flowVariant,
      screen: "math",
    });
    setMathDialogOpen(true);
  }, [flowVariant]);

  const completeCurrentInvitation = useCallback(() => {
    if (!invitation || completedInvitationIds.has(invitation.id)) {
      advanceTo("sendImpact");
      return;
    }

    const nextSentCount = sentCount + 1;
    trackTreatyPostVoteInvitationAction({
      action: "sent_confirmed",
      flowVariant,
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
  }, [advanceTo, completedInvitationIds, flowVariant, invitation, messageFormat, sentCount]);

  const handleCopy = useCallback(async () => {
    const created = await createInvitation();
    if (!created) return;

    const defaultText = buildReferralInvitationShareMessage({
      invitation: created,
      messageFormat,
      senderName,
      user: session?.user,
    });
    const inviteUrl = buildUserInviteReferralUrl(session?.user, created.inviteToken, getBaseUrl());
    const text = messageEdited
      ? replaceDraftInviteUrl(message, inviteUrl)
      : defaultText;
    const shareAttemptId = nanoid();
    const copiedText = embedShareAttemptId(text, inviteUrl, shareAttemptId);

    try {
      await copyTextToClipboard(copiedText);
      trackTreatyPostVoteInvitationAction({
        action: "copy",
        flowVariant,
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
      setMessageEdited(false);
      setCopyState("copied");
      advanceTo("copyConfirm");
    } catch {
      setCopyState("error");
      setError("Copy failed.");
    }
  }, [advanceTo, createInvitation, flowVariant, message, messageEdited, messageFormat, senderName, sentCount, session?.user]);

  const handleSendEmail = useCallback(async () => {
    const trimmedEmail = recipientEmail.trim();
    if (!trimmedEmail) return;

    setIsSending(true);
    setError(null);
    try {
      // Only send the user's typed text if they actually customized it. The
      // server replaces draft-URL placeholders with the real invite URL and
      // builds a default message when none is provided, so the recipient
      // gets a working link in either case.
      const customMessage = messageEdited ? message : null;

      let invitationId = invitation?.id ?? null;
      if (!invitationId) {
        const created = await createInvitation({ messageText: customMessage });
        if (!created) {
          return;
        }
        invitationId = created.id;
      }

      const payload = await updateReferralInvitationRequest({
        id: invitationId,
        action: "sendMessage",
        messageText: customMessage,
      });
      if (payload.status !== "sent" && payload.status !== "queued") {
        throw new Error(payload.error ?? "Could not send this invitation.");
      }

      trackTreatyPostVoteInvitationAction({
        action: "send_email",
        flowVariant,
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
  }, [advanceTo, createInvitation, flowVariant, invitation, message, messageEdited, messageFormat, recipientEmail, sentCount]);

  const handlePromotion = useCallback((target: "friend" | "humanity") => {
    // Analytics: keep the existing param name for backward compat — `true`
    // when the user opted into the more committed friend-targeted flow.
    trackTreatyPostVotePromotion({ flowVariant, wantsReminder: target === "friend", sentCount });
    if (target === "humanity") {
      setRecipientName("humanity");
    } else {
      setRecipientName("");
    }
    setRecipientEmail("");
    setInvitation(null);
    setMessage("");
    setMessageEdited(false);
    go("sendMessage", target === "humanity");
  }, [flowVariant, go, sentCount]);

  const goDashboard = useCallback(() => {
    window.location.href = ROUTES.dashboard;
  }, []);

  const handleFeedbackSkip = useCallback(() => {
    trackTreatyPostVoteFeedback({
      submitted: false,
      flowVariant,
      sentCount,
      characterCount: feedback.trim().length,
    });
    goDashboard();
  }, [feedback, flowVariant, goDashboard, sentCount]);

  const handleFeedbackSubmit = useCallback(() => {
    trackTreatyPostVoteFeedback({
      submitted: true,
      flowVariant,
      sentCount,
      characterCount: feedback.trim().length,
    });
    goDashboard();
  }, [feedback, flowVariant, goDashboard, sentCount]);

  const renderScreen = () => {
    const skippedOpening = initialScreen !== "opening";

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

      case "stakes": {
        const nextAfterStakes: FlowScreen = skippedOpening ? "math" : "nuclear";

        return (
          <>
            <div className="space-y-4">
              {answer === "no" && skippedOpening ? (
                <FlowParagraph>
                  You voted no. Totally fine. The math doesn&apos;t change.
                </FlowParagraph>
              ) : null}
              {alt ? <FlowParagraph>{"You and everyone you love are going to die of horrible diseases. Just so we're clear."}</FlowParagraph> : null}
              <FlowParagraph>
                Statistically, you and/or someone you love will get a horrible disease.{" "}
                <ParameterValue param={FLOW_DISEASES_WITHOUT_EFFECTIVE_TREATMENT_PCT} figures={2} />{" "}
                of diseases have zero FDA-approved treatments.{" "}
                <ParameterValue param={SAFE_COMPOUNDS_COUNT} figures={2} /> known-safe compounds sit on shelves, and{" "}
                <ParameterValue param={UNEXPLORED_RATIO} figures={3} /> of their potential uses have never been tested — because the money was busy turning into missiles.
              </FlowParagraph>
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => go(nextAfterStakes, true)}>
                I have chosen disease
              </Button>
              <Button className={primaryButtonClass} onClick={() => go(nextAfterStakes)}>
                Okay, go on
              </Button>
            </FlowButtonRow>
          </>
        );
      }

      case "nuclear":
        return (
          <>
            <div className="space-y-4">
              {alt ? <FlowParagraph>Cool. The 122 apocalypses haven&apos;t moved.</FlowParagraph> : null}
              <FlowParagraph>
                <ParameterValue param={FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD} figures={1} /> nuclear weapons exploding triggers a nuclear winter that collapses the food chain and kills most humans.
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
                <FlowParagraph>You said stop. Here&apos;s the math anyway:</FlowParagraph>
                <TreatyMechanismExplainer detailMode="none" />
              </div>
            ) : (
              <TreatyMechanismExplainer
                detailMode="none"
              />
            )}
            <FlowButtonRow>
              <Button
                className={dismissButtonClass}
                data-testid="treaty-post-vote-open-math"
                onClick={openMathDialog}
                type="button"
              >
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
                  <FlowParagraph>Imagine anyway. It&apos;s free.</FlowParagraph>
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
                  <FlowParagraph>{"Two humans is the smallest possible amount of humans. Here:"}</FlowParagraph>
                  <FlowParagraph>Tell 2 friends. They tell 2. {FLOW_DOUBLING_ROUNDS_TO_TARGET} rounds reaches <ParameterValue param={FLOW_MAJORITY_OF_HUMANS_ON_EARTH} figures={1} />. {FLOW_DOUBLING_MONTHS_AT_WEEKLY_PACE} months at one per week.</FlowParagraph>
                  <FlowParagraph>Yes, this is technically a chain letter. The old ones threatened 7 years of bad luck. If this chain breaks, you and everyone you love will suffer and die of curable diseases. Which is also bad luck.</FlowParagraph>
                </>
              ) : (
                <>
                  <FlowParagraph>Tell 2 friends. They tell 2 friends. {FLOW_DOUBLING_ROUNDS_TO_TARGET} rounds reaches <ParameterValue param={FLOW_MAJORITY_OF_HUMANS_ON_EARTH} figures={1} /> humans (a majority of humanity). That&apos;s {FLOW_DOUBLING_ROUNDS_TO_TARGET} days at one per day, {FLOW_DOUBLING_MONTHS_AT_WEEKLY_PACE} months at one per week. Everyone else can ignore you.</FlowParagraph>
                  <FlowParagraph>Yes, this is technically a chain letter. The old ones threatened 7 years of bad luck. If this chain breaks, you and everyone you love will suffer and die of curable diseases. Which is also bad luck.</FlowParagraph>
                  <DetailsBlock
                    detailId="chain-letter-history"
                    flowVariant={flowVariant}
                    screen="twoHumans"
                    summary="Has a chain letter ever actually worked?"
                  >
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
                  <FlowParagraph>Last math. Then you can return to your regularly scheduled apathy.</FlowParagraph>
                  <p className="text-center text-xl font-black leading-tight sm:text-left">One vote = <ParameterValue param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED} figures={2} /> years of suffering prevented.</p>
                  <p className="text-center text-xl font-black leading-tight sm:text-left">One vote = {voterLivesSavedText} lives saved.</p>
                  <FlowParagraph>Every friend you get to vote adds another lifetime to your Inverse Kills Score.</FlowParagraph>
                </>
              ) : (
                <>
                  <p className="text-center text-xl font-black leading-tight sm:text-left">One vote = <ParameterValue param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED} figures={2} /> years of suffering prevented.</p>
                  <p className="text-center text-xl font-black leading-tight sm:text-left">One vote = <ParameterValue param={FLOW_VOTER_LIVES_SAVED_ROUNDED} figures={2} /> lives saved.</p>
                  <DetailsBlock
                    detailId="per-vote-impact"
                    flowVariant={flowVariant}
                    screen="perVote"
                  >
                    <p>
                      When a majority of humans on Earth publicly agree that letting their families die for{" "}
                      <ParameterValue param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} figures={3} /> apocalypses is idiotic, no politician can refuse the trade without losing their seat.{" "}
                      <ParameterValue param={FLOW_TOTAL_LIVES_SAVED} figures={3} /> deaths prevented ÷ {majorityHumanityText} ={" "}
                      <strong><ParameterValue param={FLOW_VOTER_LIVES_SAVED} figures={4} /> lives per vote</strong>.{" "}
                      <ParameterValue param={FLOW_TOTAL_SUFFERING_HOURS} figures={3} /> hours of suffering prevented ÷ {majorityHumanityText} ={" "}
                      <strong><ParameterValue param={FLOW_VOTER_SUFFERING_HOURS_PREVENTED} figures={4} /> hours per vote</strong>. At{" "}
                      <ParameterValue param={HOURS_PER_YEAR} figures={3} /> hours/year ={" "}
                      <strong>~<ParameterValue param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED} figures={2} /> person-years</strong>.
                    </p>
                  </DetailsBlock>
                  <FlowParagraph>Your vote already did this. Every friend you get to vote adds another lifetime to your Inverse Kills Score.</FlowParagraph>
                </>
              )}
            </div>
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => go("promotion", true)}>
                {answer === "yes" ? "I only vote for myself" : "I reject mathematics"}
              </Button>
              <Button
                className={primaryButtonClass}
                onClick={() => go(answer === "yes" ? "representPerson" : "promotion")}
              >
                {answer === "yes" ? "Drag someone to the polls" : "Show me mine"}
              </Button>
            </FlowButtonRow>
          </>
        );

      case "representPerson":
        return (
          <>
            <div className="space-y-4">
              <FlowParagraph>
                Thank you for voting. Now: would you like to vote on behalf of someone who can't? Someone who died of a disease that might have been cured, or a war that didn't need to happen? Give them a voice. They would have voted too.
              </FlowParagraph>
            </div>
            <RepresentedPersonForm variant="inline" />
            <Button className={dismissButtonClass} onClick={() => go("promotion", true)}>
              Skip
            </Button>
          </>
        );

      case "sendMessage":
        return (
          <>
            <div className="space-y-5">
              {alt ? <FlowParagraph>One at a time. Bear with me.</FlowParagraph> : null}
              <FlowParagraph>{sentCount === 0 ? "Assign your first task. Start with your easiest yes." : "Assign the next task."}</FlowParagraph>
              {contactPickerSupported ? (
                <Button
                  type="button"
                  className={`${dismissButtonClass} w-full sm:w-auto`}
                  onClick={() => void handlePickContact()}
                >
                  📇 Pick from contacts
                </Button>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase" htmlFor="post-vote-recipient-name">
                    To
                  </Label>
                  <Input
                    id="post-vote-recipient-name"
                    value={recipientName}
                    onChange={(event) => {
                      setRecipientName(event.target.value);
                      setInvitation(null);
                      setMessage("");
                      setMessageEdited(false);
                      setError(null);
                    }}
                    placeholder="First name or nickname"
                    className={treatyInputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase" htmlFor="post-vote-recipient-email">
                    Email optional
                  </Label>
                  <Input
                    id="post-vote-recipient-email"
                    value={recipientEmail}
                    onChange={(event) => {
                      setRecipientEmail(event.target.value);
                      setInvitation(null);
                      setError(null);
                    }}
                    placeholder="jake@example.com"
                    className={treatyInputClass}
                    type="email"
                  />
                </div>
              </div>
              <MessageModeToggle
                value={messageFormat}
                onChange={(nextFormat) => {
                  if (nextFormat === messageFormat) return;
                  trackTreatyPostVoteFormatChoice({
                    flowVariant,
                    messageFormat: nextFormat,
                    sentCount,
                    switched: sentCount > 0,
                  });
                  setMessageFormat(nextFormat);
                  setInvitation(null);
                  setMessage("");
                  setMessageEdited(false);
                  setError(null);
                }}
              />
              <Textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setMessageEdited(true);
                }}
                className={`${treatyTextareaClass} min-h-64 font-mono text-sm`}
                disabled={isCreating}
              />
            </div>
            {(() => {
              const trimmedName = recipientName.trim();
              const isBroadcast = trimmedName.toLowerCase() === "humanity";
              return isBroadcast ? (
                <div className="space-y-3 border-t-2 border-[var(--treaty-ink)]/30 pt-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--treaty-ink-muted)]">
                    Assign one task to humanity
                  </p>
                  <ShareLinkButtons
                    url={buildUserReferralUrl(session?.user, getBaseUrl())}
                    shareText={stripDraftInviteUrl(message)}
                    emailSubject={
                      messageFormat === "TASK_NOTIFICATION"
                        ? "Overdue task: End War and Disease"
                        : "Please don't die of a horrible disease"
                    }
                    onShare={() => {
                      completeCurrentInvitation();
                    }}
                  />
                </div>
              ) : (
                <FlowButtonRow>
                  <Button
                    className={primaryButtonClass}
                    onClick={() => void handleCopy()}
                    disabled={isCreating || trimmedName === ""}
                  >
                    <Clipboard className="mr-2 h-5 w-5" aria-hidden="true" />
                    {copyState === "copied" ? "Copied" : "Copy"}
                  </Button>
                  {recipientEmail.trim() ? (
                    <Button className={dismissButtonClass} onClick={() => void handleSendEmail()} disabled={isCreating || isSending || trimmedName === ""}>
                      <Mail className="mr-2 h-5 w-5" aria-hidden="true" />
                      <span className="min-w-0 truncate">
                        {isSending ? "Sending..." : `Send email to ${recipientEmail.trim()} for me`}
                      </span>
                    </Button>
                  ) : null}
                </FlowButtonRow>
              );
            })()}
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
            <FlowParagraph>{`Sent to ${recipientEmail.trim()}.`}</FlowParagraph>
            <Button className={primaryButtonClass} onClick={completeCurrentInvitation}>
              Continue
            </Button>
          </>
        );

      case "sendImpact": {
        const milestone = milestoneCopy(sentCount);
        const recipientLabel = lastRecipientName || displayName;
        return (
          <>
            {sentCount <= 1 ? (
              <div className="space-y-4">
                <p className="text-center text-xl font-black leading-tight sm:text-left">
                  When {recipientLabel} votes: +<ParameterValue param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED} figures={2} /> years of suffering prevented. +<ParameterValue param={FLOW_VOTER_LIVES_SAVED_ROUNDED} figures={2} /> lives saved.
                </p>
                <FlowParagraph>{`${recipientLabel} added to your direct reports. We'll notify you when they complete the task.`}</FlowParagraph>
              </div>
            ) : (
              <div className="space-y-4">
                <FlowParagraph>{`${recipientLabel} added to your direct reports. Pending: `}<strong>{sentCount}</strong>{` lifetimes / `}<strong>{pendingLives}</strong>{` lives.`}</FlowParagraph>
                {milestone ? <FlowParagraph>{milestone}</FlowParagraph> : null}
              </div>
            )}
            <FlowButtonRow>
              <Button className={dismissButtonClass} onClick={() => go("close", true)}>
                Allow {voterLivesSavedText} more people to die
              </Button>
              <Button
                className={primaryButtonClass}
                onClick={() => {
                  resetCurrentRecipient();
                  go("sendMessage");
                }}
              >
                Save {voterLivesSavedText} more lives
              </Button>
            </FlowButtonRow>
          </>
        );
      }

      case "promotion":
        return <PromotionScreen onChoice={handlePromotion} />;

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
                  <FlowParagraph>{"We're trying to make this the most effective chain letter in history."}</FlowParagraph>
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
        data-screen={screen}
        data-testid="treaty-post-vote-share-flow"
        contentClassName="max-w-3xl"
      >
        <div className="space-y-6 p-5">
          {renderScreen()}
          {error ? (
            <p className="border border-[var(--treaty-ink)] bg-[#fffdf8] px-3 py-2 text-sm font-black text-[var(--treaty-ink)]">
              {error}
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
