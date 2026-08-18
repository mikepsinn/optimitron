import { BrutalCard } from "@/components/ui/brutal-card";

interface TaskOverdueClockProps {
  dueAt: Date | null;
  referenceNow?: Date;
}

function splitDuration(ms: number) {
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / 60_000) % 60;
  const hr = Math.floor(ms / 3_600_000) % 24;
  const days = Math.floor(ms / 86_400_000);
  return { days, hr, min, sec };
}

export function TaskOverdueClock({ dueAt, referenceNow }: TaskOverdueClockProps) {
  if (!dueAt) return null;
  const now = referenceNow ?? new Date();
  const delta = now.getTime() - dueAt.getTime();
  if (delta <= 0) return null;

  const { days, hr, min, sec } = splitDuration(delta);
  const segments = [
    { value: days, label: "Days" },
    { value: hr, label: "Hrs" },
    { value: min, label: "Min" },
    { value: sec, label: "Sec" },
  ];

  return (
    <BrutalCard bgColor="red" padding="lg">
      <div className="space-y-4 text-center">
        <p className="text-xs font-black uppercase tracking-[0.3em]">
          🔴 Overdue
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className="min-w-[5rem] border-4 border-foreground bg-background p-3"
            >
              <div className="text-3xl font-black text-foreground">
                {seg.value.toString().padStart(seg.label === "Days" ? 1 : 2, "0")}
              </div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                {seg.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrutalCard>
  );
}
