"use client";

import * as ReactDialog from "@radix-ui/react-dialog";
import Link from "next/link";
import {
  PersonDeathCauseCategory,
  PersonLifeStatus,
  PersonMemorialEvidenceKind,
} from "@optimitron/db/enums";
import { Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Checkbox } from "@/components/retroui/Checkbox";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Textarea } from "@/components/retroui/Textarea";
import { ROUTES } from "@/lib/routes";
import { SquarePhotoCropper } from "./SquarePhotoCropper";

const MAX_EVIDENCE_ITEMS = 8;

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

function lifeStatusLabel(status: PersonLifeStatus) {
  if (status === PersonLifeStatus.DECEASED) return "No longer alive";
  if (status === PersonLifeStatus.LIVING) return "Living";
  return "Unknown";
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length >= 2
      ? `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`
      : name.trim().slice(0, 2);
  return letters.toUpperCase() || "??";
}

export function ManageRepresentedPeopleClient({
  people,
  referendumSlug,
}: ManageRepresentedPeopleClientProps) {
  const [rows, setRows] = useState(people);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [photoCropDraft, setPhotoCropDraft] = useState<{
    file: File;
    personId: string;
  } | null>(null);

  useEffect(() => {
    setRows(people);
  }, [people]);

  const editingPerson = editingId
    ? rows.find((person) => person.id === editingId) ?? null
    : null;

  useEffect(() => {
    if (editingId && !editingPerson) {
      setEditingId(null);
    }
  }, [editingId, editingPerson]);

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
          memorialEvidence: person.evidence,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Could not save this person.");
      }
      const payload = (await response.json().catch(() => ({}))) as {
        person?: { evidence?: EditableEvidence[] };
      };
      if (payload.person?.evidence) {
        updatePerson(person.id, { evidence: payload.person.evidence });
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
    if (person.evidence.length >= MAX_EVIDENCE_ITEMS) {
      setErrorById((prev) => ({
        ...prev,
        [person.id]: `You can add up to ${MAX_EVIDENCE_ITEMS} evidence files.`,
      }));
      return;
    }

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
          You have no plaintiffs yet.
        </p>
        <Link
          className="mt-5 inline-flex min-h-12 items-center border border-foreground bg-foreground px-5 text-sm font-black uppercase tracking-[0.14em] text-background"
          href={ROUTES.people}
        >
          Register a plaintiff
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden border border-border bg-card text-card-foreground">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-4 py-3">Plaintiff</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Public</th>
                <th className="px-4 py-3">Evidence</th>
                <th className="px-4 py-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((person) => (
                <tr className="border-b border-border last:border-b-0" key={person.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-border bg-background text-sm font-black uppercase">
                        {person.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt=""
                            className="h-full w-full object-cover"
                            src={person.imageUrl}
                          />
                        ) : (
                          initials(person.displayName)
                        )}
                      </div>
                      <div>
                        <p className="font-black">{person.displayName}</p>
                        {person.conditionName ? (
                          <p className="text-sm font-bold text-muted-foreground">
                            {person.conditionName}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-black uppercase tracking-[0.12em]">
                    {lifeStatusLabel(person.lifeStatus)}
                  </td>
                  <td className="px-4 py-3 text-sm font-black uppercase tracking-[0.12em]">
                    {person.isPublic ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 text-sm font-black uppercase tracking-[0.12em]">
                    {person.evidence.length}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      className="min-h-11 border border-foreground bg-background px-4 text-xs font-black uppercase tracking-[0.14em] text-foreground shadow-none hover:translate-x-0 hover:translate-y-0"
                      onClick={() => setEditingId(person.id)}
                      type="button"
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReactDialog.Root
        open={Boolean(editingPerson)}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <ReactDialog.Portal>
          <ReactDialog.Overlay className="fixed inset-0 z-[100] bg-foreground/80" />
          <ReactDialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-auto border border-foreground bg-background p-5 text-foreground shadow-none sm:p-6">
            {editingPerson ? (
              <>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <ReactDialog.Title asChild>
                      <h2 className="text-3xl font-black uppercase leading-tight">
                        Edit plaintiff
                      </h2>
                    </ReactDialog.Title>
                    <p className="mt-1 font-bold text-muted-foreground">
                      {editingPerson.displayName}
                    </p>
                  </div>
                  <ReactDialog.Close asChild>
                    <button
                      aria-label="Close editor"
                      className="inline-flex min-h-10 items-center border border-foreground bg-background px-3 text-foreground disabled:opacity-40"
                      type="button"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </ReactDialog.Close>
                </div>

                <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                  <div className="space-y-3">
                    <div className="aspect-square border border-border bg-background">
                      {editingPerson.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={editingPerson.displayName}
                          className="h-full w-full object-cover"
                          src={editingPerson.imageUrl}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-4 text-center text-3xl font-black uppercase">
                          No photo
                        </div>
                      )}
                    </div>
                    <label className="inline-flex min-h-11 cursor-pointer items-center border border-foreground bg-background px-3 text-xs font-black uppercase tracking-[0.14em]">
                      <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                      {uploadingId === editingPerson.id ? "Uploading" : "Upload photo"}
                      <input
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={uploadingId === editingPerson.id}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            setPhotoCropDraft({
                              file,
                              personId: editingPerson.id,
                            });
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
                        <Label className="text-xs font-black uppercase">
                          Name
                        </Label>
                        <Input
                          className="border-border bg-background font-bold"
                          onChange={(event) =>
                            updatePerson(editingPerson.id, {
                              displayName: event.target.value,
                            })
                          }
                          value={editingPerson.displayName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase">
                          Status
                        </Label>
                        <select
                          className="min-h-12 w-full border border-border bg-background px-3 font-bold text-foreground"
                          onChange={(event) =>
                            updatePerson(editingPerson.id, {
                              lifeStatus: event.target.value as PersonLifeStatus,
                            })
                          }
                          value={editingPerson.lifeStatus}
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
                            updatePerson(editingPerson.id, {
                              birthDate: event.target.value,
                            })
                          }
                          type="date"
                          value={editingPerson.birthDate}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase">
                          Disease or cause
                        </Label>
                        <Input
                          className="border-border bg-background font-bold"
                          onChange={(event) =>
                            updatePerson(editingPerson.id, {
                              conditionName: event.target.value,
                            })
                          }
                          placeholder="Dementia"
                          value={editingPerson.conditionName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase">
                          Your relationship
                        </Label>
                        <Input
                          className="border-border bg-background font-bold"
                          onChange={(event) =>
                            updatePerson(editingPerson.id, {
                              relationshipType: event.target.value,
                            })
                          }
                          placeholder="grandchild of"
                          value={editingPerson.relationshipType}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase">
                          Cause kind
                        </Label>
                        <select
                          className="min-h-12 w-full border border-border bg-background px-3 font-bold text-foreground"
                          onChange={(event) =>
                            updatePerson(editingPerson.id, {
                              causeCategory: event.target
                                .value as PersonDeathCauseCategory,
                            })
                          }
                          value={editingPerson.causeCategory}
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
                          <option value={PersonDeathCauseCategory.OTHER}>
                            Other
                          </option>
                        </select>
                      </div>
                    </div>

                    {editingPerson.lifeStatus === PersonLifeStatus.DECEASED ? (
                      <div className="grid gap-3 border border-border bg-background p-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase">
                            Date of death optional
                          </Label>
                          <Input
                            className="border-border bg-background font-bold"
                            onChange={(event) =>
                              updatePerson(editingPerson.id, {
                                dateOfDeath: event.target.value,
                              })
                            }
                            type="date"
                            value={editingPerson.dateOfDeath}
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
                              updatePerson(editingPerson.id, {
                                deathCountryCode:
                                  event.target.value.toUpperCase(),
                              })
                            }
                            placeholder="US"
                            value={editingPerson.deathCountryCode}
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-xs font-black uppercase">
                            About them
                          </Label>
                          <Textarea
                            className="min-h-24 border-border bg-background font-bold"
                            onChange={(event) =>
                              updatePerson(editingPerson.id, {
                                memorialMessage: event.target.value,
                              })
                            }
                            value={editingPerson.memorialMessage}
                          />
                        </div>
                        <label className="flex items-start gap-3 text-sm font-bold leading-6 sm:col-span-2">
                          <Checkbox
                            checked={editingPerson.consentCourtEvidence}
                            onCheckedChange={(value) =>
                              updatePerson(editingPerson.id, {
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
                          <label className="inline-flex min-h-11 cursor-pointer items-center border border-foreground bg-background px-3 text-xs font-black uppercase tracking-[0.14em]">
                            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                            {uploadingId === editingPerson.id
                              ? "Uploading"
                              : "Add evidence file"}
                            <input
                              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
                              className="hidden"
                              disabled={uploadingId === editingPerson.id}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void uploadEvidence(editingPerson, file);
                                event.target.value = "";
                              }}
                              type="file"
                            />
                          </label>
                          {editingPerson.evidence.length > 0 ? (
                            <ul className="space-y-2">
                              {editingPerson.evidence.map((evidence, index) => (
                                <li
                                  className="space-y-2 border border-border p-3"
                                  key={evidence.id ?? evidence.sourceUrl}
                                >
                                  <select
                                    className="min-h-10 w-full border border-border bg-background px-3 text-sm font-bold text-foreground"
                                    onChange={(event) =>
                                      updateEvidence(editingPerson.id, index, {
                                        evidenceKind: event.target
                                          .value as PersonMemorialEvidenceKind,
                                      })
                                    }
                                    value={evidence.evidenceKind}
                                  >
                                    <option value={PersonMemorialEvidenceKind.PHOTO}>
                                      Photo
                                    </option>
                                    <option value={PersonMemorialEvidenceKind.DOCUMENT}>
                                      Document
                                    </option>
                                    <option
                                      value={PersonMemorialEvidenceKind.NEWS_ARTICLE}
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
                                      updateEvidence(editingPerson.id, index, {
                                        title: event.target.value,
                                      })
                                    }
                                    placeholder="Title"
                                    value={evidence.title}
                                  />
                                  <Input
                                    className="border-border bg-background font-bold"
                                    onChange={(event) =>
                                      updateEvidence(editingPerson.id, index, {
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
                          updatePerson(editingPerson.id, {
                            publicComment: event.target.value,
                          })
                        }
                        placeholder="She would trade one apocalypse for dementia research."
                        value={editingPerson.publicComment}
                      />
                    </div>

                    <label className="flex items-start gap-3 text-sm font-bold leading-6">
                      <Checkbox
                        checked={editingPerson.isPublic}
                        onCheckedChange={(value) =>
                          updatePerson(editingPerson.id, {
                            isPublic: value === true,
                          })
                        }
                      />
                      <span>Show this person publicly.</span>
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        className="min-h-12 border border-foreground bg-foreground px-5 font-black uppercase tracking-[0.12em] text-background shadow-none hover:translate-x-0 hover:translate-y-0 disabled:opacity-40"
                        disabled={
                          savingId === editingPerson.id ||
                          !editingPerson.displayName.trim()
                        }
                        onClick={() => void savePerson(editingPerson)}
                        type="button"
                      >
                        {savingId === editingPerson.id
                          ? "Saving..."
                          : "Save changes"}
                      </Button>
                      {savedId === editingPerson.id ? (
                        <p className="text-sm font-black uppercase tracking-[0.14em]">
                          Saved
                        </p>
                      ) : null}
                      {errorById[editingPerson.id] ? (
                        <p className="text-sm font-black">
                          {errorById[editingPerson.id]}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </ReactDialog.Content>
        </ReactDialog.Portal>
      </ReactDialog.Root>

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
