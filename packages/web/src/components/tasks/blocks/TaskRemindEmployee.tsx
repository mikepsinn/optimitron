"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/retroui/Button";
import { Textarea } from "@/components/retroui/Textarea";
import { BrutalCard } from "@/components/ui/brutal-card";
import { renderTemplate } from "./render-template";
import type {
  TaskContextAssigneeProfile,
  TaskContextReminder,
} from "@/lib/tasks/task-context";

interface TaskRemindEmployeeProps {
  reminder: TaskContextReminder | undefined;
  assigneeProfile: TaskContextAssigneeProfile | undefined;
  tokens: Record<string, string | number | null | undefined>;
}

export function TaskRemindEmployee({
  reminder,
  assigneeProfile,
  tokens,
}: TaskRemindEmployeeProps) {
  const initialMessage = useMemo(
    () => (reminder ? renderTemplate(reminder.messageTemplate, tokens) : ""),
    [reminder, tokens],
  );
  const [message, setMessage] = useState(initialMessage);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  if (!reminder) return null;

  const introText = reminder.intro ? renderTemplate(reminder.intro, tokens) : null;

  function handleCopy() {
    void navigator.clipboard
      .writeText(message)
      .then(() => {
        setCopyState("copied");
        window.setTimeout(() => setCopyState("idle"), 1500);
      })
      .catch(() => {
        setCopyState("error");
        window.setTimeout(() => setCopyState("idle"), 2000);
      });
  }

  const encodedMessage = encodeURIComponent(message);

  return (
    <BrutalCard bgColor="background" padding="lg">
      <div className="space-y-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-pink">
          Remind Your Employee
        </p>
        {introText ? (
          <p className="text-sm font-bold">{introText}</p>
        ) : null}
        <Textarea
          aria-label="Reminder message"
          className="min-h-[12rem] border-4 border-foreground bg-background font-bold"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild className="font-black uppercase" size="sm" variant="outline">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodedMessage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              𝕏 Post
            </a>
          </Button>
          <Button asChild className="font-black uppercase" size="sm" variant="outline">
            <a
              href={`https://bsky.app/intent/compose?text=${encodedMessage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Bluesky
            </a>
          </Button>
          <Button asChild className="font-black uppercase" size="sm" variant="outline">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?summary=${encodedMessage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </Button>
          <Button
            className="font-black uppercase"
            size="sm"
            type="button"
            variant="outline"
            onClick={handleCopy}
          >
            {copyState === "copied"
              ? "Copied"
              : copyState === "error"
                ? "Copy Failed"
                : "Copy"}
          </Button>
        </div>

        {assigneeProfile?.contactChannels &&
        assigneeProfile.contactChannels.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-black uppercase text-muted-foreground">
              Contact Directly
            </p>
            <div className="flex flex-wrap gap-2">
              {assigneeProfile.contactChannels.map((channel) => (
                <Link
                  key={`${channel.kind}-${channel.href}`}
                  className="border-2 border-foreground bg-background px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px]"
                  href={channel.href}
                  target="_blank"
                >
                  {channel.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </BrutalCard>
  );
}
