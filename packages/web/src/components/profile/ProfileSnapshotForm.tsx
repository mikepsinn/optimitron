"use client";

import { useEffect, useState, useTransition } from "react";
import { API_ROUTES } from "@/lib/api-routes";
import { useWishPoints } from "@/components/wishes/WishPointProvider";
import { AlertCard } from "@/components/ui/alert-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EDUCATION_LEVEL_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  type ProfilePageData,
  type ProfileSnapshotData,
} from "@/lib/profile";

interface ProfileSnapshotFormProps {
  onSaved: (data: ProfilePageData) => void;
  profile: ProfileSnapshotData;
}

function toFormState(profile: ProfileSnapshotData) {
  return {
    annualHouseholdIncomeUsd: profile.annualHouseholdIncomeUsd?.toString() ?? "",
    birthYear: profile.birthYear?.toString() ?? "",
    censusNotes: profile.censusNotes ?? "",
    city: profile.city ?? "",
    countryCode: profile.countryCode ?? "",
    educationLevel: profile.educationLevel ?? "",
    employmentStatus: profile.employmentStatus ?? "",
    genderIdentity: profile.genderIdentity ?? "",
    householdSize: profile.householdSize?.toString() ?? "",
    latitude: profile.latitude?.toString() ?? "",
    longitude: profile.longitude?.toString() ?? "",
    postalCode: profile.postalCode ?? "",
    regionCode: profile.regionCode ?? "",
    timeZone: profile.timeZone ?? "",
  };
}

const selectClassName =
  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]";

export function ProfileSnapshotForm({ onSaved, profile }: ProfileSnapshotFormProps) {
  const [formState, setFormState] = useState(() => toFormState(profile));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showWishReward } = useWishPoints();

  useEffect(() => {
    setFormState(toFormState(profile));
  }, [profile]);

  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browserTimeZone || profile.timeZone) {
      return;
    }

    setFormState((current) => ({
      ...current,
      timeZone: current.timeZone || browserTimeZone,
    }));
  }, [profile.timeZone]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(() => {
      void fetch(API_ROUTES.profile.root, {
        body: JSON.stringify({
          annualHouseholdIncomeUsd: formState.annualHouseholdIncomeUsd,
          birthYear: formState.birthYear,
          censusNotes: formState.censusNotes,
          city: formState.city,
          countryCode: formState.countryCode,
          educationLevel: formState.educationLevel,
          employmentStatus: formState.employmentStatus,
          genderIdentity: formState.genderIdentity,
          householdSize: formState.householdSize,
          latitude: formState.latitude,
          longitude: formState.longitude,
          postalCode: formState.postalCode,
          regionCode: formState.regionCode,
          timeZone: formState.timeZone,
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
            throw new Error(payload?.error ?? "Unable to save census profile.");
          }

          onSaved(payload.data);
          setSuccess("Saved.");

          if (payload.wishesEarned) {
            try { showWishReward(payload.wishesEarned, "Census Data"); } catch { /* noop */ }
          }
        })
        .catch((submitError) => {
          setError(
            submitError instanceof Error
              ? submitError.message
              : "Unable to save census profile.",
          );
        });
    });
  }

  function handleUseCurrentLocation() {
    setError(null);
    setSuccess(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormState((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
      },
      () => {
        setError("Unable to read your current location.");
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 10000,
      },
    );
  }

  return (
    <Card className="border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl font-black uppercase text-foreground">
          Census Snapshot
        </CardTitle>
        <p className="text-sm font-bold text-muted-foreground">
          Income is saved as annual household income in USD.
        </p>
        {profile.censusUpdatedAt ? (
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Updated {new Date(profile.censusUpdatedAt).toLocaleString()}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <AlertCard className="mb-0" message={error} type="error" /> : null}
        {success ? <AlertCard className="mb-0" message={success} type="success" /> : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField htmlFor="profile-country" label="Country">
              <Input
                id="profile-country"
                value={formState.countryCode}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, countryCode: event.target.value }))
                }
                placeholder="US"
              />
            </FormField>
            <FormField htmlFor="profile-region" label="State / Region">
              <Input
                id="profile-region"
                value={formState.regionCode}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, regionCode: event.target.value }))
                }
                placeholder="US-TX"
              />
            </FormField>
            <FormField htmlFor="profile-city" label="City">
              <Input
                id="profile-city"
                value={formState.city}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, city: event.target.value }))
                }
              />
            </FormField>
            <FormField htmlFor="profile-postal-code" label="Postal Code">
              <Input
                id="profile-postal-code"
                value={formState.postalCode}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, postalCode: event.target.value }))
                }
              />
            </FormField>
            <FormField htmlFor="profile-time-zone" label="Time Zone">
              <Input
                id="profile-time-zone"
                value={formState.timeZone}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, timeZone: event.target.value }))
                }
                placeholder="America/Chicago"
              />
            </FormField>
            <FormField htmlFor="profile-income" label="Annual Household Income (USD)">
              <Input
                id="profile-income"
                inputMode="numeric"
                min={0}
                step="1"
                type="number"
                value={formState.annualHouseholdIncomeUsd}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    annualHouseholdIncomeUsd: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField htmlFor="profile-household-size" label="Household Size">
              <Input
                id="profile-household-size"
                inputMode="numeric"
                min={1}
                step="1"
                type="number"
                value={formState.householdSize}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, householdSize: event.target.value }))
                }
              />
            </FormField>
            <FormField htmlFor="profile-birth-year" label="Birth Year">
              <Input
                id="profile-birth-year"
                inputMode="numeric"
                min={1900}
                step="1"
                type="number"
                value={formState.birthYear}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, birthYear: event.target.value }))
                }
              />
            </FormField>
            <FormField htmlFor="profile-education-level" label="Education">
              <select
                id="profile-education-level"
                className={selectClassName}
                value={formState.educationLevel}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    educationLevel: event.target.value,
                  }))
                }
              >
                <option value="">Select one</option>
                {EDUCATION_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField htmlFor="profile-employment-status" label="Employment">
              <select
                id="profile-employment-status"
                className={selectClassName}
                value={formState.employmentStatus}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    employmentStatus: event.target.value,
                  }))
                }
              >
                <option value="">Select one</option>
                {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField htmlFor="profile-gender-identity" label="Gender Identity">
              <Input
                id="profile-gender-identity"
                value={formState.genderIdentity}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    genderIdentity: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField htmlFor="profile-latitude" label="Latitude">
              <Input
                id="profile-latitude"
                inputMode="decimal"
                step="0.000001"
                type="number"
                value={formState.latitude}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, latitude: event.target.value }))
                }
              />
            </FormField>
            <FormField htmlFor="profile-longitude" label="Longitude">
              <Input
                id="profile-longitude"
                inputMode="decimal"
                step="0.000001"
                type="number"
                value={formState.longitude}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, longitude: event.target.value }))
                }
              />
            </FormField>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="font-black uppercase"
              disabled={isPending}
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
            >
              Use Current Location
            </Button>
            {profile.lastIncomeReportedAt ? (
              <p className="self-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Income tracked {new Date(profile.lastIncomeReportedAt).toLocaleDateString()}
              </p>
            ) : null}
          </div>

          <FormField htmlFor="profile-census-notes" label="Other Census Notes">
            <Textarea
              id="profile-census-notes"
              value={formState.censusNotes}
              onChange={(event) =>
                setFormState((current) => ({ ...current, censusNotes: event.target.value }))
              }
              placeholder="Anything else you want attached to your census snapshot."
            />
          </FormField>

          <Button className="font-black uppercase" disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Save Snapshot"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
