"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Checkbox } from "@/components/retroui/Checkbox";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Select } from "@/components/retroui/Select";
import { Textarea } from "@/components/retroui/Textarea";
import { API_ROUTES } from "@/lib/api-routes";

const FIELD_TYPES = [
  ["TEXT", "Text"],
  ["RICH_TEXT", "Long text"],
  ["NUMBER", "Number"],
  ["BOOLEAN", "Checkbox"],
  ["DATE", "Date"],
  ["SELECT", "Select"],
  ["MULTI_SELECT", "Multi-select"],
  ["URL", "URL"],
  ["EMAIL", "Email"],
] as const;

type FieldType = (typeof FIELD_TYPES)[number][0];

interface DraftField {
  id: string;
  name: string;
  required: boolean;
  type: FieldType;
}

function fieldKey(name: string, index: number, used: Set<string>) {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, "_")
      .replace(/^_+|_+$/gu, "") || `field_${index + 1}`;
  let key = base;
  let suffix = 2;
  while (used.has(key)) key = `${base}_${suffix++}`;
  used.add(key);
  return key;
}

export function CollectionCreateDialog() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<DraftField[]>([
    { id: crypto.randomUUID(), name: "Name", required: true, type: "TEXT" },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  function updateField(id: string, patch: Partial<DraftField>) {
    setFields((current) =>
      current.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    );
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setError(null);
    setIsSaving(true);
    try {
      const usedKeys = new Set<string>();
      const response = await fetch(API_ROUTES.collections.root, {
        body: JSON.stringify({
          description: description.trim() || null,
          fields: fields.map((field, index) => ({
            key: fieldKey(field.name, index, usedKeys),
            name: field.name,
            position: index,
            required: field.required,
            type: field.type,
          })),
          name,
        }),
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        collection?: { id: string };
        error?: string;
      } | null;
      if (!response.ok || !payload?.collection?.id) {
        throw new Error(payload?.error ?? "Could not create the collection.");
      }
      setOpen(false);
      router.push(`/collections/${payload.collection.id}`);
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create the collection.",
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
        New collection
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Content
          className="max-h-[min(44rem,calc(100vh-2rem))] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto border-2 border-foreground bg-background text-foreground shadow-none"
          size="screen"
          title="New collection"
        >
          <form onSubmit={(event) => void create(event)}>
            <Dialog.Header
              asChild
              className="border-b-2 border-foreground bg-background px-4 py-3 text-foreground"
            >
              <div className="flex w-full items-center justify-between gap-4">
                <h2 className="text-xl font-bold">New collection</h2>
                <Dialog.Close className="flex h-9 w-9 items-center justify-center border border-foreground hover:bg-foreground hover:text-background">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Dialog.Close>
              </div>
            </Dialog.Header>
            <Dialog.Description className="sr-only">
              Create a private collection and define its fields.
            </Dialog.Description>
            <div className="space-y-5 px-4 pb-24 pt-4">
              <label className="block space-y-1 text-sm font-bold">
                Name
                <Input
                  autoFocus
                  className="rounded-none shadow-none"
                  maxLength={200}
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
              </label>
              <label className="block space-y-1 text-sm font-bold">
                Description
                <Textarea
                  className="min-h-20 rounded-none shadow-none"
                  onChange={(event) => setDescription(event.target.value)}
                  value={description}
                />
              </label>
              <section>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">Fields</h3>
                  <Button
                    className="gap-2 shadow-none"
                    onClick={() =>
                      setFields((current) => [
                        ...current,
                        {
                          id: crypto.randomUUID(),
                          name: "",
                          required: false,
                          type: "TEXT",
                        },
                      ])
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Add field
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  {fields.map((field) => (
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_9rem_auto] items-center gap-2"
                      key={field.id}
                    >
                      <Input
                        aria-label="Field name"
                        className="rounded-none shadow-none"
                        onChange={(event) =>
                          updateField(field.id, { name: event.target.value })
                        }
                        placeholder="Field name"
                        value={field.name}
                      />
                      <Select
                        onValueChange={(value) =>
                          updateField(field.id, { type: value as FieldType })
                        }
                        value={field.type}
                      >
                        <Select.Trigger className="w-full min-w-0 rounded-none shadow-none">
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          {FIELD_TYPES.map(([value, label]) => (
                            <Select.Item key={value} value={value}>
                              {label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                      <button
                        aria-label="Remove field"
                        className="flex h-10 w-10 items-center justify-center border border-foreground hover:bg-foreground hover:text-background disabled:opacity-40"
                        disabled={fields.length === 1}
                        onClick={() =>
                          setFields((current) =>
                            current.filter((item) => item.id !== field.id),
                          )
                        }
                        title="Remove field"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <label className="col-span-3 flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.required}
                          onCheckedChange={(checked) =>
                            updateField(field.id, {
                              required: checked === true,
                            })
                          }
                        />
                        Required
                      </label>
                    </div>
                  ))}
                </div>
              </section>
              {error ? <p className="text-sm font-medium">{error}</p> : null}
            </div>
            <Dialog.Footer
              className="border-t-2 border-foreground bg-background px-4 py-3"
              position="fixed"
            >
              <Button
                className="shadow-none"
                disabled={
                  isSaving ||
                  !name.trim() ||
                  fields.some((field) => !field.name.trim())
                }
                type="submit"
              >
                {isSaving ? "Creating" : "Create collection"}
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog>
    </>
  );
}
