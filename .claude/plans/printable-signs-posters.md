# Printable Signs / Posters Plan

## Research log

WebSearch queries run on 2026-05-14:

- `Next.js 15 Route Handlers PDF generation headers current docs 2025`
- `Next.js ImageResponse opengraph-image docs Next 15 last updated 2025`
- `@react-pdf/renderer Next.js 15 PDF generation server route 2025`
- `browser print CSS @page size margin print-color-adjust best practices 2025`
- `react-pdf package display PDFs not generate @react-pdf/renderer docs`
- `puppeteer PDF generation serverless bundle size Chrome download docs 2026`

WebFetch / doc reads on 2026-05-14:

- MDN, "Printing", last modified 2025-11-07: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing
  - Relevant: use `@media print` to hide page chrome and restyle content for paper.
  - Relevant: `window.print()` opens the native print dialog; browser Save as PDF is available without server PDF generation.
- MDN, `@page size`, last modified 2026-04-20: https://developer.mozilla.org/en-US/docs/Web/CSS/%40page/size
  - Relevant: CSS can declare `@page { size: letter; }` and `@page { size: A4; }`.
  - Constraint: page size is a print stylesheet concern; the UI should preview dimensions on screen but rely on print CSS for final paper output.
- MDN, `print-color-adjust`, last modified 2026-04-20: https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust
  - Relevant: set `print-color-adjust: exact` on the poster surface so QR contrast and deliberate color styles survive print where supported.
  - Constraint: browsers and printers may still reduce backgrounds; all styles must remain legible in black and white.
- Next.js 15 docs, "Route Handlers and Middleware", last updated 2025-09-23: https://nextjs.org/docs/15/app/getting-started/route-handlers-and-middleware
  - Relevant: route handlers can return custom `Response` bodies and headers if a future literal PDF download becomes necessary.
  - Decision impact: no need for an API route for MVP because browser print covers the printable artifact with no server rendering.
- Next.js docs, Metadata file conventions `opengraph-image`, accessed 2026-05-14: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
  - Relevant: existing `opengraph-image.tsx` files can keep generating 1200x630 image assets through Next image metadata routes.
  - Decision impact: `/poster` should embed existing generated OG image URLs instead of duplicating Satori/ImageResponse logic.
- React-PDF viewer package README, accessed 2026-05-14: https://github.com/wojtekmaj/react-pdf
  - Relevant: `react-pdf` is for displaying existing PDFs in React, not for generating printable PDFs from our poster UI.
  - Decision impact: do not choose `react-pdf` for poster PDF generation.
- `@react-pdf/renderer` docs, accessed 2026-05-14: https://react-pdf.org/
  - Relevant: this package can generate PDFs with React-like primitives.
  - Constraint: it does not render the existing DOM/Tailwind poster; it would require a parallel PDF-only layout and style system.
- `@react-pdf/renderer` Node API docs, accessed 2026-05-14: https://react-pdf.org/node
  - Relevant: Node APIs such as `renderToStream` can produce server PDFs if a future literal download is required.
  - Decision impact: keep this as a Phase 2 option, not the first implementation.
- Puppeteer installation/docs, accessed 2026-05-14: https://pptr.dev/guides/installation
  - Relevant: Puppeteer installs and manages browser binaries unless explicitly configured otherwise.
  - Decision impact: do not add Puppeteer to the Next.js serverless path for a poster route; the binary and bundle/install weight are not justified for printable CSS.

Local files read on 2026-05-14:

- `TODO.md:159-206`
  - Scope confirms `/poster` or `/sign`, five style options, explicit exclusion of Nazi-era styling, existing OG-image reuse, `qrcode.react@4.0.1`, `/r/<referralCode>` target, letter plus A4, and `share-templates.ts` message integration.
- `packages/web/src/components/demo/slides/sierra/slide-final-call-to-action.tsx`
  - Current QR usage imports `QRCodeSVG` from `qrcode.react`, sets `value`, `size`, `level="H"`, and renders inside a white block.
  - Poster plan should reuse `QRCodeSVG` and render SVG for crisp print.
- `packages/web/src/app/humanity-v-government/opengraph-image.tsx`
  - Existing pattern: `runtime = "nodejs"`, `revalidate = 3600`, `size = { width: 1200, height: 630 }`, `contentType = "image/png"`, delegates to shared OG helper.
- `packages/web/src/app/tasks/[id]/opengraph-image.tsx`
  - Existing pattern: Next `ImageResponse` route builds a 1200x630 PNG from task data and local assets.
  - Poster plan should consume these routes as image URLs instead of importing their internals.
