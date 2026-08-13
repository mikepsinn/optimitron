import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";
import { pinAppNextAuthInstance } from "../shared-next-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SITE_VARIANT: "dfda",
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
  async headers() {
    return [
      {
        source: "/survey/:slug*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/campaigns", destination: "/", permanent: false },
      { source: "/campaigns/:path*", destination: "/", permanent: false },
      { source: "/auth/signup", destination: "/auth/signin", permanent: false },
      {
        source: "/knowledge/:path*",
        destination: "https://manual.warondisease.org/knowledge/:path*",
        permanent: true,
      },
      { source: "/join-us", destination: "/", permanent: false },
      {
        source: "/stupid-questions",
        destination:
          "https://docs.google.com/document/d/1zQpLG2bFeYLGN-9K-VwJewdw0vG_MwpuLP6Lq81W4_0/edit",
        permanent: false,
      },
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
