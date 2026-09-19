/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* to the FastAPI backend.
  // Local dev: defaults to http://localhost:8000.
  // Vercel: set BACKEND_URL env var to the deployed backend URL.
  //
  // The browser never calls the backend directly — it calls /api/* on the
  // Next.js server, which proxies to the backend.
  // This avoids CORS issues entirely.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
