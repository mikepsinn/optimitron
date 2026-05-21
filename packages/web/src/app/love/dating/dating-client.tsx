"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Send, Shield, X } from "lucide-react";
import { getUserDisplayName } from "@/lib/user-display";

type DatingProfileStatus =
  | "ACTIVE"
  | "BANNED"
  | "DRAFT"
  | "HIDDEN"
  | "MODERATION_HOLD"
  | "PAUSED";

interface Photo {
  id: string;
  imageUrl: string;
  altText: string | null;
  status: string;
}

interface Profile {
  id: string;
  bio: string | null;
  campaignDateIdeas: string[];
  displayCity: string | null;
  displayCountryCode: string | null;
  displayRegionCode: string | null;
  headline: string | null;
  lookingForText: string | null;
  photos?: Photo[];
  relationshipIntents: string[];
  status: DatingProfileStatus;
  wantsCampaignDates: boolean;
}

interface Question {
  id: string;
  text: string;
  answerOptions: unknown;
  allowMultiple: boolean;
  answers: Array<{
    answerValues: unknown;
    acceptableValues: unknown;
    importance: string;
  }>;
}

interface Candidate {
  id: string;
  headline: string | null;
  bio: string | null;
  displayCity: string | null;
  photos: Photo[];
  user: {
    id: string;
    email: string;
    person: {
      id: string;
      displayName: string;
      image: string | null;
    } | null;
  };
}

function optionList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function firstAnswerValue(question: Question) {
  const answer = question.answers[0]?.answerValues;
  return Array.isArray(answer) && typeof answer[0] === "string"
    ? answer[0]
    : "";
}

function fieldClassName() {
  return "w-full border-2 border-foreground bg-background px-3 py-2 text-base font-black text-foreground";
}

function buttonClassName(invert = true) {
  return invert
    ? "inline-flex items-center justify-center gap-2 border-2 border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
    : "inline-flex items-center justify-center gap-2 border-2 border-foreground bg-background px-4 py-2 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-60";
}

