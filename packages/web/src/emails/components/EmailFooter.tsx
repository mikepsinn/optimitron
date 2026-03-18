import { Section, Text, Link } from "@react-email/components"
import * as React from "react"
import { getEmailUrls } from "@/lib/email-urls"

interface EmailFooterProps {
  /** Short reason they're getting this email, e.g. "you opted in to weekly updates" */
  reason?: string
}

export function EmailFooter({
  reason = "you signed up at optimitron.com",
}: EmailFooterProps) {
  const { unsubscribeLink, dashboardLink } = getEmailUrls()
  return (
    <Section
      style={{
        borderTop: "2px solid #000000",
        paddingTop: "20px",
        marginTop: "40px",
      }}
    >
      <Text
        style={{
          color: "#666666",
          fontSize: "12px",
          textAlign: "center",
          margin: "0 0 10px 0",
        }}
      >
        You're receiving this because {reason}.
      </Text>
      <Text
        style={{
          color: "#666666",
          fontSize: "12px",
          textAlign: "center",
          margin: "0",
        }}
      >
        <Link href={unsubscribeLink} style={{ color: "#000000", fontWeight: "bold" }}>
          Unsubscribe
        </Link>
        {" \u2022 "}
        <Link href={dashboardLink} style={{ color: "#000000", fontWeight: "bold" }}>
          Manage Preferences
        </Link>
      </Text>
    </Section>
  )
}
