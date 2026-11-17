// Accueil : active l'animation d'entrée une seule fois par session, avant le premier affichage.
// Rien ne bouge si le visiteur a demandé à réduire les animations dans son système.
try {
    if (!sessionStorage.getItem("intro-vue") && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
        document.documentElement.classList.add("intro");
        sessionStorage.setItem("intro-vue", "1");
    }
} catch {
    // Stockage indisponible (navigation privée stricte) : pas d'animation.
}
