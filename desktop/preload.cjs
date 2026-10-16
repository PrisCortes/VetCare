const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('vetcare', Object.freeze({
  auth: (action, data) => ipcRenderer.invoke('vetcare:auth', action, data),
  offline: (action, data) => ipcRenderer.invoke('vetcare:offline', action, data),
  environment: () => ipcRenderer.invoke('vetcare:environment'),
  storage: Object.freeze({
    status: () => ipcRenderer.invoke('vetcare:storage:status'),
    readProbe: () => ipcRenderer.invoke('vetcare:storage:read-probe'),
    saveProbe: value => ipcRenderer.invoke('vetcare:storage:save-probe', value)
  })
}));
