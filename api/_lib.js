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

// Compare deux secrets en temps constant.
function sameSecret(given, expected) {
    if (!given || !expected) {
        return false;
    }
    const a = crypto.createHash("sha256").update(String(given)).digest();
    const b = crypto.createHash("sha256").update(String(expected)).digest();
    return crypto.timingSafeEqual(a, b);
}

module.exports = { redis, redisConfig, header, visitorHash, isBot, location, device, slug, sameSecret };
