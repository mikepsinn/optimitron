"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { getSignInPath, ROUTES } from "@/lib/routes";

type TaskMode = "self" | "person" | "open";

interface FixedPersonAssignee {
  id: string;
  label: string;
}

interface PersonSearchResult {
  affiliation: string | null;
  displayName: string | null;
  handle: string | null;
  headline: string | null;
  href: string;
  id: string;
  image: string | null;
  isPublicFigure: boolean;
}

interface NewPersonFields {
  currentAffiliation: string;
  email: string;
  fullName: string;
}

interface CreateTaskDialogProps {
  allowedTaskModes?: TaskMode[];
  callbackUrl?: string;
  currentPersonId?: string | null;
  dialogTitle?: string;
  fixedAssigneePerson?: FixedPersonAssignee;
  initialTaskMode?: TaskMode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  parentTaskId?: string;
  submitLabel?: string;
}

const defaultTaskModes: TaskMode[] = ["self", "open", "person"];

const emptyNewPersonFields: NewPersonFields = {
  currentAffiliation: "",
  email: "",
  fullName: "",
};

function getInitialTaskMode(
  allowedTaskModes: TaskMode[],
  initialTaskMode?: TaskMode,
) {
  if (initialTaskMode && allowedTaskModes.includes(initialTaskMode)) {
    return initialTaskMode;
  }
  return allowedTaskModes[0] ?? "self";
}

function getModeLabel(mode: TaskMode) {
  if (mode === "open") return "Anyone who can help";
  if (mode === "self") return "Me";
  return "";
}

async function readApiError(response: Response) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : "Request failed.";
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function getPersonResultLabel(person: PersonSearchResult) {
  return person.displayName ?? person.handle ?? person.id;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value.trim());
}

function isExplicitProfileIdentifier(value: string) {
  const trimmed = value.trim();
  return (
    Boolean(trimmed) &&
    !isValidEmail(trimmed) &&
    (trimmed.startsWith("@") || trimmed.includes("/people/"))
  );
}

function splitFullName(value: string) {
  const parts = value.trim().split(/\s+/u).filter(Boolean);
  if (parts.length < 2) return null;
  const [firstName, ...lastNameParts] = parts;
  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
}