- `packages/web/src/app/r/[code]/page.tsx`
  - Existing compatibility route logs referral clicks and redirects to the focused vote flow.
- `packages/web/src/app/vote/[code]/route.ts`
  - Canonical treaty referral route also logs and redirects.
- `packages/web/src/lib/referral-redirect.server.ts`
  - `buildReferralRedirectUrl({ code })` yields `/vote?ref=<code>`.
  - `logReferralRedirectClick` resolves users by handle or referral code and writes `ReferralClick`.
- `packages/web/src/lib/__tests__/referral-redirect.server.test.ts`
  - Confirms click logging and share-attempt attribution for referral-code clicks.
- `packages/web/src/lib/__tests__/microsite-referral-paths.test.ts`
  - Confirms `/r/ada` is allowed on the microsite host.
- `packages/web/src/lib/tasks/share-templates.ts`
  - `ShareRecipientMode` includes `"humanity"`.
  - `getUsableShareTemplates(tokens, "humanity")` filters message variants.
  - `HUMANITY_DEFAULT_SHARE_TEMPLATE_ID` is currently `"polite-reminder"`, but that body is too long for a poster default.

Contradictions / corrections from research:

- The TODO says `react-pdf` as a possible PDF option, but the package named `react-pdf` is a viewer. The generator is `@react-pdf/renderer`.
- The repo already has `/r/[code]` attribution. The canonical helper in `packages/web/src/lib/url.ts` builds `/vote/<identifier>`, but the requested `/r/<referralCode>` QR shape is already supported and attributable through the compatibility route.
- A literal "Download PDF" implementation is not necessary for the first pass. Browser print plus Save as PDF gives users the same paper/PDF artifact without Puppeteer or a parallel `@react-pdf/renderer` layout.

Committed design decisions:

1. Route path: use `/poster`.
   - Reason: "poster" is the clearest noun for the artifact being generated and matches the visual style-selector concept. `/sign` conflicts with treaty signing language. `/print-sign` is clunky and over-specifies the action instead of the object.
2. PDF generation approach: browser print only for MVP, with a "Print / Save PDF" command that calls `window.print()`.
   - Reason: it reuses the actual rendered poster, avoids Puppeteer serverless weight, avoids duplicating layout in `@react-pdf/renderer`, and avoids misusing `react-pdf`.
   - Follow-up if Mike requires a literal downloaded `.pdf`: use `@react-pdf/renderer` or an out-of-band headless worker only after a reviewed Phase 2 plan.
3. Page size handling: support Letter and A4 in the first implementation.
   - Default: Letter selected initially, with a visible A4 selector. Both must have screen preview dimensions and print `@page` rules.
4. Style component shape: one shared poster composition with style variants.
   - Shared slots: headline, message text, central OG/campaign image, QR block, short URL, footer/citation strip.
   - Variants provide tokens and optional decoration: Treaty editorial, Soviet/constructivist, WPA public-service, UK wartime minimal, Bauhaus geometric.
   - Nazi-era styling is deliberately excluded and should not appear as a hidden option, label, preset, example, test fixture, or future TODO.
5. QR target: logged-out posters use `https://warondisease.org`; logged-in posters use `https://warondisease.org/r/<referralCode>`.
   - Confirmation: `/r/[code]` already resolves handles or referral codes, writes `ReferralClick`, preserves `sa`/`invite` where present, and redirects to `/vote?ref=<code>`.
6. Message text: use `recipientMode = "humanity"` and default poster template id `task-notification`.
   - Reason: `task-notification` is short, command-like, and print-readable. The current humanity default, `polite-reminder`, is useful for messages but too long for a poster.
   - Implementation should not change `HUMANITY_DEFAULT_SHARE_TEMPLATE_ID`; `/poster` can own its poster-specific default while still using `getUsableShareTemplates`.

## Brief

Build a War on Disease `/poster` page that lets a human generate a printable campaign poster with a QR code. The page should work for logged-out users with a generic `warondisease.org` QR and for logged-in users with a referral QR so physical posters feed the same vote/referral chain as digital sharing.

The implementation should be campaign-first, print-first, and low dependency. It should reuse existing QR, route, message-template, and OG-image patterns instead of adding a separate PDF rendering stack or new generated-image system.

## Current state ASCII diagram

