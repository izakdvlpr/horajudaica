import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ['@horajudaica/subscriptions'],
  webpack(config, { isServer }) {
    if (!isServer) {
      config.externals.push('handlebars');
    }
    
    return config;
  },
};

export default nextConfig;
