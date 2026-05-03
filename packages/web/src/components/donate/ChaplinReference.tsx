const MEDIA_CDN_BASE = "https://static.warondisease.org";
const VIDEO_SRC = `${MEDIA_CDN_BASE}/chaplin-great-dictator-320.mp4`;
const POSTER_SRC = `${MEDIA_CDN_BASE}/chaplin-great-dictator-thumbnail.png`;
const YOUTUBE_FALLBACK_URL =
  "https://www.youtube.com/results?search_query=charlie+chaplin+the+great+dictator+speech";

export function ChaplinReference() {
  return (
    <video
      controls
      preload="none"
      poster={POSTER_SRC}
      className="w-full bg-black"
    >
      <source src={VIDEO_SRC} type="video/mp4" />
      Your browser doesn&apos;t do video.{" "}
      <a
        href={YOUTUBE_FALLBACK_URL}
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        Watch on YouTube
      </a>
      .
    </video>
  );
}
