# Portfolio de Kader Belem

Portfolio d'un étudiant en BTS CIEL (Cybersécurité, Informatique et Réseaux, Électronique) qui cherche une alternance Bac+3 en administration systèmes, réseaux et cybersécurité pour la rentrée 2027, à Nantes, Angers ou Cholet.

Site en ligne : https://kaderbelem.com/

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
| `/stats/` | Tableau de bord privé, protégé par mot de passe (non indexé) |

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
├── stats/index.html          # Tableau de bord privé
├── api/                      # Fonctions Vercel : cv.js, contact.js, stats.js, candidatures.js (+ _lib.js partagé)
├── .well-known/security.txt  # Où signaler une faille (à renouveler avant le 1er novembre 2027)
├── css/style.css             # Styles de toutes les pages (thème clair)
├── css/stats.css             # Styles du tableau de bord
├── js/main.js                # Menu, homelab, compétences, projets, formulaire
├── js/stats.js               # Tableau de bord
├── jeu/                      # Version jeu du portfolio
├── assets/                   # CV en PDF, image de partage, icônes
├── tools/build_cv.py         # Génère le CV en PDF
├── tools/suivi-candidatures.gs # Script Google qui lit Gmail pour le suivi des candidatures
├── update_veille.py          # Met à jour la veille
├── vercel.json               # Réglages de Vercel (barre finale, /cv/, en-têtes de sécurité)
├── robots.txt                # Écarte /api/, /cv/ et /stats/ des moteurs de recherche
└── .github/workflows/update-veille.yml
```

Le site n'a ni framework ni étape de build. Chaque page est un fichier HTML qu'on modifie directement. Les fonctions de `api/` n'ont aucune dépendance et parlent à Redis et à Resend avec `fetch`.

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

`jeu/` présente le portfolio comme un jeu d'exploration. Chaque bâtiment ouvre une partie du parcours, et le CV est dans le coffre de la place centrale.

Le contenu n'est pas dupliqué. Au chargement, le jeu lit les pages du site (accueil, projets, expériences, compétences, veille, contact). Modifier une page met donc le jeu à jour. Garde les identifiants de section (`#projects`, `#experience`, `#skills`, `#about`, `#certifications`, `#veille`, `#contact`) et les classes lues par `loadContent()` dans `jeu/jeu.js`.

## Hébergement

Le site est hébergé sur Vercel, relié à ce dépôt GitHub. Vercel met en ligne chaque push sur `main`, y compris les commits de la veille.

`vercel.json` force la barre finale des adresses (`/jeu` devient `/jeu/`). Sans elle, les pages qui chargent des fichiers relatifs, comme `jeu/jeu.js`, ne les trouvent pas.

L'ancienne adresse https://kablm.github.io/portfolio-kader/ reste active. Un script en tête de chaque page renvoie le visiteur vers la même page sur kaderbelem.com. Si tu crées une page, copie ce script avec le reste du `<head>`, ainsi que celui de Vercel Web Analytics.

`vercel.json` envoie aussi les en-têtes de sécurité : Content-Security-Policy, anti-clickjacking, Permissions-Policy, Cross-Origin-Opener-Policy. La CSP n'autorise que les scripts du site, ceux de Credly, et le script de redirection ci-dessus, reconnu par son empreinte SHA-256. Si tu modifies ce script (par exemple pour un nouveau domaine), recalcule l'empreinte et remplace la valeur `sha256-…` dans `vercel.json` :

```bash
python -c "import re,hashlib,base64; s=re.search(r'<script>(.*?)</script>', open('index.html', encoding='utf-8').read(), re.S).group(1); print('sha256-' + base64.b64encode(hashlib.sha256(s.encode()).digest()).decode())"
```

Pour ajouter un service externe (police, script, cadre), ajoute son domaine à la bonne directive de la CSP, sinon le navigateur le bloque.

## Fonctions dynamiques

