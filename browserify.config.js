module.exports = {
  entry: './src/utils/bitcoin-browser.js',
  output: './dist/bitcoin-utils.js',
  debug: true,
  transform: [
    ['browserify-shim', { global: true }]
  ],
  browserifyOptions: {
    standalone: 'bitcoinUtils',
    builtins: {
      fs: false,
      crypto: false,
      stream: false,
      buffer: false
    }
  }
}; 