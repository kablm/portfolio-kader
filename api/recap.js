// Résumé de la semaine par email, lancé chaque lundi par Vercel Cron ("crons" dans vercel.json).
// Vercel envoie automatiquement "Authorization: Bearer <CRON_SECRET>" quand la variable existe.
const { redis, header, sameSecret, SITE_SOURCES, SITE_URL, parse, lastDays, frenchDate, sendEmail } = require("./_lib");

const WEEK = 7 * 86400000;

// HGETALL renvoie [clé1, valeur1, clé2, valeur2...]
function pairs(flat) {
    const result = {};
    for (let i = 0; i + 1 < (flat || []).length; i += 2) {
        result[flat[i]] = flat[i + 1];
    }
    return result;
}

const plural = (n, singular, pluralForm = `${singular}s`) => `${n} ${n > 1 ? pluralForm : singular}`;
const dayMonth = (iso) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" });

function buildRecap(data, now) {
    const counts = data.perDay.map((n) => Number(n) || 0);
    const sum = (list) => list.reduce((total, n) => total + n, 0);
    const thisWeek = sum(counts.slice(7));
    const lastWeek = sum(counts.slice(0, 7));
    const isRecent = (iso) => iso && now - new Date(iso) < WEEK;

    // Ouvertures de liens de candidature ces 7 derniers jours (événements du plus récent au plus ancien).
    const opened = new Map();
    for (const event of data.events) {
        if (!isRecent(event.t) || SITE_SOURCES.has(event.c)) continue;
        const entry = opened.get(event.c) || { n: 0, last: event.t };
        entry.n += 1;
        opened.set(event.c, entry);
    }
    const nameOf = (source) => data.links[source]?.nom || source;

    // Liens créés il y a 7 jours ou plus et jamais ouverts.
    const followUp = Object.entries(data.links)
        .filter(([source, info]) => !Number(data.totals[source]) && info.cree && now - new Date(info.cree) >= WEEK);
    const messages = data.messages.filter((message) => isRecent(message.t));

    const lines = [
        "Bonjour,",
        "",
        "Voici ce qui s'est passé sur ton portfolio ces 7 derniers jours.",
        "",
        `CV téléchargé ${plural(thisWeek, "fois", "fois")} (${lastWeek} la semaine d'avant).`,
        ""
    ];
    if (opened.size) {
        lines.push("Candidatures où ton CV a été ouvert :");
        for (const [source, entry] of opened) {
            lines.push(`- ${nameOf(source)} : ${plural(entry.n, "fois", "fois")}, la dernière le ${frenchDate(new Date(entry.last))}`);
        }
    } else {
        lines.push("Aucune entreprise n'a ouvert ton CV cette semaine.");
    }
    if (followUp.length) {
        lines.push("", "À relancer (CV pas encore ouvert, lien envoyé il y a 7 jours ou plus) :");
        for (const [source, info] of followUp) {
            lines.push(`- ${nameOf(source)}, lien créé le ${dayMonth(info.cree)}`);
        }
    }
    lines.push("", messages.length
        ? `Messages reçus : ${messages.length} (${messages.map((message) => message.nom).join(", ")})`
        : "Aucun message reçu.");
    lines.push("", `Tableau de bord : ${SITE_URL}/stats/`);

    const openedLabel = `${opened.size} candidature${opened.size > 1 ? "s" : ""} ouverte${opened.size > 1 ? "s" : ""}`;
    return {
        subject: `Ton résumé de la semaine : ${plural(thisWeek, "téléchargement")}, ${openedLabel}`,
        text: lines.join("\n"),
        summary: { telechargements: thisWeek, candidaturesOuvertes: opened.size, aRelancer: followUp.length, messages: messages.length }
    };
}

module.exports = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex");
    const secret = process.env.CRON_SECRET;
    if (!secret) {
        return res.status(503).json({ erreur: "Le résumé n'est pas configuré (CRON_SECRET manquant)." });
    }
    if (!sameSecret(header(req, "authorization").replace(/^Bearer\s+/i, ""), secret)) {
        return res.status(401).json({ erreur: "Non autorisé." });
    }

    let replies;
    try {
        replies = await redis([
            ["MGET", ...lastDays(14).map((day) => `cv:jour:${day}`)],
            ["HGETALL", "cv:liens"],
            ["HGETALL", "cv:sources"],
            ["LRANGE", "cv:evenements", 0, 199],
            ["LRANGE", "contact:messages", 0, 49]
        ]);
    } catch (error) {
        console.error("Résumé :", error.message);
        return res.status(502).json({ erreur: "La base de données ne répond pas." });
    }
    if (!replies) {
        return res.status(503).json({ erreur: "La base de données n'est pas configurée." });
    }

    const [perDay, linksFlat, totalsFlat, events, messages] = replies;
    const links = Object.fromEntries(Object.entries(pairs(linksFlat)).map(([source, value]) => [source, parse(value) || {}]));
    const recap = buildRecap({
        perDay: perDay || [],
        links,
        totals: pairs(totalsFlat),
        events: (events || []).map(parse).filter(Boolean),
        messages: (messages || []).map(parse).filter(Boolean)
    }, Date.now());

    try {
        const sent = await sendEmail({ subject: recap.subject, text: recap.text });
        return res.status(200).json({ envoye: sent, ...recap.summary });
    } catch (error) {
        console.error("Résumé (email) :", error.message);
        return res.status(502).json({ erreur: "L'email n'a pas pu partir.", ...recap.summary });
    }
};
