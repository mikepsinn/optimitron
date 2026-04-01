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
      {/* Presentation mode — hide site chrome */}
      <style>{`
        nav, footer { display: none !important; }
        main { min-height: 100vh !important; padding: 0 !important; margin: 0 !important; }
        html, body { overflow: hidden !important; background: #000 !important; }
      `}</style>
      <div className="h-screen dark bg-black">
        <DemoPlayer playlistId={resolvedId} />
      </div>
    </>
  );
}
