"use client";

import {
  PersonCivilianStatus,
  PersonDeathCauseCategory,
  PersonLifeStatus,
  PersonMemorialEvidenceKind,
} from "@optimitron/db/enums";
import { Clipboard, Trash2, Upload, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Checkbox } from "@/components/retroui/Checkbox";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Textarea } from "@/components/retroui/Textarea";
import { copyTextToClipboard } from "@/lib/clipboard";
import { useRequestSiteOrigin } from "@/lib/request-site-origin";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { buildPeopleUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

const CONFLICT_CAUSE_CATEGORIES = new Set<PersonDeathCauseCategory>([
  PersonDeathCauseCategory.ARMED_CONFLICT,
  PersonDeathCauseCategory.STATE_VIOLENCE,
  PersonDeathCauseCategory.TERRORISM,
]);

const MAX_RESPONSIBLE_PARTIES = 5;

interface ConflictOption {
  id: string;
  name: string;
  slug: string;
}

interface JurisdictionOption {
  code: string;
  id: string;
  name: string;
}

interface ResponsiblePartyDraft {
  jurisdictionCode: string;
  name: string;
  roleSlug: string;
}

interface EvidenceDraft {
  description: string;
  evidenceKind: PersonMemorialEvidenceKind;
  sourceUrl: string;
  title: string;
}

const MAX_EVIDENCE_ITEMS = 8;

async function uploadFileViaPresign(input: {
  file: File;
  kind: "person-photo" | "memorial-evidence";
}): Promise<{ key: string; publicUrl: string }> {
  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: input.kind,
      contentType: input.file.type || "application/octet-stream",
      sizeBytes: input.file.size,
      filename: input.file.name,
    }),
  });
  if (!presignRes.ok) {
    const payload = (await presignRes.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(payload.error ?? "Could not start upload.");
  }
  const { uploadUrl, publicUrl, key } = (await presignRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
    key: string;
  };
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": input.file.type || "application/octet-stream" },
    body: input.file,
  });
  if (!putRes.ok) {
    throw new Error(`Upload failed (${putRes.status}).`);
  }
  return { key, publicUrl };
}

interface RepresentedPersonFormProps {
  className?: string;
  onCreated?: () => void;
  referendumSlug?: string;
  variant?: "panel" | "inline";
}

