"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { FaEnvelope, FaXTwitter } from "react-icons/fa6";
import { SiBluesky } from "react-icons/si";
import { Button } from "@/components/retroui/Button";
import { Drawer } from "@/components/retroui/Drawer";
import { Popover } from "@/components/retroui/Popover";
import { Textarea } from "@/components/retroui/Textarea";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { useRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildTaskUrl } from "@/lib/url";

type ReminderChannel =
  | "bluesky"
  | "copy-link"
  | "copy-message"
  | "email"
  | "facebook"
  | "linkedin"
  | "reddit"
  | "x";

interface TaskRowShareProps {
  badges?: string[];
  baseUrl?: string;
  shareText: string;
  targetLabel: string;
  taskId: string;
  taskTitle: string;
}

function buildChannelHref(
  channel: Exclude<ReminderChannel, "copy-link" | "copy-message">,
  input: {
  message: string;
  shareText: string;
  taskUrl: string;
  taskTitle: string;
}) {
  const encodedMessage = encodeURIComponent(input.message);
  const encodedUrl = encodeURIComponent(input.taskUrl);
  if (channel === "x") {
    return `https://twitter.com/intent/tweet?text=${encodedMessage}`;
  }
  if (channel === "bluesky") {
    return `https://bsky.app/intent/compose?text=${encodedMessage}`;
  }
  if (channel === "linkedin") {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  }
  if (channel === "facebook") {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  }
  if (channel === "reddit") {
    return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(input.shareText)}`;
  }

  const subject = encodeURIComponent(`Please complete: ${input.taskTitle}`);
  return `mailto:?subject=${subject}&body=${encodedMessage}`;
}

function ReminderComposer({
  badges,
  linkCopyState,
  message,
  messageCopyState,
  onBluesky,
  onCopyLink,
  onCopy,
  onEmail,
  onFacebook,
  onLinkedIn,
  onMessageChange,
  onReddit,
  onX,
  targetLabel,
  taskTitle,
}: {
  badges: string[];
  linkCopyState: "copied" | "error" | "idle";
  message: string;
  messageCopyState: "copied" | "error" | "idle";
  onBluesky: () => void;
  onCopyLink: () => void;
  onCopy: () => void;
  onEmail: () => void;
  onFacebook: () => void;
  onLinkedIn: () => void;
  onMessageChange: (value: string) => void;
  onReddit: () => void;
  onX: () => void;
  targetLabel: string;
  taskTitle: string;
}) {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brutal-pink">
          Ready-To-Send Reminder
        </p>
        <div className="space-y-1">
          <h3 className="text-base font-black uppercase leading-tight">
            Remind {targetLabel}
          </h3>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            {taskTitle}
          </p>
          <p className="text-xs font-bold leading-5 text-muted-foreground">
            Copy the message or launch it in a channel. Your task link is already attached.
          </p>
        </div>
      </div>

      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="border-2 border-foreground bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      <Textarea
        aria-label={`Reminder message for ${targetLabel}`}
        className="min-h-[8.5rem] border-4 border-foreground bg-background text-sm font-bold leading-5"
        rows={5}
        value={message}
        onChange={(event) => onMessageChange(event.target.value)}
      />

      <div className="space-y-2">
        <Button
          className="w-full justify-center border-4 border-foreground bg-brutal-pink font-black uppercase text-brutal-pink-foreground"
          size="sm"
          type="button"
          onClick={onCopy}
        >
          {messageCopyState === "copied"
            ? "Message Copied"
            : messageCopyState === "error"
              ? "Copy Failed"
              : "Copy Message"}
        </Button>

        <div className="grid grid-cols-3 gap-2">
          <Button
            className="justify-center gap-2 font-black uppercase"
            size="sm"
            type="button"
            variant="outline"
            onClick={onX}
          >
            <FaXTwitter className="h-3.5 w-3.5" />
            <span>X</span>
          </Button>
          <Button
            className="justify-center gap-2 font-black uppercase"
            size="sm"
            type="button"
            variant="outline"
            onClick={onBluesky}
          >
            <SiBluesky className="h-3.5 w-3.5" />
            <span>Sky</span>
          </Button>
          <Button
            className="justify-center gap-2 font-black uppercase"
            size="sm"
            type="button"
            variant="outline"
            onClick={onEmail}
          >
            <FaEnvelope className="h-3.5 w-3.5" />
            <span>Email</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t-2 border-foreground/15 pt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
          More Platforms
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="justify-center font-black uppercase"
            size="sm"
            type="button"
            variant="outline"
            onClick={onLinkedIn}
          >
            LinkedIn
          </Button>
          <Button
            className="justify-center font-black uppercase"
            size="sm"
            type="button"
            variant="outline"
            onClick={onFacebook}
          >
            Facebook
          </Button>
          <Button
            className="justify-center font-black uppercase"
            size="sm"
            type="button"
            variant="outline"
            onClick={onReddit}
          >
            Reddit
          </Button>
          <Button
            className="justify-center font-black uppercase"
            size="sm"
            type="button"
            variant="outline"
            onClick={onCopyLink}
          >
            {linkCopyState === "copied"
              ? "Link Copied"
              : linkCopyState === "error"
                ? "Copy Failed"
                : "Copy Link"}
          </Button>
        </div>
      </div>

      <p className="text-[11px] font-bold leading-5 text-muted-foreground">
        The top row uses your edited message. The extra platforms share the task link directly.
      </p>
    </div>
  );
}

export function TaskRowShare({
  badges = [],
  baseUrl,
  shareText,
  targetLabel,
  taskId,
  taskTitle,
}: TaskRowShareProps) {
  const [linkCopyState, setLinkCopyState] = useState<"idle" | "copied" | "error">("idle");
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
  const initialMessage = useMemo(
    () => `${shareText}\n\n${taskUrl}`.trim(),
    [shareText, taskUrl],
  );

  useEffect(() => {
    setMessage(initialMessage);
    setLinkCopyState("idle");
    setMessageCopyState("idle");
  }, [initialMessage]);

  function closeSurfaces() {
    setDesktopOpen(false);
    setMobileOpen(false);
  }

  async function trackReminder(channel: ReminderChannel) {
    try {
      await fetch("/api/share/track", {
        body: JSON.stringify({
          templateLabel: `task-row-reminder-${channel}`,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    } catch {
      // Reminder tracking is best-effort only.
    }
  }

  function openChannel(channel: Exclude<ReminderChannel, "copy-link" | "copy-message">) {
    const href = buildChannelHref(channel, {
      message,
      shareText,
      taskTitle,
      taskUrl,
    });
    void trackReminder(channel);
    closeSurfaces();
    if (channel === "email") {
      window.location.href = href;
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  function handleCopyMessage() {
    void navigator.clipboard
      .writeText(message)
      .then(() => {
        void trackReminder("copy-message");
        setMessageCopyState("copied");
        window.setTimeout(() => setMessageCopyState("idle"), 1500);
      })
      .catch(() => {
        setMessageCopyState("error");
        window.setTimeout(() => setMessageCopyState("idle"), 2000);
      });
  }

  function handleCopyLink() {
    void navigator.clipboard
      .writeText(taskUrl)
      .then(() => {
        void trackReminder("copy-link");
        setLinkCopyState("copied");
        window.setTimeout(() => setLinkCopyState("idle"), 1500);
      })
      .catch(() => {
        setLinkCopyState("error");
        window.setTimeout(() => setLinkCopyState("idle"), 2000);
      });
  }

  const triggerClassName =
    "inline-flex items-center justify-center border-2 border-foreground bg-brutal-pink px-3 py-1 text-xs font-black uppercase tracking-wide text-brutal-pink-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]";

  return (
    <div className="relative">
      <div className="hidden md:block">
        <Popover open={desktopOpen} onOpenChange={setDesktopOpen}>
          <Popover.Trigger asChild>
            <button
              aria-label={`Remind ${targetLabel}`}
              className={triggerClassName}
              type="button"
            >
              Remind
            </button>
          </Popover.Trigger>
          <Popover.Content
            align="end"
            className="w-[24rem] max-w-[calc(100vw-2rem)] border-4 border-foreground bg-background p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            sideOffset={8}
          >
            <ReminderComposer
              badges={badges}
              linkCopyState={linkCopyState}
              message={message}
              messageCopyState={messageCopyState}
              targetLabel={targetLabel}
              taskTitle={taskTitle}
              onBluesky={() => openChannel("bluesky")}
              onCopy={handleCopyMessage}
              onCopyLink={handleCopyLink}
              onEmail={() => openChannel("email")}
              onFacebook={() => openChannel("facebook")}
              onLinkedIn={() => openChannel("linkedin")}
              onMessageChange={setMessage}
              onReddit={() => openChannel("reddit")}
              onX={() => openChannel("x")}
            />
          </Popover.Content>
        </Popover>
      </div>

      <div className="md:hidden">
        <Drawer direction="bottom" open={mobileOpen} onOpenChange={setMobileOpen}>
          <Drawer.Trigger asChild>
            <button
              aria-label={`Remind ${targetLabel}`}
              className={triggerClassName}
              type="button"
            >
              Remind
            </button>
          </Drawer.Trigger>
          <Drawer.Content className="border-t-4 border-foreground bg-background">
            <ReminderComposer
              badges={badges}
              linkCopyState={linkCopyState}
              message={message}
              messageCopyState={messageCopyState}
              targetLabel={targetLabel}
              taskTitle={taskTitle}
              onBluesky={() => openChannel("bluesky")}
              onCopy={handleCopyMessage}
              onCopyLink={handleCopyLink}
              onEmail={() => openChannel("email")}
              onFacebook={() => openChannel("facebook")}
              onLinkedIn={() => openChannel("linkedin")}
              onMessageChange={setMessage}
              onReddit={() => openChannel("reddit")}
              onX={() => openChannel("x")}
            />
          </Drawer.Content>
        </Drawer>
      </div>
    </div>
  );
}
