# Portfolio de Kader Belem

Portfolio d'un étudiant en BTS CIEL (Cybersécurité, Informatique et Réseaux, Électronique) qui cherche une alternance Bac+3 en administration systèmes, réseaux et cybersécurité pour la rentrée 2027, à Nantes, Angers ou Cholet.

Site en ligne : https://portfolio-kader-ten.vercel.app/

## Pages

Chaque partie du portfolio a sa propre page. Le menu du haut mène à chacune ; sur téléphone, il devient un menu burger.

| Adresse | Contenu |
| --- | --- |
| `/` | Présentation, fiche alternance et homelab cliquable |
| `/projets/` | Les 4 projets du homelab, avec filtres et fenêtre de détail |
| `/experiences/` | Le stage chez Petroci en étude de cas, puis les 6 stages précédents |
| `/competences/` | Les outils reliés à leurs preuves, le parcours, les formations et les badges Credly |
| `/veille/` | La veille technologique, mise à jour automatiquement |
| `/contact/` | Coordonnées et formulaire de contact |
| `/github/` | Les dépôts GitHub |
| `/jeu/` | Le portfolio sous forme de jeu en pixel art |

Les anciens liens de la version une page (`/#projects`, `/#contact`…) redirigent vers la bonne page.

## Structure du dépôt

```
├── index.html                # Accueil
├── projets/index.html
├── experiences/index.html
├── competences/index.html
├── veille/index.html         # Réécrite par update_veille.py
├── contact/index.html
├── github/index.html
├── css/style.css             # Styles de toutes les pages (thème clair)
├── js/main.js                # Menu, homelab, compétences, projets, formulaire
├── jeu/                      # Version jeu du portfolio
├── assets/                   # CV en PDF, image de partage, icônes
├── tools/build_cv.py         # Génère le CV en PDF
├── update_veille.py          # Met à jour la veille
├── vercel.json               # Réglages de Vercel (barre finale des adresses, en-têtes)
└── .github/workflows/update-veille.yml
```

Le site n'a ni framework ni étape de build : chaque page est un fichier HTML qu'on modifie directement.

## Modifier le contenu

- **Menu et pied de page.** Ils sont recopiés dans chaque page. Pour ajouter une page ou changer un lien, modifie les 7 fichiers `index.html`.
- **Ajouter un projet.** Dans `projets/index.html`, copie une `.project-card`. Le texte de la fenêtre de détail va dans `.project-details-hidden`, le résultat mis en avant dans `.project-result`.
- **Ajouter un stage.** Dans `experiences/index.html`, copie un bloc `<details class="xp xp-row">`.
- **Ajouter une compétence.** Dans `competences/index.html`, ajoute un bouton `.skill-chip` avec `data-skill="Nom"`, puis ses preuves dans le JSON `#skillProofsData`. Le chiffre affiché sur le bouton se calcule à partir de ce JSON.
- **Homelab de l'accueil.** Le texte de chaque machine est dans le JSON `#homelabData` de `index.html`. Le bouton « Voir le projet » ouvre `projets/?projet=Nom du projet` avec la fenêtre du projet déjà ouverte.

## Veille automatique

`update_veille.py` lit plusieurs flux RSS, note les articles des 14 derniers jours selon une liste de mots-clés et garde les 3 mieux notés. Il réécrit la zone entre `<!-- VEILLE_START -->` et `<!-- VEILLE_END -->` de `veille/index.html`. Chaque ligne affiche la date, le thème, le titre, la source et les mots-clés trouvés. Si le secret `OPENAI_API_KEY` est défini, il ajoute un résumé d'une phrase.

Le workflow `.github/workflows/update-veille.yml` lance le script le 1er et le 15 de chaque mois, puis commite `veille/index.html`.

Pour l'essayer en local sans modifier la page :

```bash
pip install feedparser==6.0.11
python update_veille.py --dry-run
```

## Version jeu

`jeu/` présente le portfolio comme un jeu d'exploration : chaque bâtiment ouvre une partie du parcours, et le CV est dans le coffre de la place centrale.

Le contenu n'est pas dupliqué : au chargement, le jeu lit les pages du site (accueil, projets, expériences, compétences, veille, contact). Modifier une page met donc le jeu à jour. Garde les identifiants de section (`#projects`, `#experience`, `#skills`, `#about`, `#certifications`, `#veille`, `#contact`) et les classes lues par `loadContent()` dans `jeu/jeu.js`.

## Hébergement

Le site est hébergé sur Vercel, relié à ce dépôt GitHub. Chaque push sur `main` est mis en ligne automatiquement, y compris les commits de la veille.

`vercel.json` force la barre finale des adresses (`/jeu` devient `/jeu/`). Sans elle, les pages qui chargent des fichiers relatifs, comme `jeu/jeu.js`, ne les trouvent pas.

L'ancienne adresse https://kablm.github.io/portfolio-kader/ reste active : un script en tête de chaque page renvoie le visiteur vers la même page sur Vercel. Si tu crées une page, copie ce script avec le reste du `<head>`.

## Tester en local

Le jeu et certaines pages chargent du contenu avec `fetch`, qui ne fonctionne pas en `file://`. Lance un serveur à la racine du dépôt :

```bash
python -m http.server 8000
```

puis ouvre http://localhost:8000/.

## Mettre à jour le CV

Le PDF proposé au téléchargement est généré : il ne s'édite pas directement. Le contenu se modifie dans `tools/build_cv.py` :

```bash
pip install -r tools/requirements.txt
python tools/build_cv.py
```

Le script réécrit `assets/CV_Kader_Belem.pdf` et resserre l'interlignage au besoin pour que le CV tienne sur une page. Voir `tools/README.md`.

## Technologies

HTML, CSS et JavaScript sans framework, Python pour la veille et le CV, GitHub Actions pour la mise à jour planifiée, Vercel pour l'hébergement. Polices Syne et DM Sans (Google Fonts), icônes Boxicons.

## Licence

© 2026 Kader Belem. Tous droits réservés.

Ce portfolio est un projet personnel. Vous pouvez vous en inspirer, mais merci de ne pas le copier tel quel.