export function RepresentedPersonForm({
  className,
  onCreated,
  referendumSlug = TREATY_REFERENDUM_SLUG,
  variant = "panel",
}: RepresentedPersonFormProps) {
  const requestOrigin = useRequestSiteOrigin();
  const [displayName, setDisplayName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [lifeStatus, setLifeStatus] = useState<PersonLifeStatus>(
    PersonLifeStatus.LIVING,
  );
  const [birthDate, setBirthDate] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [conditionName, setConditionName] = useState("");
  const [causeCategory, setCauseCategory] = useState<PersonDeathCauseCategory>(
    PersonDeathCauseCategory.DISEASE,
  );
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [deathCountryCode, setDeathCountryCode] = useState("");
  const [conflictId, setConflictId] = useState("");
  const [conflictNameOverride, setConflictNameOverride] = useState("");
  const [civilianStatus, setCivilianStatus] = useState<PersonCivilianStatus>(
    PersonCivilianStatus.UNKNOWN,
  );
  const [wasChild, setWasChild] = useState<"unknown" | "yes" | "no">("unknown");
  const [circumstances, setCircumstances] = useState("");
  const [responsibleParties, setResponsibleParties] = useState<ResponsiblePartyDraft[]>([]);
  const [memorialEvidence, setMemorialEvidence] = useState<EvidenceDraft[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const [publicComment, setPublicComment] = useState("");
  const [memorialMessage, setMemorialMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [consentCourtEvidence, setConsentCourtEvidence] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [shareText, setShareText] = useState("");
  const [submittedDisplayName, setSubmittedDisplayName] = useState<string | null>(null);
  const [efficacyLagNotices, setEfficacyLagNotices] = useState<
    Array<{ explanation: string; interventionName: string }>
  >([]);
  const [conflictOptions, setConflictOptions] = useState<ConflictOption[]>([]);
  const [jurisdictionOptions, setJurisdictionOptions] = useState<JurisdictionOption[]>([]);

  const disabled = status === "saving";
  const isConflictCause = CONFLICT_CAUSE_CATEGORIES.has(causeCategory);
  const showConflictFields =
    lifeStatus === PersonLifeStatus.DECEASED && isConflictCause;

  // Load conflict + country options once. Both lists are small (<50 rows
  // total) so a single fetch on mount keeps the UI simple — typeahead can
  // come later if the list grows past a few dozen entries.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [conflictsRes, jurisdictionsRes] = await Promise.all([
          fetch("/api/conflicts/search?limit=50", { cache: "no-store" }),
          fetch("/api/jurisdictions/search?limit=50&type=COUNTRY", { cache: "no-store" }),
        ]);
        if (!cancelled && conflictsRes.ok) {
          const data = (await conflictsRes.json()) as { results: ConflictOption[] };
          setConflictOptions(data.results);
        }
        if (!cancelled && jurisdictionsRes.ok) {
          const data = (await jurisdictionsRes.json()) as { results: JurisdictionOption[] };
          setJurisdictionOptions(data.results);
        }
      } catch {
        // Best-effort load; the form still works with the free-text fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isPublic && memorialEvidence.length > 0) {
      setMemorialEvidence([]);
    }
  }, [isPublic, memorialEvidence.length]);

  function addResponsibleParty() {
    if (responsibleParties.length >= MAX_RESPONSIBLE_PARTIES) return;
    setResponsibleParties((prev) => [...prev, { jurisdictionCode: "", name: "", roleSlug: "" }]);
  }

  function updateResponsibleParty(index: number, patch: Partial<ResponsiblePartyDraft>) {
    setResponsibleParties((prev) =>
      prev.map((party, i) => (i === index ? { ...party, ...patch } : party)),
    );
  }

  function removeResponsibleParty(index: number) {
    setResponsibleParties((prev) => prev.filter((_, i) => i !== index));
  }

  async function handlePhotoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const { publicUrl } = await uploadFileViaPresign({ file, kind: "person-photo" });
      setImageUrl(publicUrl);
    } catch (caught) {
      setPhotoError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function handleEvidenceSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (memorialEvidence.length >= MAX_EVIDENCE_ITEMS) return;
    setEvidenceError(null);
    setEvidenceUploading(true);
    try {
      const { publicUrl } = await uploadFileViaPresign({ file, kind: "memorial-evidence" });
      const evidenceKind = file.type.startsWith("image/")
        ? PersonMemorialEvidenceKind.PHOTO
        : file.type === "application/pdf"
          ? PersonMemorialEvidenceKind.DOCUMENT
          : PersonMemorialEvidenceKind.OTHER;
      setMemorialEvidence((prev) => [
        ...prev,
        {
          description: "",
          evidenceKind,
          sourceUrl: publicUrl,
          title: file.name,
        },
      ]);
    } catch (caught) {
      setEvidenceError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setEvidenceUploading(false);
      if (evidenceInputRef.current) evidenceInputRef.current.value = "";
    }
  }

  function updateEvidence(index: number, patch: Partial<EvidenceDraft>) {
    setMemorialEvidence((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function removeEvidence(index: number) {
    setMemorialEvidence((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    setStatus("saving");
    setError(null);
    setShareText("");
    setSubmittedDisplayName(null);
    setEfficacyLagNotices([]);

    try {
      const res = await fetch(`/api/referendums/${referendumSlug}/represented-people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate,
          causeCategory,
          circumstances: showConflictFields ? circumstances : "",
          civilianStatus: showConflictFields ? civilianStatus : PersonCivilianStatus.UNKNOWN,
          conditionName,
          conflictId: showConflictFields ? conflictId : "",
          conflictNameOverride: showConflictFields ? conflictNameOverride : "",
          consentCourtEvidence,
          dateOfDeath,
          deathCountryCode,
          displayName,
          imageUrl,
          isPublic,
          lifeStatus,
          memorialEvidence: lifeStatus === PersonLifeStatus.DECEASED ? memorialEvidence : [],
          memorialMessage,
          publicComment,
          relationshipType,
          responsibleParties: responsibleParties
            .map((party) => ({
              jurisdictionCode: party.jurisdictionCode || null,
              name: party.name,
              roleSlug: party.roleSlug,
            }))
            .filter((party) => party.jurisdictionCode || party.name),
          wasChild:
            showConflictFields && wasChild !== "unknown" ? wasChild === "yes" : null,
        }),
      });
      const payload = (await res.json()) as {
        efficacyLagMatches?: Array<{ explanation: string; interventionName: string }>;
        error?: string;
        person?: { displayName?: string; lifeStatus?: PersonLifeStatus };
      };
      if (!res.ok) {
        throw new Error(payload.error ?? "Could not add this person.");
      }
      setEfficacyLagNotices(payload.efficacyLagMatches ?? []);

      const personName = payload.person?.displayName ?? displayName.trim();
      const condition = conditionName.trim();
      const peopleUrl = buildPeopleUrl(requestOrigin);
      const isDeceased = lifeStatus === PersonLifeStatus.DECEASED;
      const ghost = isDeceased ? "👻 " : "";
      const text = isDeceased
        ? [
            `${ghost}${personName} died${condition ? ` of ${condition}` : ""}.`,
            publicComment.trim() || null,
            "They are one of millions the system left behind. They have a page now.",
            peopleUrl,
          ]
            .filter(Boolean)
            .join(" ")
        : [
            `I voted for ${personName}.`,
            condition ? `${personName} is on the board because of ${condition}.` : null,
            publicComment.trim() || null,
            "This is not an election. It is a receipt.",
            peopleUrl,
          ]
            .filter(Boolean)
            .join(" ");

      setShareText(text);
      setSubmittedDisplayName(personName || "them");
      setStatus("saved");
      setDisplayName("");
      setImageUrl("");
      setBirthDate("");
      setRelationshipType("");
      setConditionName("");
      setDateOfDeath("");
      setDeathCountryCode("");
      setResponsibleParties([]);
      setConflictId("");
      setConflictNameOverride("");
      setCivilianStatus(PersonCivilianStatus.UNKNOWN);
      setWasChild("unknown");
      setCircumstances("");
      setMemorialEvidence([]);
      setPhotoError(null);
      setEvidenceError(null);
      setPublicComment("");
      setMemorialMessage("");
      setConsentCourtEvidence(false);
      onCreated?.();
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Could not add this person.");
    }
  }

  const shellClass =
    variant === "panel"
      ? "border border-border bg-card p-5 text-card-foreground sm:p-6"
      : "border-t border-border pt-5";

  return (
    <div className={cn(shellClass, className)}>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-[0.08em]">
            Drag someone to the polls
          </h2>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Add someone the budget failed. Official votes stay official. This part is for receipts.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase" htmlFor="represented-name">
              Name
            </Label>
            <Input
              className="border-border bg-background font-bold"
              disabled={disabled}
              id="represented-name"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Grandma Kay"
              value={displayName}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase" htmlFor="represented-life-status">
              Status
            </Label>
            <select
              className="min-h-12 w-full border border-border bg-background px-3 font-bold text-foreground"
              disabled={disabled}
              id="represented-life-status"
              onChange={(event) =>
                setLifeStatus(event.target.value as PersonLifeStatus)
              }
              value={lifeStatus}
            >
              <option value={PersonLifeStatus.LIVING}>Living</option>
              <option value={PersonLifeStatus.DECEASED}>No longer alive</option>
              <option value={PersonLifeStatus.UNKNOWN}>Status unknown</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase" htmlFor="represented-birth-date">
              Birth date optional
            </Label>
            <Input
              className="border-border bg-background font-bold"
              disabled={disabled}
              id="represented-birth-date"
              onChange={(event) => setBirthDate(event.target.value)}
              type="date"
              value={birthDate}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase" htmlFor="represented-photo-input">
              Photo optional
            </Label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Selected portrait preview"
                  className="h-14 w-14 shrink-0 border border-border object-cover"
                  src={imageUrl}
                />
              ) : null}
              <input
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={disabled || photoUploading}
                id="represented-photo-input"
                onChange={(event) => void handlePhotoSelected(event)}
                ref={photoInputRef}
                type="file"
              />
              <Button
                className="min-h-11 border border-border bg-background px-3 text-xs font-black uppercase tracking-[0.14em] text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-muted"
                disabled={disabled || photoUploading}
                onClick={() => photoInputRef.current?.click()}
                type="button"
              >
                <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                {photoUploading ? "Uploading…" : imageUrl ? "Replace photo" : "Upload photo"}
              </Button>
              {imageUrl ? (
                <Button
                  aria-label="Clear photo"
                  className="min-h-11 border border-border bg-background px-3 text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-muted"
                  disabled={disabled || photoUploading}
                  onClick={() => setImageUrl("")}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
            <p className="text-xs font-bold text-muted-foreground">
              Faces are what make this work. JPEG/PNG/WebP/GIF, up to 5 MB.
            </p>
            {photoError ? (
              <p className="text-xs font-black text-destructive">{photoError}</p>
            ) : null}
          </div>
        </div>

        {lifeStatus === PersonLifeStatus.DECEASED ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase" htmlFor="represented-date-of-death">
                Date of death
              </Label>
              <Input
                className="border-border bg-background font-bold"
                disabled={disabled}
                id="represented-date-of-death"
                onChange={(event) => setDateOfDeath(event.target.value)}
                type="date"
                value={dateOfDeath}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase" htmlFor="represented-country">
                Country of death
              </Label>
              <Input
                className="border-border bg-background font-bold uppercase"
                disabled={disabled}
                id="represented-country"
                maxLength={2}
                onChange={(event) => setDeathCountryCode(event.target.value.toUpperCase())}
                placeholder="US"
                value={deathCountryCode}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase" htmlFor="represented-cause-kind">
                Cause kind
              </Label>
              <select
                className="min-h-12 w-full border border-border bg-background px-3 font-bold text-foreground"
                disabled={disabled}
                id="represented-cause-kind"
                onChange={(event) =>
                  setCauseCategory(event.target.value as PersonDeathCauseCategory)
                }
                value={causeCategory}
              >
                <option value={PersonDeathCauseCategory.DISEASE}>Disease</option>
                <option value={PersonDeathCauseCategory.ARMED_CONFLICT}>
                  Armed conflict
                </option>
                <option value={PersonDeathCauseCategory.STATE_VIOLENCE}>
                  State violence
                </option>
                <option value={PersonDeathCauseCategory.TERRORISM}>Terrorism</option>
                <option value={PersonDeathCauseCategory.OTHER_PREVENTABLE}>
                  Other preventable
                </option>
                <option value={PersonDeathCauseCategory.OTHER}>Other</option>
                <option value={PersonDeathCauseCategory.UNKNOWN}>Unknown</option>
              </select>
            </div>
          </div>
        ) : null}

        {showConflictFields ? (
          <div className="space-y-4 border border-dashed border-border p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
              Conflict details
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase" htmlFor="represented-conflict">
                  Specific conflict
                </Label>
                <select
                  className="min-h-12 w-full border border-border bg-background px-3 font-bold text-foreground"
                  disabled={disabled}
                  id="represented-conflict"
                  onChange={(event) => {
                    setConflictId(event.target.value);
                    if (event.target.value) setConflictNameOverride("");
                  }}
                  value={conflictId}
                >
                  <option value="">Select or "Other"</option>
                  {conflictOptions.map((conflict) => (
                    <option key={conflict.id} value={conflict.id}>
                      {conflict.name}
                    </option>
                  ))}
                </select>
                {!conflictId ? (
                  <Input
                    className="mt-2 border-border bg-background font-bold"
                    disabled={disabled}
                    onChange={(event) => setConflictNameOverride(event.target.value)}
                    placeholder="Or name the conflict"
                    value={conflictNameOverride}
                  />
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase" htmlFor="represented-civilian-status">
                  Civilian status
                </Label>
                <select
                  className="min-h-12 w-full border border-border bg-background px-3 font-bold text-foreground"
                  disabled={disabled}
                  id="represented-civilian-status"
                  onChange={(event) =>
                    setCivilianStatus(event.target.value as PersonCivilianStatus)
                  }
                  value={civilianStatus}
                >
                  <option value={PersonCivilianStatus.UNKNOWN}>Unknown</option>
                  <option value={PersonCivilianStatus.CIVILIAN}>Civilian</option>
                  <option value={PersonCivilianStatus.COMBATANT}>Combatant</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase">
                Were they a child?
              </Label>
              <div className="flex gap-3">
                {(["unknown", "yes", "no"] as const).map((value) => (
                  <label
                    className="flex items-center gap-2 text-sm font-bold"
                    key={value}
                  >
                    <input
                      checked={wasChild === value}
                      className="h-4 w-4"
                      disabled={disabled}
                      name="represented-was-child"
                      onChange={() => setWasChild(value)}
                      type="radio"
                      value={value}
                    />
                    {value === "unknown"
                      ? "Unknown"
                      : value === "yes"
                        ? "Yes"
                        : "No"}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase" htmlFor="represented-circumstances">
                What happened?
              </Label>
              <Textarea
                className="min-h-24 border-border bg-background font-bold"
                disabled={disabled}
                id="represented-circumstances"
                maxLength={1000}
                onChange={(event) => setCircumstances(event.target.value)}
                placeholder="Brief, factual description. Names of witnesses can go here too."
                value={circumstances}
              />
              <p className="text-xs font-bold text-muted-foreground">
                Up to 1000 characters. Used in the future Court of Humanity evidence package.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label className="text-xs font-black uppercase">
                  Supporting documentation optional
                </Label>
                <p className="text-xs font-bold text-muted-foreground">
                  Up to {MAX_EVIDENCE_ITEMS}.
                </p>
              </div>
              {memorialEvidence.length > 0 ? (
                <ul className="space-y-2">
                  {memorialEvidence.map((evidence, index) => (
                    <li
                      className="grid gap-2 border border-border bg-background p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-start"
                      key={`${evidence.sourceUrl}-${index}`}
                    >
                      <div className="space-y-1">
                        <p className="font-black uppercase tracking-[0.14em]">
                          {evidence.title || "Untitled evidence"}
                        </p>
                        <select
                          className="min-h-9 w-full border border-border bg-background px-2 text-xs font-bold text-foreground"
                          disabled={disabled}
                          onChange={(event) =>
                            updateEvidence(index, {
                              evidenceKind: event.target.value as PersonMemorialEvidenceKind,
                            })
                          }
                          value={evidence.evidenceKind}
                        >
                          <option value={PersonMemorialEvidenceKind.PHOTO}>Photo</option>
                          <option value={PersonMemorialEvidenceKind.DOCUMENT}>Document</option>
                          <option value={PersonMemorialEvidenceKind.NEWS_ARTICLE}>News article</option>
                          <option value={PersonMemorialEvidenceKind.HOSPITAL_RECORD}>Hospital record</option>
                          <option value={PersonMemorialEvidenceKind.DEATH_RECORD}>Death record</option>
                          <option value={PersonMemorialEvidenceKind.WITNESS_STATEMENT}>Witness statement</option>
                          <option value={PersonMemorialEvidenceKind.OTHER}>Other</option>
                        </select>
                        <Input
                          className="border-border bg-background font-bold"
                          disabled={disabled}
                          onChange={(event) =>
                            updateEvidence(index, { description: event.target.value })
                          }
                          placeholder="Short description (optional)"
                          value={evidence.description}
                        />
                        <a
                          className="block break-all text-xs font-bold text-muted-foreground underline"
                          href={evidence.sourceUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {evidence.sourceUrl}
                        </a>
                      </div>
                      <Button
                        aria-label={`Remove evidence ${index + 1}`}
                        className="min-h-9 border border-border bg-background px-2 text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-muted"
                        disabled={disabled}
                        onClick={() => removeEvidence(index)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <input
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
                className="hidden"
                disabled={
                  disabled ||
                  !isPublic ||
                  evidenceUploading ||
                  memorialEvidence.length >= MAX_EVIDENCE_ITEMS
                }
                id="represented-evidence-input"
                onChange={(event) => void handleEvidenceSelected(event)}
                ref={evidenceInputRef}
                type="file"
              />
              <Button
                className="min-h-10 border border-border bg-background px-3 text-xs font-black uppercase tracking-[0.14em] text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-muted"
                disabled={
                  disabled ||
                  !isPublic ||
                  evidenceUploading ||
                  memorialEvidence.length >= MAX_EVIDENCE_ITEMS
                }
                onClick={() => evidenceInputRef.current?.click()}
                type="button"
              >
                <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                {evidenceUploading ? "Uploading…" : "+ Add evidence file"}
              </Button>
              <p className="text-xs font-bold text-muted-foreground">
                Only upload files that can be public. Photos, PDFs, or text, up to 25 MB each.
                {!isPublic ? " Make the memorial public before adding evidence." : ""}
              </p>
              {evidenceError ? (
                <p className="text-xs font-black text-destructive">{evidenceError}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase" htmlFor="represented-condition">
              Disease or cause
            </Label>
            <Input
              className="border-border bg-background font-bold"
              disabled={disabled}
              id="represented-condition"
              onChange={(event) => setConditionName(event.target.value)}
              placeholder="Dementia"
              value={conditionName}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase" htmlFor="represented-relationship">
              Your relationship
            </Label>
            <Input
              className="border-border bg-background font-bold"
              disabled={disabled}
              id="represented-relationship"
              onChange={(event) => setRelationshipType(event.target.value)}
              placeholder="grandchild of"
              value={relationshipType}
            />
          </div>
        </div>

        {lifeStatus === PersonLifeStatus.DECEASED ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <Label className="text-xs font-black uppercase">
                Responsible party optional
              </Label>
              <p className="text-xs font-bold text-muted-foreground">
                Up to {MAX_RESPONSIBLE_PARTIES}. First entry is the primary.
              </p>
            </div>

            {responsibleParties.length === 0 ? (
              <p className="text-sm font-bold text-muted-foreground">
                No party named yet.
              </p>
            ) : (
              <div className="space-y-3">
                {responsibleParties.map((party, index) => (
                  <div
                    className="grid gap-2 border border-border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                    key={index}
                  >
                    <div className="space-y-1">
                      <Label className="text-xs font-black uppercase">
                        Government
                      </Label>
                      <select
                        className="min-h-11 w-full border border-border bg-background px-3 font-bold text-foreground"
                        disabled={disabled}
                        onChange={(event) =>
                          updateResponsibleParty(index, {
                            jurisdictionCode: event.target.value,
                          })
                        }
                        value={party.jurisdictionCode}
                      >
                        <option value="">— or free text →</option>
                        {jurisdictionOptions
                          .filter((option) => option.code !== null)
                          .map((option) => (
                            <option key={option.id} value={option.code as string}>
                              {option.name}
                            </option>
                          ))}
                      </select>
                      {!party.jurisdictionCode ? (
                        <Input
                          className="border-border bg-background font-bold"
                          disabled={disabled}
                          onChange={(event) =>
                            updateResponsibleParty(index, { name: event.target.value })
                          }
                          placeholder="Or name a regulator, militia, organization"
                          value={party.name}
                        />
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-black uppercase">
                        Role optional
                      </Label>
                      <Input
                        className="border-border bg-background font-bold"
                        disabled={disabled}
                        onChange={(event) =>
                          updateResponsibleParty(index, { roleSlug: event.target.value })
                        }
                        placeholder="e.g. funder, regulator, armed-force"
                        value={party.roleSlug}
                      />
                    </div>
                    <Button
                      aria-label={`Remove responsible party ${index + 1}`}
                      className="min-h-11 border border-border bg-background px-3 text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-muted"
                      disabled={disabled}
                      onClick={() => removeResponsibleParty(index)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {responsibleParties.length < MAX_RESPONSIBLE_PARTIES ? (
              <Button
                className="min-h-10 border border-border bg-background px-3 text-xs font-black uppercase tracking-[0.14em] text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-muted"
                disabled={disabled}
                onClick={addResponsibleParty}
                type="button"
              >
                + Add another party
              </Button>
            ) : null}
          </div>
        ) : null}

        {lifeStatus === PersonLifeStatus.DECEASED ? (
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase" htmlFor="represented-memorial-message">
              Tell us about them
            </Label>
            <p className="text-xs font-bold text-muted-foreground">
              Not how they died. How they lived.
            </p>
            <Textarea
              className="min-h-28 border-border bg-background font-bold"
              disabled={disabled}
              id="represented-memorial-message"
              onChange={(event) => setMemorialMessage(event.target.value)}
              value={memorialMessage}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label className="text-xs font-black uppercase" htmlFor="represented-comment">
            What would they trade one apocalypse for?
          </Label>
          <Textarea
            className="min-h-28 border-border bg-background font-bold"
            disabled={disabled}
            id="represented-comment"
            onChange={(event) => setPublicComment(event.target.value)}
            placeholder="She would trade one apocalypse for dementia research."
            value={publicComment}
          />
        </div>

        <label className="flex items-start gap-3 text-sm font-bold leading-6">
          <Checkbox
            checked={isPublic}
            disabled={disabled}
            onCheckedChange={(value) => setIsPublic(value === true)}
          />
          <span>
            {lifeStatus === PersonLifeStatus.DECEASED
              ? "I consent to this memorial being displayed publicly on the People's page."
              : "Show this card publicly."}
          </span>
        </label>

        {lifeStatus === PersonLifeStatus.DECEASED ? (
          <label className="flex items-start gap-3 text-sm font-bold leading-6">
            <Checkbox
              checked={consentCourtEvidence}
              disabled={disabled}
              onCheckedChange={(value) => setConsentCourtEvidence(value === true)}
            />
            <span>
              I consent to this record being used as evidence in any future legal proceeding, including the Court of Humanity, seeking accountability for preventable deaths.
            </span>
          </label>
        ) : null}

        <Button
          className="min-h-12 w-full border border-foreground bg-foreground px-5 font-black uppercase tracking-[0.12em] text-background shadow-none hover:translate-x-0 hover:translate-y-0"
          disabled={
            disabled ||
            displayName.trim() === "" ||
            (lifeStatus === PersonLifeStatus.DECEASED &&
              (dateOfDeath.trim() === "" || deathCountryCode.trim() === ""))
          }
          onClick={() => void submit()}
          type="button"
        >
          <UserPlus className="mr-2 h-5 w-5" aria-hidden="true" />
          {status === "saving" ? "Filing receipt" : "File their vote against missiles"}
        </Button>

        {error ? (
          <p className="border border-border bg-background p-3 text-sm font-black">
            {error}
          </p>
        ) : null}

        {status === "saved" && submittedDisplayName ? (
          <div className="space-y-4 border-t border-border pt-4">
            {efficacyLagNotices.length > 0 ? (
              <div className="space-y-3 border border-foreground bg-background p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Efficacy lag flagged 👻
                </p>
                {efficacyLagNotices.map((notice) => (
                  <p
                    className="text-sm font-bold leading-7"
                    key={notice.interventionName}
                  >
                    {notice.explanation}
                  </p>
                ))}
              </div>
            ) : null}
            <p className="text-base font-bold leading-7">
              You just gave <strong>{submittedDisplayName}</strong> a voice. Now give a voice to everyone else you've lost. The more names in this database, the harder it is to ignore.
            </p>
            <Button
              className="min-h-12 w-full border border-foreground bg-foreground px-5 font-black uppercase tracking-[0.12em] text-background shadow-none hover:translate-x-0 hover:translate-y-0"
              onClick={() => {
                setStatus("idle");
                setSubmittedDisplayName(null);
                setShareText("");
                setEfficacyLagNotices([]);
              }}
              type="button"
            >
              <UserPlus className="mr-2 h-5 w-5" aria-hidden="true" />
              Add another memorial
            </Button>
            {shareText ? (
              <div className="space-y-2">
                <p className="text-sm font-bold">{shareText}</p>
                <Button
                  className="min-h-11 border border-border bg-transparent px-4 text-xs font-black uppercase tracking-[0.14em] text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-muted"
                  onClick={() => void copyTextToClipboard(shareText)}
                  type="button"
                >
                  <Clipboard className="mr-2 h-4 w-4" aria-hidden="true" />
                  Copy share text
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
