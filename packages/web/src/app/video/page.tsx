import { videoLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(videoLink);

const VIDEO_URL =
  "https://static.warondisease.org/assets/videos/optimitron-demo-2026-03-31-seekable.mp4";

export default function VideoPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-black uppercase sm:text-4xl">
        {videoLink.emoji} {videoLink.label}
      </h1>
      <p className="mb-8 text-lg font-bold text-muted-foreground">
        {videoLink.description}
      </p>
      <video
        className="w-full rounded-md border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        src={VIDEO_URL}
        controls
        preload="metadata"
      />
    </div>
  );
}
