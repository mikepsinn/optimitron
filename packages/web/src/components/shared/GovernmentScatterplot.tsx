"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GovernmentMetrics } from "@optimitron/data/datasets/government-report-cards";
import { Switch } from "@/components/retroui/Switch";
import {
  GOVERNMENT_SCATTERPLOT_DEFAULT_X,
  GOVERNMENT_SCATTERPLOT_DEFAULT_Y,
  GOVERNMENT_SCATTER_METRICS,
  type GovernmentScatterMetricKey,
  buildGovernmentScatterplotData,
  calculatePearsonCorrelation,
  describeCorrelation,
  filterGovernmentScatterOutliers,
  formatGovernmentScatterMetricValue,
} from "./governmentScatterplotMetrics";
import {
  buildScatterRegressionSegment,
  getScatterAxisDomain,
} from "./governmentScatterplotGeometry";
import { GovernmentScatterMetricPicker } from "./GovernmentScatterMetricPicker";
import { describeGovernmentScatterRelationship } from "./governmentScatterplotNarrative";

interface GovernmentScatterplotProps {
  governments: GovernmentMetrics[];
}

export function GovernmentScatterplot({
  governments,
}: GovernmentScatterplotProps) {
  const router = useRouter();
  const [xMetric, setXMetric] = useState<GovernmentScatterMetricKey>(
    GOVERNMENT_SCATTERPLOT_DEFAULT_X,
  );
  const [yMetric, setYMetric] = useState<GovernmentScatterMetricKey>(
    GOVERNMENT_SCATTERPLOT_DEFAULT_Y,
  );
  const [excludeOutliers, setExcludeOutliers] = useState(false);

  const xMeta =
    GOVERNMENT_SCATTER_METRICS.find((metric) => metric.key === xMetric) ??
    GOVERNMENT_SCATTER_METRICS[0];
  const yMeta =
    GOVERNMENT_SCATTER_METRICS.find((metric) => metric.key === yMetric) ??
    GOVERNMENT_SCATTER_METRICS[0];
  const allPoints = buildGovernmentScatterplotData(governments, xMetric, yMetric);
  const points = excludeOutliers
    ? filterGovernmentScatterOutliers(allPoints)
    : allPoints;
  const hiddenOutliers = allPoints.length - points.length;
  const correlation = calculatePearsonCorrelation(points);
  const xDomain = getScatterAxisDomain(points.map((point) => point.x));
  const yDomain = getScatterAxisDomain(points.map((point) => point.y));
  const regressionSegment = buildScatterRegressionSegment(points, xDomain);
  const relationshipExplanation = describeGovernmentScatterRelationship({
    correlation,
    hiddenOutliers,
    pointCount: points.length,
    xLabel: xMeta.label,
    yLabel: yMeta.label,
  });

  return (
    <div className="border-4 border-primary bg-background p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="max-w-2xl">
            <h3 className="text-lg font-black uppercase text-foreground sm:text-xl">
              Metric Correlation Explorer
            </h3>
            <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
              Default view compares military spending per clinical-trial dollar
              against healthy life expectancy. Switch either axis to inspect any
              tracked metric pair, then click a dot to open that country page.
            </p>
          </div>
          <div className="grid w-full gap-3 md:grid-cols-2">
            <GovernmentScatterMetricPicker
              label="X Axis"
              value={xMetric}
              onValueChange={setXMetric}
            />
            <GovernmentScatterMetricPicker
              label="Y Axis"
              value={yMetric}
              onValueChange={setYMetric}
            />
            <label className="flex items-center justify-between gap-4 border-4 border-primary bg-background px-4 py-3 md:col-span-2">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.12em] text-foreground">
                  Exclude Outliers
                </div>
                <div className="mt-1 text-[11px] font-bold leading-relaxed text-muted-foreground">
                  Hide countries outside the 1.5x IQR range on either axis.
                </div>
              </div>
              <Switch
                aria-label="Exclude outliers on scatterplot"
                checked={excludeOutliers}
                onCheckedChange={setExcludeOutliers}
              />
            </label>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="border-2 border-primary bg-muted px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Countries Plotted
            </div>
            <div className="text-2xl font-black text-foreground">{points.length}</div>
          </div>
          <div className="border-2 border-primary bg-muted px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Pearson r
            </div>
            <div className="text-2xl font-black text-foreground">
              {correlation === null ? "—" : correlation.toFixed(2)}
            </div>
          </div>
          <div className="border-2 border-primary bg-muted px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Read
            </div>
            <div className="text-lg font-black text-foreground">
              {describeCorrelation(correlation)}
            </div>
          </div>
          <div className="border-2 border-primary bg-muted px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Outliers Hidden
            </div>
            <div className="text-2xl font-black text-foreground">{hiddenOutliers}</div>
          </div>
        </div>

        <div className="border-2 border-primary bg-muted px-4 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            Relationship
          </div>
          <p className="mt-2 text-sm font-bold leading-relaxed text-foreground">
            {relationshipExplanation}
          </p>
        </div>

        <div className="h-[26rem] w-full">
          {points.length < 2 ? (
            <div className="flex h-full items-center justify-center border-2 border-dashed border-primary bg-muted px-6 text-center text-sm font-bold text-muted-foreground">
              Not enough comparable countries for this metric pair yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 24, bottom: 40, left: 28 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={xDomain ?? ["auto", "auto"]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value) =>
                    formatGovernmentScatterMetricValue(xMetric, Number(value))
                  }
                  label={{
                    value: xMeta.label,
                    position: "insideBottom",
                    offset: -14,
                    fill: "var(--muted-foreground)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  name={xMeta.label}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={yDomain ?? ["auto", "auto"]}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value) =>
                    formatGovernmentScatterMetricValue(yMetric, Number(value))
                  }
                  label={{
                    value: yMeta.label,
                    angle: -90,
                    position: "insideLeft",
                    offset: -12,
                    fill: "var(--muted-foreground)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  name={yMeta.label}
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 2 }}
                  content={({ active, payload }) => {
                    const point = payload?.[0]?.payload as
                      | (typeof points)[number]
                      | undefined;
                    if (!active || !point) {
                      return null;
                    }

                    return (
                      <div className="border-4 border-primary bg-background p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-sm font-black uppercase text-foreground">
                          {point.name}
                        </div>
                        <div className="mt-2 space-y-1 text-xs font-bold text-muted-foreground">
                          <div>
                            {xMeta.label}:{" "}
                            <span className="text-foreground">
                              {formatGovernmentScatterMetricValue(xMetric, point.x)}
                            </span>
                          </div>
                          <div>
                            {yMeta.label}:{" "}
                            <span className="text-foreground">
                              {formatGovernmentScatterMetricValue(yMetric, point.y)}
                            </span>
                          </div>
                          <div>
                            Killed:{" "}
                            <span className="text-foreground">
                              {formatGovernmentScatterMetricValue(
                                "bodyCount",
                                point.bodyCount,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                {regressionSegment ? (
                  <ReferenceLine
                    ifOverflow="extendDomain"
                    segment={regressionSegment}
                    stroke="var(--primary)"
                    strokeDasharray="6 4"
                    strokeWidth={3}
                  />
                ) : null}
                <Scatter
                  data={points}
                  fill="var(--foreground)"
                  onClick={(point) => {
                    const code = (point as { code?: string } | undefined)?.code;
                    if (code) {
                      router.push(`/governments/${code}`);
                    }
                  }}
                >
                  <LabelList
                    dataKey="code"
                    fill="var(--muted-foreground)"
                    fontSize={10}
                    fontWeight={800}
                    offset={8}
                    position="top"
                  />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex justify-end text-xs font-bold text-muted-foreground">
          <span>
            {excludeOutliers ? "Filter: 1.5x IQR" : "Filter: none"}
          </span>
        </div>
      </div>
    </div>
  );
}
