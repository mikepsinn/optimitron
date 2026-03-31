"use client";

import { IDKitRequestWidget, orbLegacy } from "@worldcoin/idkit";
import { ShieldCheck, ShieldQuestion } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, useTransition } from "react";
import { API_ROUTES } from "@/lib/api-routes";
import { useWishPoints } from "@/components/wishes/WishPointProvider";
import { PersonhoodStatusBadge } from "@/components/personhood/PersonhoodStatusBadge";
import { AlertCard } from "@/components/ui/alert-card";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { createLogger } from "@/lib/logger";
import { clientEnv } from "@/lib/env";
import type { WorldIdRequestPayload, WorldIdVerificationPayload } from "@/lib/world-id";

const logger = createLogger("world-id-verification-card");

interface WorldIdVerificationCardProps {
  show: boolean;
}

export function WorldIdVerificationCard({ show }: WorldIdVerificationCardProps) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [requestPayload, setRequestPayload] = useState<WorldIdRequestPayload | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const { showWishReward } = useWishPoints();
  const worldIdEnabled = clientEnv.NEXT_PUBLIC_WORLD_ID_ENABLED !== "false";
  const sessionUser = session?.user;
  const isVerified = Boolean(sessionUser?.personhoodVerified);

  useEffect(() => {
    if (!show || !worldIdEnabled || !sessionUser?.id || isVerified) {
      return;
    }

    let isActive = true;

    async function loadRequest() {
      setIsLoadingRequest(true);
      setRequestError(null);

      try {
        const response = await fetch(API_ROUTES.personhood.worldIdRequest);
        const payload = (await response.json().catch(() => null)) as
          | WorldIdRequestPayload
          | { error?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload && "error" in payload ? payload.error : "Unable to start World ID.");
        }

        if (!isActive) {
          return;
        }

        setRequestPayload(payload as WorldIdRequestPayload);
      } catch (error) {
        logger.error("Failed to load World ID request", error);
        if (isActive) {
          setRequestPayload(null);
          setRequestError(
            error instanceof Error ? error.message : "Unable to start World ID right now.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingRequest(false);
        }
      }
    }

    void loadRequest();

    return () => {
      isActive = false;
    };
  }, [isVerified, sessionUser?.id, show, worldIdEnabled]);

  if (!show || !sessionUser?.id) {
    return null;
  }

  async function handleVerify(result: WorldIdVerificationPayload) {
    setIsSubmitting(true);
    setRequestError(null);

    try {
      const response = await fetch(API_ROUTES.personhood.worldIdVerify, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; wishesEarned?: number } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "World ID verification failed.");
      }

      if (payload?.wishesEarned) {
        try { showWishReward(payload.wishesEarned, "Verified Personhood"); } catch { /* noop */ }
      }
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "World ID verification failed.",
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSuccess() {
    setSuccessMessage("Verified. Your account now counts as a confirmed person.");
    await update({ refreshPersonhood: true });
    startRefresh(() => {
      router.refresh();
    });
  }

  const verifiedDate = sessionUser.personhoodVerifiedAt
    ? new Date(sessionUser.personhoodVerifiedAt).toLocaleDateString()
    : null;

  return (
    <div className="mx-auto mb-8 max-w-3xl">
      <Card className="border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <Card.Header className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Card.Title className="text-lg font-black uppercase text-foreground">
                Proof of Personhood
              </Card.Title>
              <p className="mt-2 text-sm text-muted-foreground">
                Verify with World ID so we can weight civic input toward real people instead of bots.
              </p>
            </div>
            <PersonhoodStatusBadge
              provider={sessionUser.personhoodProvider ?? null}
              verified={isVerified}
            />
          </div>
        </Card.Header>
        <Card.Content className="space-y-4">
          {successMessage ? <AlertCard type="success" message={successMessage} /> : null}
          {requestError ? <AlertCard type="error" message={requestError} /> : null}

          {isVerified ? (
            <div className="border-4 border-primary bg-brutal-cyan p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-brutal-cyan-foreground" />
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-brutal-cyan-foreground">
                    Verified with {sessionUser.personhoodProvider === "WORLD_ID" ? "World ID" : "a personhood provider"}.
                  </p>
                  {sessionUser.personhoodVerificationLevel ? (
                    <p className="text-brutal-cyan-foreground">
                      Credential: {sessionUser.personhoodVerificationLevel}
                    </p>
                  ) : null}
                  {verifiedDate ? (
                    <p className="text-brutal-cyan-foreground">Verified on {verifiedDate}.</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : !worldIdEnabled ? (
            <div className="border-2 border-dashed border-primary bg-muted/30 p-4 text-sm text-muted-foreground">
              World ID verification is disabled for this environment.
            </div>
          ) : (
            <div className="border-4 border-primary bg-brutal-cyan p-4">
              <div className="flex items-start gap-3">
                <ShieldQuestion className="mt-0.5 h-5 w-5 text-brutal-cyan-foreground" />
                <div className="space-y-3 text-sm">
                  <p className="text-brutal-cyan-foreground">
                    This does not replace login. It adds a separate uniqueness proof on top of
                    your account.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      className="font-bold uppercase"
                      disabled={isLoadingRequest || isSubmitting || isRefreshing || !requestPayload}
                      onClick={() => setIsWidgetOpen(true)}
                    >
                      {isLoadingRequest
                        ? "Preparing..."
                        : isSubmitting || isRefreshing
                          ? "Verifying..."
                          : "Verify with World ID"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="font-bold uppercase"
                      disabled={isLoadingRequest || isSubmitting}
                      onClick={() => {
                        setRequestPayload(null);
                        setRequestError(null);
                        setSuccessMessage(null);
                        setIsLoadingRequest(true);
                        void fetch("/api/personhood/world-id/request")
                          .then(async (response) => {
                            const payload = (await response.json().catch(() => null)) as
                              | WorldIdRequestPayload
                              | { error?: string }
                              | null;
                            if (!response.ok) {
                              throw new Error(
                                payload && "error" in payload
                                  ? payload.error
                                  : "Unable to refresh World ID request.",
                              );
                            }
                            setRequestPayload(payload as WorldIdRequestPayload);
                          })
                          .catch((error) => {
                            logger.error("Failed to refresh World ID request", error);
                            setRequestError(
                              error instanceof Error
                                ? error.message
                                : "Unable to refresh World ID request.",
                            );
                          })
                          .finally(() => setIsLoadingRequest(false));
                      }}
                    >
                      Refresh Request
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      {requestPayload ? (
        <IDKitRequestWidget
          open={isWidgetOpen}
          onOpenChange={setIsWidgetOpen}
          app_id={requestPayload.app_id}
          action={requestPayload.action}
          environment={requestPayload.environment}
          rp_context={requestPayload.rp_context}
          allow_legacy_proofs={requestPayload.allow_legacy_proofs}
          preset={orbLegacy({ signal: requestPayload.signal })}
          handleVerify={handleVerify}
          onSuccess={handleSuccess}
          onError={(errorCode) => {
            logger.error("World ID widget error", errorCode);
            setRequestError("World ID verification was cancelled or could not be completed.");
          }}
        />
      ) : null}
    </div>
  );
}
