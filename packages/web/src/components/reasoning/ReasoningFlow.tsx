"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import {
  trackReasoningChainNodeAdvanced,
  trackReasoningChainNodeExited,
  trackReasoningObjectionResolved,
  trackReasoningObjectionShown,
  trackReasoningProbabilityChanged,
  trackReasoningReplicationSendConfirmed,
  trackReasoningReplicationSendInitiated,
  trackReasoningSurveyStarted,
  trackReasoningVote,
  trackReasoningWalkAway,
} from "@/lib/analytics";
import { storage, type ReasoningPersistedState } from "@/lib/storage";
import { postReasoningOutcomes } from "@/lib/reasoning/outcome-client";
import { CALL_SCRIPT_TOPOLOGY, ENTRY_NODE_ID } from "@/lib/reasoning/call-script";
import { LIVE_EV_CONFIG } from "@/lib/reasoning/live-ev-config";
import { currentArmIdForNode, handoffSlotKey, slotForSlotKey } from "@/lib/reasoning/selection";
import type {
  ReasoningState,
  NodeId,
  RelationshipBucket,
  TelemetryContext,
} from "@/lib/reasoning/types";
import type {
  ChainNodeContent,
  HandoffContent,
  InevitabilityContent,
  ObjectionNodeContent,
  ReplicationCtaContent,
} from "@/lib/reasoning/arm-content";
import { ReferralStrip } from "./ReferralStrip";
import { ClaimNodeView } from "./ClaimNodeView";
import { ObjectionNodeView } from "./ObjectionNodeView";
import { InevitabilityNodeView } from "./InevitabilityNodeView";
import { ReplicationNodeView } from "./ReplicationNodeView";
import { TerminalNodeView } from "./TerminalNodeView";
import { EvDashboard } from "./EvDashboard";

export type ReasoningArmsByNode = {
  claims: Record<NodeId, ChainNodeContent | null>;
  objections: Record<NodeId, ObjectionNodeContent | null>;
  inevitability: InevitabilityContent | null;
  replication: ReplicationCtaContent | null;
  handoffs: Record<RelationshipBucket, HandoffContent>;
};

