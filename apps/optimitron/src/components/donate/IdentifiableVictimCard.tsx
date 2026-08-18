import { BrutalCard } from "@/components/ui/brutal-card";

export function IdentifiableVictimCard() {
  return (
    <BrutalCard bgColor="pink" shadowSize={8} className="mb-6">
      <div className="space-y-3 font-bold text-base sm:text-lg leading-snug">
        <p>That number is too large for your brain to feel. So feel one.</p>
        <p>
          Pick someone you love. Imagine the moment a doctor tells you there&apos;s
          nothing left to try, and somewhere on a shelf, untested, sits the compound
          that would have worked.
        </p>
        <p>
          Now multiply that feeling by a number your brain refuses to hold. The part
          you can&apos;t feel is the actual size of this problem.
        </p>
      </div>
    </BrutalCard>
  );
}
