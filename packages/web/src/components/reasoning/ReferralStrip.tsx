"use client";

export function ReferralStrip({
  referrerDisplayName,
}: {
  referrerDisplayName: string | null;
}) {
  if (!referrerDisplayName) return null;
  return (
    <div className="mx-auto mb-4 max-w-2xl border-4 border-primary bg-brutal-yellow px-4 py-2 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <p className="text-sm font-black uppercase text-brutal-yellow-foreground">
        Sent by @{referrerDisplayName}
      </p>
    </div>
  );
}
