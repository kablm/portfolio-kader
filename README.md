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
**Recherche d'alternance** pour 2025-2026

## 📁 Structure du projet

```
portfolio/
├── index.html          # Page principale
├── css/
│   └── style.css      # Styles CSS
├── js/
│   └── main.js        # JavaScript
├── assets/
│   └── img/           # Images (à ajouter)
└── README.md          # Ce fichier
```

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

© 2025 Kader Belem. Tous droits réservés.

Ce portfolio est un projet personnel. Vous pouvez vous en inspirer mais merci de ne pas le copier tel quel.

## 🙏 Remerciements

- **Fonts** : [Google Fonts](https://fonts.google.com/)
- **Icons** : [Boxicons](https://boxicons.com/)
- **Inspiration** : Design system moderne et clean

---

**Made with ❤️ by Kader Belem**

*Dernière mise à jour : Février 2025*
