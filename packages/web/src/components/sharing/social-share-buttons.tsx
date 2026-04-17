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
      <div className="relative">
        <div className="border-4 border-primary bg-muted p-3 text-sm font-bold whitespace-pre-line">
          {fullMessage}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyMessage}
          className="absolute top-2 right-2 font-black uppercase"
        >
          {copiedMessage ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiedMessage ? "Copied!" : "Copy"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
      <Button variant="default" size="sm" asChild>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Twitter className="h-4 w-4" />
          X
        </a>
      </Button>
      <Button variant="default" size="sm" asChild>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </a>
      </Button>
      <Button variant="default" size="sm" asChild>
        <a
          href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Reddit
        </a>
      </Button>
      <Button variant="default" size="sm" asChild>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a
          href={`mailto:?subject=${encodeURIComponent("Try Optimitron")}&body=${emailBody}`}
        >
          <Mail className="h-4 w-4" />
          Email
        </a>
      </Button>
      <Button variant="outline" size="sm" onClick={copyLink}>
        {copiedLink ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copiedLink ? "Copied!" : "Copy Link"}
      </Button>
      </div>
    </div>
  );
}
