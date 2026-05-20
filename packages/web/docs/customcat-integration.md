# CustomCat API integration

Source-of-truth doc for the `/shirt` commerce flow. CustomCat is the print-on-demand vendor selected per the cost comparison in [`.claude/plans/t-shirt-walking-billboard.md`](../../../.claude/plans/t-shirt-walking-billboard.md) (CustomCat $13.67/shirt Pro plan vs Printful $18-20, cheapest API-enabled option supporting per-order custom artwork).

## Account model

CustomCat uses **Workflow 2: External Designs** for our use case. This is API-driven:

- **No product is created in the CustomCat dashboard.** The dashboard's "create product" flow is for Workflow 1 (CustomCat hosts a storefront for you).
- Each API order references a `catalog_sku` (variant ID) from CustomCat's global catalog + a `design_url` pointing to the per-buyer print-ready PNG.
- The catalog IDs are stable, permanent, account-agnostic (e.g. `952` = Bella+Canvas 3001C Unisex Jersey Short-Sleeve Tee, `45475` = size S color Black).
- Discover catalog IDs via `GET https://customcat-beta.mylocker.net/api/v1/catalog/{product_id}?api_key=...`.

## Authentication

- **API key, NOT Bearer token.** Pass the API key in EITHER the query string (`?api_key=...`) OR the POST body field (`api_key`). Both work.
- Single UUID-format token per API Store. Generated once in CustomCat dashboard → API → "Generate API Token". Cannot be re-displayed; if lost, generate a new one.
- One token per API Store. `store_id` is accepted in order bodies but not required, so the client omits it.

## Sandbox / test mode

- **Per-request flag.** Add `"sandbox": "1"` to the POST body of `/order/{external_id}` calls for test orders; set `"sandbox": "0"` for live orders.
- There is **no sandbox API key** and **no account-level sandbox toggle.** A single API key handles both modes.

## Print method

- CustomCat calls their direct-to-garment process **DIGISOFT®** (not "DTG"). Both front and back placements are supported.
- Back-print adds **+$5/item** to the base shirt cost per CustomCat's pricing FAQ.

## Size naming

- CustomCat's API uses **`2XL`** for XX-Large. Our env var naming uses `XXL` for readability; the `catalog_sku_id` values map correctly to 2XL.

## Order POST shape

> Verified empirically 2026-05-19 against `https://customcat-beta.mylocker.net/api/v1/`. The real endpoint is `POST /order/{external_id}` and the payload is flat.

```http
POST https://customcat-beta.mylocker.net/api/v1/order/<external_id>
Content-Type: application/json

{
  "shipping_first_name": "Ada",
  "shipping_last_name": "Lovelace",
  "shipping_address1": "100 Main St",
  "shipping_address2": "Apt 4",
  "shipping_city": "Edwardsville",
  "shipping_state": "IL",
  "shipping_zip": "62025",
  "shipping_country": "US",
  "shipping_email": "recipient@example.com",
  "shipping_phone": "555-123-4567",
  "shipping_method": "Economy",
  "items": [{
      "catalog_sku": "45475",
      "quantity": 1,
      "design_url": "https://r2.warondisease.org/.../order-front-cs_test_123.png",
      "design_url_back": "https://r2.warondisease.org/.../order-back-cs_test_123.png"
  }],
  "sandbox": "1",
  "api_key": "<token>"
}
```

Critical fields:
- `external_id` — our `MerchandiseOrder.id` or Stripe Checkout session id, passed as the path segment. `POST /api/v1/order` returns 404. Posting the same value twice returns the same `CUSTOMCAT_ORDER_ID`; safe for Stripe webhook retries.
- The body is flat. Do not send `orders`, `ship_to`, `line_items`, `shipping_option`, or nested objects.
- `shipping_state` — two-letter state code such as `IL`, not `Illinois`.
- `shipping_country` — two-letter country code such as `US`.
- `shipping_email` — required.
- `shipping_phone` — required; sandbox returned HTTP 500 without it.
- `shipping_method` — name from the shipping API, such as `Economy`, `Ground`, `2 Day`, or `Standard Overnight`. Use the name, not the ID.
- `catalog_sku` — string, looked up from managed commerce catalog seed data, not env.
- `design_url` + `design_url_back` — public R2 URLs of the composed PNGs. Must be publicly fetchable by CustomCat at order time. Browser-agent testing found CustomCat re-downloads the design by URL; unique R2 keys are for audit/traceability, not cache busting. Include the external order id in object keys.
- `sandbox` — string `"1"` or `"0"`, not an integer.
- `store_id` — accepted but not required. Omit it unless a future verified behavior requires it.

