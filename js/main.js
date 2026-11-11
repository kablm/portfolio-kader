const navbar = document.getElementById("navbar");
const mobileToggle = document.getElementById("mobileToggle");
const navMenu = document.getElementById("navMenu");
const scrollProgress = document.getElementById("scrollProgress");
const scrollTopBtn = document.getElementById("scrollTopBtn");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Les anciens liens de la version une page (#projects, #contact...) mènent vers la nouvelle page.
const OLD_ANCHORS = {
    "#about": "competences/#about",
    "#certifications": "competences/#certifications",
    "#skills": "competences/",
    "#projects": "projets/",
    "#veille": "veille/",
    "#experience": "experiences/",
    "#contact": "contact/"
};
if (document.body.classList.contains("page-accueil") && OLD_ANCHORS[location.hash]) {
    location.replace(OLD_ANCHORS[location.hash]);
}

const setNavHeight = () => {
    if (navbar) {
        document.documentElement.style.setProperty("--nav-h", `${navbar.offsetHeight}px`);
    }
};
setNavHeight();
window.addEventListener("resize", setNavHeight);

const setMenuState = (isOpen) => {
    if (!navMenu || !mobileToggle) {
        return;
    }
    navMenu.classList.toggle("active", isOpen);
    mobileToggle.setAttribute("aria-expanded", String(isOpen));
    mobileToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
    document.body.style.overflow = isOpen ? "hidden" : "";
};

if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
        setMenuState(!navMenu.classList.contains("active"));
    });

    document.addEventListener("click", (event) => {
        const target = event.target;
        if (!navMenu.classList.contains("active") || !(target instanceof Node)) {
            return;
        }
        if (!navMenu.contains(target) && !mobileToggle.contains(target)) {
            setMenuState(false);
        }
    });

    navMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenuState(false));
    });
}

/* Fenêtre de détail des projets */
const projectModal = document.getElementById("projectModal");
const projectModalClose = document.getElementById("projectModalClose");
let lastFocus = null;

const openModal = (card) => {
    const title = document.getElementById("projectModalTitle");
    const description = document.getElementById("projectModalDescription");
    const category = document.getElementById("projectModalCategory");
    const points = document.getElementById("projectModalPoints");
    const tech = document.getElementById("projectModalTech");
    const detailed = document.getElementById("projectModalDetailedBody");
    if (!projectModal || !title || !description || !category || !points || !tech) {
        return;
    }

    title.textContent = card.querySelector(".project-title")?.textContent?.trim() || "Projet";
    description.textContent = card.querySelector(".project-description")?.textContent?.trim() || "";
    category.textContent = card.dataset.categoryLabel || card.dataset.category || "Non défini";
    if (detailed) {
        detailed.innerHTML = card.querySelector(".project-details-hidden")?.innerHTML || "";
    }

    points.replaceChildren(...[...card.querySelectorAll(".project-points li")].map((point) => {
        const item = document.createElement("li");
        item.textContent = point.textContent || "";
        return item;
    }));
    tech.replaceChildren(...[...card.querySelectorAll(".tech-badge")].map((badge) => {
        const item = document.createElement("span");
        item.className = "tech-badge";
        item.textContent = badge.textContent || "";
        return item;
    }));

    lastFocus = document.activeElement;
    projectModal.classList.add("active");
    projectModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    projectModalClose?.focus();
};

const closeModal = () => {
    if (!projectModal || !projectModal.classList.contains("active")) {
        return;
    }
    projectModal.classList.remove("active");
    projectModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocus instanceof HTMLElement) {
        lastFocus.focus();
    }
};

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }
    if (projectModal?.classList.contains("active")) {
        closeModal();
        return;
    }
    setMenuState(false);
});

if (projectModal) {
    projectModal.addEventListener("click", (event) => {
        if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") {
            closeModal();
        }
    });
}
projectModalClose?.addEventListener("click", closeModal);

const projectCards = document.querySelectorAll(".project-card[data-category]");
projectCards.forEach((card) => {
    card.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest("a")) {
            return;
        }
        openModal(card);
    });
});

// Lien direct vers un projet depuis l'accueil : projets/?projet=Nom du projet
const wantedProject = new URLSearchParams(location.search).get("projet");
if (wantedProject) {
    const card = [...projectCards].find((c) => c.querySelector(".project-title")?.textContent.trim() === wantedProject);
    if (card) {
        card.scrollIntoView({ block: "center" });
        openModal(card);
    }
}

/* Filtres des projets */
const filterButtons = document.querySelectorAll(".filter-btn");
filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const filter = button.dataset.filter || "all";
        filterButtons.forEach((b) => {
            const isActive = b === button;
            b.classList.toggle("active", isActive);
            b.setAttribute("aria-pressed", String(isActive));
        });
        projectCards.forEach((card) => {
            const show = filter === "all" || card.dataset.category === filter;
            card.classList.toggle("is-hidden", !show);
            card.setAttribute("aria-hidden", String(!show));
        });
    });
});

/* Défilement : barre de progression et retour en haut */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
        const href = anchor.getAttribute("href");
        const target = href && href.length > 1 ? document.querySelector(href) : null;
        if (!target) {
            return;
        }
        event.preventDefault();
        const offset = navbar ? navbar.offsetHeight + 12 : 0;
        window.scrollTo({
            top: target.getBoundingClientRect().top + window.scrollY - offset,
            behavior: reduceMotion ? "auto" : "smooth"
        });
    });
});

