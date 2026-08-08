"use client";

import { useCallback, useState } from "react";
import { ExpectedValueExplainer } from "@/components/shared/ExpectedValueExplainer";
import type {
  PublicParameterTraceNode,
  PublicTaskImpactTrace,
  PublicTraceSourceArtifact,
} from "@/lib/parameters/task-impact-trace";

type LoadState = "idle" | "loading" | "loaded" | "error";

function formatTraceNumber(value: number) {
  if (!Number.isFinite(value)) return String(value);
  const absolute = Math.abs(value);
  if ((absolute !== 0 && absolute < 0.001) || absolute >= 1e9) {
    return value.toExponential(3);
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function TraceSources({ sources }: { sources: PublicTraceSourceArtifact[] }) {
  const visibleSources = sources.filter(
    (source) =>
      source.sourceUrl != null ||
      (source.artifactType === "MANUAL_SECTION" && source.sourceRef != null),
  );
  if (visibleSources.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
      {visibleSources.map((source) => (
        <li className="break-words" key={source.id}>
          {source.sourceUrl ? (
            <a
              className="font-bold text-foreground underline underline-offset-4"
              href={source.sourceUrl}
              rel="noreferrer"
              target="_blank"
            >
              {source.title ?? source.sourceRef ?? "Source"}
            </a>
          ) : (
            <span className="font-bold text-foreground">
              {source.title ?? source.sourceRef ?? "Source"}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function ParameterTraceNode({
  node,
  symbol,
}: {
  node: PublicParameterTraceNode;
  symbol: string;
}) {
  const formula = node.formulaText ?? node.formulaLatex;
  const name = node.displayName ?? node.description ?? node.key;
  const header = (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="break-words text-sm font-bold">{name}</span>
      <code className="break-all text-xs text-muted-foreground">{symbol}</code>
      <span className="text-sm font-black">
        {formatTraceNumber(node.value)} {node.unit}
      </span>
      {node.stale ? (
        <span className="text-xs font-black uppercase text-foreground">
          superseded input
        </span>
      ) : null}
    </span>
  );
  const details = (
    <>
      {formula ? (
        <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words bg-muted p-2 text-xs">
          <code>{formula}</code>
        </pre>
      ) : null}
      {node.rationale ? (
        <p className="mt-2 text-xs text-muted-foreground">{node.rationale}</p>
      ) : null}
      <TraceSources sources={node.sourceArtifacts} />
      {node.inputs.length > 0 ? (
        <ol className="mt-3 space-y-3">
          {node.inputs.map((input) => (
            <ParameterTraceNode
              key={`${input.symbol}:${input.revision.id}`}
              node={input.revision}
              symbol={input.symbol}
            />
          ))}
        </ol>
      ) : null}
    </>
  );

  return (
    <li className="border-l border-foreground pl-3 sm:pl-4">
      {node.inputs.length > 0 ? (
        <details>
          <summary className="cursor-pointer py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            {header}
          </summary>
          <div className="pb-1 pl-1">{details}</div>
        </details>
      ) : (
        <>
          {header}
          {details}
        </>
      )}
    </li>
  );
}

function TraceBody({ trace }: { trace: PublicTaskImpactTrace }) {
  const frame = trace.frames[0] ?? null;
  const formula = trace.estimate.formulaText ?? trace.estimate.formulaLatex;
  return (
    <div className="space-y-5 pb-5 pt-4">
      {trace.stale ? (
        <p className="text-sm font-black">
          This calculation uses an older revision of at least one input.
        </p>
      ) : null}

      <div>
        <h3 className="text-sm font-black">Estimate</h3>
        <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {frame?.expectedEconomicValueUsdBase != null ? (
            <div>
              <dt className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                Expected value
                <ExpectedValueExplainer />
              </dt>
              <dd className="font-black">
                ${formatTraceNumber(frame.expectedEconomicValueUsdBase)}
              </dd>
            </div>
          ) : null}
          {frame?.expectedDalysAvertedBase != null ? (
            <div>
              <dt className="text-xs font-bold text-muted-foreground">
                DALYs averted
              </dt>
              <dd className="font-black">
                {formatTraceNumber(frame.expectedDalysAvertedBase)}
              </dd>
            </div>
          ) : null}
          {frame?.estimatedCashCostUsdBase != null ? (
            <div>
              <dt className="text-xs font-bold text-muted-foreground">
                Cash cost
              </dt>
              <dd className="font-black">
                ${formatTraceNumber(frame.estimatedCashCostUsdBase)}
              </dd>
            </div>
          ) : null}
          {frame?.estimatedEffortHoursBase != null ? (
            <div>
              <dt className="text-xs font-bold text-muted-foreground">
                Effort
              </dt>
              <dd className="font-black">
                {formatTraceNumber(frame.estimatedEffortHoursBase)} hours
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div>
        <h3 className="text-sm font-black">Formula</h3>
        {formula ? (
          <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words bg-muted p-2 text-xs">
            <code>{formula}</code>
          </pre>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No human-readable formula was recorded for this estimate.
          </p>
        )}
      </div>

      {trace.parameterTraces.length > 0 ? (
        <div>
          <h3 className="text-sm font-black">Inputs</h3>
          <ol className="mt-3 space-y-4">
            {trace.parameterTraces.map((input) => (
              <ParameterTraceNode
                key={`${input.symbol}:${input.revision.id}`}
                node={input.revision}
                symbol={input.symbol}
              />
            ))}
          </ol>
        </div>
      ) : null}

      <TraceSources sources={trace.sourceArtifacts} />
    </div>
  );
}

export function TaskImpactTraceDisclosure({ taskId }: { taskId: string }) {
  const [state, setState] = useState<LoadState>("idle");
  const [trace, setTrace] = useState<PublicTaskImpactTrace | null>(null);

  const loadTrace = useCallback(async () => {
    if (state === "loading" || state === "loaded") return;
    setState("loading");
    try {
      const response = await fetch(`/api/tasks/${taskId}/impact-trace`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Estimate calculation unavailable.");
      setTrace((await response.json()) as PublicTaskImpactTrace);
      setState("loaded");
    } catch {
      setState("error");
    }
  }, [state, taskId]);

  return (
    <details
      className="border-b border-foreground"
      onToggle={(event) => {
        if (event.currentTarget.open && state === "idle") void loadTrace();
      }}
    >
      <summary className="cursor-pointer py-4 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
        Estimate calculation and sources
      </summary>
      {state === "loading" ? (
        <p className="pb-5 text-sm text-muted-foreground">
          Loading calculation...
        </p>
      ) : null}
      {state === "error" ? (
        <div className="flex flex-wrap items-center gap-3 pb-5">
          <p className="text-sm text-muted-foreground">
            Estimate calculation unavailable.
          </p>
          <button
            className="border border-foreground px-3 py-1 text-sm font-black"
            onClick={() => void loadTrace()}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : null}
      {state === "loaded" && trace ? <TraceBody trace={trace} /> : null}
    </details>
  );
}
