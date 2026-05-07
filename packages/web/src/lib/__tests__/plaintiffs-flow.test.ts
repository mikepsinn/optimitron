import { describe, expect, it } from "vitest";
import {
  getPlaintiffsReferendumSlug,
  getRepresentedPersonDetailsHref,
} from "@/lib/plaintiffs-flow";

describe("plaintiffs flow", () => {
  it("uses the treaty referendum when the current site has no primary referendum", () => {
    expect(getPlaintiffsReferendumSlug({ primaryReferendumSlug: null })).toBe(
      "one-percent-treaty",
    );
  });

  it("keeps site-specific primary referendums when present", () => {
    expect(
      getPlaintiffsReferendumSlug({
        primaryReferendumSlug: "humanity-v-government",
      }),
    ).toBe("humanity-v-government");
  });

  it("deep-links a single saved plaintiff to the edit/details page", () => {
    expect(getRepresentedPersonDetailsHref([{ personId: "person_1" }])).toBe(
      "/plaintiffs/manage?edit=person_1",
    );
  });

  it("sends multiple saved plaintiffs to the manage list", () => {
    expect(
      getRepresentedPersonDetailsHref([
        { personId: "person_1" },
        { personId: "person_2" },
      ]),
    ).toBe("/plaintiffs/manage");
  });
});