const updateScrollUI = () => {
    const scrollTop = window.scrollY;
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollRange > 0 ? Math.min(scrollTop / scrollRange, 1) : 0;
    navbar?.classList.toggle("is-scrolled", scrollTop > 16);
    if (scrollProgress) {
        scrollProgress.style.transform = `scaleX(${progress})`;
    }
    scrollTopBtn?.classList.toggle("visible", scrollTop > 450);
};
window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();
scrollTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
});

/* Accueil : homelab cliquable */
const homelabData = document.getElementById("homelabData");
if (homelabData) {
    const machines = JSON.parse(homelabData.textContent);
    const nodes = document.querySelectorAll(".homelab-node[data-node]");
    const title = document.getElementById("homelabDetailTitle");
    const role = document.getElementById("homelabDetailRole");
    const tech = document.getElementById("homelabDetailTech");
    const link = document.getElementById("homelabDetailLink");

    const select = (id) => {
        const machine = machines[id];
        if (!machine) {
            return;
        }
        nodes.forEach((node) => {
            const isActive = node.dataset.node === id;
            node.classList.toggle("is-active", isActive);
            node.setAttribute("aria-pressed", String(isActive));
        });
        title.textContent = machine.title;
        role.textContent = machine.role;
        tech.replaceChildren(...machine.tech.map((name) => {
            const badge = document.createElement("span");
            badge.className = "tech-badge";
            badge.textContent = name;
            return badge;
        }));
        link.textContent = `Voir le projet : ${machine.project}`;
        link.href = `projets/?projet=${encodeURIComponent(machine.project)}`;
    };

    nodes.forEach((node) => node.addEventListener("click", () => select(node.dataset.node)));
}

/* Compétences : chaque outil montre où il a été utilisé */
const proofsData = document.getElementById("skillProofsData");
if (proofsData) {
    const proofs = JSON.parse(proofsData.textContent);
    const chips = document.querySelectorAll(".skill-chip[data-skill]");
    const title = document.getElementById("skillProofsTitle");
    const count = document.getElementById("skillProofsCount");
    const list = document.getElementById("skillProofsList");
    const kind = (type) => (type.startsWith("Stage") ? "is-stage" : type === "GitHub" ? "is-github" : "is-projet");

    chips.forEach((chip) => {
        const counter = chip.querySelector(".skill-count");
        if (counter) {
            counter.textContent = String((proofs[chip.dataset.skill] || []).length);
        }
    });

    const show = (skill) => {
        const items = proofs[skill] || [];
        chips.forEach((chip) => {
            const isActive = chip.dataset.skill === skill;
            chip.classList.toggle("is-active", isActive);
            chip.setAttribute("aria-pressed", String(isActive));
        });
        title.textContent = skill;
        count.textContent = items.length === 1 ? "Utilisé à 1 endroit." : `Utilisé à ${items.length} endroits.`;
        list.replaceChildren(...items.map((proof) => {
            const li = document.createElement("li");
            li.className = "skill-proof";
            const head = document.createElement("span");
            head.className = "skill-proof-head";
            const type = document.createElement("span");
            type.className = `skill-proof-type ${kind(proof.type)}`;
            type.textContent = proof.type;
            const name = document.createElement("span");
            name.className = "skill-proof-name";
            name.textContent = proof.name;
            head.append(type, name);
            const what = document.createElement("span");
            what.className = "skill-proof-what";
            what.textContent = proof.what;
            li.append(head, what);
            return li;
        }));
    };

    chips.forEach((chip) => chip.addEventListener("click", () => show(chip.dataset.skill)));
}

/* Contact : envoi à /api/contact/ sans quitter la page */
const contactForm = document.getElementById("contactForm");
const contactFormStatus = document.getElementById("contactFormStatus");
const CONTACT_OK = "Merci, votre message est bien parti. Je vous réponds rapidement.";
const CONTACT_FAIL = "Le message n'a pas pu être envoyé. Vous pouvez m'écrire à l'adresse email indiquée sur cette page.";

const setContactStatus = (text, state = "") => {
    if (contactFormStatus) {
        contactFormStatus.textContent = text;
        contactFormStatus.dataset.state = state;
    }
};

// Retour du formulaire envoyé sans JavaScript (la fonction redirige vers /contact/?envoye=1 ou ?erreur=1).
const contactParams = new URLSearchParams(location.search);
if (contactForm && contactParams.has("envoye")) {
    setContactStatus(CONTACT_OK, "ok");
} else if (contactForm && contactParams.has("erreur")) {
    setContactStatus(CONTACT_FAIL, "erreur");
}

contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const buttonContent = submitButton?.innerHTML;
    if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = true;
        submitButton.textContent = "Envoi en cours...";
    }
    setContactStatus("Envoi du message en cours...");
    try {
        const response = await fetch(contactForm.action, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            setContactStatus(result.erreur || CONTACT_FAIL, "erreur");
            return;
        }
        contactForm.reset();
        setContactStatus(CONTACT_OK, "ok");
    } catch {
        // Réseau coupé ou serveur injoignable.
        setContactStatus(CONTACT_FAIL, "erreur");
    } finally {
        if (submitButton instanceof HTMLButtonElement) {
            submitButton.disabled = false;
            submitButton.innerHTML = buttonContent || "Envoyer le message";
        }
    }
});
