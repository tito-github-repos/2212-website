import type { NextConfig } from "next";

const csp = `
  default-src 'self';
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'self';
  form-action 'self';
  upgrade-insecure-requests;

  script-src
    'self'
    'unsafe-inline'
    'unsafe-eval'
    https://maps.googleapis.com
    https://maps.gstatic.com
    https://www.google.com
    https://challenges.cloudflare.com;

  style-src
    'self'
    'unsafe-inline'
    https://fonts.googleapis.com;

  font-src
    'self'
    https://fonts.gstatic.com
    data:;

  img-src
    'self'
    data:
    blob:
    https:
    https://maps.googleapis.com
    https://maps.gstatic.com;

  connect-src
    'self'
    https://maps.googleapis.com
    https://maps.gstatic.com
    https://challenges.cloudflare.com;

  frame-src
    'self'
    https://www.google.com
    https://maps.google.com
    https://challenges.cloudflare.com;

  worker-src
    'self'
    blob:;

  manifest-src
    'self';

  media-src
    'self'
    blob:
    data:;
`
  .replace(/\n/g, "")
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
