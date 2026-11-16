// Page /cv/?c=source : signale l'ouverture au compteur (api/cv.js), puis affiche le PDF.
// Les robots qui se contentent de lire la page n'exécutent pas ce script et ne sont donc pas comptés.
(() => {
    const PDF = "/assets/CV_Kader_Belem.pdf";
    const source = new URLSearchParams(location.search).get("c") || "direct";
    let done = false;
    const open = () => {
        if (!done) {
            done = true;
            location.replace(PDF);
        }
    };
    // Le PDF s'ouvre même si le compteur ne répond pas.
    setTimeout(open, 1500);
    fetch("/api/cv/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ c: source }),
        credentials: "same-origin",
        keepalive: true
    }).catch(() => {}).finally(open);
})();
