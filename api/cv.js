// Compteur de téléchargements du CV.
// GET /cv/?c=source : courte page « Ouverture du CV… » dont le script signale l'ouverture puis affiche le PDF.
//   Les robots qui vérifient les liens (antivirus, messageries) lisent la page sans exécuter ce script : ils ne comptent pas.
// POST /api/cv/ {c} : compte l'ouverture, seulement pour un vrai navigateur venant du site.
//   c=site pour les boutons du portfolio, c=jeu pour le jeu, c=nom-entreprise pour un lien de candidature suivi.
// Quand une entreprise ouvre son lien, un email d'alerte part tout de suite.
const { redis, header, visitorHash, isBot, location, device, slug, SITE_SOURCES, SITE_URL, parse, frenchDate, sendEmail } = require("./_lib");

const PDF = "/assets/CV_Kader_Belem.pdf";
const KEEP_DAYS = 400;

// Page intermédiaire : sans script en ligne (CSP), le lien sert de secours sans JavaScript.
const PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>CV de Kader Belem</title>
<style>
body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #0f172a; font: 16px/1.5 system-ui, sans-serif; }
main { text-align: center; padding: 24px; }
p { margin: 8px 0; }
a { color: #0369a1; font-weight: 600; }
</style>
</head>
<body>
<main>
<p>Ouverture du CV de Kader Belem…</p>
<p><a href="${PDF}">Le CV ne s'affiche pas ? Ouvrir le PDF</a></p>
</main>
<script src="/js/cv-ouverture.js"></script>
</body>
</html>
`;

// Bouton « Ne pas compter mes visites » du tableau de bord : ce cookie marque le navigateur du propriétaire.
const isOwner = (req) => /(?:^|;\s*)kb_ignorer=1(?:;|$)/.test(header(req, "cookie"));

// Un navigateur envoie toujours sa langue, et ce signal doit venir du site lui-même.
function looksLikeBrowser(req) {
    if (isBot(req) || !header(req, "accept-language")) {
        return false;
    }
    const fetchSite = header(req, "sec-fetch-site");
    if (fetchSite && fetchSite !== "same-origin") {
        return false;
    }
    const origin = header(req, "origin");
    if (origin) {
        try {
            return new URL(origin).host === header(req, "host");
        } catch {
            return false;
        }
    }
    return true;
}

function readBody(req) {
    if (req.body && typeof req.body === "object") {
        return req.body;
    }
    try {
        return JSON.parse(req.body || "{}");
    } catch {
        return {};
    }
}

// Renvoie le nombre d'ouvertures de cette source, ou null si la visite n'est pas comptée.
async function count(req, source, event) {
    // Un même visiteur qui clique deux fois en 30 minutes ne compte qu'une fois.
    const first = await redis([["SET", `cv:vu:${visitorHash(req)}:${source}`, "1", "NX", "EX", 1800]]);
    if (!first || first[0] !== "OK") {
        return null;
    }
    const day = event.t.slice(0, 10);
    const replies = await redis([
        ["INCR", "cv:total"],
        ["INCR", `cv:jour:${day}`],
        ["EXPIRE", `cv:jour:${day}`, KEEP_DAYS * 86400],
        ["HINCRBY", "cv:sources", source, 1],
        ["HSET", "cv:derniere", source, event.t],
        ["LPUSH", "cv:evenements", JSON.stringify(event)],
        ["LTRIM", "cv:evenements", 0, 199],
        ["HGET", "cv:liens", source]
    ]);
    return { openings: Number(replies[3]), link: parse(replies[7]) };
}

async function alert(source, event, counted) {
    const name = counted.link?.nom || source;
    const place = [event.ville, event.pays].filter(Boolean).join(", ") || "inconnu";
    const which = counted.openings > 1 ? `(${counted.openings}e ouverture)` : "pour la première fois";
    await sendEmail({
        subject: `${name} vient d'ouvrir ton CV`,
        text: [
            `${name} a ouvert ton CV ${which}.`,
            "",
            `Quand : ${frenchDate(new Date(event.t))}`,
            `Où : ${place}`,
            `Appareil : ${event.appareil}`,
            "",
            "Pense à les relancer si ce n'est pas déjà fait.",
            `Tableau de bord : ${SITE_URL}/stats/`
        ].join("\n")
    });
}

module.exports = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex");

    if (req.method === "GET") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(PAGE);
    }
    if (req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ erreur: "Méthode non autorisée." });
    }

    const source = slug(readBody(req).c) || "direct";
    if (looksLikeBrowser(req) && !isOwner(req)) {
        try {
            const event = { t: new Date().toISOString(), c: source, ...location(req), appareil: device(req) };
            const counted = await count(req, source, event);
            if (counted && !SITE_SOURCES.has(source)) {
                await alert(source, event, counted);
            }
        } catch (error) {
            console.error("Compteur du CV :", error.message);
        }
    }
    return res.status(204).end();
};