export function DatingProfileForm({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [lookingForText, setLookingForText] = useState(
    profile?.lookingForText ?? "",
  );
  const [displayCity, setDisplayCity] = useState(profile?.displayCity ?? "");
  const [displayRegionCode, setDisplayRegionCode] = useState(
    profile?.displayRegionCode ?? "",
  );
  const [displayCountryCode, setDisplayCountryCode] = useState(
    profile?.displayCountryCode ?? "US",
  );
  const [status, setStatus] = useState<DatingProfileStatus>(
    profile?.status ?? "ACTIVE",
  );
  const [wantsCampaignDates, setWantsCampaignDates] = useState(
    profile?.wantsCampaignDates ?? true,
  );
  const [campaignDateIdeas, setCampaignDateIdeas] = useState(
    profile?.campaignDateIdeas?.join("\n") ??
      "Coffee plus QR flyers\nWalk plus posters\nMuseum plus asking two friends to vote",
  );
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveProfile() {
    setIsSaving(true);
    setMessage(null);
    const response = await fetch("/api/dating/profile", {
      body: JSON.stringify({
        bio,
        campaignDateIdeas: campaignDateIdeas.split("\n"),
        displayCity,
        displayCountryCode,
        displayRegionCode,
        headline,
        lookingForText,
        relationshipIntents: ["DATES", "FRIENDS"],
        status,
        wantsCampaignDates,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    setIsSaving(false);
    setMessage(response.ok ? "Saved" : "Could not save");
    router.refresh();
  }

  async function addPhoto() {
    if (!photoUrl.trim()) return;
    setMessage(null);
    const response = await fetch("/api/dating/profile/photos", {
      body: JSON.stringify({ imageUrl: photoUrl.trim() }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setMessage(response.ok ? "Photo added for review" : "Could not add photo");
    if (response.ok) setPhotoUrl("");
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 border-2 border-foreground p-5">
        <label className="grid gap-2 text-sm font-black uppercase">
          Status
          <select
            className={fieldClassName()}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as DatingProfileStatus)
            }
          >
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="DRAFT">Draft</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black uppercase">
          Headline
          <input
            className={fieldClassName()}
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-black uppercase">
          Bio
          <textarea
            className={`${fieldClassName()} min-h-32`}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-black uppercase">
          Looking for
          <textarea
            className={`${fieldClassName()} min-h-24`}
            value={lookingForText}
            onChange={(event) => setLookingForText(event.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-2 text-sm font-black uppercase">
            City
            <input
              className={fieldClassName()}
              value={displayCity}
              onChange={(event) => setDisplayCity(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-black uppercase">
            Region
            <input
              className={fieldClassName()}
              value={displayRegionCode}
              onChange={(event) => setDisplayRegionCode(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-black uppercase">
            Country
            <input
              className={fieldClassName()}
              value={displayCountryCode}
              onChange={(event) => setDisplayCountryCode(event.target.value)}
            />
          </label>
        </div>
        <label className="flex items-start gap-3 text-sm font-black uppercase">
          <input
            checked={wantsCampaignDates}
            className="mt-1 h-5 w-5 accent-foreground"
            type="checkbox"
            onChange={(event) => setWantsCampaignDates(event.target.checked)}
          />
          I am open to Earth Optimization Dates.
        </label>
        <label className="grid gap-2 text-sm font-black uppercase">
          Earth Optimization Date ideas
          <textarea
            className={`${fieldClassName()} min-h-24`}
            value={campaignDateIdeas}
            onChange={(event) => setCampaignDateIdeas(event.target.value)}
          />
        </label>
        <button
          className={buttonClassName()}
          disabled={isSaving}
          type="button"
          onClick={() => {
            void saveProfile();
          }}
        >
          {isSaving ? "Saving" : "Save profile"}
        </button>
      </div>

      <div className="grid gap-4 border-2 border-foreground p-5">
        <h2 className="text-lg font-black uppercase">Photos</h2>
        {profile?.photos?.length ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {profile.photos.map((photo) => (
              <div className="border-2 border-foreground p-2" key={photo.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={photo.altText ?? "Earth Optimization Date profile photo"}
                  className="aspect-square w-full object-cover"
                  src={photo.imageUrl}
                />
                <p className="mt-2 text-xs font-black uppercase text-muted-foreground">
                  {photo.status.toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-bold text-muted-foreground">
            Add a photo URL for now. Upload and crop can come after the first
            humans try this.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            className={fieldClassName()}
            placeholder="https://..."
            value={photoUrl}
            onChange={(event) => setPhotoUrl(event.target.value)}
          />
          <button
            className={buttonClassName(false)}
            type="button"
            onClick={() => {
              void addPhoto();
            }}
          >
            Add photo
          </button>
        </div>
      </div>

      {message ? (
        <p className="text-sm font-black uppercase text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function DatingQuestionsClient({
  questions,
}: {
  questions: Question[];
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function saveAnswer(question: Question, answerValue: string) {
    setSavingId(question.id);
    await fetch(`/api/dating/questions/${question.id}/answer`, {
      body: JSON.stringify({
        acceptableValues: [answerValue],
        answerValues: [answerValue],
        importance: "SOMEWHAT",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    setSavingId(null);
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      {questions.map((question) => {
        const options = optionList(question.answerOptions);
        const currentAnswer = firstAnswerValue(question);

        return (
          <div className="border-2 border-foreground p-5" key={question.id}>
            <h2 className="text-lg font-black uppercase">{question.text}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <select
                className={fieldClassName()}
                defaultValue={currentAnswer}
                onChange={(event) => {
                  void saveAnswer(question, event.target.value);
                }}
              >
                <option value="">Choose</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="self-center text-xs font-black uppercase text-muted-foreground">
                {savingId === question.id
                  ? "Saving"
                  : currentAnswer
                    ? "Saved"
                    : "Open"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DatingDiscoverClient({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function interact(
    candidateId: string,
    kind: "LIKE" | "PASS" | "INTRO",
  ) {
    setBusyId(candidateId);
    await fetch("/api/dating/interactions", {
      body: JSON.stringify({
        introMessage:
          kind === "INTRO"
            ? "Want to get coffee and make a few strangers vote?"
            : undefined,
        kind,
        toProfileId: candidateId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      {candidates.map((candidate) => (
        <article className="border-2 border-foreground p-5" key={candidate.id}>
          <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
            {candidate.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={
                  candidate.photos[0].altText ??
                  "Earth Optimization Date profile photo"
                }
                className="aspect-square w-full border-2 border-foreground object-cover"
                src={candidate.photos[0].imageUrl}
              />
            ) : (
              <div className="flex aspect-square items-center justify-center border-2 border-foreground text-3xl font-black">
                ?
              </div>
            )}
            <div>
              <h2 className="text-xl font-black uppercase">
                {getUserDisplayName(candidate.user)}
              </h2>
              {candidate.headline ? (
                <p className="mt-1 text-base font-black">
                  {candidate.headline}
                </p>
              ) : null}
              {candidate.displayCity ? (
                <p className="mt-1 text-sm font-bold text-muted-foreground">
                  {candidate.displayCity}
                </p>
              ) : null}
              {candidate.bio ? (
                <p className="mt-3 text-sm font-bold leading-relaxed text-muted-foreground">
                  {candidate.bio}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={buttonClassName(false)}
                  disabled={busyId === candidate.id}
                  type="button"
                  onClick={() => {
                    void interact(candidate.id, "PASS");
                  }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Pass
                </button>
                <button
                  className={buttonClassName()}
                  disabled={busyId === candidate.id}
                  type="button"
                  onClick={() => {
                    void interact(candidate.id, "LIKE");
                  }}
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  Like
                </button>
                <button
                  className={buttonClassName(false)}
                  disabled={busyId === candidate.id}
                  type="button"
                  onClick={() => {
                    void interact(candidate.id, "INTRO");
                  }}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Intro
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function DatingMessageComposer({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function sendMessage() {
    if (!body.trim()) return;
    setIsSending(true);
    const response = await fetch("/api/dating/messages", {
      body: JSON.stringify({ body, conversationId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setIsSending(false);
    if (response.ok) {
      setBody("");
      router.refresh();
    }
  }

  return (
    <div className="grid gap-3 border-2 border-foreground p-5">
      <textarea
        className={`${fieldClassName()} min-h-24`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <button
        className={buttonClassName()}
        disabled={isSending}
        type="button"
        onClick={() => {
          void sendMessage();
        }}
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {isSending ? "Sending" : "Send"}
      </button>
    </div>
  );
}

export function DatingDatePlanForm({
  conversationId,
  matchId,
}: {
  conversationId: string;
  matchId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("Coffee and QR posters");
  const [locationName, setLocationName] = useState("");
  const [campaignTaskId, setCampaignTaskId] = useState("");

  async function propose() {
    const response = await fetch("/api/dating/date-plans", {
      body: JSON.stringify({
        campaignTaskId: campaignTaskId || undefined,
        conversationId,
        isCampaignDate: true,
        locationName,
        matchId,
        title,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (response.ok) router.refresh();
  }

  return (
    <div className="grid gap-3 border-2 border-foreground p-5">
      <h2 className="text-lg font-black uppercase">Earth Optimization Date</h2>
      <input
        className={fieldClassName()}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <input
        className={fieldClassName()}
        placeholder="Place"
        value={locationName}
        onChange={(event) => setLocationName(event.target.value)}
      />
      <input
        className={fieldClassName()}
        placeholder="Optional campaign task id"
        value={campaignTaskId}
        onChange={(event) => setCampaignTaskId(event.target.value)}
      />
      <button
        className={buttonClassName(false)}
        type="button"
        onClick={() => {
          void propose();
        }}
      >
        Propose Earth Optimization Date
      </button>
    </div>
  );
}

export function DatingReportButton({
  messageId,
  reportedProfileId,
}: {
  messageId?: string;
  reportedProfileId?: string;
}) {
  async function report() {
    await fetch("/api/dating/reports", {
      body: JSON.stringify({
        messageId,
        reason: "Needs review",
        reportedProfileId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  }

  return (
    <button
      className={buttonClassName(false)}
      type="button"
      onClick={() => {
        void report();
      }}
    >
      <Shield className="h-4 w-4" aria-hidden="true" />
      Report
    </button>
  );
}
