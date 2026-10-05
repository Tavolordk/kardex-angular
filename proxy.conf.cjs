const target = process.env.API_PROXY_TARGET || 'http://10.237.3.101:4600';

module.exports = {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: 'info'
  },
  '/hubs': {
    target,
    secure: false,
    changeOrigin: true,
    ws: true,
    logLevel: 'info'
  }
};
