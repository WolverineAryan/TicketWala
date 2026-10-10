/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.output.uniqueName = "ticketwala";
    return config;
  },
};

export default nextConfig;
