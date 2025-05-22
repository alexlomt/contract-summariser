/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add experimental configuration for external packages
  experimental: {
    // These packages will be treated as external in server components
    serverComponentsExternalPackages: ['pdfjs-dist', 'canvas'],
    // Increase memory limit for API routes
    memoryBasedNumberOfWorkers: true,
  },
  
  // Configure more memory for the Node.js process
  onDemandEntries: {
    // Keep the build page in memory for longer
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    // Number of pages that should be kept simultaneously 
    pagesBufferLength: 5,
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure config.externals is an array and push the canvas external
      if (!Array.isArray(config.externals)) {
        config.externals = []; // Initialize as an array if it's not
      }
      
      // Add canvas and other memory-intensive modules as externals
      config.externals.push({
        canvas: 'commonjs canvas', // This tells Webpack to treat 'canvas' as an external commonjs module
      });
    } 
    
    if (!isServer) {
      // Don't attempt to import 'fs' module on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        // Add other Node.js specific modules that might be referenced
        path: false,
        stream: false,
        crypto: false,
        encoding: false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;