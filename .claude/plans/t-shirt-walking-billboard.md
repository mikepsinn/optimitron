# T-Shirt Walking Billboard Plan

## Brief

Extend the existing `/shirt` page only if the work can safely make a supporter order a real shirt with:

- Front text, verbatim: `please take 30 seconds to end war and disease at warondisease.org`
- Back text, verbatim: `I ended war and disease and all I got was this lousy t-shirt`
- A per-buyer QR code pointing at `https://warondisease.org/vote/<their-handle-or-referral-code>`
- Stripe Checkout collecting payment, email, and shipping address
- Recommended POD fulfillment using a server-composed print-ready PNG; current recommendation is CustomCat unless Mike requires a strict draft-then-confirm vendor flow
- A tax/receipt split where only the payment above fair market value is treated as the charitable contribution
- A status surface where the buyer can see whether the shirt/order is pending, submitted, shipped, or failed

Do not redesign the shirt, rewrite Mike's supplied front/back copy, or turn this into a merch platform. The only conversion job is: let a supporter buy a walking referral billboard quickly enough that it helps the 4B-voter propagation goal.

## Current State

Repo state checked on 2026-05-19:

- `packages/web/src/app/shirt/page.tsx` exists and currently implements a DIY artwork generator with a QR code, download, print, and Printful upload link. It does not create a Stripe Checkout session or a Printful order.
- `packages/web/src/app/shirt/shirt-client.tsx` only handles client-side SVG-to-PNG/SVG download.
- `packages/web/src/app/poster/poster-client.tsx` exposes `PosterQrCode`, `PosterCopyLinkButton`, and `PosterPrintButton`; the shirt page already reuses these primitives.
- `packages/web/src/app/api/stripe/create-checkout/route.ts` creates donation-only Checkout sessions. It has no order type, no shirt size, no shipping address collection, no automatic tax, and no merchandise/donation split.
- `packages/web/src/app/api/stripe/webhook/route.ts` records donation activity for `checkout.session.completed`. It has no shirt branch, no fulfillment idempotency, and no Printful call.
- `packages/web/src/app/api/stripe/session/route.ts` fetches basic Checkout session details for the donation success page.
- `packages/web/src/app/donate/success/page.tsx` is a client-side status lookup shape that can be adapted for a shirt order page.
- `packages/web/src/lib/stripe.ts` uses Stripe SDK API version `2025-10-29.clover`.
- `packages/web/src/lib/nonprofit-identity.ts` has the legal 501(c)(3) entity identity and EIN.
- `packages/web/src/lib/email/resend.ts` and `sendExternalResendEmail` can send transactional email without requiring a logged-in `User`.
- `packages/web/src/lib/object-storage.server.ts` can upload public files to R2 when R2 env vars exist.
- `packages/web/package.json` already includes `sharp` and `qrcode.react`; `qrcode` is only present transitively in the lockfile and should be added as a direct dependency if used server-side.
- `packages/db/prisma/schema.prisma` has `User`, `Activity`, and `EmailLog`; there is no `Order`, `ShirtOrder`, `FulfillmentOrder`, or unique local order/idempotency table.
- Root `AGENTS.md` says Prisma schema/exported `@optimitron/db` type changes require explicit human approval. No schema change is approved in this task.

## Research Log

### Empirical CustomCat API findings (2026-05-19)

Real sandbox requests to `https://customcat-beta.mylocker.net/api/v1/` confirmed the following, overriding earlier doc-derived assumptions:

