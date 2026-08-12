import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Global Clinical Trial Abundance Survey",
  description: "Share your voice on massively expanding clinical trials to cure disease faster",
}

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return children
}
