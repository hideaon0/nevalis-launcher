const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nevalis', {
  // Contrôles fenêtre
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Authentification Microsoft
  login: () => ipcRenderer.invoke('auth-login'),
  logout: () => ipcRenderer.invoke('auth-logout'),
  getProfile: () => ipcRenderer.invoke('auth-get-profile'),

  // Mises à jour des mods
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  applyUpdates: (diff) => ipcRenderer.invoke('apply-updates', diff),

  // Lancement du jeu
  launchGame: (opts) => ipcRenderer.invoke('launch-game', opts),

  // Écouteurs d'événements
  onUpdateProgress: (cb) => ipcRenderer.on('update-progress', (_, data) => cb(data)),
  onGameLog: (cb) => ipcRenderer.on('game-log', (_, line) => cb(line)),
  onGameClosed: (cb) => ipcRenderer.on('game-closed', (_, code) => cb(code)),

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
