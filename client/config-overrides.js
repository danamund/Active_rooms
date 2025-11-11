// client/config-overrides.js
module.exports = {
  // Does not change the webpack config itself
  webpack: function (config, env) {
    return config;
  },

    // Changes the devServer config to prevent the allowedHosts error
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
        config.allowedHosts = 'all'; // <-- Set this to "all" instead of an empty array
      return config;
    };
  },
};
