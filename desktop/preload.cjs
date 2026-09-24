const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('vetcare', Object.freeze({ environment: () => ipcRenderer.invoke('vetcare:environment') }));
