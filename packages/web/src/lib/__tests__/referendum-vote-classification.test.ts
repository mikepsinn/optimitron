import { describe, expect, it } from "vitest";
import {
  buildMemorialReferendumVoteWhere,
  buildOfficialReferendumVoteWhere,
  buildRepresentedReferendumVoteWhere,
} from "@/lib/referendum-vote-classification.server";

describe("referendum vote classification", () => {
  it("builds official count filters that exclude represented and deceased votes", () => {
    expect(
      buildOfficialReferendumVoteWhere({
        answer: "YES",
        publicOnly: true,
        referendumId: "ref_1",
      }),
    ).toEqual({
      answer: "YES",
      deletedAt: null,
      isPublic: true,
      person: {
        deletedAt: null,
        isPublic: true,
        lifeStatus: "LIVING",
      },
      referendumId: "ref_1",
      voteSource: "SELF",
    });
  });

  it("builds represented count filters for living or unknown people only", () => {
    expect(
      buildRepresentedReferendumVoteWhere({
        answer: "YES",
        publicOnly: true,
        referendumId: "ref_1",
      }),
    ).toEqual({
      answer: "YES",
      deletedAt: null,
      isPublic: true,
      person: {
        deletedAt: null,
        isPublic: true,
        lifeStatus: { in: ["UNKNOWN", "LIVING"] },
      },
      referendumId: "ref_1",
      voteSource: "REPRESENTED",
    });
  });

  it("builds memorial vote filters that require public memorial consent", () => {
    expect(
      buildMemorialReferendumVoteWhere({
        answer: "YES",
        publicOnly: true,
        referendumId: "ref_1",
      }),
    ).toEqual({
      answer: "YES",
      deletedAt: null,
      isPublic: true,
      person: {
        deletedAt: null,
        isPublic: true,
        lifeStatus: "DECEASED",
        memorial: {
          deletedAt: null,
          isPublic: true,
          submissions: {
            some: {
              consentPublicDisplay: true,
              deletedAt: null,
              isPublic: true,
            },
          },
        },
      },
      referendumId: "ref_1",
      voteSource: "REPRESENTED",
    });
  });
});
