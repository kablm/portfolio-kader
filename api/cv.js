// /cv/?c=source : compte le téléchargement puis renvoie vers le PDF.
// c=site pour les boutons du portfolio, c=nom-entreprise pour un lien de candidature suivi.
const { redis, visitorHash, isBot, location, device, slug } = require("./_lib");

const PDF = "/assets/CV_Kader_Belem.pdf";
const KEEP_DAYS = 400;

async function count(req, source) {
    // Un même visiteur qui clique deux fois en 30 minutes ne compte qu'une fois.
    const first = await redis([["SET", `cv:vu:${visitorHash(req)}:${source}`, "1", "NX", "EX", 1800]]);
    if (!first || first[0] !== "OK") {
        return;
    }
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const event = JSON.stringify({ t: now.toISOString(), c: source, ...location(req), appareil: device(req) });
    await redis([
        ["INCR", "cv:total"],
        ["INCR", `cv:jour:${day}`],
        ["EXPIRE", `cv:jour:${day}`, KEEP_DAYS * 86400],
        ["HINCRBY", "cv:sources", source, 1],
        ["HSET", "cv:derniere", source, now.toISOString()],
        ["LPUSH", "cv:evenements", event],
        ["LTRIM", "cv:evenements", 0, 199]
    ]);
}

module.exports = async (req, res) => {
    const source = slug(req.query.c) || "direct";
    if (!isBot(req)) {
        try {
            await count(req, source);
        } catch (error) {
            // Le CV doit rester téléchargeable même si la base ne répond pas.
            console.error("Compteur du CV :", error.message);
        }
    }
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex");
    res.redirect(302, PDF);
};
