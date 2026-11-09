const { app, BrowserWindow, ipcMain, dialog, safeStorage } = require('electron');
const path = require('node:path');
const { openLocalStore } = require('./storage.cjs');
const { createAuthClient } = require('./auth.cjs');
const { createOfflineController } = require('./offline-controller.cjs');
const { applicationRuntime } = require('./runtime.cjs');
let window, storage, offline, closingWindow=false;
app.whenReady().then(async () => {
  let runtime;
  try { runtime = applicationRuntime(process.env); } catch (error) { console.error(error.message); app.quit(); return; }
  const source = runtime.source;
  const origin = new URL(source).origin;
  try { storage = openLocalStore(path.join(app.getPath('userData'), 'storage', 'development', 'preauth-probe')); }
  catch (error) { console.error('No se pudo inicializar SQLite:', error.message); dialog.showErrorBox('VetCare · Almacenamiento', 'No se pudo abrir el almacenamiento local. No se borrará ni reemplazará la base existente. Revisa la terminal.'); app.quit(); return; }
  window = new BrowserWindow({ width: 1280, height: 850, minWidth: 900, minHeight: 650, backgroundColor: '#f7f5ed', show: false, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true } });
  window.setMenuBarVisibility(false);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => { if (new URL(url).origin !== origin) event.preventDefault(); });
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  const authorize = event => {
    if (event.sender !== window.webContents || !event.senderFrame || event.senderFrame !== window.webContents.mainFrame || new URL(event.senderFrame.url).origin !== origin) throw new Error('Origen no permitido.');
  };
  const authentication = createAuthClient(origin);
  offline=createOfflineController({directory:path.join(app.getPath('userData'),'offline-v1'),origin,remote:authentication,safeStorage});
  let work=Promise.resolve();const serial=fn=>{const result=work.then(fn);work=result.catch(()=>{});return result;};
  ipcMain.handle('vetcare:auth', (event, action, data) => { authorize(event); return serial(()=>offline.route(action, data)); });
  ipcMain.handle('vetcare:offline', (event, action, data) => { authorize(event); return serial(()=>offline.command(action,data)); });
  ipcMain.handle('vetcare:environment', event => { authorize(event); return { client: 'desktop', platform: process.platform, stage: 'T38', persistence: true, central: runtime.mode === 'central' }; });
  const storageAction = (event, action) => {
    authorize(event);
    try { return { ok: true, data: action() }; }
    catch (error) { console.error('Operación SQLite fallida:', error.message); return { ok: false, message: 'No se pudo completar la operación local. Revisa la captura y el almacenamiento; no se ha confirmado el guardado.' }; }
  };
  ipcMain.handle('vetcare:storage:status', event => storageAction(event, () => storage.status()));
  ipcMain.handle('vetcare:storage:read-probe', event => storageAction(event, () => storage.readProbe()));
  ipcMain.handle('vetcare:storage:save-probe', (event, value) => storageAction(event, () => storage.saveProbe(value)));
  window.on('close', event => {
    if(closingWindow)return;
    event.preventDefault();
    // La cola ya es durable; este intento breve solo adelanta el envío en un cierre normal.
    serial(()=>offline.command('sync',{timeoutMs:4000})).catch(()=>{}).finally(()=>{closingWindow=true;window.destroy();});
  });
  window.once('ready-to-show', () => window.show());
  try { await window.loadURL(source); } catch { console.error('No se pudo abrir la web local.'); app.quit(); }
});
app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => { if (storage) storage.close();offline?.close(); });