- Order creation is `POST /api/v1/order/{external_id}`. The external id is our `MerchandiseOrder.id` or Stripe Checkout session id path parameter; `POST /api/v1/order` returns 404.
- The working payload is flat, not `orders[{ ship_to, line_items }]`: `shipping_first_name`, `shipping_last_name`, `shipping_address1`, optional `shipping_address2`, `shipping_city`, two-letter `shipping_state`, `shipping_zip`, two-letter `shipping_country`, required `shipping_email`, required `shipping_phone`, `shipping_method` name, `items[{ catalog_sku, design_url, design_url_back, quantity }]`, string `sandbox`, and `api_key`.
- `store_id` is accepted in the order body but not required. Use the simpler body without it unless a later verified behavior requires it.
- `catalog_sku` must be sent as a string, and `sandbox` must be `"1"` or `"0"`.
- Successful order response shape is `{ "MSG": "Order added successfully", "ORDER_ID": "<our external_id>", "CUSTOMCAT_ORDER_ID": "<their UUID>" }`; store `CUSTOMCAT_ORDER_ID` and throw on any other `MSG`.
- Idempotency is confirmed: posting the same `external_id` twice returns the same `CUSTOMCAT_ORDER_ID`, so Stripe webhook retries are safe at the vendor boundary.
- Order status backup is `GET /api/v1/order/status/{external_id}?api_key=...`, with `ORDER_STATUS`, `SHIPMENTS` containing `TRACKING_ID` when shipped, and `LINE_ITEMS`. Sandbox orders simulate the shipping lifecycle through `Shipped`.
- Shipping options are `GET /api/v1/shipping?api_key=...`; quote real-time cost with `POST /api/v1/shipping/{shipping_id}`. Use `SHIPPING_NAME` such as `Economy`, not `SHIPPING_ID`, as order `shipping_method`. International sandbox quotes returned `0.00`, so v1 should treat non-US shipping as unsupported.
- Webhooks are listed with `GET /api/v1/webhook?api_key=...`, created with `POST /api/v1/webhook { api_key, topic, url }`, and updated with `PUT /api/v1/webhook/{webhook_id}`. Use `order-shipped`, `order-partial-shipment`, and `design-rejected`; ignore product lifecycle topics. The existing `order-shipped` webhook points at a webhook.site placeholder and should be reconfigured at launch.
- CustomCat re-downloads design URLs rather than caching them by string. Keep order-id-bearing R2 object keys for audit and traceability, not cache busting.
- Cancellation is unsupported. Refunds go through Stripe/customer service; the CustomCat order is left alone.
- Catalog verification found 2XL at $13.47 instead of $11.47. For v1, keep one $15 FMV across sizes rather than adding a per-size override map.

Web research run on 2026-05-19:

- Printful API v2 beta docs: https://developers.printful.com/docs/v2-beta/
  - API version used for planning: Printful API v2 beta.
  - Orders v2 supports `POST https://api.printful.com/v2/orders` to create a draft order.
  - Orders v2 then adds items with `POST https://api.printful.com/v2/orders/{order_id}/order-items`.
  - Example order-item payload uses `catalog_variant_id`, `source: "catalog"`, `quantity`, placements, DTG technique, and file layers with a URL.
  - The docs say draft orders cannot be confirmed until at least one order item exists.
  - Files v2 says files can be added to the file library, but the more convenient path is to specify file URLs during order creation/order-item creation; files are processed asynchronously and may later become `ok` or `failed`.
  - The docs warn that reused identical file URLs can reuse the old file, so personalized URLs must be unique per order.
- Printful API v2 help article: https://help.printful.com/hc/en-us/articles/10293184543260-What-should-I-know-about-Printful-s-API-v2
  - Printful says API v2 is open beta, usable live, and still being refined.
  - It calls out flexible order creation and improved shipment tracking.
  - It says to create/use a private API token and use the v2 endpoint docs.
- Stripe address collection docs: https://docs.stripe.com/payments/collect-addresses
  - Checkout collects shipping addresses by passing `shipping_address_collection` when creating a Checkout Session.
  - Allowed countries must be specified as two-letter ISO country codes.
  - Completed Checkout sessions include collected shipping details in the `checkout.session.completed` webhook payload.
- Stripe automatic tax docs: https://docs.stripe.com/payments/checkout/automatic_taxes
  - Checkout can enable Stripe Tax with `automatic_tax[enabled]=true`.
  - Tax location uses the shipping address when collected.
  - Inline `price_data.product_data.tax_code` can be specified; otherwise Stripe Tax uses the account's default tax code.
- IRS quid pro quo contribution guidance: https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-contributions-quid-pro-quo-contributions
  - A payment partly for goods/services and partly as a contribution is a quid pro quo contribution.
  - The deductible amount is limited to the excess over the fair market value of goods/services provided.
  - Written disclosure must include that limitation and a good-faith FMV estimate for the goods/services.
- IRS written acknowledgment guidance: https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-contributions-written-acknowledgments
  - Written acknowledgments for applicable charitable contributions must describe goods/services provided and include a good-faith value estimate when applicable.