Successful response shape:

```json
{
  "MSG": "Order added successfully",
  "ORDER_ID": "<our-merchandise-order-id>",
  "CUSTOMCAT_ORDER_ID": "<customcat-uuid>"
}
```

The client must parse `CUSTOMCAT_ORDER_ID` and must treat any `MSG` other than `"Order added successfully"` as a failed submission, even if CustomCat returns HTTP 200.

## Order status endpoint

Use the external order id if a webhook is delayed or missed:

```http
GET https://customcat-beta.mylocker.net/api/v1/order/status/<our-merchandise-order-id>?api_key=<token>
```

The response includes `ORDER_STATUS`, for example `"in queue"`.
Sandbox orders can progress to `ORDER_STATUS: "Shipped"` with realistic `SHIPMENTS`, including `TRACKING_ID`. That makes end-to-end Stripe -> CustomCat -> webhook -> confirmation testing possible in sandbox.

Confirmed response shape:

```json
{
  "ORDER_ID": "<external_id>",
  "CUSTOMCAT_ORDER_ID": "<customcat-uuid>",
  "ORDER_DATE": "2026-05-19 ...",
  "ORDER_STATUS": "in queue",
  "CUSTOMER_NAME": "Ada Lovelace",
  "CUSTOMER_ADDRESS1": "100 Main St",
  "CUSTOMER_CITY": "Edwardsville",
  "CUSTOMER_STATE": "IL",
  "CUSTOMER_COUNTRY": "US",
  "CUSTOMER_ZIP": "62025",
  "ORDER_TOTAL": "18.46",
  "SHIPMENTS": [{ "TRACKING_ID": "TRACK123", "METHOD": "Economy", "VENDOR": "USPS" }],
  "LINE_ITEMS": [{ "STATUS": "Shipped", "PRODUCT_NAME": "Bella+Canvas 3001C" }]
}
```

## Shipping options endpoint

```http
GET https://customcat-beta.mylocker.net/api/v1/shipping?api_key=<token>
```

The response contains `{ "SHIPPING_ID": "...", "SHIPPING_NAME": "..." }` records. Use `SHIPPING_NAME` as `shipping_method` in the order POST body.

Real-time shipping quote:

```http
POST https://customcat-beta.mylocker.net/api/v1/shipping/<shipping_id>
Content-Type: application/json

{
  "api_key": "<token>",
  "shipping_first_name": "Ada",
  "shipping_last_name": "Lovelace",
  "shipping_address1": "100 Main St",
  "shipping_address2": "",
  "shipping_city": "Los Angeles",
  "shipping_state": "CA",
  "shipping_zip": "90001",
  "shipping_country": "US",
  "items": [{ "catalog_sku": "45475", "quantity": 1 }]
}
```

Sandbox example prices for one shirt to California: Economy `$4.99`, Ground `$12.99`, 2 Day `$22.00`, Standard Overnight `$35.00`. Prices vary by destination and quantity.

International quote requests have returned `"0.00"` in sandbox. Treat non-US shipping as unsupported for v1 unless a later launch pass verifies real international behavior.

## Webhook system

Registered webhooks can be listed with:

```http
GET https://customcat-beta.mylocker.net/api/v1/webhook?api_key=<token>
```

Create:

```http
POST https://customcat-beta.mylocker.net/api/v1/webhook
Content-Type: application/json

{ "api_key": "<token>", "topic": "order-shipped", "url": "https://warondisease.org/api/customcat/webhook" }
```

Update:

