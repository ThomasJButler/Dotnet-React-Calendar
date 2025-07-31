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
};