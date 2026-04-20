"use client";

/**
 * Private cohort stats for authenticated referrers.
 * Shown on the replication screen after first send.
 */
export function ReferrerCohortStats({
  referredCount,
  votedCount,
  forwardedCount,
  chainDepth,
}: {
  referredCount: number;
  votedCount: number;
  forwardedCount: number;
  chainDepth: number;
}) {
  if (referredCount === 0) return null;
  const votePct = referredCount > 0 ? Math.round((votedCount / referredCount) * 100) : 0;
  const forwardPct = votedCount > 0 ? Math.round((forwardedCount / votedCount) * 100) : 0;
  return (
    <div className="mt-4 border-2 border-primary bg-muted p-3">
      <h3 className="text-xs font-black uppercase mb-2">Your cohort so far</h3>
      <ul className="space-y-1 text-xs font-bold">
        <li>People you&apos;ve referred: <span className="font-black">{referredCount}</span></li>
        <li>Of those who voted: <span className="font-black">{votePct}%</span></li>
        <li>Of those who then forwarded: <span className="font-black">{forwardPct}%</span></li>
        <li>Your downstream chain depth: <span className="font-black">{chainDepth}</span></li>
      </ul>
    </div>
  );
}
