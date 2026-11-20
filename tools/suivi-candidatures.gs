/**
 * Suivi des candidatures pour le tableau de bord https://kaderbelem.com/stats/
 *
 * Ce script tourne dans le compte Google de Kader (script.google.com), pas sur le site.
 * Toutes les heures, il lit les conversations Gmail qui portent le libellé « Candidatures »,
 * devine le statut de chacune d'après les réponses reçues, puis envoie au site uniquement :
 * l'entreprise, l'objet, les dates, l'adresse d'envoi (gmail ou contact@), le statut et le code
 * du lien suivi s'il y en a un. Le texte des emails ne quitte jamais Gmail.
 *
 * Installation :
 *   1. Coller ce fichier dans un nouveau projet sur script.google.com.
 *   2. Paramètres du projet > Propriétés du script : ajouter CANDIDATURES_SECRET avec la même
 *      valeur que la variable CANDIDATURES_SECRET dans Vercel.
 *   3. Choisir la fonction « installer » puis Exécuter, et accepter l'accès à Gmail.
 *      Elle crée le déclenchement toutes les heures et fait une première lecture.
 */

const SITE_API = "https://kaderbelem.com/api/candidatures/";
const LIBELLE = "Candidatures";
const MAX_CONVERSATIONS = 500;

// Adresses de messagerie grand public : le domaine ne dit rien de l'entreprise.
const DOMAINES_PERSO = [
    "gmail.com", "googlemail.com", "outlook.com", "outlook.fr", "hotmail.com", "hotmail.fr", "live.com", "live.fr",
    "yahoo.com", "yahoo.fr", "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr", "laposte.net", "icloud.com", "me.com",
    "proton.me", "protonmail.com"
];
// Morceaux de domaine qui ne sont pas le nom de l'entreprise (rh.atos.net donne Atos).
const SOUS_DOMAINES = ["mail", "email", "mx", "rh", "recrutement", "recrute", "jobs", "careers", "carrieres", "emploi", "talent", "talents", "hr", "info", "contact", "www", "fr"];

// Comparés au texte sans accents ni majuscules. Le refus passe avant l'entretien :
// « suite à notre entretien, nous ne donnerons malheureusement pas suite » est un refus.
const MOTS_REFUS = [
    "malheureusement", "pas donner suite", "pas y donner suite", "pas pu donner suite", "pas de suite favorable",
    "suite defavorable", "pas ete retenu", "pas retenu", "ne correspond pas", "ne correspondent pas", "regrettons",
    "au regret", "pas en mesure", "autre candidat", "autres candidats", "deja pourvu", "a ete pourvu",
    "unfortunately", "not been selected", "other candidates"
];
const MOTS_ENTRETIEN = [
    "entretien", "disponibilites", "rencontrer", "echange telephonique", "appel telephonique",
    "visio", "teams", "google meet", "zoom", "rendez-vous", "creneau", "convocation", "interview"
];
// Réponses automatiques : elles ne comptent pas comme une vraie réponse. Elles sont reconnues avant
// le refus et l'entretien, car un accusé de réception dit souvent « si votre profil correspond,
// nous vous proposerons un entretien ».
const MOTS_AUTOMATIQUES = [
    "reponse automatique", "automatic reply", "auto-reply", "autoreply", "out of office", "absent du bureau",
    "absente du bureau", "accuse de reception", "ne pas repondre", "do not reply", "delivery status notification",
    "undeliverable", "non remis", "si votre profil correspond", "si votre candidature retient"
];

function installer() {
    ScriptApp.getProjectTriggers()
        .filter((trigger) => trigger.getHandlerFunction() === "synchroniser")
        .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
    ScriptApp.newTrigger("synchroniser").timeBased().everyHours(1).create();
    synchroniser();
    console.log("Installé : le script lira Gmail toutes les heures.");
}

function synchroniser() {
    const secret = PropertiesService.getScriptProperties().getProperty("CANDIDATURES_SECRET");
    if (!secret) {
        throw new Error("Ajoute CANDIDATURES_SECRET dans Paramètres du projet > Propriétés du script.");
    }
    const label = GmailApp.getUserLabelByName(LIBELLE);
    if (!label) {
        throw new Error(`Le libellé « ${LIBELLE} » n'existe pas dans Gmail.`);
    }

    const moi = mesAdresses();
    const threads = [];
    for (let start = 0; start < MAX_CONVERSATIONS; start += 100) {
        const page = label.getThreads(start, 100);
        threads.push(...page);
        if (page.length < 100) break;
    }
    const messagesParConversation = threads.length ? GmailApp.getMessagesForThreads(threads) : [];
    const candidatures = threads
        .map((thread, index) => lireCandidature(thread, messagesParConversation[index], moi))
        .filter(Boolean);

    const response = UrlFetchApp.fetch(SITE_API, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: `Bearer ${secret}` },
        payload: JSON.stringify({ candidatures }),
        muteHttpExceptions: true
    });
    const code = response.getResponseCode();
    if (code !== 200) {
        throw new Error(`Le site a répondu ${code} : ${response.getContentText().slice(0, 200)}`);
    }
    console.log(`${candidatures.length} candidature(s) envoyée(s) au tableau de bord.`);
}

