# tools

## build_cv.py

Génère `assets/CV_Kader_Belem.pdf`, le CV proposé au téléchargement sur le
portfolio.

```bash
pip install -r tools/requirements.txt
python tools/build_cv.py
```

Le contenu du CV est écrit en clair dans le script (`PROFIL`, `FORMATION`,
`COMPETENCES`, `CERTIFS`, `EXPERIENCES`, `LANGUES`). Pour ajouter un stage,
il suffit d'ajouter une entrée à `EXPERIENCES` et de relancer.

**Le CV tient toujours sur une page** : le script réessaie le rendu en
resserrant l'interlignage de 2 % à chaque tour jusqu'à ce que le contenu
rentre, et prévient sur la sortie d'erreur s'il n'y arrive pas. Il n'y a
donc aucun réglage manuel à faire après une modification.

### Polices

La charte du CV utilise **Calibri**. Le script la cherche dans
`C:/Windows/Fonts`, puis se rabat sur **Carlito** (clone libre aux mêmes
métriques) sous Linux :

```bash
sudo apt install fonts-crosextra-carlito
```

Si aucune n'est trouvée, le script s'arrête avec un message explicite
plutôt que de produire un PDF avec une police de substitution.

### badges/

Les deux badges Cisco Networking Academy affichés dans la section
Certifications. Ils sont intégrés au PDF à 45 × 45 pt.
