/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Forum posts and auction listings upload a few compressed photos through server actions.
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  env: {
    // Netlify sets NETLIFY=true at build time. Serverless functions don't share memory,
    // so the auction room polls there instead of using the in-process SSE bus.
    NEXT_PUBLIC_REALTIME: process.env.NETLIFY ? "poll" : (process.env.NEXT_PUBLIC_REALTIME ?? "sse"),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "thumb.wikimedia.org" },
      { protocol: "https", hostname: "media.sketchfab.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
