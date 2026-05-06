"use client";

import type { Session } from "next-auth";
import {
  fmtRaw,
  shareableSnippets,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters";
import {
  COURT_OF_HUMANITY_QUESTION,
  COURT_OF_HUMANITY_TEXT,
} from "@optimitron/data/referendums";
import { splitIntoSlides } from "@/components/referendum/ReferendumStepper";
import { COURT_OF_HUMANITY_SLUG } from "@/lib/court-of-humanity";
import { DECLARATION_SLUG } from "@/lib/declaration";
import { getHandleOrReferralCode } from "@/lib/referral.client";
import { storage } from "@/lib/storage";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { getTreatyWishocraticAllocation } from "@/lib/treaty-vote";
import { buildCourtReferralUrl, buildUserReferralUrl } from "@/lib/url";

type ReferendumShareUser = {
  handle?: string | null;
  referralCode?: string | null;
};

export type ReferendumFlowKind = "declaration" | "treaty" | "membership";
export const REFERENDUM_ANSWER = {
  YES: "YES",
  NO: "NO",
} as const;
export type ReferendumAnswer =
  (typeof REFERENDUM_ANSWER)[keyof typeof REFERENDUM_ANSWER];

export interface ReferendumActionConfig {
  submitLabel: string;
  submittingLabel: string;
  authTitle: string;
  emailButtonLabel: string;
  emailPendingButtonLabel: string;
  buildShareUrl: (
    user: ReferendumShareUser | null | undefined,
    baseUrl?: string,
  ) => string;
}

export interface ReferendumConfig {
  slug: string;
  kind: ReferendumFlowKind;
  introText: string;
  slides: string[];
  backgroundImages?: string[];
  audioManifestPath?: string;
  audioBasePath?: string;
  title: string;
  authPromptText: string;
  authCallbackUrl: string;
  shareText: string;
  emailSubject: string;
  signedTitle: string;
  signedBody: string;
  action: ReferendumActionConfig;
  showPrivacyToggle?: boolean;
  storePendingVote: (
    name: string | undefined,
    referralCode: string | null,
    answer: ReferendumAnswer,
  ) => void;
  clearPendingVote: () => void;
  syncPending: (session?: Session | null) => Promise<void>;
}

const signAction: ReferendumActionConfig = {
  submitLabel: "Sign",
  submittingLabel: "...",
  authTitle: "Finish Signing",
  emailButtonLabel: "Email Me a Link to Finish Signing",
  emailPendingButtonLabel: "Sending Finish-Signing Link...",
  buildShareUrl: buildUserReferralUrl,
};

const joinAction: ReferendumActionConfig = {
  submitLabel: "Join",
  submittingLabel: "Joining...",
  authTitle: "Finish Joining",
  emailButtonLabel: "Email Me a Link to Finish Joining",
  emailPendingButtonLabel: "Sending Finish-Joining Link...",
  buildShareUrl: buildCourtReferralUrl,
};

async function postVote(
  slug: string,
  answer: string,
  referredBy: string | null,
  inviteToken?: string | null,
  orgContextToken?: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/referendums/${slug}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer,
        ref: referredBy ?? undefined,
        inviteToken: inviteToken ?? undefined,
        orgContextToken: orgContextToken ?? undefined,
        // Full URL the voter was on at submit time. Server stores as
        // ReferendumVote.originUrl for variant + UTM forensics.
        originUrl:
          typeof window !== "undefined" ? window.location.href : undefined,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function cacheVoteStatus(
  session: Session | null | undefined,
  answer: string,
): void {
  const referralIdentifier = getHandleOrReferralCode(session?.user);
  if (referralIdentifier) {
    storage.setVoteStatusCache({
      hasVoted: true,
      voteAnswer: answer,
      referralCode: referralIdentifier,
    });
  }
}

const DECLARATION_IMAGES = [
  "0_rixHj5ph0bilU4VA.webp",
  "hiroshima-aftermath.jpg",
  "3782620400000578-0-image-a-16_1471952820321.jpg",
  "65c0fef9ef3488e746cfe61f6e9a99e3.jpg",
  "nagasaki-mushroom.jpg",
  "abdulfalluja2_000.jpg",
  "d15361ba023fa61fc3affcbae9a144deb3-17-mosul-civilian-casualties.rsocial.w1200.webp",
  "DmWguX9U0AAT1Tz.jpg",
  "nuclear-war.jpg",
  "download.jpeg",
  "gaza-scaled.jpg",
  "The_Terror_of_War_Viet_girl_edit.jpg",
  "image546863x.jpg",
  "iraq-1158612213-612x612.jpg",
  "iraq-1530125968-612x612.jpg",
  "nuclear-war-burns.jpg",
  "iraq-1530126129-612x612.jpg",
  "iraq-171480348-612x612.jpg",
  "iraq-1731665846-612x612.jpg",
  "OmranAylan.jpg",
  "iraq-1736938930-612x612.jpg",
  "iraq-495413681-612x612.jpg",
  "iraq-615309246-612x612.jpg",
  "vietnam.jpg",
  "iraq-635233421-612x612.jpg",
  "iraq-643124034-612x612.jpg",
  "iraq-657651138-612x612.jpg",
  "iraq-871166954-612x612.jpg",
  "iraq-91878540-2048x2048.jpg",
  "iraq-928670302-612x612.jpg",
  "iraq-929098884-612x612.jpg",
].map((f) => `/images/declaration/${f}`);

async function syncPendingTreatyAllocation(): Promise<boolean> {
  const pending = storage.getPendingTreatyVote();
  const allocation = getTreatyWishocraticAllocation(pending);
  if (!allocation) return true;
  try {
    const res = await fetch("/api/wishocracy/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allocation),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const declarationConfig: ReferendumConfig = {
  slug: DECLARATION_SLUG,
  kind: "declaration",
  introText: "Please quickly skim and sign the Declaration of Optimization.",
  slides: [
    ...splitIntoSlides(shareableSnippets.whyOptimizationIsNecessary.markdown),
    ...splitIntoSlides(shareableSnippets.declarationOfOptimization.markdown),
  ],
  backgroundImages: DECLARATION_IMAGES,
  audioManifestPath: "/audio/declaration/manifest.json",
  audioBasePath: "/audio/declaration",
  title: "Sign the Declaration of Optimization",
  authPromptText:
    "Please sign in to verify and become a signatory of the Declaration of Optimization.",
  authCallbackUrl: "/dashboard",
  shareText:
    "I just signed the Declaration of Optimization. Read it and sign it too:",
  emailSubject: "I signed the Declaration of Optimization",
  signedTitle: "Declaration Signed",
  signedBody:
    "Share your link. Every signature is one more reason your government will pretend it always supported this.",
  action: signAction,
  storePendingVote: (name, _referralCode, answer) => {
    if (answer === REFERENDUM_ANSWER.YES) {
      storage.setDeclarationSigned({
        signedAt: new Date().toISOString(),
        name,
      });
    }
    storage.setPendingDeclarationVote({
      answer,
      timestamp: new Date().toISOString(),
    });
  },
  clearPendingVote: () => storage.removePendingDeclarationVote(),
  syncPending: async (session) => {
    const pending = storage.getPendingDeclarationVote();
    if (!pending) return;
    const ok = await postVote(DECLARATION_SLUG, pending.answer, null);
    if (!ok) return;
    storage.removePendingDeclarationVote();
    cacheVoteStatus(session, pending.answer);
  },
};

const treatyConfig: ReferendumConfig = {
  slug: TREATY_REFERENDUM_SLUG,
  kind: "treaty",
  introText:
    "Please end war and disease by quickly skimming and signing the 1% Treaty.",
  slides: splitIntoSlides(shareableSnippets.onePercentTreatyText.markdown),
  audioManifestPath: "/audio/treaty/manifest.json",
  audioBasePath: "/audio/treaty",
  title: "Signed this day, {date}, in the year of our ongoing confusion.",
  authPromptText:
    "Verify your identity to become an official signatory of the 1% Treaty.",
  authCallbackUrl: "/treaty",
  shareText:
    "I just signed the 1% Treaty to redirect 1% of military spending to curing disease. Sign it too:",
  emailSubject: "I signed the 1% Treaty",
  signedTitle: "Thank you for ending war and disease!",
  signedBody: `For each person you get to sign with your link, you will be personally to blame for saving ${fmtRaw(VOTER_LIVES_SAVED.value, 2)} lives and preventing ${fmtRaw(VOTER_SUFFERING_HOURS_PREVENTED.value, 2)} hours of suffering.`,
  action: signAction,
  storePendingVote: (_name, referralCode, answer) =>
    storage.setPendingTreatyVote({
      answer,
      referredBy: referralCode,
      inviteToken: null,
      timestamp: new Date().toISOString(),
      organizationId: null,
      orgContextToken: null,
    }),
  clearPendingVote: () => storage.removePendingTreatyVote(),
  syncPending: async (session) => {
    const pending = storage.getPendingTreatyVote();
    if (!pending) return;

    const hasAllocation = Boolean(getTreatyWishocraticAllocation(pending));
    const hasVote = Boolean(pending.answer);
    if (!hasAllocation && !hasVote) return;

    const allocationOk = hasAllocation
      ? await syncPendingTreatyAllocation()
      : true;
    const voteOk = hasVote
      ? await postVote(
          TREATY_REFERENDUM_SLUG,
          pending.answer,
          pending.referredBy,
          pending.inviteToken,
          pending.orgContextToken,
        )
      : true;

    if (hasVote && voteOk) {
      cacheVoteStatus(session, pending.answer);
    }

    if (hasVote && allocationOk && voteOk) {
      storage.removePendingTreatyVote();
    }
  },
};

/**
 * Court of Humanity referendum — framed as "join" rather than "sign" since
 * the user is becoming a member of the decentralized court / jury, not
 * petitioning for a one-time policy change. Underlying data model is the
 * same `ReferendumVote` table; the "join" treatment lives entirely in the
 * copy fields below.
 */
const courtOfHumanityConfig: ReferendumConfig = {
  slug: COURT_OF_HUMANITY_SLUG,
  kind: "membership",
  introText: COURT_OF_HUMANITY_QUESTION,
  slides: splitIntoSlides(COURT_OF_HUMANITY_TEXT.markdown),
  title: "Joined this day, {date}, in the year of our ongoing confusion.",
  authPromptText:
    "Verify your identity to become a member of the Court of Humanity.",
  authCallbackUrl: "/court",
  shareText:
    "I just joined the Court of Humanity. Sovereign immunity is now slightly less of a thing. Join too:",
  emailSubject: "I joined the Court of Humanity",
  signedTitle: "You are a member of the Court of Humanity.",
  signedBody:
    "For each human you bring into the Court with your link, the jury grows by one and sovereign immunity weakens by an amount your governments' lawyers will quietly notice.",
  action: joinAction,
  showPrivacyToggle: true,
  storePendingVote: (_name, referralCode, answer) =>
    storage.setPendingCourtOfHumanityVote({
      answer,
      referredBy: referralCode,
      timestamp: new Date().toISOString(),
    }),
  clearPendingVote: () => storage.removePendingCourtOfHumanityVote(),
  syncPending: async (session) => {
    const pending = storage.getPendingCourtOfHumanityVote();
    if (!pending) return;
    const ok = await postVote(
      COURT_OF_HUMANITY_SLUG,
      pending.answer,
      pending.referredBy,
    );
    if (!ok) return;
    storage.removePendingCourtOfHumanityVote();
    cacheVoteStatus(session, pending.answer);
  },
};

export const REFERENDUMS: Record<string, ReferendumConfig> = {
  [DECLARATION_SLUG]: declarationConfig,
  [TREATY_REFERENDUM_SLUG]: treatyConfig,
  [COURT_OF_HUMANITY_SLUG]: courtOfHumanityConfig,
};

export function getReferendumConfig(slug: string): ReferendumConfig | null {
  return REFERENDUMS[slug] ?? null;
}
