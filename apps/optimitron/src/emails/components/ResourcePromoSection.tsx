import { Section, Text, Row, Column, Link } from "@react-email/components"
import * as React from "react"
import { PODCAST_URLS, MANUAL_URLS, withUtm } from "../../lib/resource-links"

interface ResourcePromoSectionProps {
  utmSource: string
  description?: string
}

export function ResourcePromoSection({
  utmSource,
  description = "Wishonia wrote a step-by-step guide explaining why your governments are misaligned superintelligences and exactly how to fix them. It covers the economics, the incentive structures, and why nobody has to evolve morally.",
}: ResourcePromoSectionProps) {
  return (
    <Section
      style={{
        backgroundColor: "#f0ede8",
        border: "3px solid #000000",
        padding: "20px",
        margin: "0 0 30px 0",
        textAlign: "center",
      }}
    >
      <Text
        style={{
          color: "#000000",
          fontSize: "13px",
          fontWeight: "900",
          textTransform: "uppercase",
          margin: "0 0 12px 0",
        }}
      >
        THE FIELD MANUAL
      </Text>
      <Text
        style={{
          color: "#444444",
          fontSize: "13px",
          margin: "0 0 15px 0",
          lineHeight: "1.5",
        }}
      >
        {description}
      </Text>
      <Row>
        <Column style={{ width: "50%", paddingRight: "4px" }}>
          <Link
            href={withUtm(PODCAST_URLS.spotify, utmSource, "email")}
            style={{
              display: "block",
              backgroundColor: "#1DB954",
              border: "2px solid #000000",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: "900",
              textDecoration: "none",
              textAlign: "center",
              padding: "8px 4px",
              textTransform: "uppercase",
            }}
          >
            Listen
          </Link>
        </Column>
        <Column style={{ width: "50%", paddingLeft: "4px" }}>
          <Link
            href={withUtm(MANUAL_URLS.readOnline, utmSource, "email")}
            style={{
              display: "block",
              backgroundColor: "#ffffff",
              border: "2px solid #000000",
              color: "#000000",
              fontSize: "11px",
              fontWeight: "900",
              textDecoration: "none",
              textAlign: "center",
              padding: "8px 4px",
              textTransform: "uppercase",
            }}
          >
            Read
          </Link>
        </Column>
      </Row>
    </Section>
  )
}