## Vendor Cost Comparison

Updated vendor search run on 2026-05-20. Costs below exclude Stripe fees, shipping, taxes, refunds, and nonprofit receipt overhead. For POD DTG, "1c+1c front+back" is modeled as front + back placement; most POD vendors price by placement/design area, not literal ink color. Public prices are snapshots from current vendor pages/docs; implementation must re-query the chosen vendor's API before launch.

| Vendor | Base unisex tee FMV (Bella+Canvas 3001 or closest equiv) | Print cost per shirt (1c+1c front+back, US fulfillment) | API allows per-order custom artwork upload | API allows draft-then-confirm order flow | API webhook on shipped/delivered | Min order quantity | International shipping support | Free account/onboarding friction | Notes |
|---|---:|---:|---|---|---|---:|---|---|---|
| Printful | B+C 3001 public catalog/price endpoint; recent public estimates put one-placement B+C around ~$13.50 | Estimated ~$18-$20 after second placement; exact quote via API/order estimation | Yes. Order item placements accept file layer URL | Yes. v2 creates draft order, then confirm endpoint | Yes. Shipment sent/delivered and order events | 1 | Yes | Free account; API v2 is open beta; ~120 req/min v2 rate limit | Pricing: https://www.printful.com/pricing. API: https://developers.printful.com/docs/v2-beta/. Strongest draft-confirm safety, not cheapest. |
| Printify | B+C 3001 starts at $10.98 free / $8.77 Premium one-side per Printify 2026 pricing guide | Estimated ~$14-$16 free / ~$12-$14 Premium after second side; provider-specific | Yes. API can create products/orders on the fly with `print_areas.front/back` URLs | Partial. Orders can go on hold via approval settings, but no clean draft-confirm endpoint found | No first-party shipped webhook found in public docs; poll orders | 1 | Provider-dependent global shipping | Free; Premium $39/mo or annual discount; print-provider selection adds QA variance | Pricing: https://printify.com/blog/t-shirt-pricing-calculator/. API: https://developers.printify.com/API-Doc-RREdits.html. Potentially cheap, but weaker operational certainty. |
| Gelato | B+C 3001 public third-party catalog snapshot: $10.69-$20.59; official price requires `GET /products/{productUid}/prices` | API quote required for exact front/back; likely competitive, especially outside US/EU | Yes. Create order accepts apparel `files` with `default` and `back` URLs | Partial. Docs expose draft patch/delete endpoints, but create-order example submits directly | Yes. Order status, item status, tracking updates; delivered/status events | 1 | Yes, global network in 32 countries | Free account; API key via dashboard; 100 req/sec | Pricing API: https://dashboard.gelato.com/docs/products/prices/. Order API: https://dashboard.gelato.com/docs/orders/v4/create/. Webhooks: https://dashboard.gelato.com/docs/webhooks/. Good if international volume matters. |
| CustomCat | B+C 3001C: $11.47 Lite / $8.67 Pro | $16.47 Lite / $13.67 Pro after documented +$5 second placement | Yes. API "External Designs" accepts downloadable `design_url`; OrderDesk docs expose `print_url_2` for back | No true draft-confirm. Has `sandbox: 1`; API orders batch into production | Yes. Shipped webhook/status endpoints | 1 | Yes, but country/rate coverage must be verified in account | Free Lite; Pro $30/mo or $25/mo annual; API keys after creating API store | Pricing: https://customcat.com/products/ and https://cc.customcat.com/choose-your-plan/. API: https://help.customcat.com/getting-started-with-customcat-api and https://customcat.com/integrations/customcat-api/. Cheapest proven vendor-doc option. |
| Bonfire | Dynamic base cost; decreases with volume/design complexity | Quote/calculator only; not API-orderable | No public API for per-order generated artwork found | No | No public API webhooks found | POD campaigns no inventory; custom orders domestic only | Campaigns can sell worldwide; custom at-cost orders not international | Free campaign/storefront; manual platform | Pricing: https://help.bonfire.com/en/articles/2184341-what-is-base-cost-and-how-is-it-calculated. API docs: none found. Eliminated for no per-order artwork API. |
| Spring / Teespring | Base cost not public in useful API form | Not comparable | No. Seller API is for approved sellers/partners/licensees and API data, not a documented per-order print-file flow | No | No current public fulfillment webhook found | 1 via storefront/direct | Yes via platform | API credentials require approval/app id | Pricing/direct: https://teespring.com/id/direct. API: https://api.teespring.com/docs and https://teespring.com/en-GB/policies/api. Eliminated. |
| Cotton Bureau | Premium-positioned; no public per-order API cost | Not comparable | No public API found | No | No | On-demand/preorder/store models | Yes through Cotton Bureau store model | Branded stores may have upfront cost | Pricing/model: https://cottonbureau.com/how-it-works. API docs: none found. Eliminated. |
| Threadless | Artist Shop/marketplace pricing; no public API cost | Not comparable | No public order API found | No | No public API webhooks found | 1 via storefront | Yes via storefront | Free Artist Shop | Pricing/model: https://artistshopshelp.threadless.com/article/816-how-do-i-find-my-customer-order-info. API docs: none found. Eliminated. |
| TPop | Example: 12.50 EUR tee + 3.95 EUR delivery in docs; plan pages say pay production cost | Not API-comparable | No public API docs found; external integrations are plan-gated store features | No | No public API webhooks found | 1 via platform | Yes, worldwide sales | Free plan; external integrations/white-label gated by paid plans | Pricing: https://www.tpop.com/en/pricing and https://www.tpop.com/en/page/print-on-demand. API docs: none found. Eliminated. |
| Custom Ink | Quote-based; no-minimum on many products, all-inclusive pricing | Often expensive for one-off; quote-only | No public fulfillment/order API found | No | No | 1 on many products | US/Canada; international caveats | Consumer/manual quoting; not API POD | Pricing: https://www.customink.com/prices. API docs: none found. Eliminated. |
| Gooten | B+C 3001 supported; exact price behind account/API/catalog | Account/API quote required | Yes. API and CSV accept output/artwork URLs; both-side SKU example exists | Partial. `NeedsPersonalization` can hold item; not a clean draft-confirm replacement | Not verified from public docs in this pass | 1 | Yes, network-dependent | Account/onboarding required | API: https://www.gooten.com/api-documentation/submitting-an-order/. Help: https://help.gooten.com/hc/en-us/articles/360047745311-Place-an-Order. Viable fallback, but pricing less transparent. |
| Prodigi | B+C 3001 supported; exact pricing not public in docs | Account/API quote required | Yes. Print API orders require public/private signed asset URL | Partial/unknown | Not verified from public docs in this pass | 1 | Yes | Account/API key; product pricing/account setup required | API/order asset: https://www.prodigi.com/blog/your-first-print-api-order/. Product: https://www.prodigi.com/products/mens-clothing/t-shirts/. Viable fallback, not cheapest proven. |

