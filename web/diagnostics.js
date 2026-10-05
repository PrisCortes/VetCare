export async function initializeDiagnostics(panel) {
  if (!panel) return;
  const document = { getElementById: id => panel.querySelector('#' + id) };
const button = document.getElementById('check');
const result = document.getElementById('api');
const message = document.getElementById('message');
if (window.vetcare) {
  try {
    const context = await window.vetcare.environment();
    document.getElementById('client').textContent = context.client === 'desktop' ? 'Electron · Windows' : 'Web';
    if (context.persistence && window.vetcare.storage) await initializeStorage();
  }
  catch { document.getElementById('client').textContent = 'Escritorio · contexto no disponible'; }
}
button.addEventListener('click', async () => {
  button.disabled = true; result.textContent = 'Comprobando…';
  try {
    const response = await fetch('/api/v1/health', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Respuesta no válida');
    const data = await response.json();
    if (data.service !== 'vetcare-api' || data.status !== 'ok') throw new Error('Servicio inesperado');
    result.textContent = 'Disponible'; message.textContent = 'PHP respondió correctamente. La conexión central se verifica por separado con npm run db:check en el servidor.';
  } catch { result.textContent = 'No disponible'; message.textContent = 'No se pudo comprobar la API. Revisa el proceso de desarrollo y vuelve a intentar.'; }
  finally { button.disabled = false; }
});
function showProbe(record) {
  document.getElementById('saved-probe').textContent = record ? record.text : 'Sin registro';
  document.getElementById('saved-at').textContent = record ? new Date(record.updatedAt).toLocaleString('es-MX') : 'Sin registro';
}
async function initializeStorage() {
  const panel = document.getElementById('storage-panel'), status = document.getElementById('sqlite'), notice = document.getElementById('storage-message');
  panel.hidden = false;
  const form = document.getElementById('storage-form');
  try {
    const response = await window.vetcare.storage.status();
    if (!response.ok || !response.data.integrity) throw new Error('Almacenamiento no verificado');
    status.textContent = `Disponible · esquema ${response.data.schemaVersion}`;
    const read = await window.vetcare.storage.readProbe();
    if (!read.ok) throw new Error('No se pudo leer');
    showProbe(read.data);
    notice.textContent = 'SQLite abierto y verificado. El dato guardado se conserva al cerrar Electron.';
  } catch {
    status.textContent = 'No disponible'; notice.textContent = 'No se pudo comprobar SQLite. No se habilita el guardado.';
    document.getElementById('save-probe').disabled = true; return;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); const value = document.getElementById('probe').value.trim();
    if (!value) { notice.textContent = 'Escribe un texto de prueba; no se guardaron cambios.'; return; }
    const save = document.getElementById('save-probe'); save.disabled = true;
    try {
      const response = await window.vetcare.storage.saveProbe(value);
      if (!response.ok) throw new Error('Guardado no confirmado');
      showProbe(response.data); notice.textContent = 'Texto guardado en SQLite. Cierra y abre de nuevo Electron para comprobarlo.';
    } catch { notice.textContent = 'No se confirmó el guardado. El texto sigue en el formulario; revisa el almacenamiento.'; }
    finally { save.disabled = false; }
  });
}

}
