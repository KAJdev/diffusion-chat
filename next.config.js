const { EnvironmentPlugin } = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: 'experimental-edge',
  },
  reactStrictMode: true,
  swcMinify: true,
  webpack(config) {
    config.plugins.push(new EnvironmentPlugin(['API_KEY']));
    return config;
  },
}

module.exports = nextConfig
