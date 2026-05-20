const fetch = require('node-fetch');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
// Remplace cette URL par la tienne après avoir créé le repo GitHub
const MANIFEST_URL =
  'https://raw.githubusercontent.com/TON-PSEUDO/nevalis-launcher/main/manifest.json';

class ModUpdater {
  constructor() {
    this.modsDir = path.join(app.getPath('userData'), 'mods');
    this._onProgress = null;
  }

  onProgress(cb) {
    this._onProgress = cb;
  }

  _emit(info) {
    if (this._onProgress) this._onProgress(info);
  }

  // Calcule le MD5 d'un fichier local
  async _md5(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (d) => hash.update(d));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  // Télécharge le manifest depuis GitHub et compare avec les mods locaux
  async checkForUpdates() {
    this._emit({ status: 'Vérification du manifest...', percent: 5 });

    const response = await fetch(MANIFEST_URL, { timeout: 10000 });
    if (!response.ok) throw new Error(`Manifest inaccessible : ${response.status}`);
    const manifest = await response.json();

    await fs.ensureDir(this.modsDir);

    const toDownload = [];
    const toDelete = [];

    // Mods à télécharger ou mettre à jour
    for (const mod of manifest.mods) {
      const localPath = path.join(this.modsDir, mod.filename);
      const exists = await fs.pathExists(localPath);
      if (!exists) {
        toDownload.push(mod);
      } else {
        const localMd5 = await this._md5(localPath);
        if (localMd5.toLowerCase() !== mod.md5.toLowerCase()) {
          toDownload.push(mod);
        }
      }
    }

    // Mods locaux absents du manifest (supprimés)
    const localFiles = await fs.readdir(this.modsDir);
    const manifestFilenames = manifest.mods.map((m) => m.filename);
    for (const file of localFiles) {
      if (file.endsWith('.jar') && !manifestFilenames.includes(file)) {
        toDelete.push(file);
      }
    }

    return { toDownload, toDelete, manifest };
  }

  // Applique les mises à jour (téléchargements + suppressions)
  async applyUpdates({ toDownload, toDelete }) {
    // Suppressions
    for (const file of toDelete) {
      await fs.remove(path.join(this.modsDir, file));
    }

    // Téléchargements
    for (let i = 0; i < toDownload.length; i++) {
      const mod = toDownload[i];
      const percent = Math.round(10 + ((i / toDownload.length) * 85));
      this._emit({
        status: `Téléchargement : ${mod.filename}`,
        percent,
        current: i + 1,
        total: toDownload.length,
      });

      const res = await fetch(mod.url, { timeout: 60000 });
      if (!res.ok) throw new Error(`Échec téléchargement ${mod.filename} : ${res.status}`);

      const dest = path.join(this.modsDir, mod.filename);
      const buffer = await res.buffer();
      await fs.outputFile(dest, buffer);

      // Vérifie le MD5 après téléchargement
      const md5 = await this._md5(dest);
      if (md5.toLowerCase() !== mod.md5.toLowerCase()) {
        await fs.remove(dest);
        throw new Error(`MD5 invalide pour ${mod.filename} — réessaie dans un moment.`);
      }
    }

    this._emit({ status: 'Tous les mods sont à jour ✓', percent: 100 });
  }
}

module.exports = ModUpdater;
