// ── SNAKE.powerups — 6 power-up types (real-time) ──
SNAKE.powerups = {
    _items: [],            // active power-up objects on the grid
    _nextSpawnTime: 0,     // real timestamp for next spawn attempt (seconds)
    _spawnInterval: 8,     // base seconds between spawns
    _lastFrameTime: 0,     // tracks dt

    types: ['speedUp', 'slowDown', 'wallPass', 'magnet', 'shield', 'shrink', 'doubleScore'],
    _names: { speedUp: '加速', slowDown: '减速', wallPass: '穿墙', magnet: '磁铁', shield: '护盾', shrink: '缩小', doubleScore: '双倍' },
    _durations: { speedUp: 8, slowDown: 8, wallPass: 10, magnet: 6, shield: 5, shrink: 7, doubleScore: 10 },
    _weights:  { speedUp: 3, slowDown: 2, wallPass: 2, magnet: 2, shield: 2, shrink: 2, doubleScore: 2 },

    init: function() {
        this._items = [];
        // First spawn in 5-12 seconds
        this._nextSpawnTime = Date.now() / 1000 + 5 + Math.random() * 7;
        this._lastFrameTime = Date.now() / 1000;
        SNAKE.scene.clearPowerUps();
    },

    /** Called every frame from gameLoop — handles independent spawning + timer expiry */
    update: function() {
        var now = Date.now() / 1000;
        var s = SNAKE.state;

        // ── Spawn new power-ups independently ─────────
        if (now >= this._nextSpawnTime && this._items.length < SNAKE.CONST.MAX_POWERUPS) {
            this._doSpawn(s.snake);
            this._nextSpawnTime = now + this._spawnInterval + Math.random() * 6;
        }

        // ── Expire collected power-ups (real-time) ────
        for (var type in s.activePowerUps) {
            var entry = s.activePowerUps[type];
            if (!entry || entry.expiresAt === undefined) continue;
            var remaining = entry.expiresAt - now;
            if (remaining <= 0) {
                this._applyEffect(type, false);
                delete s.activePowerUps[type];
                SNAKE.hud.hidePowerUp(type);
            } else {
                SNAKE.hud.updatePowerUpTimer(type, remaining);
            }
        }

        // ── Expire items on the grid (real-time) ──────
        for (var i = this._items.length - 1; i >= 0; i--) {
            if (now >= this._items[i].expiresAt) {
                SNAKE.scene.removePowerUpMesh(this._items[i].mesh);
                this._items.splice(i, 1);
            }
        }

        // Sync flags
        s.wallPassActive = !!(s.activePowerUps.wallPass && s.activePowerUps.wallPass.expiresAt > now);
        s.shieldActive   = !!(s.activePowerUps.shield   && s.activePowerUps.shield.expiresAt   > now);
        s.magnetActive   = !!(s.activePowerUps.magnet   && s.activePowerUps.magnet.expiresAt   > now);
    },

    /** Internal: place a power-up on the grid */
    _doSpawn: function(snake) {
        var gs = SNAKE.CONST.GRID_SIZE;
        var occupied = {};
        snake.forEach(function(s) { occupied[s.x + ',' + s.y] = true; });
        this._items.forEach(function(p) { occupied[p.gx + ',' + p.gy] = true; });
        var food = SNAKE.state.food;
        if (food) occupied[food.x + ',' + food.y] = true;
        // Also avoid maze obstacles
        if (SNAKE.gamemodes && SNAKE.gamemodes.isWall) {
            for (var x = 0; x < gs; x++)
                for (var y = 0; y < gs; y++)
                    if (SNAKE.gamemodes.isWall(x, y)) occupied[x + ',' + y] = true;
        }

        var free = [];
        for (var x = 0; x < gs; x++)
            for (var y = 0; y < gs; y++)
                if (!occupied[x + ',' + y]) free.push({ x: x, y: y });
        if (free.length === 0) return;

        var pos = free[Math.floor(Math.random() * free.length)];
        var type = this._pickType();
        var wp = SNAKE.gridToWorld(pos.x, pos.y);
        var meshData = SNAKE.scene.createPowerUpMesh(type);
        meshData.group.position.set(wp.x, -4.7, wp.z);

        this._items.push({
            type: type,
            gx: pos.x,
            gy: pos.y,
            expiresAt: Date.now() / 1000 + this._durations[type] + 3, // 3s grace on grid
            mesh: meshData
        });
    },

    _pickType: function() {
        var total = 0;
        var self = this;
        this.types.forEach(function(t) { total += self._weights[t] || 1; });
        var r = Math.random() * total;
        for (var i = 0; i < this.types.length; i++) {
            r -= this._weights[this.types[i]] || 1;
            if (r <= 0) return this.types[i];
        }
        return this.types[0];
    },

    /** Check if snake head is on a power-up. Returns the power-up or null. */
    checkCollision: function(headX, headY) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].gx === headX && this._items[i].gy === headY) {
                return this._items[i];
            }
        }
        return null;
    },

    /** Collect a power-up — stores expiresAt for real-time expiry */
    collect: function(powerUp) {
        var s = SNAKE.state;
        var type = powerUp.type;
        var now = Date.now() / 1000;
        var duration = this._durations[type];

        // Refresh expiry (stack if already active)
        var currentExpiry = (s.activePowerUps[type] && s.activePowerUps[type].expiresAt) || now;
        s.activePowerUps[type] = {
            expiresAt: Math.max(currentExpiry, now) + duration
        };

        // Apply effects
        this._applyEffect(type, true, now);

        // Remove mesh
        SNAKE.scene.removePowerUpMesh(powerUp.mesh);
        var idx = this._items.indexOf(powerUp);
        if (idx >= 0) this._items.splice(idx, 1);

        SNAKE.audio.playPowerUpCollect();
        var remaining = s.activePowerUps[type].expiresAt - now;
        SNAKE.hud.showPowerUp(type, remaining);
    },

    _applyEffect: function(type, active, now) {
        var s = SNAKE.state;
        switch (type) {
            case 'speedUp':
                s.speedMultiplier = active ? 1.5 : 1;
                break;
            case 'slowDown':
                s.speedMultiplier = active ? 0.6 : 1;
                break;
            case 'wallPass':
                s.wallPassActive = active;
                break;
            case 'magnet':
                s.magnetActive = active;
                break;
            case 'shield':
                s.shieldActive = active;
                break;
            case 'shrink':
                if (active) {
                    // Store original length for restoration
                    s._shrinkOriginalLen = s.snake.length;
                    var newLen = Math.max(3, Math.floor(s.snake.length / 2));
                    while (s.snake.length > newLen) s.snake.pop();
                    SNAKE.scene.rebuildSnakeMeshes(s.snake);
                } else {
                    // Restore to original length
                    if (s._shrinkOriginalLen && s._shrinkOriginalLen > s.snake.length) {
                        var tail = s.snake[s.snake.length - 1];
                        while (s.snake.length < s._shrinkOriginalLen) {
                            s.snake.push({ x: tail.x, y: tail.y });
                        }
                        SNAKE.scene.rebuildSnakeMeshes(s.snake);
                    }
                    s._shrinkOriginalLen = 0;
                }
                break;
            case 'doubleScore':
                s.scoreMultiplier = active ? 2 : 1;
                break;
        }
    },

    clear: function() {
        for (var i = 0; i < this._items.length; i++) {
            SNAKE.scene.removePowerUpMesh(this._items[i].mesh);
        }
        this._items = [];
        this._nextSpawnTime = Date.now() / 1000 + 5 + Math.random() * 7;
        SNAKE.state.activePowerUps = {};
        SNAKE.state.speedMultiplier = 1;
        SNAKE.state.scoreMultiplier = 1;
        SNAKE.state.wallPassActive = false;
        SNAKE.state.shieldActive = false;
        SNAKE.state.magnetActive = false;
        SNAKE.state._shrinkOriginalLen = 0;
        SNAKE.scene.clearPowerUps();
        SNAKE.hud.clearPowerUps();
    }
};
