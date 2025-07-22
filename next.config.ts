// D:\applications\tasks\2\next.config.ts (النسخة النهائية مع التحميل اليدوي)

// --- التحميل اليدوي لمتغيرات البيئة ---
import path from 'path';
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
// ------------------------------------

import type { NextConfig } from 'next';

// --- الاختبار النهائي للتأكد من نجاح التحميل اليدوي ---
console.log("--- FINAL TEST (MANUAL LOAD) --- GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "✅ LOADED" : "❌ NOT LOADED");
// ----------------------------------------------------

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;