import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('agentAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),
  startTracking: () => ipcRenderer.invoke('start-tracking'),
  stopTracking: () => ipcRenderer.invoke('stop-tracking'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  testConnection: () => ipcRenderer.invoke('test-connection'),
  
  onTrackingStarted: (callback: () => void) => {
    ipcRenderer.on('tracking-started', callback);
  },
  onTrackingStopped: (callback: () => void) => {
    ipcRenderer.on('tracking-stopped', callback);
  },
  onActivityLogged: (callback: (activity: any) => void) => {
    ipcRenderer.on('activity-logged', (_, activity) => callback(activity));
  },
  onError: (callback: (message: string) => void) => {
    ipcRenderer.on('error', (_, message) => callback(message));
  },
  onShowSettings: (callback: () => void) => {
    ipcRenderer.on('show-settings', callback);
  },
});
