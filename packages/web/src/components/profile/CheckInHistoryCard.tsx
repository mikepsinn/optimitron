import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyCheckInHistoryEntry } from "@/lib/profile";

interface CheckInHistoryCardProps {
  history: DailyCheckInHistoryEntry[];
}

function RatingBar({ colorClassName, value }: { colorClassName: string; value: number | null }) {
  if (value === null) {
    return <span className="text-xs font-bold uppercase text-black/40">No entry</span>;
  }

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase text-black/60">
        <span>{value}/5</span>
      </div>
      <div className="h-3 w-full border-2 border-black bg-white">
        <div className={`h-full ${colorClassName}`} style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  );
}

export function CheckInHistoryCard({ history }: CheckInHistoryCardProps) {
  return (
    <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl font-black uppercase text-black">
          Recent History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm font-medium text-black/60">
            No check-ins yet.
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.date}
                className="grid gap-4 border-2 border-black bg-cyan-50 p-4 md:grid-cols-[160px_1fr_1fr]"
              >
                <div>
                  <p className="text-sm font-black uppercase text-black">
                    {new Date(`${entry.date}T00:00:00.000Z`).toLocaleDateString()}
                  </p>
                  {entry.note ? (
                    <p className="mt-2 text-xs font-medium text-black/60">{entry.note}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-black/60">
                    Health
                  </p>
                  <RatingBar colorClassName="bg-green-400" value={entry.healthRating} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-black/60">
                    Happiness
                  </p>
                  <RatingBar colorClassName="bg-pink-400" value={entry.happinessRating} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
