/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }
    return [{ source: "/:path*", headers }];
  },
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
