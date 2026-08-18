"use client";

import * as ReactDialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PersonDeathCauseCategory,
  PersonLifeStatus,
  PersonMemorialEvidenceKind,
} from "@optimitron/db/enums";
import { Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/retroui/Checkbox";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Textarea } from "@/components/retroui/Textarea";
import { defaultButtonClassName } from "@/components/ui/default-button";
import { uploadImageViaBackend } from "@/lib/image-upload.client";
import { buildDisplayNameFromParts } from "@/lib/person-name";
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
  authorityConfirmed: boolean;
  birthDate: string;
  causeCategory: PersonDeathCauseCategory;
  conditionIsPublic: boolean;
  conditionName: string;
  consentCourtEvidence: boolean;
  dateOfDeath: string;
  deathCountryCode: string;
  displayName: string;
  evidence: EditableEvidence[];
  healthDisclosureConfirmed: boolean;
  id: string;
  imageUrl: string;
  isPublic: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  lifeStatus: PersonLifeStatus;
  memorialMessage: string;
  publicComment: string;
  publicDisplayAcknowledged: boolean;
  relationshipType: string;
}

interface ManageRepresentedPeopleClientProps {
  currentPage: number;
  initialEditingId?: string | null;
  people: EditableRepresentedPerson[];
  referendumSlug: string;
}