```text
User / dashboard / share surfaces
        |
        v
share-templates.ts
        |
        v
digital message text with treaty_url

User referral helpers
        |
        +--> /vote/<identifier> route
        |        |
        |        v
        |   /vote?ref=<identifier>
        |
        +--> /r/<identifier> compatibility route
                 |
                 +--> log ReferralClick
                 +--> /vote?ref=<identifier>

Existing visual assets
        |
        +--> app/**/opengraph-image.tsx
        |        |
        |        v
        |   1200x630 PNG metadata image
        |
        +--> qrcode.react used in Sierra slide only
```

## Proposed state ASCII diagram

```text
/poster
  |
  +--> server page gets session user
  |       |
  |       +--> no referralCode: qrTarget = https://warondisease.org
  |       |
  |       +--> referralCode: qrTarget = https://warondisease.org/r/<referralCode>
  |
  +--> PosterClient
          |
          +--> style picker
          |       +--> treaty-editorial
          |       +--> soviet-constructivist
          |       +--> wpa-public-service
          |       +--> uk-wartime-minimal
          |       +--> bauhaus-geometric
          |
          +--> page size picker
          |       +--> Letter
          |       +--> A4
          |
          +--> message picker
          |       +--> getUsableShareTemplates(tokens, "humanity")
          |       +--> default: task-notification
          |
          +--> image selector
          |       +--> /humanity-v-government/opengraph-image
          |       +--> existing campaign/social image fallback
          |
          +--> PosterCanvas
                  |
                  +--> shared layout slots
                  |       +--> headline
                  |       +--> rendered message text
                  |       +--> OG/campaign image
                  |       +--> QRCodeSVG
                  |       +--> short URL
                  |
                  +--> @media print hides controls
                  +--> @page uses selected Letter/A4 size
                  +--> window.print() opens Print / Save PDF
```

## Step list

- [ ] Claim the TODO entry before implementation if parallel agents are active, because `TODO.md` says this is cross-system plan-first work.
- [ ] Read root `AGENTS.md`, `packages/web/AGENTS.md` if present, `docs/h2ewd.md`, this plan, and `TODO.md:159-206`.
- [ ] Create a feature branch if starting from `main`, using `feature/printable-signs-posters`.
- [ ] Add `ROUTES.poster = "/poster"` in `packages/web/src/lib/routes.ts`.
- [ ] Add the poster route to the War on Disease site allowlist/navigation only where it helps campaign action; do not put it above the vote action.
- [ ] Create `packages/web/src/app/poster/page.tsx` as a server component that reads the current session and passes the poster referral state to the client.
- [ ] Create `packages/web/src/app/poster/poster-client.tsx` for style, size, image, and template controls.
- [ ] Create `packages/web/src/components/poster/poster-types.ts` defining:
  - `PosterStyleId = "treaty-editorial" | "soviet-constructivist" | "wpa-public-service" | "uk-wartime-minimal" | "bauhaus-geometric"`
  - `PosterPageSize = "letter" | "a4"`
  - `PosterImageId` for the initial existing OG/campaign image choices.
- [ ] Create `packages/web/src/components/poster/poster-style-config.ts` with one config object per style:
  - display label
  - typography classes
  - ink/background/accent tokens
  - optional geometric decoration component id
  - print-safety notes for color fallback
- [ ] Create `packages/web/src/components/poster/poster-tokens.ts` to produce the token bag required by `share-templates.ts`.
  - Use `target_name = "Humanity"`.
  - Use the QR target as `treaty_url`.
  - Use existing parameter formatters for `eradication_years_status_quo` and other required values.
  - Use a logged-in display name where available for `citizen_name`; otherwise use "A human with a printer".
- [ ] Create `packages/web/src/components/poster/poster-message-picker.tsx`.
  - Call `getUsableShareTemplates(tokens, "humanity")`.
  - Default to `task-notification` when available.
  - Allow override to other usable humanity templates, but warn in UI only by preview length/clipping, not extra explanatory copy.
- [ ] Create `packages/web/src/components/poster/poster-canvas.tsx`.
  - Render one shared layout with slots for headline, image, message, QR, and URL.
  - Use `QRCodeSVG` from `qrcode.react`, `level="H"`, and a white quiet zone.
  - Keep text selectable on screen and printable.
- [ ] Create `packages/web/src/components/poster/poster-print-controls.tsx`.
  - Use a button that calls `window.print()`.
  - Label it "Print / Save PDF".
  - Do not add server PDF generation in this phase.
