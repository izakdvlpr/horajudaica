import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/contagem-do-omer',
        permanent: true,
      }
    ];
  }
};

export default nextConfig;