export function ReasoningFlow({
  initialReferrer,
  arms,
  session,
  signatureCount,
  thresholdTotal,
}: {
  initialReferrer: string | null;
  arms: ReasoningArmsByNode;
  session: ReasoningState;
  signatureCount: number;
  thresholdTotal: number;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlNode = searchParams?.get("at") as NodeId | null;

  const [runtimeSession, setRuntimeSession] = useState<ReasoningState>(session);
  const [currentNodeId, setCurrentNodeId] = useState<NodeId>(
    urlNode && CALL_SCRIPT_TOPOLOGY[urlNode] ? urlNode : session.currentNodeId,
  );
  const [hydrated, setHydrated] = useState(false);
  const [answers, setAnswers] = useState<Record<NodeId, "yes" | "no">>({});
  const [claimProbabilities, setClaimProbabilities] = useState<Record<NodeId, number>>({});
  const [conversionP] = useState(0.1);
  const nodeEnteredAtRef = useRef(Date.now());
  const startedRef = useRef(false);
  const seenObjectionsRef = useRef<Set<NodeId>>(new Set());

  useEffect(() => {
    const stored = storage.getReasoningState();
    if (
      stored &&
      stored.variantSetId === session.variantSetId &&
      stored.surface === session.surface &&
      stored.localeKey === session.localeKey &&
      stored.hostKey === session.hostKey
    ) {
      setRuntimeSession((current) => ({
        ...current,
        sessionId: stored.sessionId,
        currentNodeId: stored.currentNodeId as NodeId,
        chainDepth: stored.chainDepth,
        claimAnswers: stored.answers,
        claimProbabilities: stored.claimProbabilities,
        conversionP: stored.conversionP,
        firstSendConfirmed: stored.firstSendConfirmed,
        sendCount: stored.sendCount,
        startedAt: stored.startedAt,
        policyDecisionId: stored.policyDecisionId,
        variantSetId: stored.variantSetId,
        variantArmIds: stored.variantArmIds,
        organizationId: stored.organizationId,
        orgContextVerified: stored.orgContextVerified,
        orgContextToken: stored.orgContextToken,
        surface: stored.surface,
        localeKey: stored.localeKey,
        hostKey: stored.hostKey,
        device: stored.device,
        returningVsFirst: stored.returningVsFirst,
        relationshipBucket: stored.relationshipBucket,
        referralSource: stored.referralSource,
        referredByUserId: stored.referredByUserId,
        shareAttemptId: stored.shareAttemptId,
        isControlHoldout: stored.isControlHoldout,
        holdoutResolutionLevel: stored.holdoutResolutionLevel,
        audienceTag: stored.audienceTag,
      }));
      setCurrentNodeId(
        urlNode && CALL_SCRIPT_TOPOLOGY[urlNode]
          ? urlNode
          : (stored.currentNodeId as NodeId),
      );
      setAnswers(stored.answers);
      setClaimProbabilities(stored.claimProbabilities);
    } else {
      setRuntimeSession(session);
      setCurrentNodeId(
        urlNode && CALL_SCRIPT_TOPOLOGY[urlNode] ? urlNode : session.currentNodeId,
      );
    }
    setHydrated(true);
  }, [session, urlNode]);

  useEffect(() => {
    if (urlNode && urlNode !== currentNodeId && CALL_SCRIPT_TOPOLOGY[urlNode]) {
      setCurrentNodeId(urlNode);
    }
  }, [urlNode, currentNodeId]);

  const telemetryContext = useMemo<TelemetryContext>(
    () => ({
      sessionId: runtimeSession.sessionId,
      policyDecisionId: runtimeSession.policyDecisionId,
      variantSetId: runtimeSession.variantSetId,
      variantArmIds: runtimeSession.variantArmIds,
      organizationId: runtimeSession.organizationId,
      hostKey: runtimeSession.hostKey,
      localeKey: runtimeSession.localeKey,
      surface: runtimeSession.surface,
      device: runtimeSession.device,
      returningVsFirst: runtimeSession.returningVsFirst,
      audienceTag: runtimeSession.audienceTag,
      relationshipBucket: runtimeSession.relationshipBucket,
      referralSource: runtimeSession.referralSource,
      referredByUserId: runtimeSession.referredByUserId,
      shareAttemptId: runtimeSession.shareAttemptId,
      chainDepth: runtimeSession.chainDepth,
      isControlHoldout: runtimeSession.isControlHoldout,
      holdoutResolutionLevel: runtimeSession.holdoutResolutionLevel,
    }),
    [runtimeSession],
  );

  useEffect(() => {
    if (!hydrated) return;
    const persisted: ReasoningPersistedState = {
      sessionId: runtimeSession.sessionId,
      currentNodeId,
      chainDepth: runtimeSession.chainDepth,
      answers,
      claimProbabilities,
      conversionP,
      firstSendConfirmed: runtimeSession.firstSendConfirmed,
      sendCount: runtimeSession.sendCount,
      startedAt: runtimeSession.startedAt,
      policyDecisionId: runtimeSession.policyDecisionId,
      variantSetId: runtimeSession.variantSetId,
      variantArmIds: runtimeSession.variantArmIds,
      organizationId: runtimeSession.organizationId,
      orgContextVerified: runtimeSession.orgContextVerified,
      orgContextToken: runtimeSession.orgContextToken,
      surface: runtimeSession.surface,
      localeKey: runtimeSession.localeKey,
      hostKey: runtimeSession.hostKey,
      device: runtimeSession.device,
      returningVsFirst: runtimeSession.returningVsFirst,
      relationshipBucket: runtimeSession.relationshipBucket,
      referralSource: runtimeSession.referralSource,
      referredByUserId: runtimeSession.referredByUserId,
      shareAttemptId: runtimeSession.shareAttemptId,
      isControlHoldout: runtimeSession.isControlHoldout,
      holdoutResolutionLevel: runtimeSession.holdoutResolutionLevel,
      audienceTag: runtimeSession.audienceTag,
    };
    storage.setReasoningState(persisted);
  }, [answers, claimProbabilities, conversionP, currentNodeId, hydrated, runtimeSession]);

  useEffect(() => {
    if (!hydrated) return;
    if (startedRef.current) return;
    startedRef.current = true;
    const entryArmId = currentArmIdForNode(runtimeSession.variantArmIds, currentNodeId);
    trackReasoningSurveyStarted({
      variantSetId: telemetryContext.variantSetId,
      policyDecisionId: telemetryContext.policyDecisionId,
      localeKey: telemetryContext.localeKey,
      hostKey: telemetryContext.hostKey,
      surface: telemetryContext.surface,
      referredBy: initialReferrer,
      relationshipBucket: telemetryContext.relationshipBucket,
    });
    postReasoningOutcomes(telemetryContext, [
      {
        outcomeKind: "SURVEY_STARTED",
        slot: nodeSlot(currentNodeId),
        variantArmId: entryArmId,
      },
    ]);
  }, [currentNodeId, hydrated, initialReferrer, runtimeSession.variantArmIds, telemetryContext]);

  useEffect(() => {
    if (!hydrated) return;
    const node = CALL_SCRIPT_TOPOLOGY[currentNodeId];
    nodeEnteredAtRef.current = Date.now();
    if (node?.kind === "objection" && !seenObjectionsRef.current.has(currentNodeId)) {
      seenObjectionsRef.current.add(currentNodeId);
      const armId = currentArmIdForNode(runtimeSession.variantArmIds, currentNodeId);
      trackReasoningObjectionShown({
        variantSetId: telemetryContext.variantSetId,
        policyDecisionId: telemetryContext.policyDecisionId,
        localeKey: telemetryContext.localeKey,
        hostKey: telemetryContext.hostKey,
        surface: telemetryContext.surface,
        objectionId: currentNodeId,
      });
      postReasoningOutcomes(telemetryContext, [
        {
          outcomeKind: "OBJECTION_SHOWN",
          slot: "OBJECTION_NODE",
          variantArmId: armId,
        },
      ]);
    }
  }, [currentNodeId, hydrated, runtimeSession.variantArmIds, telemetryContext]);

  const isColdOpener = !initialReferrer && !searchParams?.get("rel");

  const advance = useCallback((next: NodeId) => {
    setCurrentNodeId(next);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("at", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const logWalkAway = useCallback((exitNodeId: NodeId) => {
    const armId = currentArmIdForNode(runtimeSession.variantArmIds, exitNodeId);
    const slot = nodeSlot(exitNodeId);
    trackReasoningWalkAway({
      variantSetId: telemetryContext.variantSetId,
      policyDecisionId: telemetryContext.policyDecisionId,
      localeKey: telemetryContext.localeKey,
      hostKey: telemetryContext.hostKey,
      surface: telemetryContext.surface,
      exitNodeId,
    });
    postReasoningOutcomes(telemetryContext, [
      {
        outcomeKind: "WALK_AWAY",
        slot,
        variantArmId: armId,
      },
    ]);
  }, [runtimeSession.variantArmIds, telemetryContext]);

  const handleClaim = (nodeId: NodeId, answer: "yes" | "no") => {
    const spec = CALL_SCRIPT_TOPOLOGY[nodeId];
    if (!spec || spec.kind !== "claim") return;
    const armId = currentArmIdForNode(runtimeSession.variantArmIds, nodeId);
    const timeOnNodeMs = Date.now() - nodeEnteredAtRef.current;
    setAnswers((a) => ({ ...a, [nodeId]: answer }));
    trackReasoningChainNodeExited({
      variantSetId: telemetryContext.variantSetId,
      policyDecisionId: telemetryContext.policyDecisionId,
      localeKey: telemetryContext.localeKey,
      hostKey: telemetryContext.hostKey,
      surface: telemetryContext.surface,
      nodeId,
      answer,
    });
    trackReasoningChainNodeAdvanced({
      variantSetId: telemetryContext.variantSetId,
      policyDecisionId: telemetryContext.policyDecisionId,
      localeKey: telemetryContext.localeKey,
      hostKey: telemetryContext.hostKey,
      surface: telemetryContext.surface,
      nodeId,
      timeOnNodeMs,
    });
    postReasoningOutcomes(telemetryContext, [
      {
        outcomeKind: "NODE_EXITED",
        slot: "CHAIN_NODE",
        variantArmId: armId,
        value: answer === "yes" ? 1 : 0,
      },
      {
        outcomeKind: "NODE_ADVANCED",
        slot: "CHAIN_NODE",
        variantArmId: armId,
        value: timeOnNodeMs,
      },
    ]);
    advance(answer === "yes" ? spec.yes : spec.no);
  };

  const handleObjectionReAnswer = (nodeId: NodeId) => {
    const spec = CALL_SCRIPT_TOPOLOGY[nodeId];
    if (!spec || spec.kind !== "objection") return;
    const armId = currentArmIdForNode(runtimeSession.variantArmIds, nodeId);
    trackReasoningObjectionResolved({
      variantSetId: telemetryContext.variantSetId,
      policyDecisionId: telemetryContext.policyDecisionId,
      localeKey: telemetryContext.localeKey,
      hostKey: telemetryContext.hostKey,
      surface: telemetryContext.surface,
      objectionId: nodeId,
      resolution: "accepted",
    });
    postReasoningOutcomes(telemetryContext, [
      {
        outcomeKind: "OBJECTION_RESOLVED",
        slot: "OBJECTION_NODE",
        variantArmId: armId,
        value: 1,
      },
    ]);
    advance(spec.reAnswer);
  };

  const handleObjectionStillDisagree = (nodeId: NodeId) => {
    const spec = CALL_SCRIPT_TOPOLOGY[nodeId];
    if (!spec || spec.kind !== "objection") return;
    const armId = currentArmIdForNode(runtimeSession.variantArmIds, nodeId);
    trackReasoningObjectionResolved({
      variantSetId: telemetryContext.variantSetId,
      policyDecisionId: telemetryContext.policyDecisionId,
      localeKey: telemetryContext.localeKey,
      hostKey: telemetryContext.hostKey,
      surface: telemetryContext.surface,
      objectionId: nodeId,
      resolution: "still-disagree",
    });
    postReasoningOutcomes(telemetryContext, [
      {
        outcomeKind: "OBJECTION_RESOLVED",
        slot: "OBJECTION_NODE",
        variantArmId: armId,
        value: 0,
      },
    ]);
    logWalkAway(nodeId);
    advance(spec.stillDisagree);
  };

  const handleEndThis = () => {
    const nodeId = currentNodeId;
    const node = CALL_SCRIPT_TOPOLOGY[nodeId];
    if (node?.kind === "claim") {
      const armId = currentArmIdForNode(runtimeSession.variantArmIds, nodeId);
      trackReasoningChainNodeExited({
        variantSetId: telemetryContext.variantSetId,
        policyDecisionId: telemetryContext.policyDecisionId,
        localeKey: telemetryContext.localeKey,
        hostKey: telemetryContext.hostKey,
        surface: telemetryContext.surface,
        nodeId,
        answer: "end-this",
      });
      postReasoningOutcomes(telemetryContext, [
        {
          outcomeKind: "NODE_EXITED",
          slot: "CHAIN_NODE",
          variantArmId: armId,
          value: -1,
        },
      ]);
    }
    logWalkAway(nodeId);
    advance("term:decline-polite");
  };

  const node = CALL_SCRIPT_TOPOLOGY[currentNodeId];

  const acceptedClaims = useMemo(() => {
    const list: Array<{ id: NodeId; headline: string }> = [];
    for (const [id, answer] of Object.entries(answers)) {
      if (answer !== "yes") continue;
      const spec = CALL_SCRIPT_TOPOLOGY[id];
      if (spec?.kind !== "claim") continue;
      const headline = arms.claims[id]?.headline ?? id;
      list.push({ id, headline });
    }
    return list;
  }, [answers, arms.claims]);

  const referralUrlFor = (bucket: RelationshipBucket): string => {
    if (typeof window === "undefined") return "";
    const url = new URL("/reasoning", window.location.origin);
    url.searchParams.set("rel", bucket);
    if (runtimeSession.localeKey && runtimeSession.localeKey !== "en") {
      url.searchParams.set("locale", runtimeSession.localeKey);
    }
    return url.toString();
  };

  const setProbabilityFor = (nodeId: NodeId) => (v: number) => {
    const previous = claimProbabilities[nodeId] ?? 0.9;
    setClaimProbabilities((p) => ({ ...p, [nodeId]: v }));
    const armId = currentArmIdForNode(runtimeSession.variantArmIds, nodeId);
    trackReasoningProbabilityChanged({
      variantSetId: telemetryContext.variantSetId,
      policyDecisionId: telemetryContext.policyDecisionId,
      localeKey: telemetryContext.localeKey,
      hostKey: telemetryContext.hostKey,
      surface: telemetryContext.surface,
      nodeId,
      from: previous,
      to: v,
    });
    postReasoningOutcomes(telemetryContext, [
      {
        outcomeKind: "PROBABILITY_CHANGED",
        slot: "CHAIN_NODE",
        variantArmId: armId,
        value: v,
      },
    ]);
  };

  const probabilityFor = (nodeId: NodeId): number =>
    claimProbabilities[nodeId] ?? 0.9;

  const isDashboardVisible =
    node?.kind === "claim" ||
    node?.kind === "objection" ||
    node?.kind === "inevitability";

  const handleReplicationSend = useCallback((params: {
    bucket: RelationshipBucket;
    channel: string;
    message: string;
  }) => {
    const armId =
      runtimeSession.variantArmIds[handoffSlotKey(params.bucket)] ??
      currentArmIdForNode(runtimeSession.variantArmIds, "replication");
    const msSinceStart = Date.now() - Date.parse(runtimeSession.startedAt);
    trackReasoningReplicationSendInitiated({
      variantSetId: telemetryContext.variantSetId,
      policyDecisionId: telemetryContext.policyDecisionId,
      localeKey: telemetryContext.localeKey,
      hostKey: telemetryContext.hostKey,
      surface: telemetryContext.surface,
      bucket: params.bucket,
      channel: params.channel,
    });
    trackReasoningReplicationSendConfirmed({
      variantSetId: telemetryContext.variantSetId,
      policyDecisionId: telemetryContext.policyDecisionId,
      localeKey: telemetryContext.localeKey,
      hostKey: telemetryContext.hostKey,
      surface: telemetryContext.surface,
      bucket: params.bucket,
      channel: params.channel,
      msSinceVote: msSinceStart,
    });
    postReasoningOutcomes(telemetryContext, [
      {
        outcomeKind: "FIRST_SEND_INITIATED",
        slot: "REPLICATION_CTA",
        variantArmId: armId,
        channel: params.channel,
      },
      {
        outcomeKind: "FIRST_SEND_CONFIRMED",
        slot: "REPLICATION_CTA",
        variantArmId: armId,
        channel: params.channel,
        value: msSinceStart,
      },
    ]);
    setRuntimeSession((current) => ({
      ...current,
      firstSendConfirmed: true,
      sendCount: current.sendCount + 1,
    }));
  }, [runtimeSession.startedAt, runtimeSession.variantArmIds, telemetryContext]);

  const handleSigned = useCallback(() => {
    trackReasoningVote({
      variantSetId: telemetryContext.variantSetId,
      policyDecisionId: telemetryContext.policyDecisionId,
      localeKey: telemetryContext.localeKey,
      hostKey: telemetryContext.hostKey,
      surface: telemetryContext.surface,
      chainLength: runtimeSession.chainDepth,
    });
    postReasoningOutcomes(
      telemetryContext,
      Object.entries(runtimeSession.variantArmIds).map(([slotKey, armId]) => ({
        outcomeKind: "VOTE" as const,
        slot: slotForSlotKey(slotKey),
        variantArmId: armId,
      })),
    );
    advance("term:cta-signed");
  }, [advance, runtimeSession.chainDepth, runtimeSession.variantArmIds, telemetryContext]);

  return (
    <div className="min-h-screen pb-32 pt-8 px-4">
      <div className="max-w-3xl mx-auto">
        <ReferralStrip referrerDisplayName={initialReferrer} />

        <AnimatePresence mode="wait">
          {node?.kind === "claim" && arms.claims[node.id] ? (
            <ClaimNodeView
              key={node.id}
              content={arms.claims[node.id]!}
              isColdOpener={isColdOpener && node.id === ENTRY_NODE_ID}
              probability={probabilityFor(node.id)}
              onProbabilityChange={setProbabilityFor(node.id)}
              onAnswer={(a) => handleClaim(node.id, a)}
              onEndThis={handleEndThis}
            />
          ) : null}

          {node?.kind === "objection" && arms.objections[node.id] ? (
            <ObjectionNodeView
              key={node.id}
              content={arms.objections[node.id]!}
              onReAnswer={() => handleObjectionReAnswer(node.id)}
              onStillDisagree={() => handleObjectionStillDisagree(node.id)}
              onEndThis={handleEndThis}
            />
          ) : null}

          {node?.kind === "inevitability" && arms.inevitability ? (
            <InevitabilityNodeView
              key={node.id}
              content={arms.inevitability}
              acceptedClaims={acceptedClaims}
              claimProbabilities={claimProbabilities}
              onRejectClaim={(id) => {
                const spec = CALL_SCRIPT_TOPOLOGY[id];
                if (spec?.kind === "claim") advance(spec.no);
              }}
              onProceed={() => {
                const armId = currentArmIdForNode(runtimeSession.variantArmIds, node.id);
                postReasoningOutcomes(telemetryContext, [
                  {
                    outcomeKind: "NODE_ADVANCED",
                    slot: "INEVITABILITY",
                    variantArmId: armId,
                  },
                ]);
                advance(node.proceed);
              }}
              onEndThis={handleEndThis}
            />
          ) : null}

          {node?.kind === "replication" && arms.replication ? (
            <ReplicationNodeView
              key={node.id}
              content={arms.replication}
              handoffTemplates={arms.handoffs}
              buildReferralUrl={referralUrlFor}
              onSend={handleReplicationSend}
              onSigned={handleSigned}
              onWalkAway={() => {
                logWalkAway(node.id);
                advance("term:decline-polite");
              }}
              signatureCount={signatureCount}
              threshold={thresholdTotal}
            />
          ) : null}

          {node?.kind === "terminal" ? (
            <TerminalNodeView
              key={node.id}
              tone={node.tone}
              body={terminalCopy(node.tone)}
              onReset={
                node.tone === "decline-polite" || node.tone === "goodbye"
                  ? () => advance(ENTRY_NODE_ID)
                  : undefined
              }
            />
          ) : null}
        </AnimatePresence>
      </div>

      {isDashboardVisible ? (
        <EvDashboard
          claimProbabilities={claimProbabilities}
          conversionP={conversionP}
          evConfig={LIVE_EV_CONFIG}
        />
      ) : null}
    </div>
  );
}

function terminalCopy(tone: "cta-signed" | "cta-shared" | "decline-polite" | "goodbye"): string {
  switch (tone) {
    case "cta-signed":
      return "Your signature is in. One forward right now saves another ~38 lives in expectation.";
    case "cta-shared":
      return "Link copied. Send it to one person tonight while the math is still in your head.";
    case "decline-polite":
      return "Fair. The door is here, no follow-up, no email. Thanks for reading.";
    case "goodbye":
      return "Understood. Go in peace.";
  }
}

function nodeSlot(nodeId: NodeId) {
  const node = CALL_SCRIPT_TOPOLOGY[nodeId];
  if (!node) return "CHAIN_NODE" as const;
  switch (node.kind) {
    case "claim":
      return "CHAIN_NODE" as const;
    case "objection":
      return "OBJECTION_NODE" as const;
    case "inevitability":
      return "INEVITABILITY" as const;
    case "replication":
      return "REPLICATION_CTA" as const;
    case "terminal":
      return "REPLICATION_CTA" as const;
  }
}
