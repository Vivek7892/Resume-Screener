/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed rewrites — replaced by app/api/[...path]/route.ts which streams
  // requests directly to FastAPI with no body-size limit.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
