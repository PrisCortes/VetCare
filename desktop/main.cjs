const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const { openLocalStore } = require('./storage.cjs');
let window, storage;
app.whenReady().then(async () => {
  const source = process.env.VETCARE_DEV_URL;
  if (!source || !/^http:\/\/127\.0\.0\.1:\d+$/.test(source)) { console.error('Inicia el entorno mediante npm run dev:desktop.'); app.quit(); return; }
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
  ipcMain.handle('vetcare:environment', event => { authorize(event); return { client: 'desktop', platform: process.platform, stage: 'T16', persistence: true }; });
  const storageAction = (event, action) => {
    authorize(event);
    try { return { ok: true, data: action() }; }
    catch (error) { console.error('Operación SQLite fallida:', error.message); return { ok: false, message: 'No se pudo completar la operación local. Revisa la captura y el almacenamiento; no se ha confirmado el guardado.' }; }
  };
  ipcMain.handle('vetcare:storage:status', event => storageAction(event, () => storage.status()));
  ipcMain.handle('vetcare:storage:read-probe', event => storageAction(event, () => storage.readProbe()));
  ipcMain.handle('vetcare:storage:save-probe', (event, value) => storageAction(event, () => storage.saveProbe(value)));
  window.once('ready-to-show', () => window.show());
  try { await window.loadURL(source); } catch { console.error('No se pudo abrir la web local.'); app.quit(); }
});
app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => { if (storage) storage.close(); });
