import Link from "next/link";
import { Avatar } from "@/components/retroui/Avatar";
import { getPersonHref } from "@/lib/person-href";
import { formatCompactCurrency } from "@/lib/tasks/accountability";
import type { TaskContext } from "@/lib/tasks/task-context";

interface TaskAssigneeCardProps {
  assigneePerson: {
    displayName: string;
    handle?: string | null;
    id: string;
    image?: string | null;
  } | null;
  assigneeOrganization: { name: string } | null;
  context: TaskContext;
}

export function TaskAssigneeCard({
  assigneePerson,
  assigneeOrganization,
  context,
}: TaskAssigneeCardProps) {
  const profile = context.assigneeProfile;
  const displayName = assigneePerson?.displayName ?? assigneeOrganization?.name;
  if (!displayName) return null;
  const personHref = assigneePerson ? getPersonHref(assigneePerson) : null;

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const avatar = (
    <Avatar className="h-10 w-10 shrink-0 border-2 border-foreground">
      {assigneePerson?.image ? (
        <Avatar.Image src={assigneePerson.image} alt={displayName} />
      ) : null}
      <Avatar.Fallback className="text-sm font-black uppercase">
        {initials || "?"}
      </Avatar.Fallback>
    </Avatar>
  );

  return (
    <div className="flex flex-wrap items-center gap-3 border-2 border-foreground bg-background px-3 py-2 text-sm font-bold">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
        Assignee
      </span>
      {personHref ? (
        <Link
          href={personHref}
          className="flex items-center gap-2 hover:underline"
          aria-label={`Open ${displayName}`}
        >
          {avatar}
          <span className="font-black uppercase">{displayName}</span>
        </Link>
      ) : (
        <div className="flex items-center gap-2">
          {avatar}
          <span className="font-black uppercase">{displayName}</span>
        </div>
      )}
      {profile?.role ? (
        <>
          <span className="text-muted-foreground">·</span>
          <span>{profile.role}</span>
        </>
      ) : null}
      {profile?.employerLabel ? (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{profile.employerLabel}</span>
        </>
      ) : null}
      {profile?.budgetUsdPerYear != null ? (
        <>
          <span className="text-muted-foreground">·</span>
          <span>
            {profile.budgetLabel ?? "Budget"}:{" "}
            {formatCompactCurrency(profile.budgetUsdPerYear)}/yr
          </span>
        </>
      ) : null}
    </div>
  );
}
