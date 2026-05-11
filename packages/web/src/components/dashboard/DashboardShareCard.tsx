"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { Copy, Mail, Share2, Smartphone } from "lucide-react";
import { FaFacebookF, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  GLOBAL_POPULATION_2024,
  GLOBAL_WARHEAD_COUNT,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters";
import { FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR } from "@/lib/treaty-share-flow-parameters";
import { ROUTES } from "@/lib/routes";
import { buildShareMessage } from "@/lib/share-message";

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
  target?: "_blank";
};

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
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
  const [shareState, setShareState] = useState<ShareState>("idle");
  const shareUrls = useMemo(
    () => getShareUrls(message, referralUrl),
    [message, referralUrl],
  );

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
    }).catch(() => {});
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
    "inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--treaty-ink)] bg-[var(--treaty-paper)] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] transition-colors hover:bg-[var(--treaty-ink)] hover:text-[var(--treaty-paper)]";

  const copyButtonLabel =
    shareState === "copied"
      ? "Copied"
      : shareState === "error"
        ? "Copy failed"
        : "Copy";

  const nativeButtonLabel =
    shareState === "shared"
      ? "Shared"
      : "Share with two humans";

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

  function getButtonAriaLabel(label: string) {
    return label === "Copy" ? "Copy share message" : label;
  }

  function getStatusLabel() {
    return shareStatus ? <span className="sr-only" aria-live="polite">{shareStatus}</span> : null;
  }

  function renderShareButton(button: (typeof shareButtons)[number]) {
    return (
      <a
        key={button.channel}
        aria-label={getLinkAriaLabel(button.label)}
        className={secondaryButtonClass}
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
        aria-label={getButtonAriaLabel(copyButtonLabel)}
        className={secondaryButtonClass}
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
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--treaty-ink)]/60">
        Humanity Manager · Assignment 1
      </p>
      <h2 className="mt-2 text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
        Trade one apocalypse for{" "}
        <ParameterValue
          className="font-black"
          figures={3}
          param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
        />
        × more clinical trials.
      </h2>
      <div className="mt-4 space-y-3 text-sm font-bold leading-7 text-[var(--treaty-ink)] sm:text-base">
        <p>
          You have been promoted to Humanity Manager at Earth
          Optimization Services LLC. Responsible for{" "}
          <ParameterValue
            className="font-black"
            figures={1}
            param={GLOBAL_POPULATION_2024}
          />{" "}
          humans. First task: get them to ratify the{" "}
          <Link
            href={ROUTES.treaty}
            className="underline decoration-dotted underline-offset-2 hover:no-underline"
          >
            1% Treaty
          </Link>
          .
        </p>
        <p>
          Earth owns{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={GLOBAL_WARHEAD_COUNT}
          />{" "}
          nuclear warheads.{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
          />{" "}
          of them ends civilization. That is{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR}
          />{" "}
          apocalypses on the shelf. Spend one apocalypse on{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
          />
          × more clinical trials and the disease-eradication timeline
          collapses from{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
          />{" "}
          years to{" "}
          <ParameterValue
            className="font-black"
            figures={2}
            param={DFDA_QUEUE_CLEARANCE_YEARS}
          />
          .
        </p>
        <p className="text-[var(--treaty-ink)]/70">
          To get there: send the message below to two humans you love.
          They send it to two. 32 rounds reaches every adult on Earth.
          Getting humans to agree on one thing is the first step to any
          civilizational upgrade. You are responsible for this step. It cannot
          be completed without you.
        </p>
      </div>

      <label className="mt-6 block">
        <span className="sr-only">Share message</span>
        <textarea
          className="block w-full resize-y border-2 border-[var(--treaty-ink)] bg-[var(--treaty-paper)] p-4 text-base font-bold leading-relaxed text-[var(--treaty-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--treaty-ink)]/40"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          spellCheck
        />
      </label>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={() => void handleNativeShare()}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 border-2 border-[var(--treaty-ink)] bg-[var(--treaty-ink)] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-[var(--treaty-paper)] transition-colors hover:bg-[var(--treaty-paper)] hover:text-[var(--treaty-ink)]"
        >
          <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {nativeButtonLabel}
        </button>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {shareButtons.map(renderShareButton)}
          {renderCopyButton()}
        </div>
        {getStatusLabel()}
        {renderShareStatus()}
      </div>
    </section>
  );
}
