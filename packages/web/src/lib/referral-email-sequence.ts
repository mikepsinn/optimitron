import {
  VOTE_TOKEN_VALUE,
  PRIZE_POOL_ANNUAL_RETURN,
  GLOBAL_DISEASE_DEATHS_DAILY,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  VOTER_LIVES_SAVED,
  fmtParam,
  fmtRaw,
} from "@optimitron/data/parameters";

const HOUR_MS = 60 * 60 * 1000;
const REFERRAL_TARGET = 3;
const FOLLOW_UP_DELAYS_MS = [0, 24 * HOUR_MS, 96 * HOUR_MS] as const;

/** Cron waits this long before retrying a step-0 send, giving the
 *  welcome-email handler (signup / auth event) time to advance the step. */
export const STEP_0_CRON_GRACE_MS = 10 * 60 * 1000;

const voteValue = fmtParam(VOTE_TOKEN_VALUE);
const annualReturn = fmtParam(PRIZE_POOL_ANNUAL_RETURN);
const dailyDeaths = fmtRaw(GLOBAL_DISEASE_DEATHS_DAILY.value);
const spendingRatio = fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO);
const tippingPoint = fmtRaw(TREATY_CAMPAIGN_VOTING_BLOC_TARGET.value);
const currentTrialSlots = fmtRaw(CURRENT_TRIAL_SLOTS_AVAILABLE.value);
const livesSavedPerVoter = fmtRaw(VOTER_LIVES_SAVED.value);

export const REFERRAL_EMAIL_SEQUENCE_LENGTH = FOLLOW_UP_DELAYS_MS.length;

interface ReferralEmailState {
  createdAt: Date;
  newsletterSubscribed: boolean;
  referralCount: number;
  referralEmailSequenceLastSentAt?: Date | null;
  referralEmailSequenceStep: number;
}

interface ReferralEmailContentInput {
  name?: string | null;
  referralCount: number;
  shareUrl: string;
  step: number;
}

type ReferralSequenceCompleteReason = "goal_met" | "opted_out";

export type ReferralSequenceAction =
  | { type: "complete"; reason: ReferralSequenceCompleteReason }
  | { step: number; type: "send" };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getFirstName(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? trimmed.split(/\s+/)[0] : "there";
}

function getSharePrompt(referralCount: number) {
  if (referralCount > 0) {
    const remaining = Math.max(REFERRAL_TARGET - referralCount, 1);
    return `You've told ${referralCount} ${referralCount === 1 ? "friend" : "friends"} so far. ${remaining} more to hit the first milestone. Each one strengthens the signal that your species would prefer living to exploding.`;
  }

  return `You haven't told anyone yet. The game: tell two friends. They tell two. That's how ${tippingPoint} happens. Your species invented chain letters. This is that, but it saves lives instead of cursing your family.`;
}

function getSubject(step: number, referralCount: number) {
  if (step === 0) {
    return "You did a thing. Now do one more thing";
  }

  if (step === 1 && referralCount === 0) {
    return `${dailyDeaths} people died today. You texted nobody`;
  }

  if (step === 1) {
    return `${referralCount} of your friends joined. That's almost impressive`;
  }

  if (referralCount === 0) {
    return `Your species spends ${spendingRatio} more on weapons than finding new treatments. Anyway`;
  }

  return `${referralCount} players in your crew. The tipping point can smell you coming`;
}

function getMainCopy(step: number, referralCount: number) {
  if (step === 0) {
    return `You just joined the Earth Optimization Game. I invented it because your species has been trying to stop dying for 10,000 years without a scoreboard, which is like playing football without knowing which direction the goal is. You just pointed at the goal.\n\nHere's how the game works: ${dailyDeaths} of you permanently stop every day from diseases you could be treating faster. Your governments spend ${spendingRatio} more on weapons than on testing which medicines work. The 1% Treaty redirects 1% of the murder budget to clinical trials. We need ${tippingPoint} players to hit the tipping point.\n\nYour move: tell two friends. Not "recruit referrals." Not "leverage your network." Tell two actual humans you know. Preferably ones who prefer being alive.`;
  }

  if (step === 1 && referralCount === 0) {
    return `Since you voted yesterday, roughly ${dailyDeaths} more people did the thing where they stop being alive permanently. I believe you call it "dying." You seemed quite against it yesterday.\n\nThe 1% Treaty would massively expand clinical trial capacity, up from ${currentTrialSlots} slots per year. The only thing between here and there is ${tippingPoint} votes. You are one. You need two more. Two friends. Ideally ones with thumbs and a phone.\n\nOn my planet, when someone discovers a solution to mass death, they tell people about it. On yours, they apparently vote once and then go back to watching small humans fall over on TikTok.`;
  }

  if (step === 1) {
    return `Your friends joined. This is how it works \u2014 you tell two, they tell two, and eventually your species stops spending more on murder machines than on not dying. I realise this sounds obvious but you've had 10,000 years and haven't tried it yet.\n\nEach player who joins means one more vote toward the tipping point, and roughly ${livesSavedPerVoter} fewer preventable deaths. Two more friends. That's all. I promise it's less awkward than whatever you did at that party last weekend.`;
  }

  if (referralCount === 0) {
    return `Last message. I don't enjoy nagging. On my planet, nagging was eliminated in year 7 when everyone simply did the obvious thing.\n\nSince you voted, roughly ${fmtRaw(GLOBAL_DISEASE_DEATHS_DAILY.value * 3)} people have died from treatable diseases. One text message to one friend takes 30 seconds. You spent longer than that choosing which photo filter makes your lunch look less sad.\n\nThe game only works if people play it. I'm told this is also true of your "democracy" but with worse graphics.`;
  }

  return `You've brought ${referralCount} people into the game. On my planet we'd give you a small trophy. On yours I believe the equivalent is "a sense of personal satisfaction" which is less tangible but cheaper to ship.\n\nOne last round: two more people who'd prefer not dying of preventable diseases. I'm told that's most of you.`;
}

