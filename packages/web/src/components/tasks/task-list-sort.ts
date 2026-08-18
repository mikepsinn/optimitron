export function compareTaskListValues(
  a: TaskSortIdentity,
  b: TaskSortIdentity,
  valA: string | number,
  valB: string | number,
  sortDir: "asc" | "desc",
): number {
  const primaryDelta =
    typeof valA === "string" && typeof valB === "string"
      ? sortDir === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA)
      : sortDir === "asc"
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);

  return primaryDelta || compareTaskIdentity(a, b);
}

interface TaskSortIdentity {
  assigneeOrganization?: { slug: string } | null;
  assigneePerson?: { displayName: string; sourceRef?: string | null } | null;
  description?: string;
  id: string;
  roleTitle?: string | null;
  sourceUrl?: string | null;
  taskKey?: string | null;
  title: string;
}

function compareTaskIdentity(a: TaskSortIdentity, b: TaskSortIdentity) {
  const stableValuesA = [
    a.title,
    a.taskKey ?? "",
    a.assigneeOrganization?.slug ?? "",
    a.assigneePerson?.sourceRef ?? a.assigneePerson?.displayName ?? "",
    a.roleTitle ?? "",
    a.description ?? "",
    a.sourceUrl ?? "",
  ];
  const stableValuesB = [
    b.title,
    b.taskKey ?? "",
    b.assigneeOrganization?.slug ?? "",
    b.assigneePerson?.sourceRef ?? b.assigneePerson?.displayName ?? "",
    b.roleTitle ?? "",
    b.description ?? "",
    b.sourceUrl ?? "",
  ];

  for (let index = 0; index < stableValuesA.length; index += 1) {
    const delta = stableValuesA[index].localeCompare(stableValuesB[index]);
    if (delta !== 0) return delta;
  }
  return a.id.localeCompare(b.id);
}
