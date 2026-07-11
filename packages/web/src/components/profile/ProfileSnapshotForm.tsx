"use client";

import { useEffect, useState, useTransition } from "react";
import { API_ROUTES } from "@/lib/api-routes";
import { useWishPoints } from "@/components/wishes/WishPointProvider";
import { AlertCard } from "@/components/ui/alert-card";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import {
  ALCOHOL_FREQUENCY_OPTIONS,
  BIOLOGICAL_SEX_OPTIONS,
  CHRONIC_CONDITION_OPTIONS,
  CITIZENSHIP_STATUS_OPTIONS,
  DISABILITY_STATUS_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  HEALTH_INSURANCE_OPTIONS,
  HOUSING_STATUS_OPTIONS,
  INTERNET_ACCESS_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  SMOKING_STATUS_OPTIONS,
  type ProfilePageData,
  type ProfileSnapshotData,
} from "@/lib/profile";

interface ProfileSnapshotFormProps {
  onSaved: (data: ProfilePageData) => void;
  profile: ProfileSnapshotData;
}

function toFormState(profile: ProfileSnapshotData) {
  return {
    // Location
    timeZone: profile.timeZone ?? "",
    countryCode: profile.countryCode ?? "",
    regionCode: profile.regionCode ?? "",
    city: profile.city ?? "",
    postalCode: profile.postalCode ?? "",
    latitude: profile.latitude?.toString() ?? "",
    longitude: profile.longitude?.toString() ?? "",
    // Income & economic
    annualPersonalIncomeUsd: profile.annualPersonalIncomeUsd?.toString() ?? "",
    annualHouseholdIncomeUsd: profile.annualHouseholdIncomeUsd?.toString() ?? "",
    annualTaxesPaidUsd: profile.annualTaxesPaidUsd?.toString() ?? "",
    monthlyHousingCostUsd: profile.monthlyHousingCostUsd?.toString() ?? "",
    householdSize: profile.householdSize?.toString() ?? "",
    housingStatus: profile.housingStatus ?? "",
    hoursWorkedPerWeek: profile.hoursWorkedPerWeek?.toString() ?? "",
    industryOrSector: profile.industryOrSector ?? "",
    // Demographics
    birthYear: profile.birthYear?.toString() ?? "",
    biologicalSex: profile.biologicalSex ?? "",
    ethnicityOrRace: profile.ethnicityOrRace ?? "",
    maritalStatus: profile.maritalStatus ?? "",
    numberOfDependents: profile.numberOfDependents?.toString() ?? "",
    primaryLanguage: profile.primaryLanguage ?? "",
    educationLevel: profile.educationLevel ?? "",
    employmentStatus: profile.employmentStatus ?? "",
    genderIdentity: profile.genderIdentity ?? "",
    citizenshipStatus: profile.citizenshipStatus ?? "",
    // Health / HALE
    healthInsuranceType: profile.healthInsuranceType ?? "",
    chronicConditionCount: profile.chronicConditionCount?.toString() ?? "",
    disabilityStatus: profile.disabilityStatus ?? "",
    smokingStatus: profile.smokingStatus ?? "",
    alcoholFrequency: profile.alcoholFrequency ?? "",
    heightCm: profile.heightCm?.toString() ?? "",
    // Access
    internetAccessType: profile.internetAccessType ?? "",
    // Skills & tasks
    skillTags: profile.skillTags.join(", "),
    interestTags: profile.interestTags.join(", "),
    availableHoursPerWeek: profile.availableHoursPerWeek?.toString() ?? "",
    // Notes
    censusNotes: profile.censusNotes ?? "",
  };
}

const selectClassName =
  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]";

