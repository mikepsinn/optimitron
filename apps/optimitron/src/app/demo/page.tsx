import { DemoPlayer } from "@/components/demo/DemoPlayer";
import { DEFAULT_PLAYLIST_ID, getPlaylist } from "@/lib/demo-script";
import { demoLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(demoLink);

interface PageProps {
  searchParams: Promise<{ playlist?: string }>;
}

export default async function DemoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const playlistId = params.playlist ?? DEFAULT_PLAYLIST_ID;
  const resolvedId = getPlaylist(playlistId) ? playlistId : DEFAULT_PLAYLIST_ID;

  return (
    <>
      {/* Presentation mode — hide site chrome, force dark presentation variables.
          CSS variables are set here so they work even if light mode is active on <html>.
          This is server-rendered — no flash of light mode. */}
      <style>{`
        nav, footer { display: none !important; }
        main { min-height: 100vh !important; padding: 0 !important; margin: 0 !important; }
        html, body { overflow: hidden !important; background: #000 !important; }
        .demo-dark-force {
          --background: rgb(0, 0, 0);
          --foreground: rgb(255, 255, 255);
          --card: rgb(23, 23, 23);
          --card-foreground: rgb(255, 255, 255);
          --popover: rgb(23, 23, 23);
          --popover-foreground: rgb(255, 255, 255);
          --muted: rgb(38, 38, 38);
          --muted-foreground: rgb(200, 200, 200);
          --primary: rgb(244, 114, 182);
          --primary-foreground: rgb(0, 0, 0);
          --border: rgb(58, 58, 90);
          --input: rgb(58, 58, 90);
          color-scheme: dark;
        }
      `}</style>
      <div className="h-screen dark demo-dark-force bg-black">
        <DemoPlayer playlistId={resolvedId} />
      </div>
    </>
  );
}
