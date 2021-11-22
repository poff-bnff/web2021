module.exports = {
  webpack: (config, webpack) => {
    // Add your variable using the DefinePlugin
    config.plugins.push(
      new webpack.DefinePlugin({
        //All your custom ENVs that you want to use in frontend
        CUSTOM_VARIABLES: {
          StrapiProtocol: JSON.stringify(process.env['StrapiProtocol']),
          StrapiHost: JSON.stringify(process.env['StrapiHost']),
          StrapiColour: JSON.stringify(process.env['StrapiColour']),
        },
      })
    );
    // Important: return the modified config
    return config;
  },
};
