module.exports = function(api) {
  api.cache(true);
  return {
    overrides: [
  {
    test: (filename) => typeof filename === 'string' && filename.startsWith(__dirname),
    plugins: [
      [require.resolve('@babel/plugin-proposal-decorators', { paths: [require.resolve('@hypertill/db/package.json')] }), { legacy: true }],
      [require.resolve('@babel/plugin-transform-flow-strip-types', { paths: [require.resolve('@hypertill/db/package.json')] })],
      [require.resolve('@babel/plugin-transform-class-properties', { paths: [require.resolve('@hypertill/db/package.json')] }), { loose: true }],
      [require.resolve('@babel/plugin-transform-private-methods', { paths: [require.resolve('@hypertill/db/package.json')] }), { loose: true }],
      [require.resolve('@babel/plugin-transform-private-property-in-object', { paths: [require.resolve('@hypertill/db/package.json')] }), { loose: true }],
    ],
  },

      {
        test: (filename) => typeof filename === 'string' && filename.startsWith(__dirname),
plugins: [

],
      },
    ],
    presets: ['babel-preset-expo'],
  };
};