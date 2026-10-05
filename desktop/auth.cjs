// Sesión conectada efímera: el renderizador nunca recibe cookie ni CSRF.
function createAuthClient(origin) {
  let cookie = '', csrf = '';
  const actions = {
    login: ['POST','/auth/login'], session: ['GET','/auth/session'], logout: ['POST','/auth/logout'],
    users: ['GET','/admin/users'], createUser: ['POST','/admin/users'], updateUser: ['PATCH','/admin/users']
  };
  return async (action, data) => {
    if (!Object.hasOwn(actions, action)) throw new Error('Acción no permitida.');
    const [method, path] = actions[action];
    const body = method === 'GET' ? undefined : JSON.stringify(data ?? {});
    if (body && Buffer.byteLength(body) > 16384) throw new Error('Solicitud demasiado grande.');
    try {
      const response = await fetch(origin + '/api/v1' + path, {
        method, redirect: 'error', signal: AbortSignal.timeout(25000),
        headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body,
      });
      const result = await response.json();
      if (response.ok) {
        for (const value of response.headers.getSetCookie()) if (value.startsWith('vc_session=')) cookie = value.split(';')[0];
        if (typeof result.csrf === 'string') csrf = result.csrf;
        if (action === 'logout') { cookie = ''; csrf = ''; }
      }
      if (response.status === 401) { cookie = ''; csrf = ''; }
      delete result.csrf;
      return { status: response.status, data: result };
    } catch { return { status: 503, data: { error: { code: 'AUTH_UNAVAILABLE', message: 'No se pudo contactar con el servicio de acceso.' } } }; }
  };
}
module.exports = { createAuthClient };
