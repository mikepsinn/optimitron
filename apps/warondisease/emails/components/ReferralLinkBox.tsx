import * as React from "react"

interface ReferralLinkBoxProps {
  referralLink: string
}

export function ReferralLinkBox({ referralLink }: ReferralLinkBoxProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "4px solid #000000",
        padding: "15px",
        fontFamily: "monospace",
        fontSize: "14px",
        wordBreak: "break-all",
        marginBottom: "20px",
        textAlign: "center",
      }}
    >
      {referralLink}
    </div>
  )
}
