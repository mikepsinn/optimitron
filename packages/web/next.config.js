const path = require("node:path");
const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
const { REDIRECTS } = require("./src/lib/redirects");

/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_OUTPUT_EXPORT === "true";
const isVercelBuild = process.env.VERCEL === "1";
const legislationContentTraceFiles = ["../../content/legislation/**/*.md"];
const loggedOutPageSnapshotTraceFiles = ["./src/app/**/page.logged-out.md"];

const nextConfig = {
  experimental: {
    webpackMemoryOptimizations: true,
    // Size the static-generation worker pool by available memory instead of
    // CPU count. Next spawns one build worker per CPU by default, and every
    // worker inherits NODE_OPTIONS -- so a per-process heap cap is really a
    // cap times the core count. On Vercel's 8 GB standard build container
    // that arithmetic does not close, and the container OOM-killed this
    // build (SIGKILL, "Command exited with 1") once the branch grew past
    // what main happens to fit in. Deriving the count from free memory is
    // the supported fix and keeps builds off the Enhanced Builds upsell.
    memoryBasedWorkersCount: true,
    // memoryBasedWorkersCount alone was not enough: the build then survived
    // compilation and died at "Generating static pages (228/305)", because
    // the container reports 4 cores and static generation fans out to one
    // worker each. GitHub and local builds retain two workers. Vercel's 8 GB
    // preview builder gets one: PR #195 proved that two workers at 3584 MB
    // trigger a container OOM, while lowering both to 3072 MB triggers a V8
    // heap OOM in client compilation. One 3584 MB worker gives the compiler
    // the heap it needs without multiplying that ceiling past container RAM.
    cpus: isVercelBuild ? 1 : 2,
    // Read the next failure's signature before tuning further: a kernel
    // SIGKILL with Vercel's "OOM event detected" means total RSS is still too
    // high (lower this further, or buy Enhanced Builds), whereas a Node
    // "JavaScript heap out of memory" error means one process needs a bigger
    // ceiling and this went one step too far.
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
  transpilePackages: ["@optimitron/data", "@optimitron/tracking"],
  serverExternalPackages: ["@optimitron/storage", "@storacha/client", "pinata"],
  // Next.js matches dev origins against the request hostname, not a full URL.
  allowedDevOrigins: ["127.0.0.1", "localhost", "warondisease.local"],
  output: isStaticExport ? "export" : undefined,
  basePath: isStaticExport ? "/optimitron" : "",
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/api/mcp": loggedOutPageSnapshotTraceFiles,
    "/legislation": legislationContentTraceFiles,
    "/legislation/*": legislationContentTraceFiles,
    "/api/og/route": [
      "./public/fonts/libre-baskerville-400.ttf",
      "./public/fonts/libre-baskerville-700.ttf",
    ],
    "/humanity-v-government/opengraph-image": [
      "./public/fonts/libre-baskerville-400.ttf",
      "./public/fonts/libre-baskerville-700.ttf",
    ],
  },
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    // Skip ESLint during builds — run separately via `pnpm lint`
    ignoreDuringBuilds: true,
  },
  typescript: {
    // `next build` only needs the app/runtime graph. The full `tsc --noEmit`
    // CI gate still covers tests, Playwright, and scripts.
    tsconfigPath: "tsconfig.next.json",
    // Vercel's build container was hanging here for 24m+ even though local
    // `tsc -p tsconfig.next.json` finishes in ~2m. The `core-validate` job
    // already runs the same typecheck (and the broader `typecheck:fast`)
    // against every push, so failing the build on type errors here is
    // redundant — we'd just wait twice for the same diagnostic.
    ignoreBuildErrors: true,
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

    // @storacha/client needs its nested multiformats@13 (exports ./link), but
    // @atproto/* also brings multiformats@9. Externalize Storacha itself and
    // let Node resolve Storacha's own dependency instead of externalizing the
    // ambiguous bare multiformats request.
    if (isServer) {
      config.externals.unshift(({ request }, callback) => {
        if (
          /^@optimitron\/storage(\/|$)/.test(request) ||
          /^@storacha\//.test(request) ||
          /^pinata(\/|$)/.test(request)
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
    return [
      ...REDIRECTS,
      {
        source: "/endorse",
        destination: "/join",
        permanent: true,
      },
    ];
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
