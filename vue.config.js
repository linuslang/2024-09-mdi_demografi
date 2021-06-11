module.exports = {
  configureWebpack: {
    output: {
      jsonpFunction: 'webpackJsonp2021-06-kommunalval_kartor',
    }
  },
  devServer: {
    host: 'local.yle.fi',
    port: 8080,
  },
  publicPath: process.env.NODE_ENV === 'production'
    ? process.env.PUBLIC_URL
    : '/'
}