- [ ] Add poster print CSS in the route or component stylesheet.
  - Controls hidden in `@media print`.
  - Poster fills one selected page.
  - Define Letter and A4 print rules with named pages or generated size-specific print CSS, then assign the selected page name to the poster root.
  - `print-color-adjust: exact` on the poster canvas.
  - QR and short URL remain visible in grayscale.
- [ ] Add a focused unit test for poster referral target construction.
  - Logged out: `https://warondisease.org`.
  - Logged in with referral code: `https://warondisease.org/r/<referralCode>`.
  - Do not mock and assert the mock; test the pure URL helper.
- [ ] Add a focused unit test for poster template selection.
  - `recipientMode = "humanity"`.
  - default template id is `task-notification` when usable.
  - falls back to the first usable humanity template only if `task-notification` is not usable.
- [ ] Add a focused component or Playwright smoke test only if it can guard real breakage:
  - `/poster` loads.
  - controls are present on screen.
  - print canvas contains an SVG QR and the chosen target URL text.
- [ ] Reuse the existing dev server at `http://127.0.0.1:3001`; do not start another server if it is already serving the app.
- [ ] Capture UI screenshots after implementation:
  - `/poster` logged out, desktop, Letter, Treaty editorial.
  - `/poster` logged out, mobile controls.
  - `/poster` logged in as seeded user if a safe seeded session is available, showing referral QR URL text.
  - At least one non-default style, preferably Bauhaus or WPA.
- [ ] Generate/update `packages/web/output/playwright/review/latest.html` with screenshots and inspect it manually.
- [ ] Ask Mike to review the screenshot HTML before committing UI or copy changes.
- [ ] Run focused verification:
  - `pnpm --filter @optimitron/web exec tsc --noEmit`
  - focused vitest files added or changed
  - Playwright spot check for `/poster`
- [ ] Do not run `pnpm build`, `next build`, or any script that invokes `next build` during a live dev-server session.
- [ ] After approval, commit only the intended files. Do not commit screenshot artifacts unless Mike explicitly asks.

## Risks

- Print CSS differs by browser and printer. Mitigation: test Chromium print preview behavior and keep all variants legible in grayscale.
- Browser Save as PDF is not a literal in-app PDF download. Mitigation: label the control "Print / Save PDF" and defer literal PDF generation to a Phase 2 plan if requested.
- `@page` size switching can be awkward because CSS page rules are static. Mitigation: use named page rules or generated size-specific print CSS and validate output manually.
- Long share templates can overflow a single page. Mitigation: default to `task-notification`, show text preview inside fixed slots, and constrain override templates with responsive type/clamping for print.
- Existing OG images are 1200x630 landscape assets and may not fit every poster style. Mitigation: use them as an image slot, not as the whole poster; allow the style to crop/scale within a stable frame.
- QR codes can become unscannable if printed too small or on low-contrast styles. Mitigation: hard-code a minimum print size, white quiet zone, high error correction, and visible URL text fallback.
- Logged-in referral display may expose a user's referral code on a public poster. Mitigation: make the target visible before printing and provide a generic "no referral" mode.
- Adding `/poster` to public navigation could distract from the vote. Mitigation: expose it as a secondary sharing/tool route, not first-screen campaign chrome.
- Nazi-era styling must stay excluded. Mitigation: no config id, no UI label, no route param, no test fixture, no docs TODO suggesting it.

## Files to touch

- Create: `packages/web/src/app/poster/page.tsx`
- Create: `packages/web/src/app/poster/poster-client.tsx`
- Create: `packages/web/src/components/poster/poster-canvas.tsx`
- Create: `packages/web/src/components/poster/poster-message-picker.tsx`
- Create: `packages/web/src/components/poster/poster-print-controls.tsx`
- Create: `packages/web/src/components/poster/poster-style-config.ts`
- Create: `packages/web/src/components/poster/poster-tokens.ts`
- Create: `packages/web/src/components/poster/poster-types.ts`
- Create: `packages/web/src/components/poster/__tests__/poster-referral-url.test.ts`
- Create: `packages/web/src/components/poster/__tests__/poster-template-selection.test.ts`
- Modify: `packages/web/src/lib/routes.ts`
- Modify: `packages/web/src/lib/site.ts` only if the route needs host allowlist/nav exposure.
- Modify: `packages/web/src/lib/__tests__/routes.test.ts` if `ROUTES.poster` or nav exposure is added.
- Modify: `packages/web/src/lib/__tests__/microsite-referral-paths.test.ts` only if host route allowlisting needs explicit `/poster` coverage.
- Modify: screenshot review artifacts under `packages/web/output/playwright/` during work, but do not commit them unless explicitly requested.

