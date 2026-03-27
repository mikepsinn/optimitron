import {
  VOTE_TOKEN_VALUE,
  PRIZE_POOL_ANNUAL_RETURN,
  GLOBAL_DISEASE_DEATHS_DAILY,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  fmtParam,
  fmtRaw,
} from "@optimitron/data/parameters";

const HOUR_MS = 60 * 60 * 1000;
const REFERRAL_TARGET = 3;
const FOLLOW_UP_DELAYS_MS = [0, 24 * HOUR_MS, 96 * HOUR_MS] as const;

const voteValue = fmtParam(VOTE_TOKEN_VALUE);
const annualReturn = fmtParam(PRIZE_POOL_ANNUAL_RETURN);
const dailyDeaths = fmtRaw(GLOBAL_DISEASE_DEATHS_DAILY.value);
const lifetimeGain = fmtParam(TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA);

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
    return `You've earned ${referralCount} VOTE ${referralCount === 1 ? "point" : "points"} so far. ${remaining} more and you hit the first milestone. Each point could be worth ${voteValue}+ if enough people play.`;
  }

  return `You have 0 VOTE points. Your first recruit earns you 1 point. Each point could be worth ${voteValue}+ if humanity actually plays this game. Right now it's worth $0.`;
}

function getSubject(step: number, referralCount: number) {
  if (step === 0) {
    return `You voted. Now earn VOTE points worth ${voteValue} each`;
  }

  if (step === 1 && referralCount === 0) {
    return "You have 0 VOTE points. Here's how to change that";
  }

  if (step === 1) {
    return `${referralCount} VOTE ${referralCount === 1 ? "point" : "points"} earned. The clock is ticking`;
  }

  if (referralCount === 0) {
    return "14 years until the parasitic economy wins. Your move";
  }

  return `${referralCount} points locked in. More players = higher value`;
}

function getMainCopy(step: number, referralCount: number) {
  if (step === 0) {
    return "You just earned your first VOTE point. It's currently worth nothing — because VOTE points only have value if enough people deposit into the prize fund. The more people who play, the more each point is worth. Your job: get your friends in.";
  }

  if (step === 1 && referralCount === 0) {
    return "The parasitic economy (military spending + cybercrime) is growing 15% annually. By 2040, half of all economic activity is destructive. Stealing beats creating. The system collapses. That's not a prediction — it's compound interest. Each person you recruit moves the needle toward the tipping point and increases the value of your VOTE points.";
  }

  if (step === 1) {
    return `Every recruit increases the value of your existing VOTE points. More players → bigger prize fund → higher per-point payout. If the plan fails, depositors still get ${annualReturn} annual returns. If it succeeds, everyone gets ${lifetimeGain} richer. Either way, the numbers work. But only if enough people play.`;
  }

  if (referralCount === 0) {
    return `Last nudge: ${dailyDeaths} people die daily from treatable diseases while governments spend $40 on weapons for every $1 on curing disease. Your referral link is the fastest way to change that — and earn VOTE points that could be worth six figures. One text message. That's all it takes.`;
  }

  return "You've proven people will click. The compound effect kicks in now — your recruits recruit their friends, each one adding to the prize pool and increasing your VOTE point value. One more round of sharing while momentum is fresh.";
}

function buildShareMessage(shareUrl: string) {
  return `Governments spend $40 on weapons for every $1 on curing disease. Vote to fix it in 30 seconds and earn VOTE points that could be worth ${voteValue}: ${shareUrl}`;
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
      `Hi ${firstName},`,
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
      "Three ways to recruit right now:",
      "1. Text one friend who cares about healthcare or government waste.",
      "2. Drop it into one group chat — it takes 30 seconds to vote.",
      "3. Post it on social with: 'Governments spend $40 on weapons for every $1 on curing disease. Vote to fix it.'",
    ].join("\n"),
    html: `
      <div style="background:#f4f4f5;padding:32px 16px;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:3px solid #111827;padding:32px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#FF6B9D;">
            The Earth Optimization Game
          </p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">
            Hi ${escapeHtml(firstName)},
          </h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${escapeHtml(mainCopy)}</p>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;font-weight:700;">${escapeHtml(sharePrompt)}</p>
          <a
            href="${escapedShareUrl}"
            style="display:inline-block;background:#FF6B9D;color:#ffffff;padding:14px 24px;text-decoration:none;font-weight:700;border:3px solid #111827;font-size:16px;"
          >
            SHARE YOUR LINK → EARN POINTS
          </a>
          <div style="margin-top:24px;padding:16px;border:3px solid #111827;background:#FFE66D;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#111827;">
              Copy-and-send message
            </p>
            <p style="margin:0;font-size:15px;line-height:1.6;">${escapedShareMessage}</p>
          </div>
          <ul style="margin:24px 0 0;padding-left:20px;font-size:15px;line-height:1.7;">
            <li>Text one friend who cares about healthcare or government waste.</li>
            <li>Drop it in one group chat — it takes 30 seconds to vote.</li>
            <li>Post on social: &quot;$40 on weapons for every $1 on curing disease. Vote to fix it.&quot;</li>
          </ul>
          <div style="margin-top:24px;padding:16px;border:3px solid #111827;background:#111827;color:#ffffff;">
            <p style="margin:0;font-size:13px;line-height:1.6;text-align:center;">
              <strong>THE MATH:</strong> Each VOTE point = ${voteValue}+ at scale. Depositors earn ${annualReturn} annually even if the plan fails. The break-even probability is 1 in 246 million.
            </p>
          </div>
        </div>
      </div>
    `,
  };
}
