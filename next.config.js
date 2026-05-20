/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Ignora os erros do ESLint durante o build na Vercel
      ignoreDuringBuilds: true,
    },
  };
  
  module.exports = nextConfig;