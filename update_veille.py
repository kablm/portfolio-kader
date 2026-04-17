#!/usr/bin/env python3
"""
update_veille.py
----------------
Script de mise à jour automatique de la section "Veille Technologique" du portfolio.
Récupère les flux RSS, sélectionne les 3 articles les plus pertinents des 14 derniers jours,
génère un résumé (via OpenAI si disponible, sinon extraction RSS propre),
puis injecte le HTML entre les balises commentaires dans index.html.

Usage :
    python update_veille.py [--html-file path/to/index.html] [--dry-run]

Secrets GitHub requis (optionnels) :
    OPENAI_API_KEY : clé API OpenAI pour les résumés enrichis
"""

import os
import re
import sys
import html
import logging
import textwrap
import argparse
from datetime import datetime, timezone, timedelta
from typing import Optional

import feedparser

# ── Configuration ──────────────────────────────────────────────────────────────

# Balises d'injection dans index.html (ne pas modifier sans adapter le HTML)
MARKER_START = "<!-- VEILLE_START -->"
MARKER_END   = "<!-- VEILLE_END -->"

# Fenêtre temporelle de sélection des articles
LOOKBACK_DAYS = 14

# Nombre d'articles à afficher
MAX_ARTICLES = 3

# Mots-clés de pertinence (pondération : plus c'est haut dans la liste, plus c'est prioritaire)
KEYWORDS = [
    # Cybersécurité — priorité haute
    "cybersécurité", "cyberattaque", "ransomware", "vulnérabilité", "cve",
    "patch", "zero-day", "zero day", "phishing", "malware", "siem", "soc",
    "anssi", "cisa", "pentest", "intrusion", "firewall", "pare-feu",
    # Réseaux / Infrastructure
    "réseau", "network", "vlan", "routeur", "switch", "dns", "dhcp",
    "vpn", "sd-wan", "bgp", "infrastructure", "datacenter", "cloud",
    # Systèmes
    "linux", "windows server", "active directory", "virtualisation",
    "proxmox", "docker", "kubernetes", "ansible", "devops", "sysadmin",
    # Général IT stratégique
    "sauvegarde", "backup", "incident", "mise à jour", "update", "rgpd",
    "conformité", "audit", "supervision", "monitoring", "prometheus",
]

# Flux RSS à surveiller (nom affiché, url)
RSS_FEEDS = [
    ("ZDNet Cybersécurité",    "https://www.zdnet.fr/feeds/rss/actualites/securite/"),
    ("ZDNet Systèmes",         "https://www.zdnet.fr/feeds/rss/actualites/"),
    ("Le Monde Informatique",  "https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml"),
    ("ANSSI Actualités",       "https://www.ssi.gouv.fr/feed/"),
    ("CERT-FR Alertes",        "https://www.cert.ssi.gouv.fr/feed/"),
    ("The Hacker News",        "https://feeds.feedburner.com/TheHackersNews"),
    ("Bleeping Computer",      "https://www.bleepingcomputer.com/feed/"),
    ("LinuxFr.org",            "https://linuxfr.org/news.atom"),
]

# ── Logging ────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Helpers ────────────────────────────────────────────────────────────────────

def parse_date(entry) -> Optional[datetime]:
    """Convertit la date d'un article feedparser en datetime UTC-aware."""
    for attr in ("published_parsed", "updated_parsed"):
        t = getattr(entry, attr, None)
        if t:
            try:
                return datetime(*t[:6], tzinfo=timezone.utc)
            except Exception:
                continue
    return None


def relevance_score(entry) -> int:
    """Score de pertinence basé sur les mots-clés dans titre + résumé."""
    text = " ".join([
        getattr(entry, "title", ""),
        getattr(entry, "summary", ""),
    ]).lower()

    score = 0
    for i, kw in enumerate(KEYWORDS):
        if kw in text:
            # Plus le mot-clé est tôt dans la liste, plus son poids est élevé
            weight = len(KEYWORDS) - i
            score += weight
    return score


