// Reçoit la liste des candidatures envoyée toutes les heures par le script Google (tools/suivi-candidatures.gs).
// POST avec « Authorization: Bearer CANDIDATURES_SECRET ». La liste reçue remplace la précédente ;
// les statuts corrigés à la main (hash candidatures:manuel) ne sont jamais touchés ici.
const { redis, header, sameSecret, slug } = require("./_lib");

const MAX = 500;
const STATUTS = new Set(["entretien", "refus", "reponse", "attente"]);

const text = (value, max) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function isoDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Ne garde que les champs attendus, nettoyés. Renvoie null si la candidature est inutilisable.
function clean(item) {
    if (!item || typeof item !== "object") return null;
    const id = String(item.id || "");
    const envoyee = isoDate(item.envoyee);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || !envoyee) return null;
    return {
        id,
        entreprise: text(item.entreprise, 80) || "Entreprise inconnue",
        objet: text(item.objet, 140),
        envoyee,
        depuis: item.depuis === "contact" ? "contact" : "gmail",
        reponse: isoDate(item.reponse),
        statut: STATUTS.has(item.statut) ? item.statut : "attente",
        cv: slug(item.cv) || null
    };
}

module.exports = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex");
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ erreur: "Méthode non autorisée." });
    }
    const secret = process.env.CANDIDATURES_SECRET;
    if (!secret) {
        return res.status(503).json({ erreur: "CANDIDATURES_SECRET n'est pas configuré dans Vercel." });
    }
    if (!sameSecret(header(req, "authorization").replace(/^Bearer\s+/i, ""), secret)) {
        return res.status(401).json({ erreur: "Clé incorrecte." });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    if (!Array.isArray(body.candidatures) || body.candidatures.length > MAX) {
        return res.status(400).json({ erreur: `Envoie { candidatures: [...] } avec au plus ${MAX} éléments.` });
    }
    const list = body.candidatures.map(clean).filter(Boolean);
    const fields = list.flatMap((item) => [item.id, JSON.stringify(item)]);

    try {
        const replies = await redis([
            ["DEL", "candidatures"],
            ...(fields.length ? [["HSET", "candidatures", ...fields]] : []),
            ["SET", "candidatures:synchro", new Date().toISOString()]
        ]);
        if (!replies) {
            return res.status(503).json({ erreur: "La base de données n'est pas configurée." });
        }
    } catch (error) {
        console.error("Candidatures :", error.message);
        return res.status(502).json({ erreur: "La base de données ne répond pas." });
    }
    return res.status(200).json({ recues: list.length, ignorees: body.candidatures.length - list.length });
};
