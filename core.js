// ── SNAKE namespace & shared core ──────────────
window.SNAKE = window.SNAKE || {};

SNAKE.CONST = {
    GRID_SIZE: 20,
    HALF_GRID: 10,
    BASE_INTERVAL: 150,
    MIN_INTERVAL: 60,
    PLATFORM_SIZE: 20.8,
    MAX_EAT_PARTICLES: 30,
    MAX_TRAIL: 12,
    MAX_POWERUPS: 3,
    POWERUP_SPAWN_INTERVAL: 8,     // seconds between spawn attempts
    COMBO_TIERS: [0, 3, 5, 8, 12, 16, 20],  // consecutive eats for multipliers
    COMBO_MULTIPLIERS: [1, 1.5, 2, 2.5, 3, 3.5, 4],
    LEADERBOARD_SIZE: 10
};

// ── Direction helpers ────────────────────────────
SNAKE.DIR = {
    RIGHT: { x: 1, y: 0 },
    LEFT:  { x: -1, y: 0 },
    UP:    { x: 0, y: -1 },
    DOWN:  { x: 0, y: 1 },

    opposite: function(a, b) {
        return a.x + b.x === 0 && a.y + b.y === 0;
    },

    name: function(d) {
        if (d.x === 1 && d.y === 0)  return '→ 右';
        if (d.x === -1 && d.y === 0) return '← 左';
        if (d.x === 0 && d.y === -1) return '↑ 上';
        if (d.x === 0 && d.y === 1)  return '↓ 下';
        return '(' + d.x + ',' + d.y + ')';
    },

    // Rotate direction CCW (left turn in FP)
    rotateLeft: function(d) {
        return { x: d.y, y: -d.x };
    },

    // Rotate direction CW (right turn in FP)
    rotateRight: function(d) {
        return { x: -d.y, y: d.x };
    }
};

// ── Grid ↔ World conversion ──────────────────────
SNAKE.gridToWorld = function(gx, gy) {
    return {
        x: gx - SNAKE.CONST.HALF_GRID + 0.5,
        z: gy - SNAKE.CONST.HALF_GRID + 0.5
    };
};

SNAKE.worldToGrid = function(wx, wz) {
    return {
        x: Math.round(wx + SNAKE.CONST.HALF_GRID - 0.5),
        y: Math.round(wz + SNAKE.CONST.HALF_GRID - 0.5)
    };
};

// ── Random helpers ────────────────────────────────
SNAKE.randInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

SNAKE.randFloat = function(min, max) {
    return Math.random() * (max - min) + min;
};

SNAKE.clamp = function(v, min, max) {
    return Math.max(min, Math.min(max, v));
};

// ── Persistence ───────────────────────────────────
SNAKE.storage = {
    get: function(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            return raw !== null ? raw : fallback;
        } catch (e) { return fallback; }
    },

    set: function(key, value) {
        try { localStorage.setItem(key, value); } catch (e) {}
    },

    getJSON: function(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) { return fallback; }
    },

    setJSON: function(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }
};