```http
PUT https://customcat-beta.mylocker.net/api/v1/webhook/<webhook_id>
Content-Type: application/json

{ "api_key": "<token>", "url": "https://warondisease.org/api/customcat/webhook" }
```

Topics:
- `order-shipped` — use.
- `order-partial-shipment` — use.
- `design-rejected` — use; this tells us if CustomCat rejected submitted artwork.
- `product-created`, `product-deleted`, `product-updated` — ignore; we do not manage CustomCat products via webhook.

Webhook registration belongs in a deploy-time one-shot script or dashboard action, not in the request path. As of the empirical check, an existing `order-shipped` webhook pointed at a webhook.site placeholder; reconfigure it at launch through the API or dashboard.

## Cancellation and refunds

CustomCat order cancellation is not supported, including for live orders shortly after creation. Refund handling is a Stripe/customer-service policy decision. Sandbox orders are no-ops. If a live CustomCat order ships after refund, the customer keeps the shirt and the refund should cover only the donation portion per the launch refund policy.

## Env vars

Set these in Vercel Project Settings → Environment Variables. **Never commit these values.**

| Env var | Purpose | Example shape |
|---|---|---|
| `CUSTOMCAT_API_TOKEN` | UUID API key from CustomCat API Store | `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX` |
| `CUSTOMCAT_SANDBOX` | `"1"` to force per-request sandbox, `"0"` for live | `"1"` |
| `SHIRT_COMMERCE_ENABLED` | `"true"` to show the ORDER button on `/shirt`, `"false"` to hide | `"false"` |

Catalog product and variant IDs live in
`packages/db/src/managed-data/managed-commerce-catalog.ts` and sync through
managed data. They are stable vendor catalog facts, not secrets.

**Operational pattern:**
- Set `SHIRT_COMMERCE_ENABLED=false` in Production until full end-to-end validation passes
- Set `SHIRT_COMMERCE_ENABLED=true` + `CUSTOMCAT_SANDBOX=1` in Preview environments for staging-level testing
- Flip `SHIRT_COMMERCE_ENABLED=true` + `CUSTOMCAT_SANDBOX=0` in Production only after a real sandbox order goes through end-to-end

## Pricing reference (re-verify against current CustomCat docs before launch)

| Item | Lite plan (free) | Pro plan ($25/mo annual) |
|---|---|---|
| Bella+Canvas 3001C base (1 placement) | $11.47 | $8.67 |
| + back placement | +$5.00 | +$5.00 |
| **Per-shirt total** | **$16.47** | **$13.67** |

Shipping is additional (CustomCat calculates per-order based on the shipping address fields). Stripe Tax handles sales tax on the $15 FMV portion of each order.

Empirical catalog check on 2026-05-19 found a 2XL base cost of $13.47 rather than $11.47. For v1, keep a single $15 fair market value across sizes instead of adding a per-size FMV override map.

## IRS quid pro quo split

Per [IRS Pub 1771](https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-contributions-quid-pro-quo-contributions), when a 501(c)(3) provides goods/services in exchange for a contribution:
- The deductible portion = total payment − fair market value of goods/services
- Written acknowledgment must disclose this split

Our line-item shape on Stripe Checkout:
- Line 1: `Shirt fair market value` — $15.00, taxable, NOT deductible
- Line 2: `Charitable contribution` — (tier price − $15), nontaxable, DEDUCTIBLE
- Receipt email auto-discloses: `"Your contribution above the $15 shirt fair market value is tax-deductible to the extent allowed by law."`

## Vendor docs cited

- [CustomCat API overview](https://customcat.com/integrations/customcat-api/)
- [Getting Started with CustomCat API](https://help.customcat.com/getting-started-with-customcat-api)
- [CustomCat API base (v1 beta)](https://customcat-beta.mylocker.net/api/v1/)
- [Stripe address collection](https://docs.stripe.com/payments/collect-addresses)
- [Stripe Tax codes](https://docs.stripe.com/tax/tax-codes?type=services)
- [IRS Pub 1771 — quid pro quo contributions](https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-contributions-quid-pro-quo-contributions)
- [IRS written acknowledgment guidance](https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-contributions-written-acknowledgments)
