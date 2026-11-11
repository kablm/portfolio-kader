// Tableau de bord privé : lit /api/stats/ avec le mot de passe, gardé seulement le temps de l'onglet.
// Tout ce qui vient des visiteurs (noms, messages, villes) passe par textContent, jamais par innerHTML.
const API = "/api/stats/";
const STORAGE_KEY = "stats-mot-de-passe";
const SOURCE_NAMES = { site: "Boutons du site", jeu: "Version jeu", direct: "Lien direct" };

const $ = (id) => document.getElementById(id);

function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (value == null || value === false) continue;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else node.setAttribute(key, value);
    }
    node.append(...children.filter((child) => child != null && child !== false));
    return node;
}

const storage = {
    get() { try { return sessionStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; } },
    set(value) { try { sessionStorage.setItem(STORAGE_KEY, value); } catch { /* navigation privée */ } },
    clear() { try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* navigation privée */ } }
};
let password = storage.get();

async function api(method = "GET", body) {
    const response = await fetch(API, {
        method,
        cache: "no-store",
        headers: { Authorization: `Bearer ${password}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.erreur || `Le serveur a répondu ${response.status}.`);
        error.status = response.status;
        throw error;
    }
    return data;
}

/* Dates */
const time = (date) => date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const shortDate = (date) => date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const dayLabel = (day, options) => new Date(`${day}T00:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC", ...options });

function relative(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    const now = new Date();
    const minutes = (now - date) / 60000;
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${Math.round(minutes)} min`;
    if (date.toDateString() === now.toDateString()) return `il y a ${Math.round(minutes / 60)} h`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `hier, ${time(date)}`;
    return `${shortDate(date)}, ${time(date)}`;
}

const withinDays = (iso, days) => iso && Date.now() - new Date(iso) < days * 86400000;
const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;
const linkUrl = (source) => `${location.origin}/cv/?c=${encodeURIComponent(source)}`;

async function copy(text, button) {
    const label = button.textContent;
    try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Copié !";
    } catch {
        button.textContent = "Copie impossible";
    }
    setTimeout(() => { button.textContent = label; }, 1500);
}

/* Rendu */
function renderStatus(configuration) {
    const set = (chip, ok, on, off) => {
        chip.classList.toggle("is-off", !ok);
        chip.lastElementChild.textContent = ok ? on : off;
    };
    set($("chipBase"), configuration.base, "Base de données connectée", "Base de données non configurée");
    set($("chipEmail"), configuration.email, "Envoi d'emails connecté", "Envoi d'emails non configuré");
}

function renderKpis(data) {
    const days = data.cv.jours;
    const sum = (list) => list.reduce((total, day) => total + day.n, 0);
    $("kpiTotal").textContent = data.cv.total;
    $("kpi30").textContent = sum(days);
    $("kpi30Sub").textContent = `dont ${sum(days.slice(-7))} ces 7 derniers jours`;
    const opened = data.liens.filter((link) => link.n > 0).length;
    $("kpiLinks").replaceChildren(String(opened), " ", el("small", { text: `sur ${data.liens.length}` }));
    $("kpiMessages").textContent = data.messages.length;
    $("kpiMessagesSub").textContent = `dont ${data.messages.filter((m) => withinDays(m.t, 7)).length} ces 7 derniers jours`;
}

function renderChart(days) {
    const chart = $("chart");
    const max = Math.max(0, ...days.map((day) => day.n));
    // Trois lignes de grille à des valeurs entières, la plus haute au-dessus de la plus grande barre.
    const step = Math.max(1, Math.ceil(max / 3));
    const top = step * 3;
    const bars = el("div", { class: "bars" });
    days.forEach((day, index) => {
        const label = dayLabel(day.jour, { weekday: "short", day: "numeric", month: "short" });
        // Les infobulles des barres aux extrémités s'alignent sur le bord pour ne pas sortir du cadre.
        const edge = index < 5 ? " is-start" : index >= days.length - 5 ? " is-end" : "";
        const slot = el("div", { class: `slot${edge}`, tabindex: "0", "aria-label": `${label} : ${plural(day.n, "téléchargement")}` });
        if (day.n > 0) {
            const bar = el("div", { class: "bar" });
            bar.style.height = `${(day.n / top) * 100}%`;
            slot.append(bar);
        }
        slot.append(el("div", { class: "tooltip" }, el("b", { text: label }), plural(day.n, "téléchargement")));
        bars.append(slot);
    });
    const lines = [0, step, step * 2, step * 3].map((value) => {
        const line = el("div", { class: value === 0 ? "grid-line is-base" : "grid-line" }, el("span", { text: String(value) }));
        line.style.bottom = `${(value / top) * 100}%`;
        return line;
    });
    chart.replaceChildren(...lines, bars);
    $("xAxis").replaceChildren(...days.map((day, index) => el("span", { text: index % 7 === 0 ? dayLabel(day.jour, { day: "numeric", month: "short" }) : "" })));
    $("dayTable").tBodies[0].replaceChildren(...[...days].reverse().map((day) => el("tr", {},
        el("td", { text: dayLabel(day.jour, { weekday: "long", day: "numeric", month: "long" }) }),
        el("td", { class: "num-col", text: String(day.n) }))));
}

function renderSources(sources) {
    const groups = { site: 0, liens: 0, jeu: 0, direct: 0 };
    sources.forEach(({ source, n }) => {
        groups[source in SOURCE_NAMES ? source : "liens"] += n;
    });
    const rows = [["Boutons du site", groups.site], ["Liens de candidature", groups.liens], ["Version jeu", groups.jeu], ["Lien direct", groups.direct]];
    const max = Math.max(...rows.map(([, n]) => n));
    if (max === 0) {
        $("sources").replaceChildren(el("p", { class: "empty", text: "Pas encore de téléchargement." }));
        return;
    }
    $("sources").replaceChildren(...rows.map(([name, n]) => {
        const fill = el("span", { class: "fill" });
        fill.style.width = `${(n / max) * 100}%`;
        return el("div", { class: "source" }, el("span", { text: name }), el("span", { class: "track" }, fill), el("span", { class: "n", text: String(n) }));
    }));
}

function renderLinks(links, events) {
    if (!links.length) {
        $("links").replaceChildren(el("tr", {}, el("td", { colspan: "5", class: "empty", text: "Aucun lien pour l'instant. Crée le premier ci-dessus." })));
        return;
    }
    $("links").replaceChildren(...links.map((link) => {
        const lastEvent = events.find((event) => event.c === link.source);
        const where = lastEvent ? [lastEvent.ville, lastEvent.appareil].filter(Boolean).join(" · ") : "";
        const when = link.n > 0 ? relative(link.derniere) : link.cree ? `créé le ${shortDate(new Date(link.cree))}` : "";
        const copyButton = el("button", { class: "link-btn", type: "button", text: "Copier le lien" });
        copyButton.addEventListener("click", () => copy(linkUrl(link.source), copyButton));
        return el("tr", {},
            el("td", { class: "company", text: link.nom }),
            el("td", {}, link.n > 0 ? el("span", { class: "pill pill-open", text: "✓ Ouvert" }) : el("span", { class: "pill pill-wait", text: "Pas encore ouvert" })),
            el("td", { class: "num-col", text: String(link.n) }),
            el("td", {}, el("span", { text: when }), where ? el("span", { class: "where", text: where }) : null),
            el("td", { class: "num-col" }, copyButton));
    }));
}

function renderFeed(events, links) {
    const names = Object.fromEntries(links.map((link) => [link.source, link.nom]));
    if (!events.length) {
        $("feed").replaceChildren(el("li", { class: "empty", text: "Pas encore de téléchargement." }));
        return;
    }
    $("feed").replaceChildren(...events.slice(0, 8).map((event) => {
        const isSite = event.c in SOURCE_NAMES;
        const meta = [isSite ? null : "Lien de candidature", event.ville, event.appareil].filter(Boolean).join(" · ");
        return el("li", {},
            el("span", { class: isSite ? "mark is-site" : "mark" }),
            el("div", {}, el("div", { class: "what", text: SOURCE_NAMES[event.c] || names[event.c] || event.c }), meta ? el("div", { class: "meta", text: meta }) : null),
            el("span", { class: "time", text: relative(event.t) }));
    }));
}

function renderMessages(messages) {
    if (!messages.length) {
        $("messages").replaceChildren(el("p", { class: "empty", text: "Aucun message pour l'instant." }));
        return;
    }
    $("messages").replaceChildren(...messages.slice(0, 20).map((message) => {
        const reply = el("a", { class: "btn btn-small", text: "Répondre" });
        reply.href = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent("Re : votre message sur mon portfolio")}`;
        return el("div", { class: "msg" },
            el("div", { class: "msg-head" },
                el("b", { text: message.nom }),
                el("span", { class: "mail", text: message.email }),
                message.origine === "jeu" ? el("span", { class: "tag", text: "version jeu" }) : null,
                el("span", { class: "time", text: relative(message.t) })),
            el("p", { text: message.message }),
            reply);
    }));
}

function render(data) {
    renderStatus(data.configuration);
    renderKpis(data);
    renderChart(data.cv.jours);
    renderSources(data.cv.sources);
    renderLinks(data.liens, data.cv.evenements);
    renderFeed(data.cv.evenements, data.liens);
    renderMessages(data.messages);
    $("updated").textContent = `Mis à jour à ${time(new Date())}`;
}

/* Écrans */
function showLogin(message = "") {
    $("dashboard").hidden = true;
    $("loginScreen").hidden = false;
    $("loginError").textContent = message;
    $("password").focus();
}

function showDashboard() {
    $("loginScreen").hidden = true;
    $("dashboard").hidden = false;
}

function logout(message) {
    storage.clear();
    password = "";
    $("password").value = "";
    showLogin(message);
}

async function refresh() {
    const button = $("refresh");
    button.disabled = true;
    try {
        render(await api());
    } catch (error) {
        if (error.status === 401 || error.status === 429) logout(error.message);
        else $("updated").textContent = error.message;
    } finally {
        button.disabled = false;
    }
}

$("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button");
    button.disabled = true;
    $("loginError").textContent = "";
    password = $("password").value;
    try {
        const data = await api();
        storage.set(password);
        showDashboard();
        render(data);
    } catch (error) {
        password = "";
        $("loginError").textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

$("refresh").addEventListener("click", refresh);
$("logout").addEventListener("click", () => logout(""));

$("toggleTable").addEventListener("click", (event) => {
    const table = $("dayTable");
    table.hidden = !table.hidden;
    event.currentTarget.setAttribute("aria-expanded", String(!table.hidden));
    event.currentTarget.textContent = table.hidden ? "Voir en tableau" : "Masquer le tableau";
});

$("createForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    $("createError").textContent = "";
    try {
        const link = await api("POST", { nom: $("company").value });
        const url = linkUrl(link.source);
        const box = $("generated");
        box.querySelector("code").textContent = url.replace(/^https?:\/\//, "");
        box.hidden = false;
        box.querySelector("button").onclick = (e) => copy(url, e.currentTarget);
        $("company").value = "";
        render(await api());
    } catch (error) {
        if (error.status === 401) logout(error.message);
        else $("createError").textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

// Mot de passe déjà saisi dans cet onglet : on ouvre directement le tableau de bord.
if (password) {
    api().then((data) => { showDashboard(); render(data); }).catch((error) => logout(error.status === 401 ? "" : error.message));
} else {
    showLogin();
}
