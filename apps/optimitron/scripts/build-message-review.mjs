#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const webRoot = process.cwd();
const catalogPath = path.resolve(
  webRoot,
  "src",
  "messages",
  "en-US",
  "war-on-disease.json",
);
const outputRoot = path.resolve(webRoot, "output", "messages", "review");
const latestHtmlPath = path.join(outputRoot, "latest.html");

main();

function main() {
  if (!existsSync(catalogPath)) {
    throw new Error(`Message catalog not found: ${catalogPath}`);
  }

  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  const entries = flattenStrings(catalog);

  mkdirSync(outputRoot, { recursive: true });
  writeFileSync(latestHtmlPath, renderHtml(entries), "utf8");

  console.log(`[message-review] wrote ${latestHtmlPath}`);
  console.log(`[message-review] strings=${entries.length}`);
}

function flattenStrings(value, pathParts = []) {
  if (typeof value === "string") {
    return [
      {
        path: pathParts.join("."),
        value,
      },
    ];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      flattenStrings(item, [...pathParts, String(index)]),
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) =>
      flattenStrings(nestedValue, [...pathParts, key]),
    );
  }

  return [];
}

function renderHtml(entries) {
  const generatedAt = new Date().toISOString();
  const rows = entries.map(renderRow).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>War on Disease Message Review</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #ffffff;
      --fg: #000000;
      --muted: #555555;
      --line: #000000;
      --code-bg: #f4f4f4;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--fg);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }

    header {
      position: sticky;
      top: 0;
      z-index: 1;
      border-bottom: 1px solid var(--line);
      background: var(--bg);
      padding: 16px 24px;
    }

    h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: 0;
    }

    .meta {
      margin-top: 4px;
      color: var(--muted);
      font-size: 13px;
    }

    main {
      padding: 24px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    th,
    td {
      border: 1px solid var(--line);
      padding: 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      font-size: 13px;
      text-transform: uppercase;
    }

    td:first-child {
      width: 34%;
      overflow-wrap: anywhere;
    }

    code {
      background: var(--code-bg);
      font-family: Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      padding: 2px 4px;
    }

    .message {
      white-space: pre-wrap;
    }

    .placeholder {
      font-family: Consolas, "Liberation Mono", monospace;
      font-size: 0.95em;
      font-weight: 700;
    }

    @media (max-width: 780px) {
      thead {
        display: none;
      }

      table,
      tbody,
      tr,
      td {
        display: block;
        width: 100%;
      }

      tr + tr {
        border-top: 2px solid var(--line);
      }

      td {
        border-top: 0;
      }

      td:first-child {
        width: 100%;
        border-top: 1px solid var(--line);
      }

      td::before {
        display: block;
        margin-bottom: 4px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }

      td:first-child::before {
        content: "Key";
      }

      td:nth-child(2)::before {
        content: "Message";
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>War on Disease Message Review</h1>
    <div class="meta">${entries.length} strings from <code>src/messages/en-US/war-on-disease.json</code>. Generated ${escapeHtml(generatedAt)}.</div>
  </header>
  <main>
    <table>
      <thead>
        <tr>
          <th>Key</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </main>
</body>
</html>`;
}

function renderRow(entry) {
  return `        <tr>
          <td><code>${escapeHtml(entry.path)}</code></td>
          <td class="message">${formatMessage(entry.value)}</td>
        </tr>`;
}

function formatMessage(value) {
  return escapeHtml(value).replace(
    /\{([A-Za-z0-9_]+)\}/g,
    '<span class="placeholder">{$1}</span>',
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
