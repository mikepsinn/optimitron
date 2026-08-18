const VIDEO_URL =
  "https://static.warondisease.org/assets/videos/optimitron-game-campaign-cut-2026-08-09.mp4";

export function DemoVideoSection() {
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
