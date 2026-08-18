"use client";

import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  CollectionRecordsGrid,
  type CollectionField,
  type CollectionRecord,
  type CollectionView,
} from "@/components/collections/collection-records-grid";
import { Button } from "@/components/retroui/Button";
import { Checkbox } from "@/components/retroui/Checkbox";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Select } from "@/components/retroui/Select";
import { Textarea } from "@/components/retroui/Textarea";
import { API_ROUTES } from "@/lib/api-routes";

const EDITABLE_TYPES = new Set([
  "BOOLEAN",
  "DATE",
  "EMAIL",
  "MULTI_SELECT",
  "NUMBER",
  "RICH_TEXT",
  "SELECT",
  "TEXT",
  "URL",
]);

function optionValues(options: unknown): string[] {
  if (!options || typeof options !== "object" || Array.isArray(options))
    return [];
  const values = (options as { options?: unknown }).options;
  if (!Array.isArray(values)) return [];
  return values.flatMap((option) => {
    if (typeof option === "string") return [option];
    if (!option || typeof option !== "object" || Array.isArray(option))
      return [];
    const row = option as { id?: unknown; name?: unknown };
    if (typeof row.name === "string") return [row.name];
    if (typeof row.id === "string") return [row.id];
    return [];
  });
}

function initialValues(
  fields: CollectionField[],
  record: CollectionRecord | null,
) {
  return Object.fromEntries(
    fields
      .filter((field) => EDITABLE_TYPES.has(field.type))
      .map((field) => {
        const current = record?.values[field.key];
        if (field.type === "BOOLEAN") return [field.key, current === true];
        if (field.type === "MULTI_SELECT") {
          return [field.key, Array.isArray(current) ? current.join(", ") : ""];
        }
        return [field.key, current == null ? "" : String(current)];
      }),
  );
}