## Updated Vendor Recommendation

Recommend **CustomCat** for the next implementation plan unless Mike requires a strict draft-then-confirm flow. It is the cheapest option I could prove from current vendor docs that also supports the load-bearing per-order custom artwork pattern.

- Cost baseline: Bella+Canvas 3001C is $11.47 on CustomCat Lite or $8.67 on CustomCat Pro; documented second print location adds $5, so front+back is $16.47 Lite or $13.67 Pro before shipping/tax.
- API fit: CustomCat's API docs support external downloadable `design_url` payloads for per-order generated art, plus order status and shipped webhooks.
- Caveat: CustomCat does not expose the same clean "create draft then confirm" order flow Printful v2 does. It has a sandbox flag, and production orders batch into fulfillment. Implementation must create CustomCat orders only after Stripe payment succeeds and must keep a durable local order/idempotency record.
- If strict draft-confirm is non-negotiable, keep Printful despite higher cost, because Printful v2 has the safer draft/confirm lifecycle.

## Current State ASCII Diagram

```text
/shirt
  |
  +-- getServerSession(authOptions)
  +-- buildUserReferralUrl(session.user, WAR_ON_DISEASE_CANONICAL_ORIGIN)
  +-- PosterQrCode(referralUrl)
  +-- ShirtDownloadImageButton(back SVG -> PNG/SVG)
  +-- PosterPrintButton()
  +-- external Printful upload link
  |
  +-- no checkout
  +-- no shipping collection
  +-- no server-side print file
  +-- no fulfillment
  +-- no order status
  +-- no receipt email

/api/stripe/create-checkout
  |
  +-- donation-only request
  +-- Stripe Checkout session
  +-- success_url -> /donate/success

/api/stripe/webhook
  |
  +-- checkout.session.completed
      |
      +-- recordDonationActivity(session)
      +-- no shirt branch
```

