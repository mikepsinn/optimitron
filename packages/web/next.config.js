/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/optomitron',
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
