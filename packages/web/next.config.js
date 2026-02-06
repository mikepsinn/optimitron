/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Skip ESLint during builds — run separately via `pnpm lint`
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is done via `pnpm typecheck`
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
