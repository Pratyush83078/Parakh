/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep production browser checks separate from an already-running dev server.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;
