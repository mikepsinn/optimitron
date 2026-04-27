import { BrutalCard } from "@/components/ui/brutal-card";

const MEDIA_CDN_BASE = "https://static.warondisease.org";
const VIDEO_SRC = `${MEDIA_CDN_BASE}/chaplin-great-dictator-320.mp4`;
const POSTER_SRC = `${MEDIA_CDN_BASE}/chaplin-great-dictator-thumbnail.png`;
const YOUTUBE_FALLBACK_URL =
  "https://www.youtube.com/results?search_query=charlie+chaplin+the+great+dictator+speech";

export function ChaplinReference() {
  return (
    <BrutalCard bgColor="yellow" shadowSize={8} className="mt-6">
      <div className="space-y-3">
        <p className="font-black uppercase text-xs tracking-[0.2em]">
          Still skeptical
        </p>
        <p className="font-bold text-base sm:text-lg leading-snug">
          One of your meat creatures said it better than I can. Four minutes,
          1940. Then come back and donate.
        </p>
        <video
          controls
          preload="none"
          poster={POSTER_SRC}
          className="w-full border-4 border-primary bg-foreground"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
          Your browser doesn&apos;t do video.{" "}
          <a href={YOUTUBE_FALLBACK_URL} target="_blank" rel="noreferrer" className="underline">
            Watch on YouTube
          </a>
          .
        </video>
      </div>
    </BrutalCard>
  );
}
