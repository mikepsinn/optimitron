import assert from "node:assert/strict";
import test from "node:test";

import {
  auditSentryPreview,
  buildAuditFailureMarkdown,
  buildMarkdownReport,
  eventMatchesDeployment,
} from "./audit-sentry-preview.mjs";

test("matches recent events by release or preview host", () => {
  const since = new Date("2026-05-17T20:00:00.000Z");
  const deployment = {
    environment: "vercel-preview",
    previewHostname: "preview.example.vercel.app",
    release: "abc123",
    since,
  };

  assert.equal(
    eventMatchesDeployment(
      {
        environment: "vercel-preview",
        release: "abc123",
        timestamp: "2026-05-17T20:05:00.000Z",
      },
      deployment,
    ),
    true,
  );
  assert.equal(
    eventMatchesDeployment(
      {
        environment: "vercel-preview",
        tags: [
          { key: "url", value: "https://preview.example.vercel.app/dashboard" },
        ],
        timestamp: "2026-05-17T20:05:00.000Z",
      },
      deployment,
    ),
    true,
  );
  assert.equal(
    eventMatchesDeployment(
      {
        environment: "vercel-preview",
        release: "older",
        tags: [{ key: "url", value: "https://other.example.vercel.app/" }],
        timestamp: "2026-05-17T19:59:59.000Z",
      },
      deployment,
    ),
    false,
  );
});

test("audits Sentry issues and returns matching preview findings", async () => {
  const fetchCalls = [];
  const fetchImpl = async (url) => {
    fetchCalls.push(String(url));
    if (String(url).includes("/issues/?")) {
      return jsonResponse([
        {
          id: "7487535527",
          permalink: "https://wishonia-org.sentry.io/issues/7487535527/",
          shortId: "OPTIMITRON-WEB-7X",
          title: "PrismaClientKnownRequestError",
        },
      ]);
    }

    return jsonResponse([
      {
        eventID: "event-1",
        environment: "vercel-preview",
        release: { version: "abc123" },
        tags: [
          { key: "url", value: "https://preview.example.vercel.app/dashboard" },
        ],
        timestamp: "2026-05-17T20:05:00.000Z",
        transaction: "/dashboard",
      },
    ]);
  };

  const report = await auditSentryPreview({
    authToken: "test-token",
    fetchImpl,
    lookbackMinutes: 30,
    now: new Date("2026-05-17T20:10:00.000Z"),
    previewUrl: "https://preview.example.vercel.app",
    release: "abc123",
  });

  assert.equal(report.success, false);
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0].issueShortId, "OPTIMITRON-WEB-7X");
  assert.equal(fetchCalls.length, 2);
});

test("renders a compact PR comment body", () => {
  const markdown = buildMarkdownReport({
    environment: "vercel-preview",
    findings: [
      {
        eventUrl:
          "https://wishonia-org.sentry.io/issues/7487535527/events/event-1/",
        issueId: "7487535527",
        issueShortId: "OPTIMITRON-WEB-7X",
        issueTitle: "PrismaClientKnownRequestError",
        issueUrl: "https://wishonia-org.sentry.io/issues/7487535527/",
        lastSeen: "2026-05-17T20:05:00.000Z",
        release: "abc123",
        url: "https://preview.example.vercel.app/dashboard",
      },
    ],
    lookbackMinutes: 30,
    previewUrl: "https://preview.example.vercel.app",
    release: "abc123",
  });

  assert.match(markdown, /<!-- sentry-preview-audit -->/);
  assert.match(markdown, /OPTIMITRON-WEB-7X/);
  assert.match(markdown, /preview\.example\.vercel\.app\/dashboard/);
});

test("renders Sentry permission failures without tokens", () => {
  const markdown = buildAuditFailureMarkdown(
    new Error("Sentry API returned HTTP 403: permission denied"),
  );

  assert.match(markdown, /Sentry preview audit failed/);
  assert.match(markdown, /event:read/);
  assert.doesNotMatch(markdown, /Bearer/);
});

function jsonResponse(value) {
  return {
    json: async () => value,
    ok: true,
  };
}
