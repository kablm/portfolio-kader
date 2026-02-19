const navbar = document.getElementById("navbar");
const mobileToggle = document.getElementById("mobileToggle");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".nav-link");
const themeToggle = document.getElementById("themeToggle");
const scrollProgress = document.getElementById("scrollProgress");
const scrollTopBtn = document.getElementById("scrollTopBtn");
const projectModal = document.getElementById("projectModal");
const projectModalClose = document.getElementById("projectModalClose");
const projectModalTitle = document.getElementById("projectModalTitle");
const projectModalDescription = document.getElementById("projectModalDescription");
const projectModalTags = document.getElementById("projectModalTags");
const projectModalTech = document.getElementById("projectModalTech");
const terminalOutput = document.getElementById("terminalOutput");
const terminalInput = document.getElementById("terminalInput");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    if (!themeToggle) {
        return;
    }

    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.innerHTML = isDark ? "<i class='bx bx-sun'></i>" : "<i class='bx bx-moon'></i>";
};

const initializeTheme = () => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark" || storedTheme === "light") {
        setTheme(storedTheme);
        return;
    }

    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(systemDark ? "dark" : "light");
};

initializeTheme();

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        setTheme(currentTheme === "dark" ? "light" : "dark");
    });
}

const setMenuState = (isOpen) => {
    if (!navMenu || !mobileToggle) {
        return;
    }

    navMenu.classList.toggle("active", isOpen);
    mobileToggle.setAttribute("aria-expanded", String(isOpen));
};

if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
        setMenuState(!navMenu.classList.contains("active"));
    });

    document.addEventListener("click", (event) => {
        if (!navMenu.classList.contains("active")) {
            return;
        }

        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }

        if (!navMenu.contains(target) && !mobileToggle.contains(target)) {
            setMenuState(false);
        }
    });
}

const openModal = (card) => {
    if (!projectModal || !projectModalTitle || !projectModalDescription || !projectModalTags || !projectModalTech) {
        return;
    }

    const title = card.querySelector(".project-title")?.textContent?.trim() || "Projet";
    const description = card.querySelector(".project-description")?.textContent?.trim() || "";
    const tags = card.querySelectorAll(".project-tag");
    const tech = card.querySelectorAll(".tech-badge");

    projectModalTitle.textContent = title;
    projectModalDescription.textContent = description;
    projectModalTags.innerHTML = "";
    projectModalTech.innerHTML = "";

    tags.forEach((tag) => {
        const item = document.createElement("span");
        item.className = "project-tag";
        item.textContent = tag.textContent || "";
        projectModalTags.appendChild(item);
    });

    tech.forEach((badge) => {
        const item = document.createElement("span");
        item.className = "tech-badge";
        item.textContent = badge.textContent || "";
        projectModalTech.appendChild(item);
    });

    projectModal.classList.add("active");
    projectModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
};

const closeModal = () => {
    if (!projectModal) {
        return;
    }
    projectModal.classList.remove("active");
    projectModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
};

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (projectModal?.classList.contains("active")) {
            closeModal();
            return;
        }
        setMenuState(false);
    }
});

if (projectModal) {
    projectModal.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (target.dataset.closeModal === "true") {
            closeModal();
        }
    });
}

if (projectModalClose) {
    projectModalClose.addEventListener("click", closeModal);
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
});

document.querySelectorAll(".project-open-btn").forEach((button) => {
    button.addEventListener("click", () => {
        const card = button.closest(".project-card");
        if (!card) {
            return;
        }
        openModal(card);
    });
});

document.querySelectorAll(".project-card[data-category]").forEach((card) => {
    card.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest(".project-open-btn")) {
            return;
        }
        openModal(card);
    });
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
        const href = anchor.getAttribute("href");
        if (!href || href === "#") {
            return;
        }

        const target = document.querySelector(href);
        if (!target) {
            return;
        }

        event.preventDefault();
        const offset = navbar ? navbar.offsetHeight + 12 : 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
            top: targetPosition,
            behavior: reduceMotion ? "auto" : "smooth"
        });
    });
});

const updateScrollUI = () => {
    const scrollTop = window.scrollY;
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollRange > 0 ? Math.min(scrollTop / scrollRange, 1) : 0;

    if (navbar) {
        navbar.classList.toggle("is-scrolled", scrollTop > 16);
    }

    if (scrollProgress) {
        scrollProgress.style.transform = `scaleX(${progress})`;
    }

    if (scrollTopBtn) {
        scrollTopBtn.classList.toggle("visible", scrollTop > 450);
    }
};

