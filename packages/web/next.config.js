const path = require("node:path");
const { withSentryConfig } = require("@sentry/nextjs");
const { REDIRECTS } = require("./src/lib/redirects");

/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_OUTPUT_EXPORT === 'true';

const nextConfig = {
  transpilePackages: ['@optimitron/data'],
  serverExternalPackages: ['@storacha/client', 'multiformats', 'pinata'],
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
  webpack: (config, { isServer }) => {
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
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource) => {
            resource.request = resource.request.replace(/^node:/, "");
          },
        ),
      );
    }

    return config;
  },
  async redirects() {
    if (isStaticExport) return [];
    return REDIRECTS;
  },
};

const isDev = process.env.NODE_ENV === 'development';
module.exports = isDev
  ? nextConfig
  : withSentryConfig(nextConfig, {
      org: "wishonia-org",
      project: "optimitron-web",
      silent: !process.env.CI,
      widenClientFileUpload: true,
    });
