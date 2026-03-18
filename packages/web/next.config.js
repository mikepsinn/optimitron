const path = require("node:path");
const { loadEnvConfig } = require("@next/env");

// Load repo-root env first so the monorepo can share one .env/.env.example.
loadEnvConfig(path.resolve(__dirname, "../.."));
// Allow package-local env files to override when needed.
loadEnvConfig(__dirname);

/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_OUTPUT_EXPORT === 'true';

const nextConfig = {
  output: isStaticExport ? 'export' : undefined,
  basePath: isStaticExport ? '/optimitron' : '',
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  images: {
    unoptimized: true,
  },
  eslint: {
    // Skip ESLint during builds — run separately via `pnpm lint`
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is done via `pnpm typecheck`
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