window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();

if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
}

const sections = document.querySelectorAll("section[id]");
if (sections.length && navLinks.length) {
    const activeSectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                navLinks.forEach((link) => {
                    const isActive = link.getAttribute("href") === `#${entry.target.id}`;
                    link.classList.toggle("active", isActive);
                    if (isActive) {
                        link.setAttribute("aria-current", "page");
                    } else {
                        link.removeAttribute("aria-current");
                    }
                });
            });
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0.1 }
    );

    sections.forEach((section) => activeSectionObserver.observe(section));
}

const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card[data-category]");

if (filterButtons.length && projectCards.length) {
    const setActiveFilter = (filter) => {
        filterButtons.forEach((button) => {
            const isActive = button.dataset.filter === filter;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });

        projectCards.forEach((card) => {
            const category = card.dataset.category;
            const show = filter === "all" || category === filter;
            card.classList.toggle("is-hidden", !show);
            card.setAttribute("aria-hidden", String(!show));
        });
    };

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.filter || "all";
            setActiveFilter(filter);
        });
    });
}

const revealSelectors = [
    ".section-header",
    ".skill-card",
    ".project-card",
    ".timeline-item",
    ".contact-item",
    ".cert-item",
    ".stat-card",
    ".terminal-card"
];

const revealTargets = document.querySelectorAll(revealSelectors.join(", "));
if (revealTargets.length) {
    revealTargets.forEach((item) => item.classList.add("reveal-item"));

    if (reduceMotion) {
        revealTargets.forEach((item) => item.classList.add("is-visible"));
    } else {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
        );

        revealTargets.forEach((item) => revealObserver.observe(item));
    }
}

const counters = document.querySelectorAll(".stat-number[data-counter]");
if (counters.length) {
    const animateCounter = (element) => {
        const targetValue = Number(element.dataset.counter || "0");
        const suffix = element.dataset.suffix || "";

        if (!Number.isFinite(targetValue)) {
            element.textContent = `0${suffix}`;
            return;
        }

        if (reduceMotion) {
            element.textContent = `${targetValue}${suffix}`;
            return;
        }

        const duration = 1200;
        const start = performance.now();

        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const value = Math.floor(targetValue * progress);
            element.textContent = `${value}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = `${targetValue}${suffix}`;
            }
        };

        requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.5 }
    );

    counters.forEach((counter) => counterObserver.observe(counter));
}

if (terminalOutput && terminalInput) {
    const terminalScenes = [
        {
            cmd: "nmap -sV 192.168.1.0/24",
            output: ["Host 192.168.1.10 open ssh", "Host 192.168.1.20 open https"]
        },
        {
            cmd: "docker compose up -d monitoring",
            output: ["Creating prometheus ... done", "Creating grafana ... done"]
        },
        {
            cmd: "ufw status",
            output: ["Status: active", "80/tcp ALLOW 443/tcp ALLOW"]
        }
    ];

    const appendTerminalLine = (text, className = "") => {
        const line = document.createElement("div");
        line.className = `terminal-line ${className}`.trim();
        line.textContent = text;
        terminalOutput.appendChild(line);

        while (terminalOutput.children.length > 8) {
            terminalOutput.removeChild(terminalOutput.firstChild);
        }

        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    };

    const typeTerminalInput = (text, callback) => {
        if (reduceMotion) {
            terminalInput.textContent = text;
            callback();
            return;
        }

        let index = 0;
        terminalInput.textContent = "";
        const typingTimer = setInterval(() => {
            index += 1;
            terminalInput.textContent = text.slice(0, index);
            if (index >= text.length) {
                clearInterval(typingTimer);
                callback();
            }
        }, 35);
    };

    let sceneIndex = 0;
    const runScene = () => {
        const scene = terminalScenes[sceneIndex % terminalScenes.length];
        typeTerminalInput(scene.cmd, () => {
            appendTerminalLine(`$ ${scene.cmd}`, "command");
            terminalInput.textContent = "";
            scene.output.forEach((line, idx) => {
                setTimeout(() => appendTerminalLine(line), idx * 180);
            });
            sceneIndex += 1;
            setTimeout(runScene, 2300);
        });
    };

    setTimeout(runScene, 800);
}

const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.addEventListener("submit", () => {
        const submitButton = contactForm.querySelector('button[type="submit"]');
        if (!(submitButton instanceof HTMLButtonElement)) {
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Envoi en cours...";
    });
}
