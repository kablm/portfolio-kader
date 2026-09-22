/*
 * Portfolio jouable — Kader Belem
 *
 * Le contenu n'est pas recopié ici : il est lu en direct dans ../index.html.
 * Toute modification du site classique (y compris la veille réécrite par
 * update_veille.py) apparaît donc automatiquement dans le jeu.
 * Aucun asset externe : le monde et les personnages sont dessinés en code.
 */
(() => {
    'use strict';

    /* ================= Réglages ================= */

    const TILE = 16;
    const MAP_W = 60;
    const MAP_H = 42;
    const WALK = 80;   // px/s
    const RUN = 135;
    const SAVE_KEY = 'kb-portfolio-jeu-v1';
    const INDEX_URL = new URL('../index.html', location.href);
    const CREDLY_SCRIPT = 'https://cdn.credly.com/assets/utilities/embed.js';
    const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const KEY_LABEL = IS_TOUCH ? 'A' : 'E';

    const SKINS = ['#f3cfb3', '#d9a066', '#a86b43', '#5c3a21'];
    const OUTFITS = [
        { shirt: '#0ea5e9', pants: '#1e3a5f' },
        { shirt: '#22c55e', pants: '#334155' },
        { shirt: '#f97316', pants: '#3f3f46' },
        { shirt: '#a855f7', pants: '#1f2937' },
    ];

    const PLACES = {
        about:          { name: 'Maison de Kader',    section: 'À propos',             label: 'À PROPOS',       icon: '🏠', color: '#fb923c' },
        skills:         { name: 'Datacenter',         section: 'Compétences',          label: 'COMPÉTENCES',    icon: '🖥️', color: '#38bdf8' },
        projects:       { name: 'Homelab',            section: 'Projets',              label: 'PROJETS',        icon: '🧪', color: '#60a5fa' },
        certifications: { name: 'Salle des trophées', section: 'Certifications',       label: 'CERTIFICATIONS', icon: '🏆', color: '#c084fc' },
        experience:     { name: 'Gare des stages',    section: 'Expériences',          label: 'EXPÉRIENCES',    icon: '🚉', color: '#2dd4bf' },
        veille:         { name: 'Tour radio',         section: 'Veille technologique', label: 'VEILLE',         icon: '📡', color: '#fb7185' },
        contact:        { name: 'Bureau de poste',    section: 'Contact',              label: 'CONTACT',        icon: '✉️', color: '#facc15' },
    };
    const PLACE_ORDER = Object.keys(PLACES);

    /* ================= Carte ================= */

    const GRASS = 0, PATH = 1, WATER = 2, TREE = 3, PLAZA = 4, FLOWER = 5, BUILDING = 6;

    const BUILDINGS = [
        { id: 'about',          style: 'house',      x: 7,  y: 4,  w: 9,  h: 6 },
        { id: 'skills',         style: 'datacenter', x: 24, y: 3,  w: 12, h: 7 },
        { id: 'projects',       style: 'lab',        x: 44, y: 4,  w: 10, h: 6 },
        { id: 'veille',         style: 'tower',      x: 46, y: 14, w: 6,  h: 8 },
        { id: 'certifications', style: 'trophy',     x: 6,  y: 27, w: 9,  h: 6 },
        { id: 'experience',     style: 'station',    x: 22, y: 27, w: 12, h: 6 },
        { id: 'contact',        style: 'post',       x: 42, y: 27, w: 10, h: 6 },
    ];
    for (const b of BUILDINGS) {
        b.door = { x: b.x + Math.floor(b.w / 2), y: b.y + b.h - 1 };
        b.leds = [];
        b.screens = [];
    }

    const SPAWN = { x: 30, y: 21 };
    const FOUNTAIN = { x: 29, y: 18 };
    const CHEST = { x: 33, y: 16 };
    const SIGN = { x: 26, y: 16 };
    const MAILBOX = { x: 52, y: 32 };
    const CHIP_SPOTS = [[17, 6], [40, 6], [56, 16], [21, 21], [3, 27], [35, 29], [55, 37], [13, 38]];

    const NPCS = [
        { id: 'byte', kind: 'robot', x: 27, y: 20, dir: 'down', name: 'Byte' },
        { id: 'ping', kind: 'cat', x: 5, y: 8, dir: 'down', name: 'Ping le chat' },
        { id: 'sam', kind: 'person', x: 37, y: 7, dir: 'left', name: 'Sam, admin système',
            look: { skin: SKINS[0], hair: '#6b4423', shirt: '#475569', pants: '#1e293b' } },
        { id: 'lou', kind: 'person', x: 16, y: 17, dir: 'left', name: 'Lou, pêcheur de paquets',
            look: { skin: SKINS[2], hair: '#111827', shirt: '#ca8a04', pants: '#365314', hat: '#a16207' } },
        { id: 'alex', kind: 'person', x: 40, y: 36, dir: 'down', name: 'Alex (RH)',
            look: { skin: SKINS[3], hair: '#111827', shirt: '#1e293b', pants: '#334155' } },
    ];

    const tiles = new Uint8Array(MAP_W * MAP_H);
    const solid = new Uint8Array(MAP_W * MAP_H);
    const inMap = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
    const at = (x, y) => (inMap(x, y) ? tiles[y * MAP_W + x] : TREE);

    function fill(x, y, w, hh, t) {
        for (let j = y; j < y + hh; j++) for (let i = x; i < x + w; i++) if (inMap(i, j)) tiles[j * MAP_W + i] = t;
    }
    function ellipse(cx, cy, rx, ry, t) {
        for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) {
            for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
                const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
                if (dx * dx + dy * dy <= 1) fill(i, j, 1, 1, t);
            }
        }
    }
    function mulberry32(a) {
        return () => {
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function hash(x, y) {
        let n = (x * 374761393 + y * 668265263) | 0;
        n = Math.imul(n ^ (n >>> 13), 1274126177);
        return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    }

    function buildWorld() {
        tiles.fill(GRASS);

        // Avenues et liaisons
        fill(6, 10, 48, 2, PATH);   // avenue nord
        fill(6, 23, 48, 2, PATH);   // avenue centrale
        fill(6, 33, 48, 2, PATH);   // avenue sud
        fill(29, 12, 2, 3, PATH);   // nord -> place
        fill(19, 12, 2, 11, PATH);  // liaison ouest
        fill(40, 12, 2, 11, PATH);  // liaison est
        fill(21, 18, 3, 2, PATH);
        fill(36, 18, 4, 2, PATH);
        fill(48, 22, 3, 1, PATH);   // devant la tour radio
        fill(17, 25, 2, 8, PATH);
        fill(37, 25, 2, 8, PATH);
        fill(24, 15, 12, 8, PLAZA); // place centrale

        ellipse(10.5, 17.5, 5.2, 3.3, WATER);
        ellipse(30.5, 38, 6.5, 2.2, WATER);

        for (let y = 0; y < MAP_H; y++) {
            for (let x = 0; x < MAP_W; x++) {
                if (x < 2 || y < 2 || x >= MAP_W - 2 || y >= MAP_H - 2) tiles[y * MAP_W + x] = TREE;
            }
        }
        for (const b of BUILDINGS) fill(b.x, b.y, b.w, b.h, BUILDING);

        // Arbres et fleurs, à distance des chemins et des éléments interactifs
        const specials = [SPAWN, CHEST, SIGN, MAILBOX, ...NPCS, ...CHIP_SPOTS.map(([x, y]) => ({ x, y })),
            { x: 29, y: 18 }, { x: 30, y: 18 }, { x: 29, y: 19 }, { x: 30, y: 19 }];
        const nearSpecial = (x, y, r) => specials.some((s) => Math.abs(s.x - x) <= r && Math.abs(s.y - y) <= r);
        const nearBusy = (x, y) => {
            for (let j = y - 1; j <= y + 1; j++) {
                for (let i = x - 1; i <= x + 1; i++) {
                    const t = at(i, j);
                    if (inMap(i, j) && (t === PATH || t === PLAZA || t === BUILDING || t === WATER)) return true;
                }
            }
            return false;
        };
        const rnd = mulberry32(1337);
        for (let n = 0; n < 190; n++) {
            const x = 2 + Math.floor(rnd() * (MAP_W - 4)), y = 2 + Math.floor(rnd() * (MAP_H - 4));
            if (at(x, y) === GRASS && !nearBusy(x, y) && !nearSpecial(x, y, 2)) tiles[y * MAP_W + x] = TREE;
        }
        for (let n = 0; n < 150; n++) {
            const x = 2 + Math.floor(rnd() * (MAP_W - 4)), y = 2 + Math.floor(rnd() * (MAP_H - 4));
            if (at(x, y) === GRASS && !nearSpecial(x, y, 0)) tiles[y * MAP_W + x] = FLOWER;
        }

        computeSolid();

        // Garantit que chaque module et chaque PNJ reste atteignable
        for (let pass = 0; pass < 4; pass++) {
            const seen = reachable();
            let fixed = false;
            const needs = [
                ...CHIP_SPOTS.map(([x, y]) => [[x, y]]),
                ...NPCS.map((n) => [[n.x + 1, n.y], [n.x - 1, n.y], [n.x, n.y + 1], [n.x, n.y - 1]]),
            ];
            for (const opts of needs) {
                if (opts.some(([x, y]) => inMap(x, y) && seen[y * MAP_W + x])) continue;
                const [cx, cy] = opts[0];
                for (let j = cy - 3; j <= cy + 3; j++) {
                    for (let i = cx - 3; i <= cx + 3; i++) {
                        if (i >= 2 && j >= 2 && i < MAP_W - 2 && j < MAP_H - 2 && at(i, j) === TREE) tiles[j * MAP_W + i] = GRASS;
                    }
                }
                fixed = true;
            }
            if (!fixed) break;
            computeSolid();
        }
    }

    function computeSolid() {
        for (let i = 0; i < tiles.length; i++) {
            const t = tiles[i];
            solid[i] = t === TREE || t === WATER || t === BUILDING ? 1 : 0;
        }
        const props = [[29, 18], [30, 18], [29, 19], [30, 19], [CHEST.x, CHEST.y], [SIGN.x, SIGN.y],
            [MAILBOX.x, MAILBOX.y], ...NPCS.map((n) => [n.x, n.y])];
        for (const [x, y] of props) solid[y * MAP_W + x] = 1;
    }

    function reachable() {
        const seen = new Uint8Array(MAP_W * MAP_H);
        const start = SPAWN.y * MAP_W + SPAWN.x;
        const stack = [start];
        seen[start] = 1;
        while (stack.length) {
            const k = stack.pop();
            const x = k % MAP_W, y = (k - x) / MAP_W;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy;
                if (!inMap(nx, ny)) continue;
                const nk = ny * MAP_W + nx;
                if (!seen[nk] && !solid[nk]) { seen[nk] = 1; stack.push(nk); }
            }
        }
        return seen;
    }

    /* ================= Dessin du décor (une fois, hors écran) ================= */

    function R(g, x, y, w, hh, c) { g.fillStyle = c; g.fillRect(x, y, w, hh); }
    const grassy = (t) => t === GRASS || t === FLOWER || t === TREE;

    let mapCanvas = null;

    function renderMap() {
        mapCanvas = document.createElement('canvas');
        mapCanvas.width = MAP_W * TILE;
        mapCanvas.height = MAP_H * TILE;
        const g = mapCanvas.getContext('2d');
        const rnd = mulberry32(99);

        for (let y = 0; y < MAP_H; y++) {
            for (let x = 0; x < MAP_W; x++) {
                const t = at(x, y), X = x * TILE, Y = y * TILE;
                if (t === WATER) drawWater(g, x, y, X, Y, rnd);
                else if (t === PATH) drawPath(g, x, y, X, Y, rnd);
                else if (t === PLAZA) drawPlaza(g, X, Y, rnd);
                else drawGrass(g, X, Y, rnd);
                if (t === FLOWER) drawFlowers(g, X, Y, rnd);
            }
        }
        for (let y = 0; y < MAP_H; y++) {
            for (let x = 0; x < MAP_W; x++) if (at(x, y) === TREE) drawTree(g, x * TILE, y * TILE, hash(x, y));
        }
        drawFountain(g, FOUNTAIN.x * TILE, FOUNTAIN.y * TILE);
        drawSign(g, SIGN.x * TILE, SIGN.y * TILE);
        drawMailbox(g, MAILBOX.x * TILE, MAILBOX.y * TILE);
        for (const b of BUILDINGS) drawBuilding(g, b);
    }

    function drawGrass(g, X, Y, rnd) {
        R(g, X, Y, TILE, TILE, '#5b9e4c');
        for (let i = 0; i < 4; i++) R(g, X + Math.floor(rnd() * 15), Y + Math.floor(rnd() * 14), 1, 2, '#6fb35c');
        for (let i = 0; i < 4; i++) R(g, X + Math.floor(rnd() * 16), Y + Math.floor(rnd() * 16), 1, 1, '#4c8c3f');
    }
    function drawPath(g, x, y, X, Y, rnd) {
        R(g, X, Y, TILE, TILE, '#d8c192');
        for (let i = 0; i < 5; i++) R(g, X + Math.floor(rnd() * 15), Y + Math.floor(rnd() * 15), 2, 1, '#c9ae7a');
        for (let i = 0; i < 3; i++) R(g, X + Math.floor(rnd() * 15), Y + Math.floor(rnd() * 15), 1, 1, '#e8d8ae');
        const edge = '#b89c66';
        if (grassy(at(x, y - 1))) R(g, X, Y, TILE, 1, edge);
        if (grassy(at(x, y + 1))) R(g, X, Y + 15, TILE, 1, edge);
        if (grassy(at(x - 1, y))) R(g, X, Y, 1, TILE, edge);
        if (grassy(at(x + 1, y))) R(g, X + 15, Y, 1, TILE, edge);
    }
    function drawPlaza(g, X, Y, rnd) {
        R(g, X, Y, TILE, TILE, '#c3c9d4');
        const line = '#a9b1bf';
        R(g, X, Y, TILE, 1, line); R(g, X, Y + 8, TILE, 1, line);
        R(g, X, Y, 1, 8, line); R(g, X + 8, Y + 8, 1, 8, line);
        for (let i = 0; i < 3; i++) R(g, X + 1 + Math.floor(rnd() * 14), Y + 1 + Math.floor(rnd() * 14), 1, 1, '#d6dbe3');
    }
    function drawWater(g, x, y, X, Y, rnd) {
        R(g, X, Y, TILE, TILE, '#3a86c8');
        for (let i = 0; i < 2; i++) R(g, X + Math.floor(rnd() * 12), Y + 3 + Math.floor(rnd() * 10), 3, 1, '#4a97d8');
        const foam = '#9fd6f5';
        if (at(x, y - 1) !== WATER) { R(g, X, Y, TILE, 2, '#2f6fa8'); R(g, X, Y + 2, TILE, 1, foam); }
        if (at(x, y + 1) !== WATER) R(g, X, Y + 14, TILE, 2, foam);
        if (at(x - 1, y) !== WATER) R(g, X, Y, 2, TILE, foam);
        if (at(x + 1, y) !== WATER) R(g, X + 14, Y, 2, TILE, foam);
    }
    function drawFlowers(g, X, Y, rnd) {
        const colors = ['#f9a8d4', '#fde047', '#ffffff', '#fca5a5', '#c4b5fd'];
        for (let i = 0; i < 3; i++) {
            const px = X + 2 + Math.floor(rnd() * 12), py = Y + 2 + Math.floor(rnd() * 12);
            const c = colors[Math.floor(rnd() * colors.length)];
            R(g, px - 1, py, 3, 1, c); R(g, px, py - 1, 1, 3, c); R(g, px, py, 1, 1, '#f59e0b');
        }
    }
    function drawTree(g, X, Y, v) {
        const c1 = v < 0.5 ? '#2e7d3a' : '#2a6f45', c2 = v < 0.5 ? '#43a04e' : '#3a9160', c3 = '#1f5c2b';
        R(g, X + 3, Y + 13, 10, 3, 'rgba(0,0,0,.2)');
        R(g, X + 7, Y + 10, 2, 5, '#6b4423');
        R(g, X + 3, Y + 1, 10, 10, c1); R(g, X + 2, Y + 3, 12, 6, c1); R(g, X + 4, Y, 8, 1, c1);
        R(g, X + 3, Y + 9, 10, 2, c3); R(g, X + 2, Y + 7, 1, 2, c3); R(g, X + 13, Y + 7, 1, 2, c3);
        R(g, X + 5, Y + 2, 4, 3, c2); R(g, X + 4, Y + 4, 2, 2, c2);
    }
    function drawFountain(g, X, Y) {
        R(g, X + 2, Y + 30, 28, 2, 'rgba(0,0,0,.2)');
        R(g, X + 2, Y + 6, 28, 24, '#9aa3b2');
        R(g, X + 2, Y + 6, 28, 2, '#dfe3ea');
        R(g, X + 4, Y + 9, 24, 18, '#3a86c8');
        R(g, X + 4, Y + 9, 24, 2, '#2f6fa8');
        R(g, X + 14, Y + 4, 4, 16, '#dfe3ea');
        R(g, X + 10, Y + 2, 12, 3, '#b8c0cc');
    }
    function drawSign(g, X, Y) {
        R(g, X + 4, Y + 14, 9, 2, 'rgba(0,0,0,.2)');
        R(g, X + 7, Y + 8, 2, 7, '#6b4423');
        R(g, X + 2, Y + 2, 12, 8, '#a16c3a');
        R(g, X + 2, Y + 2, 12, 1, '#c08552');
        R(g, X + 4, Y + 4, 8, 1, '#5c3a1e');
        R(g, X + 4, Y + 7, 6, 1, '#5c3a1e');
    }
    function drawMailbox(g, X, Y) {
        R(g, X + 4, Y + 14, 9, 2, 'rgba(0,0,0,.2)');
        R(g, X + 7, Y + 9, 2, 6, '#374151');
        R(g, X + 3, Y + 2, 10, 8, '#1d4ed8');
        R(g, X + 3, Y + 2, 10, 2, '#3b82f6');
        R(g, X + 5, Y + 5, 6, 1, '#0b1020');
        R(g, X + 13, Y + 3, 2, 3, '#ef4444');
    }

    const STYLE = {
        house:      { roof: '#c2410c', roofD: '#9a3412', roofL: '#f97316', wall: '#f6e7c9', wallD: '#e0cba3', door: '#7c4a1e', trim: '#fffaf0' },
        datacenter: { roof: '#64748b', roofD: '#475569', roofL: '#94a3b8', wall: '#cbd5e1', wallD: '#9aa7ba', door: '#0c4a6e', trim: '#e2e8f0', flat: true },
        lab:        { roof: '#1d4ed8', roofD: '#1e3a8a', roofL: '#3b82f6', wall: '#e0ecfb', wallD: '#bfd2ec', door: '#1e293b', trim: '#ffffff' },
        tower:      { roof: '#be123c', roofD: '#881337', roofL: '#f43f5e', wall: '#e5e7eb', wallD: '#c4c9d1', door: '#374151', trim: '#ffffff' },
        trophy:     { roof: '#6d28d9', roofD: '#4c1d95', roofL: '#8b5cf6', wall: '#fbf1d6', wallD: '#e8d8ae', door: '#78350f', trim: '#fde68a' },
        station:    { roof: '#0f766e', roofD: '#134e4a', roofL: '#14b8a6', wall: '#ecdcc0', wallD: '#d4c09c', door: '#3f2a14', trim: '#fff7e6' },
        post:       { roof: '#1e40af', roofD: '#1e3a8a', roofL: '#3b82f6', wall: '#fcd34d', wallD: '#e7b928', door: '#1e3a8a', trim: '#fffbeb' },
    };

    function drawShell(g, s, X, Y, W, H, roofH) {
        const wallY = Y + roofH, wallH = H - roofH;
        R(g, X + 3, Y + H, W, 3, 'rgba(0,0,0,.2)');
        R(g, X + W, Y + 8, 3, H - 5, 'rgba(0,0,0,.2)');
        R(g, X, wallY, W, wallH, s.wall);
        R(g, X, wallY, W, 2, s.wallD);
        R(g, X, wallY, 2, wallH, s.wallD);
        R(g, X + W - 2, wallY, 2, wallH, s.wallD);
        R(g, X, Y + H - 3, W, 3, '#8b8f97');
        if (s.flat) {
            R(g, X - 1, Y, W + 2, roofH, s.roof);
            R(g, X - 1, Y, W + 2, 2, s.roofL);
            R(g, X - 1, Y + roofH - 3, W + 2, 3, s.roofD);
        } else {
            R(g, X - 3, Y, W + 6, roofH, s.roof);
            for (let yy = Y + 4; yy < Y + roofH - 3; yy += 4) R(g, X - 3, yy, W + 6, 1, s.roofD);
            R(g, X - 3, Y, W + 6, 2, s.roofL);
            R(g, X - 4, Y + roofH - 3, W + 8, 3, s.roofD);
        }
    }

    function drawDoor(g, s, b) {
        const dx = b.door.x * TILE, bottom = (b.y + b.h) * TILE, top = bottom - 23;
        R(g, dx + 1, top - 2, 14, 22, s.trim);
        if (b.style === 'datacenter') {
            R(g, dx + 3, top, 10, 20, '#0c4a6e');
            R(g, dx + 3, top, 4, 20, '#7dd3fc'); R(g, dx + 9, top, 4, 20, '#7dd3fc');
            R(g, dx + 4, top + 1, 1, 8, '#e0f2fe'); R(g, dx + 10, top + 1, 1, 8, '#e0f2fe');
        } else {
            R(g, dx + 3, top, 10, 20, s.door);
            R(g, dx + 3, top, 10, 2, 'rgba(255,255,255,.18)');
            R(g, dx + 10, top + 10, 2, 2, '#fbbf24');
        }
        R(g, dx, bottom - 2, 16, 2, '#9ca3af');
    }

    function drawWindow(g, b, s, x, y) {
        if (b.style === 'datacenter') {
            R(g, x - 1, y - 3, 14, 22, '#1e293b');
            for (let r = 0; r < 5; r++) {
                R(g, x + 1, y - 1 + r * 4, 10, 3, '#334155');
                b.leds.push({ x: x + 2 + (r % 2) * 6, y: y + r * 4 });
            }
            return;
        }
        if (b.style === 'lab') {
            R(g, x - 1, y - 1, 14, 12, s.trim);
            R(g, x, y, 12, 10, '#0f172a');
            b.screens.push({ x, y, w: 12 });
            return;
        }
        R(g, x - 1, y - 1, 14, 12, s.trim);
        R(g, x, y, 12, 10, '#8fd0f3');
        R(g, x + 1, y + 1, 4, 2, '#d8f1ff');
        R(g, x + 6, y, 1, 10, s.trim);
        R(g, x, y + 5, 12, 1, s.trim);
        R(g, x - 2, y + 11, 16, 2, s.wallD);
    }

    function drawBuilding(g, b) {
        const s = STYLE[b.style];
        if (b.style === 'tower') { drawTower(g, b, s); return; }
        const X = b.x * TILE, Y = b.y * TILE, W = b.w * TILE, H = b.h * TILE;
        const roofH = Math.round(H * 0.46), wallY = Y + roofH, wallH = H - roofH;
        const doorC = b.door.x * TILE + 8;
        const cx = X + Math.floor(W / 2);
        drawShell(g, s, X, Y, W, H, roofH);

        if (b.style === 'trophy') {
            for (let px = X + 8; px + 6 <= X + W - 6; px += 20) {
                if (Math.abs(px + 3 - doorC) < 14) continue;
                R(g, px - 1, wallY + 3, 8, 2, '#e5c46b');
                R(g, px, wallY + 5, 6, wallH - 9, s.trim);
                R(g, px + 4, wallY + 5, 2, wallH - 9, s.wallD);
            }
        } else {
            const startX = b.style === 'station' ? X + 66 : X + 10;
            for (let wx = startX; wx + 12 <= X + W - 8; wx += 22) {
                if (Math.abs(wx + 6 - doorC) < 16) continue;
                drawWindow(g, b, s, wx, wallY + 10);
            }
        }
        drawDoor(g, s, b);

        if (b.style === 'house') {
            R(g, X + W - 26, Y - 6, 8, 14, '#78716c');
            R(g, X + W - 27, Y - 8, 10, 3, '#57534e');
        } else if (b.style === 'datacenter') {
            for (let i = 0; i < 4; i++) {
                const vx = X + 12 + i * 45;
                R(g, vx, Y + 12, 18, 12, '#475569');
                for (let k = 0; k < 3; k++) R(g, vx + 2, Y + 14 + k * 3, 14, 1, '#334155');
            }
            R(g, doorC - 16, wallY + 4, 32, 5, '#0ea5e9');
        } else if (b.style === 'lab') {
            R(g, X + W - 32, Y + 8, 14, 10, '#e5e7eb');
            R(g, X + W - 30, Y + 10, 10, 6, '#cbd5e1');
            R(g, X + W - 26, Y + 18, 2, 8, '#9ca3af');
            R(g, X + 16, Y - 10, 1, 16, '#9ca3af');
            b.antenna = { x: X + 16, y: Y - 11 };
        } else if (b.style === 'trophy') {
            R(g, cx - 6, Y + 8, 12, 8, '#fbbf24');
            R(g, cx - 8, Y + 9, 2, 5, '#fbbf24'); R(g, cx + 6, Y + 9, 2, 5, '#fbbf24');
            R(g, cx - 4, Y + 9, 3, 3, '#fde68a');
            R(g, cx - 2, Y + 16, 4, 4, '#f59e0b');
            R(g, cx - 5, Y + 20, 10, 3, '#d97706');
        } else if (b.style === 'station') {
            R(g, cx - 8, Y + 6, 16, 16, '#134e4a');
            R(g, cx - 7, Y + 7, 14, 14, '#fffdf7');
            R(g, cx, Y + 9, 1, 6, '#111827'); R(g, cx, Y + 14, 4, 1, '#111827');
            R(g, X + 10, wallY + 8, 48, 22, '#111827');
            R(g, X + 10, wallY + 8, 48, 2, '#374151');
            b.board = { x: X + 13, y: wallY + 12 };
        } else if (b.style === 'post') {
            R(g, cx - 9, Y + 9, 18, 12, '#ffffff');
            for (let i = 0; i < 9; i++) {
                R(g, cx - 9 + i, Y + 9 + Math.floor(i * 0.6), 1, 1, '#94a3b8');
                R(g, cx + 8 - i, Y + 9 + Math.floor(i * 0.6), 1, 1, '#94a3b8');
            }
            R(g, X, Y + H - 16, W, 3, '#1e40af');
        }
    }

    function drawTower(g, b, s) {
        const X = b.x * TILE, Y = b.y * TILE, W = b.w * TILE, H = b.h * TILE;
        const baseY = Y + 58, baseH = H - 58, cx = X + W / 2;
        const hw = (yy) => 2 + Math.floor((yy - Y - 6) * 0.14);
        for (let yy = Y + 6; yy < baseY + 4; yy++) {
            const w = hw(yy);
            R(g, cx - w - 1, yy, 1, 1, '#9ca3af');
            R(g, cx + w, yy, 1, 1, '#9ca3af');
            if ((yy - Y) % 8 === 0) R(g, cx - w, yy, w * 2, 1, '#cbd5e1');
        }
        for (let k = Y + 8; k + 8 < baseY; k += 8) {
            for (let i = 0; i <= 8; i++) {
                const yy = k + i, w = hw(yy), f = i / 8;
                R(g, Math.round(cx - w + f * (2 * w - 1)), yy, 1, 1, '#6b7280');
                R(g, Math.round(cx + w - 1 - f * (2 * w - 1)), yy, 1, 1, '#6b7280');
            }
        }
        R(g, cx - 1, Y - 2, 2, 9, '#e5e7eb');
        b.light = { x: cx - 1, y: Y - 4 };
        R(g, cx + 6, Y + 22, 6, 6, '#f1f5f9'); R(g, cx + 5, Y + 23, 1, 4, '#94a3b8');
        R(g, cx - 12, Y + 34, 6, 6, '#f1f5f9'); R(g, cx - 6, Y + 35, 1, 4, '#94a3b8');

        drawShell(g, s, X, baseY, W, baseH, 26);
        drawWindow(g, b, s, X + 10, baseY + 36);
        drawWindow(g, b, s, X + W - 22, baseY + 36);
        drawDoor(g, s, b);
    }

    /* ================= Sprites ================= */

    let time = 0;

    function drawPerson(g, ox, oy, dir, step, look) {
        const P = (x, y, w, hh, c) => R(g, ox + x, oy + y, w, hh, c);
        const { skin, shirt, pants } = look;
        const hair = look.hair || '#2a1b12', shoe = '#1f2937', shade = 'rgba(0,0,0,.2)';
        const side = dir === 'left' || dir === 'right';
        const lUp = step === 1 ? 1 : 0, rUp = step === 2 ? 1 : 0;
        P(3, 14, 10, 2, 'rgba(0,0,0,.22)');
        if (side) {
            P(6, 11, 2, 3 - lUp, pants); P(8, 11, 2, 3 - rUp, pants);
            P(dir === 'left' ? 5 : 6, 14 - lUp, 3, 1, shoe); P(dir === 'left' ? 7 : 8, 14 - rUp, 3, 1, shoe);
        } else {
            P(5, 11, 2, 3 - lUp, pants); P(9, 11, 2, 3 - rUp, pants);
            P(5, 14 - lUp, 2, 1, shoe); P(9, 14 - rUp, 2, 1, shoe);
        }
        P(4, 7, 8, 5, shirt); P(4, 11, 8, 1, shade);
        const sw = step === 1 ? 1 : step === 2 ? -1 : 0;
        if (side) {
            P(7, 8 + sw, 2, 3, shirt); P(7, 8 + sw, 2, 3, shade); P(7, 11 + sw, 2, 1, skin);
        } else {
            P(3, 8 + sw, 1, 3, shirt); P(12, 8 - sw, 1, 3, shirt);
            P(3, 11 + sw, 1, 1, skin); P(12, 11 - sw, 1, 1, skin);
        }
        if (dir === 'up' && look.pack) P(5, 8, 6, 3, look.pack);
        P(4, 1, 8, 6, skin);
        if (dir === 'down') { P(4, 0, 8, 2, hair); P(4, 2, 1, 2, hair); P(11, 2, 1, 2, hair); P(6, 4, 1, 1, '#111'); P(9, 4, 1, 1, '#111'); }
        else if (dir === 'up') P(4, 0, 8, 6, hair);
        else if (dir === 'left') { P(4, 0, 8, 2, hair); P(8, 2, 4, 3, hair); P(5, 4, 1, 1, '#111'); }
        else { P(4, 0, 8, 2, hair); P(4, 2, 4, 3, hair); P(10, 4, 1, 1, '#111'); }
        if (look.hat) { P(3, 0, 10, 1, look.hat); P(4, -1, 8, 1, look.hat); }
    }

    function drawRobot(g, ox, oy, dir) {
        const bob = REDUCED ? 0 : Math.round(Math.sin(time * 3));
        R(g, ox + 3, oy + 14, 10, 2, 'rgba(0,0,0,.22)');
        const P = (x, y, w, hh, c) => R(g, ox + x, oy + y + bob, w, hh, c);
        P(7, 1, 2, 3, '#94a3b8');
        P(7, 0, 2, 1, Math.floor(time * 2) % 2 ? '#f43f5e' : '#fda4af');
        P(3, 4, 10, 8, '#cbd5e1'); P(3, 4, 10, 1, '#e2e8f0'); P(3, 11, 10, 1, '#94a3b8');
        P(4, 5, 8, 5, '#0f172a');
        if (time % 3.2 > 0.12 && dir !== 'up') {
            const ex = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
            P(5 + ex, 7, 2, 2, '#38bdf8'); P(9 + ex, 7, 2, 2, '#38bdf8');
        }
        P(2, 7, 1, 3, '#94a3b8'); P(13, 7, 1, 3, '#94a3b8');
        P(5, 12, 6, 1, '#64748b'); P(4, 13, 3, 1, '#475569'); P(9, 13, 3, 1, '#475569');
    }

    function drawCat(g, ox, oy) {
        const P = (x, y, w, hh, c) => R(g, ox + x, oy + y, w, hh, c);
        const tail = REDUCED ? 0 : Math.floor(time * 2) % 2;
        P(3, 14, 10, 2, 'rgba(0,0,0,.2)');
        P(4, 9, 8, 5, '#9ca3af'); P(4, 13, 2, 1, '#6b7280'); P(10, 13, 2, 1, '#6b7280');
        P(3, 5, 6, 5, '#9ca3af'); P(3, 4, 1, 2, '#9ca3af'); P(8, 4, 1, 2, '#9ca3af');
        P(4, 7, 1, 1, '#111'); P(7, 7, 1, 1, '#111'); P(5, 8, 2, 1, '#f9a8d4');
        P(12, 8 - tail, 1, 4, '#9ca3af'); P(12, 7 - tail, 2, 1, '#9ca3af');
    }

    function drawChest(g, ox, oy, open) {
        const P = (x, y, w, hh, c) => R(g, ox + x, oy + y, w, hh, c);
        P(2, 14, 12, 2, 'rgba(0,0,0,.22)');
        P(2, 7, 12, 7, '#8b5a2b'); P(2, 13, 12, 1, '#6b4423');
        if (open) { P(2, 3, 12, 3, '#6b4423'); P(3, 6, 10, 2, '#fde68a'); }
        else { P(2, 4, 12, 4, '#a0692f'); P(2, 4, 12, 1, '#c08552'); }
        P(2, 8, 12, 1, '#fbbf24'); P(7, 8, 2, 3, '#fbbf24'); P(7, 10, 2, 1, '#b45309');
        if (!open && !REDUCED && time % 2 < 0.5) { P(13, 2, 1, 3, '#fff'); P(12, 3, 3, 1, '#fff'); }
    }

    function drawChip(g, cx, cy, seed) {
        const bob = REDUCED ? 0 : Math.round(Math.sin(time * 3 + seed) * 1.5);
        g.fillStyle = `rgba(74, 222, 128, ${0.22 + 0.12 * Math.sin(time * 4 + seed)})`;
        g.beginPath(); g.arc(cx, cy + bob, 8, 0, Math.PI * 2); g.fill();
        R(g, cx - 5, cy + 7, 10, 2, 'rgba(0,0,0,.2)');
        const x = cx - 4, y = cy - 4 + bob;
        R(g, x, y, 8, 8, '#15803d');
        R(g, x + 2, y + 2, 4, 4, '#0f172a');
        R(g, x + 2, y + 2, 1, 1, '#4ade80');
        for (let i = 0; i < 3; i++) {
            R(g, x - 1, y + 1 + i * 3, 1, 1, '#fbbf24'); R(g, x + 8, y + 1 + i * 3, 1, 1, '#fbbf24');
            R(g, x + 1 + i * 3, y - 1, 1, 1, '#fbbf24'); R(g, x + 1 + i * 3, y + 8, 1, 1, '#fbbf24');
        }
    }

    function playerLook() {
        const o = OUTFITS[state.avatar.outfit] || OUTFITS[0];
        return { skin: SKINS[state.avatar.skin] || SKINS[1], shirt: o.shirt, pants: o.pants, hair: '#2a1b12', pack: '#7c2d12' };
    }

    /* ================= Contenu (lu dans ../index.html) ================= */

    const $ = (sel) => document.querySelector(sel);

    function h(tag, props, ...kids) {
        const e = document.createElement(tag);
        if (props) {
            for (const [k, v] of Object.entries(props)) {
                if (v == null || v === false) continue;
                if (k === 'class') e.className = v;
                else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
                else e.setAttribute(k, v === true ? '' : String(v));
            }
        }
        for (const kid of kids.flat(Infinity)) {
            if (kid == null || kid === false || kid === '') continue;
            e.append(kid instanceof Node ? kid : String(kid));
        }
        return e;
    }
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const txt = (n) => clean(n ? n.textContent : '');

    function safeHref(href) {
        if (!href || href.trim() === '#') return null;
        try {
            const u = new URL(href, INDEX_URL);
            return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol) ? u.href : null;
        } catch { return null; }
    }
    function link(href, label, cls, extra) {
        const u = safeHref(href);
        if (!u) return null;
        const external = /^https?:/.test(u) && new URL(u).origin !== location.origin;
        return h('a', { class: cls, href: u, target: external ? '_blank' : null, rel: external ? 'noopener noreferrer' : null, ...extra }, label);
    }
    // Recopie un paragraphe du site en ne gardant que le texte, <strong>, <em> et <br>.
    function rich(node) {
        const frag = document.createDocumentFragment();
        if (!node) return frag;
        node.childNodes.forEach((c) => {
            if (c.nodeType === 3) frag.append(c.textContent.replace(/\s+/g, ' '));
            else if (c.nodeType === 1) {
                const t = c.tagName.toLowerCase();
                if (t === 'br') frag.append(document.createElement('br'));
                else if (t === 'strong' || t === 'b' || t === 'em') frag.append(h(t === 'em' ? 'em' : 'strong', null, rich(c)));
                else frag.append(rich(c));
            }
        });
        return frag;
    }

    const EMPTY = {
        name: 'Kader Belem', role: '', badge: '', heroDesc: null, heroTarget: '', socials: [], cv: null,
        about: [], formations: [], badges: [], certIntro: '', skillsIntro: '', skills: [], projects: [],
        veille: { info: '', items: [] }, experiences: [], contact: { intro: '', items: [], form: null },
    };
    let data = EMPTY;
    let contentError = false;

    async function loadContent() {
        const res = await fetch(INDEX_URL, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const one = (sel, root = doc) => root.querySelector(sel);
        const all = (sel, root = doc) => [...root.querySelectorAll(sel)];
        const cvLink = one('a[href$=".pdf"]');
        const form = one('#contactForm');

        return {
            name: txt(one('.title-name')) || 'Kader Belem',
            role: txt(one('.footer-muted')),
            badge: txt(one('.hero-badge')),
            heroDesc: one('.hero-description'),
            heroTarget: txt(one('.hero-target')),
            socials: all('.hero-social a').map((a) => ({ label: a.getAttribute('aria-label') || txt(a), href: a.getAttribute('href') })),
            cv: cvLink ? cvLink.getAttribute('href') : null,
            about: all('#about .about-text'),
            formations: all('#about .cert-item').map((i) => ({ title: txt(one('.cert-title', i)), meta: txt(one('.cert-meta', i)) })),
            badges: all('[data-share-badge-id]').map((d) => d.getAttribute('data-share-badge-id')).filter((id) => /^[\w-]+$/.test(id)),
            certIntro: txt(one('#certifications .certifications-intro')),
            skillsIntro: txt(one('#skills .skills-intro')),
            skills: all('#skills .skill-card').map((c) => ({
                name: txt(one('.skill-name', c)),
                items: [...(one('.skill-list', c) || { childNodes: [] }).childNodes]
                    .filter((n) => n.nodeType === 3).map((n) => clean(n.textContent)).filter(Boolean),
            })),
            projects: all('#projects .project-card').map((c) => ({
                title: txt(one('.project-title', c)),
                desc: txt(one('.project-description', c)),
                tags: all('.project-tag', c).map(txt),
                details: all('.project-details-hidden h4', c).map((h4) => ({ title: txt(h4), text: txt(h4.nextElementSibling) })),
                points: all('.project-points li', c).map(txt),
                tech: all('.tech-badge', c).map(txt),
                link: (one('.project-link-btn', c) || { getAttribute: () => null }).getAttribute('href'),
            })),
            veille: {
                info: txt(one('#veille .veille-update-info')),
                items: all('#veille .veille-card').map((c) => ({
                    title: txt(one('.veille-title', c)),
                    href: (one('.veille-title a', c) || { getAttribute: () => null }).getAttribute('href'),
                    source: txt(one('.veille-source', c)),
                    tag: txt(one('.veille-tag', c)),
                    date: txt(one('.veille-date-tag', c)),
                    points: all('.veille-points li', c).map(txt),
                })),
            },
            experiences: all('#experience .timeline-item').map((i) => {
                const items = all('li', i).map(txt);
                const env = items.find((t) => /^Environnement technique/i.test(t)) || '';
                return {
                    date: txt(one('.timeline-date', i)),
                    title: txt(one('h3', i)),
                    place: txt(one('h4', i)),
                    points: items.filter((t) => t !== env),
                    env: env.replace(/^Environnement technique\s*:\s*/i, ''),
                };
            }),
            contact: {
                intro: txt(one('#contact .contact-intro')),
                items: all('#contact .contact-item').map((i) => {
                    const a = one('.contact-details a', i), p = one('.contact-details p', i);
                    return { label: txt(one('h3', i)), value: txt(a || p), href: a ? a.getAttribute('href') : null, node: p };
                }),
                form: form ? {
                    action: form.getAttribute('action'),
                    hidden: all('input[type=hidden]', form).map((x) => [x.getAttribute('name'), x.getAttribute('value') || '']),
                } : null,
            },
        };
    }

    const chipTotal = () => Math.min(CHIP_SPOTS.length, data.skills.length || CHIP_SPOTS.length);
    const contactValue = (re) => {
        const item = data.contact.items.find((i) => re.test(i.label));
        return item ? item.value : '';
    };

    /* ================= Sauvegarde ================= */

    const state = {
        visited: new Set(), chips: new Set(), talked: new Set(),
        avatar: { skin: 1, outfit: 0 }, sound: true, done: false, chestOpened: false, pos: null,
    };
    let hasSave = false;

    function loadSave() {
        try {
            const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
            if (!s) return;
            state.visited = new Set((s.visited || []).filter((id) => PLACES[id]));
            state.chips = new Set(s.chips || []);
            state.talked = new Set(s.talked || []);
            if (s.avatar) state.avatar = { skin: s.avatar.skin | 0, outfit: s.avatar.outfit | 0 };
            state.sound = s.sound !== false;
            state.done = !!s.done;
            state.chestOpened = !!s.chestOpened;
            state.pos = s.pos || null;
            hasSave = state.visited.size > 0 || state.chips.size > 0 || state.talked.size > 0;
        } catch { /* stockage indisponible : on joue sans sauvegarde */ }
    }
    function save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({
                visited: [...state.visited], chips: [...state.chips], talked: [...state.talked],
                avatar: state.avatar, sound: state.sound, done: state.done, chestOpened: state.chestOpened,
                pos: { x: player.x, y: player.y, dir: player.dir },
            }));
        } catch { /* ignoré */ }
    }
    function resetSave() {
        try { localStorage.removeItem(SAVE_KEY); } catch { /* ignoré */ }
        state.visited.clear(); state.chips.clear(); state.talked.clear();
        state.done = false; state.chestOpened = false; state.pos = null;
        placePlayer(SPAWN.x * TILE + 8, SPAWN.y * TILE + 10, 'up');
        hasSave = false;
    }

    /* ================= Son ================= */

    let audio = null;
    function tone(freq, dur = 0.08, type = 'square', vol = 0.035, when = 0) {
        if (!state.sound) return;
        try {
            audio = audio || new (window.AudioContext || window.webkitAudioContext)();
            if (audio.state === 'suspended') audio.resume();
            const t0 = audio.currentTime + when;
            const o = audio.createOscillator(), gn = audio.createGain();
            o.type = type; o.frequency.value = freq;
            gn.gain.setValueAtTime(vol, t0);
            gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            o.connect(gn).connect(audio.destination);
            o.start(t0); o.stop(t0 + dur + 0.02);
        } catch { /* audio indisponible */ }
    }
    const sfx = {
        blip: () => tone(620 + Math.random() * 80, 0.03, 'square', 0.015),
        open: () => { tone(523, 0.08); tone(784, 0.1, 'square', 0.035, 0.07); },
        close: () => tone(392, 0.07, 'square', 0.025),
        pick: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.09, 'square', 0.035, i * 0.06)),
        win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.06, i * 0.12)),
    };

    /* ================= Joueur, entrées, caméra ================= */

    const canvas = $('#world');
    const ctx = canvas.getContext('2d');
    let dpr = 1, S = 3;
    const cam = { x: 0, y: 0 };
    const player = { x: SPAWN.x * TILE + 8, y: SPAWN.y * TILE + 10, dir: 'up', moving: false, anim: 0 };
    const keys = {};
    const stick = { x: 0, y: 0 };
    let running = false;
    let playing = false;
    let target = null;
    let doorLatch = false;
    let saveTimer = 0;
    let panelOpen = false, mapOpen = false;
    let confetti = [];

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 3);
        const r = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(r.width * dpr));
        canvas.height = Math.max(1, Math.round(r.height * dpr));
        // Au moins ~18 × 11 tuiles visibles (12 de large sur téléphone, sinon tout est minuscule)
        const tilesWide = r.width < 700 ? 12 : 18;
        S = Math.max(2, Math.floor(Math.min(canvas.width / (TILE * tilesWide), canvas.height / (TILE * 11))));
        snapCamera();
    }

    function blockedAt(x, y) {
        const x0 = Math.floor((x - 5) / TILE), x1 = Math.floor((x + 5) / TILE);
        const y0 = Math.floor((y - 5) / TILE), y1 = Math.floor((y + 1) / TILE);
        for (let j = y0; j <= y1; j++) {
            for (let i = x0; i <= x1; i++) if (!inMap(i, j) || solid[j * MAP_W + i]) return true;
        }
        return false;
    }
    function tryMove(dx, dy) {
        if (blockedAt(player.x + dx, player.y + dy)) return true;
        player.x += dx; player.y += dy;
        return false;
    }
    function placePlayer(x, y, dir) {
        player.x = x; player.y = y; player.dir = dir || player.dir;
        snapCamera();
    }

    const overlayOpen = () => panelOpen || mapOpen || dlg.open || !playing;

    const MOVE = {
        ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
        ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
    };
    function clearInput() {
        for (const k of Object.keys(keys)) delete keys[k];
        running = false;
    }

    function camTarget() {
        const vw = canvas.width / S, vh = canvas.height / S;
        const mw = MAP_W * TILE, mh = MAP_H * TILE;
        let tx, ty;
        if (playing) { tx = player.x - vw / 2; ty = player.y - 8 - vh / 2; }
        else {
            tx = mw / 2 + Math.cos(time * 0.06) * mw * 0.3 - vw / 2;
            ty = mh / 2 + Math.sin(time * 0.09) * mh * 0.25 - vh / 2;
        }
        return {
            x: vw >= mw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, tx)),
            y: vh >= mh ? (mh - vh) / 2 : Math.max(0, Math.min(mh - vh, ty)),
        };
    }
    function snapCamera() { const t = camTarget(); cam.x = t.x; cam.y = t.y; }

    /* ================= Interactions ================= */

    function interactables() {
        const list = BUILDINGS.map((b) => ({
            type: 'door', x: b.door.x * TILE + 8, y: (b.door.y + 1) * TILE + 8, r: 16,
            label: `Entrer · ${PLACES[b.id].name}`, act: () => openPlace(b.id),
        }));
        for (const n of NPCS) {
            list.push({ type: 'npc', x: n.x * TILE + 8, y: n.y * TILE + 8, r: 22, label: `Parler · ${n.name}`, act: () => talk(n) });
        }
        list.push({ type: 'chest', x: CHEST.x * TILE + 8, y: CHEST.y * TILE + 8, r: 22, label: 'Ouvrir · Coffre au trésor', act: openChest });
        list.push({ type: 'sign', x: SIGN.x * TILE + 8, y: SIGN.y * TILE + 8, r: 22, label: 'Lire · Panneau', act: readSign });
        list.push({ type: 'sign', x: MAILBOX.x * TILE + 8, y: MAILBOX.y * TILE + 8, r: 22, label: 'Lire · Boîte aux lettres', act: () => openPlace('contact') });
        return list;
    }
    let INTERACTABLES = [];

    function findTarget() {
        let best = null, bestD = Infinity;
        for (const it of INTERACTABLES) {
            const d = Math.hypot(player.x - it.x, player.y - it.y);
            if (d < it.r && d < bestD) { best = it; bestD = d; }
        }
        return best;
    }
    function interact() {
        if (overlayOpen() || !target) return;
        clearInput();
        target.act();
    }

    const promptEl = $('#prompt');
    let promptLabel = '';
    function updatePrompt() {
        const label = target && !overlayOpen() ? target.label : '';
        if (label === promptLabel) return;
        promptLabel = label;
        promptEl.hidden = !label;
        if (label) promptEl.replaceChildren(h('kbd', null, KEY_LABEL), label);
    }

    /* ================= Dialogues ================= */

    const dlg = { open: false, pages: [], i: 0, shown: 0, choices: null, lastLen: -1 };
    const dialogEl = $('#dialog');

    function say(name, pages, opts = {}) {
        Object.assign(dlg, { open: true, pages: pages.filter(Boolean), i: 0, shown: REDUCED ? 1e9 : 0, choices: opts.choices || null, lastLen: -1 });
        clearInput();
        $('#dialogName').textContent = name;
        $('#dialogChoices').replaceChildren();
        dialogEl.hidden = false;
        updatePrompt();
        renderDialog();
    }
    function renderDialog() {
        const page = dlg.pages[dlg.i] || '';
        const n = Math.min(page.length, Math.floor(dlg.shown));
        if (n !== dlg.lastLen) { $('#dialogText').textContent = page.slice(0, n); dlg.lastLen = n; }
        const done = n >= page.length, last = dlg.i === dlg.pages.length - 1;
        $('#dialogNext').hidden = !done || (last && !!dlg.choices);
        const box = $('#dialogChoices');
        if (done && last && dlg.choices && !box.childElementCount) {
            for (const c of dlg.choices) {
                box.append(h('button', { class: 'px-btn', type: 'button', onclick: () => { endDialog(); if (c.act) c.act(); } }, c.label));
            }
            box.firstChild.focus({ preventScroll: true });
        }
    }
    function advance() {
        const page = dlg.pages[dlg.i] || '';
        if (dlg.shown < page.length) { dlg.shown = page.length; renderDialog(); return; }
        if (dlg.i < dlg.pages.length - 1) { dlg.i++; dlg.shown = REDUCED ? 1e9 : 0; dlg.lastLen = -1; renderDialog(); return; }
        if (dlg.choices) return;
        endDialog();
    }
    function endDialog() {
        dlg.open = false;
        dialogEl.hidden = true;
        $('#dialogChoices').replaceChildren();
        focusGame();
    }
    dialogEl.addEventListener('click', (e) => { if (!e.target.closest('button')) advance(); });

    function faceTowardsPlayer(n) {
        const dx = player.x - (n.x * TILE + 8), dy = player.y - (n.y * TILE + 8);
        n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }

    function talk(n) {
        faceTowardsPlayer(n);
        const first = !state.talked.has(n.id);
        state.talked.add(n.id);
        save();
        const out = LINES[n.id](first);
        say(n.name, out.pages || out, out);
    }

    const howToInteract = IS_TOUCH ? 'touche le bouton A' : 'appuie sur E ou Espace';
    const howToMap = IS_TOUCH ? 'touche « Carte » en haut de l\'écran' : 'appuie sur M';

    const LINES = {
        byte(first) {
            if (state.done) {
                return {
                    pages: ['Quête terminée ! Merci d\'avoir exploré le portfolio de Kader.', 'Il ne reste qu\'une chose à faire : le contacter.'],
                    choices: [{ label: '✉️ Contacter Kader', act: () => openPlace('contact') }, { label: 'Continuer', act: null }],
                };
            }
            if (first) {
                return [
                    `Bip bop ! Bienvenue dans le monde de ${data.name}. Je suis Byte, son assistant réseau.`,
                    data.heroTarget ? `Sa quête du moment : ${data.heroTarget}` : null,
                    `Chaque bâtiment contient une partie de son portfolio. Approche-toi d'une porte et ${howToInteract}.`,
                    `Bonus : ${chipTotal()} modules de compétences sont cachés dans le monde. Visite les ${PLACE_ORDER.length} lieux et trouve-les tous pour terminer la quête !`,
                    `Pressé ? ${howToMap[0].toUpperCase() + howToMap.slice(1)} pour ouvrir la carte et aller directement où tu veux. Bonne exploration !`,
                ];
            }
            const left = PLACE_ORDER.filter((id) => !state.visited.has(id)).map((id) => PLACES[id].name);
            return [
                `Progression : ${state.visited.size}/${PLACE_ORDER.length} lieux visités, ${state.chips.size}/${chipTotal()} modules trouvés.`,
                left.length ? `Il te reste à visiter : ${left.join(', ')}.` : 'Tous les lieux sont visités ! Cherche les puces vertes qui brillent pour trouver les derniers modules.',
            ];
        },
        ping: () => ['Miaou.', '(Ping le chat surveille le réseau. Son temps de réponse : moins d\'une milliseconde.)'],
        sam: () => [
            'Salut ! Je veille sur le datacenter, juste à côté.',
            data.skills.length ? `Kader y a rangé ses compétences : ${data.skills.slice(0, 3).map((s) => s.name).join(', ')}… et d'autres encore.` : null,
            'Ici tout est supervisé. Si un serveur tombe, l\'alerte part avant même qu\'on s\'en rende compte.',
        ],
        lou: () => [
            'Chut… je pêche des paquets perdus.',
            'Depuis que Kader a configuré le DHCP du quartier, plus aucun ne se perd. Je m\'ennuie un peu.',
        ],
        alex() {
            const dispo = contactValue(/dispo/i);
            return {
                pages: [
                    'Bonjour ! Je recrute des alternants en informatique.',
                    dispo ? `D'après sa fiche, Kader cherche : ${dispo}` : null,
                    'Pour lui écrire, le bureau de poste est juste là. Et son CV est dans le coffre de la place centrale.',
                ],
                choices: [
                    { label: '✉️ Écrire à Kader', act: () => openPlace('contact') },
                    { label: '📄 Voir le CV', act: openChest },
                    { label: 'Plus tard', act: null },
                ],
            };
        },
    };

    function readSign() {
        say('Panneau', [
            'Place centrale. Le Datacenter est au nord, la Gare des stages au sud et la Tour radio à l\'est.',
            IS_TOUCH
                ? 'Joystick : se déplacer. Bouton A : interagir. « Carte » : accès rapide à toutes les sections.'
                : 'ZQSD, WASD ou flèches : se déplacer. Maj : courir. E ou Espace : interagir. M : carte.',
        ]);
    }

    /* ================= Fenêtres de contenu ================= */

    const panelWrap = $('#panelWrap');
    let credlyLoaded = false;
    let certNode = null;

    function openPanel({ icon, kicker, title, body, color }) {
        clearInput();
        $('#panelIcon').textContent = icon;
        $('#panelKicker').textContent = kicker;
        $('#panelTitle').textContent = title;
        panelWrap.style.setProperty('--accent', color || 'var(--primary)');
        const bodyEl = $('#panelBody');
        bodyEl.replaceChildren(body);
        bodyEl.scrollTop = 0;
        panelOpen = true;
        panelWrap.hidden = false;
        updatePrompt();
        sfx.open();
        $('#panelClose').focus({ preventScroll: true });
    }
    function closePanel() {
        if (!panelOpen) return;
        panelOpen = false;
        panelWrap.hidden = true;
        sfx.close();
        focusGame();
        maybeComplete();
    }
    $('#panelClose').addEventListener('click', closePanel);
    panelWrap.addEventListener('click', (e) => { if (e.target === panelWrap) closePanel(); });

    function openPlace(id) {
        const p = PLACES[id];
        if (!state.visited.has(id)) {
            state.visited.add(id);
            toast(`Lieu découvert : ${p.name}`, `${state.visited.size}/${PLACE_ORDER.length} lieux visités`, p.icon);
            updateHud();
            save();
        }
        const body = contentError && id !== 'certifications' ? unavailable() : BUILD[id]();
        openPanel({ icon: p.icon, kicker: p.name, title: p.section, body, color: p.color });
        if (id === 'certifications' && !credlyLoaded && data.badges.length) {
            credlyLoaded = true;
            document.body.append(h('script', { src: CREDLY_SCRIPT, async: true }));
        }
    }

    function openChest() {
        if (!state.chestOpened) { state.chestOpened = true; save(); }
        const cv = safeHref(data.cv);
        const body = h('div', null,
            h('p', { class: 'lead' }, 'Tu as trouvé le coffre ! Il contient le CV de Kader, prêt à être téléchargé.'),
            cv ? h('div', { class: 'btn-row' },
                h('a', { class: 'px-btn primary', href: cv, download: '' }, '📄 Télécharger le CV (PDF)'),
                h('a', { class: 'px-btn', href: cv, target: '_blank', rel: 'noopener' }, 'Ouvrir dans un onglet'),
            ) : h('p', { class: 'muted' }, 'Le CV n\'a pas pu être chargé. Il est disponible sur la version classique.'),
            data.socials.length ? h('h3', null, 'Ses profils') : null,
            h('div', { class: 'btn-row' }, data.socials.map((s) => link(s.href, s.label, 'px-btn'))),
        );
        openPanel({ icon: '🧰', kicker: 'Coffre au trésor', title: 'Curriculum vitæ', body, color: '#fbbf24' });
    }

    function unavailable() {
        return h('div', null,
            h('p', null, 'Le contenu de cette section n\'a pas pu être chargé.'),
            h('p', null, h('a', { class: 'px-btn primary', href: '../' }, 'Voir la version classique')),
        );
    }

    const stat = (label, value) => (value ? h('div', { class: 'stat' }, h('dt', null, label), h('dd', null, value)) : null);
    const bullets = (items) => (items.length ? h('ul', { class: 'points' }, items.map((t) => h('li', null, t))) : null);

    const BUILD = {
        about() {
            const f = data.formations[0];
            return h('div', null,
                h('dl', { class: 'sheet' },
                    stat('Classe', data.role),
                    stat('Formation actuelle', f ? `${f.title} (${f.meta.split('|')[0].trim()})` : ''),
                    stat('Expérience', data.experiences.length ? `${data.experiences.length} stages` : ''),
                    stat('Base', contactValue(/locali/i)),
                ),
                data.heroTarget ? h('p', { class: 'callout' }, '🎯 ', data.heroTarget) : null,
                data.heroDesc ? h('p', { class: 'lead' }, rich(data.heroDesc)) : null,
                data.about.map((p) => h('p', null, rich(p))),
                data.formations.length ? h('h3', null, 'Formations') : null,
                h('ul', { class: 'quest-log' }, data.formations.map((x) => h('li', null, h('strong', null, x.title), h('span', null, x.meta)))),
                h('div', { class: 'btn-row' },
                    safeHref(data.cv) ? h('a', { class: 'px-btn primary', href: safeHref(data.cv), download: '' }, '📄 Télécharger le CV') : null,
                    data.socials.map((s) => link(s.href, s.label, 'px-btn')),
                ),
            );
        },

        certifications() {
            if (certNode) return certNode;
            certNode = h('div', null,
                h('p', null, data.certIntro || 'Badges vérifiables.'),
                data.badges.length
                    ? h('div', { class: 'credly-grid' }, data.badges.map((id) => h('div', { class: 'credly-card' },
                        h('div', { 'data-iframe-width': '150', 'data-iframe-height': '270', 'data-share-badge-id': id, 'data-share-badge-host': 'https://www.credly.com' }))))
                    : h('p', { class: 'muted' }, 'Aucun badge à afficher pour le moment.'),
                data.badges.length ? h('p', { class: 'muted small' }, 'Les badges sont chargés depuis Credly : cliquez dessus pour vérifier leur authenticité.') : null,
            );
            return certNode;
        },

        skills() {
            const total = chipTotal();
            return h('div', null,
                data.skillsIntro ? h('p', null, data.skillsIntro) : null,
                h('p', { class: 'muted' }, `Modules trouvés dans le monde : ${state.chips.size}/${total}. Chaque puce verte ramassée allume un module.`),
                h('div', { class: 'grid' }, data.skills.map((s, i) => {
                    const found = state.chips.has(i);
                    return h('article', { class: 'card module' + (found ? ' found' : '') },
                        h('header', null,
                            h('span', { class: 'led', 'aria-hidden': 'true' }),
                            h('h4', null, s.name),
                            i < total ? h('span', { class: 'pill' + (found ? ' ok' : '') }, found ? 'Trouvé' : 'À trouver') : null),
                        h('ul', { class: 'chips' }, s.items.map((it) => h('li', null, it))),
                    );
                })),
            );
        },

        projects() {
            return h('div', { class: 'grid' }, data.projects.map((p) => h('article', { class: 'card' },
                h('div', { class: 'tags' }, p.tags.map((t) => h('span', { class: 'tag' }, t))),
                h('h4', null, p.title),
                h('p', null, p.desc),
                bullets(p.points),
                h('div', { class: 'tech' }, p.tech.map((t) => h('span', { class: 'badge' }, t))),
                p.details.length ? h('details', null,
                    h('summary', null, 'Voir le détail'),
                    p.details.map((d) => [h('h5', null, d.title), h('p', null, d.text)])) : null,
                link(p.link, 'Voir sur GitHub', 'px-btn small'),
            )));
        },

        veille() {
            return h('div', null,
                data.veille.info ? h('p', { class: 'muted' }, '🕒 ', data.veille.info) : null,
                data.veille.items.length
                    ? h('div', { class: 'grid' }, data.veille.items.map((v) => h('article', { class: 'card veille-card' },
                        h('div', { class: 'tags' }, v.tag ? h('span', { class: 'tag' }, v.tag) : null, v.date ? h('span', { class: 'badge' }, v.date) : null),
                        h('h4', null, link(v.href, v.title) || v.title),
                        v.source ? h('p', { class: 'muted small' }, 'Source : ', v.source) : null,
                        bullets(v.points),
                    )))
                    : h('p', null, 'Aucun article pour le moment.'),
            );
        },

        experience() {
            return h('div', null,
                h('p', { class: 'muted' }, 'Tableau des départs : cliquez sur une ligne pour voir le détail du stage.'),
                h('div', { class: 'board' },
                    h('div', { class: 'board-head', 'aria-hidden': 'true' }, h('span', null, 'Année'), h('span', null, 'Destination'), h('span', null, 'Lieu')),
                    data.experiences.map((e, i) => h('details', { class: 'board-row', open: i === 0 },
                        h('summary', null, h('span', { class: 'b-date' }, e.date), h('span', null, e.title), h('span', { class: 'b-place' }, e.place)),
                        h('div', { class: 'board-body' },
                            bullets(e.points),
                            e.env ? h('p', { class: 'env' }, h('strong', null, 'Environnement technique : '), e.env) : null),
                    )),
                ),
            );
        },

        contact() {
            const c = data.contact;
            const action = c.form && safeHref(c.form.action);
            let form = null;
            if (action) {
                const status = h('p', { class: 'muted small', role: 'status' });
                const submit = h('button', { class: 'px-btn primary', type: 'submit' }, '✉️ Envoyer le message');
                form = h('form', { class: 'form', action, method: 'POST', target: '_blank' },
                    c.form.hidden.map(([name, value]) => h('input', {
                        type: 'hidden', name,
                        value: name === '_subject' ? 'Nouveau message depuis le portfolio (version jeu)' : value,
                    })),
                    h('label', null, 'Nom complet', h('input', { type: 'text', name: 'name', required: true, minlength: '2', autocomplete: 'name' })),
                    h('label', null, 'Email', h('input', { type: 'email', name: 'email', required: true, autocomplete: 'email' })),
                    h('label', null, 'Message', h('textarea', { name: 'message', rows: '5', required: true, minlength: '10' })),
                    submit, status);
                form.addEventListener('submit', () => {
                    submit.disabled = true;
                    status.textContent = 'Envoi en cours… la confirmation s\'ouvre dans un nouvel onglet.';
                    setTimeout(() => { form.reset(); submit.disabled = false; status.textContent = 'Merci ! Votre message a été transmis.'; }, 1500);
                });
            }
            return h('div', null,
                c.intro ? h('p', { class: 'lead' }, c.intro) : null,
                h('ul', { class: 'contact-list' }, c.items.map((i) => h('li', null,
                    h('span', { class: 'c-label' }, i.label),
                    i.href ? link(i.href, i.value) : h('span', null, i.node ? rich(i.node) : i.value)))),
                form ? h('h3', null, 'Envoyer un message') : null,
                form,
            );
        },
    };

    /* ================= Carte (accès rapide) ================= */

    const mapWrap = $('#mapWrap');

    function teleport(id) {
        const b = BUILDINGS.find((x) => x.id === id);
        placePlayer(b.door.x * TILE + 8, (b.door.y + 1) * TILE + 7, 'up');
    }

    function openMap() {
        if (!playing || panelOpen || dlg.open) return;
        clearInput();
        const mm = h('canvas', { class: 'minimap', width: MAP_W * 4, height: MAP_H * 4, 'aria-hidden': 'true' });
        const m = mm.getContext('2d');
        m.drawImage(mapCanvas, 0, 0, MAP_W * 4, MAP_H * 4);
        for (const b of BUILDINGS) {
            m.fillStyle = PLACES[b.id].color;
            m.fillRect(b.door.x * 4 - 3, b.door.y * 4 - 3, 10, 10);
        }
        m.fillStyle = '#fff';
        m.fillRect(Math.round(player.x / 4) - 4, Math.round(player.y / 4) - 6, 8, 8);
        m.fillStyle = '#ef4444';
        m.fillRect(Math.round(player.x / 4) - 2, Math.round(player.y / 4) - 4, 4, 4);

        const total = PLACE_ORDER.length + chipTotal();
        const got = state.visited.size + state.chips.size;
        const item = (icon, name, sub, visited, btns) => h('li', { class: 'map-item' + (visited ? ' visited' : '') },
            h('span', { class: 'map-ico', 'aria-hidden': 'true' }, icon),
            h('span', null, h('span', { class: 'map-name' }, (visited ? '✓ ' : '') + name), h('span', { class: 'map-sub' }, sub)),
            h('span', { class: 'map-btns' }, btns));

        $('#mapBody').replaceChildren(h('div', { class: 'map-layout' },
            h('div', null,
                mm,
                h('p', { class: 'small muted' }, `Progression de la quête : ${got}/${total}`),
                h('div', { class: 'progress', 'aria-hidden': 'true' }, h('span', { style: `width:${Math.round((got / total) * 100)}%` })),
                h('div', { class: 'btn-row' },
                    h('a', { class: 'px-btn small', href: '../' }, 'Version classique'),
                    h('button', { class: 'px-btn small', type: 'button', onclick: () => { resetSave(); updateHud(); closeMap(); toast('Nouvelle partie', 'Progression remise à zéro', '↺'); } }, 'Recommencer'),
                ),
            ),
            h('ul', { class: 'map-list' },
                PLACE_ORDER.map((id) => {
                    const p = PLACES[id];
                    return item(p.icon, p.section, p.name, state.visited.has(id), [
                        h('button', { class: 'px-btn small primary', type: 'button', onclick: () => { closeMap(); teleport(id); openPlace(id); } }, 'Ouvrir'),
                        h('button', { class: 'px-btn small', type: 'button', onclick: () => { closeMap(); teleport(id); } }, 'Y aller'),
                    ]);
                }),
                item('🧰', 'CV', 'Coffre de la place centrale', state.chestOpened, [
                    h('button', { class: 'px-btn small primary', type: 'button', onclick: () => { closeMap(); openChest(); } }, 'Ouvrir'),
                ]),
            ),
        ));
        mapOpen = true;
        mapWrap.hidden = false;
        updatePrompt();
        sfx.open();
        $('#mapClose').focus({ preventScroll: true });
    }
    function closeMap() {
        if (!mapOpen) return;
        mapOpen = false;
        mapWrap.hidden = true;
        focusGame();
    }
    $('#mapClose').addEventListener('click', () => { sfx.close(); closeMap(); });
    mapWrap.addEventListener('click', (e) => { if (e.target === mapWrap) closeMap(); });

    /* ================= HUD, notifications, fin de quête ================= */

    function updateHud() {
        const sm = matchMedia('(max-width: 640px)').matches;
        $('#hudPlaces').textContent = `🏠 ${sm ? '' : 'Lieux '}${state.visited.size}/${PLACE_ORDER.length}`;
        $('#hudChips').textContent = `💾 ${sm ? '' : 'Modules '}${state.chips.size}/${chipTotal()}`;
        $('#hudPlaces').classList.toggle('done', state.visited.size >= PLACE_ORDER.length);
        $('#hudChips').classList.toggle('done', state.chips.size >= chipTotal());
        const snd = $('#btnSound');
        snd.textContent = state.sound ? '🔊' : '🔇';
        snd.setAttribute('aria-pressed', String(state.sound));
        snd.setAttribute('aria-label', state.sound ? 'Couper le son' : 'Activer le son');
    }

    function toast(title, sub, icon) {
        const t = h('div', { class: 'toast' }, h('span', { class: 'toast-ico', 'aria-hidden': 'true' }, icon || '★'), h('div', null, h('strong', null, title), sub ? h('span', null, sub) : null));
        $('#toasts').append(t);
        setTimeout(() => t.classList.add('out'), 3200);
        setTimeout(() => t.remove(), 3700);
    }

    function maybeComplete() {
        if (state.done || overlayOpen()) return;
        if (state.visited.size < PLACE_ORDER.length || state.chips.size < chipTotal()) return;
        state.done = true;
        save();
        sfx.win();
        confettiBurst();
        say('Byte', [
            'Bip bip bip ! Quête terminée : tu as exploré tout le portfolio de Kader.',
            'Tu connais maintenant ses compétences, ses projets et son parcours. Prochaine étape : le rencontrer !',
        ], {
            choices: [
                { label: '✉️ Contacter Kader', act: () => openPlace('contact') },
                { label: '📄 Télécharger le CV', act: openChest },
                { label: 'Continuer à explorer', act: null },
            ],
        });
    }

    function confettiBurst() {
        if (REDUCED) return;
        const colors = ['#38bdf8', '#4ade80', '#fbbf24', '#f472b6', '#a78bfa'];
        for (let i = 0; i < 160; i++) {
            confetti.push({
                x: canvas.width / 2, y: canvas.height * 0.4,
                vx: (Math.random() - 0.5) * canvas.width * 0.9,
                vy: -Math.random() * canvas.height * 0.9 - canvas.height * 0.2,
                s: (3 + Math.random() * 4) * dpr, c: colors[i % colors.length], life: 2 + Math.random() * 1.5,
            });
        }
    }

    /* ================= Boucle de jeu ================= */

    function update(dt) {
        time += dt;
        let pushUp = false, iy = 0;

        if (!overlayOpen()) {
            let ix = 0;
            for (const [code, [dx, dy]] of Object.entries(MOVE)) if (keys[code]) { ix += dx; iy += dy; }
            ix += stick.x; iy += stick.y;
            const len = Math.hypot(ix, iy);
            if (len > 1) { ix /= len; iy /= len; }
            player.moving = len > 0.15;
            if (player.moving) {
                const sp = running || len > 0.95 && (stick.x || stick.y) ? RUN : WALK;
                if (Math.abs(ix) > Math.abs(iy)) player.dir = ix < 0 ? 'left' : 'right';
                else player.dir = iy < 0 ? 'up' : 'down';
                tryMove(ix * sp * dt, 0);
                const blockedY = tryMove(0, iy * sp * dt);
                // Aide à contourner les coins quand on avance tout droit
                if (blockedY && Math.abs(ix) < 0.3) {
                    for (const off of [3, -3, 6, -6]) {
                        if (!blockedAt(player.x + off, player.y + iy * sp * dt)) { tryMove(Math.sign(off) * Math.min(Math.abs(off), sp * dt), 0); break; }
                    }
                }
                pushUp = blockedY && iy < -0.5;
                player.anim += dt * (sp / WALK) * 8;
                saveTimer += dt;
                if (saveTimer > 2) { saveTimer = 0; save(); }
            }

            const total = chipTotal();
            for (let i = 0; i < total; i++) {
                if (state.chips.has(i)) continue;
                const [cx, cy] = CHIP_SPOTS[i];
                if (Math.hypot(player.x - (cx * TILE + 8), player.y - (cy * TILE + 10)) < 12) {
                    state.chips.add(i);
                    const s = data.skills[i];
                    sfx.pick();
                    toast(`Module trouvé : ${s ? s.name : 'compétence'}`, s ? s.items.slice(0, 3).join(' · ') : `${state.chips.size}/${total}`, '💾');
                    updateHud();
                    save();
                    maybeComplete();
                }
            }
            target = findTarget();
            // Pousser contre une porte suffit pour entrer
            if (pushUp && target && target.type === 'door' && !doorLatch) { doorLatch = true; target.act(); }
        } else {
            player.moving = false;
        }
        if (iy > -0.5) doorLatch = false;
        updatePrompt();

        if (dlg.open) {
            const page = dlg.pages[dlg.i] || '';
            if (dlg.shown < page.length) {
                const before = Math.floor(dlg.shown);
                dlg.shown += dt * 55;
                if (Math.floor(dlg.shown / 3) > Math.floor(before / 3)) sfx.blip();
            }
            renderDialog();
        }

        const t = camTarget();
        const k = REDUCED || !playing ? 1 : Math.min(1, dt * 8);
        cam.x += (t.x - cam.x) * k;
        cam.y += (t.y - cam.y) * k;

        if (confetti.length) {
            for (const p of confetti) { p.vy += canvas.height * 1.3 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; p.life -= dt; }
            confetti = confetti.filter((p) => p.life > 0 && p.y < canvas.height + 20);
        }
    }

    function drawDynamic(x0, y0, x1, y1) {
        const g = ctx;
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                if (at(x, y) !== WATER) continue;
                const k = hash(x, y), ph = (time * 0.8 + k * 10) % 3;
                if (ph < 1) R(g, x * TILE + 1 + Math.floor(k * 10), y * TILE + 4 + Math.floor(hash(y, x) * 9), 2 + Math.floor(ph * 3), 1, 'rgba(215,240,255,.85)');
            }
        }
        for (const b of BUILDINGS) {
            if ((b.x + b.w) < x0 - 1 || b.x > x1 + 1 || (b.y + b.h) < y0 - 1 || b.y > y1 + 2) continue;
            b.leds.forEach((l, i) => {
                const on = hash(i, Math.floor(time * 3 + i * 0.37)) > 0.3;
                R(g, l.x, l.y, 2, 1, on ? (hash(i, 7) > 0.8 ? '#f59e0b' : '#22c55e') : '#14532d');
            });
            b.screens.forEach((sc, i) => {
                for (let r = 0; r < 3; r++) {
                    const w = 2 + Math.floor(hash(i * 7 + r, Math.floor(time * 2)) * (sc.w - 4));
                    R(g, sc.x + 1, sc.y + 2 + r * 3, w, 1, '#4ade80');
                }
            });
            if (b.board) {
                for (let row = 0; row < 3; row++) {
                    for (let c = 0; c < 10; c++) {
                        if (hash(c + row * 13, Math.floor(time * 0.7) + row) > 0.35) R(g, b.board.x + c * 4, b.board.y + row * 6, 3, 3, '#fbbf24');
                    }
                }
            }
            if (b.antenna && Math.floor(time * 1.5) % 2 === 0) R(g, b.antenna.x - 1, b.antenna.y - 1, 3, 2, '#ef4444');
            if (b.light) {
                R(g, b.light.x, b.light.y, 2, 2, Math.floor(time * 1.5) % 2 === 0 ? '#ff3b5c' : '#7f1d1d');
                if (!REDUCED) {
                    for (const off of [0, 0.5]) {
                        const p = (time * 0.6 + off) % 1;
                        g.strokeStyle = `rgba(56, 189, 248, ${0.9 * (1 - p)})`;
                        g.lineWidth = 1;
                        g.beginPath();
                        g.arc(b.light.x + 1, b.light.y + 1, 4 + p * 20, -Math.PI * 0.85, -Math.PI * 0.15);
                        g.stroke();
                    }
                }
            }
        }
        if (!REDUCED) {
            const fx = FOUNTAIN.x * TILE + 16, fy = FOUNTAIN.y * TILE + 4;
            for (let i = 0; i < 8; i++) {
                const p = (time * 0.9 + i / 8) % 1, side = i % 2 ? 1 : -1;
                R(g, Math.round(fx + side * p * 9), Math.round(fy - Math.sin(p * Math.PI) * 6 + p * 12), 1, 2, '#d6efff');
            }
        }
    }

    function drawEntities() {
        const g = ctx;
        const list = [];
        for (const n of NPCS) list.push({ y: n.y * TILE + 14, draw: () => drawNpc(g, n) });
        list.push({ y: CHEST.y * TILE + 14, draw: () => drawChest(g, CHEST.x * TILE, CHEST.y * TILE, state.chestOpened) });
        const total = chipTotal();
        for (let i = 0; i < total; i++) {
            if (state.chips.has(i)) continue;
            const [cx, cy] = CHIP_SPOTS[i];
            list.push({ y: cy * TILE + 12, draw: () => drawChip(g, cx * TILE + 8, cy * TILE + 8, i) });
        }
        if (playing) {
            list.push({
                y: player.y,
                draw: () => {
                    const step = player.moving ? [1, 0, 2, 0][Math.floor(player.anim) % 4] : 0;
                    drawPerson(g, Math.round(player.x) - 8, Math.round(player.y) - 14, player.dir, step, playerLook());
                },
            });
        }
        list.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
    }

    function drawNpc(g, n) {
        const ox = n.x * TILE, oy = n.y * TILE - 1;
        if (n.kind === 'robot') drawRobot(g, ox, oy, n.dir);
        else if (n.kind === 'cat') drawCat(g, ox, oy);
        else drawPerson(g, ox, oy, n.dir, 0, n.look);
    }

    function drawOverlay(ox, oy) {
        const g = ctx;
        g.setTransform(1, 0, 0, 1, 0, 0);
        const fs = Math.round(Math.max(13 * dpr, S * 4.5));
        g.font = `600 ${fs}px "Pixelify Sans", ui-monospace, monospace`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const toScreen = (wx, wy) => [wx * S - ox, wy * S - oy];

        for (const b of BUILDINGS) {
            const p = PLACES[b.id];
            const label = (state.visited.has(b.id) ? '✓ ' : '') + p.label;
            const [sx, sy] = toScreen(b.x * TILE + b.w * 8, b.y * TILE - (b.style === 'tower' ? 14 : b.style === 'house' ? 14 : 7));
            if (sx < -300 || sy < -60 || sx > canvas.width + 300 || sy > canvas.height + 60) continue;
            const w = g.measureText(label).width + fs * 1.1, hh = Math.round(fs * 1.6), bar = Math.max(2, Math.round(S * 0.7));
            g.fillStyle = 'rgba(11, 16, 32, .88)';
            g.fillRect(Math.round(sx - w / 2), Math.round(sy - hh / 2), Math.round(w), hh);
            g.fillStyle = p.color;
            g.fillRect(Math.round(sx - w / 2), Math.round(sy + hh / 2 - bar), Math.round(w), bar);
            g.fillStyle = '#f8fafc';
            g.fillText(label, sx, sy - bar / 2);
        }

        if (playing) {
            for (const n of NPCS) {
                if (state.talked.has(n.id)) continue;
                const bob = REDUCED ? 0 : Math.sin(time * 4) * 1.5;
                const [sx, sy] = toScreen(n.x * TILE + 8, n.y * TILE - 6 + bob);
                bubble(g, sx, sy, '!', '#fbbf24', '#1f1300', fs);
            }
            if (target && !overlayOpen()) {
                const bob = REDUCED ? 0 : Math.sin(time * 6) * 1.5;
                const [sx, sy] = toScreen(player.x, player.y - 22 + bob);
                bubble(g, sx, sy, KEY_LABEL, '#38bdf8', '#04101d', fs);
            }
        }

        for (const p of confetti) { g.fillStyle = p.c; g.fillRect(p.x, p.y, p.s, p.s * 0.6); }
    }

    function bubble(g, sx, sy, text, bg, fg, fs) {
        const size = Math.round(fs * 1.5), b = Math.max(2, Math.round(fs / 7));
        const x = Math.round(sx - size / 2), y = Math.round(sy - size / 2);
        g.fillStyle = '#f8fafc'; g.fillRect(x - b, y - b, size + b * 2, size + b * 2);
        g.fillStyle = bg; g.fillRect(x, y, size, size);
        g.fillStyle = fg; g.fillText(text, sx, sy + 1);
    }

    function render() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#1f4d2b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const ox = Math.round(cam.x * S), oy = Math.round(cam.y * S);
        ctx.setTransform(S, 0, 0, S, -ox, -oy);
        ctx.drawImage(mapCanvas, 0, 0);
        const vw = canvas.width / S, vh = canvas.height / S;
        drawDynamic(
            Math.max(0, Math.floor(cam.x / TILE) - 1), Math.max(0, Math.floor(cam.y / TILE) - 1),
            Math.min(MAP_W - 1, Math.ceil((cam.x + vw) / TILE) + 1), Math.min(MAP_H - 1, Math.ceil((cam.y + vh) / TILE) + 1),
        );
        drawEntities();
        drawOverlay(ox, oy);
    }

    let last = performance.now();
    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        update(dt);
        render();
        if (!playing) drawAvatarPreview();
        requestAnimationFrame(frame);
    }

    /* ================= Écran titre ================= */

    const avatarCtx = $('#avatarPreview').getContext('2d');
    function drawAvatarPreview() {
        avatarCtx.setTransform(1, 0, 0, 1, 0, 0);
        avatarCtx.clearRect(0, 0, 64, 64);
        avatarCtx.setTransform(4, 0, 0, 4, 0, 0);
        const step = REDUCED ? 0 : [1, 0, 2, 0][Math.floor(time * 5) % 4];
        drawPerson(avatarCtx, 0, 0, 'down', step, playerLook());
    }

    function buildSwatches() {
        const make = (el, colors, key, label) => {
            el.replaceChildren(...colors.map((c, i) => h('button', {
                class: 'swatch', type: 'button', style: `background:${c}`,
                'aria-label': `${label} ${i + 1}`, 'aria-pressed': String(state.avatar[key] === i),
                onclick: () => { state.avatar[key] = i; buildSwatches(); save(); },
            })));
        };
        make($('#skinSwatches'), SKINS, 'skin', 'Peau');
        make($('#outfitSwatches'), OUTFITS.map((o) => o.shirt), 'outfit', 'Tenue');
    }

    function focusGame() { canvas.focus({ preventScroll: true }); }

    function startGame() {
        tone(0, 0.001, 'sine', 0.0001); // débloque l'audio sur ce geste
        $('#title').hidden = true;
        $('#hud').hidden = false;
        if (IS_TOUCH) $('#touch').hidden = false;
        playing = true;
        updateHud();
        snapCamera();
        focusGame();
        if (!state.talked.has('byte')) setTimeout(() => talk(NPCS[0]), 350);
    }

    /* ================= Événements ================= */

    const isField = (el) => el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    // e.code suit la position physique (ZQSD en AZERTY = WASD). Certains claviers
    // virtuels ne le renseignent pas : on retombe alors sur e.key.
    const KEY_FALLBACK = {
        arrowup: 'ArrowUp', arrowdown: 'ArrowDown', arrowleft: 'ArrowLeft', arrowright: 'ArrowRight',
        z: 'KeyW', w: 'KeyW', q: 'KeyA', a: 'KeyA', s: 'KeyS', d: 'KeyD', ' ': 'Space', enter: 'Enter', e: 'KeyE',
    };
    const codeOf = (e) => e.code || KEY_FALLBACK[(e.key || '').toLowerCase()] || '';

    addEventListener('keydown', (e) => {
        if (!playing) return;
        if (e.key === 'Escape') {
            if (panelOpen) closePanel();
            else if (mapOpen) closeMap();
            else if (dlg.open && !dlg.choices) endDialog();
            return;
        }
        if (isField(e.target) || panelOpen || mapOpen) return;
        const code = codeOf(e);
        const act = code === 'Space' || code === 'Enter' || code === 'KeyE';
        if (dlg.open) {
            if (act && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); advance(); }
            return;
        }
        if (e.key && e.key.toLowerCase() === 'm') { e.preventDefault(); openMap(); return; }
        if (act) { e.preventDefault(); interact(); return; }
        if (MOVE[code]) { keys[code] = true; e.preventDefault(); }
        if (e.key === 'Shift') running = true;
    });
    addEventListener('keyup', (e) => {
        const code = codeOf(e);
        if (MOVE[code]) delete keys[code];
        if (e.key === 'Shift') running = false;
    });
    addEventListener('blur', clearInput);
    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing) save(); });

    canvas.addEventListener('pointerdown', () => { if (dlg.open) advance(); });
    promptEl.addEventListener('click', interact);
    $('#btnMap').addEventListener('click', openMap);
    $('#btnSound').addEventListener('click', () => { state.sound = !state.sound; updateHud(); save(); focusGame(); });
    $('#btnStart').addEventListener('click', startGame);
    $('#btnReset').addEventListener('click', () => { resetSave(); $('#btnReset').hidden = true; $('#btnStart').textContent = '▶ Jouer'; });

    // Joystick tactile
    const stickEl = $('#stick'), knob = $('#stickKnob');
    let stickId = null;
    function moveStick(e) {
        const r = stickEl.getBoundingClientRect();
        let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        const l = Math.hypot(dx, dy);
        if (l > 1) { dx /= l; dy /= l; }
        stick.x = Math.abs(dx) < 0.2 ? 0 : dx;
        stick.y = Math.abs(dy) < 0.2 ? 0 : dy;
        knob.style.transform = `translate(${dx * r.width * 0.3}px, ${dy * r.height * 0.3}px)`;
    }
    function endStick(e) {
        if (e.pointerId !== stickId) return;
        stickId = null; stick.x = 0; stick.y = 0; knob.style.transform = '';
    }
    stickEl.addEventListener('pointerdown', (e) => { stickId = e.pointerId; stickEl.setPointerCapture(e.pointerId); moveStick(e); });
    stickEl.addEventListener('pointermove', (e) => { if (e.pointerId === stickId) moveStick(e); });
    stickEl.addEventListener('pointerup', endStick);
    stickEl.addEventListener('pointercancel', endStick);
    $('#touchA').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (dlg.open) advance(); else interact();
    });

    /* ================= Démarrage ================= */

    buildWorld();
    renderMap();
    INTERACTABLES = interactables();
    loadSave();
    if (state.pos && !blockedAt(state.pos.x, state.pos.y)) placePlayer(state.pos.x, state.pos.y, state.pos.dir);
    if (IS_TOUCH) document.body.classList.add('is-touch');
    buildSwatches();
    $('#titleHelp').textContent = IS_TOUCH
        ? 'Joystick pour te déplacer, bouton A pour interagir.'
        : 'ZQSD / WASD / flèches pour te déplacer · E ou Espace pour interagir · M pour la carte';
    resize();
    requestAnimationFrame(frame);

    const startBtn = $('#btnStart');
    loadContent()
        .then((d) => {
            data = d;
            if (data.badge) $('#titleSub').textContent = [data.role, data.badge].filter(Boolean).join(' · ');
        })
        .catch(() => {
            contentError = true;
            $('#loadStatus').textContent = 'Le contenu du portfolio n\'a pas pu être chargé. Le monde reste explorable, mais les bâtiments seront vides.';
        })
        .finally(() => {
            startBtn.disabled = false;
            startBtn.textContent = hasSave ? '▶ Continuer' : '▶ Jouer';
            $('#btnReset').hidden = !hasSave;
            startBtn.focus({ preventScroll: true });
        });
})();
