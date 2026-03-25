import { Card } from "@/components/retroui/Card";
import type { DailyCheckInHistoryEntry } from "@/lib/profile";

interface CheckInHistoryCardProps {
  history: DailyCheckInHistoryEntry[];
}

function RatingBar({ colorClassName, value }: { colorClassName: string; value: number | null }) {
  if (value === null) {
    return <span className="text-xs font-bold uppercase text-muted-foreground">No entry</span>;
  }

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
        <span>{value}/5</span>
      </div>
      <div className="h-3 w-full border-4 border-primary bg-background">
        <div className={`h-full ${colorClassName}`} style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  );
}

export function CheckInHistoryCard({ history }: CheckInHistoryCardProps) {
  return (
    <Card className="border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <Card.Header className="gap-3">
        <Card.Title className="text-2xl font-black uppercase text-foreground">
          Recent History
        </Card.Title>
      </Card.Header>
      <Card.Content>
        {history.length === 0 ? (
          <p className="text-sm font-bold text-muted-foreground">
            No check-ins yet.
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.date}
                className="grid gap-4 border-4 border-primary bg-brutal-cyan p-4 md:grid-cols-[160px_1fr_1fr]"
              >
                <div>
                  <p className="text-sm font-black uppercase text-foreground">
                    {new Date(`${entry.date}T00:00:00.000Z`).toLocaleDateString()}
                  </p>
                  {entry.note ? (
                    <p className="mt-2 text-xs font-bold text-muted-foreground">{entry.note}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                    Health
                  </p>
                  <RatingBar colorClassName="bg-brutal-cyan" value={entry.healthRating} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                    Happiness
                  </p>
                  <RatingBar colorClassName="bg-brutal-pink" value={entry.happinessRating} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
