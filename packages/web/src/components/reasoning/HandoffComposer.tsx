"use client";

import { useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Textarea } from "@/components/retroui/Textarea";
import type { HandoffContent } from "@/lib/reasoning/arm-content";

export function HandoffComposer({
  template,
  url,
  onSend,
  onCopy,
}: {
  template: HandoffContent;
  url: string;
  onSend: (params: { message: string; channel: string }) => void;
  onCopy: (message: string) => void;
}) {
  const rendered = template.template.replace("{url}", url);
  const [message, setMessage] = useState(rendered);
  const lengthExceeded = message.length > template.maxLen;
  const openChannel = (channel: string, body: string) => {
    const encoded = encodeURIComponent(body);
    switch (channel) {
      case "sms":
        window.location.href = `sms:?&body=${encoded}`;
        return;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
        return;
      case "email":
        window.location.href = `mailto:?body=${encoded}`;
        return;
      case "slack":
        void navigator.clipboard.writeText(body);
        return;
      default:
        return;
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="min-h-[120px] font-bold"
      />
      <div className="flex items-center justify-between text-xs font-bold">
        <span>Channel: {template.channel.toUpperCase()}</span>
        <span className={lengthExceeded ? "text-brutal-red" : "text-muted-foreground"}>
          {message.length} / {template.maxLen}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(["sms", "whatsapp", "slack", "email", "copy"] as const).map((ch) => (
          <Button
            key={ch}
            onClick={() => {
              if (ch === "copy") {
                onCopy(message);
                return;
              }
              onSend({ message, channel: ch });
              openChannel(ch, message);
            }}
            className="h-10 text-xs font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-brutal-cyan-foreground border-4 border-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            {ch}
          </Button>
        ))}
      </div>
    </div>
  );
}
