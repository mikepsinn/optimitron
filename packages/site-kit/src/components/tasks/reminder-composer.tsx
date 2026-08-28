"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import {
  FaEnvelope,
  FaFacebookF,
  FaLink,
  FaLinkedinIn,
  FaRedditAlien,
  FaXTwitter,
} from "react-icons/fa6"
import { SiBluesky } from "react-icons/si"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@optimitron/neobrutalist-ui/ui/select"
import type { ReminderChannel } from "../../lib/share-channels"
import type { ShareTemplate } from "../../lib/tasks/share-templates"

const CHANNEL_ICONS: {
  channel: Exclude<ReminderChannel, "copy-message">
  icon: ReactNode
  label: string
}[] = [
  { channel: "x", icon: <FaXTwitter className="h-3.5 w-3.5" />, label: "X" },
  { channel: "bluesky", icon: <SiBluesky className="h-3.5 w-3.5" />, label: "Bluesky" },
  { channel: "email", icon: <FaEnvelope className="h-3.5 w-3.5" />, label: "Email" },
  { channel: "linkedin", icon: <FaLinkedinIn className="h-3.5 w-3.5" />, label: "LinkedIn" },
  { channel: "facebook", icon: <FaFacebookF className="h-3.5 w-3.5" />, label: "Facebook" },
  { channel: "reddit", icon: <FaRedditAlien className="h-3.5 w-3.5" />, label: "Reddit" },
  { channel: "copy-link", icon: <FaLink className="h-3.5 w-3.5" />, label: "Copy Link" },
]

export interface ReminderComposerProps {
  availableTemplates: ShareTemplate[]
  message: string
  messageCopyState: "copied" | "error" | "idle"
  onChannel: (channel: Exclude<ReminderChannel, "copy-message">) => void
  onCopy: () => void
  onMessageChange: (value: string) => void
  onTemplateChange: (templateId: string) => void
  selectedTemplateId: string | null
  targetLabel: string
  taskTitle: string
  heading?: string
  copyIdleLabel?: string
  copyCopiedLabel?: string
  copyErrorLabel?: string
  copyDisabled?: boolean
  customActions?: ReactNode
  extraControls?: ReactNode
  hideDefaultActions?: boolean
  headerAccessory?: ReactNode
  /** `[templateStepLabel, channelStepLabel]` — rendered above each control. */
  steps?: string[]
}

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
  heading = "Send Overdue Task Reminder",
  copyIdleLabel = "Copy Reminder Message",
  copyCopiedLabel = "Reminder Copied ✓",
  copyErrorLabel = "Copy Failed",
  copyDisabled = false,
  customActions,
  extraControls,
  hideDefaultActions = false,
  headerAccessory,
  steps,
}: ReminderComposerProps) {
  const [linkCopyState, setLinkCopyState] = useState<"copied" | "idle">("idle")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "0"
    // Grow to fit content but let CSS max-h cap it
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    autoResize()
  }, [message, autoResize])

  const stepOne = steps?.[0]
  const stepThree = steps?.[1]

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-base font-black uppercase leading-tight">{heading}</h3>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            {taskTitle}
          </p>
        </div>
        {headerAccessory ? <div className="shrink-0">{headerAccessory}</div> : null}
      </div>

      {extraControls}

      {availableTemplates.length > 1 ? (
        <div className="space-y-1.5">
          {stepOne ? (
            <p className="text-xs font-black uppercase tracking-[0.14em] text-foreground">
              {stepOne}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Voice:
            </span>
            <Select value={selectedTemplateId ?? undefined} onValueChange={onTemplateChange}>
              <SelectTrigger className="h-8 min-w-0 flex-1 border-2 border-foreground text-[11px] font-black uppercase !shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-2 border-foreground !shadow-none">
                {availableTemplates.map((template) => (
                  <SelectItem
                    key={template.id}
                    value={template.id}
                    className="text-[11px] font-black uppercase"
                  >
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      <textarea
        ref={textareaRef}
        aria-label={`Reminder message for ${targetLabel}`}
        className="min-h-[4rem] max-h-[50vh] w-full resize-none overflow-y-auto border-4 border-foreground bg-background px-4 py-2 text-sm font-bold leading-5 placeholder:text-muted-foreground focus:outline-hidden"
        value={message}
        onChange={(event) => {
          onMessageChange(event.target.value)
          autoResize()
        }}
      />

      <Button
        className="w-full cursor-pointer justify-center border-4 border-foreground bg-foreground font-black uppercase text-background !shadow-none transition-colors hover:bg-foreground/85"
        disabled={copyDisabled}
        size="sm"
        type="button"
        onClick={onCopy}
      >
        {messageCopyState === "copied"
          ? copyCopiedLabel
          : messageCopyState === "error"
            ? copyErrorLabel
            : copyIdleLabel}
      </Button>

      {hideDefaultActions ? null : (
        <div className="space-y-1.5">
          {stepThree ? (
            <p className="text-xs font-black uppercase tracking-[0.14em] text-foreground">
              {stepThree}
            </p>
          ) : null}
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            {CHANNEL_ICONS.map(({ channel, icon, label }) => (
              <button
                key={channel}
                type="button"
                aria-label={label}
                className="group flex cursor-pointer flex-col items-center gap-1 rounded-sm border-2 border-foreground bg-background px-1 py-2 text-foreground transition-colors hover:bg-muted"
                onClick={() => {
                  if (channel === "copy-link") {
                    setLinkCopyState("copied")
                    window.setTimeout(() => setLinkCopyState("idle"), 1500)
                  }
                  onChannel(channel)
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
      )}

      {customActions}
    </div>
  )
}
