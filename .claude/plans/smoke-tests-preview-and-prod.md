## Research log

Viewed on 2026-05-15.

WebSearch queries run:

- `site:docs.github.com/actions/using-workflows/events-that-trigger-workflows deployment_status workflow_run GitHub Actions 2026`
- `site:docs.github.com/en/webhooks/webhook-events-and-payloads deployment_status workflow_run 2026`
- `GitHub Actions deployment_status workflow_run event docs deployment_status workflow_run` with last-12-month search filter
- `Vercel deployment.ready deployment.succeeded webhook docs deployment-ready replaced by deployment.succeeded` with last-12-month search filter
- `Vercel Protection Bypass for Automation x-vercel-protection-bypass docs` with last-12-month search filter

Sources opened:

- [GitHub Actions events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), no last-updated date visible in fetched plain text, accessed 2026-05-15. Relevant facts: `deployment_status` runs when a third party provides a deployment status and does not run for `inactive`; `workflow_run` runs only from a default-branch workflow file, reports default-branch `GITHUB_SHA`/`GITHUB_REF`, and has a three-level chaining limit.
- [GitHub webhook events and payloads](https://docs.github.com/en/webhooks/webhook-events-and-payloads), no last-updated date visible in fetched plain text, accessed 2026-05-15. Relevant facts: `deployment_status` is the event for deployment status activity, not deployment creation; GitHub does not fire it for inactive statuses.
- [GitHub REST deployment status API](https://docs.github.com/en/rest/deployments/statuses?apiVersion=2022-11-28), API version 2022-11-28, accessed 2026-05-15. Relevant facts: deployment status states are `error`, `failure`, `inactive`, `in_progress`, `queued`, `pending`, and `success`; status objects carry `environment`, `environment_url`, `log_url`, and `target_url`.
- [Vercel Webhooks API Reference](https://vercel.com/docs/webhooks/webhooks-api), last updated 2026-03-17. Relevant facts: Vercel has `deployment.ready` and `deployment.succeeded`; legacy `deployment-ready` is replaced by `deployment.succeeded`; `deployment.succeeded` fires after blocking checks pass when an integration has checks; payload has deployment URL and `target` values like `production`, `staging`, or `null`.
- [Vercel Setting Up Webhooks](https://vercel.com/docs/webhooks), last updated 2026-03-11. Relevant facts: Vercel webhooks POST event payloads and retry non-2xx responses for up to 24 hours. This is useful background, but not the chosen implementation because the repo already receives Vercel deployment status through GitHub.
- [Vercel Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation), last updated 2026-02-21. Relevant facts: Vercel recommends the `x-vercel-protection-bypass` HTTP header for automation; the bypass secret may also be sent as a query parameter with the same name; Vercel exposes a `VERCEL_AUTOMATION_BYPASS_SECRET` system env var to deployments, but CI still needs the secret in GitHub if CI makes protected-preview requests.
- [Vercel Shareable Links](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links), last updated 2026-02-27. Relevant facts: shareable links are human-review access links managed per deployment. The docs describe secure query-string access, but this is not the recommended automation path.
- [Vercel CLI curl](https://vercel.com/docs/cli/curl), last updated 2026-02-10. Relevant facts: `vercel curl` is beta, shells out to system `curl`, and automatically adds `x-vercel-protection-bypass`; useful for manual checks but not ideal for a minimal GitHub `deployment_status` smoke step.

Local files read:

- `TODO.md` lines 528-552: preview and production smoke tests are one infrastructure task; routes are `/`, `/treaty`, `/plaintiffs`, `/tasks`, `/humanity-v-government`, `/employees`, `/court`, `/people`; target budget is under 30 seconds each.
- `.github/workflows/ci.yml` lines 1-15, 150-194, 259-299, 547-683, 685-780: CI currently runs local Playwright smoke before any preview deploy is ready, resolves a PR preview URL by listing deployment statuses with `state === "success"` and `environment_url`, syncs preview managed data from `pull_request`, and deploys production with Vercel CLI but does not smoke the deployed URL.
- `packages/web/e2e/contrast-audit.spec.ts`: route-walking imports `PUBLIC_PAGE_PATHS`, supports a critical subset, and skips/handles routes before auditing.
- `packages/web/e2e/utils/static-pages.ts`: canonical e2e route inventory is derived from `src/app` and filtered through site-aware routing.
- `packages/web/e2e/smoke.spec.ts`: existing local smoke is broad metadata/page-error coverage against the local build, not remote preview/prod deployment smoke.

Assumption checks / contradictions found:

- The TODO phrase `deployment_status: production_ready` is not a GitHub deployment status state. GitHub uses `success`; production must be inferred from `deployment_status.environment`, `deployment.environment`, deployment payload target metadata when available, or the URL/domain.
- Vercel's old `deployment-ready` webhook is legacy. The current Vercel docs prefer `deployment.succeeded`, but because Vercel's GitHub integration already posts GitHub deployment statuses and the repo already resolves preview URLs from those statuses, the plan should use GitHub `deployment_status` instead of adding a Vercel webhook receiver.
- The existing "Resolve PR preview URL" step does not add `_vercel_share` or any bypass value. It only returns the successful deployment status `environment_url`.
- Current source review suggests `/treaty` renders its fixed top line as `h2`, and `/court` renders the reader intro as a paragraph plus markdown that does not begin with an h1. A literal "expected h1 present" assertion for all eight TODO routes will require either small semantic markup changes or explicit Mike approval for selector exceptions.

## Brief

Add one fast post-deploy smoke path for both Vercel preview deployments and production deployments. It should run after Vercel/GitHub reports a deployed URL as ready/successful, hit the same critical public routes on the deployed target, and fail loudly when the real deployment serves a generic error page, stale DB/runtime crash, missing heading, 4xx/5xx response, or Vercel deployment-protection challenge.

This is not a replacement for the existing local Playwright smoke/visual CI. The existing suite proves the code works against the local CI build and seeded CI database. The new smoke proves the deployed preview/prod URL works against the deployment's real environment variables, preview/prod database shape, Vercel runtime, and deployment protection.

Decision summary:

- Routes: check exactly `/`, `/treaty`, `/plaintiffs`, `/tasks`, `/humanity-v-government`, `/employees`, `/court`, `/people`.
- Trigger: use GitHub Actions `deployment_status`, filtered to successful Vercel app deployments with an HTTP `environment_url`.
- Preview bypass: use Vercel's automation bypass header `x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET`, stored in the GitHub `Preview` environment. Do not use `_vercel_share` for CI smoke.
- Runtime: inline `curl`/small parser in `.github/workflows/ci.yml`, run route requests in parallel, no Playwright browser, no `pnpm install`, no local Node commands.
- Failure routing: preview failures fail a PR/deployment check visible to the PR author and reviewers; production failures fail the main/deployment check visible to Mike/repo maintainers through GitHub Actions notifications and the deployment status.

## Current state ASCII diagram

```text
Pull request opened / pushed
        |
        +----------------------------+
        |                            |
        v                            v
Vercel Git preview deploy     GitHub Actions: CI
        |                            |
        |                            v
        |                     web-validate
        |                     - local build
        |                     - local Playwright smoke
        |                     - local visual review
        |                            |
        |                            v
        |                     sync-preview-managed-data
        |                     - pull Vercel preview env
        |                     - db:deploy
        |                     - db:sync managed data
        |                            |
        v                            v
GitHub deployment status      Resolve PR preview URL step
state=success                 - list deployments for PR SHA
environment_url=preview URL   - find successful status
        |                     - return environment_url
        v
No post-ready preview route smoke


Push to main / workflow_dispatch
        |
        v
GitHub Actions: CI
        |
        v
web-validate
- local build
- local Playwright smoke
        |
        v
deploy-production
- Vercel build
- production db:deploy
- production managed-data sync
- Vercel deploy --prebuilt --prod
        |
        v
No post-ready production route smoke
```

## Proposed state ASCII diagram

```text
Vercel preview or production deployment becomes ready
        |
        v
GitHub receives deployment_status
state=success
environment_url=https://...
        |
        v
GitHub Actions: CI on deployment_status
        |
        v
deploy-smoke job only
- skip full CI jobs for deployment_status
- classify target as Preview or Production
- choose environment secrets
- ignore visual-review deployments
        |
        v
Parallel HTTP checks, same route table:
/, /treaty, /plaintiffs, /tasks,
/humanity-v-government, /employees, /court, /people
        |
        +------------------------------------+
        |                                    |
        v                                    v
Preview target                       Production target
send x-vercel-protection-bypass       no bypass unless prod is protected
from GitHub Preview secret            use deployed production URL
        |                                    |
        v                                    v
Assert per route:                     Assert per route:
- HTTP 200                            - HTTP 200
- no generic error text               - no generic error text
- expected primary h1 present         - expected primary h1 present
        |                                    |
        v                                    v
Fail PR/deployment check              Fail main/production deployment check
for PR author/reviewers               for Mike/repo maintainers
```

## Step list

- [ ] Add `deployment_status` to `.github/workflows/ci.yml` triggers.
- [ ] Adjust top-level `concurrency` so a `deployment_status` run cannot cancel a normal PR/push CI run on the same ref. Use a deployment-specific group for deployment smoke, such as `CI-deploy-smoke-${{ github.event.deployment.id || github.run_id }}`, and keep the current ref-based group for push/PR/workflow_dispatch.
- [ ] Guard existing non-smoke jobs so `core-validate`, `web-validate`, `sync-preview-managed-data`, and `deploy-production` do not run on `deployment_status`. This avoids a deploy-ready event starting a full local build/test/deploy pipeline.
- [ ] Add one `deploy-smoke` job in `ci.yml` gated by:
  - `github.event_name == 'deployment_status'`
  - `github.event.deployment_status.state == 'success'`
  - `github.event.deployment_status.environment_url` starts with `http://` or `https://`
  - deployment/environment name is not `visual-review/*`
  - the URL is either a Vercel app preview URL for this repo/project or the production app URL.
- [ ] Classify the target:
  - Production when the deployment status/deployment environment is `production` or the environment URL is the production domain.
  - Preview otherwise, as long as the environment URL is not the repo's `visual-review` GitHub Pages deployment.
- [ ] Put the job in the matching GitHub environment so it can read the right secrets:
  - Preview: `environment: Preview`, require `VERCEL_AUTOMATION_BYPASS_SECRET`.
  - Production: `environment: Production`, no bypass required unless production protection is enabled later.
- [ ] Implement the route table in the workflow smoke step, not in a broad route discovery pass:
  - `/` -> expected h1: `Please Take 30 Seconds to End War and Disease`
  - `/treaty` -> expected h1: `Please quickly skim and sign to end war and disease.`
  - `/plaintiffs` -> expected h1: `Register plaintiffs for Humanity v Government.`
  - `/tasks` -> expected h1: `Earth Optimization Tasks`
  - `/humanity-v-government` -> expected h1: `Humanity v. Governments of Earth`
  - `/employees` -> expected h1: `President Management System`
  - `/court` -> expected h1: `Court of Humanity`
  - `/people` -> expected h1: `Find the human who should do something.`
- [ ] Before enabling a strict required h1 check, resolve the current semantic gap for `/treaty` and `/court`. Source review shows those routes likely do not currently expose the listed h1s. Preferred implementation choice: add minimal semantic h1 markup in the route/component only if Mike accepts the expanded UI scope; otherwise ask Mike to approve explicit selector exceptions for those two routes before implementation.
- [ ] Use parallel HTTP checks to stay under 30 seconds:
  - one `curl` request per route, launched in the background or through a tiny Python/bash worker pool;
  - `--max-time 5` per route;
  - collect all failures before exiting so one bad route does not hide the others;
  - no browser launch, no Playwright visual suite, no `pnpm install`, no `tsc`, no `vitest`.
- [ ] For preview requests, send the Vercel automation bypass header:
  - `x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET`
  - do not append `_vercel_share` in CI; keep `_vercel_share` for human preview links only.
- [ ] Assert every response:
  - final HTTP status is exactly `200`;
  - response body contains the expected h1 text inside an h1 element after light whitespace normalization;
  - response body does not contain any generic error marker listed below, case-insensitive.
- [ ] Error markers to detect:
  - `Something went wrong`
  - `Something went wrong!`
  - `Application error`
  - `An error occurred`
  - `server-side exception`
  - `client-side exception`
  - `Internal Server Error`
  - `500: INTERNAL_SERVER_ERROR`
  - `This Serverless Function has crashed`
  - `FUNCTION_INVOCATION_FAILED`
  - `EDGE_FUNCTION_INVOCATION_FAILED`
  - `DEPLOYMENT_NOT_FOUND`
  - `PrismaClient`
  - `PrismaClientKnownRequestError`
- [ ] Summarize failures in `$GITHUB_STEP_SUMMARY` with environment, deployment URL, route, status, missing h1, and matched error marker. Do not print bypass secrets or full HTML bodies.
- [ ] Decide whether the smoke job should publish a GitHub deployment status of its own. Default: do not create a second deployment status; the Actions check result is enough and avoids extra deployment-status recursion risk.
- [ ] After implementation, verify with `gh workflow view`/YAML inspection and one real GitHub run. Do not run local Node commands for this plan's authoring task.

## Risks

- Adding `deployment_status` to the existing `CI` workflow without tightening job `if:` guards would accidentally run full CI for every deploy-ready event.
- The current top-level concurrency group is ref-based and cancel-in-progress. If left unchanged, a deploy-smoke run could cancel a normal PR or main CI run on the same ref.
- Vercel/GitHub deployment payloads can vary between Vercel Git previews, GitHub Pages visual-review deployments, and Vercel CLI production deploys. The smoke job must positively require an app deployment URL and exclude `visual-review/*`.
- Strict literal h1 assertions currently conflict with `/treaty` and `/court` source. The plan should not silently weaken the assertion; implementation should either add semantic h1 markup with UI-review implications or get Mike's approval for exceptions.
- `_vercel_share` is convenient for human preview links but awkward for CI because it is per share link and not what Vercel recommends for automation. Use the automation bypass header instead.
- GitHub Actions default notifications may be too quiet for production incidents. This first plan routes through failed production deployment checks only; Slack/email/pager integration is deliberately out of scope until Mike asks for it.
- Parallel curl checks can pass before CDN/global propagation is perfectly settled. If the first real run flakes, add one short retry per route rather than broadening to Playwright.
- Error-marker matching can produce false positives if a page intentionally discusses those phrases. The selected eight campaign routes should not normally contain them.

## Files to touch

- Required: `.github/workflows/ci.yml`
- Not planned for first implementation: `packages/web/e2e/smoke-preview.spec.ts`. A Playwright spec would reuse local test patterns, but it pulls the work toward `pnpm install`/Playwright setup and works against the under-30-second deploy-smoke goal.
- Conditional only if Mike requires literal h1 on every listed route: `packages/web/src/app/treaty/page.tsx` and `packages/web/src/components/referendum/ReferendumStepper.tsx`, because current source review suggests `/treaty` and `/court` need semantic h1 changes.

## ALERTS

## Agent log

## Codex critique (round 1)

### 1. Trigger choice: `deployment_status` is plausible, but the production path is not proven enough.

The plan should choose `deployment_status` for previews, but the justification needs to be sharper. GitHub's Actions docs say `deployment_status` runs when a deployment status is provided and does not run for `inactive` statuses: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#deployment_status. GitHub's deployment status API also makes the exact signal explicit: `state` can be `success`, and the status can carry `environment`, `environment_url`, `target_url`, and `log_url`: https://docs.github.com/en/rest/deployments/statuses?apiVersion=2022-11-28#create-a-deployment-status.

For previews, this matches the repo's existing pattern. The current "Resolve PR preview URL" step in `.github/workflows/ci.yml` lists deployments for the PR head SHA, skips `visual-review/*`, then accepts the first deployment status with `state === "success"` and an HTTP `environment_url`. That is already a local proof that Vercel preview deploys are expected to surface as GitHub deployment statuses.

The production claim is weaker. Production is not a Vercel Git deploy here: `packages/web/vercel.json` disables Git deployment for `main`, and `.github/workflows/ci.yml` deploys production with `vercel deploy --prebuilt --prod` inside the `deploy-production` GitHub Actions job. The plan needs to say production smoke is triggered by GitHub Actions environment deployment statuses, not by Vercel's GitHub integration. GitHub's deployment docs say a job that references an environment creates deployment/status objects and fills `environment_url` when specified: https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments#tracking-deployments-through-apps. That should fire a `deployment_status` run after `deploy-production` succeeds, but it needs to be verified in one real `main` run because the `environment.url` comes from `steps.deploy.outputs.deployment_url`.

`workflow_run` is the wrong default for this job. GitHub documents `workflow_run` as using the default-branch SHA/ref, requiring the workflow file on the default branch, and having a three-level chaining limit: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run. It also cannot observe Vercel preview deploy readiness because those preview deploys are not a GitHub Actions workflow run. Polling from `web-validate` is also worse for previews because it couples remote deploy timing to local CI timing; the current preview URL resolver already has to tolerate "not ready yet" by returning an empty string.

Blocker: the planned smoke job says it will use the `Preview`/`Production` GitHub environment to read secrets. If the job does that with the default environment behavior, it creates another GitHub deployment/status and can recursively trigger the same `deployment_status` workflow. The plan must set `environment.deployment: false` for smoke jobs, or split into two smoke jobs that each use `environment: { name: Preview|Production, deployment: false }`. GitHub documents `deployment: false` specifically for accessing environment secrets without creating deployment records: https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments#using-environments-without-deployments.

### 2. Preview bypass token handling needs an exact injection contract.

The plan is right not to reuse `_vercel_share`, but it should say that the current CI does not create or pass `_vercel_share` at all. The existing PR-preview URL step only returns a GitHub deployment status `environment_url`; `rg` found no `_vercel_share`, `VERCEL_AUTOMATION_BYPASS_SECRET`, or `x-vercel-protection-bypass` usage in the repo today.

Use a separate GitHub `Preview` environment secret named exactly `VERCEL_AUTOMATION_BYPASS_SECRET`, then inject it into the smoke step explicitly:

```yaml
env:
  VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
```

Preview requests should send:

```text
x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET
```

Vercel's current docs recommend that header for automation and say the query parameter has the same name only for tools that cannot set headers: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation. The Vercel system env var of the same name exists inside deployments; CI still needs the secret stored in GitHub because CI is the client making protected preview requests.

### 3. The generic-error marker list is still incomplete and should be owned by the smoke script.

Local audit: `packages/web/src/app/global-error.tsx` is the only app-level error boundary file found, and it renders `Something went wrong!` plus a `Try again` button. No segment `error.tsx` files were found under `packages/web/src/app`. `packages/web/src/app/not-found.tsx` renders `404` and `Page Not Found`; status assertions should catch ordinary 404s, but the body marker is still useful if a route rewrites to the not-found UI with a 200.

The plan's list should include every marker it intends to own, not "examples." At minimum:

- `Something went wrong`
- `Something went wrong!`
- `Something went wrong. Please try again.`
- `Application error`
- `Application error: a client-side exception has occurred`
- `Application error: a server-side exception has occurred`
- `client-side exception`
- `server-side exception`
- `An error occurred`
- `An error occurred in the Server Components render`
- `Internal Server Error`
- `500: INTERNAL_SERVER_ERROR`
- `Unhandled Runtime Error`
- `Runtime Error`
- `Minified React error #`
- `Hydration failed because the server rendered HTML didn't match the client`
- `There was an error while hydrating`
- `A tree hydrated but some attributes of the server rendered HTML didn't match`
- `Switched to client rendering because the server rendering errored`
- `404: This page could not be found`
- `Page Not Found`
- `This Serverless Function has crashed`
- `FUNCTION_INVOCATION_FAILED`
- `EDGE_FUNCTION_INVOCATION_FAILED`
- `MIDDLEWARE_INVOCATION_FAILED`
- `NO_RESPONSE_FROM_FUNCTION`
- `DEPLOYMENT_NOT_FOUND`
- `This deployment is protected`
- `Vercel Authentication`
- `Authentication Required`
- `PrismaClient`
- `PrismaClientKnownRequestError`

Do not use bare `Try again` as a failure marker; it is too generic and already appears in legitimate UI text. Also be honest about the limitation: an HTTP smoke test can catch server-rendered error pages and protection challenges, but it cannot prove post-hydration client JavaScript did not throw unless it runs a browser. That is acceptable for this narrow remote smoke, but the plan should not imply curl/fetch catches all client exceptions.

### 4. The 30-second budget is only realistic if "loaded" means HTTP response fetched.

The existing Playwright route-walking pattern in `packages/web/e2e/contrast-audit.spec.ts` uses `PUBLIC_PAGE_PATHS`, `AUTH_REQUIRED_PATHS`, route filtering, and `navigateAndSettle()`. That helper waits for `domcontentloaded`, then adds a 2 second hydration wait for ordinary pages and a much longer path for demos. Eight routes with browser navigation, hydration waits, and cold Vercel functions will not reliably fit under 30 seconds.

If this is a no-Playwright smoke, define "loaded" as: final response status is 200, the response body is fully read, the final URL stayed on the intended deployment host, the expected route marker is present, and no error marker matched. Do not use `networkidle` or `DOMContentLoaded`; those are browser concepts. The route checks should run in parallel with a per-request timeout and an overall job timeout.

The route table can stay hand-picked because the TODO asks for eight critical public routes. But the plan should explicitly say it is not reusing the full dynamic route-walking inventory from `contrast-audit`; it is borrowing the idea of a central route list and intentionally narrowing it to the campaign smoke set.

### 5. Failure routing is too hand-wavy.

Preview failure routing should be explicit: fail the `deploy-smoke-preview` check on the PR head SHA, write the failed routes/statuses/markers to `$GITHUB_STEP_SUMMARY`, and do not add Slack/email for v1. Decide whether to update the existing PR preview-links comment only on failure; otherwise repeated deployment comments will become noise.

Production failure routing should be a separate explicit decision. "GitHub Actions notifications" may be enough for v1, but if this smoke is meant to catch live `warondisease.org` breakage, the plan should either add a real channel with a named secret such as Slack webhook/email provider, or state "no Slack/email in v1; production failures are surfaced only as failed GitHub Actions/environment deployment checks." Leaving it implicit is not acceptable for a production smoke.

The plan also needs to say whether these smoke checks become required branch protection checks. A non-required post-deploy preview check can fail after local CI is green and still be ignored.

### 6. The warm-cache race should be designed in, not added after flake.

Vercel "ready" means the deployment is available, not that every route's serverless function, CDN edge path, DB connection, and managed data read are warm. The first request to `/people`, `/tasks`, or `/plaintiffs` can be slower than a static page. The plan currently says "if the first real run flakes, add one short retry"; that is too reactive.

Bake in retries now: for each route, allow at least two attempts with a short backoff, keep the per-attempt timeout bounded, and report only the final failed route plus prior attempt metadata. Run routes in parallel so two attempts still fit the 30 second target when the deployment is healthy. If the first attempt returns a Vercel protection page, retrying will not fix a missing bypass token; report that marker distinctly from a timeout.

### 7. Do not use Playwright here; prefer a tiny fetch script over shell curl.

The plan correctly avoids Playwright for a string/status smoke. It should still weigh `curl` against a small JS script. `curl` is cheap, but robust parallelism, retries, HTML entity normalization, route tables, failure aggregation, secret-safe summaries, and final URL checks are easier to keep correct in a tiny script using Node's built-in `fetch` than in inline bash.

Preferred shape: no `pnpm install`, no Playwright, no app checkout dependency beyond the workflow file or a small `.github/scripts/deploy-smoke.mjs`. Use the runner's Node/global `fetch` or `actions/github-script`, not `node-fetch` as an installed package. If the implementation stays inline in `ci.yml`, the plan should justify that choice against maintainability.

## Codex critique summary

Top 3 changes the plan needs before implementation:

1. Prove and harden the trigger path: use `deployment_status`, document the preview and production mechanisms separately, and set `environment.deployment: false` on smoke jobs to avoid recursive deployment-status runs.
2. Make preview access exact: use a GitHub `Preview` environment secret named `VERCEL_AUTOMATION_BYPASS_SECRET`, inject it into the smoke step, send `x-vercel-protection-bypass`, and do not mention `_vercel_share` as a reusable CI token because this repo does not have one.
3. Define the smoke as a no-browser HTTP check: prefer a tiny fetch script, define "loaded" as response body fetched rather than DOM/network idle, add built-in retries for cold starts, enumerate the full owned error-marker list, and specify preview vs production failure routing.

## Mike approved (round 2)

Mike adopted the critique's recommendations wholesale. Approved scope:

1. Fetch-script implementation, not Playwright. Tiny Node script with `fetch()` against the route list. Asserts HTTP 200 + body lacks the owned error markers + expected `<h1>` selector present. Under 30 seconds total. No browser.
2. Trigger via `deployment_status` events. Set `environment.deployment: false` on the smoke jobs themselves to prevent recursive runs.
3. Preview access uses a GitHub `Preview` environment secret named `VERCEL_AUTOMATION_BYPASS_SECRET`. Send the header `x-vercel-protection-bypass: ${secret}`. Drop any reference to `_vercel_share` because we do not have that token configured.
4. Built-in cold-start retries (up to 3 attempts with 5s backoff per route). Loaded = response body fully fetched. Enumerate the full error-marker list including `"Something went wrong"`, `"Application error"`, `"An error occurred"`, and any other strings emitted by `error.tsx` files.
5. Failure routing: PR comment on preview failures (visible to author). Slack webhook for production failures (separate channel). Both via existing GitHub Actions integrations.

Routes to smoke per the plan: `/`, `/treaty`, `/plaintiffs`, `/tasks`, `/humanity-v-government`, `/employees`, `/court`, `/people`.

Implementation lives at `packages/web/scripts/smoke-deploy.mjs` (Node script, no Playwright deps) + a new GitHub Actions workflow `.github/workflows/smoke-deploy.yml` that fires on `deployment_status: success` for both preview and production environments.

NOT in scope: client-side hydration error detection (would require a real browser; defer until we have a specific bug class this would catch).
