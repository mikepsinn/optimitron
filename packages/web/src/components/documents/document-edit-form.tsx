"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { API_ROUTES } from "@/lib/api-routes";

interface DocumentEditFormProps {
  documentId: string;
  expectedVersion: number;
  initialTitle: string;
  initialBody: string;
}

/**
 * Saving appends an immutable revision. The stable document ID does not change.
 */
export function DocumentEditForm({
  documentId,
  expectedVersion,
  initialTitle,
  initialBody,
}: DocumentEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  // Tracks the in-flight POST itself (not just the transition callback) so a
  // fast double-click can't fire two saves before the first response lands
  // and trips the (documentKey, version) unique constraint server-side.
  const [isSaving, setIsSaving] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (isSaving) return;
        setError(null);
        setIsSaving(true);
        void fetch(API_ROUTES.documents.document(documentId), {
          body: JSON.stringify({ title, body, expectedVersion }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
          .then(async (response) => {
            const payload = (await response.json().catch(() => null)) as {
              error?: string;
            } | null;

            if (!response.ok) {
              throw new Error(payload?.error ?? "Save failed.");
            }

            router.refresh();
          })
          .catch((saveError) => {
            setError(
              saveError instanceof Error ? saveError.message : "Save failed.",
            );
          })
          .finally(() => setIsSaving(false));
      }}
    >
      <label className="block text-sm font-bold">
        Title
        <Input
          className="mt-1 rounded-none shadow-none"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className="block text-sm font-bold">
        Body
        <Textarea
          className="mt-1 min-h-64 rounded-none font-mono text-sm shadow-none"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <Button className="shadow-none" disabled={isSaving} type="submit">
        {isSaving ? "Saving" : "Save"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Saving makes a new version. Old versions stay.
      </p>
      {error ? (
        <p className="text-sm font-medium text-foreground">{error}</p>
      ) : null}
    </form>
  );
}
