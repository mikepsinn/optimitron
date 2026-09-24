import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SessionContext, SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import SharedLayout from "../../../../packages/site-kit/src/components/layout"
import { NavigationProvider } from "../../../../packages/site-kit/src/components/navigation-provider"
import { appNavigation } from "../../lib/navigation"
import NotFoundPage from "../../../acceleratedmedicine/app/not-found"
import CureDaoNotFoundPage from "../../../curedao/app/not-found"
import { VARIANTS } from "../../../../packages/site-kit/src/lib/site-variant-types"

function Layout({ children }: { children: React.ReactNode }) {
  return <NavigationProvider navigation={appNavigation}><SharedLayout>{children}</SharedLayout></NavigationProvider>
}

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }))

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ hasVoted: false }))))
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

const apps = [
  VARIANTS.ACCELERATED_MEDICINE, VARIANTS.WAR_ON_DISEASE, VARIANTS.DFDA,
  VARIANTS.WISHOCRACY, VARIANTS.SURVEY, VARIANTS.CUREDAO, VARIANTS.COURT_OF_HUMANITY,
]
const admin: Session = {
  user: { id: "admin-fixture", name: "Admin", email: "admin@example.com", isAdmin: true },
  expires: "2099-01-01T00:00:00Z",
}

describe.each(apps)("%s admin navigation", (variant) => {
  it.each([
    ["signed out", null, false],
    ["regular user", { ...admin, user: { ...admin.user, isAdmin: false } }, false],
    ["missing role", { ...admin, user: { ...admin.user, isAdmin: undefined } }, false],
    ["admin", admin, true],
  ] as const)("shows the admin hub only to an admin: %s", async (_label, session, visible) => {
    vi.stubEnv("NEXT_PUBLIC_SITE_VARIANT", variant)
    render(<SessionProvider session={session}><Layout><main>Page</main></Layout></SessionProvider>)
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }))
    const link = screen.queryByRole("link", { name: /ADMIN/ })
    if (visible) expect(link).toHaveAttribute("href", "/admin")
    else expect(link).not.toBeInTheDocument()
  })
})

it("shows the dFDA non-affiliation notice in the dFDA footer", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_VARIANT", VARIANTS.DFDA)
  render(<SessionProvider session={null}><Layout><main>Page</main></Layout></SessionProvider>)
  expect(screen.getByText(/not affiliated with, endorsed by, or acting on behalf of the U\.S\. Food and Drug Administration/)).toBeInTheDocument()
})

it("does not expose admin navigation while the session is loading", () => {
  render(
    <SessionContext.Provider value={{ data: admin, status: "loading", update: vi.fn() }}>
      <Layout><main>Page</main></Layout>
    </SessionContext.Provider>,
  )
  fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }))
  expect(screen.queryByRole("link", { name: /ADMIN/ })).not.toBeInTheDocument()
})

describe("fallback 404 session context", () => {
  it("recovers a signed-in admin session when the root provider is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_VARIANT", VARIANTS.ACCELERATED_MEDICINE)
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      new Response(JSON.stringify(url.includes("/api/auth/session") ? admin : { hasVoted: false })),
    ))
    render(<NotFoundPage />)
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }))
    expect(await screen.findByRole("link", { name: /ADMIN/ })).toHaveAttribute("href", "/admin")
  })

  it("keeps the fallback signed out when local authentication is disabled", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_VARIANT", VARIANTS.CUREDAO)
    const fetch = vi.fn(async (_url: string) => new Response(JSON.stringify({ hasVoted: false })))
    vi.stubGlobal("fetch", fetch)
    render(<CureDaoNotFoundPage />)
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }))
    expect(screen.queryByRole("link", { name: /ADMIN/ })).not.toBeInTheDocument()
    expect(fetch.mock.calls.some(([url]) => String(url).includes("/api/auth/session"))).toBe(false)
  })

  it("renders the real layout without a root SessionProvider", () => {
    render(<NotFoundPage />)
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }))
    expect(screen.queryByRole("link", { name: /ADMIN/ })).not.toBeInTheDocument()
  })

  it("preserves the existing admin session when a provider is present", () => {
    render(<SessionProvider session={admin}><NotFoundPage /></SessionProvider>)
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }))
    expect(screen.getByRole("link", { name: /ADMIN/ })).toHaveAttribute("href", "/admin")
  })
})
