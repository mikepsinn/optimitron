"use client";

import { useState } from "react";
import { Mail, Link2, Check, Twitter, Facebook, Linkedin } from "lucide-react";
import { Button } from "@/components/retroui/Button";

interface SocialShareButtonsProps {
  url: string;
  text?: string;
}

export function SocialShareButtons({ url, text }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareText = text ?? "I just mapped my priorities on Optimitron. Compare yours.";
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);
  const emailBody = encodeURIComponent(`${shareText}\n\n${url}`);

  function copyLink() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback for non-secure contexts (HTTP)
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
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
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Copied!" : "Copy Link"}
      </Button>
    </div>
  );
}
