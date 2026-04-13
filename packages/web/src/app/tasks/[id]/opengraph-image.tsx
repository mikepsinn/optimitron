import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import {
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import {
  getSignerDelayAttribution,
  getTreatyLevelCostOfDelay,
} from "@/lib/tasks/delay-attribution";
import { readTaskContext } from "@/lib/tasks/task-context";
import { getTaskDetailData } from "@/lib/tasks.server";

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Load a local image into a base64 data URI for Satori. Returns null on
 * failure so the render falls back to no photo.
 */
async function loadLocalImageAsDataUri(
  src: string | null | undefined,
): Promise<string | null> {
  if (!src || !src.startsWith("/")) return null;
  try {
    const buffer = await readFile(join(process.cwd(), "public", src));
    const mime = src.endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

const COLORS = {
  frame: "#111111",
  card: "#fff7ed",
  muted: "#444444",
  faint: "#888888",
  accent: "#e11d48",
  statRed: "#fee2e2",
  statYellow: "#fef3c7",
  statBorder: "#111111",
};

export default async function TaskOpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTaskDetailData(id, null);

  if (!data) {
    notFound();
  }

  const { task } = data;
  const delayStats = getTaskDelayStats(task);
  const context = readTaskContext(task.contextJson);

  // Compute cost of delay — per-signer share if the task has a country
  // military budget in its assigneeProfile, otherwise full treaty-level.
  const assigneeBudget = context.assigneeProfile?.budgetUsdPerYear ?? null;
  const signerAttribution =
    assigneeBudget != null
      ? getSignerDelayAttribution(assigneeBudget, delayStats.currentDelayDays)
      : null;
  const treatyLevel = getTreatyLevelCostOfDelay(delayStats.currentDelayDays);
  const costOfDelay = signerAttribution ?? treatyLevel;

  // Stat cells — only include ones with real values
  const stats: Array<{ label: string; value: string; tone: "red" | "yellow" }> = [];
  if (delayStats.currentDelayDays > 0) {
    stats.push({
      label: "Overdue",
      value: formatDelayDuration(delayStats.currentDelayDays),
      tone: "red",
    });
  }
  if (costOfDelay != null) {
    stats.push({
      label: "Deaths from delay",
      value: formatCompactCount(costOfDelay.deathsFromDelay),
      tone: "red",
    });
    stats.push({
      label: "Wasted by delay",
      value: formatCompactCurrency(costOfDelay.wastedUsd),
      tone: "yellow",
    });
  }

  const subtitle = context.difficulty?.whatItMeans ?? null;
  const difficultyLabel = context.difficulty?.label ?? null;
  const timeRequired =
    context.difficulty?.timeRequiredSeconds != null
      ? formatSeconds(context.difficulty.timeRequiredSeconds)
      : null;
  const difficultyStripParts: string[] = [];
  if (difficultyLabel) difficultyStripParts.push(`Difficulty: ${difficultyLabel}`);
  if (timeRequired) difficultyStripParts.push(`Time: ${timeRequired}`);
  const difficultyStrip = difficultyStripParts.join(" · ");

  const assigneeName =
    task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? null;
  const assigneeRole =
    context.assigneeProfile?.role ??
    context.assigneeProfile?.employerLabel ??
    null;
  const assigneeFallbackInitials = assigneeName
    ? assigneeName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "?"
    : "?";
  const rawAssigneeImage =
    task.assigneePerson?.image ?? task.assigneeOrganization?.logo ?? null;
  const assigneeImageDataUri = await loadLocalImageAsDataUri(rawAssigneeImage);

  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background:
          "linear-gradient(135deg, #f7d64a 0%, #ff6b9d 45%, #111111 100%)",
        display: "flex",
        height: "100%",
        padding: "36px",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.card,
          border: `6px solid ${COLORS.frame}`,
          boxShadow: "18px 18px 0 #111111",
          color: COLORS.frame,
          display: "flex",
          flexDirection: "column",
          gap: "22px",
          height: "100%",
          justifyContent: "space-between",
          padding: "32px 36px",
          width: "100%",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            alignItems: "center",
            color: COLORS.accent,
            display: "flex",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 1.4,
            textTransform: "uppercase",
          }}
        >
          ⚡ Optimitron · Task reminder
        </div>

        {/* Title + subtitle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              color: COLORS.frame,
              display: "flex",
              fontSize: 68,
              fontWeight: 900,
              letterSpacing: -2,
              lineHeight: 1.0,
            }}
          >
            {task.title}
          </div>
          {subtitle ? (
            <div
              style={{
                color: COLORS.muted,
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Stat cells */}
        {stats.length > 0 ? (
          <div
            style={{
              display: "flex",
              gap: "14px",
              width: "100%",
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  alignItems: "flex-start",
                  backgroundColor:
                    stat.tone === "red" ? COLORS.statRed : COLORS.statYellow,
                  border: `4px solid ${COLORS.statBorder}`,
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  gap: "6px",
                  padding: "16px 18px",
                }}
              >
                <div
                  style={{
                    color: COLORS.accent,
                    display: "flex",
                    fontSize: 16,
                    fontWeight: 900,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    color: COLORS.frame,
                    display: "flex",
                    fontSize: 48,
                    fontWeight: 900,
                    lineHeight: 1.0,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Difficulty strip */}
        {difficultyStrip ? (
          <div
            style={{
              color: COLORS.muted,
              display: "flex",
              fontSize: 18,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {difficultyStrip}
          </div>
        ) : null}

        {/* Assignee footer + URL */}
        <div
          style={{
            alignItems: "center",
            borderTop: `2px solid ${COLORS.frame}`,
            display: "flex",
            gap: "16px",
            paddingTop: "18px",
            width: "100%",
          }}
        >
          {assigneeName ? (
            <div
              style={{
                alignItems: "center",
                backgroundColor: COLORS.frame,
                color: COLORS.card,
                display: "flex",
                height: "56px",
                justifyContent: "center",
                overflow: "hidden",
                width: "56px",
              }}
            >
              {assigneeImageDataUri ? (
                <img
                  alt={assigneeName}
                  height={56}
                  src={assigneeImageDataUri}
                  style={{
                    height: "56px",
                    objectFit: "cover",
                    width: "56px",
                  }}
                  width={56}
                />
              ) : (
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    fontSize: 24,
                    fontWeight: 900,
                    height: "100%",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  {assigneeFallbackInitials}
                </div>
              )}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {assigneeName ? (
              <div
                style={{
                  color: COLORS.frame,
                  display: "flex",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                Assigned to {assigneeName}
                {assigneeRole ? ` · ${assigneeRole}` : ""}
              </div>
            ) : null}
            <div
              style={{
                color: COLORS.faint,
                display: "flex",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              optimitron.earth/tasks/{task.id}
            </div>
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1)} hr`;
}
