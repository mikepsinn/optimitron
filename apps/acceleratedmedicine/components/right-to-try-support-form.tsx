"use client";

import { Check, Loader2, Mail, MapPin } from "lucide-react";
import { FormEvent, useState } from "react";

import { US_STATES } from "@/lib/right-to-try";

interface RightToTrySupportFormProps {
  initialState?: string;
}

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; sentConfirmation: boolean }
  | { status: "error"; message: string };

const inputClassName =
  "w-full rounded-none border-4 border-primary bg-background px-4 py-3 text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";

export function RightToTrySupportForm({
  initialState = "",
}: RightToTrySupportFormProps) {
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmission({ status: "submitting" });

    try {
      const response = await fetch("/api/right-to-try-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: formData.get("state"),
          position: formData.get("position"),
          role: formData.get("role"),
          email: formData.get("email"),
          story: formData.get("story"),
          updates: formData.get("updates") === "on",
          companyWebsite: formData.get("companyWebsite"),
        }),
      });
      const body = (await response.json()) as {
        error?: string;
        ok?: boolean;
        sentConfirmation?: boolean;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error || "We could not record this response.");
      }

      setSubmission({
        status: "success",
        sentConfirmation: body.sentConfirmation === true,
      });
    } catch (error) {
      setSubmission({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not record this response.",
      });
    }
  }

  if (submission.status === "success") {
    return (
      <div
        className="border-4 border-primary bg-brutal-green p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        role="status"
      >
        <Check className="mx-auto h-14 w-14" strokeWidth={4} />
        <h3 className="mt-3 text-3xl font-black uppercase">
          Your response is recorded.
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-lg font-bold">
          {submission.sentConfirmation
            ? "Check your inbox for a copy and the Montana and model-framework links."
            : "Thank you. Your state is now part of the Institute's education map."}
        </p>
      </div>
    );
  }

  return (
    <form
      className="border-4 border-primary bg-brutal-yellow p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <label className="block font-black uppercase">
          <span className="mb-2 flex items-center gap-2">
            <MapPin className="h-5 w-5" strokeWidth={3} /> Your state
          </span>
          <select
            className={inputClassName}
            defaultValue={initialState}
            name="state"
            required
          >
            <option value="" disabled>
              Choose a state
            </option>
            {US_STATES.map(([name, abbreviation]) => (
              <option key={abbreviation} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="block font-black uppercase">
          <span className="mb-2 block">Your role</span>
          <select className={inputClassName} name="role" required>
            <option value="patient-or-caregiver">Patient or caregiver</option>
            <option value="clinician">Clinician</option>
            <option value="researcher">Researcher</option>
            <option value="public-educator">Public educator or organizer</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <fieldset className="mt-7">
        <legend className="font-black uppercase">
          Should your state consider this model?
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["yes", "Yes"],
            ["unsure", "Show me more"],
            ["no", "No"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="cursor-pointer border-4 border-primary bg-background p-4 text-center text-lg font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] has-[:checked]:-translate-x-0.5 has-[:checked]:-translate-y-0.5 has-[:checked]:bg-brutal-cyan has-[:checked]:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <input
                className="mr-2 h-4 w-4 accent-black"
                defaultChecked={value === "yes"}
                name="position"
                type="radio"
                value={value}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-7 block font-black uppercase">
        Why does this matter to you? <span className="normal-case">(optional)</span>
        <textarea
          className={`${inputClassName} mt-2 min-h-32 resize-y`}
          maxLength={2000}
          name="story"
          placeholder="A sentence is enough."
        />
      </label>

      <label className="mt-7 block font-black uppercase">
        <span className="mb-2 flex items-center gap-2">
          <Mail className="h-5 w-5" strokeWidth={3} /> Email{" "}
          <span className="normal-case">(optional)</span>
        </span>
        <input
          autoComplete="email"
          className={inputClassName}
          name="email"
          placeholder="you@example.com"
          type="email"
        />
      </label>

      <label className="mt-5 flex cursor-pointer items-start gap-3 font-bold">
        <input
          className="mt-1 h-5 w-5 shrink-0 accent-black"
          name="updates"
          type="checkbox"
        />
        Send me occasional updates about Universal Right to Try education in my
        state.
      </label>

      <div aria-hidden="true" className="hidden">
        <input
          aria-label="Leave this field empty"
          autoComplete="off"
          name="companyWebsite"
          tabIndex={-1}
        />
      </div>

      <button
        className="mt-7 inline-flex w-full items-center justify-center gap-2 border-4 border-primary bg-brutal-pink px-6 py-4 text-xl font-black uppercase text-brutal-pink-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] disabled:cursor-wait disabled:opacity-70"
        disabled={submission.status === "submitting"}
        type="submit"
      >
        {submission.status === "submitting" ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" /> Recording
          </>
        ) : (
          "Record my state response"
        )}
      </button>

      <p className="mt-4 text-center text-sm font-bold">
        If you provide an email, we will send a confirmation. We will not sell
        or rent it.
      </p>

      {submission.status === "error" ? (
        <p
          className="mt-4 border-4 border-primary bg-brutal-red p-3 text-center font-black"
          role="alert"
        >
          {submission.message}
        </p>
      ) : null}
    </form>
  );
}
