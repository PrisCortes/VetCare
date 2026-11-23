function verifiedHttpsUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('VETCARE_APP_URL debe ser una URL HTTPS válida.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('VETCARE_APP_URL debe ser un origen HTTPS, sin ruta ni credenciales.');
  return url.origin;
}
function applicationRuntime(environment) {
  const source = environment.VETCARE_DEV_URL;
  if (source) {
    if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(source)) throw new Error('VETCARE_DEV_URL debe ser un origen local de desarrollo válido.');
    return { source, mode: 'development' };
  }
  if (environment.VETCARE_APP_URL) return { source: verifiedHttpsUrl(environment.VETCARE_APP_URL), mode: 'central' };
  throw new Error('Inicia desarrollo mediante npm run dev:desktop o configura VETCARE_APP_URL para la aplicación central.');
}
function desktopEnvironment(environment) {
  return Object.fromEntries(Object.entries(environment).filter(([key]) => !key.startsWith('DB_') && !key.startsWith('OFFLINE_PRIVATE_KEY')));
}
module.exports = { applicationRuntime, desktopEnvironment };
