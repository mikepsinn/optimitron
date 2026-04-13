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
import { readTaskContext } from "@/lib/tasks/task-context";
import { getTaskDetailData } from "@/lib/tasks.server";

/**
 * Resolve a Person.image URL into a base64 data URI Satori can render.
 * - Local paths like "/images/leaders/us.jpg" → read from public/ at build time
 * - Remote https URLs → return as-is (Satori follows redirects on https)
 * - Wikimedia Special:FilePath URLs → return null (Satori can't follow them)
 * - Anything that fails → null → falls back to initials
 */
async function resolveImageForOg(src: string | null | undefined): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith("/")) {
    try {
      const buffer = await readFile(join(process.cwd(), "public", src));
      const mime = src.endsWith(".png")
        ? "image/png"
        : src.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
      return `data:${mime};base64,${buffer.toString("base64")}`;
    } catch {
      return null;
    }
  }
  if (src.includes("Special:FilePath")) return null;
  if (src.startsWith("https://")) return src;
  return null;
}

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
  const targetLabel =
    task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;
  // Resolve local paths to base64 data URIs so Satori doesn't have to fetch
  // anything over HTTP during render. Remote Special:FilePath URLs drop to
  // the initials fallback — see resolveImageForOg above.
  const rawImageSrc =
    task.assigneePerson?.image ?? task.assigneeOrganization?.logo ?? null;
  const imageSrc = await resolveImageForOg(rawImageSrc);
  const fallbackInitials = targetLabel
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const subtitle =
    context.assigneeProfile?.role ?? context.assigneeProfile?.employerLabel ?? task.category;
  const statCards: Array<{ label: string; value: string }> = [];
  if (delayStats.currentDelayDays > 0) {
    statCards.push({
      label: "Delay So Far",
      value: formatDelayDuration(delayStats.currentDelayDays),
    });
  }
  if (
    delayStats.currentHumanLivesLost != null &&
    delayStats.currentHumanLivesLost > 0
  ) {
    statCards.push({
      label: "Deaths From Delay",
      value: formatCompactCount(delayStats.currentHumanLivesLost),
    });
  }
  if (
    delayStats.currentSufferingHoursLost != null &&
    delayStats.currentSufferingHoursLost > 0
  ) {
    statCards.push({
      label: "Suffering Hours",
      value: formatCompactCount(delayStats.currentSufferingHoursLost),
    });
  }
  if (
    delayStats.currentEconomicValueUsdLost != null &&
    delayStats.currentEconomicValueUsdLost > 0
  ) {
    statCards.push({
      label: "Economic Loss",
      value: formatCompactCurrency(delayStats.currentEconomicValueUsdLost),
    });
  }
  const difficultyLabel = context.difficulty?.label ?? null;

  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background:
          "linear-gradient(135deg, #f7d64a 0%, #ff6b9d 45%, #111111 100%)",
        color: "#111111",
        display: "flex",
        height: "100%",
        padding: "40px",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff7ed",
          border: "6px solid #111111",
          boxShadow: "18px 18px 0 #111111",
          display: "flex",
          gap: "28px",
          height: "100%",
          padding: "28px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            justifyContent: "center",
            width: "300px",
          }}
        >
          <div
            style={{
              alignItems: "center",
              backgroundColor: "#111111",
              border: "6px solid #111111",
              color: "#fff7ed",
              display: "flex",
              height: "260px",
              justifyContent: "center",
              overflow: "hidden",
              width: "260px",
            }}
          >
            {imageSrc ? (
              <img
                alt={targetLabel}
                height={260}
                src={imageSrc}
                style={{
                  height: "260px",
                  objectFit: "cover",
                  width: "260px",
                }}
                width={260}
              />
            ) : (
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  fontSize: 96,
                  fontWeight: 900,
                  height: "100%",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                {fallbackInitials || "?"}
              </div>
            )}
          </div>
          <div
            style={{
              color: "#e11d48",
              display: "flex",
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {delayStats.isOverdue
              ? `${formatDelayDuration(delayStats.currentDelayDays)} overdue`
              : "awaiting action"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            gap: "18px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                color: "#e11d48",
                display: "flex",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              {subtitle}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 900,
                letterSpacing: -2,
                lineHeight: 1,
              }}
            >
              {targetLabel}
            </div>
            <div
              style={{
                color: "#444444",
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              {task.title}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            {statCards.map((stat) => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: "#ffffff",
                  border: "4px solid #111111",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  padding: "16px",
                  width: "calc(50% - 7px)",
                }}
              >
                <div
                  style={{
                    color: "#e11d48",
                    display: "flex",
                    fontSize: 18,
                    fontWeight: 900,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 32,
                    fontWeight: 900,
                    lineHeight: 1.05,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              alignItems: "center",
              color: "#444444",
              display: "flex",
              fontSize: 18,
              fontWeight: 800,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex" }}>optimitron.earth/tasks/{task.id}</div>
            <div style={{ color: "#111111", display: "flex", textTransform: "uppercase" }}>
              {difficultyLabel ? `Difficulty: ${difficultyLabel}` : "Do your job"}
            </div>
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
