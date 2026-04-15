import { onePercentTreatyContent } from "./one-percent-treaty";
import type {
  ReferendumSiteContent,
  ReferendumSiteContentKey,
} from "./types";

const DEFAULT_CONTENT_KEY: ReferendumSiteContentKey = "onePercentTreaty";

const SITE_CONTENTS: Record<ReferendumSiteContentKey, ReferendumSiteContent> = {
  onePercentTreaty: onePercentTreatyContent,
};

export function getReferendumSiteContent(
  key?: ReferendumSiteContentKey | null,
): ReferendumSiteContent {
  return SITE_CONTENTS[key ?? DEFAULT_CONTENT_KEY];
}

export type {
  ReferendumSiteContent,
  ReferendumSiteContentKey,
  ReferendumSitePageKey,
} from "./types";
