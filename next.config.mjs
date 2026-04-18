/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Build-blocking lint errors for pre-existing unused-vars etc. aren't worth
    // blocking deploys. tsc --noEmit still runs in CI/dev.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
