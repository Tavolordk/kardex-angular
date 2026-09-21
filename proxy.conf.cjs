const target = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8080';

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
