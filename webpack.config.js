const game_plugin = require('webpack-game-asset-plugin').default;
const html_plugin = require('html-webpack-plugin');
const path = require('path');

/** @var {webpack.Configuration} */
const option = [{
  // webpack options
  entry: path.join(__dirname, 'client', 'lobby.tsx'),
  output: {
    filename: 'lobby.js',
    publicPath: '/',
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [
      '.ts',
      '.tsx',
      '.js',
      '.jsx'
    ]
  },
  plugins: [
    new html_plugin({
      filename: 'lobby.html',
      template: path.join(__dirname, 'client', 'lobby.html'),
    }),
  ],
}, {
  entry: path.join(__dirname, 'client', 'game.ts'),
  output: {
    filename: 'game.js',
    publicPath: '/',
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [
      '.ts',
      '.tsx',
      '.js',
      '.jsx'
    ]
  },
  plugins: [
    new game_plugin({
      entryOption: path.join(__dirname, 'game_entry.json'),
      listOut: 'listOut.json',
      makeAtlas: true,
      padding: 10,
    }),
  ],
}];

module.exports = option;