## Proposed State ASCII Diagram

```text
/shirt
  |
  +-- existing QR/art preview remains
  +-- tier selector: 25 / 35 / 50 / 100 / custom
  +-- size selector: S / M / L / XL / XXL
  +-- ORDER ONE button
  +-- secondary DIY download path remains
      |
      v
/api/stripe/create-checkout
  |
  +-- request kind: "shirt"
  +-- validate size, total amount, buyer email/name fallback
  +-- metadata:
      shirtSize, referralUrl, referralHandleOrCode, fmvCents,
      donationCents, userId?, sourceUrl, sourceReferrer
  +-- Stripe Checkout:
      mode=payment
      automatic_tax.enabled=true
      billing_address_collection=required
      shipping_address_collection.allowed_countries=[initially US]
      line item 1: taxable shirt FMV
      line item 2: donation above FMV, tax-exempt/non-taxable treatment
      success_url -> /shirt/order/{CHECKOUT_SESSION_ID}
      cancel_url -> /shirt?canceled=true
      |
      v
Stripe checkout.session.completed webhook
  |
  +-- detect metadata.kind === "shirt"
  +-- load session with shipping_details
  +-- build personalized print-file URL or upload composed PNG to R2
  +-- create CustomCat order with front/back artwork URLs after durable idempotency claim
  +-- record CustomCat order/status IDs
      |
      +-- if strict draft-confirm is required instead, use Printful draft + confirm flow
  +-- send confirmation + quid-pro-quo receipt
      |
      v
/shirt/order/[id]
  |
  +-- read local order record by checkout session id/order id
  +-- optionally refresh POD vendor status
  +-- show paid / submitted / in production / shipped / failed
```

## Step List

1. Confirm the implementation boundary with Mike/orchestrator because the CBA below crosses the stop threshold.
2. Choose durable order storage:
   - Preferred: add a real `ShirtOrder`/fulfillment model after explicit Prisma approval.
   - Fallback: use a non-Prisma durable store only if the repo already has one with uniqueness and retry semantics.
   - Do not rely on Stripe metadata alone for live POD fulfillment idempotency.
3. Decide recommended POD product config:
   - Fixed blank/product/color for v1.
   - Env-driven size-to-vendor SKU map; CustomCat uses `catalog_sku`, while the Printful fallback uses `catalog_variant_id`.
   - Initial allowed ship countries, likely `US` only until shipping cost/rate logic exists.
4. Add env validation:
   - `CUSTOMCAT_READ_WRITE_API_KEY`
   - `CUSTOMCAT_SHIRT_CATALOG_SKUS` or explicit per-size env vars.
   - `CUSTOMCAT_SHIRT_SUBMIT_LIVE_ORDERS` default false until a real API order test succeeds.
   - If the Printful fallback is selected instead: `PRINTFUL_API_TOKEN`, optional `PRINTFUL_STORE_ID`, size-to-variant env vars, and `PRINTFUL_SHIRT_CONFIRM_ORDERS=false` by default.
5. Build server-side print artwork:
   - Use `sharp`.
   - Add direct server-side QR generator dependency if needed.
   - Generate 300 DPI 10 x 12 in PNG, unique per checkout/order.
   - Preserve Mike's exact front/back text. No extra back slogan.
6. Make the image reachable by the POD vendor:
   - Preferred: compose and upload to R2, store public URL on order record.
   - Fallback: signed `/api/shirt/print-file/[token]` route if it can stay available long enough and cannot leak PII.
7. Extend `POST /api/stripe/create-checkout` without polluting donation logic:
   - Keep donation request handling as-is.
   - Add a `kind: "shirt"` branch or route helper.
   - Use Stripe Tax/address collection.
   - Split FMV/taxable shirt amount from donation amount.
8. Extend webhook:
   - Branch on `session.metadata.kind`.
   - Use a durable idempotency claim before any POD vendor side effect.
   - Submit CustomCat order with external design URLs, unless the approved vendor changes.
   - Record vendor order/item/file IDs and current status.
   - On failure, mark order failed and email/log for operator action.
