// Formulaire de contact : garde le message dans la base, puis l'envoie par email avec Resend.
const { redis, header, visitorHash, location } = require("./_lib");

const LIMIT_PER_HOUR = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value, max) {
    return String(value ?? "").trim().slice(0, max);
}

// Le site envoie du JSON ; sans JavaScript, le navigateur poste le formulaire et revient sur /contact/.
function reply(req, res, status, body) {
    const wantsJson = /application\/json/.test(header(req, "accept")) || /application\/json/.test(header(req, "content-type"));
    if (wantsJson) {
        return res.status(status).json(body);
    }
    return res.redirect(303, status === 200 ? "/contact/?envoye=1" : "/contact/?erreur=1");
}

async function sendEmail(message) {
    const key = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO;
    if (!key || !to) {
        return false;
    }
    const from = message.ville ? `\nDepuis : ${message.ville} (${message.pays})` : "";
    const response = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            from: process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>",
            to: [to],
            reply_to: message.email,
            subject: `Portfolio : message de ${message.nom}${message.origine === "jeu" ? " (version jeu)" : ""}`,
            text: `${message.message}\n\nEnvoyé par ${message.nom} <${message.email}>${from}`
        }),
        signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
        throw new Error(`Resend a répondu ${response.status} : ${(await response.text()).slice(0, 200)}`);
    }
    return true;
}

module.exports = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ erreur: "Méthode non autorisée." });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    // Champ piège caché : un humain le laisse vide, un robot le remplit. On fait semblant d'accepter.
    if (clean(body.site_web, 200)) {
        return reply(req, res, 200, { ok: true });
    }
    const message = {
        nom: clean(body.name, 100),
        email: clean(body.email, 200),
        message: clean(body.message, 5000),
        origine: body.origine === "jeu" ? "jeu" : "site"
    };
    if (message.nom.length < 2 || !EMAIL_PATTERN.test(message.email) || message.message.length < 10) {
        return reply(req, res, 400, { erreur: "Vérifiez votre nom, votre email et votre message (10 caractères minimum)." });
    }

    const saved = { t: new Date().toISOString(), ...message, ...location(req) };
    let stored = false;
    try {
        const limitKey = `contact:limite:${visitorHash(req)}`;
        const counts = await redis([["INCR", limitKey], ["EXPIRE", limitKey, 3600]]);
        if (counts && Number(counts[0]) > LIMIT_PER_HOUR) {
            return reply(req, res, 429, { erreur: "Trop de messages envoyés. Réessayez dans une heure." });
        }
        stored = Boolean(await redis([["LPUSH", "contact:messages", JSON.stringify(saved)], ["LTRIM", "contact:messages", 0, 499]]));
    } catch (error) {
        console.error("Contact (base) :", error.message);
    }

    let sent = false;
    try {
        sent = await sendEmail(saved);
    } catch (error) {
        console.error("Contact (email) :", error.message);
    }

    if (!stored && !sent) {
        return reply(req, res, 503, { erreur: "Le message n'a pas pu être envoyé. Écrivez-moi directement par email." });
    }
    return reply(req, res, 200, { ok: true });
};