## ALERTS

## Agent log

## Codex critique (round 1)

Overall: solid MVP direction. Browser print first, SVG QR, and reusing existing share/OG infrastructure are the right instincts. The weak parts are where the plan says "poster" but still thinks like a web page: print fidelity, style-specific layout, and message length need stricter decisions before implementation.

Findings:

- `/poster` does not conflict with `packages/web/src/lib/routes.ts` today. There is no existing `/poster` route in `ROUTES`, and the only close public route is `/signatories`; `/sign` is also not present as a route. Still, `/sign` is a worse product name because it collides semantically with signing/voting on the treaty and with signatories. `/poster` is fine for the generator route.

- The plan should explicitly state that the printed artifact must show the QR target / short action URL, not the generator URL. A partner org printing a physical sign that visibly says `warondisease.org/poster` would be absurd: it sends passers-by to the poster-making tool instead of the vote flow. The route can be `/poster`; the visible printed URL should be `warondisease.org`, `warondisease.org/r/<code>`, or a deliberately shorter campaign redirect.

- Existing QR usage is real but too small to copy literally. `slide-final-call-to-action.tsx` imports `QRCodeSVG`, sets `level="H"`, `size={160}`, and renders it inside a white block with `includeMargin={false}`. That proves the dependency/API, not print readiness. The poster needs a physical QR spec: minimum printed size in inches/mm, explicit quiet zone, high contrast, and a visible text fallback. Do not let a 160 CSS-pixel precedent become the poster default.

- Browser-print-only MVP is the right dependency choice, but the plan underspecifies the hard print bugs. It mentions `@page` and `print-color-adjust`, but implementation needs explicit rules for page breaks, overflow, exact physical page dimensions, grayscale legibility, and browser font fallback. Add acceptance criteria like: no second blank page, poster root is one page at Letter and A4, controls never print, QR remains scannable in print emulation, and the design still works if background colors are suppressed.

- Add both `print-color-adjust: exact` and `-webkit-print-color-adjust: exact`, but do not rely on either. Some printers/users will still drop backgrounds. Every variant needs a black-and-white fallback where the QR, headline, URL, and CTA remain legible without decorative color.

- Web fonts are a real print risk. The plan should either use system/local fonts for the poster or explicitly preload/embed any custom font used by the print surface. If a constructivist/WPA/Bauhaus style depends on a display face that fails to load in print preview, the poster will degrade from "intentional" to "random bold system font".

- The OG reuse claim is mostly valid but narrower than the plan implies. `humanity-v-government/opengraph-image.tsx` is a node runtime metadata image that delegates to a shared black-and-white OG helper. `tasks/[id]/opengraph-image.tsx` is also node runtime but builds a very task-specific ImageResponse with a colorful/neobrutalist frame and `optimitron.earth/tasks/{task.id}` in the footer. Reusing these as image URLs is fine; importing internals or treating all OG images as neutral campaign assets is not.

- A generic `/poster` page cannot casually embed `tasks/[id]/opengraph-image` without choosing a concrete task. The plan needs an initial asset list with stable IDs and labels. If one option is task OG, say which task and why it belongs on a physical War on Disease poster.

- "One shared composition with five style variants" is the biggest abstraction hand-wave. Treaty editorial, constructivist, WPA, UK wartime minimal, and Bauhaus are not just token swaps. They use different grids, image proportions, type scale, white space, and QR placement. Keep shared data/types, but allow per-style layout configs or per-style renderers. Otherwise the bold styles will look like the treaty layout wearing a costume.

- The constructivist option needs political-risk language. Excluding Nazi styling is correct, but red/black "Soviet/constructivist" imagery can still read as Communist propaganda in a 2026 US partner-org context. The plan should acknowledge that risk, probably label it "Constructivist" rather than "Soviet" in UI, keep Treaty/WPA as safer defaults, and make partner-safe exports avoid hammer-and-sickle-adjacent shapes.

- `/r/[code]` exists and redirects through `buildReferralRedirectUrl()` to `/vote?ref=<code>` while logging clicks best-effort. Invalid codes do not break the redirect, but they also are not validated before the vote flow stores `ref` in local storage/pending vote state. That is graceful enough for generated links from real users, but the plan should not claim invalid-code validation. It should say invalid codes degrade to unattributed referral attempts.

- Missing code is not handled by `/r/[code]`; `/r/` is simply no dynamic match. That is fine, but the poster URL helper should only emit `/r/<code>` after trimming and verifying a non-empty referral identifier. Logged-out/generic mode should never create `/r/`.

