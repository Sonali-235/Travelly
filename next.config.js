/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Without this, Next.js's client-side "Router Cache" briefly reuses
    // page data when navigating via links/back-forward, even on pages
    // marked force-dynamic — this app is entirely live admin/order data,
    // so that cache should never kick in. staleTimes: 0 disables it.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

module.exports = nextConfig;