function SelectField({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: readonly { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField htmlFor={id} label={label}>
      <select
        id={id}
        className={selectClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select one</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="col-span-full text-sm font-black uppercase tracking-[0.15em] text-foreground mt-4 first:mt-0">
      {children}
    </p>
  );
}

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

  function set(field: string) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormState((current) => ({ ...current, [field]: event.target.value }));
  }

  function setSelect(field: string) {
    return (value: string) =>
      setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(() => {
      void fetch(API_ROUTES.profile.root, {
        body: JSON.stringify({
          ...formState,
          interestTags: formState.interestTags,
          skillTags: formState.skillTags,
        }),
        headers: { "Content-Type": "application/json" },
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
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }

  return (
    <Card className="border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <Card.Header className="gap-3">
        <Card.Title className="text-2xl font-black uppercase text-foreground">
          Census Snapshot
        </Card.Title>
        <p className="text-sm font-bold text-muted-foreground">
          Everything the optimizer needs to compute after-tax income and health-adjusted life years. All fields optional.
        </p>
        {profile.censusUpdatedAt ? (
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Updated {new Date(profile.censusUpdatedAt).toLocaleString()}
          </p>
        ) : null}
      </Card.Header>
      <Card.Content className="space-y-4">
        {error ? <AlertCard className="mb-0" message={error} type="error" /> : null}
        {success ? <AlertCard className="mb-0" message={success} type="success" /> : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">

            {/* ── Location ── */}
            <SectionLabel>Location</SectionLabel>
            <FormField htmlFor="profile-country" label="Country">
              <Input id="profile-country" value={formState.countryCode} onChange={set("countryCode")} placeholder="US" />
            </FormField>
            <FormField htmlFor="profile-region" label="State / Region">
              <Input id="profile-region" value={formState.regionCode} onChange={set("regionCode")} placeholder="US-TX" />
            </FormField>
            <FormField htmlFor="profile-city" label="City">
              <Input id="profile-city" value={formState.city} onChange={set("city")} />
            </FormField>
            <FormField htmlFor="profile-postal-code" label="Postal Code">
              <Input id="profile-postal-code" value={formState.postalCode} onChange={set("postalCode")} />
            </FormField>
            <FormField htmlFor="profile-time-zone" label="Time Zone">
              <Input id="profile-time-zone" value={formState.timeZone} onChange={set("timeZone")} placeholder="America/Chicago" />
            </FormField>
            <FormField htmlFor="profile-latitude" label="Latitude">
              <Input id="profile-latitude" inputMode="decimal" step="0.000001" type="number" value={formState.latitude} onChange={set("latitude")} />
            </FormField>
            <FormField htmlFor="profile-longitude" label="Longitude">
              <Input id="profile-longitude" inputMode="decimal" step="0.000001" type="number" value={formState.longitude} onChange={set("longitude")} />
            </FormField>

            {/* ── Income & Taxes ── */}
            <SectionLabel>Income &amp; Taxes</SectionLabel>
            <FormField htmlFor="profile-personal-income" label="Your Annual Income (USD)">
              <Input id="profile-personal-income" inputMode="numeric" min={0} step="1" type="number" value={formState.annualPersonalIncomeUsd} onChange={set("annualPersonalIncomeUsd")} placeholder="Before taxes (gross income)" />
            </FormField>
            <FormField htmlFor="profile-taxes" label="Annual Taxes Paid (USD)">
              <Input id="profile-taxes" inputMode="numeric" min={0} step="1" type="number" value={formState.annualTaxesPaidUsd} onChange={set("annualTaxesPaidUsd")} placeholder="Federal + state + local" />
            </FormField>
            <FormField htmlFor="profile-income" label="Household Income (USD, optional)">
              <Input id="profile-income" inputMode="numeric" min={0} step="1" type="number" value={formState.annualHouseholdIncomeUsd} onChange={set("annualHouseholdIncomeUsd")} />
            </FormField>
            <FormField htmlFor="profile-household-size" label="Household Size">
              <Input id="profile-household-size" inputMode="numeric" min={1} step="1" type="number" value={formState.householdSize} onChange={set("householdSize")} />
            </FormField>
            <FormField htmlFor="profile-housing-cost" label="Monthly Housing Cost (USD)">
              <Input id="profile-housing-cost" inputMode="numeric" min={0} step="1" type="number" value={formState.monthlyHousingCostUsd} onChange={set("monthlyHousingCostUsd")} placeholder="Rent or mortgage payment" />
            </FormField>
            <SelectField id="profile-housing-status" label="Housing Status" options={HOUSING_STATUS_OPTIONS} value={formState.housingStatus} onChange={setSelect("housingStatus")} />
            <FormField htmlFor="profile-hours-worked" label="Hours Worked / Week">
              <Input id="profile-hours-worked" inputMode="numeric" min={0} max={168} step="1" type="number" value={formState.hoursWorkedPerWeek} onChange={set("hoursWorkedPerWeek")} />
            </FormField>
            <FormField htmlFor="profile-industry" label="Industry / Sector">
              <Input id="profile-industry" value={formState.industryOrSector} onChange={set("industryOrSector")} placeholder="e.g. Healthcare, Tech, Education" />
            </FormField>

            {/* ── Demographics ── */}
            <SectionLabel>Demographics</SectionLabel>
            <FormField htmlFor="profile-birth-year" label="Birth Year">
              <Input id="profile-birth-year" inputMode="numeric" min={1900} step="1" type="number" value={formState.birthYear} onChange={set("birthYear")} />
            </FormField>
            <SelectField id="profile-biological-sex" label="Biological Sex" options={BIOLOGICAL_SEX_OPTIONS} value={formState.biologicalSex} onChange={setSelect("biologicalSex")} />
            <FormField htmlFor="profile-gender-identity" label="Gender Identity">
              <Input id="profile-gender-identity" value={formState.genderIdentity} onChange={set("genderIdentity")} />
            </FormField>
            <FormField htmlFor="profile-ethnicity" label="Ethnicity / Race">
              <Input id="profile-ethnicity" value={formState.ethnicityOrRace} onChange={set("ethnicityOrRace")} />
            </FormField>
            <SelectField id="profile-marital-status" label="Marital Status" options={MARITAL_STATUS_OPTIONS} value={formState.maritalStatus} onChange={setSelect("maritalStatus")} />
            <FormField htmlFor="profile-dependents" label="Number of Dependents">
              <Input id="profile-dependents" inputMode="numeric" min={0} step="1" type="number" value={formState.numberOfDependents} onChange={set("numberOfDependents")} />
            </FormField>
            <FormField htmlFor="profile-language" label="Primary Language">
              <Input id="profile-language" value={formState.primaryLanguage} onChange={set("primaryLanguage")} placeholder="en, es, zh, etc." />
            </FormField>
            <SelectField id="profile-education-level" label="Education" options={EDUCATION_LEVEL_OPTIONS} value={formState.educationLevel} onChange={setSelect("educationLevel")} />
            <SelectField id="profile-employment-status" label="Employment" options={EMPLOYMENT_STATUS_OPTIONS} value={formState.employmentStatus} onChange={setSelect("employmentStatus")} />
            <SelectField id="profile-citizenship" label="Citizenship Status" options={CITIZENSHIP_STATUS_OPTIONS} value={formState.citizenshipStatus} onChange={setSelect("citizenshipStatus")} />

            {/* ── Health / HALE ── */}
            <SectionLabel>Health</SectionLabel>
            <SelectField id="profile-insurance" label="Health Insurance" options={HEALTH_INSURANCE_OPTIONS} value={formState.healthInsuranceType} onChange={setSelect("healthInsuranceType")} />
            <SelectField id="profile-chronic" label="Chronic Conditions" options={CHRONIC_CONDITION_OPTIONS} value={formState.chronicConditionCount} onChange={setSelect("chronicConditionCount")} />
            <SelectField id="profile-disability" label="Disability Status" options={DISABILITY_STATUS_OPTIONS} value={formState.disabilityStatus} onChange={setSelect("disabilityStatus")} />
            <SelectField id="profile-smoking" label="Smoking Status" options={SMOKING_STATUS_OPTIONS} value={formState.smokingStatus} onChange={setSelect("smokingStatus")} />
            <SelectField id="profile-alcohol" label="Alcohol Frequency" options={ALCOHOL_FREQUENCY_OPTIONS} value={formState.alcoholFrequency} onChange={setSelect("alcoholFrequency")} />
            <FormField htmlFor="profile-height" label="Height (cm)">
              <Input id="profile-height" inputMode="decimal" min={30} max={300} step="0.1" type="number" value={formState.heightCm} onChange={set("heightCm")} />
            </FormField>

            {/* ── Access ── */}
            <SectionLabel>Access</SectionLabel>
            <SelectField id="profile-internet" label="Internet Access" options={INTERNET_ACCESS_OPTIONS} value={formState.internetAccessType} onChange={setSelect("internetAccessType")} />

            {/* ── Skills & Tasks ── */}
            <SectionLabel>Skills &amp; Tasks</SectionLabel>
            <FormField htmlFor="profile-skill-tags" label="Skills">
              <Input
                id="profile-skill-tags"
                value={formState.skillTags}
                onChange={set("skillTags")}
                placeholder="writing, react, organizing, spanish"
              />
            </FormField>
            <FormField htmlFor="profile-interest-tags" label="Interests">
              <Input
                id="profile-interest-tags"
                value={formState.interestTags}
                onChange={set("interestTags")}
                placeholder="clinical-trials, treaty, transparency"
              />
            </FormField>
            <FormField htmlFor="profile-available-hours" label="Available Hours / Week">
              <Input
                id="profile-available-hours"
                inputMode="numeric"
                min={0}
                max={168}
                step="1"
                type="number"
                value={formState.availableHoursPerWeek}
                onChange={set("availableHoursPerWeek")}
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
              onChange={set("censusNotes")}
              placeholder="Anything else you want attached to your census snapshot."
            />
          </FormField>

          <Button className="font-black uppercase" disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Save Snapshot"}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
