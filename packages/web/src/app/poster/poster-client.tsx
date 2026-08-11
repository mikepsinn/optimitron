"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard } from "@/lib/clipboard";
import type { FlyerHangNearbyTask } from "@/lib/flyer-hang";

export function PosterPrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      className="border-2 border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}

function CopyTextButton({
  ariaLabel,
  idleLabel,
  value,
  visualAction,
}: {
  ariaLabel: string;
  idleLabel: string;
  value: string;
  visualAction?: string;
}) {
  const [copyState, setCopyState] = useState<"copied" | "error" | "idle">(
    "idle",
  );

  function handleCopy() {
    void copyTextToClipboard(value)
      .then(() => {
        setCopyState("copied");
        window.setTimeout(() => setCopyState("idle"), 1500);
      })
      .catch(() => {
        setCopyState("error");
        window.setTimeout(() => setCopyState("idle"), 2000);
      });
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-4 py-2 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
      data-visual-action={visualAction}
      onClick={handleCopy}
    >
      {copyState === "copied" ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {copyState === "copied"
        ? "Copied"
        : copyState === "error"
          ? "Copy failed"
          : idleLabel}
    </button>
  );
}

export function PosterCopyLinkButton({ value }: { value: string }) {
  return (
    <CopyTextButton
      ariaLabel="Copy referral link"
      idleLabel="Copy link"
      value={value}
    />
  );
}

export function FlyerRoutePromptCopyButton({ value }: { value: string }) {
  return (
    <CopyTextButton
      ariaLabel="Copy the flyer route prompt for your AI"
      idleLabel="Copy AI prompt"
      value={value}
      visualAction="copy-flyer-route-prompt"
    />
  );
}

function formatDistanceKm(distanceKm: number) {
  if (distanceKm < 1) return `${Math.max(0.1, distanceKm).toFixed(1)} km`;
  return `${distanceKm.toFixed(1)} km`;
}

function freshnessLabel(place: FlyerHangNearbyTask) {
  if (place.freshness.status === "never_hung") return "Needs first hang";
  if (place.freshness.status === "stale") {
    const days = place.freshness.staleAgeDays;
    return days == null ? "Needs rehang" : `Stale · ${Math.floor(days)}d ago`;
  }
  return "Recently hung";
}

export function PosterHangNearbyPanel({ signedIn }: { signedIn: boolean }) {
  const [places, setPlaces] = useState<FlyerHangNearbyTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);
  // The initial saved-location load and an explicit "Use my location" click
  // can both be in flight at once (geolocation permission prompts add
  // unpredictable latency). Only the response to the most recently
  // *started* request should be allowed to update state, so a slow saved-
  // location reply can't clobber a faster, more-precise browser-location one.
  const requestIdRef = useRef(0);

  async function loadNearby(coords?: { latitude: number; longitude: number }) {
    if (!signedIn) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/flyer-hang/nearby", {
        body: JSON.stringify(coords ?? {}),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        needsLocation?: boolean;
        places?: FlyerHangNearbyTask[];
      };
      if (requestId !== requestIdRef.current) return;
      if (!response.ok) {
        setNeedsLocation(Boolean(payload.needsLocation));
        setPlaces([]);
        setError(payload.error ?? "Could not load hang spots.");
        return;
      }
      setNeedsLocation(false);
      setPlaces(payload.places ?? []);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError("Could not load hang spots.");
      setPlaces([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!signedIn) return;
    void loadNearby();
    // Initial load uses saved profile/IP location; browser geolocation is
    // opt-in via the button below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  function requestBrowserLocation() {
    if (!navigator.geolocation) {
      setError("This browser cannot share location.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadNearby({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setLoading(false);
        setError(
          "Location permission denied. Enable it, or use a saved profile location.",
        );
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
    );
  }

  if (!signedIn) {
    return (
      <div className="border border-foreground bg-background p-4">
        <h2 className="text-xl font-black uppercase">Hang near you</h2>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          Sign in to get nearby hang spots as claimable tasks and credit when
          someone votes through your poster QR.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-foreground bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase">Hang near you</h2>
          <p className="mt-2 max-w-2xl text-sm font-bold text-muted-foreground">
            Shared hang spots. Claim one, ask before you tape, photograph it,
            mark it done. Spots go stale after about 21 days and need a rehang.
          </p>
        </div>
        <button
          type="button"
          className="border border-foreground bg-background px-3 py-2 text-xs font-black uppercase text-foreground hover:bg-foreground hover:text-background"
          onClick={requestBrowserLocation}
        >
          Use my location
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm font-bold text-muted-foreground">
          Finding hang spots…
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm font-bold text-foreground">{error}</p>
      ) : null}
      {needsLocation ? (
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          Share location once so we can seed boards near you.
        </p>
      ) : null}

      {places.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {places.map((place) => (
            <li
              key={place.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-foreground px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase text-foreground">
                  {place.title}
                </p>
                <p className="text-xs font-bold text-muted-foreground">
                  {formatDistanceKm(place.distanceKm)} · {freshnessLabel(place)}
                  {place.source === "osm" ? " · mapped place" : " · area target"}
                </p>
              </div>
              <Link
                className="shrink-0 border border-foreground bg-foreground px-3 py-1.5 text-xs font-black uppercase text-background hover:bg-background hover:text-foreground"
                href={place.href}
              >
                Open task
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
