const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  devServer: {
    // Override the deprecated webpack-dev-server configuration
    setupMiddlewares: (middlewares, devServer) => {
      // This replaces onBeforeSetupMiddleware and onAfterSetupMiddleware
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // You can add custom middleware here if needed
      // For now, we just return the middlewares to fix the deprecation warning
      return middlewares;
    },
  },
  webpack: {
    plugins: {
      add: [
        // Add bundle analyzer only in production build with ANALYZE flag
        process.env.ANALYZE && new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'bundle-report.html',
          openAnalyzer: false,
        }),
      ].filter(Boolean),
    },
    configure: (webpackConfig) => {
      // Optimize bundle splitting
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            mui: {
              name: 'mui',
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            common: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
      return webpackConfig;
    },
  },
};