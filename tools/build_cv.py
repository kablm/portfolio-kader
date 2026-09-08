#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Génère assets/CV_Kader_Belem.pdf.

Le CV tient sur une page : l'interlignage est resserré automatiquement
jusqu'à ce que le contenu rentre, il n'y a donc rien à ajuster à la main
après avoir ajouté une expérience.

    pip install -r tools/requirements.txt
    python tools/build_cv.py

Pour modifier le CV, éditer les données ci-dessous (PROFIL, FORMATION,
COMPETENCES, EXPERIENCES...), puis relancer le script.

Charte reprise du document d'origine : A4, marges 50 pt, bandeau titre
#1F4E79, intitulés de section Calibri-Bold 11 pt soulignés d'un filet
#2E75B6, corps Calibri 9,5 pt #1A1A1A, libellés en gras #2E75B6,
entreprises en italique #555555, puces Times 10 pt.
"""
import argparse
import os
import sys
import tempfile

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BADGES = os.path.join(HERE, "badges")
DEFAULT_OUT = os.path.join(ROOT, "assets", "CV_Kader_Belem.pdf")

PW, PH = A4
L, R = 50.0, 545.2
BOTTOM_LIMIT = 792.0          # au-delà, le contenu passerait sur une 2e page

BAND    = HexColor("#1F4E79")
RULE    = HexColor("#2E75B6")
LABEL   = HexColor("#2E75B6")
BODY    = HexColor("#1A1A1A")
ITALIC  = HexColor("#555555")
ON_BAND = HexColor("#B8D4EA")
LINKCOL = HexColor("#7EC8E3")
WHITE   = HexColor("#FFFFFF")

# Calibri sous Windows ; Carlito (clone libre aux mêmes métriques) ailleurs.
FONT_CANDIDATES = {
    "Calibri":        ["C:/Windows/Fonts/calibri.ttf",
                       "/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf",
                       "/usr/share/fonts/truetype/carlito/Carlito-Regular.ttf"],
    "Calibri-Bold":   ["C:/Windows/Fonts/calibrib.ttf",
                       "/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf",
                       "/usr/share/fonts/truetype/carlito/Carlito-Bold.ttf"],
    "Calibri-Italic": ["C:/Windows/Fonts/calibrii.ttf",
                       "/usr/share/fonts/truetype/crosextra/Carlito-Italic.ttf",
                       "/usr/share/fonts/truetype/carlito/Carlito-Italic.ttf"],
}


def register_fonts():
    for name, paths in FONT_CANDIDATES.items():
        for p in paths:
            if os.path.exists(p):
                pdfmetrics.registerFont(TTFont(name, p))
                break
        else:
            sys.exit("Police introuvable pour %s.\nInstaller Calibri (Windows) ou "
                     "Carlito (Linux : apt install fonts-crosextra-carlito),\n"
                     "ou compléter FONT_CANDIDATES en haut de ce fichier." % name)


# ---------------------------------------------------------------- contenu ---

URL = "https://kablm.github.io/portfolio-kader"

TITRE   = "Administrateur Systèmes et Réseaux — Alternance Bac+3 2027"
CONTACT = ("44400 Rezé / Nantes / Angers / Cholet  •  06 61 40 29 98  •  "
           "kaderbelem428@gmail.com  •  Permis B")

PROFIL = ("Étudiant en BTS CIEL spécialisé en cybersécurité, réseaux et administration système. Double "
          "compétence développement (BTS SIO SLAM) + infrastructure, acquise à travers 7 stages en support, "
          "configuration réseau, administration Windows Server/Linux, supervision de sécurité et développement "
          "web. Recherche une alternance Bac+3 en administration systèmes, réseaux et cybersécurité pour "
          "septembre 2027 — Nantes, Angers, Cholet.")

FORMATION = [
    ("2025–2027", "BTS CIEL (Cybersécurité, Informatique et Réseaux, Électronique) — Lycée de l'Hyrôme, Chemillé"),
    ("2023–2025", "BTS SIO option SLAM — Lycée La Colinière, Nantes"),
    ("2020–2023", "Bac Pro Systèmes Numériques option B — Lycée François Arago, Nantes"),
]

COMPETENCES = [
    ("Administration Système :", "Windows Server 2019/2022, Active Directory, GPO, Microsoft Intune, "
                                 "Red Hat Enterprise Linux, Ubuntu Server, virtualisation (Proxmox VE, VMware, VirtualBox)"),
    ("Réseaux & Sécurité :", "Architecture LAN/WAN, adressage IP, DHCP, DNS, firewalling, SIEM/XDR (Wazuh), "
                             "durcissement SELinux, OWASP Top 10, câblage réseau"),
    ("Développement & Scripting :", "Python (automatisation), SQL, PHP, architecture MVC, Git, Bash"),
    ("Exploitation & Outils :", "Docker, GLPI (gestion de parc), MobaXterm/SSH, support utilisateurs, "
                                "maintenance corrective"),
]

CERTIFS = [
    ("linux-unhatched.png",  "Linux Unhatched",   "Cisco Networking Academy — Verified"),
    ("networking-basics.png", "Networking Basics", "Cisco Networking Academy — Verified"),
]

EXPERIENCES = [
    ("2026", "Stage Cybersécurité — ", "Petroci Holding, Abidjan, Côte d'Ivoire", [
        "Déploiement et supervision d'un SIEM/XDR Wazuh : enrôlement des agents, validation de la chaîne de collecte",
        "Durcissement du manager : ouverture contrôlée des flux (firewall-cmd), SELinux maintenu actif via semanage",
        "Intégration Microsoft Defender TVM : application Entra ID, script Python OAuth 2.0, règle de détection",
        "Anneaux de mise à jour Windows (Intune), administration de serveurs RHEL, poste SIP sur Alcatel OmniPCX",
    ]),
    ("2025", "Stage Développeur Web — ", "Chambre de Commerce de Konya, Turquie", [
        "Développement application web MVC (analyse besoins, conception BDD, interface HTML/CSS/PHP)",
        "Collaboration en contexte international",
    ]),
    ("2024", "Stage Développeur Web — ", "Aube Multitech, Montrouge", [
        "Création/optimisation sites web, amélioration UX/UI, maintenance corrective",
    ]),
    ("2023", "Stage Technicien Informatique — ", "Espaces Mobile, Nantes", [
        "Dépannage hardware/software, configuration réseau, installation matériel, gestion relation client",
    ]),
    ("2023", "Stage Technicien Support — ", "Services 111, Nantes", [
        "Réparation/maintenance postes de travail, installation produits numériques, intervention site client",
    ]),
    ("2021", "Stage Développeur Web — ", "Delia Technologies, Nantes", [
        "Développement web, correction bugs, versionnage Git",
    ]),
    ("2020", "Stage Technicien Réseaux — ", "Lycée Aristide Briand, Saint-Nazaire", [
        "Configuration réseau local (IP, câblage, partages), Active Directory, sécurisation postes clients",
    ]),
]

LANGUES = [
    ("Langues :",  "Français (langue maternelle), Anglais B2 (écrit et oral)"),
    ("Intérêts :", "Voyages Europe, Musculation, Veille technologique IT, Musique"),
]


# ------------------------------------------------------------------ rendu ---

def wrap(c, text, font, size, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if c.stringWidth(trial, font, size) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def render(path, s=1.0):
    """Dessine le CV avec un facteur d'espacement s ; renvoie le bas du contenu."""
    c = canvas.Canvas(path, pagesize=A4)
    y = [0.0]

    def at(top):
        return PH - top

    # bandeau
    c.setFillColor(BAND)
    c.rect(L, at(143.4), R - L, 143.4 - 40.0, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.setFont("Calibri-Bold", 26)
    c.drawString(68.1, at(78.0), "KADER BELEM")
    c.setFillColor(ON_BAND)
    c.setFont("Calibri", 12)
    c.drawString(68.1, at(97.5), TITRE)
    c.setFont("Calibri", 9)
    c.drawString(68.1, at(113.5), CONTACT)
    c.setFillColor(LINKCOL)
    c.drawString(68.1, at(126.5), "kablm.github.io/portfolio-kader")
    w = c.stringWidth("kablm.github.io/portfolio-kader", "Calibri", 9)
    c.setStrokeColor(LINKCOL)
    c.setLineWidth(0.6)
    c.line(68.1, at(129.6), 68.1 + w, at(129.6))
    c.linkURL(URL, (68.1, at(130.5), 68.1 + w, at(118.0)), relative=0)

    y[0] = 175.2

    def section(title):
        c.setFillColor(BAND)
        c.setFont("Calibri-Bold", 11)
        c.drawString(L, at(y[0]), title)
        c.setStrokeColor(RULE)
        c.setLineWidth(0.8)
        c.line(L, at(y[0] + 5.7), R, at(y[0] + 5.7))
        y[0] += 20.4 * s

    def para(text, size=9.5, lead=11.6):
        c.setFillColor(BODY)
        c.setFont("Calibri", size)
        for ln in wrap(c, text, "Calibri", size, R - L):
            c.drawString(L, at(y[0]), ln)
            y[0] += lead

    def labelled(label, text, size=9.5, lead=11.6):
        c.setFillColor(LABEL)
        c.setFont("Calibri-Bold", size)
        c.drawString(L, at(y[0]), label)
        off = c.stringWidth(label + " ", "Calibri-Bold", size)
        c.setFillColor(BODY)
        c.setFont("Calibri", size)
        first = True
        for ln in wrap(c, text, "Calibri", size, R - L - off):
            c.drawString(L + (off if first else 0), at(y[0]), ln)
            y[0] += lead
            first = False

    section("PROFIL")
    para(PROFIL)
    y[0] += 10.0 * s

    section("FORMATION")
    for date, txt in FORMATION:
        c.setFillColor(LABEL)
        c.setFont("Calibri-Bold", 9.5)
        c.drawString(L, at(y[0]), date)
        c.setFillColor(BODY)
        c.setFont("Calibri", 9.5)
        c.drawString(97.6, at(y[0]), txt)
        y[0] += 14.6 * s
    y[0] += 7.0 * s

    section("COMPÉTENCES TECHNIQUES")
    for lab, txt in COMPETENCES:
        labelled(lab, txt)
        y[0] += 1.5 * s
    y[0] += 8.0 * s

    section("CERTIFICATIONS")
    badge_top = y[0] + 3.0
    for i, (img, name, issuer) in enumerate(CERTIFS):
        x = L if i == 0 else 294.0
        path_img = os.path.join(BADGES, img)
        if os.path.exists(path_img):
            c.drawImage(path_img, x, at(badge_top + 45.0), 45, 45, mask="auto")
        c.setFillColor(BODY)
        c.setFont("Calibri-Bold", 9.5)
        c.drawString(x + 54, at(badge_top + 14.8), name)
        c.setFillColor(ITALIC)
        c.setFont("Calibri-Italic", 8.5)
        c.drawString(x + 54, at(badge_top + 26.4), issuer)
    y[0] = badge_top + 45.0 + 14.0 * s

    section("EXPÉRIENCES PROFESSIONNELLES")
    for date, role, org, bullets in EXPERIENCES:
        c.setFillColor(LABEL)
        c.setFont("Calibri-Bold", 9.5)
        c.drawString(L, at(y[0]), date)
        c.setFillColor(BODY)
        c.setFont("Calibri-Bold", 9.5)
        c.drawString(73.7, at(y[0]), role)
        off = 73.7 + c.stringWidth(role, "Calibri-Bold", 9.5)
        c.setFillColor(ITALIC)
        c.setFont("Calibri-Italic", 9.5)
        c.drawString(off, at(y[0]), org)
        y[0] += 13.3 * s
        for b in bullets:
            c.setFillColor(BODY)
            c.setFont("Times-Roman", 10)
            c.drawString(61.1, at(y[0]), "\u2022")
            c.setFont("Calibri", 9)
            for ln in wrap(c, b, "Calibri", 9, R - 72.1):
                c.drawString(72.1, at(y[0]), ln)
                y[0] += 12.2 * s
        y[0] += 4.4 * s
    y[0] += 4.0 * s

    section("LANGUES & CENTRES D'INTÉRÊT")
    for lab, txt in LANGUES:
        labelled(lab, txt, lead=13.6 * s)

    c.showPage()
    c.save()
    return y[0]


def main():
    ap = argparse.ArgumentParser(description="Génère le CV en PDF.")
    ap.add_argument("-o", "--out", default=DEFAULT_OUT,
                    help="fichier de sortie (défaut : assets/CV_Kader_Belem.pdf)")
    args = ap.parse_args()

    register_fonts()

    # Essais successifs dans un fichier jetable jusqu'à tenir sur une page.
    probe = os.path.join(tempfile.gettempdir(), "_cv_probe.pdf")
    scale = 1.0
    for _ in range(40):
        if render(probe, scale) <= BOTTOM_LIMIT:
            break
        scale -= 0.02
    else:
        print("Attention : contenu trop long, le CV risque de déborder sur une 2e page.",
              file=sys.stderr)
    try:
        os.remove(probe)
    except OSError:
        pass

    bottom = render(args.out, scale)
    print("%s\nespacement %.2f, bas du contenu %.1f pt (limite %.0f)"
          % (args.out, scale, bottom, BOTTOM_LIMIT))


if __name__ == "__main__":
    main()
