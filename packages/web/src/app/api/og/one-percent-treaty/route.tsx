import { ImageResponse } from "next/og";
import {
  fmtParam,
  fmtParamValueOnly,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
} from "@optimitron/data/parameters";
import {
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import { getTreatyLevelCostOfDelay } from "@/lib/tasks/delay-attribution";
import { TREATY_PARENT_TASK_ID } from "@/lib/tasks/task-keys";
import { getTaskDetailData } from "@/lib/tasks.server";

export const runtime = "nodejs";
export const revalidate = 300;

const SIZE = { width: 1200, height: 630 };

const COLORS = {
  bg: "#f7d64a",
  ink: "#111111",
  card: "#fff7ed",
  pink: "#ff3e9d",
  red: "#e11d48",
  redSoft: "#fee2e2",
  faint: "#555555",
};

export async function GET() {
  const data = await getTaskDetailData(TREATY_PARENT_TASK_ID, null);
  const task = data?.task ?? null;
  const delayStats = task ? getTaskDelayStats(task) : null;
  const days = delayStats?.currentDelayDays ?? 0;
  const costOfDelay = getTreatyLevelCostOfDelay(days);
  const signerCount = task?.childTasks?.length ?? 193;
  const overdueLabel =
    delayStats && delayStats.isOverdue && days > 0
      ? formatDelayDuration(days)
      : "overdue";

  const haleLabel = fmtParamValueOnly(TREATY_HALE_GAIN_YEAR_15, 3);
  const incomeLabel = fmtParam(
    TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
    3,
  );

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background:
            "linear-gradient(135deg, #f7d64a 0%, #ff6b9d 55%, #111111 100%)",
          display: "flex",
          height: "100%",
          padding: "32px",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundColor: COLORS.card,
            border: `8px solid ${COLORS.ink}`,
            boxShadow: `16px 16px 0 ${COLORS.ink}`,
            color: COLORS.ink,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            height: "100%",
            justifyContent: "space-between",
            padding: "28px 36px",
            width: "100%",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              alignItems: "center",
              color: COLORS.pink,
              display: "flex",
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
          >
            ⚡ 1% Treaty · President Management System
          </div>

          {/* Headline */}
          <div
            style={{
              color: COLORS.ink,
              display: "flex",
              fontSize: 58,
              fontWeight: 900,
              letterSpacing: -1.5,
              lineHeight: 0.98,
            }}
          >
            {signerCount} world leaders are {overdueLabel} overdue on a
            30-second task.
          </div>

          {/* Subtitle */}
          <div
            style={{
              color: COLORS.faint,
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            If they each spent 30 seconds signing, 1% of the world military
            budget would fund clinical trials that give every human +
            {haleLabel} healthy years of life and +{incomeLabel} lifetime
            income by 2040.
          </div>

          {/* Stat cells — cost of delay */}
          {costOfDelay ? (
            <div
              style={{
                display: "flex",
                gap: "14px",
                width: "100%",
              }}
            >
              <div
                style={{
                  alignItems: "flex-start",
                  backgroundColor: COLORS.redSoft,
                  border: `5px solid ${COLORS.ink}`,
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  gap: "4px",
                  padding: "14px 18px",
                }}
              >
                <div
                  style={{
                    color: COLORS.red,
                    display: "flex",
                    fontSize: 15,
                    fontWeight: 900,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                  }}
                >
                  💀 Dead from the delay
                </div>
                <div
                  style={{
                    color: COLORS.ink,
                    display: "flex",
                    fontSize: 48,
                    fontWeight: 900,
                    lineHeight: 1.0,
                  }}
                >
                  {formatCompactCount(costOfDelay.deathsFromDelay)}
                </div>
              </div>
              <div
                style={{
                  alignItems: "flex-start",
                  backgroundColor: COLORS.redSoft,
                  border: `5px solid ${COLORS.ink}`,
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  gap: "4px",
                  padding: "14px 18px",
                }}
              >
                <div
                  style={{
                    color: COLORS.red,
                    display: "flex",
                    fontSize: 15,
                    fontWeight: 900,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                  }}
                >
                  💸 Wasted on disease meanwhile
                </div>
                <div
                  style={{
                    color: COLORS.ink,
                    display: "flex",
                    fontSize: 48,
                    fontWeight: 900,
                    lineHeight: 1.0,
                  }}
                >
                  {formatCompactCurrency(costOfDelay.wastedUsd)}
                </div>
              </div>
            </div>
          ) : null}

          {/* Footer CTA */}
          <div
            style={{
              alignItems: "center",
              borderTop: `3px solid ${COLORS.ink}`,
              color: COLORS.ink,
              display: "flex",
              gap: "14px",
              paddingTop: "14px",
              width: "100%",
            }}
          >
            <div
              style={{
                alignItems: "center",
                backgroundColor: COLORS.pink,
                border: `3px solid ${COLORS.ink}`,
                color: COLORS.card,
                display: "flex",
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: 0.5,
                padding: "8px 16px",
                textTransform: "uppercase",
              }}
            >
              Remind your employees
            </div>
            <div
              style={{
                color: COLORS.faint,
                display: "flex",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              1percenttreaty.org
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    },
  );
}