9. Add confirmation email:
   - Transactional.
   - Include total paid, FMV estimate, deductible contribution amount, legal nonprofit name/EIN, order id, and status link.
   - Avoid public-copy churn; Mike must review receipt text before commit.
10. Add `/shirt/order/[id]`:
    - Show Stripe payment status.
    - Show POD vendor submission/shipping status when available.
    - Show failed/pending states with clear operator-contact fallback.
11. Add focused tests:
    - Checkout request validation and session payload for shirt orders.
    - Webhook idempotency around duplicate `checkout.session.completed`.
    - CustomCat client request-shape tests with fetch mocked at the boundary.
    - Print image composition dimensions/smoke test if fast enough.
12. Run focused verification:
    - `pnpm --filter @optimitron/web run typecheck:fast`
    - Focused Vitest for Stripe/POD/shirt helpers.
    - `pnpm --filter @optimitron/web copy:preview -- --routes=/shirt,/shirt/order/<mock>`
    - Browser screenshot review using the already-running `http://127.0.0.1:3001` only.
13. Stage file-specific changes. Do not commit. Do not merge.

## Risks

- RED: Durable idempotency is unresolved. A Stripe webhook retry after a partial POD success can create duplicate live shirt orders unless there is a unique local order/fulfillment record or a proven vendor external-id/idempotency recovery path. Stripe metadata alone is not a sufficient lock.
- RED: A real order/status surface wants a new local order table, but Prisma schema/exported DB type changes require explicit human approval. That approval is not present in this task.
- RED: CustomCat product/catalog SKUs are not known from the repo. Mike must create or identify the CustomCat API store and size-to-`catalog_sku` map before this can produce the intended blank/color/sizes.
- RED: CustomCat does not expose a clean draft-then-confirm flow. That is acceptable only if live submission is gated off until a real API token/order test succeeds; if Mike requires draft-confirm, the plan should switch back to Printful.
- RED: Confirmation/receipt copy touches tax-deductibility claims. It needs Mike/legal review before commit or deploy.
- MED: Stripe Tax accuracy depends on correct product tax code, shipping-country scope, Stripe Tax account settings, and whether the donation line is modeled separately from the shirt FMV line.
- MED: Fair market value is currently an estimate (`~$15`). Need the actual blank+print+shipping/subsidy policy before receipts call the deductible portion exact.
- MED: 501(c)(3) unrelated-business-income concerns need review if shirt sales become more than incidental fundraising/propagation. Mitigation: treat v1 as campaign fundraising/advertising with clear FMV split and limited scope; get tax review before scale.
- MED: POD file ingestion/validation can fail late. Submitting a live order before the vendor accepts the artwork can create support work; waiting synchronously in the webhook could exceed runtime limits.
- MED: Shipping cost can exceed the $15 FMV assumption, especially outside the US. Mitigation: US-only initial launch or explicit flat shipping/FMV policy.
- MED: Fraud/refunds/chargebacks need an operator path. Once fulfillment starts, refunds may not cancel the Printful cost.
- LOW: Server-side image composition cost is manageable for one PNG/order, but avoid recomposing repeatedly in status pages or webhook retries.
- LOW: The existing dev server is already running at `http://127.0.0.1:3001`; verification must reuse it and not start/kill another server.

## Files to Touch

Plan-stage files touched:

- `.claude/plans/t-shirt-walking-billboard.md`

Likely implementation files if approved:

- `packages/web/src/app/shirt/page.tsx`
- `packages/web/src/app/shirt/shirt-client.tsx`
- `packages/web/src/app/shirt/order/[id]/page.tsx`
- `packages/web/src/app/api/stripe/create-checkout/route.ts`
- `packages/web/src/app/api/stripe/create-checkout/route.test.ts`
- `packages/web/src/app/api/stripe/webhook/route.ts`
- `packages/web/src/app/api/stripe/webhook/route.test.ts`
- `packages/web/src/app/api/shirt/print-file/[token]/route.ts` or an R2 upload helper
- `packages/web/src/lib/shirt/artwork.server.ts`
- `packages/web/src/lib/shirt/pod-vendor.server.ts` or `packages/web/src/lib/shirt/customcat.server.ts`
- `packages/web/src/lib/shirt/order.server.ts`
- `packages/web/src/lib/shirt/receipt-email.server.ts`
- `packages/web/src/lib/env.ts`
- `packages/web/src/lib/stripe.ts`
- `packages/web/src/lib/email/preview-registry.ts` and related preview files if email preview is added
- `packages/web/src/app/shirt/page.logged-out.md`
- `packages/web/src/app/shirt/order/[id]/page.logged-out.md` if previewable
- `packages/web/package.json` and `pnpm-lock.yaml` if adding direct `qrcode`
- Potentially `packages/db/prisma/schema.prisma` and generated `@optimitron/db` artifacts only after explicit human approval
- Local-only screenshot artifacts under `packages/web/output/playwright/` if UI changes are implemented

