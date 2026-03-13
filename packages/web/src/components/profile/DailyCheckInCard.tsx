"use client";

import { useEffect, useState, useTransition } from "react";
import { API_ROUTES } from "@/lib/api-routes";
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
            | { data?: ProfilePageData; error?: string }
            | null;

          if (!response.ok || !payload?.data) {
            throw new Error(payload?.error ?? "Unable to save check-in.");
          }

          onSaved(payload.data);
          setSuccess("Saved.");
        })
        .catch((submitError) => {
          setError(
            submitError instanceof Error ? submitError.message : "Unable to save check-in.",
          );
        });
    });
  }

  return (
    <Card className="border-4 border-black bg-yellow-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl font-black uppercase text-black">
          Daily Check-In
        </CardTitle>
        <p className="text-sm font-medium text-black/60">
          One check-in per UTC day for overall health and happiness.
        </p>
        {currentCheckIn.healthRating !== null || currentCheckIn.happinessRating !== null ? (
          <p className="text-xs font-bold uppercase tracking-wide text-black/50">
            Today&apos;s entry: {currentCheckIn.date}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        {error ? <AlertCard className="mb-0" message={error} type="error" /> : null}
        {success ? <AlertCard className="mb-0" message={success} type="success" /> : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <p className="text-sm font-bold uppercase text-black">Overall Health</p>
            <AmountSelector
              activeColor="green"
              amounts={[1, 2, 3, 4, 5]}
              columns={5}
              formatPrefix=""
              value={healthRating}
              onChange={setHealthRating}
            />
            <p className="text-xs font-bold uppercase tracking-wide text-black/50">
              1 rough, 5 excellent
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold uppercase text-black">Happiness</p>
            <AmountSelector
              activeColor="pink"
              amounts={[1, 2, 3, 4, 5]}
              columns={5}
              formatPrefix=""
              value={happinessRating}
              onChange={setHappinessRating}
            />
            <p className="text-xs font-bold uppercase tracking-wide text-black/50">
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
