# ⚔ Nevalis Launcher

Launcher officiel du serveur Minecraft RP **Nevalis** (1.20.1 + Forge).

---

## 🚀 Démarrage rapide (développeurs)

```bash
npm install
npm start
```

---

## 📦 Structure du projet

```
nevalis-launcher/
├── main.js                      ← Process Electron principal
├── preload.js                   ← IPC sécurisé contextBridge
├── package.json                 ← Config + electron-builder
├── manifest-exemple.json        ← Template manifest mods
├── .github/workflows/build.yml  ← CI/CD GitHub Actions
├── src/
│   ├── index.html               ← Interface principale
│   ├── style.css                ← Thème dark médiéval
│   └── renderer.js              ← Logique UI
└── modpack/
    ├── mods/                    ← Vos .jar (embarqués dans l'installeur)
    └── config/                  ← Configs personnalisées
```

---

## 🔧 Configuration initiale

### 1. Remplacer "hideaon0"

Dans `main.js`, ligne contenant `MANIFEST_URL`, remplace `hideaon0` par ton pseudo GitHub :

```js
const MANIFEST_URL = 'https://raw.githubusercontent.com/MON-PSEUDO/nevalis-launcher/main/manifest.json';
```

### 2. Configurer le serveur

Dans `main.js`, modifie les constantes du launcher :

```js
const MC_VERSION = '1.20.1';
const FORGE_VERSION = '1.20.1-47.3.0';
const SERVER_IP = 'play.nevalis.fr';     // ← Ton IP serveur
```

### 3. Ajouter les mods

Copie tous tes `.jar` dans `modpack/mods/`. Ils seront automatiquement copiés dans `%AppData%/.nevalis/mods/` lors de la première ouverture du launcher.

---

## 🔄 Système de mise à jour des mods

### Héberger le manifest

1. Upload tes `.jar` dans une **GitHub Release** (ex: `mods-v1.0`)
2. Calcule le MD5 de chaque fichier :
   - **Windows** : `certutil -hashfile mon-mod.jar MD5`
   - **Mac/Linux** : `md5sum mon-mod.jar`
3. Édite `manifest.json` sur GitHub (bouton ✏️) avec les vraies URLs et MD5
4. Commit → tous les joueurs reçoivent la MAJ au prochain lancement ✅

### Structure du manifest.json

```json
{
  "version": "1.1.0",
  "minecraft": "1.20.1",
  "forge": "1.20.1-47.3.0",
  "mods": [
    {
      "filename": "mon-mod.jar",
      "url": "https://github.com/hideaon0/nevalis-launcher/releases/download/mods-v1.1/mon-mod.jar",
      "md5": "abc123...",
      "name": "Nom Lisible du Mod"
    }
  ]
}
```

---

## 🏗 Build & Distribution

### Build local

```bash
npm run build:win    # → dist/Nevalis-Launcher-Setup-1.0.0.exe
npm run build:mac    # → dist/Nevalis-Launcher-1.0.0.dmg
npm run build:linux  # → dist/Nevalis-Launcher-1.0.0.AppImage
```

### Release automatique via GitHub Actions

```bash
git add .
git commit -m "Release v1.0.0"
git tag v1.0.0
git push origin main --tags
```

GitHub Actions compile les 3 binaires et les publie automatiquement dans les Releases. ✅

---

## 📋 Prérequis joueurs

- **Java 17+** ([télécharger](https://adoptium.net/))
- Compte Minecraft (mode offline supporté)
- Windows 10/11, macOS 11+, ou Linux (Ubuntu 20+)

---

## 🎨 Personnalisation UI

Le thème est entièrement dans `src/style.css` via des variables CSS :

```css
--accent:  #c4943a;   /* Doré principal */
--accent2: #7b6ef6;   /* Violet accent */
--gold:    #d4af6a;   /* Textes dorés */
```

Pour changer l'artwork de fond, remplace la valeur de `.bg-artwork` dans le CSS.

---

## 📄 Licence

Propriété de l'équipe Nevalis — usage interne uniquement.
