"use client";

import { Mail } from "lucide-react";

interface SocialShareButtonsProps {
  url: string;
  text?: string;
}

export function SocialShareButtons({ url, text }: SocialShareButtonsProps) {
  const shareText = text ?? "I just mapped my priorities on Optomitron. Compare yours.";
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);
  const emailBody = encodeURIComponent(`${shareText}\n\n${url}`);

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center border-2 border-black bg-black px-4 py-2 font-bold text-white transition-colors hover:bg-black/80"
      >
        Share on X
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent("Try Optomitron")}&body=${emailBody}`}
        className="inline-flex items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2 font-bold transition-colors hover:bg-muted"
      >
        <Mail className="h-4 w-4" />
        Email
      </a>
    </div>
  );
}
