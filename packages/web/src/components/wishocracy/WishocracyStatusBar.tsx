"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { wishocracyLink } from "@/lib/routes";

interface WishocracyStatusBarProps {
  show: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  referralCode: string | null;
  onShowAuthPrompt: () => void;
}

export function WishocracyStatusBar({
  show,
  isLoading,
  isAuthenticated,
  referralCode,
  onShowAuthPrompt,
}: WishocracyStatusBarProps) {
  const [showInlineAuth, setShowInlineAuth] = useState(false);

  if (!show || isLoading) {
    return null;
  }

  if (!isAuthenticated && showInlineAuth) {
    return (
      <div className="mx-auto mb-8 max-w-2xl" data-auth-prompt>
        <Card className="relative border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2"
            onClick={() => setShowInlineAuth(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="mb-4 text-center">
            <h3 className="text-lg font-black uppercase">Sign In to Save Your Work</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your allocations and referral link will be attached to your account.
            </p>
          </div>
          <AuthForm callbackUrl={wishocracyLink.href} referralCode={referralCode} compact />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-8 max-w-2xl" data-auth-prompt>
      {isAuthenticated ? (
        <p className="text-center text-sm text-muted-foreground">
          Signed in. Your allocations are saving automatically and your referral link is ready below.
        </p>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-muted-foreground">
            Sign in to save your allocations, sync progress, and get a personal referral link.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="font-bold uppercase"
              onClick={() => setShowInlineAuth(true)}
            >
              Sign In
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="font-bold uppercase"
              onClick={onShowAuthPrompt}
            >
              Save Progress
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
