"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { storage } from "@/lib/storage";
import {
  DECLARATION_GITHUB_EDIT_URL,
  DECLARATION_SLUG,
} from "@/lib/declaration";

export function DeclarationSignatureActions({
  onSigned,
  onDisagreed,
  showStatusMessage = true,
}: {
  onSigned?: () => void;
  onDisagreed?: () => void;
  showStatusMessage?: boolean;
}) {
  const { data: session, status } = useSession();
  const [showSignature, setShowSignature] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signing, setSigning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleAgree = () => {
    setShowSignature(true);
    setStatusMessage(null);
  };

  const handleSubmitSignature = async () => {
    setSigning(true);

    storage.setDeclarationSigned({
      signedAt: new Date().toISOString(),
      name: signatureName.trim() || undefined,
    });

    if (status === "authenticated" && session?.user?.id) {
      try {
        await fetch(`/api/referendums/${DECLARATION_SLUG}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: "YES" }),
        });
      } catch {
        // Vote recorded locally; will retry on next login.
      }
    } else {
      storage.setPendingDeclarationVote({
        answer: "YES",
        timestamp: new Date().toISOString(),
      });
    }

    if (showStatusMessage) {
      setStatusMessage(
        signatureName.trim()
          ? `Signed as ${signatureName.trim()}.`
          : "Declaration signed.",
      );
    }

    setShowSignature(false);
    setSigning(false);
    onSigned?.();
  };

  const handleDisagree = () => {
    storage.setDeclarationSigned({ signedAt: new Date().toISOString() });
    window.open(DECLARATION_GITHUB_EDIT_URL, "_blank", "noopener,noreferrer");

    if (showStatusMessage) {
      setStatusMessage("Opened the public edit link in GitHub.");
    }

    setShowSignature(false);
    onDisagreed?.();
  };

  if (showStatusMessage && statusMessage) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="border-4 border-primary bg-background p-4 text-center text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-black uppercase">{statusMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {!showSignature ? (
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={handleDisagree}
            className="border-4 border-primary bg-brutal-red px-6 py-3 text-lg font-black uppercase text-brutal-red-foreground shadow-none"
          >
            Disagree
          </Button>
          <Button
            onClick={handleAgree}
            className="border-4 border-primary bg-brutal-green px-6 py-3 text-lg font-black uppercase text-brutal-green-foreground shadow-none"
          >
            Agree
          </Button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="mb-3 text-center text-lg font-black uppercase text-foreground">
            Enter your name to become a signatory on the Declaration of
            Optimization
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={signatureName}
              onChange={(event) => setSignatureName(event.target.value)}
              placeholder="Your name"
              className="flex-1 border-4 bg-background px-4 py-3 text-lg font-bold"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter" && signatureName.trim()) {
                  void handleSubmitSignature();
                }
              }}
            />
            <Button
              onClick={() => void handleSubmitSignature()}
              disabled={!signatureName.trim() || signing}
              className="border-4 border-primary px-8 py-3 text-lg font-black uppercase shadow-none disabled:opacity-50"
              variant="secondary"
            >
              {signing ? "Signing..." : "Sign"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
