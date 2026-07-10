/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["lumipdf"],
  serverExternalPackages: ["pdfjs-dist", "canvas"],
  turbopack: {},
};

export default nextConfig;

