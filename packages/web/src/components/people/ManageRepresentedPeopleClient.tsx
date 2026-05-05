"use client";

import Link from "next/link";
import {
  PersonDeathCauseCategory,
  PersonLifeStatus,
  PersonMemorialEvidenceKind,
} from "@optimitron/db/enums";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Checkbox } from "@/components/retroui/Checkbox";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Textarea } from "@/components/retroui/Textarea";
import { ROUTES } from "@/lib/routes";
import { SquarePhotoCropper } from "./SquarePhotoCropper";

interface EditableEvidence {
  description: string;
  evidenceKind: PersonMemorialEvidenceKind;
  id?: string;
  sourceUrl: string;
  title: string;
}

export interface EditableRepresentedPerson {
  birthDate: string;
  causeCategory: PersonDeathCauseCategory;
  conditionName: string;
  consentCourtEvidence: boolean;
  dateOfDeath: string;
  deathCountryCode: string;
  displayName: string;
  evidence: EditableEvidence[];
  id: string;
  imageUrl: string;
  isPublic: boolean;
  lifeStatus: PersonLifeStatus;
  memorialMessage: string;
  publicComment: string;
  relationshipType: string;
}

interface ManageRepresentedPeopleClientProps {
  people: EditableRepresentedPerson[];
  referendumSlug: string;
}

async function uploadFileViaPresign(input: {
  file: File;
  kind: "person-photo" | "memorial-evidence";
}): Promise<{ publicUrl: string }> {
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
  const { uploadUrl, publicUrl } = (await presignRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
  };
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": input.file.type || "application/octet-stream" },
    body: input.file,
  });
  if (!putRes.ok) {
    throw new Error(`Upload failed (${putRes.status}).`);
  }
  return { publicUrl };
}

function patchPerson(
  person: EditableRepresentedPerson,
  patch: Partial<EditableRepresentedPerson>,
): EditableRepresentedPerson {
  return { ...person, ...patch };
}

