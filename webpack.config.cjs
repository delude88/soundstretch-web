const path = require('path');

const worklets = [
  'src/worklet/soundstretch-processor.ts',
  'src/worklet/bpm-count-processor.ts',
  'src/worker/soundstretch.worker.ts',
  'src/worklet/rubberband-source-processor.ts',
  'src/worklet/rubberband-realtime-processor.ts'
]

const getFilename = (filepath) => path.parse(filepath).name

const bundle = (worklet) => {
  return {
    entry: path.resolve(__dirname, worklet),
    context: path.resolve(__dirname, "."),
    module: {
      rules: [
        {
          test: /\.(js|jsx|tsx|ts)$/,
          exclude: /node_modules/,
          loader: 'babel-loader'
        },
        {
          test: /\.(wasm)$/i,
          type: "asset/inline",
        }
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    performance: {
      maxAssetSize: 900000,
      maxEntrypointSize: 900000
    },
    target: "webworker",
    output: {
      filename: `${getFilename(worklet)}.js`,
      path: path.resolve(__dirname, 'public'),
      publicPath: '',
    }
  }
}

module.exports = worklets.map(worklet => bundle(worklet));
