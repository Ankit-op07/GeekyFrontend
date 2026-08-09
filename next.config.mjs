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

      /* ── /dsa → the tracker ─────────────────────────────────────────────
       *  There is no public sheet index: the sheet a learner reads IS the
       *  dashboard tab. This exists because /dsa is a path people trim to
       *  from an approach page URL (/dsa/<section>/<problem>), type from
       *  memory, or reach from an old link.
       *
       *  It lives HERE rather than as an app/dsa/page.tsx calling redirect().
       *  That page was statically prerendered into a META-REFRESH document —
       *  HTTP 200, a full HTML payload, and a one-second pause before the
       *  browser moved. A config redirect is a real 307 with no body.
       *
       *  permanent: false (307), NOT 308 — a permanent redirect is cached by
       *  the browser indefinitely and cannot be recalled, so restoring a
       *  public index at /dsa later would still bounce everyone who had ever
       *  hit it once. 307 costs one hop per visit and stays reversible.
       * ─────────────────────────────────────────────────────────────────── */
      { source: '/dsa', destination: '/dashboard?tab=dsa', permanent: false },
    ]
  },
}

export default nextConfig
