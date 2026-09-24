const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
let window;
app.whenReady().then(async () => {
  const source = process.env.VETCARE_DEV_URL;
  if (!source || !/^http:\/\/127\.0\.0\.1:\d+$/.test(source)) { console.error('Inicia el entorno mediante npm run dev:desktop.'); app.quit(); return; }
  const origin = new URL(source).origin;
  window = new BrowserWindow({ width: 1280, height: 850, minWidth: 900, minHeight: 650, backgroundColor: '#f7f5ed', show: false, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true } });
  window.setMenuBarVisibility(false);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => { if (new URL(url).origin !== origin) event.preventDefault(); });
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  ipcMain.handle('vetcare:environment', event => {
    if (event.sender !== window.webContents || !event.senderFrame || event.senderFrame !== window.webContents.mainFrame || new URL(event.senderFrame.url).origin !== origin) throw new Error('Origen no permitido.');
    return { client: 'desktop', platform: process.platform, stage: 'T15', persistence: false };
  });
  window.once('ready-to-show', () => window.show());
  try { await window.loadURL(source); } catch { console.error('No se pudo abrir la web local.'); app.quit(); }
});
app.on('window-all-closed', () => app.quit());
