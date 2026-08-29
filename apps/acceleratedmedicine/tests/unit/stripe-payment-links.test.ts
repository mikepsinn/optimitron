import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import {
  PAYMENT_LINKS,
  PAYMENT_LINK_IDS,
  STRIPE_PAYMENT_LINKS_ACCOUNT_ID,
} from "@/lib/stripe-payment-links"
import { STRIPE_CONFIG } from "@/lib/stripe-config"

/**
 * Donations must only ever route to the foundation's nonprofit Stripe
 * account. These tests fail the build if a regenerated config ever points
 * anywhere else.
 *
 * Payment Link URLs are opaque slugs, but Stripe object IDs of the _1 form
 * embed the owning account's suffix, and the generator records the IDs from
 * the same API objects the URLs come from.
 */
const FOUNDATION_ACCOUNT_ID = "acct_1TPCJFD5epyB9qRx"
const FOUNDATION_ID_FRAGMENT = "D5epyB9qRx"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
)
const GENERATED_FILES = [
  "packages/site-kit/src/lib/stripe-payment-links.ts",
  "packages/site-kit/src/lib/stripe-config.ts",
]

describe("stripe payment links belong to the foundation account", () => {
  it("records the foundation account id in both generated files", () => {
    expect(STRIPE_PAYMENT_LINKS_ACCOUNT_ID).toBe(FOUNDATION_ACCOUNT_ID)
    expect(STRIPE_CONFIG.accountId).toBe(FOUNDATION_ACCOUNT_ID)
  })

  it("has one foundation-owned Payment Link per amount and type", () => {
    const types = Object.keys(PAYMENT_LINKS) as Array<
      keyof typeof PAYMENT_LINKS
    >
    expect(types.sort()).toEqual(["monthly", "oneTime"])
    let linkCount = 0
    for (const type of types) {
      const urls = PAYMENT_LINKS[type]
      const ids = PAYMENT_LINK_IDS[type]
      expect(Object.keys(ids).sort()).toEqual(Object.keys(urls).sort())
      for (const [amount, url] of Object.entries(urls)) {
        const id = ids[amount as unknown as keyof typeof ids]
        expect(url, `${type} $${amount} URL`).toMatch(
          /^https:\/\/buy\.stripe\.com\//,
        )
        expect(id, `${type} $${amount} link ${id}`).toContain(
          FOUNDATION_ID_FRAGMENT,
        )
        linkCount += 1
      }
    }
    expect(linkCount).toBe(18)
  })

  it("keeps every price on the foundation account", () => {
    // prod_ ids are random and carry no account suffix; the accountId
    // assertion above covers products. price_1... ids embed the suffix.
    for (const productId of Object.values(STRIPE_CONFIG.products)) {
      expect(productId).toMatch(/^prod_/)
    }
    for (const prices of Object.values(STRIPE_CONFIG.prices)) {
      for (const priceId of Object.values(prices)) {
        expect(priceId).toContain(FOUNDATION_ID_FRAGMENT)
      }
    }
  })

  it("contains no localhost URLs in any generated file", () => {
    for (const relativePath of GENERATED_FILES) {
      const contents = readFileSync(path.join(repoRoot, relativePath), "utf8")
      expect(contents, relativePath).not.toMatch(/localhost/i)
      expect(contents, relativePath).not.toMatch(/127\.0\.0\.1/)
    }
  })
})
