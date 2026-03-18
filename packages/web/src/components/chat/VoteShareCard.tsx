"use client";

import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { SocialShareButtons } from "@/components/sharing/social-share-buttons";
import { buildCivicVoteUrl, getBaseUrl } from "@/lib/url";

interface VoteShareCardProps {
  billTitle: string;
  position: string;
  shareIdentifier: string;
  onSendToRep?: () => void;
}

export function VoteShareCard({
  billTitle,
  position,
  shareIdentifier,
  onSendToRep,
}: VoteShareCardProps) {
  const shareUrl = buildCivicVoteUrl(shareIdentifier, getBaseUrl());
  const shareText = `I voted ${position} on "${billTitle}" — see my analysis on Optimitron.`;

  return (
    <div className="opto-card opto-vote-share">
      <div className="opto-vote-share__header">Share Your Vote</div>
      <div className="opto-vote-share__summary">
        You voted <strong>{position}</strong> on {billTitle}
      </div>
      <div className="opto-vote-share__actions">
        <CopyLinkButton url={shareUrl} />
        <SocialShareButtons url={shareUrl} text={shareText} />
      </div>
      {onSendToRep && (
        <button
          type="button"
          className="opto-vote-share__rep-btn"
          onClick={onSendToRep}
        >
          Send to your representative
        </button>
      )}
    </div>
  );
}
