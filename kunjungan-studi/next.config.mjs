/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
    // better-sqlite3 adalah modul native, tidak boleh ikut di-bundle
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
