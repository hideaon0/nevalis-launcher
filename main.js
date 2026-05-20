const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 680,
    minWidth: 900,
    minHeight: 580,
    frame: false,
    resizable: true,
    titleBarStyle: 'hidden',
    backgroundColor: '#0b0d12',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Ouvre les liens externes dans le navigateur système
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ─── Contrôles fenêtre ───────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

// ─── Auth Microsoft ──────────────────────────────────────────────────────────
const AuthManager = require('./launcher-core/auth-manager');
const authManager = new AuthManager();

ipcMain.handle('auth-login', async () => {
  try {
    const profile = await authManager.login();
    return { success: true, profile };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('auth-logout', async () => {
  await authManager.logout();
  return { success: true };
});

ipcMain.handle('auth-get-profile', async () => {
  return authManager.getProfile();
});

// ─── Mise à jour des mods ────────────────────────────────────────────────────
const ModUpdater = require('./launcher-core/mod-updater');
const modUpdater = new ModUpdater();

ipcMain.handle('check-updates', async () => {
  try {
    const diff = await modUpdater.checkForUpdates();
    return { success: true, diff };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('apply-updates', async (event, diff) => {
  modUpdater.onProgress((info) => {
    mainWindow.webContents.send('update-progress', info);
  });
  try {
    await modUpdater.applyUpdates(diff);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ─── Lancement Minecraft ─────────────────────────────────────────────────────
const MCLauncher = require('./launcher-core/minecraft-launcher');
const mcLauncher = new MCLauncher();

ipcMain.handle('launch-game', async (event, { profile }) => {
  try {
    mcLauncher.onLog((line) => {
      mainWindow.webContents.send('game-log', line);
    });
    mcLauncher.onClose((code) => {
      mainWindow.webContents.send('game-closed', code);
      mainWindow.show();
    });
    await mcLauncher.launch(profile);
    mainWindow.minimize();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
