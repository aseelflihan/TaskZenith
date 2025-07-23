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
      /Module not found.*worker-script/,
      /Can't resolve.*tesseract.js/,
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

    // Add support for Tesseract.js workers and WASM files
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Copy Tesseract.js worker files to public directory
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'javascript/auto',
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/wasm/',
          outputPath: 'static/wasm/',
        },
      },
    });

    return config;
  },
};

module.exports = nextConfig;