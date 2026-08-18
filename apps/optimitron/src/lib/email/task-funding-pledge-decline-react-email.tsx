import * as React from "react";
import {
  CampaignButton,
  CampaignEmailShell,
  CampaignEyebrow,
  CampaignHeading,
  CampaignText,
} from "@/lib/email/react-email-components";

/**
 * Decline-recovery email body. Sent once per decline when an off-session
 * pledge charge fails (card declined, expired, or blocked by SCA). One job:
 * get the pledger to the task's funding section, where the pay-now Checkout
 * runs on-session — the path that clears bank fraud filters and SCA prompts
 * that off-session charges cannot.
 */
export function TaskFundingPledgeDeclineReactEmail({
  amountLabel,
  cardLabel,
  payNowUrl,
  taskTitle,
}: {
  /** Formatted pledge amount, e.g. "$25". */
  amountLabel: string;
  /** Human label for the saved card, e.g. "Visa card ending 4242". */
  cardLabel: string;
  /** Absolute URL to the task page's funding section (pay-now checkout). */
  payNowUrl: string;
  taskTitle: string;
}) {
  return (
    <CampaignEmailShell
      preview={`Your ${amountLabel} pledge to "${taskTitle}" needs a working card.`}
    >
      <CampaignEyebrow>Task funding</CampaignEyebrow>
      <CampaignHeading>Your pledge card was declined.</CampaignHeading>
      <CampaignText>
        &ldquo;{taskTitle}&rdquo; reached its funding goal, so we tried to
        charge the {cardLabel} you saved for your {amountLabel} pledge. Your
        bank declined the charge.
      </CampaignText>
      <CampaignText>
        The fix takes one click. Pay directly with any card:
      </CampaignText>
      <CampaignButton href={payNowUrl}>Pay now</CampaignButton>
      <CampaignText muted>
        Banks decline saved-card charges for dull reasons — expired cards,
        fraud filters, spending limits. Paying directly almost always goes
        through, because your bank can confirm it is really you.
      </CampaignText>
      <CampaignText muted>
        If you do nothing, nothing happens. No retries, no fees, no charge.
        The pledge simply stops counting toward the goal.
      </CampaignText>
    </CampaignEmailShell>
  );
}
