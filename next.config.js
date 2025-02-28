/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["sharp", "canvas"],
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
