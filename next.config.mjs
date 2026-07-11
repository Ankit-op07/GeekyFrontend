/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      /* ── Ultimate Campus Placement Kit — RETIRED (2026-07) ──────────────
       *  The SKU is no longer sold, but live ads, backlinks and shared URLs
       *  still point at these paths. They must land somewhere useful, not 404.
       *
       *  NOTE: there is no /pricing route — pricing is a section on the
       *  homepage, so these go to /#pricing.
       *
       *  IMPORTANT: existing placement buyers KEEP their access. The content
       *  still exists in MongoDB and PLAN_TO_SLUGS still grants it — only the
       *  ability to *buy* it is gone. See lib/appConstants.ts.
       * ─────────────────────────────────────────────────────────────────── */
      { source: '/checkout/placement', destination: '/#pricing', permanent: true },
      { source: '/checkout/placement-kit', destination: '/#pricing', permanent: true },
    ]
  },
}

export default nextConfig