def strip_html(raw: str) -> str:
    """Supprime les balises HTML et décode les entités."""
    clean = re.sub(r"<[^>]+>", " ", raw)
    clean = html.unescape(clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def truncate(text: str, max_chars: int = 400) -> str:
    """Tronque proprement sans couper un mot."""
    if len(text) <= max_chars:
        return text
    return textwrap.shorten(text, width=max_chars, placeholder="…")

# ── Collecte des articles ──────────────────────────────────────────────────────

def fetch_articles() -> list[dict]:
    """Récupère tous les articles des flux RSS et filtre par date."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
    collected = []

    for source_name, url in RSS_FEEDS:
        log.info(f"Lecture du flux : {source_name}")
        try:
            feed = feedparser.parse(url)
            if feed.bozo and feed.bozo_exception:
                log.warning(f"  → Flux malformé ({source_name}) : {feed.bozo_exception}")

            for entry in feed.entries:
                date = parse_date(entry)
                if date and date < cutoff:
                    continue  # trop ancien

                title   = strip_html(getattr(entry, "title", "Sans titre"))
                summary = strip_html(getattr(entry, "summary", getattr(entry, "description", "")))
                link    = getattr(entry, "link", "#")
                score   = relevance_score(entry)

                if score == 0:
                    continue  # aucun mot-clé trouvé, on ignore

                collected.append({
                    "title":       title,
                    "summary":     summary,
                    "link":        link,
                    "source":      source_name,
                    "date":        date,
                    "score":       score,
                })

        except Exception as e:
            log.error(f"  → Erreur lors de la lecture de {source_name} : {e}")

    log.info(f"Articles collectés et filtrés : {len(collected)}")
    return collected


def select_top(articles: list[dict], n: int = MAX_ARTICLES) -> list[dict]:
    """Sélectionne les n articles les plus pertinents, dédupliqués."""
    # Tri par score décroissant, puis date décroissante
    articles.sort(key=lambda a: (a["score"], a["date"] or datetime.min.replace(tzinfo=timezone.utc)), reverse=True)

    seen_titles = set()
    selected = []
    for art in articles:
        key = art["title"][:60].lower()
        if key in seen_titles:
            continue
        seen_titles.add(key)
        selected.append(art)
        if len(selected) >= n:
            break

    return selected

# ── Résumé / Points clés ───────────────────────────────────────────────────────

def summarize_with_openai(article: dict, api_key: str) -> list[str]:
    """Génère 3 points clés via l'API OpenAI (GPT-4o-mini)."""
    try:
        import urllib.request
        import json

        prompt = (
            f"Tu es un expert en cybersécurité et administration systèmes.\n"
            f"Voici un article : \"{article['title']}\"\n\n"
            f"Description : {truncate(article['summary'], 600)}\n\n"
            f"Génère exactement 3 points clés concis (1 phrase chacun) en français "
            f"pour un administrateur systèmes/réseaux débutant. "
            f"Réponds UNIQUEMENT avec les 3 points, séparés par '|||'."
        )

        payload = json.dumps({
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 300,
            "temperature": 0.4,
        }).encode()

        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())

        raw = data["choices"][0]["message"]["content"].strip()
        points = [p.strip() for p in raw.split("|||") if p.strip()]
        if len(points) == 3:
            return points

        log.warning("OpenAI n'a pas renvoyé exactement 3 points, fallback RSS.")
    except Exception as e:
        log.warning(f"OpenAI indisponible ({e}), fallback extraction RSS.")

    return extract_points_from_rss(article)


def extract_points_from_rss(article: dict) -> list[str]:
    """
    Extraction heuristique de 3 points clés depuis la description RSS.
    Découpe le texte en phrases et sélectionne les 3 les plus informatives.
    """
    text = article["summary"]
    if not text:
        return [
            f"Article publié par {article['source']}.",
            "Consulter le lien source pour les détails complets.",
            "Thématique : systèmes, réseaux ou cybersécurité.",
        ]

    # Découpage en phrases
    sentences = re.split(r"(?<=[.!?])\s+", text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 30]

    # Score chaque phrase par présence de mots-clés
    def sentence_score(s: str) -> int:
        sl = s.lower()
        return sum(1 for kw in KEYWORDS if kw in sl)

    sentences.sort(key=sentence_score, reverse=True)
    top = sentences[:3]

    # Compléter si moins de 3 phrases
    while len(top) < 3:
        top.append(f"Source : {article['source']} — voir l'article complet pour plus de détails.")

    return [truncate(s, 160) for s in top]

# ── Génération HTML ────────────────────────────────────────────────────────────

def format_date(dt: Optional[datetime]) -> str:
    if not dt:
        return "Date inconnue"
    months = ["jan.", "fév.", "mar.", "avr.", "mai", "juin",
              "juil.", "août", "sep.", "oct.", "nov.", "déc."]
    return f"{dt.day} {months[dt.month - 1]} {dt.year}"


