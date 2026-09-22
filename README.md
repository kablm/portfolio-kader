# Portfolio - Kader Belem

🎯 **Portfolio professionnel d'un administrateur systèmes et réseaux**

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 📋 À propos

Portfolio moderne et responsive présentant mes compétences en :
- 🖥️ Administration système (Windows Server, Linux)
- 🌐 Réseaux (LAN, DHCP/DNS, Switch/Router)
- 🔒 Cybersécurité (Firewalling, OWASP)
- ☁️ Virtualisation & Cloud (Proxmox, Docker, VMware)

**Étudiant en BTS CIEL** (Cybersécurité, Informatique et Réseaux, Électronique)  
**Recherche d'alternance** Bac+3 pour la rentrée 2027 — Nantes, Angers, Cholet

## 📁 Structure du projet

```
portfolio-kader/
├── index.html              # Page principale
├── css/
│   └── style.css           # Styles
├── js/
│   └── main.js             # Interactions
├── jeu/                    # Version jeu du portfolio (voir ci-dessous)
│   ├── index.html
│   ├── jeu.css
│   └── jeu.js
├── assets/
│   ├── CV_Kader_Belem.pdf  # CV téléchargeable (généré, voir tools/)
│   ├── og-image.png        # Aperçu affiché lors d'un partage de lien
│   ├── favicon.svg
│   └── apple-touch-icon.png
├── tools/
│   ├── build_cv.py         # Génère le CV en PDF
│   ├── badges/             # Badges Cisco intégrés au CV
│   └── requirements.txt
├── update_veille.py        # Régénère la section Veille technologique
├── .github/workflows/      # Exécution planifiée de la veille
└── README.md
```

## 🎮 Version jeu

