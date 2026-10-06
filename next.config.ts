import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Headers only where they cannot break the app.
 *
 * No CSP is shipped in this change: with next/image remote origins, Supabase
 * auth/storage endpoints, self-hosted Fontsource fonts and WebGL canvases in
 * play, an unverified policy would break rendering or login. A tested CSP
 * belongs in its own change with the real origin list.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Auth surfaces must not be cached or framed anywhere.
        source: "/(login|logout|admin|app|reset-password|forgot-password)/:path*",
        headers: [...securityHeaders, { key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
