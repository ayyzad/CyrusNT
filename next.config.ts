import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.iranintl.com',
      },
      {
        protocol: 'https',
        hostname: '**.reuters.com',
      },
      {
        protocol: 'https',
        hostname: '**.bbc.com',
      },
      {
        protocol: 'https',
        hostname: '**.cnn.com',
      },
      {
        protocol: 'https',
        hostname: '**.aljazeera.com',
      },
      {
        protocol: 'https',
        hostname: '**.ap.org',
      },
      {
        protocol: 'https',
        hostname: '**.npr.org',
      },
      {
        protocol: 'https',
        hostname: '**.theguardian.com',
      },
      {
        protocol: 'https',
        hostname: '**.washingtonpost.com',
      },
      {
        protocol: 'https',
        hostname: '**.nytimes.com',
      },
      {
        protocol: 'https',
        hostname: '**.wsj.com',
      },
      {
        protocol: 'https',
        hostname: '**.ft.com',
      },
      {
        protocol: 'https',
        hostname: '**.radiofarda.com',
      },
      {
        protocol: 'https',
        hostname: '**.voanews.com',
      },
      {
        protocol: 'https',
        hostname: '**.iranwire.com',
      },
      {
        protocol: 'https',
        hostname: '**.tehrantimes.com',
      },
      {
        protocol: 'https',
        hostname: '**.irna.ir',
      },
      {
        protocol: 'https',
        hostname: '**.financialtribune.com',
      },
      {
        protocol: 'https',
        hostname: '**.tasnimnews.com',
      },
      {
        protocol: 'https',
        hostname: '**.iranfrontpage.com',
      },
      {
        protocol: 'https',
        hostname: '**.presstv.ir',
      },
      {
        protocol: 'https',
        hostname: '**.farsnews.ir',
      },
      // Catch-all for other news sites
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
