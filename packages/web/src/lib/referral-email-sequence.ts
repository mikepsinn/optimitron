const HOUR_MS = 60 * 60 * 1000;
const REFERRAL_TARGET = 3;
const FOLLOW_UP_DELAYS_MS = [0, 24 * HOUR_MS, 96 * HOUR_MS] as const;

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
    return `You already brought in ${referralCount} ${referralCount === 1 ? "person" : "people"}. ${remaining} more will give the sample noticeably more range.`;
  }

  return "Your first three referrals matter the most because they widen the comparison set while the sample is still small.";
}

function getSubject(step: number, referralCount: number) {
  if (step === 0) {
    return "Your Optomitron referral link is ready";
  }

  if (step === 1 && referralCount === 0) {
    return "Your first 3 invites matter more than the next 30";
  }

  if (step === 1) {
    return `You already brought in ${referralCount}. Keep it moving`;
  }

  if (referralCount === 0) {
    return "One forwarded link can widen the sample";
  }

  return "You are already shaping the sample";
}

function getMainCopy(step: number, referralCount: number) {
  if (step === 0) {
    return "You now have a personal Optomitron ballot link. Every signup through it is attributed to your account.";
  }

  if (step === 1 && referralCount === 0) {
    return "Most people mean to share later and never do. The easiest win is sending your link to one friend, one family member, and one group chat today.";
  }

  if (step === 1) {
    return "Momentum matters. The fastest way to turn one referral into several is to post the same link in a small group where people already debate priorities.";
  }

  if (referralCount === 0) {
    return "If you want the aggregate to reflect more than one bubble, send your link now while the ask is still fresh.";
  }

  return "You already proved people will click. One more round of sharing usually performs better than waiting a week and starting over.";
}

function buildShareMessage(shareUrl: string) {
  return `I just mapped my budget priorities on Optomitron. Add yours here: ${shareUrl}`;
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
      sharePrompt,
      "",
      `Your link: ${shareUrl}`,
      "",
      "Suggested message:",
      shareMessage,
      "",
      "Best channels right now:",
      "1. Text one person who already cares about budgeting or policy.",
      "2. Drop it into one group chat where people already debate tradeoffs.",
      "3. Post it once on social with your own top priority.",
    ].join("\n"),
    html: `
      <div style="background:#f4f4f5;padding:32px 16px;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:3px solid #111827;padding:32px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">
            Referral Link
          </p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">
            Hi ${escapeHtml(firstName)},
          </h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${escapeHtml(mainCopy)}</p>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">${escapeHtml(sharePrompt)}</p>
          <a
            href="${escapedShareUrl}"
            style="display:inline-block;background:#111827;color:#ffffff;padding:14px 24px;text-decoration:none;font-weight:700;border:2px solid #111827;"
          >
            Open your referral link
          </a>
          <div style="margin-top:24px;padding:16px;border:2px solid #111827;background:#fafafa;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">
              Copy-and-send message
            </p>
            <p style="margin:0;font-size:15px;line-height:1.6;">${escapedShareMessage}</p>
          </div>
          <ul style="margin:24px 0 0;padding-left:20px;font-size:15px;line-height:1.7;">
            <li>Text one person who already cares about tradeoffs.</li>
            <li>Drop it in one active group chat.</li>
            <li>Post it once with your own top priority.</li>
          </ul>
        </div>
      </div>
    `,
  };
}
