/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist', 'canvas'],
  },
  
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

  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;