const { Authenticator } = require('minecraft-launcher-core');
const { shell, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { app } = require('electron');

const PROFILE_PATH = path.join(app.getPath('userData'), 'profile.json');

class AuthManager {
  constructor() {
    this._profile = null;
    this._loadSaved();
  }

  async _loadSaved() {
    try {
      if (await fs.pathExists(PROFILE_PATH)) {
        this._profile = await fs.readJson(PROFILE_PATH);
      }
    } catch {}
  }

  getProfile() {
    return this._profile;
  }

  // Authentification Microsoft via minecraft-launcher-core
  async login() {
    // Si déjà connecté et token valide, on renvoie le profil
    if (this._profile) return this._profile;

    // Lance l'auth Microsoft OAuth dans une fenêtre Electron
    return new Promise((resolve, reject) => {
      const authWin = new BrowserWindow({
        width: 520,
        height: 640,
        frame: true,
        webPreferences: { nodeIntegration: false },
      });

      authWin.loadURL(
        'https://login.live.com/oauth20_authorize.srf' +
          '?client_id=00000000402b5328' +
          '&response_type=code' +
          '&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL' +
          '&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf'
      );

      authWin.webContents.on('will-redirect', async (event, url) => {
        if (url.startsWith('https://login.live.com/oauth20_desktop.srf')) {
          const params = new URL(url).searchParams;
          const code = params.get('code');
          if (!code) {
            authWin.close();
            return reject(new Error('Authentification annulée.'));
          }
          try {
            // minecraft-launcher-core gère l'échange code → token Minecraft
            const profile = await Authenticator.getAuth(code);
            this._profile = profile;
            await fs.outputJson(PROFILE_PATH, profile);
            authWin.close();
            resolve(profile);
          } catch (err) {
            authWin.close();
            reject(err);
          }
        }
      });

      authWin.on('closed', () => {
        reject(new Error('Fenêtre de connexion fermée.'));
      });
    });
  }

  async logout() {
    this._profile = null;
    await fs.remove(PROFILE_PATH);
  }
}

module.exports = AuthManager;
