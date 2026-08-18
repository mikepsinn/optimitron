#!/usr/bin/env node
/**
 * Fails fast when required committed repo content is missing.
 *
 * This keeps product contracts explicit instead of relying on route-generation
 * crashes later inside Next.js.
 */
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..", "..");

const REQUIRED_CONTENT_DIRS = [
  {
    relativeDir: "content/legislation",
    requiredExtension: ".md",
    description: "committed legislation drafts",
  },
];

for (const requirement of REQUIRED_CONTENT_DIRS) {
  const fullDir = path.join(repoRoot, requirement.relativeDir);

  if (!fs.existsSync(fullDir)) {
    fail(
      `Missing required repo content directory: ${requirement.relativeDir} (${requirement.description}).`,
    );
  }

  const entries = fs
    .readdirSync(fullDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(requirement.requiredExtension));

  if (entries.length === 0) {
    fail(
      `Required repo content directory is empty: ${requirement.relativeDir}. Expected at least one ${requirement.requiredExtension} file.`,
    );
  }
}

function fail(message) {
  console.error(`[validate:content] ${message}`);
  process.exit(1);
}
