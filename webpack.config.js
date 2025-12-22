/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:31:27
 * Last Updated: 2025-12-22T11:34:33
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/Background.ts',
    content: './src/content/ContentScript.ts',
    popup: './src/presentation/popup/Popup.tsx',
    options: './src/presentation/options/Options.tsx',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: (pathData) => {
      // Special handling for content and background scripts
      if (pathData.chunk.name === 'content' || pathData.chunk.name === 'background') {
        return 'content/[name].js';
      }
      return '[name]/[name].js';
    },
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  plugins: [
    // Copy manifest and static files
    new CopyPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json',
        },
        {
          from: 'icons',
          to: 'icons',
          noErrorOnMissing: true,
        },
        {
          from: '_locales',
          to: '_locales',
          noErrorOnMissing: true,
        },
        // Copy content script to correct location
        {
          from: 'dist/content/content.js',
          to: 'content/content.js',
          noErrorOnMissing: true,
        },
        // Copy loader script for popup
        {
          from: 'src/presentation/popup/loader.js',
          to: 'ui/popup/loader.js',
          noErrorOnMissing: true,
        },
        // Copy loader script for options page
        {
          from: 'src/presentation/options/loader.js',
          to: 'ui/options/loader.js',
          noErrorOnMissing: true,
        },
      ],
    }),

    // Generate HTML files for popup and options
    new HtmlWebpackPlugin({
      template: 'src/presentation/popup/popup.html',
      filename: 'ui/popup/popup.html',
      chunks: ['popup'],
      inject: false, // Don't inject scripts automatically
    }),

    new HtmlWebpackPlugin({
      template: 'src/presentation/options/options.html',
      filename: 'ui/options/options.html',
      chunks: ['options'],
      inject: false, // Don't inject scripts automatically
    }),
  ],

  optimization: {
    splitChunks: {
      chunks: (chunk) => {
        // Don't split content and background scripts
        return chunk.name !== 'content' && chunk.name !== 'background';
      },
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: (chunk) => chunk.name !== 'content' && chunk.name !== 'background',
        },
      },
    },
  },

  devtool: 'cheap-module-source-map',

  // Chrome extension specific settings
  target: 'web',

  // Ignore node-specific modules
  externals: {
    'chrome': 'chrome',
  },
};