function lireCandidature(thread, messages, moi) {
    const envoi = messages.find((message) => moi.has(adresse(message.getFrom())));
    if (!envoi) return null;

    const reponses = messages
        .filter((message) => message.getDate() > envoi.getDate())
        .filter((message) => !moi.has(adresse(message.getFrom())))
        .filter((message) => !/mailer-daemon|postmaster/i.test(message.getFrom()))
        .map((message) => ({ date: message.getDate(), type: classer(message) }))
        .filter((reponse) => reponse.type !== "automatique");

    const derniere = reponses[reponses.length - 1];
    const lien = (envoi.getBody() + " " + envoi.getPlainBody()).match(/kaderbelem\.com\/cv\/?\?c=([A-Za-z0-9-]+)/);

    return {
        id: thread.getId(),
        entreprise: nomEntreprise(envoi.getTo()),
        objet: envoi.getSubject(),
        envoyee: envoi.getDate().toISOString(),
        depuis: /@kaderbelem\.com$/i.test(adresse(envoi.getFrom())) ? "contact" : "gmail",
        reponse: reponses.length ? reponses[0].date.toISOString() : null,
        statut: derniere ? derniere.type : "attente",
        cv: lien ? lien[1] : null
    };
}

// Devine le type d'une réponse, sans tenir compte de la citation de l'email d'origine.
function classer(message) {
    const texte = sansAccents(`${message.getSubject()}\n${sansCitation(message.getPlainBody())}`);
    if (MOTS_AUTOMATIQUES.some((mot) => texte.includes(mot))) return "automatique";
    if (MOTS_REFUS.some((mot) => texte.includes(mot))) return "refus";
    if (MOTS_ENTRETIEN.some((mot) => texte.includes(mot))) return "entretien";
    // Un simple « bien reçu », ou un message d'une adresse noreply sans refus ni entretien, n'est pas une réponse.
    const expediteur = message.getFrom ? message.getFrom() : "";
    if (/no-?reply|ne-?pas-?repondre/i.test(expediteur) || texte.includes("bien recu votre candidature")) return "automatique";
    return "reponse";
}

// Coupe le texte cité (« Le 12 nov. 2026, Kader a écrit : », lignes commençant par >).
function sansCitation(corps) {
    const lignes = [];
    for (const ligne of String(corps || "").split(/\r?\n/)) {
        if (/^\s*(le .+ a [ée]crit|on .+ wrote|-{2,}\s*(message d'origine|original message)|de\s*:|from\s*:)/i.test(ligne)) break;
        if (!/^\s*>/.test(ligne)) lignes.push(ligne);
    }
    return lignes.join("\n").slice(0, 4000);
}

function sansAccents(texte) {
    return String(texte).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ");
}

function adresse(champ) {
    const trouve = String(champ || "").match(/<([^>]+)>/);
    return (trouve ? trouve[1] : String(champ || "")).trim().toLowerCase();
}

function mesAdresses() {
    const adresses = [Session.getEffectiveUser().getEmail(), ...GmailApp.getAliases(), "contact@kaderbelem.com"];
    return new Set(adresses.filter(Boolean).map((a) => a.toLowerCase()));
}

// « Service RH <rh@groupe-atos.net> » donne « Groupe Atos » ; une adresse Gmail donne le nom affiché.
function nomEntreprise(destinataires) {
    const premier = String(destinataires || "").split(",")[0];
    const nomAffiche = (premier.match(/^\s*"?([^"<]*?)"?\s*</) || [])[1] || "";
    const email = adresse(premier);
    const [local, domaine = ""] = email.split("@");
    if (!domaine || DOMAINES_PERSO.includes(domaine)) {
        return joli(nomAffiche || local);
    }
    const morceaux = domaine.split(".");
    morceaux.pop();
    if (morceaux.length > 1 && ["co", "com", "gouv"].includes(morceaux[morceaux.length - 1])) morceaux.pop();
    const utiles = morceaux.filter((morceau) => !SOUS_DOMAINES.includes(morceau));
    return joli(utiles[utiles.length - 1] || nomAffiche || local);
}

function joli(texte) {
    return String(texte)
        .replace(/[-_.]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map((mot) => mot.charAt(0).toUpperCase() + mot.slice(1))
        .join(" ");
}

// Pour tester les règles sans Gmail : exécuter cette fonction et lire le journal.
function testerLesRegles() {
    const faux = (sujet, corps) => ({ getSubject: () => sujet, getPlainBody: () => corps });
    console.log(classer(faux("Re: Candidature", "Bonjour, pourriez-vous m'indiquer vos disponibilités pour un entretien ?")));
    console.log(classer(faux("Re: Candidature", "Nous ne pouvons malheureusement pas donner suite.\n\nLe 12 nov. 2026, Kader a écrit :\n> entretien")));
    console.log(classer(faux("Accusé de réception", "Nous avons bien reçu votre candidature.")));
    console.log(nomEntreprise('"Service RH" <rh@groupe-atos.net>'));
}
