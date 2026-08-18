import * as React from "react";
import { EMAIL_COLORS } from "@/components/adaptive/email-styles";
import {
  CampaignEmailShell,
  CampaignEyebrow,
  CampaignHeading,
  CampaignText,
} from "@/lib/email/react-email-components";

/**
 * Pledge-confirmation email body. Sent once when the card-save Checkout
 * session completes: the pledger just typed a card number and got redirected
 * back with no receipt, which reads as "did that fail?". One job: confirm
 * the pledge exists and restate the deal — card saved, $0 charged, charged
 * only when the task fully funds. The single link is the signed cancel URL;
 * everything else is fact, not ask.
 */
export function TaskFundingPledgeConfirmationReactEmail({
  amountLabel,
  cancelUrl,
  cardLabel,
  deadlineLabel,
  taskTitle,
}: {
  /** Formatted pledge amount, e.g. "$25". */
  amountLabel: string;
  /** Signed one-click cancel URL from buildPledgeCancelUrl. */
  cancelUrl: string;
  /** Human label for the saved card, e.g. "Visa card ending 4242"; null hides the line. */
  cardLabel: string | null;
  /** Formatted funding deadline, e.g. "January 1, 2027"; null when the target has none. */
  deadlineLabel: string | null;
  taskTitle: string;
}) {
  return (
    <CampaignEmailShell
      preview={`Card saved, nothing charged. It is charged only when "${taskTitle}" fully funds.`}
    >
      <CampaignEyebrow>Task funding</CampaignEyebrow>
      <CampaignHeading>Your pledge is in.</CampaignHeading>
      <CampaignText>
        You pledged {amountLabel} to &ldquo;{taskTitle}&rdquo;.
      </CampaignText>
      <CampaignText>
        {deadlineLabel ? (
          <>
            Your card is saved. It is charged only when this task is fully
            funded by {deadlineLabel}; if it does not fully fund by then, your
            card is never charged.
          </>
        ) : (
          <>
            Your card is saved. It is charged only when this task is fully
            funded.
          </>
        )}
      </CampaignText>
      {cardLabel ? (
        <CampaignText muted>Card on file: {cardLabel}.</CampaignText>
      ) : null}
      <CampaignText muted>
        There is nothing else to do. If you change your mind, you can{" "}
        <a
          href={cancelUrl}
          style={{ color: EMAIL_COLORS.foreground, fontWeight: 700 }}
        >
          cancel this pledge
        </a>{" "}
        any time before your card is charged.
      </CampaignText>
    </CampaignEmailShell>
  );
}
