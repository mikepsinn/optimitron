import { ImageResponse } from "next/og";
import {
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  formatParameter,
  fmtParamValueOnly,
  getParameterValue,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
} from "@optimitron/data/parameters";

export const runtime = "nodejs";
export const revalidate = 300;

const SIZE = { width: 1200, height: 630 };

const COLORS = {
  white: "#ffffff",
  ink: "#111111",
  warm: "#f5ecdf",
  warmLine: "#d2b89b",
  pink: "#ff4fa3",
  cyan: "#6fe7f7",
  faint: "#5f4830",
};

const militarySpending = formatParameter(GLOBAL_MILITARY_SPENDING_ANNUAL_2024);
const clinicalTrialsSpending = formatParameter(
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
);
const ratio = getParameterValue(
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  "round",
);
const acceleration = fmtParamValueOnly(DFDA_TRIAL_CAPACITY_MULTIPLIER);
const trialsBarWidthPct = Math.max(
  2.5,
  Number(
    (
      (GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value /
        GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value) *
      100
    ).toFixed(2),
  ),
);

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          backgroundColor: COLORS.warm,
          color: COLORS.ink,
          display: "flex",
          height: "100%",
          padding: "34px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "stretch",
            backgroundColor: COLORS.white,
            border: `4px solid ${COLORS.ink}`,
            boxShadow: "14px 14px 0 #111111",
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "34px 40px 28px",
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                color: COLORS.faint,
                display: "flex",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 1.8,
                textTransform: "uppercase",
              }}
            >
              The 1% Treaty
            </div>
            <div
              style={{
                backgroundColor: COLORS.ink,
                color: COLORS.white,
                display: "flex",
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: 1.2,
                padding: "10px 16px",
                textTransform: "uppercase",
              }}
            >
              One percent fixes this
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <div
              style={{
                color: COLORS.faint,
                display: "flex",
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 1.7,
                textTransform: "uppercase",
              }}
            >
              Governments spend
            </div>
            <div
              style={{
                alignItems: "baseline",
                display: "flex",
                flexWrap: "wrap",
                fontSize: 82,
                fontWeight: 900,
                gap: "18px",
                letterSpacing: -2.8,
                lineHeight: 0.92,
                textTransform: "uppercase",
              }}
            >
              <span style={{ display: "flex" }}>{ratio}x more on</span>
              <span style={{ color: COLORS.pink, display: "flex" }}>war</span>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 900,
                lineHeight: 1.08,
                marginTop: "10px",
                textTransform: "uppercase",
              }}
            >
              than clinical trials to discover which treatments actually work
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                  }}
                >
                  Military
                </div>
                <div
                  style={{
                    color: COLORS.pink,
                    display: "flex",
                    fontSize: 30,
                    fontWeight: 900,
                  }}
                >
                  {militarySpending}
                </div>
              </div>
              <div
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.pink,
                  border: `4px solid ${COLORS.ink}`,
                  display: "flex",
                  height: "104px",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    color: COLORS.white,
                    display: "flex",
                    fontSize: 31,
                    fontWeight: 900,
                    letterSpacing: 0.4,
                    textAlign: "center",
                    textTransform: "uppercase",
                  }}
                >
                  {militarySpending} for mass murder capacity
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                  }}
                >
                  Clinical trials
                </div>
                <div
                  style={{
                    color: "#0f94a8",
                    display: "flex",
                    fontSize: 30,
                    fontWeight: 900,
                  }}
                >
                  {clinicalTrialsSpending}
                </div>
              </div>
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  gap: "18px",
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.cyan,
                    border: `4px solid ${COLORS.ink}`,
                    display: "flex",
                    height: "72px",
                    justifyContent: "center",
                    minWidth: "28px",
                    width: `${trialsBarWidthPct}%`,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    fontSize: 28,
                    fontWeight: 900,
                    lineHeight: 1.05,
                    textTransform: "uppercase",
                  }}
                >
                  <span style={{ display: "flex" }}>{clinicalTrialsSpending}</span>
                  <span style={{ display: "flex" }}>for clinical trials</span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              alignItems: "center",
              borderTop: `2px solid ${COLORS.warmLine}`,
              color: COLORS.faint,
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              justifyContent: "space-between",
              paddingTop: "20px",
            }}
          >
            <div style={{ display: "flex" }}>
              Redirect 1% of military spending and eradicate disease {acceleration}x faster.
            </div>
            <div
              style={{
                color: COLORS.ink,
                display: "flex",
                fontWeight: 900,
                textTransform: "uppercase",
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
