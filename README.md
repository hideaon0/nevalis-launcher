# ⚔️ Nevalis Launcher

Launcher officiel du serveur Minecraft RP **Nevalis** — mise à jour automatique des mods, authentification Microsoft, lancement Minecraft avec Forge.

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js ≥ 18 ([nodejs.org](https://nodejs.org))
- Java 17+ installé (pour lancer Minecraft)
- Git

### Installation locale

```bash
git clone https://github.com/TON-PSEUDO/nevalis-launcher.git
cd nevalis-launcher
npm install
npm start
```

---

## ⚙️ Configuration (2 fichiers à modifier)

### 1. URL du manifest — `launcher-core/mod-updater.js`

```js
const MANIFEST_URL =
  'https://raw.githubusercontent.com/TON-PSEUDO/nevalis-launcher/main/manifest.json';
```

Remplace `TON-PSEUDO` par ton nom d'utilisateur GitHub.

### 2. Version Minecraft — `launcher-core/minecraft-launcher.js`

```js
const MC_VERSION    = '1.20.1';
const FORGE_VERSION = '47.2.20';
const USE_FABRIC    = false;
const SERVER_IP     = 'play.nevalis.fr';
const MAX_RAM       = '4G';
```

### 3. Liens de navigation — `src/renderer.js`

```js
const EXTERNAL_PAGES = {
  shop:         'https://boutique.nevalis.fr',
  reglement:    'https://nevalis.fr/reglement',
  // ...
};
```

---

## 🌐 Hébergement gratuit (GitHub)

### Manifest JSON

Une fois ton repo public créé, le manifest est accessible à :

```
https://raw.githubusercontent.com/TON-PSEUDO/nevalis-launcher/main/manifest.json
```

C'est cette URL à coller dans `mod-updater.js`.

### Mods (.jar)

1. Repo GitHub → **Releases** → **Create a new release**
2. Tag : `mods-v1.0`
3. Glisse tous tes `.jar`
4. Publie

URLs des mods :
```
https://github.com/TON-PSEUDO/nevalis-launcher/releases/download/mods-v1.0/NOM_DU_MOD.jar
```

### Calculer les MD5

```bash
# Linux / macOS
md5sum mon-mod.jar

# Windows (PowerShell)
certutil -hashfile mon-mod.jar MD5
```

---

## 📦 Compiler le launcher

### Manuel

```bash
npm run build:win    # → dist/Nevalis Setup 1.0.0.exe
npm run build:mac    # → dist/Nevalis-1.0.0.dmg
npm run build:linux  # → dist/Nevalis-1.0.0.AppImage
npm run build:all    # → les 3 en même temps
```

### Automatique via GitHub Actions

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub compile sur ses serveurs et crée une Release avec les 3 binaires automatiquement.

---

## 🔄 Mettre à jour les mods (workflow admin)

1. Upload le nouveau `.jar` dans une Release GitHub (ex: `mods-v1.1`)
2. Calcule son MD5
3. Édite `manifest.json` → change `url` + `md5`
4. Commit → **tous les joueurs reçoivent la MAJ au prochain lancement** ✅

---

## 📁 Structure du projet

```
nevalis-launcher/
├── main.js                     ← Process Electron principal
├── preload.js                  ← Pont IPC sécurisé
├── package.json
├── manifest.json               ← Modèle à héberger sur GitHub
├── .github/workflows/build.yml ← CI/CD auto-build
├── src/
│   ├── index.html              ← UI (thème médiéval-fantasy)
│   ├── style.css               ← Design sombre / violet
│   └── renderer.js             ← Logique interface
└── launcher-core/
    ├── mod-updater.js          ← Comparaison MD5 + téléchargement
    ├── minecraft-launcher.js   ← Lancement MC + Forge/Fabric
    └── auth-manager.js         ← Auth Microsoft OAuth
```

---

## 🆓 Limites gratuites GitHub

| Ressource | Limite | Suffisant ? |
|---|---|---|
| Stockage repo | 1 Go | ✅ |
| Fichier par Release | 2 Go | ✅ |
| Releases storage | Illimité | ✅ |
| GitHub Actions | 2 000 min/mois | ✅ |
| Bande passante | 1 Go/mois (raw) | ⚠️ voir ci-dessous |

> **Astuce** : héberge `manifest.json` sur **Cloudflare Pages** (gratuit, bande passante illimitée) et garde les `.jar` sur GitHub Releases.

---

## 🎨 Personnalisation du design

- **Logo** : remplace le texte `NEVALIS` dans `src/index.html` par une balise `<img>`
- **Fond hero** : ajoute une image d'artwork dans `src/` et référence-la dans `.hero-bg` ou `.hero-art` en CSS
- **Couleur accent** : modifie `--accent: #6b4fff` dans `style.css`
- **Icône** : place `icon.ico / icon.icns / icon.png` dans le dossier `assets/`

---

*Nevalis — Forge ta légende dans les brumes d'Aldrath* ⚔️
