// ── SNAKE.state — single source of truth ────────
SNAKE.state = {
    // ── Core game ──
    snake: [],
    food: null,
    foodIsBonus: false,
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    highScore: 0,
    isRunning: false,
    isPaused: false,
    phase: 'menu',          // 'menu' | 'playing' | 'paused' | 'gameover'
    mode: 'classic',        // 'classic' | 'timed' | 'infinite' | 'maze'
    camMode: 0,             // 0=ISO, 1=3P, 2=FP
    lastTickTime: 0,
    ateThisTick: false,

    // ── Mode-specific ──
    modeTimer: 0,           // seconds remaining (timed, infinite)
    modeData: null,         // per-mode data (e.g., maze obstacles)

    // ── Power-ups ──
    activePowerUps: {},
    powerUpSpawnTimer: 0,

    // ── Combo ──
    comboCount: 0,
    comboMultiplier: 1,

    // ── Speed modifiers ──
    speedMultiplier: 1,
    scoreMultiplier: 1,

    // ── State flags ──
    wallPassActive: false,
    shieldActive: false,
    magnetActive: false,

    // ── Settings (defaults, overridden by settings.js) ──
    settings: {
        masterVolume: 0.8,
        sfxVolume: 0.7,
        graphicsQuality: 'high',
        cameraSensitivity: 0.5,
        theme: 'default',
        showFPSCounter: false
    }
};

// ── State helpers ─────────────────────────────────
SNAKE.resetState = function(mode) {
    var s = SNAKE.state;
    s.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    s.direction = { x: 1, y: 0 };
    s.nextDirection = { x: 1, y: 0 };
    s.score = 0;
    s.isRunning = false;
    s.isPaused = false;
    s.phase = 'menu';
    s.mode = mode || 'classic';
    s.lastTickTime = 0;
    s.ateThisTick = false;
    s.modeTimer = 0;
    s.modeData = null;
    s.activePowerUps = {};
    s.powerUpSpawnTimer = 0;
    s.comboCount = 0;
    s.comboMultiplier = 1;
    s.speedMultiplier = 1;
    s.scoreMultiplier = 1;
    s.wallPassActive = false;
    s.shieldActive = false;
    s.magnetActive = false;
    s.highScore = parseInt(SNAKE.storage.get('snakeHighScore3D', '0'));
};

SNAKE.getInterval = function() {
    var s = SNAKE.state;
    var diffMult = { easy: 1.35, normal: 1.0, hard: 0.7 }[s.settings.difficulty] || 1;
    var base = Math.max(SNAKE.CONST.MIN_INTERVAL,
        SNAKE.CONST.BASE_INTERVAL - Math.floor(s.score / 20) * 5);
    return Math.max(30, (base * diffMult) / s.speedMultiplier);
};

SNAKE.isPowerUpActive = function(type) {
    var entry = SNAKE.state.activePowerUps[type];
    if (!entry) return false;
    return entry.expiresAt > Date.now() / 1000;
};
