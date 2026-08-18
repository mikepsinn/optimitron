import { videoLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(videoLink);

const VIDEO_URL =
  "https://static.warondisease.org/assets/videos/optimitron-game-campaign-cut-2026-08-09.mp4";

export default function VideoPage() {
  return (
    <video
      className="w-full block"
      src={VIDEO_URL}
      controls
      preload="metadata"
      playsInline
    />
  );
}
