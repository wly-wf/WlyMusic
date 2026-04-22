import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendToRust: (command: string) => ipcRenderer.invoke('rust:send', command),
});