const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const os = require('os');

let mainWindow;

const NEVALIS_DIR = path.join(os.homedir(), '.nevalis');
const MODS_DIR = path.join(NEVALIS_DIR, 'mods');
const CONFIG_DIR = path.join(NEVALIS_DIR, 'config');
const MINECRAFT_DIR = path.join(NEVALIS_DIR, 'minecraft');
const VERSIONS_DIR = path.join(MINECRAFT_DIR, 'versions');
const LIBRARIES_DIR = path.join(MINECRAFT_DIR, 'libraries');

// Ensure dirs exist
[NEVALIS_DIR, MODS_DIR, CONFIG_DIR, MINECRAFT_DIR, VERSIONS_DIR, LIBRARIES_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 780,
    minWidth: 1100,
    minHeight: 680,
    frame: false,
    transparent: false,
    backgroundColor: '#0d0f14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-close', () => mainWindow.close());
ipcMain.on('window-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});

// Open external links
ipcMain.on('open-external', (_, url) => shell.openExternal(url));

// Get app version
ipcMain.handle('get-version', () => app.getVersion());

// Get platform
ipcMain.handle('get-platform', () => process.platform);

// Check if first install
ipcMain.handle('is-first-install', () => {
  const marker = path.join(NEVALIS_DIR, '.installed');
  return !fs.existsSync(marker);
});

// Mark as installed
ipcMain.handle('mark-installed', () => {
  fs.writeFileSync(path.join(NEVALIS_DIR, '.installed'), '1');
});

// Get stored username
ipcMain.handle('get-username', () => {
  const f = path.join(NEVALIS_DIR, 'profile.json');
  if (fs.existsSync(f)) {
    try { return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { return null; }
  }
  return null;
});

// Save username (offline mode)
ipcMain.handle('save-username', (_, data) => {
  fs.writeFileSync(path.join(NEVALIS_DIR, 'profile.json'), JSON.stringify(data));
  return true;
});

// Copy bundled modpack to install dir
ipcMain.handle('install-modpack', async () => {
  const bundledMods = path.join(process.resourcesPath, 'modpack', 'mods');
  const devMods = path.join(__dirname, 'modpack', 'mods');
  const src = fs.existsSync(bundledMods) ? bundledMods : devMods;

  if (!fs.existsSync(src)) {
    return { ok: false, error: 'Dossier modpack introuvable' };
  }

  const files = fs.readdirSync(src).filter(f => f.endsWith('.jar'));
  let copied = 0;

  for (const file of files) {
    const dest = path.join(MODS_DIR, file);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(src, file), dest);
      copied++;
    }
  }

  // Copy config
  const bundledConfig = path.join(process.resourcesPath, 'modpack', 'config');
  const devConfig = path.join(__dirname, 'modpack', 'config');
  const configSrc = fs.existsSync(bundledConfig) ? bundledConfig : devConfig;
  if (fs.existsSync(configSrc)) {
    copyDirRecursive(configSrc, CONFIG_DIR);
  }

  return { ok: true, copied, total: files.length };
});

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) copyDirRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

