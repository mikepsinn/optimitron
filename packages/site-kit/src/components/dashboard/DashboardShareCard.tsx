"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
} from "react";
import { Copy, Mail, Share2, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaFacebookF, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { HumanityManagerPromotion } from "../../lib/humanity-manager-promotion.web";
import { insertGeneratedReferralInviteUrl } from "../../lib/referral-invitation-message-url";
import { createReferralInvitationRequest } from "../../lib/referral-invitation-client";
import { buildShareMessage } from "../../lib/share-message";
import { cn } from "@optimitron/neobrutalist-ui/cn";
import { defaultButtonClassName } from "../ui/default-button";

interface DashboardShareCardProps {
  referralUrl: string;
  showAssignmentForm?: boolean;
}

type ShareState = "idle" | "shared" | "copied" | "error";
type AssignmentState = "idle" | "creating" | "created" | "copyFailed" | "error";
type ShareChannel =
  | "native"
  | "sms"
  | "whatsapp"
  | "email"
  | "x"
  | "facebook"
  | "copy";
type ShareButtonConfig = {
  channel: Exclude<ShareChannel, "native" | "copy">;
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  mobileOnly?: boolean;
  target?: "_blank";
};

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .catch(() => copyWithTextarea(text));
  }
  return copyWithTextarea(text);
}

function copyWithTextarea(text: string): Promise<void> {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(
      error instanceof Error ? error : new Error("Copy failed"),
    );
  } finally {
    document.body.removeChild(textarea);
  }
}

function encode(value: string) {
  return encodeURIComponent(value);
}

function getShareUrls(message: string, referralUrl: string) {
  const subject = "Vote on the 1% Treaty";
  return {
    email: `mailto:?subject=${encode(subject)}&body=${encode(message)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encode(referralUrl)}`,
    sms: `sms:?&body=${encode(message)}`,
    whatsapp: `https://wa.me/?text=${encode(message)}`,
    x: `https://twitter.com/intent/tweet?text=${encode(message)}`,
  };
}

function buildInviteUrl(referralUrl: string, inviteToken: string) {
  const baseUrl =
    typeof window === "undefined"
      ? "https://warondisease.org"
      : window.location.origin;
  const url = new URL(referralUrl, baseUrl);
  url.searchParams.set("invite", inviteToken);
  return url.toString();
}

