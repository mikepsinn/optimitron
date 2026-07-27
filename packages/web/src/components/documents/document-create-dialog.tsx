"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { API_ROUTES } from "@/lib/api-routes";

export function DocumentCreateDialog({
  navigateToDocument = true,
  taskId,
  triggerLabel = "New document",
}: {
  navigateToDocument?: boolean;
  taskId?: string;
  triggerLabel?: string;
} = {}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  async function create(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(API_ROUTES.documents.root, {
        body: JSON.stringify({ body, ...(taskId ? { taskId } : {}), title }),
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        document?: { id: string };
        error?: string;
      } | null;
      if (!response.ok || !payload?.document?.id) {
        throw new Error(payload?.error ?? "Could not create the document.");
      }
      setOpen(false);
      if (navigateToDocument) {
        router.push(`/documents/${payload.document.id}`);
      } else {
        setBody("");
        setTitle("");
        router.refresh();
      }
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create the document.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Button
        className="gap-2 shadow-none"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Plus className="h-4 w-4" />
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Content
          className="max-h-[min(42rem,calc(100vh-2rem))] w-[min(38rem,calc(100vw-2rem))] overflow-y-auto border-2 border-foreground bg-background text-foreground shadow-none"
          size="screen"
          title="New document"
        >
          <form onSubmit={(event) => void create(event)}>
            <Dialog.Header
              asChild
              className="border-b-2 border-foreground bg-background px-4 py-3 text-foreground"
            >
              <div className="flex w-full items-center justify-between gap-4">
                <h2 className="text-xl font-bold">New document</h2>
                <Dialog.Close className="flex h-9 w-9 items-center justify-center border border-foreground hover:bg-foreground hover:text-background">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Dialog.Close>
              </div>
            </Dialog.Header>
            <Dialog.Description className="sr-only">
              Create a private Markdown document.
            </Dialog.Description>
            <div className="space-y-4 px-4 pb-24 pt-4">
              <label className="block space-y-1 text-sm font-bold">
                Title
                <Input
                  autoFocus
                  className="rounded-none shadow-none"
                  maxLength={300}
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />
              </label>
              <label className="block space-y-1 text-sm font-bold">
                Body
                <Textarea
                  className="min-h-72 rounded-none font-mono text-sm shadow-none"
                  maxLength={500_000}
                  onChange={(event) => setBody(event.target.value)}
                  value={body}
                />
              </label>
              <p className="text-sm text-muted-foreground">
                New documents are private. Markdown is supported.
              </p>
              {error ? <p className="text-sm font-medium">{error}</p> : null}
            </div>
            <Dialog.Footer
              className="border-t-2 border-foreground bg-background px-4 py-3"
              position="fixed"
            >
              <Button
                className="shadow-none"
                disabled={isSaving || !title.trim() || !body.trim()}
                type="submit"
              >
                {isSaving ? "Creating" : "Create document"}
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog>
    </>
  );
}