function buildShareMessage(shareUrl: string) {
  return `${dailyDeaths} people die daily from treatable diseases. Governments spend ${spendingRatio} more on weapons than finding new treatments. Vote for the 1% Treaty in 30 seconds: ${shareUrl}`;
}

export function getReferralSequenceAction(
  state: ReferralEmailState,
  now: Date = new Date(),
): ReferralSequenceAction | null {
  if (state.referralEmailSequenceStep >= REFERRAL_EMAIL_SEQUENCE_LENGTH) {
    return null;
  }

  if (state.referralCount >= REFERRAL_TARGET) {
    return { type: "complete", reason: "goal_met" };
  }

  if (state.referralEmailSequenceStep > 0 && !state.newsletterSubscribed) {
    return { type: "complete", reason: "opted_out" };
  }

  if (state.referralEmailSequenceStep === 0) {
    // The welcome-email handler sends step 0 synchronously during signup.
    // Wait before the cron retries, so we don't double-send.
    const ageMs = now.getTime() - state.createdAt.getTime();
    if (ageMs < STEP_0_CRON_GRACE_MS) {
      return null;
    }
    return { type: "send", step: 0 };
  }

  const lastSentAt = state.referralEmailSequenceLastSentAt ?? state.createdAt;
  const delayMs = FOLLOW_UP_DELAYS_MS[state.referralEmailSequenceStep];
  const dueAt = new Date(lastSentAt.getTime() + delayMs);

  if (dueAt <= now) {
    return { type: "send", step: state.referralEmailSequenceStep };
  }

  return null;
}

export function buildReferralSequenceEmail({
  name,
  referralCount,
  shareUrl,
  step,
}: ReferralEmailContentInput) {
  const firstName = getFirstName(name);
  const subject = getSubject(step, referralCount);
  const mainCopy = getMainCopy(step, referralCount);
  const sharePrompt = getSharePrompt(referralCount);
  const shareMessage = buildShareMessage(shareUrl);
  const escapedShareUrl = escapeHtml(shareUrl);
  const escapedShareMessage = escapeHtml(shareMessage);

  return {
    subject,
    text: [
      `Hello ${firstName},`,
      "",
      mainCopy,
      "",
      sharePrompt,
      "",
      `Your link: ${shareUrl}`,
      "",
      "Suggested message:",
      shareMessage,
      "",
      "Three ways to tell two people:",
      "1. Text one friend who'd prefer being alive.",
      "2. Drop it in one group chat \u2014 it takes 30 seconds to vote.",
      `3. Post on social: "${dailyDeaths} people die daily from treatable diseases. Governments spend ${spendingRatio} more on weapons than finding new treatments. 30 seconds to vote for the 1% Treaty."`,
      "",
      `The boring part your species seems to care about: Players who invite verified voters earn VOTE points. If the game works, each point is worth ~${voteValue}. If it doesn't, depositors in the prize fund still earn ${annualReturn} annually. Either way, you told your friends about something that matters.`,
      "",
      "\u2014 Wishonia",
    ].join("\n"),
    html: `
      <div style="background:#f4f4f5;padding:32px 16px;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:3px solid #111827;padding:32px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#FF6B9D;">
            The Earth Optimization Game
          </p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">
            Hello ${escapeHtml(firstName)},
          </h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;white-space:pre-line;">${escapeHtml(mainCopy)}</p>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;font-weight:700;">${escapeHtml(sharePrompt)}</p>
          <a
            href="${escapedShareUrl}"
            style="display:inline-block;background:#FF6B9D;color:#ffffff;padding:14px 24px;text-decoration:none;font-weight:700;border:3px solid #111827;font-size:16px;"
          >
            TELL TWO FRIENDS
          </a>
          <div style="margin-top:24px;padding:16px;border:3px solid #111827;background:#FFE66D;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#111827;">
              Copy-and-send message
            </p>
            <p style="margin:0;font-size:15px;line-height:1.6;">${escapedShareMessage}</p>
          </div>
          <ul style="margin:24px 0 0;padding-left:20px;font-size:15px;line-height:1.7;">
            <li>Text one friend who&rsquo;d prefer being alive.</li>
            <li>Drop it in one group chat &mdash; it takes 30 seconds to vote.</li>
            <li>Post on social: &quot;${dailyDeaths} people die daily from treatable diseases. Governments spend ${spendingRatio} more on weapons than finding new treatments. 30 seconds to vote for the 1% Treaty.&quot;</li>
          </ul>
          <div style="margin-top:24px;padding:16px;border:3px solid #111827;background:#111827;color:#ffffff;">
            <p style="margin:0;font-size:13px;line-height:1.6;text-align:center;">
              <strong>THE BORING PART YOUR SPECIES SEEMS TO CARE ABOUT:</strong> Players who invite verified voters earn VOTE points. If the game works, each point is worth ~${voteValue}. If it doesn&rsquo;t, depositors in the prize fund still earn ${annualReturn} annually. Either way, you told your friends about something that matters, which on your planet apparently requires financial incentives. Fascinating.
            </p>
          </div>
          <p style="margin:24px 0 0;font-size:14px;color:#666;text-align:right;font-style:italic;">&mdash; Wishonia</p>
        </div>
      </div>
    `,
  };
}