function normalizedValues(
  fields: CollectionField[],
  values: Record<string, unknown>,
  changedKeys?: ReadonlySet<string>,
) {
  return Object.fromEntries(
    fields
      .filter(
        (field) =>
          EDITABLE_TYPES.has(field.type) &&
          (!changedKeys || changedKeys.has(field.key)),
      )
      .map((field) => {
        const value = values[field.key];
        if (field.type === "BOOLEAN") return [field.key, value === true];
        if (field.type === "NUMBER") {
          if (String(value ?? "").trim() === "") return [field.key, null];
          return [field.key, Number(value)];
        }
        if (field.type === "MULTI_SELECT") {
          return [
            field.key,
            String(value ?? "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          ];
        }
        return [field.key, String(value ?? "").trim() || null];
      }),
  );
}

function RecordField({
  field,
  onChange,
  value,
}: {
  field: CollectionField;
  onChange: (value: unknown) => void;
  value: unknown;
}) {
  if (field.type === "BOOLEAN") {
    return (
      <label className="flex items-center gap-2 text-sm font-medium">
        <Checkbox
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked === true)}
        />
        {field.name}
      </label>
    );
  }
  const options = optionValues(field.options);
  if (field.type === "SELECT" && options.length) {
    return (
      <label className="block space-y-1 text-sm font-bold">
        {field.name}
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <Select.Trigger className="w-full rounded-none shadow-none">
            <Select.Value placeholder="Choose" />
          </Select.Trigger>
          <Select.Content>
            {options.map((option) => (
              <Select.Item key={option} value={option}>
                {option}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </label>
    );
  }
  if (field.type === "RICH_TEXT") {
    return (
      <label className="block space-y-1 text-sm font-bold">
        {field.name}
        <Textarea
          className="min-h-28 rounded-none shadow-none"
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
          value={String(value ?? "")}
        />
      </label>
    );
  }
  return (
    <label className="block space-y-1 text-sm font-bold">
      {field.name}
      <Input
        className="rounded-none shadow-none"
        inputMode={field.type === "NUMBER" ? "decimal" : undefined}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
        type={
          field.type === "DATE"
            ? "date"
            : field.type === "EMAIL"
              ? "email"
              : field.type === "NUMBER"
                ? "number"
                : field.type === "URL"
                  ? "url"
                  : "text"
        }
        step={field.type === "NUMBER" ? "any" : undefined}
        value={String(value ?? "")}
      />
      {field.type === "MULTI_SELECT" ? (
        <span className="block text-xs font-normal text-muted-foreground">
          Separate values with commas.
        </span>
      ) : null}
    </label>
  );
}

export function CollectionRecordsClient({
  canEdit,
  canSaveView,
  collectionId,
  collectionName,
  fields,
  focusedRecordId,
  initialNextCursor,
  initialRecords,
  initialView,
  views,
}: {
  canEdit: boolean;
  canSaveView: boolean;
  collectionId: string;
  collectionName?: string;
  fields: CollectionField[];
  focusedRecordId: string | null;
  initialNextCursor: string | null;
  initialRecords: CollectionRecord[];
  initialView: CollectionView | null;
  views: CollectionView[];
}) {
  const [editing, setEditing] = useState<CollectionRecord | null>(null);
  const [changedKeys, setChangedKeys] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState(initialRecords);
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    initialValues(fields, null),
  );
  const recordsContextKey = useMemo(
    () =>
      [
        collectionId,
        initialView?.id ?? "no-view",
        initialView?.version ?? 0,
        focusedRecordId ?? "no-focus",
        initialNextCursor ?? "no-cursor",
        ...initialRecords.map((record) => `${record.id}:${record.version}`),
      ].join("|"),
    [
      collectionId,
      focusedRecordId,
      initialNextCursor,
      initialRecords,
      initialView?.id,
      initialView?.version,
    ],
  );
  const orderedFields = useMemo(
    () => [...fields].sort((left, right) => left.position - right.position),
    [fields],
  );
  const hasEditableFields = orderedFields.some((field) =>
    EDITABLE_TYPES.has(field.type),
  );

  useEffect(() => {
    setRecords(initialRecords);
    setEditing(null);
    setOpen(false);
    setError(null);
  }, [initialRecords, recordsContextKey]);

  const beginEdit = useCallback(
    (record: CollectionRecord | null) => {
      setEditing(record);
      setValues(initialValues(fields, record));
      setChangedKeys(new Set());
      setError(null);
      setOpen(true);
    },
    [fields],
  );
  const addRecords = useCallback((loaded: CollectionRecord[]) => {
    setRecords((current) => {
      const existing = new Set(current.map((record) => record.id));
      return [
        ...current,
        ...loaded.filter((record) => !existing.has(record.id)),
      ];
    });
  }, []);
  const replaceRecords = useCallback((loaded: CollectionRecord[]) => {
    setRecords(loaded);
  }, []);
  const updateRecord = useCallback((updated: CollectionRecord) => {
    setRecords((current) =>
      current.map((record) => (record.id === updated.id ? updated : record)),
    );
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    if (editing && changedKeys.size === 0) {
      setOpen(false);
      setEditing(null);
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(
        editing
          ? API_ROUTES.collections.record(collectionId, editing.id)
          : API_ROUTES.collections.records(collectionId),
        {
          body: JSON.stringify({
            ...(editing ? { expectedVersion: editing.version } : {}),
            values: normalizedValues(
              fields,
              values,
              editing ? changedKeys : undefined,
            ),
          }),
          headers: {
            "Content-Type": "application/json",
            ...(!editing ? { "Idempotency-Key": crypto.randomUUID() } : {}),
          },
          method: "POST",
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        record?: CollectionRecord;
      } | null;
      if (!response.ok || !payload?.record) {
        throw new Error(payload?.error ?? "Could not save the record.");
      }
      setRecords((current) =>
        editing
          ? current.map((record) =>
              record.id === payload.record!.id ? payload.record! : record,
            )
          : [...current, payload.record!],
      );
      setOpen(false);
      setEditing(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the record.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="py-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-bold">Records</h2>
        {canEdit && hasEditableFields ? (
          <Button
            className="gap-2 shadow-none"
            onClick={() => beginEdit(null)}
            size="sm"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add row
          </Button>
        ) : null}
      </div>

      <CollectionRecordsGrid
        canEdit={canEdit}
        canSaveView={canSaveView}
        collectionId={collectionId}
        collectionName={collectionName}
        fields={orderedFields}
        focusedRecordId={focusedRecordId}
        initialNextCursor={initialNextCursor}
        initialView={initialView}
        key={recordsContextKey}
        views={views}
        onEditRecord={beginEdit}
        onRecordsAdded={addRecords}
        onRecordsReplaced={replaceRecords}
        onRecordUpdated={updateRecord}
        records={records}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Content
          className="max-h-[min(44rem,calc(100vh-2rem))] w-[min(38rem,calc(100vw-2rem))] overflow-y-auto border-2 border-foreground bg-background text-foreground shadow-none"
          size="screen"
          title={editing ? "Edit row" : "Add row"}
        >
          <form onSubmit={(event) => void save(event)}>
            <Dialog.Header
              asChild
              className="border-b-2 border-foreground bg-background px-4 py-3 text-foreground"
            >
              <div className="flex w-full items-center justify-between gap-4">
                <h2 className="text-xl font-bold">
                  {editing ? "Edit row" : "Add row"}
                </h2>
                <Dialog.Close className="flex h-9 w-9 items-center justify-center border border-foreground hover:bg-foreground hover:text-background">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Dialog.Close>
              </div>
            </Dialog.Header>
            <Dialog.Description className="sr-only">
              {editing
                ? "Edit the values in this collection row."
                : "Add a row to this collection."}
            </Dialog.Description>
            <div className="space-y-4 px-4 pb-24 pt-4">
              {orderedFields
                .filter((field) => EDITABLE_TYPES.has(field.type))
                .map((field) => (
                  <RecordField
                    field={field}
                    key={field.id}
                    onChange={(value) => {
                      setChangedKeys((current) =>
                        new Set(current).add(field.key),
                      );
                      setValues((current) => ({
                        ...current,
                        [field.key]: value,
                      }));
                    }}
                    value={values[field.key]}
                  />
                ))}
              {orderedFields.some(
                (field) => !EDITABLE_TYPES.has(field.type),
              ) ? (
                <p className="text-sm text-muted-foreground">
                  Linked records, files, formulas, and rollups are read-only
                  here.
                </p>
              ) : null}
              {error ? <p className="text-sm font-medium">{error}</p> : null}
            </div>
            <Dialog.Footer
              className="border-t-2 border-foreground bg-background px-4 py-3"
              position="fixed"
            >
              <Button className="shadow-none" disabled={isSaving} type="submit">
                {isSaving ? "Saving" : "Save row"}
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog>
    </section>
  );
}