| Fonction | Ce qu'elle fait |
| --- | --- |
| `/cv/?c=source` (`api/cv.js`) | Affiche « Ouverture du CV… », puis le PDF. Le script de cette page envoie le signal de comptage (POST `/api/cv/`) ; les robots qui lisent la page sans l'exécuter ne comptent pas. Les boutons du site (`c=site`) et du jeu (`c=jeu`) mènent directement au PDF et envoient ce signal au clic. `c=nom-entreprise` sert aux liens de candidature : leur ouverture déclenche un email d'alerte. Un double clic ne compte qu'une fois, aucune adresse IP n'est stockée, et le cookie `kb_ignorer` du bouton « Ne pas compter mes visites » coupe le comptage. |
| `/api/contact/` (`api/contact.js`) | Reçoit le formulaire de contact, l'enregistre dans la base et l'envoie par email avec Resend. Un envoi est ignoré si le champ piège est rempli ou si le formulaire a été rempli en moins de 3 secondes. 5 messages par heure au maximum par visiteur. Un message qui contient un lien reste dans le tableau de bord sans être envoyé par email. |
| `/api/stats/` (`api/stats.js`) | Données du tableau de bord, création des liens de candidature et correction à la main du statut d'une candidature. Mot de passe obligatoire, 10 essais ratés bloquent 15 minutes. |
| `/api/candidatures/` (`api/candidatures.js`) | Reçoit chaque heure la liste des candidatures envoyée par le script Google, avec la clé `CANDIDATURES_SECRET`. La liste remplace la précédente, sauf les statuts corrigés à la main, qui sont gardés à part. |

### Suivi des candidatures

`tools/suivi-candidatures.gs` tourne dans le compte Google de Kader, sur script.google.com, et pas sur Vercel. Toutes les heures, il lit les conversations Gmail qui portent le libellé « Candidatures ». Pour chacune, il garde l'email envoyé par Kader, depuis Gmail ou contact@, et les réponses reçues. Il devine ensuite le statut :

- les accusés de réception et les messages d'absence sont ignorés ;
- « malheureusement », « pas donner suite » ou « autre candidat » donnent Refus ;
- « entretien », « disponibilités » ou « créneau » donnent Entretien ;
- toute autre réponse donne Réponse reçue.

Le texte cité de l'email d'origine n'est pas lu. Le tableau de bord affiche « À relancer » au bout de 10 jours sans réponse.

Seuls l'entreprise (devinée à partir du domaine du destinataire), l'objet, les dates, l'adresse d'envoi, le statut et le code du lien suivi (`/cv/?c=…`) sont envoyés au site. Le texte des emails reste dans Gmail.

Installation : colle le script dans un nouveau projet, ajoute la propriété de script `CANDIDATURES_SECRET` (même valeur que dans Vercel), puis exécute la fonction `installer`. Elle crée le déclenchement horaire et fait une première lecture.

Les visites des pages sont mesurées par Vercel Web Analytics (sans cookies), à consulter dans l'onglet Analytics du projet Vercel.

Variables à définir dans Vercel (Settings, Environment Variables, pour Production et Preview) :

| Variable | Rôle |
| --- | --- |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Base Upstash Redis, ajoutées automatiquement quand la base est reliée au projet |
| `RESEND_API_KEY` | Clé d'envoi Resend |
| `CONTACT_TO` | Adresse qui reçoit les messages du formulaire et les alertes. Les emails partent de contact@kaderbelem.com, domaine vérifié dans Resend |
| `STATS_PASSWORD` | Mot de passe du tableau de bord `/stats/` |
| `CANDIDATURES_SECRET` | Clé partagée avec le script Google du suivi des candidatures (une longue phrase au hasard) |

Sans base, le CV se télécharge quand même mais rien n'est compté. Sans Resend, les messages restent visibles dans le tableau de bord.

## Tester en local

Le jeu et certaines pages chargent du contenu avec `fetch`, qui ne fonctionne pas en `file://`. Lance un serveur à la racine du dépôt :

```bash
python -m http.server 8000
```

puis ouvre http://localhost:8000/. Ce serveur ne lance pas les fonctions de `api/`. Le comptage du CV, le formulaire de contact et `/stats/` ne marchent que sur Vercel, sur l'adresse d'aperçu d'une branche ou sur le site en ligne.

## Mettre à jour le CV

Le PDF proposé au téléchargement est généré. Il ne s'édite pas directement. Le contenu se modifie dans `tools/build_cv.py` :

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
