import { Row, Column, Link } from "@react-email/components"
import * as React from "react"
import {
  GLOBAL_DISEASE_DEATHS_DAILY,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  fmtParam,
  fmtRaw,
} from "@optimitron/data/parameters"

interface SocialShareButtonsProps {
  referralLink: string
  /** Tweet text — defaults to a mission-focused call-to-action */
  tweetText?: string
}

const defaultTweetText = `${fmtRaw(GLOBAL_DISEASE_DEATHS_DAILY.value)} people die daily waiting for treatments. Governments spend ${fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)} more on weapons than finding new treatments. 30 seconds to vote for the 1% Treaty:`

const buttonBase: React.CSSProperties = {
  display: "block",
  border: "3px solid #000000",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "900",
  textDecoration: "none",
  textAlign: "center",
  padding: "10px 5px",
  textTransform: "uppercase",
}

export function SocialShareButtons({
  referralLink,
  tweetText = defaultTweetText,
}: SocialShareButtonsProps) {
  return (
    <Row>
      <Column style={{ width: "33.33%", paddingRight: "5px" }}>
        <Link
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(referralLink)}`}
          style={{ ...buttonBase, backgroundColor: "#1DA1F2" }}
        >
          Tweet
        </Link>
      </Column>
      <Column style={{ width: "33.33%", padding: "0 5px" }}>
        <Link
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
          style={{ ...buttonBase, backgroundColor: "#4267B2" }}
        >
          Share
        </Link>
      </Column>
      <Column style={{ width: "33.33%", paddingLeft: "5px" }}>
        <Link
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
          style={{ ...buttonBase, backgroundColor: "#0077B5" }}
        >
          Post
        </Link>
      </Column>
    </Row>
  )
}
