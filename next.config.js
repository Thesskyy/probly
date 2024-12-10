/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // other configurations...
  output: "export",
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
