import * as React from "react";
import {
  CampaignButton,
  CampaignEmailShell,
  CampaignEyebrow,
  CampaignHeading,
  CampaignText,
} from "@/lib/email/react-email-components";

/**
 * Charge-receipt email body. Sent once per pledge when the off-session
 * charge on the saved card SUCCEEDS: the task fully funded, so the card was
 * charged exactly as pledged. Naming the amount, the card, and the
 * bank-statement descriptor is the cheapest chargeback prevention there is —
 * the pledger recognizes the line on their statement before their bank
 * invites them to dispute it.
 */
export function TaskFundingPledgeReceiptReactEmail({
  amountLabel,
  cardLabel,
  fundingUrl,
  statementDescriptor,
  taskTitle,
}: {
  /** Formatted charge amount, e.g. "$25". */
  amountLabel: string;
  /** Human label for the charged card, e.g. "Visa card ending 4242". */
  cardLabel: string;
  /** Absolute URL to the task page's funding section. */
  fundingUrl: string;
  /**
   * The descriptor Stripe computed for this charge — the literal string on
   * the pledger's bank statement. Null when the lookup failed; the copy then
   * states the account-default fact instead of quoting a string.
   */
  statementDescriptor: string | null;
  taskTitle: string;
}) {
  return (
    <CampaignEmailShell
      preview={`Receipt: ${amountLabel} charged to your ${cardLabel} for "${taskTitle}".`}
    >
      <CampaignEyebrow>Task funding receipt</CampaignEyebrow>
      <CampaignHeading>Your {amountLabel} pledge was charged.</CampaignHeading>
      <CampaignText>
        &ldquo;{taskTitle}&rdquo; is fully funded. We charged the {cardLabel}{" "}
        you saved &mdash; {amountLabel}, exactly as pledged.
      </CampaignText>
      <CampaignText>
        {statementDescriptor ? (
          <>
            On your bank statement, this charge will appear as &ldquo;
            {statementDescriptor}&rdquo;.
          </>
        ) : (
          <>
            On your bank statement, this charge will appear under our Stripe
            account&rsquo;s name, not the task title.
          </>
        )}
      </CampaignText>
      <CampaignButton href={fundingUrl}>See the funding</CampaignButton>
      <CampaignText muted>
        What happens next: a verified worker gets paid only after the work is
        verified. Until then, your money sits with the rest of the funding.
      </CampaignText>
      <CampaignText muted>
        If this task dies before the work happens, this charge comes back to
        your card automatically. You do not have to ask.
      </CampaignText>
    </CampaignEmailShell>
  );
}