export function CreateTaskDialog({
  allowedTaskModes,
  callbackUrl,
  currentPersonId,
  dialogTitle = "Create task",
  fixedAssigneePerson,
  initialTaskMode,
  onOpenChange,
  open,
  parentTaskId,
  submitLabel = "Create task",
}: CreateTaskDialogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const taskModes = useMemo(
    () => (fixedAssigneePerson ? [] : (allowedTaskModes ?? defaultTaskModes)),
    [allowedTaskModes, fixedAssigneePerson],
  );
  const defaultTaskMode = getInitialTaskMode(taskModes, initialTaskMode);
  const [taskMode, setTaskMode] = useState<TaskMode>(defaultTaskMode);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeQuery, setAssigneeQuery] = useState(
    getModeLabel(defaultTaskMode),
  );
  const [assigneeResults, setAssigneeResults] = useState<PersonSearchResult[]>(
    [],
  );
  const [selectedAssignee, setSelectedAssignee] =
    useState<PersonSearchResult | null>(null);
  const [selectedPersonIdentifier, setSelectedPersonIdentifier] = useState<
    string | null
  >(null);
  const [newPerson, setNewPerson] =
    useState<NewPersonFields>(emptyNewPersonFields);
  const [addingNewPerson, setAddingNewPerson] = useState(false);
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const [searchingAssignees, setSearchingAssignees] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldClass =
    "border border-foreground bg-background font-bold shadow-none focus:shadow-none";
  const canAssignPeople = taskModes.includes("person");
  const shouldShowEditableAssignee =
    !fixedAssigneePerson &&
    (taskModes.length > 1 || taskModes.includes("person"));
  const trimmedAssigneeQuery = assigneeQuery.trim();
  const exactPersonMatch = assigneeResults.some((person) => {
    const query = normalizeSearchValue(trimmedAssigneeQuery);
    return (
      normalizeSearchValue(getPersonResultLabel(person)) === query ||
      normalizeSearchValue(person.handle ?? "") === query.replace(/^@/u, "")
    );
  });
  const canOfferNewPerson =
    canAssignPeople &&
    trimmedAssigneeQuery.length >= 2 &&
    !trimmedAssigneeQuery.startsWith("@") &&
    !trimmedAssigneeQuery.includes("/") &&
    !isValidEmail(trimmedAssigneeQuery) &&
    !exactPersonMatch;

  useEffect(() => {
    if (
      !open ||
      !canAssignPeople ||
      selectedAssignee ||
      selectedPersonIdentifier ||
      addingNewPerson ||
      taskMode !== "person"
    ) {
      setAssigneeResults([]);
      setSearchingAssignees(false);
      return;
    }

    const query = trimmedAssigneeQuery;
    if (query.length < 2) {
      setAssigneeResults([]);
      setSearchingAssignees(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setSearchingAssignees(true);
      void fetch(`/api/people/search?q=${encodeURIComponent(query)}`, {
        headers: { Accept: "application/json" },
      })
        .then(async (response) => {
          if (!response.ok) return [];
          const body = (await response.json()) as {
            data?: PersonSearchResult[];
          };
          return body.data ?? [];
        })
        .then((people) => {
          if (!cancelled) setAssigneeResults(people);
        })
        .catch(() => {
          if (!cancelled) setAssigneeResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearchingAssignees(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    addingNewPerson,
    canAssignPeople,
    open,
    selectedAssignee,
    selectedPersonIdentifier,
    taskMode,
    trimmedAssigneeQuery,
  ]);

  function resetTaskForm() {
    setTaskMode(defaultTaskMode);
    setTitle("");
    setDescription("");
    setAssigneeQuery(getModeLabel(defaultTaskMode));
    setAssigneeResults([]);
    setSelectedAssignee(null);
    setSelectedPersonIdentifier(null);
    setNewPerson(emptyNewPersonFields);
    setAddingNewPerson(false);
    setAssigneeMenuOpen(false);
    setSearchingAssignees(false);
    setError(null);
  }

  function selectSelf() {
    setTaskMode("self");
    setAssigneeQuery("Me");
    setSelectedAssignee(null);
    setSelectedPersonIdentifier(null);
    setNewPerson(emptyNewPersonFields);
    setAddingNewPerson(false);
    setAssigneeMenuOpen(false);
    setError(null);
  }

  function selectOpen() {
    setTaskMode("open");
    setAssigneeQuery("Anyone who can help");
    setSelectedAssignee(null);
    setSelectedPersonIdentifier(null);
    setNewPerson(emptyNewPersonFields);
    setAddingNewPerson(false);
    setAssigneeMenuOpen(false);
    setError(null);
  }

  function selectPerson(person: PersonSearchResult) {
    setTaskMode("person");
    setAssigneeQuery(getPersonResultLabel(person));
    setSelectedAssignee(person);
    setSelectedPersonIdentifier(null);
    setNewPerson(emptyNewPersonFields);
    setAddingNewPerson(false);
    setAssigneeMenuOpen(false);
    setError(null);
  }

  function selectProfileIdentifier(identifier: string) {
    setTaskMode("person");
    setAssigneeQuery(identifier);
    setSelectedAssignee(null);
    setSelectedPersonIdentifier(identifier);
    setNewPerson(emptyNewPersonFields);
    setAddingNewPerson(false);
    setAssigneeMenuOpen(false);
    setError(null);
  }

  function selectNewPerson() {
    setTaskMode("person");
    setSelectedAssignee(null);
    setSelectedPersonIdentifier(null);
    setNewPerson((current) => ({
      ...current,
      fullName: current.fullName || trimmedAssigneeQuery,
    }));
    setAddingNewPerson(true);
    setAssigneeMenuOpen(false);
    setError(null);
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    const parsedNewPersonName = addingNewPerson
      ? splitFullName(newPerson.fullName)
      : null;

    if (!fixedAssigneePerson) {
      // Add subtask (parentTaskId set) creates work implicitly for the current
      // user without an explicit assignee — the server rejects any assignee
      // on a parented task — so self mode does not need currentPersonId here.
      if (taskMode === "self" && !currentPersonId && !parentTaskId) {
        setError("Choose who should do it.");
        return;
      }

      if (taskMode === "person") {
        if (addingNewPerson) {
          if (!parsedNewPersonName) {
            setError("Enter the person's first and last name.");
            return;
          }
          if (!isValidEmail(newPerson.email)) {
            setError("Enter the person's email address.");
            return;
          }
        } else if (
          !selectedAssignee &&
          !selectedPersonIdentifier &&
          !isExplicitProfileIdentifier(trimmedAssigneeQuery)
        ) {
          setError("Choose an assignee or add a new person.");
          return;
        }
      }
    }

    try {
      setCreating(true);
      setError(null);
      const explicitIdentifier =
        selectedPersonIdentifier ??
        (isExplicitProfileIdentifier(trimmedAssigneeQuery)
          ? trimmedAssigneeQuery
          : undefined);
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneePersonInvite:
            !fixedAssigneePerson &&
            taskMode === "person" &&
            addingNewPerson &&
            parsedNewPersonName
              ? {
                  currentAffiliation:
                    newPerson.currentAffiliation.trim() || undefined,
                  email: newPerson.email.trim(),
                  firstName: parsedNewPersonName.firstName,
                  lastName: parsedNewPersonName.lastName,
                }
              : undefined,
          assigneePersonIdentifier:
            !fixedAssigneePerson &&
            taskMode === "person" &&
            !selectedAssignee &&
            !addingNewPerson
              ? explicitIdentifier
              : undefined,
          assigneePersonId: fixedAssigneePerson
            ? fixedAssigneePerson.id
            : taskMode === "self" && !parentTaskId
              ? currentPersonId
              : selectedAssignee?.id,
          claimPolicy: taskMode === "open" ? "OPEN_SINGLE" : undefined,
          description: description.trim(),
          isPublic: fixedAssigneePerson ? true : taskMode !== "self",
          parentTaskId,
          title: trimmedTitle,
        }),
      });

      if (response.status === 401) {
        router.push(getSignInPath(callbackUrl ?? pathname ?? ROUTES.tasks));
        return;
      }

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const body = (await response.json()) as { data?: { id?: string } };
      const taskId = body.data?.id;
      onOpenChange(false);
      resetTaskForm();
      if (taskId) {
        router.push(`/tasks/${taskId}`);
      } else {
        router.push(ROUTES.tasks);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetTaskForm();
      }}
    >
      <Dialog.Content
        title={dialogTitle}
        size="screen"
        className="max-h-[min(42rem,calc(100vh-2rem))] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto border-2 border-foreground bg-background text-foreground shadow-none"
      >
        <form onSubmit={(event) => void createTask(event)}>
          <Dialog.Header
            asChild
            className="border-b-2 border-foreground bg-background px-4 py-3 text-foreground"
          >
            <div className="flex w-full items-center justify-between gap-4">
              <h2 className="text-xl font-black uppercase leading-tight">
                {dialogTitle}
              </h2>
              <Dialog.Close className="flex h-9 w-9 items-center justify-center border border-foreground bg-background text-foreground hover:bg-foreground hover:text-background">
                <X className="h-4 w-4 stroke-[2.5px]" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>
          </Dialog.Header>

          <div className="space-y-4 px-4 pb-24 pt-4">
            <label className="block space-y-1">
              <span className="text-xs font-black uppercase tracking-[0.12em]">
                Title
              </span>
              <Input
                className={fieldClass}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What needs doing?"
                value={title}
              />
            </label>

            {fixedAssigneePerson ? (
              <div className="border border-foreground px-3 py-2">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                  Who should do it?
                </p>
                <p className="mt-1 text-sm font-black text-foreground">
                  {fixedAssigneePerson.label}
                </p>
              </div>
            ) : shouldShowEditableAssignee ? (
              <div className="relative space-y-1">
                <label
                  className="text-xs font-black uppercase tracking-[0.12em]"
                  htmlFor="task-assignee-picker"
                >
                  Who should do it?
                </label>
                <Input
                  autoComplete="off"
                  className={fieldClass}
                  id="task-assignee-picker"
                  onBlur={() => {
                    window.setTimeout(() => setAssigneeMenuOpen(false), 120);
                  }}
                  onChange={(event) => {
                    setAssigneeQuery(event.target.value);
                    setTaskMode("person");
                    setSelectedAssignee(null);
                    setSelectedPersonIdentifier(null);
                    setAddingNewPerson(false);
                    setAssigneeMenuOpen(true);
                    setError(null);
                  }}
                  onFocus={(event) => {
                    setAssigneeMenuOpen(true);
                    event.currentTarget.select();
                  }}
                  placeholder="Search people or choose..."
                  value={assigneeQuery}
                />

                {assigneeMenuOpen ? (
                  <div className="absolute left-0 right-0 z-50 border border-foreground bg-background shadow-none">
                    {taskModes.includes("self") ? (
                      <button
                        className="block w-full border-b border-foreground px-3 py-2 text-left hover:bg-muted"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectSelf();
                        }}
                        type="button"
                      >
                        <span className="block text-sm font-black">Me</span>
                        <span className="block text-xs font-bold text-muted-foreground">
                          Put this on your own task list.
                        </span>
                      </button>
                    ) : null}

                    {taskModes.includes("open") ? (
                      <button
                        className="block w-full border-b border-foreground px-3 py-2 text-left hover:bg-muted"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectOpen();
                        }}
                        type="button"
                      >
                        <span className="block text-sm font-black">
                          Anyone who can help
                        </span>
                        <span className="block text-xs font-bold text-muted-foreground">
                          Leave it open until the right human claims it.
                        </span>
                      </button>
                    ) : null}

                    {searchingAssignees ? (
                      <p className="border-b border-foreground px-3 py-2 text-xs font-bold text-muted-foreground">
                        Searching
                      </p>
                    ) : null}

                    {assigneeResults.map((person) => (
                      <button
                        className="block w-full border-b border-foreground px-3 py-2 text-left hover:bg-muted"
                        key={person.id}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectPerson(person);
                        }}
                        type="button"
                      >
                        <span className="block truncate text-sm font-black text-foreground">
                          {getPersonResultLabel(person)}
                        </span>
                        <span className="block truncate text-xs font-bold text-muted-foreground">
                          {person.handle ? `@${person.handle}` : person.href}
                        </span>
                        {(person.headline ?? person.affiliation) ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {person.headline ?? person.affiliation}
                          </span>
                        ) : null}
                      </button>
                    ))}

                    {canAssignPeople &&
                    isExplicitProfileIdentifier(trimmedAssigneeQuery) ? (
                      <button
                        className="block w-full border-b border-foreground px-3 py-2 text-left hover:bg-muted"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectProfileIdentifier(trimmedAssigneeQuery);
                        }}
                        type="button"
                      >
                        <span className="block truncate text-sm font-black">
                          Use {trimmedAssigneeQuery}
                        </span>
                        <span className="block text-xs font-bold text-muted-foreground">
                          Assign this to the pasted public profile.
                        </span>
                      </button>
                    ) : null}

                    {canOfferNewPerson ? (
                      <button
                        className="block w-full px-3 py-2 text-left hover:bg-muted"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectNewPerson();
                        }}
                        type="button"
                      >
                        <span className="block truncate text-sm font-black">
                          Add &quot;{trimmedAssigneeQuery}&quot; as a new person
                        </span>
                        <span className="block text-xs font-bold text-muted-foreground">
                          Use this only if they are not already here.
                        </span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="border border-foreground px-3 py-2">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                  Who should do it?
                </p>
                <p className="mt-1 text-sm font-black text-foreground">
                  {getModeLabel(defaultTaskMode)}
                </p>
              </div>
            )}

            {addingNewPerson ? (
              <div className="space-y-3 border border-foreground p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                  New person
                </p>
                <label className="block space-y-1">
                  <span className="text-xs font-black uppercase tracking-[0.12em]">
                    Name
                  </span>
                  <Input
                    className={fieldClass}
                    onChange={(event) => {
                      setNewPerson((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }));
                      setError(null);
                    }}
                    placeholder="First Last"
                    value={newPerson.fullName}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-black uppercase tracking-[0.12em]">
                    Email
                  </span>
                  <Input
                    className={fieldClass}
                    onChange={(event) => {
                      setNewPerson((current) => ({
                        ...current,
                        email: event.target.value,
                      }));
                      setError(null);
                    }}
                    placeholder="name@example.org"
                    type="email"
                    value={newPerson.email}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-black uppercase tracking-[0.12em]">
                    Affiliation, optional
                  </span>
                  <Input
                    className={fieldClass}
                    onChange={(event) => {
                      setNewPerson((current) => ({
                        ...current,
                        currentAffiliation: event.target.value,
                      }));
                      setError(null);
                    }}
                    placeholder="Organization or role"
                    value={newPerson.currentAffiliation}
                  />
                </label>
              </div>
            ) : null}

            <label className="block space-y-1">
              <span className="text-xs font-black uppercase tracking-[0.12em]">
                Description
              </span>
              <Textarea
                className={fieldClass}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add useful context."
                rows={addingNewPerson ? 2 : 5}
                value={description}
              />
            </label>

            {error ? (
              <p className="border border-destructive px-3 py-2 text-sm font-bold text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <Dialog.Footer
            position="fixed"
            className="border-t-2 border-foreground bg-background px-4 py-3"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetTaskForm();
                onOpenChange(false);
              }}
              className="min-h-11 border border-foreground bg-background px-4 text-sm font-black uppercase text-foreground shadow-none hover:translate-x-0 hover:translate-y-0"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="min-h-11 border border-foreground bg-foreground px-4 text-sm font-black uppercase text-background shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-background hover:text-foreground disabled:opacity-60"
            >
              {creating ? "Creating" : submitLabel}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
