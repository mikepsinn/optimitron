import Link from "next/link";
import { Button } from "@/components/retroui/Button";
import { BrutalCard } from "@/components/ui/brutal-card";

interface TaskHowToSignCardProps {
  leaderName: string;
}

export function TaskHowToSignCard({ leaderName }: TaskHowToSignCardProps) {
  return (
    <BrutalCard bgColor="cyan" padding="lg">
      <div className="space-y-4">
        <p className="text-xs font-black uppercase tracking-[0.18em]">
          How {leaderName} signs
        </p>
        <ol className="space-y-2 text-2xl font-black uppercase sm:text-3xl">
          <li>1. Open the treaty page</li>
          <li>2. Type name</li>
          <li>3. Click Sign</li>
        </ol>
        <p className="text-sm font-bold">
          30 seconds. No committee. No vote. No budget meeting.
        </p>
        <Button asChild className="font-black uppercase" size="lg">
          <Link href="/treaty">Open the treaty page →</Link>
        </Button>
      </div>
    </BrutalCard>
  );
}
