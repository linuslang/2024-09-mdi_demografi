module.exports = {
  devServer: {
    host: 'local.yle.fi',
    port: 8080,
  },
  publicPath: process.env.NODE_ENV === 'production'
    ? process.env.PUBLIC_URL
    : '/'
}
