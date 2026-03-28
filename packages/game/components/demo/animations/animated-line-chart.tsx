"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface LineData {
  points: DataPoint[];
  color?: string;
  label?: string;
  dashed?: boolean;
}

interface AnimatedLineChartProps {
  lines: LineData[];
  width?: number;
  height?: number;
  animate?: boolean;
  duration?: number;
  delay?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  showArea?: boolean;
  className?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  formatY?: (value: number) => string;
  formatX?: (value: number) => string;
  yMinOverride?: number;
}

export function AnimatedLineChart({
  lines,
  width = 400,
  height = 200,
  animate = true,
  duration = 2000,
  delay = 0,
  showGrid = true,
  showLabels = true,
  showArea = false,
  className,
  xAxisLabel,
  yAxisLabel,
  formatY = (v) => v.toString(),
  formatX,
  yMinOverride,
}: AnimatedLineChartProps) {
  const [progress, setProgress] = useState(animate ? 0 : 1);
  const svgRef = useRef<SVGSVGElement>(null);

  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate bounds
  const allPoints = lines.flatMap((l) => l.points);
  const xMin = Math.min(...allPoints.map((p) => p.x));
  const xMax = Math.max(...allPoints.map((p) => p.x));
  const yMin = yMinOverride !== undefined ? yMinOverride : Math.min(...allPoints.map((p) => p.y), 0);
  const yMax = Math.max(...allPoints.map((p) => p.y));

  const scaleX = (x: number) =>
    padding.left + ((x - xMin) / (xMax - xMin || 1)) * chartWidth;
  const scaleY = (y: number) =>
    padding.top + chartHeight - ((y - yMin) / (yMax - yMin || 1)) * chartHeight;

  useEffect(() => {
    if (!animate) return;

    const timeout = setTimeout(() => {
      const startTime = performance.now();

      const animateProgress = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const newProgress = Math.min(elapsed / duration, 1);
        setProgress(newProgress);

        if (newProgress < 1) {
          requestAnimationFrame(animateProgress);
        }
      };

      requestAnimationFrame(animateProgress);
    }, delay);

    return () => clearTimeout(timeout);
  }, [animate, delay, duration]);

  const getPath = (points: DataPoint[], progressVal: number) => {
    if (points.length === 0) return "";

    const visibleCount = Math.ceil(points.length * progressVal);
    const visiblePoints = points.slice(0, visibleCount);

    if (visiblePoints.length === 0) return "";

    return visiblePoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x)} ${scaleY(p.y)}`)
      .join(" ");
  };

  const getAreaPath = (points: DataPoint[], progressVal: number) => {
    if (points.length === 0) return "";

    const visibleCount = Math.ceil(points.length * progressVal);
    const visiblePoints = points.slice(0, visibleCount);

    if (visiblePoints.length === 0) return "";

    const linePath = visiblePoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x)} ${scaleY(p.y)}`)
      .join(" ");

    const lastPoint = visiblePoints[visiblePoints.length - 1];
    const firstPoint = visiblePoints[0];

    return `${linePath} L ${scaleX(lastPoint.x)} ${scaleY(yMin)} L ${scaleX(firstPoint.x)} ${scaleY(yMin)} Z`;
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("font-pixel", className)}
      style={{ maxWidth: "100%", height: "auto" }}
    >
      {/* Grid */}
      {showGrid && (
        <g className="text-current/20">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={`h-${ratio}`}
              x1={padding.left}
              y1={padding.top + chartHeight * ratio}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight * ratio}
              stroke="currentColor"
              strokeDasharray="2,4"
            />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={`v-${ratio}`}
              x1={padding.left + chartWidth * ratio}
              y1={padding.top}
              x2={padding.left + chartWidth * ratio}
              y2={padding.top + chartHeight}
              stroke="currentColor"
              strokeDasharray="2,4"
            />
          ))}
        </g>
      )}

      {/* Y-axis labels */}
      {showLabels && (
        <g className="text-current/60" fontSize="8">
          <text x={padding.left - 5} y={padding.top} textAnchor="end" dominantBaseline="middle">
            {formatY(yMax)}
          </text>
          <text
            x={padding.left - 5}
            y={padding.top + chartHeight / 2}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {formatY((yMax + yMin) / 2)}
          </text>
          <text
            x={padding.left - 5}
            y={padding.top + chartHeight}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {formatY(yMin)}
          </text>
        </g>
      )}

      {/* X-axis tick labels */}
      {showLabels && formatX && (
        <g className="text-current/60" fontSize="8">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = xMin + (xMax - xMin) * ratio;
            return (
              <text
                key={`xt-${ratio}`}
                x={padding.left + chartWidth * ratio}
                y={padding.top + chartHeight + 14}
                textAnchor="middle"
                dominantBaseline="hanging"
              >
                {formatX(val)}
              </text>
            );
          })}
        </g>
      )}

      {/* Axis labels */}
      {xAxisLabel && (
        <text
          x={padding.left + chartWidth / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize="8"
          fill="currentColor"
          className="opacity-60"
        >
          {xAxisLabel}
        </text>
      )}
      {yAxisLabel && (
        <text
          x={10}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          fontSize="8"
          fill="currentColor"
          className="opacity-60"
          transform={`rotate(-90, 10, ${padding.top + chartHeight / 2})`}
        >
          {yAxisLabel}
        </text>
      )}

      {/* Lines */}
      {lines.map((line, i) => (
        <g key={i}>
          {showArea && (
            <path
              d={getAreaPath(line.points, progress)}
              fill={line.color || "currentColor"}
              fillOpacity={0.2}
            />
          )}
          <path
            d={getPath(line.points, progress)}
            fill="none"
            stroke={line.color || "currentColor"}
            strokeWidth={2}
            strokeDasharray={line.dashed ? "4,4" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* End point */}
          {progress > 0 && line.points.length > 0 && (
            <circle
              cx={scaleX(line.points[Math.ceil(line.points.length * progress) - 1]?.x ?? 0)}
              cy={scaleY(line.points[Math.ceil(line.points.length * progress) - 1]?.y ?? 0)}
              r={4}
              fill={line.color || "currentColor"}
            />
          )}
        </g>
      ))}

      {/* Legend */}
      {showLabels && lines.some((l) => l.label) && (
        <g>
          {lines.map((line, i) => (
            <g key={i} transform={`translate(${padding.left + i * 80}, ${height - 10})`}>
              <rect width={10} height={3} fill={line.color || "currentColor"} />
              <text x={14} y={3} fontSize="6" fill="currentColor">
                {line.label}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
