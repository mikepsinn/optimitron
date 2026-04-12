import Link from "next/link";
import { Avatar } from "@/components/retroui/Avatar";
import { getPersonHref } from "@/lib/person-href";

interface TaskAssigneeProps {
  person?: {
    id: string;
    handle?: string | null;
    displayName: string;
    image: string | null;
    currentAffiliation: string | null;
  } | null;
  organization?: {
    name: string;
    logo: string | null;
  } | null;
  roleTitle?: string | null;
  affiliationSnapshot?: string | null;
  /** "sm" for list rows (32px), "lg" for detail page (80px) */
  size?: "sm" | "lg";
}

function getFallbackInitials(label: string): string {
  return label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TaskAssignee({
  person,
  organization,
  roleTitle,
  affiliationSnapshot,
  size = "lg",
}: TaskAssigneeProps) {
  if (!person && !organization) return null;

  const label = person?.displayName ?? organization?.name ?? "Unknown";
  const imageSrc = person?.image ?? organization?.logo ?? undefined;
  const initials = getFallbackInitials(label);
  const affiliation = affiliationSnapshot ?? organization?.name ?? person?.currentAffiliation;

  const avatarSize = size === "sm" ? "h-8 w-8 border-2" : "h-20 w-20 border-4";
  const nameSize = size === "sm" ? "text-sm" : "text-2xl";

  return (
    <div className="flex items-center gap-4">
      <Avatar className={`${avatarSize} border-foreground bg-muted shrink-0`}>
        <Avatar.Image alt={label} src={imageSrc} />
        <Avatar.Fallback className="bg-brutal-pink font-black text-background">
          {initials || "?"}
        </Avatar.Fallback>
      </Avatar>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-bold uppercase text-brutal-pink">Assignee</p>
        <p className={`${nameSize} font-black`}>
          {person ? (
            <Link className="underline underline-offset-4" href={getPersonHref(person)}>
              {label}
            </Link>
          ) : (
            label
          )}
          {roleTitle ? `, ${roleTitle}` : ""}
        </p>
        {affiliation ? (
          <p className="text-sm font-bold text-muted-foreground">{affiliation}</p>
        ) : null}
      </div>
    </div>
  );
}