export function ManageRepresentedPeopleClient({
  people,
  referendumSlug,
}: ManageRepresentedPeopleClientProps) {
  const [rows, setRows] = useState(people);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [photoCropDraft, setPhotoCropDraft] = useState<{
    file: File;
    personId: string;
  } | null>(null);

  useEffect(() => {
    setRows(people);
  }, [people]);

  function updatePerson(id: string, patch: Partial<EditableRepresentedPerson>) {
    setRows((prev) =>
      prev.map((person) => (person.id === id ? patchPerson(person, patch) : person)),
    );
  }

  function updateEvidence(
    personId: string,
    index: number,
    patch: Partial<EditableEvidence>,
  ) {
    setRows((prev) =>
      prev.map((person) =>
        person.id === personId
          ? {
              ...person,
              evidence: person.evidence.map((evidence, i) =>
                i === index ? { ...evidence, ...patch } : evidence,
              ),
            }
          : person,
      ),
    );
  }

  async function savePerson(person: EditableRepresentedPerson) {
    setSavingId(person.id);
    setSavedId(null);
    setErrorById((prev) => ({ ...prev, [person.id]: "" }));

    try {
      const response = await fetch(`/api/people/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...person,
          referendumSlug,
          memorialEvidence: person.evidence.filter((evidence) => !evidence.id),
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Could not save this person.");
      }
      setSavedId(person.id);
    } catch (caught) {
      setErrorById((prev) => ({
        ...prev,
        [person.id]:
          caught instanceof Error ? caught.message : "Could not save this person.",
      }));
    } finally {
      setSavingId(null);
    }
  }

  async function uploadPhoto(person: EditableRepresentedPerson, file: File) {
    setUploadingId(person.id);
    setErrorById((prev) => ({ ...prev, [person.id]: "" }));
    try {
      const { publicUrl } = await uploadFileViaPresign({
        file,
        kind: "person-photo",
      });
      updatePerson(person.id, { imageUrl: publicUrl });
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not upload photo.";
      setErrorById((prev) => ({
        ...prev,
        [person.id]: message,
      }));
      throw new Error(message);
    } finally {
      setUploadingId(null);
    }
  }

  async function uploadCroppedPhoto(file: File) {
    if (!photoCropDraft) return;
    const person = rows.find((row) => row.id === photoCropDraft.personId);
    if (!person) {
      setPhotoCropDraft(null);
      return;
    }
    await uploadPhoto(person, file);
    setPhotoCropDraft(null);
  }

  async function uploadEvidence(person: EditableRepresentedPerson, file: File) {
    setUploadingId(person.id);
    setErrorById((prev) => ({ ...prev, [person.id]: "" }));
    try {
      const { publicUrl } = await uploadFileViaPresign({
        file,
        kind: "memorial-evidence",
      });
      updatePerson(person.id, {
        evidence: [
          {
            description: "",
            evidenceKind: file.type.startsWith("image/")
              ? PersonMemorialEvidenceKind.PHOTO
              : file.type === "application/pdf"
                ? PersonMemorialEvidenceKind.DOCUMENT
                : PersonMemorialEvidenceKind.OTHER,
            sourceUrl: publicUrl,
            title: file.name,
          },
          ...person.evidence,
        ],
      });
    } catch (caught) {
      setErrorById((prev) => ({
        ...prev,
        [person.id]:
          caught instanceof Error ? caught.message : "Could not upload evidence.",
      }));
    } finally {
      setUploadingId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <section className="border border-border bg-card p-6 text-card-foreground">
        <p className="text-lg font-black uppercase">
          You have not signed for anyone yet.
        </p>
        <Link
          className="mt-5 inline-flex min-h-12 items-center border border-foreground bg-foreground px-5 text-sm font-black uppercase tracking-[0.14em] text-background"
          href={ROUTES.people}
        >
          Sign for someone
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {rows.map((person) => {
        const isDeceased = person.lifeStatus === PersonLifeStatus.DECEASED;
        return (
          <article
            className="border border-border bg-card p-5 text-card-foreground sm:p-6"
            key={person.id}
          >
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <div className="space-y-3">
                <div className="aspect-square border border-border bg-background">
                  {person.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={person.displayName}
                      className="h-full w-full object-cover"
                      src={person.imageUrl}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-4 text-center text-3xl font-black uppercase">
                      No photo
                    </div>
                  )}
                </div>
                <label className="inline-flex min-h-11 cursor-pointer items-center border border-border bg-background px-3 text-xs font-black uppercase tracking-[0.14em]">
                  <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                  {uploadingId === person.id ? "Uploading" : "Upload photo"}
                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploadingId === person.id}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        setPhotoCropDraft({ file, personId: person.id });
                      }
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">Name</Label>
                    <Input
                      className="border-border bg-background font-bold"
                      onChange={(event) =>
                        updatePerson(person.id, { displayName: event.target.value })
                      }
                      value={person.displayName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">Status</Label>
                    <select
                      className="min-h-12 w-full border border-border bg-background px-3 font-bold text-foreground"
                      onChange={(event) =>
                        updatePerson(person.id, {
                          lifeStatus: event.target.value as PersonLifeStatus,
                        })
                      }
                      value={person.lifeStatus}
                    >
                      <option value={PersonLifeStatus.UNKNOWN}>Unknown</option>
                      <option value={PersonLifeStatus.LIVING}>Living</option>
                      <option value={PersonLifeStatus.DECEASED}>
                        No longer alive
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">
                      Birth date optional
                    </Label>
                    <Input
                      className="border-border bg-background font-bold"
                      onChange={(event) =>
                        updatePerson(person.id, { birthDate: event.target.value })
                      }
                      type="date"
                      value={person.birthDate}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">
                      Disease or cause
                    </Label>
                    <Input
                      className="border-border bg-background font-bold"
                      onChange={(event) =>
                        updatePerson(person.id, {
                          conditionName: event.target.value,
                        })
                      }
                      placeholder="Dementia"
                      value={person.conditionName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">
                      Your relationship
                    </Label>
                    <Input
                      className="border-border bg-background font-bold"
                      onChange={(event) =>
                        updatePerson(person.id, {
                          relationshipType: event.target.value,
                        })
                      }
                      placeholder="grandchild of"
                      value={person.relationshipType}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">
                      Cause kind
                    </Label>
                    <select
                      className="min-h-12 w-full border border-border bg-background px-3 font-bold text-foreground"
                      onChange={(event) =>
                        updatePerson(person.id, {
                          causeCategory: event.target.value as PersonDeathCauseCategory,
                        })
                      }
                      value={person.causeCategory}
                    >
                      <option value={PersonDeathCauseCategory.UNKNOWN}>
                        Unknown
                      </option>
                      <option value={PersonDeathCauseCategory.DISEASE}>
                        Disease
                      </option>
                      <option value={PersonDeathCauseCategory.ARMED_CONFLICT}>
                        Armed conflict
                      </option>
                      <option value={PersonDeathCauseCategory.STATE_VIOLENCE}>
                        State violence
                      </option>
                      <option value={PersonDeathCauseCategory.TERRORISM}>
                        Terrorism
                      </option>
                      <option value={PersonDeathCauseCategory.OTHER_PREVENTABLE}>
                        Other preventable
                      </option>
                      <option value={PersonDeathCauseCategory.OTHER}>Other</option>
                    </select>
                  </div>
                </div>

                {isDeceased ? (
                  <div className="grid gap-3 border border-border bg-background p-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase">
                        Date of death optional
                      </Label>
                      <Input
                        className="border-border bg-background font-bold"
                        onChange={(event) =>
                          updatePerson(person.id, {
                            dateOfDeath: event.target.value,
                          })
                        }
                        type="date"
                        value={person.dateOfDeath}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase">
                        Country of death optional
                      </Label>
                      <Input
                        className="border-border bg-background font-bold uppercase"
                        maxLength={2}
                        onChange={(event) =>
                          updatePerson(person.id, {
                            deathCountryCode: event.target.value.toUpperCase(),
                          })
                        }
                        placeholder="US"
                        value={person.deathCountryCode}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs font-black uppercase">
                        About them
                      </Label>
                      <Textarea
                        className="min-h-24 border-border bg-background font-bold"
                        onChange={(event) =>
                          updatePerson(person.id, {
                            memorialMessage: event.target.value,
                          })
                        }
                        value={person.memorialMessage}
                      />
                    </div>
                    <label className="flex items-start gap-3 text-sm font-bold leading-6 sm:col-span-2">
                      <Checkbox
                        checked={person.consentCourtEvidence}
                        onCheckedChange={(value) =>
                          updatePerson(person.id, {
                            consentCourtEvidence: value === true,
                          })
                        }
                      />
                      <span>
                        This can be used as evidence in future accountability
                        work.
                      </span>
                    </label>
                    <div className="space-y-3 sm:col-span-2">
                      <label className="inline-flex min-h-11 cursor-pointer items-center border border-border bg-background px-3 text-xs font-black uppercase tracking-[0.14em]">
                        <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                        {uploadingId === person.id
                          ? "Uploading"
                          : "Add evidence file"}
                        <input
                          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
                          className="hidden"
                          disabled={uploadingId === person.id}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadEvidence(person, file);
                            event.target.value = "";
                          }}
                          type="file"
                        />
                      </label>
                      {person.evidence.length > 0 ? (
                        <ul className="space-y-2">
                          {person.evidence.map((evidence, index) => (
                            <li
                              className="space-y-2 border border-border p-3"
                              key={evidence.id ?? evidence.sourceUrl}
                            >
                              <select
                                className="min-h-10 w-full border border-border bg-background px-3 text-sm font-bold text-foreground"
                                onChange={(event) =>
                                  updateEvidence(person.id, index, {
                                    evidenceKind: event.target
                                      .value as PersonMemorialEvidenceKind,
                                  })
                                }
                                value={evidence.evidenceKind}
                              >
                                <option value={PersonMemorialEvidenceKind.PHOTO}>
                                  Photo
                                </option>
                                <option
                                  value={PersonMemorialEvidenceKind.DOCUMENT}
                                >
                                  Document
                                </option>
                                <option
                                  value={
                                    PersonMemorialEvidenceKind.NEWS_ARTICLE
                                  }
                                >
                                  News article
                                </option>
                                <option
                                  value={PersonMemorialEvidenceKind.DEATH_RECORD}
                                >
                                  Death record
                                </option>
                                <option value={PersonMemorialEvidenceKind.OTHER}>
                                  Other
                                </option>
                              </select>
                              <Input
                                className="border-border bg-background font-bold"
                                onChange={(event) =>
                                  updateEvidence(person.id, index, {
                                    title: event.target.value,
                                  })
                                }
                                placeholder="Title"
                                value={evidence.title}
                              />
                              <Input
                                className="border-border bg-background font-bold"
                                onChange={(event) =>
                                  updateEvidence(person.id, index, {
                                    description: event.target.value,
                                  })
                                }
                                placeholder="Description"
                                value={evidence.description}
                              />
                              <a
                                className="block break-all text-xs font-bold underline underline-offset-4"
                                href={evidence.sourceUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {evidence.sourceUrl}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase">
                    Public note about them
                  </Label>
                  <Textarea
                    className="min-h-24 border-border bg-background font-bold"
                    maxLength={220}
                    onChange={(event) =>
                      updatePerson(person.id, {
                        publicComment: event.target.value,
                      })
                    }
                    placeholder="She would trade one apocalypse for dementia research."
                    value={person.publicComment}
                  />
                </div>

                <label className="flex items-start gap-3 text-sm font-bold leading-6">
                  <Checkbox
                    checked={person.isPublic}
                    onCheckedChange={(value) =>
                      updatePerson(person.id, { isPublic: value === true })
                    }
                  />
                  <span>Show this person publicly.</span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    className="min-h-12 border border-foreground bg-foreground px-5 font-black uppercase tracking-[0.12em] text-background shadow-none hover:translate-x-0 hover:translate-y-0 disabled:opacity-40"
                    disabled={savingId === person.id || !person.displayName.trim()}
                    onClick={() => void savePerson(person)}
                    type="button"
                  >
                    {savingId === person.id ? "Saving..." : "Save changes"}
                  </Button>
                  {savedId === person.id ? (
                    <p className="text-sm font-black uppercase tracking-[0.14em]">
                      Saved
                    </p>
                  ) : null}
                  {errorById[person.id] ? (
                    <p className="text-sm font-black">{errorById[person.id]}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        );
      })}
      {photoCropDraft ? (
        <SquarePhotoCropper
          file={photoCropDraft.file}
          onCancel={() => setPhotoCropDraft(null)}
          onCrop={uploadCroppedPhoto}
        />
      ) : null}
    </section>
  );
}
