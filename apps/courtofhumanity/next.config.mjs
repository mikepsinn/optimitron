import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";
import { pinAppNextAuthInstance } from "../shared-next-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SITE_VARIANT: "courtofhumanity.org",
  },
  transpilePackages: [
    "@optimitron/neobrutalist-ui",
    "@optimitron/impact-params",
    "@optimitron/site-kit",
  ],
  outputFileTracingRoot: monorepoRoot,
  webpack(config) {
    return pinAppNextAuthInstance(config, __dirname);
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/auth/signup", destination: "/auth/signin", permanent: false },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "wishonia-org",
  project: "dih",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
