import { ImageResponse } from "next/og";
import { PersonLifeStatus } from "@optimitron/db/enums";
import { headers } from "next/headers";
import { toAbsoluteOgImageSrc } from "@/lib/og-image";
import { getRepresentedPersonProfileData } from "@/lib/represented-people.server";
import { getRequestSiteOrigin } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FALLBACK_BG = "#0a0a0a";
const ACCENT_PINK = "#ec4899";
const ACCENT_CYAN = "#22d3ee";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatDuration(days: number): string {
  const abs = Math.abs(days);
  if (abs >= 365) {
    const years = Math.round((abs / 365) * 10) / 10;
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  const months = Math.max(1, Math.round(abs / 30));
  return `${months} month${months === 1 ? "" : "s"}`;
}

function fallbackInitials(name: string): string {
  return (
    name
      .split(/\s+/u)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRepresentedPersonProfileData(id);

  if (!data) {
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: FALLBACK_BG,
          color: "#fff",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          fontWeight: 900,
        }}
      >
        {"Sign for someone who can't"}
      </div>,
      { ...size },
    );
  }

  const isDeceased = data.person.lifeStatus === PersonLifeStatus.DECEASED;
  const pageLabel = "Signed by someone";
  const dates = (() => {
    const parts: string[] = [];
    if (data.person.birthDate) parts.push(formatDate(data.person.birthDate));
    if (data.person.deathDate) parts.push(formatDate(data.person.deathDate));
    return parts.join(" – ");
  })();
  const condition = data.memorial?.conditionLabel ?? null;
  const lag = data.memorial?.efficacyLag ?? null;
  const country = data.memorial?.deathCountryCode ?? null;
  const requestHeaders = await headers();
  const imageBaseOrigin = getRequestSiteOrigin({
    forwardedHost: requestHeaders.get("x-forwarded-host"),
    forwardedProto: requestHeaders.get("x-forwarded-proto"),
    host: requestHeaders.get("host"),
  });
  const personImageSrc = toAbsoluteOgImageSrc(data.person.image, imageBaseOrigin);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: FALLBACK_BG,
        color: "#fff",
        padding: "60px 70px",
        fontFamily: "sans-serif",
        gap: 50,
      }}
    >
      {/* Photo or initials */}
      <div
        style={{
          display: "flex",
          width: 360,
          height: 360,
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          border: "6px solid #fff",
          backgroundColor: "#1a1a1a",
        }}
      >
        {personImageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={data.person.displayName}
            src={personImageSrc}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              fontSize: 180,
              fontWeight: 900,
              color: ACCENT_CYAN,
            }}
          >
            {fallbackInitials(data.person.displayName)}
          </div>
        )}
      </div>

      {/* Text column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {pageLabel}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            {data.person.displayName}
          </div>
          {dates ? (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                color: "#bbb",
              }}
            >
              {dates}
              {country ? ` · ${country}` : ""}
            </div>
          ) : null}
          {condition ? (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 800,
                color: ACCENT_CYAN,
                marginTop: 12,
              }}
            >
              {isDeceased ? "Died of " : "Lived with "}
              {condition}.
            </div>
          ) : null}
          {lag ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 16,
                padding: "16px 20px",
                backgroundColor: "#1a1a1a",
                borderLeft: `6px solid ${ACCENT_PINK}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  fontWeight: 800,
                  color: ACCENT_PINK,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                Efficacy lag flagged
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#fff",
                  marginTop: 4,
                }}
              >
                {lag.interventionName} approved {formatDate(lag.approvalDate)}
                {typeof lag.daysBeforeApproval === "number"
                  ? ` — ${formatDuration(lag.daysBeforeApproval)} too late.`
                  : "."}
              </div>
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 700,
              color: "#888",
            }}
          >
            warondisease.org/people
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 900,
              color: ACCENT_PINK,
              textTransform: "uppercase",
            }}
          >
            They had a name.
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
