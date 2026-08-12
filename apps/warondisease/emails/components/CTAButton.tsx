import { Section, Button } from "@react-email/components"
import * as React from "react"

interface CTAButtonProps {
  href: string
  children: React.ReactNode
  /** Outer section margin — defaults to "30px 0" */
  margin?: string
}

export function CTAButton({ href, children, margin = "30px 0" }: CTAButtonProps) {
  return (
    <Section style={{ textAlign: "center", margin }}>
      <Button
        href={href}
        style={{
          backgroundColor: "#FF6B9D",
          border: "4px solid #000000",
          borderRadius: "0px",
          color: "#000000",
          fontSize: "18px",
          fontWeight: "900",
          textDecoration: "none",
          textTransform: "uppercase",
          padding: "16px 32px",
          display: "inline-block",
          boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
        }}
      >
        {children}
      </Button>
    </Section>
  )
}
