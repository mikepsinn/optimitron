"use client";

import { Paperclip, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/retroui/Button";
import { API_ROUTES } from "@/lib/api-routes";

interface AttachmentSummary {
  contentType: string;
  fileName: string;
  id: string;
  sizeBytes: number;
  uploadedAt: string | null;
}

type AttachmentResource =
  | { collectionRecordId: string; documentId?: never }
  | { collectionRecordId?: never; documentId: string };

function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${Math.round(bytes / 1_024)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

async function sha256Base64(file: File): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function readError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? fallback;
}

export function ContentAttachments({
  attachments,
  canEdit,
  resource,
}: {
  attachments: AttachmentSummary[];
  canEdit: boolean;
  resource: AttachmentResource;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length || isUploading) return;
    setError(null);
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const prepareResponse = await fetch(API_ROUTES.content.attachments, {
          body: JSON.stringify({
            ...resource,
            checksumSha256: await sha256Base64(file),
            contentType: file.type,
            fileName: file.name,
            sizeBytes: file.size,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const prepared = (await prepareResponse.json().catch(() => null)) as {
          attachmentId?: string;
          contentType?: string;
          uploadUrl?: string;
        } | null;
        if (
          !prepareResponse.ok ||
          !prepared?.attachmentId ||
          !prepared.contentType ||
          !prepared.uploadUrl
        ) {
          throw new Error(
            await readError(prepareResponse, `Could not upload ${file.name}.`),
          );
        }
        const uploadResponse = await fetch(prepared.uploadUrl, {
          body: file,
          headers: { "Content-Type": prepared.contentType },
          method: "PUT",
        });
        if (!uploadResponse.ok) {
          throw new Error(`Could not upload ${file.name}.`);
        }
        const completeResponse = await fetch(
          API_ROUTES.content.completeAttachment(prepared.attachmentId),
          { method: "POST" },
        );
        if (!completeResponse.ok) {
          throw new Error(
            await readError(completeResponse, `Could not finish ${file.name}.`),
          );
        }
      }
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
      setIsUploading(false);
    }
  }

  async function remove(attachmentId: string) {
    setBusyId(attachmentId);
    setError(null);
    try {
      const response = await fetch(
        API_ROUTES.content.attachment(attachmentId),
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error(
          await readError(response, "Could not delete the file."),
        );
      }
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the file.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="border-b border-foreground py-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Paperclip className="h-4 w-4" />
          Files
        </h2>
        {canEdit ? (
          <>
            <input
              className="sr-only"
              multiple
              onChange={(event) => void upload(event.target.files)}
              ref={inputRef}
              type="file"
            />
            <Button
              className="gap-2 shadow-none"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "Uploading" : "Upload"}
            </Button>
          </>
        ) : null}
      </div>
      {attachments.length ? (
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {attachments.map((attachment) => (
            <li
              className="flex min-h-11 items-center justify-between gap-3 py-2"
              key={attachment.id}
            >
              <a
                className="min-w-0 font-medium underline underline-offset-4"
                href={API_ROUTES.content.attachment(attachment.id)}
                rel="noreferrer"
                target="_blank"
              >
                <span className="block truncate">{attachment.fileName}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatBytes(attachment.sizeBytes)}
                </span>
              </a>
              {canEdit ? (
                <button
                  aria-label={`Delete ${attachment.fileName}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center border border-foreground hover:bg-foreground hover:text-background disabled:opacity-50"
                  disabled={busyId === attachment.id}
                  onClick={() => void remove(attachment.id)}
                  title="Delete file"
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No files.</p>
      )}
      {error ? <p className="mt-2 text-sm font-medium">{error}</p> : null}
    </section>
  );
}
