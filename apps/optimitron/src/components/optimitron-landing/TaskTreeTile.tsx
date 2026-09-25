"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Signer, TaskTreeNode } from "./landing-data";
import { Tile, accentTextClass, landingLinkClass } from "./LandingSection";
import { useLiveMotion } from "./use-live-motion";

const STEP_MS = 1100;
const MAX_DEPTH = 3;
// After the tree is fully open, rotate this many assignees before folding it
// back to the goal and splitting it again.
const SIGNERS_PER_PASS = 5;

/**
 * The goal splits into missions, programs, and tasks, one level at a time,
 * then the signing task cycles through the heads of government it is
 * assigned to.
 */
export function TaskTreeTile({
  nodes,
  signers,
}: {
  nodes: readonly TaskTreeNode[];
  signers: Signer[];
}) {
  const live = useLiveMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => setTick((current) => current + 1), STEP_MS);
    return () => window.clearInterval(timer);
  }, [live]);

  // Each pass opens the tree one level per step, then shows the next few
  // assignees, so repeated passes walk the whole signer list.
  const passLength = MAX_DEPTH + SIGNERS_PER_PASS;
  const step = live ? tick % passLength : passLength - 1;
  const pass = Math.floor(tick / passLength);
  const visibleDepth = Math.min(step, MAX_DEPTH);
  const signerIndex = pass * SIGNERS_PER_PASS + Math.max(0, step - MAX_DEPTH);
  const signer = signers.length > 0 ? signers[signerIndex % signers.length] : undefined;

  return (
    <Tile note="Big goals split into tasks people can claim" title="Decentralized to-do list for humanity">
      <ul className="flex flex-col gap-1.5 text-sm leading-snug">
        {nodes.map((node) => (
          <li
            className={cn(
              "border-l border-foreground/15",
              node.depth === 0 ? "border-l-0 font-bold" : "text-muted-foreground",
              node.depth > visibleDepth && "hidden",
            )}
            key={node.taskKey}
            style={{ marginLeft: `${Math.max(0, node.depth - 1) * 0.9}rem`, paddingLeft: node.depth === 0 ? 0 : "0.6rem" }}
          >
            <span className={node.depth <= 1 ? "text-foreground" : undefined}>{node.title}</span>
            {node.signers && signer ? (
              <span className={`block font-mono font-bold ${accentTextClass}`}>
                Assigned: {signer.name}, {signer.country}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-5">
        <Link className={landingLinkClass} href={ROUTES.tasksTree}>
          Open the to-do list
        </Link>
      </div>
    </Tile>
  );
}
