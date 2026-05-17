// ── SNAKE.game — game tick, loop, state transitions ─
SNAKE.game = {
    animFrameId: null,
    lastTickTime: 0,
    _menuAnimId: null,

    // ── Apply a turn (relative to current direction) ──
    applyTurn: function(newDir) {
        var s = SNAKE.state;
        if (SNAKE.DIR.opposite(s.direction, newDir)) return;
        if (s.phase !== 'playing') {
            s.nextDirection.x = newDir.x;
            s.nextDirection.y = newDir.y;
            SNAKE.game.resumeGame();
            return;
        }
        if (s.isPaused) return;
        s.nextDirection.x = newDir.x;
        s.nextDirection.y = newDir.y;
    },

    // ── First-person: WASD relative to snake heading ──
    fpForward: function() {
        var s = SNAKE.state;
        if (s.phase !== 'playing') SNAKE.game.applyTurn({ x: s.direction.x, y: s.direction.y });
    },
    fpLeft: function() {
        var s = SNAKE.state;
        SNAKE.game.applyTurn(SNAKE.DIR.rotateLeft(s.direction));
    },
    fpRight: function() {
        var s = SNAKE.state;
        SNAKE.game.applyTurn(SNAKE.DIR.rotateRight(s.direction));
    },
    fpBackward: function() {
        var s = SNAKE.state;
        SNAKE.game.applyTurn({ x: -s.direction.x, y: -s.direction.y });
    },

    // ── Absolute: for isometric / third-person ──
    absUp:    function() { SNAKE.game.applyTurn({ x: 0, y: -1 }); },
    absDown:  function() { SNAKE.game.applyTurn({ x: 0, y: 1 }); },
    absLeft:  function() { SNAKE.game.applyTurn({ x: -1, y: 0 }); },
    absRight: function() { SNAKE.game.applyTurn({ x: 1, y: 0 }); },

    // ── Init / reset ──────────────────────────────────
    init: function(mode) {
        var s = SNAKE.state;
        SNAKE.resetState(mode || 'classic');
        var sc = SNAKE.scene;

        // Auto-detect quality on first launch only
        if (!SNAKE.storage.get('snake_settings')) {
            var w = window.innerWidth;
            if (w < 480) sc.setQuality('low');
            else if (w < 768) sc.setQuality('medium');
        }

        sc.foodGroup.visible = false;
        sc.headGlow.visible = false;
        sc.shakeAmount = 0;
        sc.trailHistory.length = 0;
        sc.trailTimer = 0;

        // Clear mesh arrays
        if (sc.clearSnake) sc.clearSnake();
        sc.clearObstacles();
        sc.clearPowerUps();

        // Place first food & rebuild snake
        s.food = sc.spawnFood(s.snake);
        sc.rebuildSnakeMeshes(s.snake);
        sc.updateSnakeTargets(s.snake, s.direction);
        sc.prevHeadLogical.set(0, -5.08, 0);

        // Clear powerups & combo
        if (SNAKE.powerups && SNAKE.powerups.clear) SNAKE.powerups.clear();
        if (SNAKE.combo && SNAKE.combo.reset) SNAKE.combo.reset();

        // Apply solid walls setting to mode data
        s.modeData = {};
        if (s.mode === 'classic' || s.mode === 'timed') {
            s.modeData.solidWalls = !!s.settings.solidWalls;
        }

        // Mode init hook
        if (SNAKE.gamemodes && SNAKE.gamemodes.init) {
            SNAKE.gamemodes.init(s.mode);
        }
    },

    // ── Single game tick ─────────────────────────────
    gameTick: function() {
        var s = SNAKE.state;
        var sc = SNAKE.scene;

        s.direction.x = s.nextDirection.x;
        s.direction.y = s.nextDirection.y;

        var head = {
            x: s.snake[0].x + s.direction.x,
            y: s.snake[0].y + s.direction.y
        };

        // Wall wrapping or solid walls
        var gs = SNAKE.CONST.GRID_SIZE;
        var solidWalls = s.modeData && s.modeData.solidWalls;
        if (solidWalls) {
            if (head.x < 0 || head.x >= gs || head.y < 0 || head.y >= gs) {
                if (s.shieldActive) {
                    s.shieldActive = false;
                    s.activePowerUps.shield = 0;
                    SNAKE.hud.hidePowerUp('shield');
                    head.x = SNAKE.clamp(head.x, 0, gs - 1);
                    head.y = SNAKE.clamp(head.y, 0, gs - 1);
                } else {
                    SNAKE.game.gameOver(); return;
                }
            }
        } else {
            if (head.x < 0) head.x = gs - 1;
            if (head.x >= gs) head.x = 0;
            if (head.y < 0) head.y = gs - 1;
            if (head.y >= gs) head.y = 0;
        }

        // Death check — delegable to mode system
        var died = false;
        if (SNAKE.gamemodes && SNAKE.gamemodes.checkDeath) {
            died = SNAKE.gamemodes.checkDeath(head, s.snake);
        } else {
            died = s.snake.some(function(seg) { return seg.x === head.x && seg.y === head.y; });
        }
        // Shield saves from one death
        if (died && s.shieldActive) {
            died = false;
            s.shieldActive = false;
            s.activePowerUps.shield = 0;
            SNAKE.hud.hidePowerUp('shield');
            head.x = s.snake[0].x; // don't move
            head.y = s.snake[0].y;
        }
        if (died) { SNAKE.game.gameOver(); return; }

        s.snake.unshift(head);

        // Power-up collision
        if (SNAKE.powerups) {
            var pu = SNAKE.powerups.checkCollision(head.x, head.y);
            if (pu) {
                SNAKE.powerups.collect(pu);
            }
        }

        // Food collision
        if (head.x === s.food.x && head.y === s.food.y) {
            s.ateThisTick = true;
            var isBonus = sc.foodIsBonus;
            var basePoints = isBonus ? 30 : 10;

            // Combo
            var pts = basePoints;
            if (SNAKE.combo) {
                pts = SNAKE.combo.getScore(basePoints);
            }

            s.score += pts;
            if (s.score > s.highScore) {
                s.highScore = s.score;
                SNAKE.storage.set('snakeHighScore3D', String(s.highScore));
            }

            SNAKE.audio.playEat(s.comboCount >= 3 ? Math.min(s.comboCount, 7) : 0);
            SNAKE.hud.triggerEatFlash();
            SNAKE.hud.updateScore(s.score, s.highScore);

            var fwp = SNAKE.gridToWorld(s.food.x, s.food.y);
            sc.triggerEatBurst(
                new THREE.Vector3(fwp.x, -5.08, fwp.z),
                s.comboCount >= 3 ? Math.min(s.comboCount, 7) : 0
            );
            SNAKE.hud.showScorePopup(new THREE.Vector3(fwp.x, -5.08, fwp.z), pts);

            // Combo count
            if (SNAKE.combo) {
                SNAKE.combo.onEat();
                SNAKE.hud.showCombo(s.comboCount, s.comboMultiplier);
            }

            // Mode-specific eat bonus (time, etc.)
            if (SNAKE.gamemodes && SNAKE.gamemodes.onEat) {
                SNAKE.gamemodes.onEat(s.mode);
            }

            // Spawn new food
            s.food = sc.spawnFood(s.snake);
        } else {
            s.snake.pop();
            s.ateThisTick = false;
            SNAKE.audio.playMove();

            // Combo miss
            if (SNAKE.combo && s.comboCount > 0) {
                SNAKE.combo.onMiss();
                if (s.comboCount >= 2 && SNAKE.combo._justBroke) {
                    SNAKE.hud.showComboBreak();
                    SNAKE.audio.playComboBreak();
                } else {
                    SNAKE.hud.hideCombo();
                }
            }
        }

        // Rebuild snake mesh
        sc.rebuildSnakeMeshes(s.snake);
        sc.headGlow.visible = s.isRunning;

        // Mode-specific tick
        if (SNAKE.gamemodes && SNAKE.gamemodes.tick) {
            SNAKE.gamemodes.tick(s.mode, Date.now() * 0.001);
        }

        // Mode timer HUD
        if (s.modeTimer > 0) {
            SNAKE.hud.showTimer(s.modeTimer);
        }
    },

    // ── Game loop (always runs for 3D background) ────
    gameLoop: function(timestamp) {
        var s = SNAKE.state;
        var sc = SNAKE.scene;
        var now = Date.now() * 0.001;
        var self = SNAKE.game;

        // Tick logic only when playing
        if (s.phase === 'playing' && !s.isPaused) {
            if (self.lastTickTime === 0) self.lastTickTime = timestamp;
            var elapsed = timestamp - self.lastTickTime;
            if (elapsed > 500) { elapsed = 0; self.lastTickTime = timestamp; }
            var interval = SNAKE.getInterval();
            while (elapsed >= interval) {
                self.lastTickTime += interval;
                elapsed -= interval;
                self.gameTick();
                if (s.phase !== 'playing') break;
            }
        }

        var dt = s.phase === 'playing'
            ? Math.min((timestamp - (self.lastTickTime || timestamp)) || 0, 100) / 1000
            : 0.016;

        // ── Update head glow position ────────────────
        if (sc.snakeMeshes.length > 0 && sc.headGlow.visible) {
            sc.headGlow.position.copy(sc.snakeMeshes[0].group.position);
            sc.headGlow.position.y = -4.73;
        }

        // ── Power-up system (per-frame: spawn + timer expiry) ──
        if (SNAKE.powerups && SNAKE.powerups.update) SNAKE.powerups.update();

        // ── Mode timer ────────────────────────────────
        if (SNAKE.gamemodes && SNAKE.gamemodes.updateTimer) {
            SNAKE.gamemodes.updateTimer(dt);
        }
        if (s.modeTimer > 0 && s.phase === 'playing' && !s.isPaused) {
            SNAKE.hud.showTimer(s.modeTimer);
        }

        // ── Ambient scene updates ──────────────────────
        sc.updateAmbient(now, dt);
        sc.updateEatParticles(dt);

        // Camera update
        sc.updateCamera(now, s.snake, s.direction, s.camMode);

        // HUD speed display
        SNAKE.hud.updateSpeed(SNAKE.getInterval(), s.score);

        // Debug
        SNAKE.hud.updateDebug(
            '视角:' + sc.CAM_NAMES[s.camMode] +
            ' | 蛇头朝向:' + SNAKE.DIR.name(s.direction) +
            ' | next:' + SNAKE.DIR.name(s.nextDirection) +
            ' | 蛇长:' + s.snake.length +
            ' | 模式:' + s.mode
        );

        sc.render();
        self.animFrameId = requestAnimationFrame(self.gameLoop);
    },

    // ── Menu background loop (before game starts) ────
    _menuLoop: function(timestamp) {
        var self = SNAKE.game;
        var sc = SNAKE.scene;
        var now = Date.now() * 0.001;
        var dt = 0.016;
        sc.updateAmbient(now, dt);
        sc.updateEatParticles(dt);
        sc.updateCamera(now, SNAKE.state.snake, SNAKE.state.direction, SNAKE.state.camMode);
        SNAKE.hud.updateSpeed(SNAKE.getInterval(), SNAKE.state.score);
        SNAKE.hud.updateDebug(
            '视角:' + sc.CAM_NAMES[SNAKE.state.camMode] +
            ' | ' + SNAKE.state.mode + ' 模式 | 等待开始'
        );
        sc.render();
        self._menuAnimId = requestAnimationFrame(self._menuLoop);
    },

    // ── State transitions ────────────────────────────
    gameOver: function() {
        var s = SNAKE.state;
        s.isRunning = false;
        s.phase = 'gameover';
        SNAKE.scene.headGlow.visible = false;
        SNAKE.audio.playDeath();
        SNAKE.scene.triggerScreenShake(1.5);
        SNAKE.scene.triggerComboBreakEffect();

        if (SNAKE.powerups && SNAKE.powerups.clear) SNAKE.powerups.clear();
        if (SNAKE.combo && SNAKE.combo.reset) SNAKE.combo.reset();

        // Save to leaderboard
        if (SNAKE.leaderboard && SNAKE.leaderboard.addScore) {
            SNAKE.leaderboard.addScore(s.mode, s.score);
        }

        SNAKE.hud.updateScore(s.score, s.highScore);
        SNAKE.hud.showMode('');
        SNAKE.hud.clearPowerUps();

        // Use menu system if available, otherwise fall back to overlay
        if (SNAKE.menu && SNAKE.menu.showGameOver) {
            SNAKE.menu.showGameOver(s.score, s.highScore, s.mode);
        } else {
            var overlay = document.getElementById('overlay');
            overlay.classList.remove('hidden');
            document.getElementById('overlayTitle').textContent = '游戏结束';
            document.getElementById('overlayMessage').textContent =
                '得分: ' + s.score + ' | 最高分: ' + s.highScore;
            document.getElementById('restartBtn').textContent = '再来一局';
        }

        SNAKE.scene.updateCamera(Date.now() * 0.001, s.snake, s.direction, s.camMode);
        SNAKE.scene.render();
    },

    startGame: function(mode) {
        var self = SNAKE.game;
        // Stop any existing loop
        if (self.animFrameId) { cancelAnimationFrame(self.animFrameId); self.animFrameId = null; }
        if (self._menuAnimId) { cancelAnimationFrame(self._menuAnimId); self._menuAnimId = null; }

        self.init(mode);
        var s = SNAKE.state;
        s.phase = 'menu';

        SNAKE.hud.updateScore(0, s.highScore);
        var modeNames = { classic: '经典模式', timed: '限时模式', infinite: '无限模式', maze: '迷宫模式' };
        SNAKE.hud.showMode(modeNames[mode] || mode);

        // If menu system is active, hide overlay; otherwise show it
        var overlay = document.getElementById('overlay');
        if (!SNAKE.menu || !SNAKE.menu._root) {
            overlay.classList.remove('hidden');
            document.getElementById('overlayTitle').textContent = '🐍 贪吃蛇 3D';
            document.getElementById('overlayMessage').textContent = '按方向键开始游戏';
            document.getElementById('restartBtn').textContent = '开始游戏';
        } else {
            overlay.classList.add('hidden');
        }

        // Start menu background loop
        self._menuAnimId = requestAnimationFrame(self._menuLoop);
    },

    resumeGame: function() {
        var s = SNAKE.state;
        // Cancel menu background loop if still running
        if (SNAKE.game._menuAnimId) {
            cancelAnimationFrame(SNAKE.game._menuAnimId);
            SNAKE.game._menuAnimId = null;
        }
        s.isRunning = true;
        s.isPaused = false;
        s.phase = 'playing';
        SNAKE.game.lastTickTime = 0;
        SNAKE.scene.headGlow.visible = true;
        SNAKE.scene.foodGroup.visible = true;

        // Hide both menu and overlay
        var overlay = document.getElementById('overlay');
        if (overlay) overlay.classList.add('hidden');
        if (SNAKE.menu && SNAKE.menu.hide) SNAKE.menu.hide();

        // Mode init on first resume
        if (SNAKE.gamemodes && SNAKE.gamemodes.onStart) {
            SNAKE.gamemodes.onStart(s.mode);
        }

        // Start game loop if not already running
        if (!SNAKE.game.animFrameId) {
            SNAKE.game.animFrameId = requestAnimationFrame(SNAKE.game.gameLoop);
        }
    },

    togglePause: function() {
        var s = SNAKE.state;
        if (s.phase !== 'playing') return;
        if (s.isPaused) {
            SNAKE.game.resumeGame();
        } else {
            s.isPaused = true;
            s.isRunning = false;
            SNAKE.scene.headGlow.visible = false;
            var overlay = document.getElementById('overlay');
            overlay.classList.remove('hidden');
            document.getElementById('overlayTitle').textContent = '⏸ 暂停';
            document.getElementById('overlayMessage').textContent = '按空格继续游戏';
            document.getElementById('restartBtn').textContent = '继续';
        }
    },

    // ── Input handlers ──────────────────────────────
    handleKey: function(key) {
        var s = SNAKE.state;

        // Camera toggle
        if (key === 'camera') {
            var newMode = (s.camMode + 1) % 3;
            s.camMode = newMode;
            SNAKE.scene.setCameraMode(newMode, s.snake, s.direction);
            return;
        }

        // Pause
        if (key === 'pause') {
            if (s.phase === 'menu') { SNAKE.game.resumeGame(); return; }
            if (s.phase === 'paused' || s.isPaused) { SNAKE.game.resumeGame(); return; }
            if (s.phase === 'playing') { SNAKE.game.togglePause(); return; }
            return;
        }

        if (s.camMode === 2 || s.camMode === 1) {
            // First-person / Third-person: WASD relative
            if (key === 'ArrowUp'    || key === 'w' || key === 'W') { SNAKE.game.fpForward();  return; }
            if (key === 'ArrowDown'  || key === 's' || key === 'S') { SNAKE.game.fpBackward(); return; }
            if (key === 'ArrowLeft'  || key === 'a' || key === 'A') { SNAKE.game.fpLeft();     return; }
            if (key === 'ArrowRight' || key === 'd' || key === 'D') { SNAKE.game.fpRight();    return; }
        } else {
            // ISO: absolute directions
            if (key === 'ArrowUp'    || key === 'w' || key === 'W') { SNAKE.game.absUp();    return; }
            if (key === 'ArrowDown'  || key === 's' || key === 'S') { SNAKE.game.absDown();  return; }
            if (key === 'ArrowLeft'  || key === 'a' || key === 'A') { SNAKE.game.absLeft();  return; }
            if (key === 'ArrowRight' || key === 'd' || key === 'D') { SNAKE.game.absRight(); return; }
        }
    },

    handleMobile: function(label) {
        if (SNAKE.state.camMode === 2 || SNAKE.state.camMode === 1) {
            if (label === 'up')    { SNAKE.game.fpForward();  return; }
            if (label === 'down')  { SNAKE.game.fpBackward(); return; }
            if (label === 'left')  { SNAKE.game.fpLeft();     return; }
            if (label === 'right') { SNAKE.game.fpRight();    return; }
        } else {
            if (label === 'up')    { SNAKE.game.absUp();    return; }
            if (label === 'down')  { SNAKE.game.absDown();  return; }
            if (label === 'left')  { SNAKE.game.absLeft();  return; }
            if (label === 'right') { SNAKE.game.absRight(); return; }
        }
    },

    handleSwipe: function(dx, dy) {
        var absDx = Math.abs(dx), absDy = Math.abs(dy);
        if (SNAKE.state.camMode === 2 || SNAKE.state.camMode === 1) {
            if (absDx > absDy) { if (dx > 0) SNAKE.game.fpRight(); else SNAKE.game.fpLeft(); }
            else               { if (dy > 0) SNAKE.game.fpBackward(); else SNAKE.game.fpForward(); }
        } else {
            if (absDx > absDy) { if (dx > 0) SNAKE.game.absRight(); else SNAKE.game.absLeft(); }
            else               { if (dy > 0) SNAKE.game.absDown(); else SNAKE.game.absUp(); }
        }
    },

    handleRestart: function() {
        if (SNAKE.game.animFrameId) { cancelAnimationFrame(SNAKE.game.animFrameId); SNAKE.game.animFrameId = null; }
        if (SNAKE.game._menuAnimId) { cancelAnimationFrame(SNAKE.game._menuAnimId); SNAKE.game._menuAnimId = null; }
        SNAKE.game.startGame(SNAKE.state.mode);
    }
};

// ── Wire input ───────────────────────────────────────
SNAKE.input.bind(
    SNAKE.game.handleKey,
    SNAKE.game.handleMobile,
    SNAKE.game.handleSwipe,
    SNAKE.game.handleRestart
);

// ── Start ────────────────────────────────────────────
SNAKE.game.startGame('classic');
