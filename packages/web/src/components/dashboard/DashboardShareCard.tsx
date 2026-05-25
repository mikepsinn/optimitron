"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Copy, Mail, Share2, Smartphone } from "lucide-react";
import { FaFacebookF, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { HumanityManagerPromotion } from "@/lib/humanity-manager-promotion.web";
import { ROUTES } from "@/lib/routes";
import { buildShareMessage } from "@/lib/share-message";
import { cn } from "@/lib/utils";
import { defaultButtonClassName } from "@/components/ui/default-button";

interface DashboardShareCardProps {
  referralUrl: string;
}

type ShareState = "idle" | "shared" | "copied" | "error";
type ShareChannel = "native" | "sms" | "whatsapp" | "email" | "x" | "facebook" | "copy";
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
    return navigator.clipboard.writeText(text).catch(() => copyWithTextarea(text));
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

export function DashboardShareCard({ referralUrl }: DashboardShareCardProps) {
  const defaultMessage = useMemo(
    () => buildShareMessage(referralUrl),
    [referralUrl],
  );
  const [message, setMessage] = useState(defaultMessage);
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

  function resetShareState() {
    window.setTimeout(() => setShareState("idle"), 2000);
  }

  function trackShare(channel: ShareChannel) {
    fetch("/api/share/track", {
      body: JSON.stringify({
        templateLabel: `dashboard-${channel}`,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch((error) => {
      console.error("[share-track] dashboard share telemetry POST failed", error);
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

  const secondaryButtonClass =
    cn(defaultButtonClassName, "min-h-11 px-3 py-2 text-xs tracking-[0.08em]");

  const nativeButtonLabel =
    shareState === "shared"
      ? "Shared"
      : "Share with two humans";

  const copyButtonLabel =
    shareState === "copied"
      ? "Copied"
      : shareState === "error"
        ? "Copy failed"
        : "Copy to clipboard";

  const PrimaryShareIcon = nativeShareSupported ? Share2 : Copy;

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
    return shareStatus ? <span className="sr-only" aria-live="polite">{shareStatus}</span> : null;
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

  return (
    <section className="border border-[var(--treaty-ink)]/40 bg-[var(--treaty-paper)] p-6 sm:p-8">
      <HumanityManagerPromotion />

      <div className="mt-6">
        <label className="block" htmlFor="dashboard-share-message">
          <span className="sr-only">Share message</span>
          <textarea
            id="dashboard-share-message"
            className="mt-3 block min-h-[13rem] w-full resize-y border-2 border-[var(--treaty-ink)] bg-[var(--treaty-paper)] p-4 text-base font-bold leading-relaxed text-[var(--treaty-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--treaty-ink)]/40 sm:min-h-[10.5rem]"
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
        <Link
          className="inline-flex w-full justify-center border border-[var(--treaty-ink)]/40 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-[var(--treaty-ink)] transition-colors hover:bg-[var(--treaty-ink)] hover:text-[var(--treaty-paper)]"
          href={ROUTES.missions}
        >
          End war and disease from your mission profile.
        </Link>
      </div>
    </section>
  );
}
