"use client";

import { useState } from "react";
import { Mail, Link2, Check, Twitter, Facebook, Linkedin, Copy } from "lucide-react";
import { Button } from "@/components/retroui/Button";

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for non-secure contexts (HTTP)
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}

interface SocialShareButtonsProps {
  url: string;
  text?: string;
}

export function SocialShareButtons({ url, text }: SocialShareButtonsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const shareText = text ?? "I just mapped my priorities on Optimitron. Compare yours.";
  const fullMessage = `${shareText}\n\n${url}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);
  const emailBody = encodeURIComponent(fullMessage);

  function copyLink() {
    copyToClipboard(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }

  function copyMessage() {
    copyToClipboard(fullMessage).then(() => {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="whitespace-pre-line break-words border border-[var(--treaty-ink)] bg-[#fffdf8] p-3 text-sm font-bold leading-6 text-[var(--treaty-ink)]">
          {fullMessage}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyMessage}
          className="min-h-10 w-full justify-center border border-[var(--treaty-ink)] bg-transparent px-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf]"
        >
          {copiedMessage ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiedMessage ? "Copied!" : "Copy"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Button variant="default" size="sm" asChild className="min-h-10 justify-center border border-[var(--treaty-ink)] bg-transparent px-3 text-xs font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf]">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Twitter className="h-4 w-4" />
          X
        </a>
      </Button>
      <Button variant="default" size="sm" asChild className="min-h-10 justify-center border border-[var(--treaty-ink)] bg-transparent px-3 text-xs font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf]">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </a>
      </Button>
      <Button variant="default" size="sm" asChild className="min-h-10 justify-center border border-[var(--treaty-ink)] bg-transparent px-3 text-xs font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf]">
        <a
          href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Reddit
        </a>
      </Button>
      <Button variant="default" size="sm" asChild className="min-h-10 justify-center border border-[var(--treaty-ink)] bg-transparent px-3 text-xs font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf]">
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild className="min-h-10 justify-center border border-[var(--treaty-ink)] bg-transparent px-3 text-xs font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf]">
        <a
          href={`mailto:?subject=${encodeURIComponent("Try Optimitron")}&body=${emailBody}`}
        >
          <Mail className="h-4 w-4" />
          Email
        </a>
      </Button>
      <Button variant="outline" size="sm" onClick={copyLink} className="min-h-10 justify-center border border-[var(--treaty-ink)] bg-[var(--treaty-ink)] px-3 text-xs font-black uppercase tracking-[0.08em] text-[#fffaf0] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#3a2a19]">
        {copiedLink ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copiedLink ? "Copied!" : "Copy Link"}
      </Button>
      </div>
    </div>
  );
}