## Cost-Benefit Matrix

| Option | CC hrs | Wallclock | Expected impact (with units) | Confidence | Brand/UX cost | Opportunity cost (which P0/P1 TODO drops) | Risk-adj score | Decision |
|---|---:|---:|---|---|---|---|---|---|
| Actual first-party shirt order using recommended POD vendor (CustomCat unless draft-confirm is required) | 14-26 | 2-4 days before live confidence; longer if API account/product setup is missing | Lets supporters buy personalized walking billboards; target 10-100 public impressions per worn shirt and attributed scans via `/vote/<handle>` | MED if account/product config exists; LOW before live API test | Medium: adds commerce, support, tax, and failed-order states to a campaign page | Drops P0 vote conversion/referral propagation polish and P1 org endorsement work for several days | Mixed: cheaper and simpler than Printful, but still blocked by durable idempotency/schema and tax/receipt review | STOP FOR ORCHESTRATOR REVIEW |
| Narrow engineering spike: CustomCat sandbox/test order behind env flag, no public ORDER ONE launch | 4-8 | 1 day if API store exists | Proves API payload and image path without taking money or creating live support burden | MED | Low public UX cost if hidden | Drops about 1 day of P0 referral polish | Reasonable as next step after plan approval | RESEARCH / SPIKE |
| Metadata-only implementation with Stripe metadata as the order store | 8-14 | 1-2 days | Could appear to work for happy path, but duplicate webhook/order failure risk hits real buyers | LOW | High hidden support risk | Drops P0 work and creates fragile commerce debt | Bad: live side effects without durable idempotency | CUT |
| Keep current DIY QR download/upload path and add only an ORDER ONE placeholder/disabled CTA | 1-2 | same day | No real ordering; keeps referral artwork available | HIGH | Low | Minimal opportunity cost | Does not satisfy Mike's correction | CUT |
| Do nothing beyond plan | 0.5-1 | same turn | Prevents unsafe live commerce from shipping before storage/vendor/tax decisions | HIGH | No UX change | No P0 work displaced beyond planning | Best current action under the stated stop rule | STOP |

**Verdict from the matrix:** The requested full implementation is still above the `< 2 days CC` threshold and has unresolved RED risks, so this run must stop at plan stage under Mike's protocol. Vendor research changes the implementation target from default Printful to CustomCat for cheapest proven per-order artwork fulfillment, unless Mike values Printful's draft-confirm flow more than the ~$2-$6 per-shirt savings.

## Codex critique (round 1)

- I should not treat the old DIY-shirt CBA as still valid after Mike's correction. The ask is not "make a cute shirt page"; it is "make actual ordering possible."
- The current `/shirt` page already includes extra back text (`THIS T-SHIRT ENDED WAR AND DISEASE.`). That may have come from the original "maybe says like" wording, but Mike's correction now names the exact front/back text. Implementation should remove extra shirt-copy from the actual artwork.
- A metadata-only implementation is attractive because it avoids schema approval, but it fails the real-world duplicate-order path. Live fulfillment needs a durable idempotency claim before POD vendor side effects.
- Stripe Tax does not by itself solve charitable receipt accuracy. The code still has to separate taxable/physical shirt FMV from the donation amount and disclose the FMV estimate.
- Printful v2 being open beta is not automatically a blocker, but live auto-confirmed orders should default off until a real API-token/product/variant test succeeds.
- If this takes attention away from vote conversion or referral propagation for more than a couple of days, the shirt flow has to prove it is not merch vanity. The justification is attributed public scans, not shirt sales.
