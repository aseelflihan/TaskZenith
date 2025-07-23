/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Ignore critical dependency warnings for handlebars and opentelemetry
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /require\.extensions is not supported by webpack/,
      /Module not found: Can't resolve 'handlebars'/,
      /Module not found: Can't resolve '@opentelemetry/,
    ];
    
    // Set exprContextCritical to false to reduce warnings
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    // Specifically ignore handlebars require.extensions warnings
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'handlebars': 'commonjs handlebars'
      });
    }

    return config;
  },
};

module.exports = nextConfig;