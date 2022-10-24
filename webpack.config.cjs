const path = require('path')

module.exports =
  {
    entry: path.resolve(__dirname, 'src/worklet/index.ts'),
    context: path.resolve(__dirname, '.'),
    module: {
      rules: [
        {
          test: /\.(js|jsx|tsx|ts)$/,
          exclude: /node_modules/,
          loader: 'babel-loader'
        },
        {
          test: /\.(wasm)$/i,
          type: 'asset/inline'
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    performance: {
      maxAssetSize: 900000,
      maxEntrypointSize: 900000
    },
    target: 'webworker',
    output: {
      filename: `${getFilename(worklet)}.js`,
      path: path.resolve(__dirname, 'public'),
      publicPath: ''
    }
  }
