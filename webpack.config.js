var webpack = require("webpack");
var path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    main: ["./source/javascripts/all.js", "./source/stylesheets/all.css.scss"],
  },

  output: {
    path: __dirname + "/tmp/dist",
    filename: "source/javascripts/all.js",
  },
  // config.module.rules = config.module.rules.filter(
  //   rule => rule.test.toString() !== '/\\.css$/'
  // )
  module: {
    rules: [
      {
        test: /\.(s*)css$/,
        exclude: /node_modules|tmp|vendor/,
        // enforce: "pre",
        use: [
          // { loader: "import-glob-loader" },
          // { loader: MiniCssExtractPlugin.loader },
          { loader: "style-loader" },
          { loader: "css-loader" },
          // { loader: "sass-loader" },
        ],
      },
      {
        test: /\.js?$/,
        use: [{ loader: "babel-loader" }],
        exclude: /node_modules/,
      },
      // {
      //   test: /\.(sa|sc|c)ss$/i,
      //   use: [MiniCssExtractPlugin.loader, "style-loader", "css-loader"],
      // },
    ],
  },

  plugins: [
    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),
    new MiniCssExtractPlugin(),
    new CleanWebpackPlugin(),
  ],
};