def article_to_html(article: dict, points: list[str], index: int) -> str:
    """Génère le HTML d'une carte de veille."""
    title_escaped   = html.escape(article["title"])
    source_escaped  = html.escape(article["source"])
    link_escaped    = html.escape(article["link"])
    date_str        = format_date(article.get("date"))

    # Icône selon la catégorie détectée
    text_lower = (article["title"] + " " + article["summary"]).lower()
    if any(k in text_lower for k in ["cyberattaque", "ransomware", "vulnérabilité", "cve", "zero-day", "malware", "phishing"]):
        icon, tag_label, tag_class = "bx-shield-x", "Sécurité", "tag-red"
    elif any(k in text_lower for k in ["réseau", "network", "vlan", "routeur", "dns", "vpn", "bgp"]):
        icon, tag_label, tag_class = "bx-network-chart", "Réseau", "tag-blue"
    elif any(k in text_lower for k in ["linux", "windows server", "proxmox", "docker", "kubernetes", "virtualisation"]):
        icon, tag_label, tag_class = "bx-server", "Système", "tag-green"
    else:
        icon, tag_label, tag_class = "bx-news", "IT & Infra", "tag-orange"

    points_html = "\n".join(
        f'                        <li>{html.escape(p)}</li>'
        for p in points
    )

    return f"""
            <!-- Carte veille #{index + 1} : {source_escaped} -->
            <div class="project-card veille-card" data-veille-index="{index}">
                <div class="project-icon-wrapper veille-icon-wrapper veille-icon-{tag_class}">
                    <div class="project-icon">
                        <i class='bx {icon}'></i>
                    </div>
                </div>
                <div class="project-content">
                    <div class="project-tags">
                        <span class="project-tag veille-tag veille-{tag_class}">{tag_label}</span>
                        <span class="project-tag veille-date-tag">{date_str}</span>
                    </div>
                    <h3 class="project-title veille-title">
                        <a href="{link_escaped}" target="_blank" rel="noopener noreferrer" class="veille-title-link">
                            {title_escaped}
                        </a>
                    </h3>
                    <div class="veille-source">
                        <i class='bx bx-link-external'></i>
                        <a href="{link_escaped}" target="_blank" rel="noopener noreferrer">{source_escaped}</a>
                    </div>
                    <div class="veille-keypoints">
                        <h4 class="veille-keypoints-title">
                            <i class='bx bx-bulb'></i> À retenir
                        </h4>
                        <ul class="project-points veille-points">
{points_html}
                        </ul>
                    </div>
                    <div class="project-tech">
                        <span class="tech-badge">RSS</span>
                        <span class="tech-badge">{tag_label}</span>
                        <span class="tech-badge">{source_escaped}</span>
                    </div>
                </div>
            </div>"""


def build_html_block(articles_with_points: list[tuple]) -> str:
    """Assemble le bloc HTML complet à injecter."""
    update_date = datetime.now(timezone.utc).strftime("%d/%m/%Y à %Hh%M UTC")
    cards_html  = "".join(
        article_to_html(art, pts, i)
        for i, (art, pts) in enumerate(articles_with_points)
    )

    return f"""\
        <!-- Généré automatiquement par update_veille.py le {update_date} -->
        <!-- Ne pas modifier manuellement — sera écrasé à la prochaine exécution -->
        <div class="veille-meta">
            <p class="veille-update-info">
                <i class='bx bx-time-five'></i>
                Dernière mise à jour : <strong>{update_date}</strong>
                &mdash; Articles des {LOOKBACK_DAYS} derniers jours sélectionnés automatiquement.
            </p>
        </div>
        <div class="projects-grid veille-grid">
{cards_html}
        </div>"""

# ── Injection HTML ─────────────────────────────────────────────────────────────

def inject_into_html(html_path: str, block: str, dry_run: bool = False) -> bool:
    """
    Remplace le contenu entre MARKER_START et MARKER_END dans le fichier HTML.
    Préserve tout le reste du fichier intact.
    """
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        log.error(f"Fichier introuvable : {html_path}")
        return False

    if MARKER_START not in content:
        log.error(f"Balise '{MARKER_START}' introuvable dans {html_path}.")
        log.error("Ajoutez ces balises dans votre index.html pour délimiter la section veille.")
        return False

    if MARKER_END not in content:
        log.error(f"Balise '{MARKER_END}' introuvable dans {html_path}.")
        return False

    # Remplacement sécurisé entre les deux marqueurs
    pattern = re.compile(
        re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END),
        re.DOTALL
    )

    new_content = pattern.sub(
        f"{MARKER_START}\n{block}\n        {MARKER_END}",
        content,
        count=1,
    )

    if new_content == content:
        log.warning("Aucune modification détectée (contenu identique ou pattern non trouvé).")

    if dry_run:
        log.info("[DRY-RUN] Contenu qui serait injecté :\n" + block[:800] + "\n…")
        return True

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    log.info(f"✅ {html_path} mis à jour avec succès.")
    return True

# ── Point d'entrée ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Mise à jour automatique de la veille technologique.")
    parser.add_argument(
        "--html-file", default="index.html",
        help="Chemin vers le fichier index.html (défaut : index.html)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Affiche le HTML généré sans modifier le fichier"
    )
    args = parser.parse_args()

    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    use_openai = bool(openai_key)
    log.info(f"Mode résumé : {'OpenAI (GPT-4o-mini)' if use_openai else 'extraction RSS heuristique'}")

    # 1. Collecte
    raw_articles = fetch_articles()
    if not raw_articles:
        log.warning("Aucun article pertinent trouvé. Vérifiez les flux RSS et votre connexion.")
        sys.exit(0)

    # 2. Sélection
    top_articles = select_top(raw_articles, MAX_ARTICLES)
    log.info(f"Articles sélectionnés : {len(top_articles)}")
    for a in top_articles:
        log.info(f"  [{a['score']:3d}pts] {a['source']} — {a['title'][:70]}")

    # 3. Génération des points clés
    articles_with_points = []
    for art in top_articles:
        if use_openai:
            points = summarize_with_openai(art, openai_key)
        else:
            points = extract_points_from_rss(art)
        articles_with_points.append((art, points))

    # 4. Génération + injection HTML
    html_block = build_html_block(articles_with_points)
    success = inject_into_html(args.html_file, html_block, dry_run=args.dry_run)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
