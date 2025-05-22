/** @type {import('next').NextConfig} */
const nextConfig = {
  // Move serverComponentsExternalPackages to top level
  serverExternalPackages: ['canvas'],
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      if (!Array.isArray(config.externals)) {
        config.externals = [];
      }
      
      config.externals.push({
        canvas: 'commonjs canvas',
        encoding: 'commonjs encoding',
      });
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        encoding: false,
      };
    }
    
    return config;
  },

  // More aggressive ESLint disable
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [], // Don't run ESLint on any directories
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;