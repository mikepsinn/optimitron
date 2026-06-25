#!/usr/bin/env node

import { appendFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const DEFAULT_ORG = "wishonia-org";
const DEFAULT_PROJECT = "optimitron-web";
const DEFAULT_ENVIRONMENT = "vercel-preview";
const DEFAULT_LOOKBACK_MINUTES = 30;
const DEFAULT_LIMIT = 50;

export async function auditSentryPreview(options) {
  const {
    apiBaseUrl = "https://sentry.io",
    authToken,
    environment = DEFAULT_ENVIRONMENT,
    fetchImpl = fetch,
    issueLimit = DEFAULT_LIMIT,
    lookbackMinutes = DEFAULT_LOOKBACK_MINUTES,
    org = DEFAULT_ORG,
    previewUrl,
    release,
    now = new Date(),
    project = DEFAULT_PROJECT,
  } = options;

  if (!authToken) {
    throw new Error("SENTRY_AUTH_TOKEN is required for preview Sentry audit.");
  }

  if (!previewUrl) {
    throw new Error("PREVIEW_URL is required for preview Sentry audit.");
  }

  const preview = new URL(previewUrl);
  const since = new Date(now.getTime() - lookbackMinutes * 60 * 1000);
  const issues = await listIssues({
    apiBaseUrl,
    authToken,
    environment,
    fetchImpl,
    issueLimit,
    lookbackMinutes,
    org,
    project,
  });
  const findings = [];

  for (const issue of issues) {
    const events = await listIssueEvents({
      apiBaseUrl,
      authToken,
      environment,
      fetchImpl,
      issueId: issue.id,
      lookbackMinutes,
      org,
    });
    const matchingEvents = events
      .filter((event) =>
        eventMatchesDeployment(event, {
          environment,
          previewHostname: preview.hostname,
          release,
          since,
        }),
      )
      .sort(
        (a, b) =>
          Date.parse(b.dateReceived ?? b.timestamp ?? "") -
          Date.parse(a.dateReceived ?? a.timestamp ?? ""),
      );

    for (const event of matchingEvents) {
      findings.push({
        eventId: event.eventID ?? event.id,
        eventUrl: buildEventUrl(org, issue.id, event.eventID ?? event.id),
        issueId: issue.id,
        issueShortId: issue.shortId,
        issueTitle: issue.title,
        issueUrl: issue.permalink,
        lastSeen: event.timestamp ?? event.dateReceived ?? issue.lastSeen,
        release: getEventRelease(event) ?? issue.lastRelease?.version ?? "",
        transaction: event.transaction ?? event.culprit ?? "",
        url: getEventUrl(event),
      });
    }
  }

  return {
    environment,
    findings,
    issueCount: issues.length,
    lookbackMinutes,
    org,
    previewUrl,
    project,
    release: release ?? "",
    since: since.toISOString(),
    success: findings.length === 0,
  };
}

export function eventMatchesDeployment(
  event,
  { environment, previewHostname, release, since },
) {
  if (!event || !isRecentEvent(event, since)) {
    return false;
  }

  const eventEnvironment = event.environment ?? getTagValue(event, "environment");
  if (eventEnvironment && eventEnvironment !== environment) {
    return false;
  }

  const eventRelease = getEventRelease(event);
  if (release && eventRelease === release) {
    return true;
  }

  const eventUrl = getEventUrl(event);
  if (!eventUrl) {
    return false;
  }

  try {
    return new URL(eventUrl).hostname === previewHostname;
  } catch {
    return eventUrl.includes(previewHostname);
  }
}

export function buildMarkdownReport(report) {
  const lines = [
    "<!-- sentry-preview-audit -->",
    "### Sentry preview errors detected",
    "",
    `Preview: ${report.previewUrl}`,
    `Environment: \`${report.environment}\``,
    `Release: \`${report.release || "not provided"}\``,
    `Lookback: ${report.lookbackMinutes} minutes`,
    "",
  ];

  if (report.findings.length === 0) {
    lines.push("No matching Sentry errors were found for this preview.");
    return `${lines.join("\n")}\n`;
  }

  lines.push(
    "| Issue | Last event | Route / transaction | Release | Event |",
    "| --- | --- | --- | --- | --- |",
  );

  for (const finding of report.findings.slice(0, 10)) {
    lines.push(
      `| [${escapeCell(finding.issueShortId ?? finding.issueId)}](${finding.issueUrl}) ${escapeCell(
        truncate(finding.issueTitle, 90),
      )} | ${escapeCell(finding.lastSeen)} | ${escapeCell(
        truncate(finding.url || finding.transaction || "n/a", 120),
      )} | ${escapeCell(finding.release || "n/a")} | [event](${finding.eventUrl}) |`,
    );
  }

  if (report.findings.length > 10) {
    lines.push(
      `| ... | ${report.findings.length - 10} more matching event(s) | ... | ... | ... |`,
    );
  }

  lines.push(
    "",
    "This check runs after the live Vercel preview smoke test and only matches recent `vercel-preview` events for this deployment release or preview host.",
  );

  return `${lines.join("\n")}\n`;
}

export function buildStepSummary(report) {
  const status = report.success ? "passed" : "failed";
  const lines = [
    "## Sentry Preview Audit",
    "",
    `- Result: ${status}`,
    `- Preview: ${report.previewUrl}`,
    `- Environment: ${report.environment}`,
    `- Release: ${report.release || "not provided"}`,
    `- Lookback: ${report.lookbackMinutes} minutes`,
    `- Matching error events: ${report.findings.length}`,
    "",
  ];

  if (report.findings.length > 0) {
    lines.push(buildMarkdownReport(report));
  }

  return `${lines.join("\n")}\n`;
}

export function buildAuditFailureMarkdown(error) {
  return [
    "<!-- sentry-preview-audit -->",
    "### Sentry preview audit failed",
    "",
    "The preview smoke test ran, but the Sentry audit could not query issues.",
    "",
    `Error: \`${truncate(error?.message ?? error, 500)}\``,
    "",
    "Check that the GitHub secret used by this job has Sentry `org:read`, `project:read`, and `event:read` scopes.",
  ].join("\n");
}

async function listIssues(input) {
  const params = new URLSearchParams({
    environment: input.environment,
    limit: String(input.issueLimit),
    query: "is:unresolved",
    sort: "date",
    statsPeriod: sentryStatsPeriod(input.lookbackMinutes),
  });
  const url = `${input.apiBaseUrl}/api/0/projects/${encodeURIComponent(
    input.org,
  )}/${encodeURIComponent(input.project)}/issues/?${params}`;
  const json = await sentryGet(url, input);
  return Array.isArray(json) ? json : json.data ?? [];
}

async function listIssueEvents(input) {
  const params = new URLSearchParams({
    environment: input.environment,
    per_page: "10",
    statsPeriod: sentryStatsPeriod(input.lookbackMinutes),
  });
  const url = `${input.apiBaseUrl}/api/0/organizations/${encodeURIComponent(
    input.org,
  )}/issues/${encodeURIComponent(input.issueId)}/events/?${params}`;
  const json = await sentryGet(url, input);
  return Array.isArray(json) ? json : json.data ?? [];
}

async function sentryGet(url, { authToken, fetchImpl }) {
  const response = await fetchImpl(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Sentry API returned HTTP ${response.status} for ${url}: ${truncate(
        body,
        500,
      )}`,
    );
  }

  return response.json();
}

function isRecentEvent(event, since) {
  const timestamp = event.timestamp ?? event.dateReceived;
  if (!timestamp) {
    return false;
  }

  return Date.parse(timestamp) >= since.getTime();
}

function getEventRelease(event) {
  if (typeof event.release === "string") {
    return event.release;
  }

  return event.release?.version ?? getTagValue(event, "release") ?? "";
}

function getEventUrl(event) {
  return (
    getTagValue(event, "url") ??
    event.request?.url ??
    event.contexts?.page?.url ??
    event.contexts?.trace?.data?.url ??
    ""
  );
}

function getTagValue(event, key) {
  const tags = event.tags ?? [];
  for (const tag of tags) {
    if (Array.isArray(tag) && tag[0] === key) {
      return tag[1];
    }
    if (tag?.key === key) {
      return tag.value;
    }
  }
  return "";
}

function buildEventUrl(org, issueId, eventId) {
  if (!eventId) {
    return `https://${org}.sentry.io/issues/${issueId}/`;
  }

  return `https://${org}.sentry.io/issues/${issueId}/events/${eventId}/`;
}

function truncate(value, maxLength) {
  const text = String(value ?? "").replace(/\s+/gu, " ").trim();
  return text.length > maxLength
    ? `${text.slice(0, Math.max(0, maxLength - 1))}...`
    : text;
}

function escapeCell(value) {
  return String(value ?? "")
    .replace(/\r?\n/gu, " ")
    .replace(/\|/gu, "\\|");
}

async function main() {
  const initialDelayMs = Math.max(
    0,
    numberFromEnv("SENTRY_AUDIT_INITIAL_DELAY_MS", 0),
  );
  const pollAttempts = Math.max(
    1,
    Math.trunc(numberFromEnv("SENTRY_AUDIT_POLL_ATTEMPTS", 1)),
  );
  const pollIntervalMs = Math.max(
    0,
    numberFromEnv("SENTRY_AUDIT_POLL_INTERVAL_MS", 0),
  );
  let report;

  if (initialDelayMs > 0) {
    await sleep(initialDelayMs);
  }

  for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
    report = await auditSentryPreview({
      apiBaseUrl: process.env.SENTRY_BASE_URL || "https://sentry.io",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      environment: process.env.SENTRY_ENVIRONMENT || DEFAULT_ENVIRONMENT,
      issueLimit: numberFromEnv("SENTRY_AUDIT_ISSUE_LIMIT", DEFAULT_LIMIT),
      lookbackMinutes: numberFromEnv(
        "SENTRY_AUDIT_LOOKBACK_MINUTES",
        DEFAULT_LOOKBACK_MINUTES,
      ),
      org: process.env.SENTRY_ORG || DEFAULT_ORG,
      previewUrl: process.env.PREVIEW_URL,
      project: process.env.SENTRY_PROJECT || DEFAULT_PROJECT,
      release: process.env.SENTRY_RELEASE || "",
    });

    if (!report.success || attempt === pollAttempts) {
      break;
    }

    await sleep(pollIntervalMs);
  }

  const reportFile = process.env.SENTRY_AUDIT_REPORT_FILE;
  if (reportFile) {
    await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  const markdown = buildMarkdownReport(report);
  const markdownFile = process.env.SENTRY_AUDIT_MARKDOWN_FILE;
  if (markdownFile) {
    await writeFile(markdownFile, markdown, "utf8");
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, buildStepSummary(report));
  }

  console.log(
    `Sentry preview audit ${report.success ? "passed" : "failed"}: ${
      report.findings.length
    } matching event(s).`,
  );

  if (!report.success) {
    process.exitCode = 1;
  }
}

function numberFromEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function sentryStatsPeriod(lookbackMinutes) {
  return lookbackMinutes > 24 * 60 ? "14d" : "24h";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    console.error(error);
    const markdown = `${buildAuditFailureMarkdown(error)}\n`;
    const markdownFile = process.env.SENTRY_AUDIT_MARKDOWN_FILE;
    if (markdownFile) {
      await writeFile(markdownFile, markdown, "utf8");
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown, "utf8");
    }
    // Exit 2 means the audit itself could not query Sentry. The workflow
    // comments this as an observability/config problem without failing the
    // app smoke check. Exit 1 is reserved for real matching preview errors.
    process.exitCode = 2;
  });
}