async function uploadFileViaPresign(input: {
  file: File;
  kind: "person-photo" | "memorial-evidence";
}): Promise<{ publicUrl: string }> {
  if (input.kind === "person-photo") {
    return uploadImageViaBackend({ file: input.file, kind: "person-photo" });
  }
  if (input.file.type.startsWith("image/")) {
    return uploadImageViaBackend({
      file: input.file,
      kind: "memorial-evidence-image",
    });
  }

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
  const next = { ...person, ...patch };
  if (
    "firstName" in patch ||
    "middleName" in patch ||
    "lastName" in patch
  ) {
    return {
      ...next,
      displayName: buildDisplayNameFromParts(next) || next.displayName,
    };
  }
  return next;
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

function canSavePerson(person: EditableRepresentedPerson) {
  const isLivingOrUnknown = person.lifeStatus !== PersonLifeStatus.DECEASED;
  const wantsPublicCondition =
    isLivingOrUnknown &&
    person.conditionName.trim() !== "" &&
    person.conditionIsPublic;

  return (
    person.firstName.trim() !== "" &&
    person.lastName.trim() !== "" &&
    person.authorityConfirmed &&
    (!person.isPublic || person.publicDisplayAcknowledged) &&
    (!wantsPublicCondition || person.healthDisclosureConfirmed)
  );
}

function PersonThumb({ person }: { person: EditableRepresentedPerson }) {
  return (
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
  );
}

export function ManageRepresentedPeopleClient({
  currentPage,
  initialEditingId = null,
  people,
  referendumSlug,
}: ManageRepresentedPeopleClientProps) {
  const router = useRouter();
  const [rows, setRows] = useState(people);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
    null,
  );
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(initialEditingId);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [photoCropDraft, setPhotoCropDraft] = useState<{
    file: File;
    personId: string;
  } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRows(people);
  }, [people]);

  useEffect(() => {
    if (initialEditingId) {
      setEditingId(initialEditingId);
    }
  }, [initialEditingId]);

  const editingPerson = editingId
    ? (rows.find((person) => person.id === editingId) ?? null)
    : null;
  const deleteCandidate = deleteCandidateId
    ? (rows.find((person) => person.id === deleteCandidateId) ?? null)
    : null;

  useEffect(() => {
    if (editingId && !editingPerson) {
      setEditingId(null);
    }
  }, [editingId, editingPerson]);

  function updatePerson(id: string, patch: Partial<EditableRepresentedPerson>) {
    setRows((prev) =>
      prev.map((person) =>
        person.id === id ? patchPerson(person, patch) : person,
      ),
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
          healthDisclosureConfirmed:
            person.lifeStatus !== PersonLifeStatus.DECEASED &&
            person.conditionIsPublic &&
            person.healthDisclosureConfirmed,
          referendumSlug,
          memorialEvidence: person.evidence,
          publicDisplayAcknowledged:
            person.isPublic && person.publicDisplayAcknowledged,
          showConditionPublicly:
            person.lifeStatus !== PersonLifeStatus.DECEASED &&
            person.conditionIsPublic,
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
          caught instanceof Error
            ? caught.message
            : "Could not save this person.",
      }));
    } finally {
      setSavingId(null);
    }
  }

  async function deletePerson(person: EditableRepresentedPerson) {
    if (deletingId) return;

    setDeletingId(person.id);
    setSavedId(null);
    setErrorById((prev) => ({ ...prev, [person.id]: "" }));
    try {
      const response = await fetch(`/api/people/${person.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Could not delete this plaintiff.");
      }
      const remainingRows = rows.filter((row) => row.id !== person.id);
      setRows(remainingRows);
      setEditingId(null);
      setDeleteCandidateId(null);
      if (remainingRows.length === 0 && currentPage > 1) {
        router.replace(`${ROUTES.plaintiffsManage}?page=${currentPage - 1}`);
      } else {
        router.refresh();
      }
    } catch (caught) {
      setErrorById((prev) => ({
        ...prev,
        [person.id]:
          caught instanceof Error
            ? caught.message
            : "Could not delete this plaintiff.",
      }));
    } finally {
      setDeletingId(null);
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

  function openPhotoPicker() {
    photoInputRef.current?.click();
  }

  function selectPhotoFile(personId: string, file: File | undefined) {
    if (!file) return;
    setPhotoCropDraft({ file, personId });
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
          caught instanceof Error
            ? caught.message
            : "Could not upload evidence.",
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
          className={`${defaultButtonClassName} mt-5`}
          href={ROUTES.plaintiffs}
        >
          Register a plaintiff
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="space-y-3 md:hidden">
        {rows.map((person) => (
          <article
            className="border border-border bg-card p-4 text-card-foreground"
            key={person.id}
          >
            <div className="flex items-start gap-3">
              <PersonThumb person={person} />
              <div className="min-w-0 flex-1">
                <p className="break-words font-black">{person.displayName}</p>
                {person.conditionName ? (
                  <p className="mt-1 break-words text-sm font-bold text-muted-foreground">
                    {person.conditionName}
                  </p>
                ) : null}
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs font-black uppercase tracking-[0.12em]">
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1">{lifeStatusLabel(person.lifeStatus)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Public</dt>
                <dd className="mt-1">{person.isPublic ? "Yes" : "No"}</dd>
              </div>
            </dl>
            <button
              className={`${defaultButtonClassName} mt-4 min-h-11 w-full px-4 text-xs`}
              onClick={() => setEditingId(person.id)}
              type="button"
            >
              Edit
            </button>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden border border-border bg-card text-card-foreground md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-4 py-3">Plaintiff</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Public</th>
                <th className="px-4 py-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((person) => (
                <tr
                  className="border-b border-border last:border-b-0"
                  key={person.id}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PersonThumb person={person} />
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
                  <td className="px-4 py-3 text-right">
                    <button
                      className={`${defaultButtonClassName} min-h-11 px-4 text-xs`}
                      onClick={() => setEditingId(person.id)}
                      type="button"
                    >
                      Edit
                    </button>
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
                      className={`${defaultButtonClassName} min-h-10 px-3 disabled:opacity-40`}
                      type="button"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </ReactDialog.Close>
                </div>

                <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                  <div className="space-y-3">
                    <button
                      aria-label={
                        editingPerson.imageUrl ? "Change photo" : "Upload photo"
                      }
                      className="group relative aspect-square w-full cursor-pointer overflow-hidden border border-border bg-background text-foreground"
                      disabled={uploadingId === editingPerson.id}
                      onClick={openPhotoPicker}
                      type="button"
                    >
                      {editingPerson.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={editingPerson.displayName}
                          className="h-full w-full object-cover"
                          src={editingPerson.imageUrl}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-4 text-center text-5xl font-black uppercase">
                          {initials(editingPerson.displayName)}
                        </div>
                      )}
                      <span className="absolute inset-x-0 bottom-0 bg-foreground px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-background">
                        {uploadingId === editingPerson.id
                          ? "Uploading"
                          : editingPerson.imageUrl
                            ? "Change photo"
                            : "Upload photo"}
                      </span>
                    </button>
                    <input
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={uploadingId === editingPerson.id}
                      onChange={(event) => {
                        selectPhotoFile(
                          editingPerson.id,
                          event.target.files?.[0],
                        );
                        event.target.value = "";
                      }}
                      ref={photoInputRef}
                      type="file"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase">
                          First name
                        </Label>
                        <Input
                          autoComplete="given-name"
                          className="border-border bg-background font-bold"
                          onChange={(event) =>
                            updatePerson(editingPerson.id, {
                              firstName: event.target.value,
                            })
                          }
                          value={editingPerson.firstName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase">
                          Middle name optional
                        </Label>
                        <Input
                          autoComplete="additional-name"
                          className="border-border bg-background font-bold"
                          onChange={(event) =>
                            updatePerson(editingPerson.id, {
                              middleName: event.target.value,
                            })
                          }
                          value={editingPerson.middleName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase">
                          Last name
                        </Label>
                        <Input
                          autoComplete="family-name"
                          className="border-border bg-background font-bold"
                          onChange={(event) =>
                            updatePerson(editingPerson.id, {
                              lastName: event.target.value,
                            })
                          }
                          value={editingPerson.lastName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase">
                          Status
                        </Label>
                        <select
                          className="min-h-12 w-full border border-border bg-background px-3 font-bold text-foreground"
                          onChange={(event) => {
                            const nextLifeStatus = event.target
                              .value as PersonLifeStatus;
                            updatePerson(editingPerson.id, {
                              lifeStatus: nextLifeStatus,
                              ...(nextLifeStatus === PersonLifeStatus.DECEASED
                                ? {
                                    conditionIsPublic: false,
                                    healthDisclosureConfirmed: false,
                                  }
                                : {}),
                            });
                          }}
                          value={editingPerson.lifeStatus}
                        >
                          <option value={PersonLifeStatus.UNKNOWN}>
                            Unknown
                          </option>
                          <option value={PersonLifeStatus.LIVING}>
                            Living
                          </option>
                          <option value={PersonLifeStatus.DECEASED}>
                            No longer alive
                          </option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase">
                          Birth date
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
                              ...(event.target.value.trim()
                                ? {}
                                : {
                                    conditionIsPublic: false,
                                    healthDisclosureConfirmed: false,
                                  }),
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
                          Cause category
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
                          <option
                            value={PersonDeathCauseCategory.ARMED_CONFLICT}
                          >
                            Armed conflict
                          </option>
                          <option
                            value={PersonDeathCauseCategory.STATE_VIOLENCE}
                          >
                            State violence
                          </option>
                          <option value={PersonDeathCauseCategory.TERRORISM}>
                            Terrorism
                          </option>
                          <option
                            value={PersonDeathCauseCategory.OTHER_PREVENTABLE}
                          >
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
                            Date of death
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
                            Country of death
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
                            This can be used as evidence in future
                            accountability work.
                          </span>
                        </label>
                        <div className="space-y-3 sm:col-span-2">
                          <label className="inline-flex min-h-11 cursor-pointer items-center border border-foreground bg-background px-3 text-xs font-black uppercase tracking-[0.14em]">
                            <Upload
                              className="mr-2 h-4 w-4"
                              aria-hidden="true"
                            />
                            {uploadingId === editingPerson.id
                              ? "Uploading"
                              : "Add evidence file"}
                            <input
                              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
                              className="hidden"
                              disabled={uploadingId === editingPerson.id}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file)
                                  void uploadEvidence(editingPerson, file);
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
                                    <option
                                      value={PersonMemorialEvidenceKind.PHOTO}
                                    >
                                      Photo
                                    </option>
                                    <option
                                      value={
                                        PersonMemorialEvidenceKind.DOCUMENT
                                      }
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
                                      value={
                                        PersonMemorialEvidenceKind.DEATH_RECORD
                                      }
                                    >
                                      Death record
                                    </option>
                                    <option
                                      value={
                                        PersonMemorialEvidenceKind.WITNESS_STATEMENT
                                      }
                                    >
                                      Witness statement
                                    </option>
                                    <option
                                      value={PersonMemorialEvidenceKind.OTHER}
                                    >
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
                            publicDisplayAcknowledged: false,
                            ...(value === true
                              ? {}
                              : {
                                  conditionIsPublic: false,
                                  healthDisclosureConfirmed: false,
                                }),
                          })
                        }
                      />
                      <span>Show this person publicly.</span>
                    </label>

                    <label className="flex items-start gap-3 text-sm font-bold leading-6">
                      <Checkbox
                        checked={editingPerson.authorityConfirmed}
                        onCheckedChange={(value) =>
                          updatePerson(editingPerson.id, {
                            authorityConfirmed: value === true,
                          })
                        }
                      />
                      <span>
                        I have permission or legal authority to edit this
                        person, or they are deceased and I am their family
                        member or personal representative.
                      </span>
                    </label>

                    {editingPerson.isPublic ? (
                      <label className="flex items-start gap-3 text-sm font-bold leading-6">
                        <Checkbox
                          checked={editingPerson.publicDisplayAcknowledged}
                          onCheckedChange={(value) =>
                            updatePerson(editingPerson.id, {
                              publicDisplayAcknowledged: value === true,
                            })
                          }
                        />
                        <span>
                          I understand public plaintiff cards, photos, comments,
                          memorial details, and evidence may be visible to
                          anyone.
                        </span>
                      </label>
                    ) : null}

                    {editingPerson.lifeStatus !== PersonLifeStatus.DECEASED &&
                    editingPerson.conditionName.trim() &&
                    editingPerson.isPublic ? (
                      <div className="space-y-3 border border-border bg-background p-3">
                        <label className="flex items-start gap-3 text-sm font-bold leading-6">
                          <Checkbox
                            checked={editingPerson.conditionIsPublic}
                            onCheckedChange={(value) =>
                              updatePerson(editingPerson.id, {
                                conditionIsPublic: value === true,
                                healthDisclosureConfirmed:
                                  value === true
                                    ? editingPerson.healthDisclosureConfirmed
                                    : false,
                              })
                            }
                          />
                          <span>Show this health condition publicly.</span>
                        </label>
                        {editingPerson.conditionIsPublic ? (
                          <label className="flex items-start gap-3 text-sm font-bold leading-6">
                            <Checkbox
                              checked={editingPerson.healthDisclosureConfirmed}
                              onCheckedChange={(value) =>
                                updatePerson(editingPerson.id, {
                                  healthDisclosureConfirmed: value === true,
                                })
                              }
                            />
                            <span>
                              This person is living or their status is unknown.
                              I have consent or legal authority to publicly show
                              their health condition.
                            </span>
                          </label>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className={`${defaultButtonClassName} tracking-[0.12em] disabled:opacity-40`}
                        disabled={
                          savingId === editingPerson.id ||
                          deletingId === editingPerson.id ||
                          !canSavePerson(editingPerson)
                        }
                        onClick={() => void savePerson(editingPerson)}
                        type="button"
                      >
                        {savingId === editingPerson.id
                          ? "Saving..."
                          : "Save changes"}
                      </button>
                      <button
                        className={`${defaultButtonClassName} tracking-[0.12em] disabled:opacity-40`}
                        disabled={
                          savingId === editingPerson.id ||
                          deletingId === editingPerson.id
                        }
                        onClick={() => setDeleteCandidateId(editingPerson.id)}
                        type="button"
                      >
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        {deletingId === editingPerson.id
                          ? "Deleting"
                          : "Delete"}
                      </button>
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

      <ReactDialog.Root
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open && !deletingId) setDeleteCandidateId(null);
        }}
      >
        <ReactDialog.Portal>
          <ReactDialog.Overlay className="fixed inset-0 z-[130] bg-foreground/80" />
          <ReactDialog.Content
            className="fixed left-1/2 top-1/2 z-[131] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border border-foreground bg-background p-5 text-foreground shadow-none sm:p-6"
            role="alertdialog"
          >
            <ReactDialog.Title asChild>
              <h2 className="text-2xl font-black uppercase leading-tight">
                {deleteCandidate
                  ? `Delete "${deleteCandidate.displayName}"?`
                  : "Delete plaintiff?"}
              </h2>
            </ReactDialog.Title>
            <ReactDialog.Description className="mt-3 text-base font-bold leading-7 text-muted-foreground">
              This removes the plaintiff from your list.
            </ReactDialog.Description>
            {deleteCandidate && errorById[deleteCandidate.id] ? (
              <p className="mt-3 text-sm font-black">
                {errorById[deleteCandidate.id]}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                className={`${defaultButtonClassName} tracking-[0.12em] disabled:opacity-40`}
                disabled={Boolean(deletingId)}
                onClick={() => setDeleteCandidateId(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`${defaultButtonClassName} tracking-[0.12em] disabled:opacity-40`}
                disabled={!deleteCandidate || Boolean(deletingId)}
                onClick={() => {
                  if (deleteCandidate) void deletePerson(deleteCandidate);
                }}
                type="button"
              >
                {deletingId ? "Deleting" : "Delete"}
              </button>
            </div>
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
