module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Plugin essencial para os decorators do WatermelonDB (@text, @field, etc) funcionarem
      ['@babel/plugin-proposal-decorators', { legacy: true }],
    ],
  };
};