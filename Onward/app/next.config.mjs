import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("./package.json");
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // One source of truth for the version the profile page shows.
  env: { NEXT_PUBLIC_APP_VERSION: version },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