// MD5 of a local file
function md5File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('data', d => hash.update(d));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Fetch JSON from URL
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Download file with progress
function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);

    lib.get(url, res => {
      const total = parseInt(res.headers['content-length'] || '0');
      let downloaded = 0;

      res.on('data', chunk => {
        downloaded += chunk.length;
        file.write(chunk);
        if (total > 0 && onProgress) onProgress(downloaded / total);
      });

      res.on('end', () => {
        file.end();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Check & apply mod updates from manifest
ipcMain.handle('check-updates', async () => {
  const MANIFEST_URL = 'https://raw.githubusercontent.com/hideaon0/nevalis-launcher/main/manifest.json';

  try {
    const manifest = await fetchJSON(MANIFEST_URL);
    const updates = [];

    for (const mod of manifest.mods) {
      const localPath = path.join(MODS_DIR, mod.filename);
      if (!fs.existsSync(localPath)) {
        updates.push(mod);
        continue;
      }
      const localMd5 = await md5File(localPath);
      if (localMd5.toLowerCase() !== mod.md5.toLowerCase()) {
        updates.push(mod);
      }
    }

    // Remove mods not in manifest
    const manifestFiles = new Set(manifest.mods.map(m => m.filename));
    for (const file of fs.readdirSync(MODS_DIR)) {
      if (file.endsWith('.jar') && !manifestFiles.has(file)) {
        fs.unlinkSync(path.join(MODS_DIR, file));
      }
    }

    return { ok: true, updates, total: manifest.mods.length };
  } catch (e) {
    return { ok: false, error: e.message, updates: [] };
  }
});

// Download a single mod
ipcMain.handle('download-mod', async (_, mod) => {
  const dest = path.join(MODS_DIR, mod.filename);
  try {
    await downloadFile(mod.url, dest, (p) => {
      mainWindow.webContents.send('mod-progress', { filename: mod.filename, progress: p });
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Launch Minecraft
ipcMain.handle('launch-minecraft', async (_, { username, ram }) => {
  const MC_VERSION = '1.20.1';
  const FORGE_VERSION = '1.20.1-47.3.0';
  const SERVER_IP = 'play.nevalis.fr';

  // Build Java args
  const jvmArgs = [
    `-Xmx${ram}G`,
    `-Xms2G`,
    '-XX:+UseG1GC',
    '-XX:+ParallelRefProcEnabled',
    '-XX:MaxGCPauseMillis=200',
    '-XX:+UnlockExperimentalVMOptions',
    '-XX:+DisableExplicitGC',
    '-XX:+AlwaysPreTouch',
    '-XX:G1HeapWastePercent=5',
    '-XX:G1MixedGCCountTarget=4',
    '-XX:G1MixedGCLiveThresholdPercent=90',
    '-XX:G1RSetUpdatingPauseTimePercent=5',
    '-XX:SurvivorRatio=32',
    '-XX:+PerfDisableSharedMem',
    '-XX:MaxTenuringThreshold=1',
  ];

  // Try to find Java
  let javaPath = 'java';
  const javaHome = process.env.JAVA_HOME;
  if (javaHome) javaPath = path.join(javaHome, 'bin', 'java');

  mainWindow.webContents.send('launch-status', 'Démarrage de Minecraft...');

  // Use minecraft-launcher-lib approach
  const forgeJar = path.join(LIBRARIES_DIR, `forge-${FORGE_VERSION}.jar`);

  // Build classpath (simplified - in production use minecraft-launcher-lib)
  const mcArgs = [
    ...jvmArgs,
    '-Djava.library.path=' + path.join(MINECRAFT_DIR, 'natives'),
    '-cp', forgeJar + (process.platform === 'win32' ? ';' : ':') + path.join(MINECRAFT_DIR, 'minecraft.jar'),
    'net.minecraftforge.bootstrap.ForgeBootstrap',
    '--username', username,
    '--version', FORGE_VERSION,
    '--gameDir', NEVALIS_DIR,
    '--assetsDir', path.join(MINECRAFT_DIR, 'assets'),
    '--assetIndex', MC_VERSION,
    '--uuid', '0',
    '--accessToken', '0',
    '--userType', 'offline',
    '--versionType', 'release',
    '--server', SERVER_IP,
    '--port', '25565',
  ];

  const proc = spawn(javaPath, mcArgs, {
    cwd: NEVALIS_DIR,
    detached: true,
    stdio: 'ignore',
  });

  proc.unref();
  mainWindow.webContents.send('launch-status', 'Minecraft lancé !');
  return { ok: true };
});

// Get mods list
ipcMain.handle('get-mods-list', () => {
  if (!fs.existsSync(MODS_DIR)) return [];
  return fs.readdirSync(MODS_DIR).filter(f => f.endsWith('.jar'));
});
