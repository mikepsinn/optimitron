"use client";

import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Copy text to clipboard with fallback for non-secure contexts. */
function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback: hidden textarea + execCommand for http:// or custom domains
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    return Promise.resolve();
  } catch {
    return Promise.reject(new Error("Copy failed"));
  } finally {
    document.body.removeChild(textarea);
  }
}

/** SHA-256 hex digest via Web Crypto. Used as a content-stable grouping key. */
async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
import { useSession } from "next-auth/react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  FaEnvelope,
  FaFacebookF,
  FaLink,
  FaLinkedinIn,
  FaRedditAlien,
  FaXTwitter,
} from "react-icons/fa6";
import { SiBluesky } from "react-icons/si";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Drawer } from "@/components/retroui/Drawer";
import { Select } from "@/components/retroui/Select";
import { renderTemplate } from "@/lib/tasks/render-template";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { useRequestSiteOrigin } from "@/lib/request-site-origin";
import {
  buildChannelHref,
  embedShareAttemptId,
  type ReminderChannel,
  type ShareableChannel,
} from "@/lib/share-channels";
import {
  getUsableShareTemplates,
  type ShareTemplate,
} from "@/lib/tasks/share-templates";
import { buildTaskUrl, buildUserReferralUrl } from "@/lib/url";

interface TaskRowShareProps {
  baseUrl?: string;
  /**
   * One-liner fallback — used when no template tokens are supplied, and as
   * the reddit share title regardless of template selection.
   */
  shareText: string;
  /**
   * Flat token bag for the share-text templates. When omitted, the dialog
   * falls back to `shareText` with no picker.
   */
  shareTokens?: Record<string, string>;
  /**
   * `"sm"` (default) — compact "Remind" pill for list rows.
   * `"lg"` — full-width "Send Reminder" hero button for task detail pages.
   */
  size?: "sm" | "lg";
  targetLabel: string;
  taskId: string;
  taskTitle: string;
}

const CHANNEL_ICONS: {
  channel: Exclude<ReminderChannel, "copy-message">;
  icon: React.ReactNode;
  label: string;
}[] = [
  { channel: "x", icon: <FaXTwitter className="h-3.5 w-3.5" />, label: "X" },
  { channel: "bluesky", icon: <SiBluesky className="h-3.5 w-3.5" />, label: "Bluesky" },
  { channel: "email", icon: <FaEnvelope className="h-3.5 w-3.5" />, label: "Email" },
  { channel: "linkedin", icon: <FaLinkedinIn className="h-3.5 w-3.5" />, label: "LinkedIn" },
  { channel: "facebook", icon: <FaFacebookF className="h-3.5 w-3.5" />, label: "Facebook" },
  { channel: "reddit", icon: <FaRedditAlien className="h-3.5 w-3.5" />, label: "Reddit" },
  { channel: "copy-link", icon: <FaLink className="h-3.5 w-3.5" />, label: "Copy Link" },
];

