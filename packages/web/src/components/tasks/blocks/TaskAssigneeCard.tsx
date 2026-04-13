import { Avatar } from "@/components/retroui/Avatar";
import { BrutalCard } from "@/components/ui/brutal-card";
import { formatCompactCount, formatCompactCurrency } from "@/lib/tasks/accountability";
import type { TaskContext } from "@/lib/tasks/task-context";

interface TaskAssigneeCardProps {
  assigneePerson: {
    displayName: string;
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

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <BrutalCard bgColor="background" padding="lg">
      <div className="space-y-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-pink">
          Task Assignment
        </p>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar className="h-32 w-32 shrink-0 border-4 border-foreground">
            {assigneePerson?.image ? (
              <Avatar.Image src={assigneePerson.image} alt={displayName} />
            ) : null}
            <Avatar.Fallback className="text-3xl font-black uppercase">
              {initials || "?"}
            </Avatar.Fallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-3xl font-black uppercase leading-tight">
                {displayName}
              </h2>
              {profile?.role ? (
                <p className="text-sm font-bold uppercase text-muted-foreground">
                  {profile.role}
                </p>
              ) : null}
              {profile?.employerLabel ? (
                <p className="text-sm font-bold uppercase text-muted-foreground">
                  {profile.employerLabel}
                </p>
              ) : null}
            </div>
            {(profile?.employerCount != null ||
              profile?.salaryUsdPerYear != null ||
              profile?.budgetUsdPerYear != null) ? (
              <dl className="grid grid-cols-1 gap-2 text-sm font-bold sm:grid-cols-2">
                {profile.employerCount != null ? (
                  <div>
                    <dt className="text-xs font-black uppercase text-muted-foreground">
                      Employer
                    </dt>
                    <dd>
                      {formatCompactCount(profile.employerCount)}
                      {profile.employerCountLabel ? ` ${profile.employerCountLabel}` : ""}
                    </dd>
                  </div>
                ) : null}
                {profile.salaryUsdPerYear != null ? (
                  <div>
                    <dt className="text-xs font-black uppercase text-muted-foreground">
                      Salary
                    </dt>
                    <dd>{formatCompactCurrency(profile.salaryUsdPerYear)}/yr</dd>
                  </div>
                ) : null}
                {profile.budgetUsdPerYear != null ? (
                  <div>
                    <dt className="text-xs font-black uppercase text-muted-foreground">
                      {profile.budgetLabel ?? "Budget"}
                    </dt>
                    <dd>{formatCompactCurrency(profile.budgetUsdPerYear)}/yr</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            {profile?.jobQuote ? (
              <blockquote className="border-l-4 border-foreground pl-3 text-sm font-bold italic">
                &ldquo;{profile.jobQuote.text}&rdquo;
                <footer className="mt-1 text-xs font-black uppercase not-italic text-muted-foreground">
                  — {profile.jobQuote.source}
                </footer>
              </blockquote>
            ) : null}
          </div>
        </div>
      </div>
    </BrutalCard>
  );
}
