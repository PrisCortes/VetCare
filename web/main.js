const button = document.getElementById('check');
const result = document.getElementById('api');
const message = document.getElementById('message');
if (window.vetcare) {
  try { const context = await window.vetcare.environment(); document.getElementById('client').textContent = context.client === 'desktop' ? 'Electron · Windows' : 'Web'; }
  catch { document.getElementById('client').textContent = 'Escritorio · contexto no disponible'; }
}
button.addEventListener('click', async () => {
  button.disabled = true; result.textContent = 'Comprobando…';
  try {
    const response = await fetch('/api/v1/health', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Respuesta no válida');
    const data = await response.json();
    if (data.service !== 'vetcare-api' || data.status !== 'ok') throw new Error('Servicio inesperado');
    result.textContent = 'Disponible'; message.textContent = 'PHP respondió correctamente. La conexión con MariaDB todavía no se ha configurado.';
  } catch { result.textContent = 'No disponible'; message.textContent = 'No se pudo comprobar la API. Revisa el proceso de desarrollo y vuelve a intentar.'; }
  finally { button.disabled = false; }
});
