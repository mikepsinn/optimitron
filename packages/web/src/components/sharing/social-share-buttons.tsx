"use client"
export function SocialShareButtons({ url, text }: { url: string; text?: string }) {
  const shareText = text || "Check out my government budget priorities!";
  return (
    <div className="flex gap-2">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 border-2 border-black font-bold bg-blue-400 text-white hover:bg-blue-500"
      >
        𝕏 Share
      </a>
    </div>
  );
}
