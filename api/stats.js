// Tableau de bord privé /stats/. Accès avec le mot de passe STATS_PASSWORD.
// GET : chiffres du CV, liens de candidature et messages. POST {nom} : crée un lien de candidature.
const { redis, redisConfig, visitorHash, sameSecret, header, slug } = require("./_lib");

const MAX_FAILS = 10;
const DAYS = 30;
// Sources utilisées par le site lui-même : pas des entreprises.
const SITE_SOURCES = new Set(["site", "jeu", "direct"]);

function lastDays(count) {
    const today = new Date();
    return Array.from({ length: count }, (_, index) => {
        const day = new Date(today);
        day.setUTCDate(today.getUTCDate() - (count - 1 - index));
        return day.toISOString().slice(0, 10);
    });
}

// HGETALL renvoie [clé1, valeur1, clé2, valeur2...]
function pairs(flat) {
    const result = {};
    for (let i = 0; i + 1 < (flat || []).length; i += 2) {
        result[flat[i]] = flat[i + 1];
    }
    return result;
}

function parse(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

const parseList = (list) => (list || []).map(parse).filter(Boolean);

// Vérifie le mot de passe. Renvoie true, ou envoie la réponse d'erreur et renvoie false.
async function authorize(req, res) {
    const password = process.env.STATS_PASSWORD;
    if (!password) {
        res.status(503).json({ erreur: "Le tableau de bord n'est pas configuré (STATS_PASSWORD manquant)." });
        return false;
    }
    // Limite les essais : 10 échecs bloquent 15 minutes.
    const failKey = `stats:echecs:${visitorHash(req)}`;
    try {
        const [fails] = (await redis([["GET", failKey]])) || [0];
        if (Number(fails) >= MAX_FAILS) {
            res.status(429).json({ erreur: "Trop d'essais. Réessaie dans 15 minutes." });
            return false;
        }
    } catch (error) {
        console.error("Tableau de bord :", error.message);
    }
    const given = header(req, "authorization").replace(/^Bearer\s+/i, "");
    if (sameSecret(given, password)) {
        return true;
    }
    try {
        await redis([["INCR", failKey], ["EXPIRE", failKey, 900]]);
    } catch (error) {
        console.error("Tableau de bord :", error.message);
    }
    res.status(401).json({ erreur: "Mot de passe incorrect." });
    return false;
}

async function createLink(req, res) {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const name = String(body.nom || "").trim().slice(0, 80);
    const source = slug(name);
    if (!source || SITE_SOURCES.has(source)) {
        return res.status(400).json({ erreur: "Donne le nom de l'entreprise (par exemple « Atos Cholet »)." });
    }
    const link = { nom: name, cree: new Date().toISOString() };
    try {
        const replies = await redis([["HSETNX", "cv:liens", source, JSON.stringify(link)], ["HGET", "cv:liens", source]]);
        if (!replies) {
            return res.status(503).json({ erreur: "La base de données n'est pas configurée." });
        }
        // Si le lien existait déjà, on renvoie celui-là.
        return res.status(replies[0] === 1 ? 201 : 200).json({ source, ...(parse(replies[1]) || link), chemin: `/cv/?c=${source}` });
    } catch (error) {
        console.error("Tableau de bord :", error.message);
        return res.status(502).json({ erreur: "La base de données ne répond pas." });
    }
}

async function readStats(res) {
    const configuration = { base: Boolean(redisConfig()), email: Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO) };
    const days = lastDays(DAYS);
    let replies;
    try {
        replies = await redis([
            ["GET", "cv:total"],
            ["MGET", ...days.map((day) => `cv:jour:${day}`)],
            ["HGETALL", "cv:sources"],
            ["HGETALL", "cv:derniere"],
            ["LRANGE", "cv:evenements", 0, 49],
            ["LRANGE", "contact:messages", 0, 49],
            ["HGETALL", "cv:liens"]
        ]);
    } catch (error) {
        console.error("Tableau de bord :", error.message);
        return res.status(502).json({ erreur: "La base de données ne répond pas.", configuration });
    }
    if (!replies) {
        return res.status(200).json({ configuration, cv: { total: 0, jours: [], sources: [], evenements: [] }, liens: [], messages: [] });
    }

    const [total, perDay, sources, last, events, messages, links] = replies;
    const counts = pairs(sources);
    const lastBySource = pairs(last);
    const created = pairs(links);

    // Liens créés depuis le tableau de bord + sources d'entreprise ouvertes sans avoir été créées ici.
    const companySources = new Set([...Object.keys(created), ...Object.keys(counts).filter((s) => !SITE_SOURCES.has(s))]);
    const allLinks = [...companySources].map((source) => {
        const info = parse(created[source]) || {};
        return { source, nom: info.nom || source, cree: info.cree || null, n: Number(counts[source]) || 0, derniere: lastBySource[source] || null };
    }).sort((a, b) => String(b.derniere || b.cree).localeCompare(String(a.derniere || a.cree)));

    return res.status(200).json({
        configuration,
        cv: {
            total: Number(total) || 0,
            jours: days.map((day, index) => ({ jour: day, n: Number(perDay?.[index]) || 0 })),
            sources: Object.entries(counts).map(([source, n]) => ({ source, n: Number(n), derniere: lastBySource[source] || null })),
            evenements: parseList(events)
        },
        liens: allLinks,
        messages: parseList(messages)
    });
}

module.exports = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex");
    if (req.method !== "GET" && req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ erreur: "Méthode non autorisée." });
    }
    if (!(await authorize(req, res))) {
        return undefined;
    }
    return req.method === "POST" ? createLink(req, res) : readStats(res);
};
