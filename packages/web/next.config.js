/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Skip ESLint during builds — run separately via `pnpm lint`
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
