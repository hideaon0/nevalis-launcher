const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nevalis', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  openExternal: (url) => ipcRenderer.send('open-external', url),

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Profile
  getUsername: () => ipcRenderer.invoke('get-username'),
  saveUsername: (data) => ipcRenderer.invoke('save-username', data),

  // Install
  isFirstInstall: () => ipcRenderer.invoke('is-first-install'),
  markInstalled: () => ipcRenderer.invoke('mark-installed'),
  installModpack: () => ipcRenderer.invoke('install-modpack'),

  // Updates
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  downloadMod: (mod) => ipcRenderer.invoke('download-mod', mod),

  // Launch
  launchMinecraft: (opts) => ipcRenderer.invoke('launch-minecraft', opts),

  // Mods
  getModsList: () => ipcRenderer.invoke('get-mods-list'),

  // Events from main process
  onModProgress: (cb) => ipcRenderer.on('mod-progress', (_, data) => cb(data)),
  onLaunchStatus: (cb) => ipcRenderer.on('launch-status', (_, msg) => cb(msg)),
});
