#!/usr/bin/env node
/**
 * Ensures packages/web/.env points to the root .env file.
 *
 * Strategy (in order of preference):
 *   1. If root .env doesn't exist → nothing to do
 *   2. If web .env already symlinks to root → nothing to do
 *   3. Try creating a symlink (works on Unix, needs dev mode on Windows)
 *   4. Fall back to copying the file (always works)
 *
 * Hard links are intentionally skipped — they silently share inodes,
 * so deleting/recreating the root .env can corrupt the web copy.
 */
const fs = require("fs");
const path = require("path");

const webEnv = path.resolve(__dirname, "..", ".env");
const rootEnv = path.resolve(__dirname, "..", "..", "..", ".env");

// No root .env → nothing to do
if (!fs.existsSync(rootEnv)) {
  process.exit(0);
}

// Already a correct symlink → nothing to do
if (fs.existsSync(webEnv)) {
  try {
    const stat = fs.lstatSync(webEnv);
    if (stat.isSymbolicLink()) {
      const target = path.resolve(path.dirname(webEnv), fs.readlinkSync(webEnv));
      if (target === rootEnv) {
        process.exit(0);
      }
    }
  } catch {
    // lstat/readlink failed — remove and recreate below
  }

  // Exists but wrong target or not a symlink — remove it
  fs.rmSync(webEnv, { force: true });
}

// Try symlink first
try {
  fs.symlinkSync(rootEnv, webEnv, "file");
  process.exit(0);
} catch {
  // Symlinks may require elevated privileges on Windows
}

// Fall back to copy
fs.copyFileSync(rootEnv, webEnv);
