// /cv/?c=source : compte le téléchargement puis renvoie vers le PDF.
// c=site pour les boutons du portfolio, c=nom-entreprise pour un lien de candidature suivi.
// Quand une entreprise ouvre son lien, un email d'alerte part tout de suite.
const { redis, visitorHash, isBot, location, device, slug, SITE_SOURCES, SITE_URL, parse, frenchDate, sendEmail } = require("./_lib");

const PDF = "/assets/CV_Kader_Belem.pdf";
const KEEP_DAYS = 400;

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
            "Si tu ne les as pas encore relancés, c'est le bon moment.",
            `Tableau de bord : ${SITE_URL}/stats/`
        ].join("\n")
    });
}

module.exports = async (req, res) => {
    const source = slug(req.query.c) || "direct";
    if (!isBot(req)) {
        try {
            const event = { t: new Date().toISOString(), c: source, ...location(req), appareil: device(req) };
            const counted = await count(req, source, event);
            if (counted && !SITE_SOURCES.has(source)) {
                await alert(source, event, counted);
            }
        } catch (error) {
            // Le CV doit rester téléchargeable même si la base ou l'email ne répondent pas.
            console.error("Compteur du CV :", error.message);
        }
    }
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex");
    res.redirect(302, PDF);
};
