/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    // Dev-only: the webpack filesystem cache desyncs on this Windows setup and
    // surfaces as "Cannot read properties of undefined (reading 'call')" during
    // Fast Refresh. Disabling persistent dev cache trades a slower rebuild for
    // a stable one. Production builds keep their cache.
    if (dev) config.cache = false;
    return config;
  },
};

export default nextConfig;
