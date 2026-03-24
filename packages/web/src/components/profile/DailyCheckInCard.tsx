"use client";

import { useEffect, useState, useTransition } from "react";
import { API_ROUTES } from "@/lib/api-routes";
import { useWishPoints } from "@/components/wishes/WishPointProvider";
import { AlertCard } from "@/components/ui/alert-card";
import { AmountSelector } from "@/components/ui/amount-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import type { CurrentCheckInData, ProfilePageData } from "@/lib/profile";

interface DailyCheckInCardProps {
  currentCheckIn: CurrentCheckInData;
  onSaved: (data: ProfilePageData) => void;
}

export function DailyCheckInCard({ currentCheckIn, onSaved }: DailyCheckInCardProps) {
  const [healthRating, setHealthRating] = useState<number | null>(currentCheckIn.healthRating);
  const [happinessRating, setHappinessRating] = useState<number | null>(
    currentCheckIn.happinessRating,
  );
  const [note, setNote] = useState(currentCheckIn.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showWishReward } = useWishPoints();

  useEffect(() => {
    setHealthRating(currentCheckIn.healthRating);
    setHappinessRating(currentCheckIn.happinessRating);
    setNote(currentCheckIn.note ?? "");
  }, [currentCheckIn]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (healthRating === null || happinessRating === null) {
      setError("Choose both ratings.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(() => {
      void fetch(API_ROUTES.profile.checkIn, {
        body: JSON.stringify({
          happinessRating,
          healthRating,
          note,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
        .then(async (response) => {
          const payload = (await response.json().catch(() => null)) as
            | { data?: ProfilePageData; error?: string; wishesEarned?: number }
            | null;

          if (!response.ok || !payload?.data) {
            throw new Error(payload?.error ?? "Unable to save check-in.");
          }

          onSaved(payload.data);
          setSuccess("Saved.");

          if (payload.wishesEarned) {
            try { showWishReward(payload.wishesEarned, "Daily Check-In"); } catch { /* noop */ }
          }
        })
        .catch((submitError) => {
          setError(
            submitError instanceof Error ? submitError.message : "Unable to save check-in.",
          );
        });
    });
  }

  return (
    <Card className="border-4 border-primary bg-brutal-yellow shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl font-black uppercase text-foreground">
          Daily Check-In
        </CardTitle>
        <p className="text-sm font-bold text-muted-foreground">
          One check-in per UTC day for overall health and happiness.
        </p>
        {currentCheckIn.healthRating !== null || currentCheckIn.happinessRating !== null ? (
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Today&apos;s entry: {currentCheckIn.date}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        {error ? <AlertCard className="mb-0" message={error} type="error" /> : null}
        {success ? <AlertCard className="mb-0" message={success} type="success" /> : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <p className="text-sm font-bold uppercase text-foreground">Overall Health</p>
            <AmountSelector
              activeColor="green"
              amounts={[1, 2, 3, 4, 5]}
              columns={5}
              formatPrefix=""
              value={healthRating}
              onChange={setHealthRating}
            />
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              1 rough, 5 excellent
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold uppercase text-foreground">Happiness</p>
            <AmountSelector
              activeColor="pink"
              amounts={[1, 2, 3, 4, 5]}
              columns={5}
              formatPrefix=""
              value={happinessRating}
              onChange={setHappinessRating}
            />
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              1 low, 5 high
            </p>
          </div>

          <FormField htmlFor="daily-check-in-note" label="Note">
            <Textarea
              id="daily-check-in-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Anything that might explain today."
            />
          </FormField>

          <Button className="font-black uppercase" disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Save Check-In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
