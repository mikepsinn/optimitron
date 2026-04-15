"use client";

import type { Session } from "next-auth";
import { shareableSnippets } from "@optimitron/data/parameters";
import { splitIntoSlides } from "@/components/referendum/ReferendumStepper";
import { DECLARATION_SLUG } from "@/lib/declaration";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { storage } from "@/lib/storage";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { getTreatyWishocraticAllocation } from "@/lib/treaty-vote";

export interface ReferendumConfig {
  slug: string;
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
  storePendingVote: (name: string, referralCode: string | null) => void;
  clearPendingVote: () => void;
  syncPending: (session?: Session | null) => Promise<void>;
}

async function postVote(
  slug: string,
  answer: string,
  referredBy: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/referendums/${slug}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer,
        ref: referredBy ?? undefined,
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
  const referralIdentifier = getUsernameOrReferralCode(session?.user);
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
  storePendingVote: (name) => {
    storage.setDeclarationSigned({
      signedAt: new Date().toISOString(),
      name,
    });
    storage.setPendingDeclarationVote({
      answer: "YES",
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
  signedTitle: "Treaty Signed",
  signedBody:
    "Share your link. Every signature is one more reason your employees will pretend they always supported this.",
  storePendingVote: (_name, referralCode) =>
    storage.setPendingTreatyVote({
      answer: "YES",
      referredBy: referralCode,
      timestamp: new Date().toISOString(),
      organizationId: null,
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

export const REFERENDUMS: Record<string, ReferendumConfig> = {
  [DECLARATION_SLUG]: declarationConfig,
  [TREATY_REFERENDUM_SLUG]: treatyConfig,
};

export function getReferendumConfig(slug: string): ReferendumConfig | null {
  return REFERENDUMS[slug] ?? null;
}
