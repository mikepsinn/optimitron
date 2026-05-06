const path = require("node:path");
const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
const { REDIRECTS } = require("./src/lib/redirects");

/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_OUTPUT_EXPORT === "true";

const nextConfig = {
  experimental: {
    webpackMemoryOptimizations: true,
    // `import { Foo } from "lucide-react"` defeats tree-shaking under Next.js
    // App Router unless the package is in this allow-list. With 83 files
    // importing icons + 44MB of lucide source on disk, this is the single
    // biggest "free" client-bundle win.
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "@radix-ui/react-icons",
    ],
  },
  transpilePackages: ["@optimitron/data"],
  serverExternalPackages: ["@storacha/client", "multiformats", "pinata"],
  // Next.js matches dev origins against the request hostname, not a full URL.
  allowedDevOrigins: ["warondisease.local"],
  output: isStaticExport ? "export" : undefined,
  basePath: isStaticExport ? "/optimitron" : "",
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  images: {
    unoptimized: true,
  },
  eslint: {
    // Skip ESLint during builds — run separately via `pnpm lint`
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // wagmi/connectors re-exports optional wallet connectors whose peer
    // packages are intentionally not installed. WalletConnect and injected
    // wallets are the only connectors configured in this app.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@base-org/account": false,
      "@coinbase/wallet-sdk": false,
      "@metamask/connect-evm": false,
      "@safe-global/safe-apps-provider": false,
      "@safe-global/safe-apps-sdk": false,
      porto: false,
      "porto/internal": false,
    };

    // MetaMask SDK bundles React Native code that references this package.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
    };

    // @storacha/client needs multiformats@13 (exports ./link), but
    // @atproto/* hoists multiformats@9 (doesn't). unshift so our function
    // runs BEFORE Next.js's handleExternals decides to bundle these.
    if (isServer) {
      config.externals.unshift(({ request }, callback) => {
        if (
          /^@optimitron\/storage(\/|$)/.test(request) ||
          /^@storacha\//.test(request) ||
          /^pinata(\/|$)/.test(request) ||
          /^multiformats(\/|$)/.test(request)
        ) {
          return callback(null, "node-commonjs " + request);
        }
        callback();
      });
    }

    // @optimitron/data barrel re-exports csv-loader which uses node:fs/path/url.
    // These are server-only but webpack tries to bundle them for the client.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        url: false,
      };

      // Rewrite "node:*" scheme imports to bare specifiers so they hit the
      // fallback stubs above. Webpack 5 doesn't handle the node: scheme natively.
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });

      // NormalModuleReplacementPlugin rewrites node:X → X at resolve time
      const webpack = require("webpack");
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
    }

    return config;
  },
  async redirects() {
    if (isStaticExport) return [];
    return REDIRECTS;
  },
};

const isDev = process.env.NODE_ENV === "development";
module.exports = isDev
  ? nextConfig
  : withBundleAnalyzer(
      withSentryConfig(nextConfig, {
        org: "wishonia-org",
        project: "optimitron-web",
        silent: !process.env.CI,
        // widenClientFileUpload was OOMing CI: Sentry's post-build pass injects
        // debug IDs into every widened client bundle in memory, and at ~800
        // files we crossed the 6GB heap ceiling. Standard upload (server +
        // server-side-rendered chunks) is enough to symbolicate the errors we
        // actually see; client-only bundles can be re-enabled if needed once
        // we trim the bundle. Re-enable behind an env flag if a CI runner with
        // more RAM is configured.
        widenClientFileUpload:
          process.env.SENTRY_WIDEN_CLIENT_UPLOAD === "true",
        sourcemaps: {
          disable: !process.env.SENTRY_AUTH_TOKEN,
        },
        release: {
          create: !!process.env.SENTRY_AUTH_TOKEN,
        },
      }),
    );
