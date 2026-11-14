// Outils partagés par les fonctions de api/. Le préfixe "_" empêche Vercel d'en faire une route.
const crypto = require("node:crypto");

// Upstash installé depuis Vercel fournit KV_REST_API_*, un compte Upstash direct fournit UPSTASH_REDIS_REST_*.
function redisConfig() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    return url && token ? { url, token } : null;
}

// Envoie plusieurs commandes Redis en une requête. Renvoie null si la base n'est pas configurée.
async function redis(commands) {
    const config = redisConfig();
    if (!config) {
        return null;
    }
    const response = await fetch(`${config.url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(commands),
        signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) {
        throw new Error(`Redis a répondu ${response.status}`);
    }
    return (await response.json()).map((reply) => {
        if (reply.error) {
            throw new Error(`Redis : ${reply.error}`);
        }
        return reply.result;
    });
}

function header(req, name) {
    const value = req.headers[name];
    return Array.isArray(value) ? value[0] : value || "";
}

// Empreinte du visiteur pour la journée : l'adresse IP n'est jamais stockée telle quelle.
function visitorHash(req) {
    const ip = header(req, "x-forwarded-for").split(",")[0].trim() || header(req, "x-real-ip");
    const day = new Date().toISOString().slice(0, 10);
    const salt = process.env.HASH_SALT || redisConfig()?.token || "portfolio";
    return crypto.createHash("sha256").update(`${salt}|${day}|${ip}|${header(req, "user-agent")}`).digest("hex").slice(0, 32);
}

// Robots et aperçus de liens (LinkedIn, WhatsApp, Slack...) : ils ouvrent le lien sans être un recruteur.
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|skype|curl|wget|python-requests|headless|lighthouse/i;

function isBot(req) {
    const ua = header(req, "user-agent");
    return !ua || BOT_PATTERN.test(ua);
}

// Lieu approximatif fourni par Vercel à partir de l'IP.
function location(req) {
    const city = header(req, "x-vercel-ip-city");
    let decodedCity = "";
    try {
        decodedCity = decodeURIComponent(city);
    } catch {
        decodedCity = city;
    }
    return { ville: decodedCity, pays: header(req, "x-vercel-ip-country") };
}

function device(req) {
    return /mobi|android|iphone|ipad/i.test(header(req, "user-agent")) ? "mobile" : "ordinateur";
}

// "Capgemini Nantes" devient "capgemini-nantes" : sert de nom de source dans les liens suivis.
function slug(value) {
    return String(value || "")
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        .slice(0, 40);
}

// Adresse publique du site, pour les liens dans les emails.
const SITE_URL = process.env.SITE_URL || "https://kaderbelem.com";

// Sources utilisées par le site lui-même : tout le reste est un lien de candidature.
const SITE_SOURCES = new Set(["site", "jeu", "direct"]);

function parse(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

// Les `count` derniers jours (UTC), du plus ancien au plus récent, au format AAAA-MM-JJ.
function lastDays(count) {
    const today = new Date();
    return Array.from({ length: count }, (_, index) => {
        const day = new Date(today);
        day.setUTCDate(today.getUTCDate() - (count - 1 - index));
        return day.toISOString().slice(0, 10);
    });
}

// Date lisible à l'heure de Paris, pour les emails.
function frenchDate(date) {
    return date.toLocaleString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

// Envoie un email à CONTACT_TO avec Resend. Renvoie false si Resend n'est pas configuré.
async function sendEmail({ subject, text, replyTo }) {
    const key = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO;
    if (!key || !to) {
        return false;
    }
    const response = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            from: process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>",
            to: [to],
            ...(replyTo ? { reply_to: replyTo } : {}),
            subject,
            text
        }),
        signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
        throw new Error(`Resend a répondu ${response.status} : ${(await response.text()).slice(0, 200)}`);
    }
    return true;
}

// Compare deux secrets en temps constant.
function sameSecret(given, expected) {
    if (!given || !expected) {
        return false;
    }
    const a = crypto.createHash("sha256").update(String(given)).digest();
    const b = crypto.createHash("sha256").update(String(expected)).digest();
    return crypto.timingSafeEqual(a, b);
}

module.exports = {
    redis, redisConfig, header, visitorHash, isBot, location, device, slug, sameSecret,
    SITE_URL, SITE_SOURCES, parse, lastDays, frenchDate, sendEmail
};
