import { onePercentTreatyContent } from "./one-percent-treaty";
import type {
  ReferendumSiteContent,
  ReferendumSiteContentKey,
} from "./types";

const SITE_CONTENTS: Record<ReferendumSiteContentKey, ReferendumSiteContent> = {
  onePercentTreaty: onePercentTreatyContent,
};

export function getReferendumSiteContent(
  key: ReferendumSiteContentKey,
): ReferendumSiteContent {
  return SITE_CONTENTS[key];
}

export function getOptionalReferendumSiteContent(
  key?: ReferendumSiteContentKey | null,
): ReferendumSiteContent | null {
  return key ? SITE_CONTENTS[key] : null;
}

export type {
  ReferendumSiteContent,
  ReferendumSiteContentKey,
  ReferendumSitePageKey,
} from "./types";