`jeu/` propose le portfolio sous forme de jeu d'exploration en pixel art
(https://kablm.github.io/portfolio-kader/jeu/). Chaque bâtiment ouvre une section :
Maison (À propos), Datacenter (Compétences), Homelab (Projets), Salle des trophées
(Certifications), Gare des stages (Expériences), Tour radio (Veille) et Bureau de poste
(Contact). Le CV est dans le coffre de la place centrale.

**Le contenu n'est pas dupliqué** : le jeu lit `index.html` au chargement. Modifier le
site classique (ou laisser `update_veille.py` réécrire la veille) met donc le jeu à jour
automatiquement. Garder les classes existantes (`.skill-card`, `.project-card`,
`.timeline-item`, `.contact-item`…) pour que le jeu continue de les trouver.

Pour tester en local, `fetch` ne fonctionne pas en `file://` : lancer un serveur à la
racine du dépôt (`python -m http.server`) puis ouvrir http://localhost:8000/jeu/.

## 🛠️ Technologies utilisées

- **HTML5** - Structure sémantique
- **CSS3** - Design responsive (Grid, Flexbox, Animations)
- **JavaScript** - Interactions et navigation
- **Google Fonts** - Syne & DM Sans
- **Boxicons** - Iconographie

## ✨ Fonctionnalités

### Design
- ✅ Design moderne et professionnel
- ✅ Palette de couleurs cohérente (cyan, vert, orange)
- ✅ Animations fluides et transitions
- ✅ Effets visuels (orbes animés, hover states)

### Responsive
- ✅ 100% responsive (mobile, tablette, desktop)
- ✅ Menu hamburger mobile
- ✅ Breakpoints optimisés (768px, 1024px)

### Sections
1. **Hero** - Présentation avec diagramme réseau ASCII
2. **À propos** - Parcours et formations
3. **Compétences** - 8 catégories techniques
4. **Projets** - 4 projets personnels détaillés
5. **Expériences** - Timeline de 6 stages
6. **Contact** - Formulaire et coordonnées

## 🚀 Déploiement

### Option 1 : GitHub Pages (Recommandé)

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/portfolio.git
cd portfolio

# 2. Initialiser Git (si nouveau projet)
git init
git add .
git commit -m "Initial commit"

# 3. Pousser sur GitHub
git remote add origin https://github.com/votre-username/portfolio.git
git branch -M main
git push -u origin main
```

Puis dans les **Settings** du repo :
1. Allez dans **Pages**
2. Source : **Deploy from a branch**
3. Branch : **main** / **/ (root)**
4. Sauvegardez

🌐 Votre site sera disponible à : `https://votre-username.github.io/portfolio/`

### Option 2 : Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Connectez votre repo GitHub
2. Build settings :
   - **Build command** : (vide)
   - **Publish directory** : `/`
3. Deploy !

### Option 3 : Hébergement classique

Uploadez tous les fichiers sur votre serveur web via FTP.

## 🎨 Personnalisation

### Couleurs

Modifiez les variables CSS dans `css/style.css` :

```css
:root {
    --primary: #0ea5e9;        /* Bleu principal */
    --secondary: #22c55e;      /* Vert secondaire */
    --accent: #f97316;         /* Orange accent */
}
```

### Contenu

Éditez directement `index.html` :
- Informations personnelles
- Compétences techniques
- Projets et expériences

### Images

Ajoutez vos images dans `assets/img/` et mettez à jour les chemins dans le HTML.

## 📊 Contenu du Portfolio

### Projets mis en avant

1. **Infrastructure Proxmox VE**
   - VMs, conteneurs LXC, VLANs
   - Stack : Proxmox, KVM/QEMU, pfSense, Nginx, MySQL, Grafana

2. **Homelab Active Directory**
   - Windows Server 2022, GPO
   - DHCP/DNS, PowerShell

3. **Serveur Web Sécurisé**
   - LEMP Stack (Linux, Nginx, MySQL, PHP)
   - SSL/TLS, UFW, Fail2ban

4. **Stack Monitoring & Alerting**
   - Prometheus, Grafana, Docker
   - Monitoring temps réel

### Compétences

- Administration Système
- Réseaux
- Sécurité & Cybersécurité
- Virtualisation & Cloud
- Développement & Scripting
- Support & Maintenance
- Bases de données
- Services Web

## 📧 Contact

- **Email** : [kaderbelem428@gmail.com](mailto:kaderbelem428@gmail.com)
- **Téléphone** : +33 6 61 40 29 98
- **LinkedIn** : [Kader Belem](https://www.linkedin.com/in/kader-belem-688699213/)
- **GitHub** : [@kablm](https://github.com/kablm)
- **Localisation** : Nantes, France

## 🔧 Maintenance

### Ajouter un projet

Dans `index.html`, section `#projects`, ajoutez :

```html
<div class="project-card">
    <div class="project-icon-wrapper">
        <div class="project-icon">
            <i class='bx bx-votre-icone'></i>
        </div>
    </div>
    <div class="project-content">
        <div class="project-tags">
            <span class="project-tag">Tag1</span>
        </div>
        <h3 class="project-title">Nom du Projet</h3>
        <p class="project-description">Description...</p>
        <div class="project-tech">
            <span class="tech-badge">Tech1</span>
        </div>
    </div>
</div>
```

### Mettre à jour le CV

Le PDF proposé au téléchargement est **généré**, il ne s'édite pas
directement. Le contenu se modifie dans `tools/build_cv.py` :

```bash
pip install -r tools/requirements.txt
python tools/build_cv.py
```

Le script réécrit `assets/CV_Kader_Belem.pdf` et resserre l'interlignage
au besoin pour que le CV tienne sur une page. Voir `tools/README.md`.

### Ajouter une expérience

Dans `index.html`, section `#experience`, ajoutez dans `.timeline` :

```html
<div class="timeline-item">
    <div class="timeline-marker"></div>
    <div class="timeline-content">
        <div class="timeline-date">Année</div>
        <h3>Poste</h3>
        <h4>Entreprise</h4>
        <ul>
            <li>Mission 1</li>
            <li>Mission 2</li>
        </ul>
    </div>
</div>
```

## 📝 Licence

© 2026 Kader Belem. Tous droits réservés.

Ce portfolio est un projet personnel. Vous pouvez vous en inspirer mais merci de ne pas le copier tel quel.

## 🙏 Remerciements

- **Fonts** : [Google Fonts](https://fonts.google.com/)
- **Icons** : [Boxicons](https://boxicons.com/)
- **Inspiration** : Design system moderne et clean

---

**Made with ❤️ by Kader Belem**

*Dernière mise à jour : Février 2025*