export function DashboardShareCard({
  referralUrl,
  showAssignmentForm = false,
}: DashboardShareCardProps) {
  const router = useRouter();
  const defaultMessage = useMemo(
    () => buildShareMessage(referralUrl),
    [referralUrl],
  );
  const [message, setMessage] = useState(defaultMessage);
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [assignmentState, setAssignmentState] =
    useState<AssignmentState>("idle");
  const [assignmentStatus, setAssignmentStatus] = useState<string | null>(null);
  const assignmentResetTimerRef = useRef<number | null>(null);
  const [nativeShareSupported, setNativeShareSupported] = useState(false);
  const [shareState, setShareState] = useState<ShareState>("idle");
  const shareUrls = useMemo(
    () => getShareUrls(message, referralUrl),
    [message, referralUrl],
  );

  useEffect(() => {
    setNativeShareSupported(
      typeof navigator !== "undefined" && Boolean(navigator.share),
    );
  }, []);

  useEffect(() => {
    return () => {
      if (assignmentResetTimerRef.current !== null) {
        window.clearTimeout(assignmentResetTimerRef.current);
      }
    };
  }, []);

  function resetShareState() {
    window.setTimeout(() => setShareState("idle"), 2000);
  }

  function clearAssignmentResetTimer() {
    if (assignmentResetTimerRef.current !== null) {
      window.clearTimeout(assignmentResetTimerRef.current);
      assignmentResetTimerRef.current = null;
    }
  }

  function resetAssignmentState() {
    clearAssignmentResetTimer();
    assignmentResetTimerRef.current = window.setTimeout(() => {
      setAssignmentState("idle");
      setAssignmentStatus(null);
      assignmentResetTimerRef.current = null;
    }, 3500);
  }

  function trackShare(channel: ShareChannel) {
    fetch("/api/share/track", {
      body: JSON.stringify({
        templateLabel: `dashboard-${channel}`,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch((error) => {
      console.error(
        "[share-track] dashboard share telemetry POST failed",
        error,
      );
    });
  }

  async function handleCopy() {
    try {
      await copyToClipboard(message);
      trackShare("copy");
      setShareState("copied");
      resetShareState();
    } catch {
      setShareState("error");
      resetShareState();
    }
  }

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          text: message,
          title: "Vote on the 1% Treaty",
        });
        trackShare("native");
        setShareState("shared");
        resetShareState();
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    await handleCopy();
  }

  function handleOutboundShare(channel: ShareChannel) {
    trackShare(channel);
  }

  async function handleCreateEmployeeTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const recipientName = [employeeFirstName, employeeLastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");
    const recipientEmail = employeeEmail.trim();

    if (!recipientName || assignmentState === "creating") {
      return;
    }

    clearAssignmentResetTimer();

    try {
      setAssignmentState("creating");
      setAssignmentStatus(null);

      const invitation = await createReferralInvitationRequest({
        contactMethod: "COPY",
        messageFormat: "SINCERE",
        messageText: message,
        recipientEmail: recipientEmail || null,
        recipientName,
      });
      const inviteUrl = buildInviteUrl(referralUrl, invitation.inviteToken);
      const assignmentMessage = insertGeneratedReferralInviteUrl(
        message,
        inviteUrl,
        { draftReferralUrl: referralUrl },
      );

      try {
        await copyToClipboard(assignmentMessage);
        trackShare("copy");
        setAssignmentState("created");
        setAssignmentStatus(
          `${recipientName}'s voting task was created and copied.`,
        );
      } catch {
        setAssignmentState("copyFailed");
        setAssignmentStatus(
          `${recipientName}'s voting task was created. Copy failed; use the reminder below.`,
        );
      }

      setEmployeeFirstName("");
      setEmployeeLastName("");
      setEmployeeEmail("");
      router.refresh();
      resetAssignmentState();
    } catch (error) {
      setAssignmentState("error");
      setAssignmentStatus(
        error instanceof Error
          ? error.message
          : "Could not create that employee task.",
      );
      resetAssignmentState();
    }
  }

  const shareStatus =
    shareState === "shared"
      ? "Shared"
      : shareState === "copied"
        ? "Copied"
        : shareState === "error"
          ? "Copy failed"
          : null;

  const shareButtons: ShareButtonConfig[] = [
    {
      channel: "sms" as const,
      href: shareUrls.sms,
      icon: Smartphone,
      label: "Text",
      mobileOnly: true,
    },
    {
      channel: "whatsapp" as const,
      href: shareUrls.whatsapp,
      icon: FaWhatsapp,
      label: "WhatsApp",
      target: "_blank",
    },
    {
      channel: "email" as const,
      href: shareUrls.email,
      icon: Mail,
      label: "Email",
    },
    {
      channel: "x" as const,
      href: shareUrls.x,
      icon: FaXTwitter,
      label: "Post",
      target: "_blank",
    },
    {
      channel: "facebook" as const,
      href: shareUrls.facebook,
      icon: FaFacebookF,
      label: "Facebook",
      target: "_blank",
    },
  ];

  const secondaryButtonClass = cn(
    defaultButtonClassName,
    "min-h-11 px-3 py-2 text-xs tracking-[0.08em]",
  );

  const nativeButtonLabel =
    shareState === "shared" ? "Shared" : "Share with two humans";

  const copyButtonLabel =
    shareState === "copied"
      ? "Copied"
      : shareState === "error"
        ? "Copy failed"
        : "Copy to clipboard";

  const PrimaryShareIcon = nativeShareSupported ? Share2 : Copy;
  const recipientName = [employeeFirstName, employeeLastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  const assignmentDisabled =
    assignmentState === "creating" || recipientName.length === 0;

  function renderShareIcon(Icon: ComponentType<{ className?: string }>) {
    return <Icon className="h-4 w-4 shrink-0" />;
  }

  function getLinkRel(target?: string) {
    return target === "_blank" ? "noopener noreferrer" : undefined;
  }

  function getLinkTarget(target?: string) {
    return target === "_blank" ? "_blank" : undefined;
  }

  function getLinkAriaLabel(label: string) {
    return `Share by ${label}`;
  }

  function getStatusLabel() {
    return shareStatus ? (
      <span className="sr-only" aria-live="polite">
        {shareStatus}
      </span>
    ) : null;
  }

  function renderShareButton(button: (typeof shareButtons)[number]) {
    return (
      <a
        key={button.channel}
        aria-label={getLinkAriaLabel(button.label)}
        className={cn(secondaryButtonClass, button.mobileOnly && "sm:hidden")}
        href={button.href}
        onClick={() => handleOutboundShare(button.channel)}
        rel={getLinkRel(button.target)}
        target={getLinkTarget(button.target)}
      >
        {renderShareIcon(button.icon)}
        {button.label}
      </a>
    );
  }

  function renderCopyButton() {
    return (
      <button
        aria-label="Copy share message to clipboard"
        className={cn(defaultButtonClassName, "w-full px-6")}
        onClick={() => void handleCopy()}
        type="button"
      >
        <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
        {copyButtonLabel}
      </button>
    );
  }

  function renderShareStatus() {
    if (!shareStatus) {
      return null;
    }

    return (
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)]/70">
        {shareStatus}
      </p>
    );
  }

  function renderAssignmentForm() {
    if (!showAssignmentForm) {
      return null;
    }

    return (
      <form
        className="mt-5 border-t border-[var(--treaty-ink)]/30 pt-5"
        onSubmit={(event) => void handleCreateEmployeeTask(event)}
      >
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--treaty-ink)]/70">
          Assign an employee
        </p>
        <p className="mt-2 text-sm font-bold leading-6 text-[var(--treaty-ink)] sm:text-base">
          Make their tracked voting task, then copy the message with their
          private invite link. One overdue employee, handled.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--treaty-ink)]/70">
              First name
            </span>
            <input
              className="mt-1 block h-11 w-full border border-[var(--treaty-ink)] bg-[var(--treaty-paper)] px-3 text-base font-bold text-[var(--treaty-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--treaty-ink)]/40"
              maxLength={80}
              name="employeeFirstName"
              onChange={(event) => setEmployeeFirstName(event.target.value)}
              required
              type="text"
              value={employeeFirstName}
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--treaty-ink)]/70">
              Last name
            </span>
            <input
              className="mt-1 block h-11 w-full border border-[var(--treaty-ink)] bg-[var(--treaty-paper)] px-3 text-base font-bold text-[var(--treaty-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--treaty-ink)]/40"
              maxLength={80}
              name="employeeLastName"
              onChange={(event) => setEmployeeLastName(event.target.value)}
              type="text"
              value={employeeLastName}
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--treaty-ink)]/70">
              Email optional
            </span>
            <input
              className="mt-1 block h-11 w-full border border-[var(--treaty-ink)] bg-[var(--treaty-paper)] px-3 text-base font-bold text-[var(--treaty-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--treaty-ink)]/40"
              maxLength={320}
              name="employeeEmail"
              onChange={(event) => setEmployeeEmail(event.target.value)}
              type="email"
              value={employeeEmail}
            />
          </label>
        </div>
        <button
          className={cn(
            defaultButtonClassName,
            "mt-4 w-full px-6 disabled:cursor-not-allowed disabled:opacity-50",
          )}
          disabled={assignmentDisabled}
          type="submit"
        >
          {assignmentState === "creating"
            ? "Creating task..."
            : assignmentState === "created"
              ? "Task copied"
              : assignmentState === "copyFailed"
                ? "Task created"
                : "Create Task + Copy"}
        </button>
        {assignmentStatus ? (
          <p
            aria-live="polite"
            className={cn(
              "mt-3 text-xs font-black uppercase tracking-[0.12em]",
              assignmentState === "error" || assignmentState === "copyFailed"
                ? "text-red-700"
                : "text-[var(--treaty-ink)]/70",
            )}
          >
            {assignmentStatus}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <section className="border border-[var(--treaty-ink)]/40 bg-[var(--treaty-paper)] p-6 sm:p-8">
      <HumanityManagerPromotion />

      <div className="mt-6">
        <label className="block" htmlFor="dashboard-share-message">
          <span className="sr-only">Share message</span>
          <textarea
            id="dashboard-share-message"
            className="mt-3 block min-h-[17rem] w-full resize-y border-2 border-[var(--treaty-ink)] bg-[var(--treaty-paper)] p-4 text-base font-bold leading-relaxed text-[var(--treaty-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--treaty-ink)]/40 sm:min-h-[10.5rem]"
            rows={7}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            spellCheck
          />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {nativeShareSupported ? (
          <button
            type="button"
            onClick={() => void handleNativeShare()}
            className={cn(defaultButtonClassName, "w-full px-6")}
          >
            <PrimaryShareIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {nativeButtonLabel}
          </button>
        ) : null}
        {renderCopyButton()}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {shareButtons.map(renderShareButton)}
        </div>
        {getStatusLabel()}
        {renderShareStatus()}
      </div>
      {renderAssignmentForm()}
    </section>
  );
}
