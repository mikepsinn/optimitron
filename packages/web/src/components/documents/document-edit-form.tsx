"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { API_ROUTES } from "@/lib/api-routes";

interface DocumentEditFormProps {
  documentId: string;
  initialTitle: string;
  initialBody: string;
}

/**
 * Creator-only editor. Saving writes a NEW version row server-side; the old
 * version stays readable in the version list.
 */
export function DocumentEditForm({
  documentId,
  initialTitle,
  initialBody,
}: DocumentEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(() => {
          void fetch(API_ROUTES.documents.document(documentId), {
            body: JSON.stringify({ title, body }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          })
            .then(async (response) => {
              const payload = (await response.json().catch(() => null)) as {
                document?: { id?: string };
                error?: string;
              } | null;

              if (!response.ok) {
                throw new Error(payload?.error ?? "Save failed.");
              }

              const newId = payload?.document?.id;
              if (newId && newId !== documentId) {
                router.push(`/documents/${newId}`);
              }
              router.refresh();
            })
            .catch((saveError) => {
              setError(
                saveError instanceof Error ? saveError.message : "Save failed.",
              );
            });
        });
      }}
    >
      <label className="block text-sm font-black uppercase tracking-[0.12em]">
        Title
        <Input
          className="mt-1"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className="block text-sm font-black uppercase tracking-[0.12em]">
        Body
        <Textarea
          className="mt-1 min-h-64 font-mono text-sm"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <Button className="font-black uppercase" disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Save."}
      </Button>
      <p className="text-sm font-bold text-muted-foreground">
        Saving makes a new version. Old versions stay.
      </p>
      {error ? (
        <p className="text-sm font-bold text-foreground">{error}</p>
      ) : null}
    </form>
  );
}
