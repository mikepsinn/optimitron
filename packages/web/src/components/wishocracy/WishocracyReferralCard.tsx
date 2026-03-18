"use client";

import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { SocialShareButtons } from "@/components/sharing/social-share-buttons";

interface WishocracyReferralCardProps {
  show: boolean;
  shareUrl: string;
}

export function WishocracyReferralCard({
  show,
  shareUrl,
}: WishocracyReferralCardProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="mx-auto mb-8 max-w-3xl">
      <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-center text-lg font-black uppercase text-black">
          Your Referral Link
        </h3>
        <p className="mt-2 text-center text-sm font-medium text-black/60">
          Share this URL any time. New people land on your Wishocracy ballot and
          signups are attributed to your account.
        </p>
        <div className="mt-4">
          <CopyLinkButton url={shareUrl} variant="landing" />
        </div>
        <div className="mt-4 flex justify-center">
          <SocialShareButtons
            url={shareUrl}
            text="I mapped my budget priorities on Optimitron. Add yours and compare the aggregate."
          />
        </div>
      </div>
    </div>
  );
}
