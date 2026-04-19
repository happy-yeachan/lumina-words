import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR WebSocket connections from the local network IP
  // so the app works when tested on a phone via Wi-Fi (e.g. http://192.168.x.x:3000)
  allowedDevOrigins: ['192.168.219.117', '125.248.150.115', 'yeachan.cloud'],

  // PWA: Generate icons in /public/icons
  // Service worker: /public/sw.js (manually registered or use next-pwa for auto-registration)
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        { key: 'Service-Worker-Allowed', value: '/' },
        { key: 'Cache-Control', value: 'no-store' },
      ],
    },
  ],
};

export default nextConfig;