export function ReminderComposer({
  availableTemplates,
  message,
  messageCopyState,
  onChannel,
  onCopy,
  onMessageChange,
  onTemplateChange,
  selectedTemplateId,
  targetLabel,
  taskTitle,
}: {
  availableTemplates: ShareTemplate[];
  message: string;
  messageCopyState: "copied" | "error" | "idle";
  onChannel: (channel: Exclude<ReminderChannel, "copy-message">) => void;
  onCopy: () => void;
  onMessageChange: (value: string) => void;
  onTemplateChange: (templateId: string) => void;
  selectedTemplateId: string | null;
  targetLabel: string;
  taskTitle: string;
}) {
  const [linkCopyState, setLinkCopyState] = useState<"copied" | "idle">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0";
    // Grow to fit content but let CSS max-h cap it
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [message, autoResize]);

  return (
    <div className="space-y-3 p-4">
      {/* Header — compact */}
      <div className="space-y-0.5">
        <h3 className="text-base font-black uppercase leading-tight">
          Send Overdue Task Reminder
        </h3>
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
          {taskTitle}
        </p>
      </div>

      {/* Template selector — dropdown instead of 6 buttons */}
      {availableTemplates.length > 1 ? (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Voice:
          </span>
          <Select
            value={selectedTemplateId ?? undefined}
            onValueChange={onTemplateChange}
          >
            <Select.Trigger className="h-8 min-w-0 flex-1 border-2 border-foreground text-[11px] font-black uppercase">
              <Select.Value />
            </Select.Trigger>
            <Select.Content className="border-2 border-foreground">
              {availableTemplates.map((template) => (
                <Select.Item
                  key={template.id}
                  value={template.id}
                  className="text-[11px] font-black uppercase"
                >
                  {template.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      ) : null}

      {/* Editable message */}
      <textarea
        ref={textareaRef}
        aria-label={`Reminder message for ${targetLabel}`}
        className="min-h-[4rem] max-h-[50vh] w-full resize-none overflow-y-auto border-4 border-foreground bg-background px-4 py-2 text-sm font-bold leading-5 shadow-xs transition placeholder:text-muted-foreground focus:shadow-none focus:outline-hidden"
        value={message}
        onChange={(event) => {
          onMessageChange(event.target.value);
          autoResize();
        }}
      />

      {/* Primary CTA */}
      <Button
        className="w-full cursor-pointer justify-center border-4 border-foreground bg-brutal-pink font-black uppercase text-brutal-pink-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
        size="sm"
        type="button"
        onClick={onCopy}
      >
        {messageCopyState === "copied"
          ? "Reminder Copied ✓"
          : messageCopyState === "error"
            ? "Copy Failed"
            : "Copy Reminder Message"}
      </Button>

      {/* Share channels */}
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
        {CHANNEL_ICONS.map(({ channel, icon, label }) => (
          <button
            key={channel}
            type="button"
            aria-label={label}
            className="group flex cursor-pointer flex-col items-center gap-1 rounded-sm border-2 border-foreground bg-background px-1 py-2 text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
            onClick={() => {
              if (channel === "copy-link") {
                setLinkCopyState("copied");
                window.setTimeout(() => setLinkCopyState("idle"), 1500);
              }
              onChannel(channel);
            }}
          >
            {channel === "copy-link" && linkCopyState === "copied" ? (
              <span className="text-xs font-black">✓</span>
            ) : (
              icon
            )}
            <span className="text-[8px] font-black uppercase leading-none">
              {channel === "copy-link" && linkCopyState === "copied" ? "Done" : label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TaskRowShare({
  baseUrl,
  shareText,
  shareTokens,
  size = "sm",
  targetLabel,
  taskId,
  taskTitle,
}: TaskRowShareProps) {
  const [messageCopyState, setMessageCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const requestOrigin = useRequestSiteOrigin();
  const referralId = getUsernameOrReferralCode(session?.user);
  const taskUrl = useMemo(
    () => buildTaskUrl(taskId, baseUrl ?? requestOrigin, referralId),
    [baseUrl, requestOrigin, taskId, referralId],
  );

  const treatyReferralUrl = useMemo(
    () => session?.user ? buildUserReferralUrl(session.user, requestOrigin) : requestOrigin,
    [session?.user, requestOrigin],
  );

  const enrichedTokens = useMemo(() => {
    if (!shareTokens) return null;
    const citizenName = session?.user?.name?.trim();
    return {
      ...shareTokens,
      citizen_name:
        citizenName && citizenName.length > 0
          ? citizenName
          : shareTokens.citizen_name || "A citizen",
      treaty_url: treatyReferralUrl,
    };
  }, [shareTokens, session?.user?.name, treatyReferralUrl]);

  const availableTemplates = useMemo(() => {
    if (!enrichedTokens) return [];
    return getUsableShareTemplates(enrichedTokens);
  }, [enrichedTokens]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    () => availableTemplates[0]?.id ?? null,
  );

  useEffect(() => {
    if (availableTemplates.length === 0) {
      setSelectedTemplateId(null);
      return;
    }
    if (
      selectedTemplateId == null ||
      !availableTemplates.some((template) => template.id === selectedTemplateId)
    ) {
      setSelectedTemplateId(availableTemplates[0]?.id ?? null);
    }
  }, [availableTemplates, selectedTemplateId]);

  const initialMessage = useMemo(() => {
    if (enrichedTokens && selectedTemplateId) {
      const template = availableTemplates.find((entry) => entry.id === selectedTemplateId);
      if (template) {
        return `${renderTemplate(template.body, enrichedTokens)}\n\n${taskUrl}`.trim();
      }
    }
    return `${shareText}\n\n${taskUrl}`.trim();
  }, [enrichedTokens, selectedTemplateId, availableTemplates, shareText, taskUrl]);

  useEffect(() => {
    setMessage(initialMessage);
    setMessageCopyState("idle");
  }, [initialMessage]);

  function closeSurfaces() {
    setDesktopOpen(false);
    setMobileOpen(false);
  }

  async function logShareAttempt(input: {
    id: string;
    channel: ReminderChannel;
    renderedMessage: string;
    wasEdited: boolean;
    templateBody: string | null;
    templateId: string | null;
  }) {
    try {
      const [templateHash, renderedHash] = await Promise.all([
        input.templateBody ? sha256Hex(input.templateBody) : Promise.resolve(null),
        sha256Hex(input.renderedMessage),
      ]);
      await fetch("/api/share-attempts", {
        body: JSON.stringify({
          id: input.id,
          source: "IN_APP",
          surface: "task_row_share",
          channel: input.channel,
          taskId,
          templateId: input.templateId,
          templateHash,
          templateBody: input.templateBody,
          renderedMessage: input.renderedMessage,
          renderedHash,
          wasEdited: input.wasEdited,
          context: { taskTitle, targetLabel },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
    } catch {
      // Share attempt logging is best-effort; orphan ?sa= is tolerated downstream.
    }
  }

  function handleChannel(channel: ShareableChannel | "copy-link") {
    if (channel === "copy-link") {
      const shareAttemptId = nanoid();
      const attributedReferralUrl = embedShareAttemptId(
        treatyReferralUrl,
        treatyReferralUrl,
        shareAttemptId,
      );

      void logShareAttempt({
        id: shareAttemptId,
        channel: "copy-link",
        renderedMessage: attributedReferralUrl,
        wasEdited: false,
        templateBody: null,
        templateId: null,
      });

      closeSurfaces();
      void copyToClipboard(attributedReferralUrl).catch(() => {});
      return;
    }

    const shareAttemptId = nanoid();
    const wasEdited = message !== initialMessage;
    const attributedReferralUrl = embedShareAttemptId(
      treatyReferralUrl,
      treatyReferralUrl,
      shareAttemptId,
    );
    const outboundMessage = embedShareAttemptId(message, treatyReferralUrl, shareAttemptId);
    const selectedTemplate = selectedTemplateId
      ? availableTemplates.find((t) => t.id === selectedTemplateId) ?? null
      : null;

    // Fire-and-forget. Orphan sa= IDs are tolerated by /r/[code].
    void logShareAttempt({
      id: shareAttemptId,
      channel,
      renderedMessage: outboundMessage,
      wasEdited,
      templateBody: selectedTemplate?.body ?? null,
      templateId: selectedTemplate?.id ?? null,
    });

    const href = buildChannelHref(channel, {
      message: outboundMessage,
      shareText,
      shareUrl: attributedReferralUrl,
      taskTitle,
      taskUrl,
    });
    closeSurfaces();
    if (channel === "email") {
      window.location.href = href;
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  function handleCopyMessage() {
    const shareAttemptId = nanoid();
    const wasEdited = message !== initialMessage;
    const outboundMessage = embedShareAttemptId(message, treatyReferralUrl, shareAttemptId);
    const selectedTemplate = selectedTemplateId
      ? availableTemplates.find((t) => t.id === selectedTemplateId) ?? null
      : null;

    void logShareAttempt({
      id: shareAttemptId,
      channel: "copy-message",
      renderedMessage: outboundMessage,
      wasEdited,
      templateBody: selectedTemplate?.body ?? null,
      templateId: selectedTemplate?.id ?? null,
    });

    void copyToClipboard(outboundMessage)
      .then(() => {
        setMessageCopyState("copied");
        window.setTimeout(() => setMessageCopyState("idle"), 1500);
      })
      .catch(() => {
        setMessageCopyState("error");
        window.setTimeout(() => setMessageCopyState("idle"), 2000);
      });
  }

  const triggerClassName =
    size === "lg"
      ? "inline-flex w-full items-center justify-center border-4 border-foreground bg-brutal-pink px-6 py-4 text-lg font-black uppercase tracking-wide text-brutal-pink-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:text-xl"
      : "inline-flex items-center justify-center border-2 border-foreground bg-brutal-pink px-3 py-1 text-xs font-black uppercase tracking-wide text-brutal-pink-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]";
  const triggerLabel = size === "lg" ? "Send Reminder" : "Remind";

  const composerProps = {
    availableTemplates,
    message,
    messageCopyState,
    onChannel: handleChannel,
    onCopy: handleCopyMessage,
    onMessageChange: setMessage,
    onTemplateChange: setSelectedTemplateId,
    selectedTemplateId,
    targetLabel,
    taskTitle,
  };

  return (
    <div className={size === "lg" ? "relative w-full" : "relative"}>
      <div className={size === "lg" ? "hidden md:block w-full" : "hidden md:block"}>
        <Dialog open={desktopOpen} onOpenChange={setDesktopOpen}>
          <Dialog.Trigger asChild>
            <button
              aria-label={`Remind ${targetLabel}`}
              className={triggerClassName}
              type="button"
            >
              {triggerLabel}
            </button>
          </Dialog.Trigger>
          <Dialog.Content
            className="max-h-[calc(100vh-4rem)] w-[36rem] max-w-[calc(100vw-2rem)] overflow-y-auto border-4 border-foreground bg-background p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            title={`Send reminder — ${taskTitle}`}
          >
            <Dialog.Close className="absolute right-3 top-3 z-10 flex h-7 w-7 cursor-pointer items-center justify-center border-2 border-foreground bg-background text-xs font-black text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              ✕
            </Dialog.Close>
            <ReminderComposer {...composerProps} />
          </Dialog.Content>
        </Dialog>
      </div>

      <div className={size === "lg" ? "md:hidden w-full" : "md:hidden"}>
        <Drawer direction="bottom" open={mobileOpen} onOpenChange={setMobileOpen}>
          <Drawer.Trigger asChild>
            <button
              aria-label={`Remind ${targetLabel}`}
              className={triggerClassName}
              type="button"
            >
              {triggerLabel}
            </button>
          </Drawer.Trigger>
          <Drawer.Content className="max-h-[90vh] overflow-y-auto border-t-4 border-foreground bg-background">
            <VisuallyHidden>
              <Drawer.Title>{`Send reminder — ${taskTitle}`}</Drawer.Title>
            </VisuallyHidden>
            <ReminderComposer {...composerProps} />
          </Drawer.Content>
        </Drawer>
      </div>
    </div>
  );
}
