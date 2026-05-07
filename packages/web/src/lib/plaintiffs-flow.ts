import { ROUTES } from "@/lib/routes";
import type { SiteConfig } from "@/lib/site";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

export function getPlaintiffsReferendumSlug(
  site: Pick<SiteConfig, "primaryReferendumSlug">,
) {
  const slug = site.primaryReferendumSlug?.trim();
  return slug ? slug : TREATY_REFERENDUM_SLUG;
}

export function getRepresentedPersonDetailsHref(
  people: Array<{ personId?: string | null }>,
) {
  const firstPersonId = people.length === 1 ? people[0]?.personId : null;
  if (!firstPersonId) return ROUTES.plaintiffsManage;
  return `${ROUTES.plaintiffsManage}?edit=${encodeURIComponent(firstPersonId)}`;
}
