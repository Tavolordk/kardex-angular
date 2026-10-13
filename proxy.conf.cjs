const target = process.env.API_PROXY_TARGET || 'http://10.237.3.101:4600';
const saveTarget = process.env.SAVE_API_PROXY_TARGET || target;

module.exports = {
  // Si KardexSaveApi está en otro host, definir SAVE_API_PROXY_TARGET.
  '/api/save': {
    target: saveTarget,
    secure: false,
    changeOrigin: true,
    logLevel: 'info'
  },
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
