'use strict';

// ─── Particules ──────────────────────────────────────────────────────────────
(function spawnParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('div');
    p.className = 'p';
    p.style.left = Math.random() * 85 + 5 + '%';
    p.style.bottom = '-5px';
    p.style.animationDuration = (9 + Math.random() * 14) + 's';
    p.style.animationDelay   = (Math.random() * 12) + 's';
    p.style.opacity = String(0.2 + Math.random() * 0.5);
    container.appendChild(p);
  }
})();

// ─── Navigation ──────────────────────────────────────────────────────────────
const EXTERNAL_PAGES = {
  shop:         'https://boutique.nevalis.fr',
  suivis:       'https://nevalis.fr/suivis',
  reglement:    'https://nevalis.fr/reglement',
  lore:         'https://nevalis.fr/lore',
  candidatures: 'https://nevalis.fr/candidatures',
  tickets:      'https://nevalis.fr/tickets',
  docs:         'https://nevalis.fr/docs',
};

document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    if (!page) return;

    document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
    item.classList.add('active');

    if (page === 'home') return;
    if (page === 'patchnotes') { openModal('patchnotes'); return; }

    const url = EXTERNAL_PAGES[page];
    if (url) window.open(url, '_blank');
  });
});

// ─── Profil ───────────────────────────────────────────────────────────────────
let currentProfile = null;

async function loadProfile() {
  if (!window.nevalis) return;
  const profile = await window.nevalis.getProfile();
  if (profile) setProfile(profile);
}

function setProfile(profile) {
  currentProfile = profile;
  const initials = profile.name ? profile.name.slice(0, 2).toUpperCase() : '??';
  document.getElementById('avatarCircle').textContent = initials;
  document.getElementById('userName').childNodes[0].nodeValue = profile.name + ' ';
  document.getElementById('verifiedBadge').style.display = 'inline-flex';
  document.getElementById('userRole').textContent = 'Aventurier';
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('profileName').textContent = profile.name;
  document.getElementById('onlineDot').style.display = 'block';
}

function clearProfile() {
  currentProfile = null;
  document.getElementById('avatarCircle').textContent = '?';
  document.getElementById('userName').childNodes[0].nodeValue = 'Non connecté ';
  document.getElementById('verifiedBadge').style.display = 'none';
  document.getElementById('userRole').textContent = 'Cliquez sur Se connecter';
  document.getElementById('profileAvatar').textContent = '?';
  document.getElementById('profileName').textContent = 'Se connecter';
  document.getElementById('onlineDot').style.display = 'none';
}

async function handleProfileClick() {
  if (!window.nevalis) return;
  if (currentProfile) {
    if (confirm(`Se déconnecter de ${currentProfile.name} ?`)) {
      await window.nevalis.logout();
      clearProfile();
    }
  } else {
    const result = await window.nevalis.login();
    if (result.success) setProfile(result.profile);
    else alert('Connexion échouée : ' + result.error);
  }
}

// ─── Bouton Jouer ────────────────────────────────────────────────────────────
const playBtn    = document.getElementById('playBtn');
const playText   = document.getElementById('playBtnText');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressStatus = document.getElementById('progressStatus');
const gameLog    = document.getElementById('gameLog');

let isUpdating = false;

async function handlePlay() {
  if (!window.nevalis) { alert('API Electron non disponible (mode preview).'); return; }
  if (isUpdating) return;

  if (!currentProfile) {
    const result = await window.nevalis.login();
    if (!result.success) { alert('Connexion requise pour jouer.'); return; }
    setProfile(result.profile);
  }

  isUpdating = true;
  playBtn.disabled = true;
  playText.textContent = 'Vérification...';
  progressWrap.classList.add('visible');

  window.nevalis.onUpdateProgress((info) => {
    progressStatus.textContent = info.status;
    progressFill.style.width = info.percent + '%';
  });

  const checkResult = await window.nevalis.checkUpdates();
  if (!checkResult.success) {
    alert('Erreur manifest : ' + checkResult.error);
    resetPlayBtn();
    return;
  }

  const { diff } = checkResult;
  const totalMods = diff.toDownload.length + diff.toDelete.length;

  if (totalMods === 0) {
    progressStatus.textContent = 'Mods à jour ✓';
    progressFill.style.width = '100%';
    launchGame();
  } else {
    playText.textContent = `Mise à jour (${totalMods} mods)...`;
    const applyResult = await window.nevalis.applyUpdates(diff);
    if (!applyResult.success) {
      alert('Erreur mise à jour : ' + applyResult.error);
      resetPlayBtn();
      return;
    }
    launchGame();
  }
}

