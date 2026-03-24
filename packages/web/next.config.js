const path = require("node:path");

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
  webpack: (config, { isServer }) => {
    // MetaMask SDK bundles React Native code that references this package.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
    };

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
    if (isStaticExport) return []; // static exports don't support redirects
    return [
      // Wishonia's Government — old top-level paths → new /agencies/* paths
      { source: "/wishocracy", destination: "/agencies/dcongress/wishocracy", permanent: true },
      { source: "/alignment", destination: "/agencies/dfec/alignment", permanent: true },
      { source: "/alignment/:id", destination: "/agencies/dfec/alignment/:id", permanent: true },
      { source: "/referendum", destination: "/agencies/dcongress/referendums", permanent: true },
      { source: "/referendum/:slug", destination: "/agencies/dcongress/referendums/:slug", permanent: true },
      { source: "/money", destination: "/agencies/dtreasury", permanent: true },
      { source: "/budget", destination: "/agencies/domb", permanent: true },
      { source: "/budget/:slug", destination: "/agencies/domb/:slug", permanent: true },
      { source: "/policies", destination: "/agencies/dcbo", permanent: true },
      { source: "/policies/:slug", destination: "/agencies/dcbo/:slug", permanent: true },
      { source: "/transparency", destination: "/agencies/dgao", permanent: true },
      { source: "/discoveries", destination: "/agencies/dih/discoveries", permanent: true },
      // Legacy aliases
      { source: "/federal-reserve", destination: "/agencies/dtreasury/dfed", permanent: true },
      { source: "/department-of-war", destination: "/agencies/ddod", permanent: true },
      { source: "/treasury", destination: "/agencies/dtreasury", permanent: true },
      { source: "/contribute", destination: "/prize", permanent: true },
      { source: "/politicians", destination: "/politicians/US", permanent: false },
    ];
  },
};

module.exports = nextConfig;
