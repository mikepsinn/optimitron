import React from "react"
import { render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import FaqPage from "../../app/faq/page"

vi.mock("../../../../packages/site-kit/src/components/layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

afterEach(() => vi.unstubAllEnvs())

interface FaqQuestionNode {
  name: string
  acceptedAnswer: { text: string }
}

describe("/faq structured data", () => {
  it("publishes every question and answer the page shows, in page order", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_VARIANT", "warondisease.org")
    const { container } = render(<FaqPage />)

    const shown = Array.from(container.querySelectorAll("h3"), (question) => ({
      question: question.textContent,
      answer: question.nextElementSibling?.textContent,
    }))
    const script = container.querySelector('script[type="application/ld+json"]')
    const graph: Array<Record<string, unknown>> = JSON.parse(script?.textContent ?? "{}")["@graph"] ?? []
    const faqPage = graph.find((node) => node["@type"] === "FAQPage")
    const published = ((faqPage?.mainEntity ?? []) as FaqQuestionNode[]).map((entry) => ({
      question: entry.name,
      answer: entry.acceptedAnswer.text,
    }))

    expect(shown.length).toBeGreaterThan(0)
    expect(published).toEqual(shown)
  })
})
