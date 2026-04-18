"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import {
  FaXTwitter,
  FaLinkedinIn,
  FaRedditAlien,
  FaFacebookF,
  FaEnvelope,
  FaLink,
} from "react-icons/fa6";
import { SiBluesky } from "react-icons/si";
import { Button } from "@/components/retroui/Button";
import { copyTextToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

interface ShareLinkButtonsProps {
  /** The full URL to share */
  url: string;
  /** The share text (appended with URL for platforms that need it inline) */
  shareText: string;
  /** Email subject line (defaults to shareText truncated) */
  emailSubject?: string;
  /** Optional callback fired when any share button is clicked */
  onShare?: () => void;
  /** Optional label above the buttons */
  label?: string;
  /** Optional label class override for colored surfaces */
  labelClassName?: string;
  /** "text" shows word labels (default), "icon" shows platform icons only */
  variant?: "text" | "icon";
  /**
   * Verb used in tooltip + button copy. Default "share" for generic pages.
   * Task pages pass "remind" because the visitor's job is to remind an
   * assignee of an overdue task.
   */
  verb?: "share" | "remind";
}

function encode(value: string) {
  return encodeURIComponent(value);
}

/**
 * Shared social share buttons: X, Bluesky, LinkedIn, Reddit, Email, Copy Link.
 *
 * Used by TaskShareButtons, ShareOverdueListButtons, and any future share surface.
 * Pass custom `shareText` and `url`; the component handles encoding and platform URLs.
 */
export function ShareLinkButtons({
  url,
  shareText,
  emailSubject,
  onShare,
  label,
  labelClassName,
  variant = "text",
  verb = "share",
}: ShareLinkButtonsProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const shortShare = `${shareText} ${url}`.trim();
  const subject = emailSubject ?? shareText.slice(0, 120);
  const verbTitle = verb === "remind" ? "Remind on" : "Share on";
  const copyLabel = verb === "remind" ? "Copy reminder link" : "Copy link";

  const shareLinks: { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
    {
      href: `https://twitter.com/intent/tweet?text=${encode(shortShare)}`,
      label: "X",
      icon: FaXTwitter,
    },
    {
      href: `https://bsky.app/intent/compose?text=${encode(shortShare)}`,
      label: "Bluesky",
      icon: SiBluesky,
    },
    {
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}`,
      label: "LinkedIn",
      icon: FaLinkedinIn,
    },
    {
      href: `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`,
      label: "Facebook",
      icon: FaFacebookF,
    },
    {
      href: `https://www.reddit.com/submit?url=${encode(url)}&title=${encode(shareText)}`,
      label: "Reddit",
      icon: FaRedditAlien,
    },
    {
      href: `mailto:?subject=${encode(subject)}&body=${encode(shortShare)}`,
      label: "Email",
      icon: FaEnvelope,
    },
  ];

  if (variant === "icon") {
    return (
      <div className="flex flex-wrap items-center gap-1">
        {shareLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            rel="noreferrer"
            target="_blank"
            title={
              link.label === "Email"
                ? verb === "remind"
                  ? "Remind via email"
                  : "Share via email"
                : `${verbTitle} ${link.label}`
            }
            className="inline-flex h-7 w-7 items-center justify-center border-2 border-foreground bg-background text-foreground transition-transform hover:translate-y-[-1px] hover:bg-muted"
            onClick={() => onShare?.()}
          >
            <link.icon className="h-3.5 w-3.5" />
          </a>
        ))}
        <button
          type="button"
          title={copyState === "copied" ? "Copied!" : copyLabel}
          className="inline-flex h-7 w-7 items-center justify-center border-2 border-foreground bg-background text-foreground transition-transform hover:translate-y-[-1px] hover:bg-muted"
          onClick={() => {
            onShare?.();
            void copyTextToClipboard(url)
              .then(() => {
                setCopyState("copied");
                window.setTimeout(() => setCopyState("idle"), 1500);
              })
              .catch(() => {
                setCopyState("error");
                window.setTimeout(() => setCopyState("idle"), 2000);
              });
          }}
        >
          <FaLink className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label ? (
        <p
          className={cn(
            "text-xs font-black uppercase tracking-[0.18em] text-brutal-pink",
            labelClassName,
          )}
        >
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {shareLinks.map((link) => (
          <Button
            key={link.label}
            asChild
            className="font-black uppercase"
            size="sm"
            variant="outline"
          >
            <a
              href={link.href}
              rel="noreferrer"
              target="_blank"
              onClick={() => onShare?.()}
            >
              {link.label}
            </a>
          </Button>
        ))}
        <Button
          className="font-black uppercase"
          size="sm"
          type="button"
          variant="outline"
          onClick={() => {
            onShare?.();
            void copyTextToClipboard(url)
              .then(() => {
                setCopyState("copied");
                window.setTimeout(() => setCopyState("idle"), 1500);
              })
              .catch(() => {
                setCopyState("error");
                window.setTimeout(() => setCopyState("idle"), 2000);
              });
          }}
        >
          {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy Failed" : copyLabel}
        </Button>
      </div>
    </div>
  );
}