- `task-notification` exists and supports `recipientModes: ["leader", "humanity", "one_human"]`, so the plan's lookup is factual. But it is not short enough for poster type if rendered as the body. With plausible tokens it renders as roughly:

  ```text
  Overdue task: End War and Disease
  Assigned to: Humanity
  Assigned by: A human with a printer
  Time required: 30 seconds
  Due: about 347 years ago
  Please vote on the 1% Treaty:
  https://warondisease.org/r/example
  ```

  That is seven lines and about 32 words including the URL. It can work as a small faux-notification block, but not as the primary poster headline. The poster should derive a short headline such as "End War and Disease" or "Vote on the 1% Treaty" and use `task-notification` only as optional secondary copy.

- The current `HUMANITY_DEFAULT_SHARE_TEMPLATE_ID` is still `polite-reminder`, and the plan correctly avoids changing it. Good. But the poster-specific template fallback should be explicit and tested against rendered word count/line count, not just template ID existence.

- The QR target shape `https://warondisease.org/r/<referralCode>` is supported as a compatibility route, but `packages/web/src/lib/url.ts` currently builds canonical referral links as `/vote/<identifier>`. The plan should either justify intentionally using the compatibility route for shorter physical URLs, or add a poster-specific URL helper so this does not fork route semantics invisibly.

- Phase 2 `@react-pdf/renderer` is not obviously prohibitive, but it is not free. `npm view @react-pdf/renderer@latest` reports 4.5.1 at 292,400 unpacked bytes, but it pulls a PDF/font/layout stack: `@react-pdf/pdfkit` is about 1.28 MB unpacked, `fontkit` about 5.61 MB unpacked, and `yoga-layout` about 224 KB. That is comfortably below Vercel's current 250 MB uncompressed function bundle limit by itself, but the plan should require a route-isolated dynamic import and bundle-size check if Phase 2 happens.

- The bigger Phase 2 cost is not bundle size; it is duplicate layout. `@react-pdf/renderer` will not render the Tailwind/DOM poster. If a literal PDF download becomes necessary, the plan needs to budget for a second layout system or choose a headless print worker. Do not pretend it is just swapping in a PDF button.

- The plan should add a print verification artifact, not only normal screenshots. For this feature, "UI screenshots" are insufficient. The review should include at least Chromium print-emulation screenshots or generated PDFs for Letter and A4, plus visual inspection of page count, margins, QR size, and text clipping.

## Codex critique summary

Top 3:

1. Browser-print-only is the right MVP, but the plan needs concrete print acceptance criteria: one page, no chrome, physical QR size, print color fallback, font fallback, and Letter/A4 print-preview artifacts.
2. `task-notification` exists, but rendered as a whole it is too long for poster headline type. Use it as secondary notification copy or derive a short poster headline from it.
3. The route choice is mostly right: use `/poster` for the generator, not `/sign`; make sure the printed artifact shows the vote/referral URL, never `warondisease.org/poster`.

## Mike approved (round 2 — scoped-down MVP)

Mike chose the minimum viable shape:
1. Single route `/poster`. No style chooser.
2. One default style: Treaty editorial (the existing black-and-white editorial look the rest of the campaign uses).
3. Browser-print only. No PDF generation path. Users hit Cmd-P / Ctrl-P → "Save as PDF" if they want a file.
4. NO Soviet/constructivist option even as a hidden style (Mike's call: drop the politically-charged option entirely; risks Communist-baggage reactions in US context that alienate centrist partners — same kind of concern as the Nazi exclusion, lower-grade).

Implementation reuses what already exists:
- The existing tagline "Take 30 seconds to end war and disease" from `packages/web/src/lib/routes.ts:193`.
- The existing OG image generation (`generateBlackWhiteTextOgImageResponseForNavItem`) as the central visual, rendered downscaled inside the poster layout.
- `qrcode.react@4.0.1` (already installed, already used in `slide-final-call-to-action.tsx`) for the QR.
- QR target: `warondisease.org/r/<referralCode>` for logged-in users; `warondisease.org` for logged-out.

NOT in scope:
- Style chooser UI / 5 style variants / 4 style variants — all deferred. Single Treaty-editorial style only.
- @react-pdf/renderer / puppeteer / PDF download route.
- Headlines other than the existing tagline.

Page sizes: support Letter and A4 via `@media print { @page { size: letter; } }` / `size: A4;`. Use `prefers-color-scheme: print` if needed; ensure black ink prints on white paper regardless of device dark mode.
