var path = require('path');

module.exports = {
  entry: './src/main.js',
  output: {
      path: path.join(__dirname, 'static'),
      filename: 'app.js'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        include: path.join(__dirname, 'src'),
        loader: 'babel-loader',
        query: {presets: ["es2015"]}
      }
    ]
  },
  debug: true,
  cache: true,
  devServer: {
    contentBase: path.join(__dirname, 'static')
  }
};