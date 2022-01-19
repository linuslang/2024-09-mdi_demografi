module.exports = {
  configureWebpack: {
    output: {
      jsonpFunction: 'webpackJsonp2022-01-omradesval_kartor',
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