async function launchGame() {
  playText.textContent = 'Lancement...';
  progressStatus.textContent = 'Démarrage de Minecraft...';

  const result = await window.nevalis.launchGame({ profile: currentProfile });
  if (!result.success) {
    alert('Erreur lancement : ' + result.error);
    resetPlayBtn();
    return;
  }

  window.nevalis.onGameLog((line) => {
    gameLog.textContent = line.substring(0, 120);
  });

  window.nevalis.onGameClosed((code) => {
    resetPlayBtn();
    progressStatus.textContent = `Jeu fermé (code ${code})`;
    setTimeout(() => progressWrap.classList.remove('visible'), 3000);
  });
}

function resetPlayBtn() {
  isUpdating = false;
  playBtn.disabled = false;
  playText.textContent = 'Jouer';
}

// ─── Modals ──────────────────────────────────────────────────────────────────
const MODALS = {
  patchnotes: {
    tag: 'Patch Note',
    title: 'DailyLog 20/05/2026',
    date: '20 mai 2026',
    link: 'https://nevalis.fr/patchnotes',
    html: `
      <h2>Patch Notes — 20 mai 2026</h2>
      <div class="modal-section">
        <h3>Ajustements</h3>
        <p><strong>Système d'artisanat — refonte légère</strong></p>
        <p>Le crafting de rang 3 est revu. Quand tu l'actives, tu débloques deux nouvelles mécaniques :</p>
        <ul>
          <li><strong>Fusion d'essences</strong> — utilisable sans avoir la recette dans ta barre d'accès rapide.</li>
          <li><strong>Reforge</strong> — Clic droit sur un objet forgé pour relancer ses attributs secondaires (une fois par jour).</li>
        </ul>
        <p>Bonus passif : <strong>+1 stack d'expérience</strong> de forgeron sur chaque craft réussi.</p>
      </div>
      <div class="modal-section">
        <h3>Améliorations</h3>
        <p><strong>Paramètres → Contrôles : Sprint / Marche / Accroupissement en toggle ou hold</strong></p>
        <p>Nouvelle section <strong>Contrôles</strong> dans les Paramètres. Tu peux désormais choisir le comportement de chaque touche de déplacement.</p>
      </div>
      <div class="modal-section">
        <h3>Corrections</h3>
        <p>Correction d'un bug provoquant la perte d'inventaire lors d'un crash de région.</p>
        <p>Stabilité des chunks améliorée dans la zone de Veldris.</p>
      </div>
    `,
  },
  staff: {
    tag: 'Recrutement',
    title: 'Candidature Staff',
    date: 'Ouvert',
    link: 'https://nevalis.fr/candidatures',
    html: `
      <h2>Rejoindre l'équipe Nevalis</h2>
      <div class="modal-section">
        <h3>Postes ouverts</h3>
        <ul>
          <li><strong>Modérateur</strong> — veille au respect des règles RP et de la communauté.</li>
          <li><strong>Animateur</strong> — organise des événements et quêtes sur le serveur.</li>
          <li><strong>Constructeur</strong> — participe à la création des bâtiments et zones.</li>
        </ul>
      </div>
      <div class="modal-section">
        <h3>Prérequis</h3>
        <p>Être actif depuis au moins 2 semaines, maîtriser les règles du RP, être majeur ou avoir l'accord d'un responsable légal.</p>
      </div>
    `,
  },
  actu: {
    tag: 'Lore & RP',
    title: 'Actus RP — Aldrath',
    date: 'Semaine 3',
    link: 'https://nevalis.fr/lore',
    html: `
      <h2>Chroniques d'Aldrath — Semaine 3</h2>
      <div class="modal-section">
        <h3>Nouvelle quête principale</h3>
        <p>La Guilde des Ombres a lancé un appel aux aventuriers courageux. La forteresse de Veldris est tombée aux mains des corrompus.</p>
        <p>Rendez-vous aux <strong>Portes de Brume</strong> pour recevoir votre mission.</p>
      </div>
      <div class="modal-section">
        <h3>Événement de la semaine</h3>
        <p><strong>Le Grand Marché d'Aldrath</strong> ouvre ses portes vendredi à 20h. Échangez ressources, artefacts et secrets.</p>
      </div>
    `,
  },
};

function openModal(type) {
  const data = MODALS[type];
  if (!data) return;
  document.getElementById('modalTag').textContent   = data.tag;
  document.getElementById('modalTitle').textContent = data.title;
  document.getElementById('modalDate').textContent  = data.date;
  document.getElementById('modalBody').innerHTML    = data.html;
  document.getElementById('modalLinkBtn').onclick   = () => window.open(data.link, '_blank');
  document.getElementById('modalOverlay').classList.add('visible');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('visible');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

// ─── Date carte patch ─────────────────────────────────────────────────────────
document.getElementById('patchDate').textContent = new Date().toLocaleDateString('fr-FR', {
  day: 'numeric', month: 'long', year: 'numeric',
});

// ─── Init ─────────────────────────────────────────────────────────────────────
loadProfile();
