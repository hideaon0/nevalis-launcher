const { Client, Authenticator } = require('minecraft-launcher-core');
const path = require('path');
const { app } = require('electron');

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
const MC_VERSION = '1.20.1';          // Version Minecraft du serveur
const FORGE_VERSION = '47.2.20';      // Version Forge (laisser null si Fabric)
const USE_FABRIC = false;             // true = Fabric, false = Forge
const FABRIC_VERSION = '0.15.7';      // Version Fabric loader (si USE_FABRIC = true)
const SERVER_IP = 'play.nevalis.fr';  // IP du serveur (affichage seulement)
const MIN_RAM = '2G';
const MAX_RAM = '4G';

class MCLauncher {
  constructor() {
    this.client = new Client();
    this.gameDir = path.join(app.getPath('userData'), 'minecraft');
    this._onLog = null;
    this._onClose = null;
  }

  onLog(cb) { this._onLog = cb; }
  onClose(cb) { this._onClose = cb; }

  async launch(profile) {
    const opts = {
      authorization: profile,
      root: this.gameDir,
      version: {
        number: MC_VERSION,
        type: 'release',
        ...(USE_FABRIC
          ? { custom: `fabric-loader-${FABRIC_VERSION}-${MC_VERSION}` }
          : { custom: `${MC_VERSION}-forge-${FORGE_VERSION}` }),
      },
      memory: { min: MIN_RAM, max: MAX_RAM },
      javaPath: 'javaw', // Java doit être installé ; chemin auto ou personnalisé
      overrides: {
        gameDirectory: this.gameDir,
        detach: true,
      },
    };

    this.client.on('debug', (e) => {
      if (this._onLog) this._onLog(e);
    });

    this.client.on('data', (e) => {
      if (this._onLog) this._onLog(e);
    });

    this.client.on('close', (code) => {
      if (this._onClose) this._onClose(code);
    });

    await this.client.launch(opts);
  }
}

module.exports = MCLauncher;
