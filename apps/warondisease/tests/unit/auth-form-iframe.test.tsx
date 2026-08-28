import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AuthForm } from "../../../../packages/site-kit/src/components/auth/AuthForm"

vi.mock("next-auth/react", () => ({ signIn: vi.fn() }))

/**
 * The post-vote card renders this form inside a partner iframe
 * (apps/trialabundancesurvey/app/embed/page.tsx reaches it through
 * TreatyVoteSection and TreatyPostVoteFlow). NextAuth's signIn() navigates the
 * frame it runs in and Google refuses to serve its account pages in a
 * third-party frame, so offering Google there strands the voter on a blocked
 * frame. These cover that branch in both directions.
 */

function pretendToBeInIframe() {
  // window.self === window.top in a normal document; a different `top` is what
  // the component reads to detect embedding.
  Object.defineProperty(window, "top", {
    configurable: true,
    value: {} as Window,
    writable: true,
  })
}

afterEach(() => {
  Object.defineProperty(window, "top", {
    configurable: true,
    value: window,
    writable: true,
  })
})

describe("AuthForm social sign-in", () => {
  it("offers Google when the page is not embedded", async () => {
    render(<AuthForm defaultEmailOpen />)
    expect(
      await screen.findByRole("button", { name: /continue with google/i }),
    ).toBeTruthy()
  })

  it("withholds Google when the page is embedded", async () => {
    pretendToBeInIframe()
    render(<AuthForm compact defaultEmailOpen />)

    // The hint is the component's own signal that it knows it is embedded, so
    // waiting on it proves detection ran rather than that the assertion below
    // simply beat the effect.
    expect(await screen.findByText(/works best in embedded surveys/i)).toBeTruthy()
    expect(screen.queryByRole("button", { name: /continue with google/i })).toBeNull()
  })

  it("drops the OR USE EMAIL separator when there is no social option above it", async () => {
    pretendToBeInIframe()
    render(<AuthForm compact defaultEmailOpen />)

    expect(await screen.findByText(/works best in embedded surveys/i)).toBeTruthy()
    expect(screen.queryByText(/or use email/i)).toBeNull()
  })

  it("keeps the separator where Google is actually offered", async () => {
    render(<AuthForm defaultEmailOpen />)
    expect(
      await screen.findByRole("button", { name: /continue with google/i }),
    ).toBeTruthy()
    expect(screen.getByText(/or use email/i)).toBeTruthy()
  })

  it("never offers Google when emailOnly is set, embedded or not", async () => {
    render(<AuthForm emailOnly />)
    // No await: emailOnly short-circuits before iframe detection matters, so
    // the button must be absent on the very first render, not merely removed
    // once the effect lands.
    expect(screen.queryByRole("button", { name: /continue with google/i })).toBeNull()
  })
})
