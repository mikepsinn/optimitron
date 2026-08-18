import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLAYLIST_ID,
  PLAYLISTS,
  SEGMENTS,
  estimatePlaylistDuration,
  getPlaylist,
  getPlaylistSegments,
} from "../demo-script";
import { hasSlideComponent } from "@/components/demo/slides";

describe("demo script playlists", () => {
  it("keeps segment ids and playlist ids unique", () => {
    expect(new Set(SEGMENTS.map((segment) => segment.id)).size).toBe(SEGMENTS.length);
    expect(new Set(PLAYLISTS.map((playlist) => playlist.id)).size).toBe(PLAYLISTS.length);
  });

  it("stores each playlist as resolved segment objects", () => {
    const knownSegmentIds = new Set(SEGMENTS.map((segment) => segment.id));

    for (const playlist of PLAYLISTS) {
      expect(playlist.segments.length).toBeGreaterThan(0);
      expect(playlist.segments.every((segment) => knownSegmentIds.has(segment.id))).toBe(true);
      expect(new Set(playlist.segments.map((segment) => segment.id)).size).toBe(
        playlist.segments.length,
      );
    }
  });

  it("keeps demo ids on the canonical naming scheme", () => {
    expect(
      SEGMENTS.every((segment) => !segment.id.startsWith("pl-") && !segment.id.startsWith("script-")),
    ).toBe(true);
    expect(
      SEGMENTS.every((segment) => !segment.slideId.startsWith("sierra-")),
    ).toBe(true);
  });

  it("requires every authored slide renderer id to exist in the registry", () => {
    expect(SEGMENTS.every((segment) => hasSlideComponent(segment.slideId))).toBe(
      true,
    );
  });

  it("keeps default playlist helpers aligned with the stored playlist object", () => {
    const playlist = getPlaylist(DEFAULT_PLAYLIST_ID);
    const segments = getPlaylistSegments(DEFAULT_PLAYLIST_ID);

    expect(playlist).toBeDefined();
    expect(segments).toEqual(playlist?.segments ?? []);
    expect(estimatePlaylistDuration(DEFAULT_PLAYLIST_ID)).toBeGreaterThan(0);
  });

  it("returns an empty list for unknown playlists", () => {
    expect(getPlaylistSegments("missing-playlist")).toEqual([]);
  });
});
