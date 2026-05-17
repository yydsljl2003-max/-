// ── SNAKE.gamemodes — four game modes ──────────────
SNAKE.gamemodes = {
    _mazeGrid: null,      // 2D boolean array for maze obstacles
    _lastTimerTick: 0,

    init: function(mode) {
        var s = SNAKE.state;
        s.modeTimer = 0;
        this._mazeGrid = null;
        this._lastTimerTick = Date.now() * 0.001;

        switch (mode) {
            case 'classic':
                // Nothing extra — base snake mechanics
                break;
            case 'timed':
                s.modeTimer = 90;
                break;
            case 'infinite':
                s.modeTimer = 30;
                break;
            case 'maze':
                this._generateMaze();
                break;
        }
    },

    onStart: function(mode) {
        this._lastTimerTick = Date.now() * 0.001;
    },

    // Called every frame from game loop, dt in seconds
    updateTimer: function(dt) {
        var s = SNAKE.state;
        if (s.phase !== 'playing' || s.isPaused) return;
        if (s.mode === 'classic' || s.mode === 'maze') return;

        s.modeTimer -= dt;
        if (s.modeTimer <= 0) {
            s.modeTimer = 0;
            SNAKE.game.gameOver();
        }
    },

    // Called per game tick
    tick: function(mode, now) {
        // Per-tick logic if needed (reserved for future use)
    },

    /** Called when food is eaten — returns time bonus */
    onEat: function(mode) {
        var s = SNAKE.state;
        switch (mode) {
            case 'timed':
                s.modeTimer += 2;
                break;
            case 'infinite':
                s.modeTimer += 5;
                break;
        }
    },

    checkDeath: function(head, snake) {
        var s = SNAKE.state;
        switch (s.mode) {
            case 'classic':
            case 'timed':
                // Self-collision
                return snake.some(function(seg) { return seg.x === head.x && seg.y === head.y; });

            case 'infinite':
                // No self-collision — only die when timer runs out
                return false;

            case 'maze':
                // Self-collision OR wall hit
                if (snake.some(function(seg) { return seg.x === head.x && seg.y === head.y; })) return true;
                if (this._mazeGrid && this._mazeGrid[head.y] && this._mazeGrid[head.y][head.x]) return true;
                return false;
        }
        return false;
    },

    /** Maze generation with 2-cell-wide corridors — uses DFS with step=3 */
    _generateMaze: function() {
        var gs = SNAKE.CONST.GRID_SIZE;
        var sc = SNAKE.scene;
        sc.clearObstacles();

        // Start with all walls
        var open = [];
        for (var y = 0; y < gs; y++) {
            open[y] = [];
            for (var x = 0; x < gs; x++) open[y][x] = false;
        }

        // DFS with step=3 to carve 2-wide corridors
        var startX = 1, startY = 1;
        open[startY][startX] = true;
        // Carve starting room (3×3 block)
        for (var dy = 0; dy < 3; dy++)
            for (var dx = 0; dx < 3; dx++)
                if (startY + dy < gs && startX + dx < gs)
                    open[startY + dy][startX + dx] = true;

        var stack = [{ x: startX, y: startY }];
        while (stack.length > 0) {
            var cur = stack[stack.length - 1];
            // step=3 → 2 empty cells between junctions
            var dirs = [[0, -3], [3, 0], [0, 3], [-3, 0]];
            for (var i = dirs.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = dirs[i]; dirs[i] = dirs[j]; dirs[j] = tmp;
            }

            var moved = false;
            for (var d = 0; d < dirs.length; d++) {
                var nx = cur.x + dirs[d][0];
                var ny = cur.y + dirs[d][1];
                if (nx >= 1 && nx < gs - 1 && ny >= 1 && ny < gs - 1 && !open[ny][nx]) {
                    // Carve 2-wide corridor between cur and nx,ny
                    var stepX = dirs[d][0] > 0 ? 1 : (dirs[d][0] < 0 ? -1 : 0);
                    var stepY = dirs[d][1] > 0 ? 1 : (dirs[d][1] < 0 ? -1 : 0);
                    for (var s = 0; s <= 3; s++) {
                        var cx = cur.x + stepX * s;
                        var cy = cur.y + stepY * s;
                        if (cx >= 0 && cx < gs && cy >= 0 && cy < gs) {
                            open[cy][cx] = true;
                            // Also widen: carve the cell to the side
                            if (stepX !== 0) {
                                if (cy + 1 < gs) open[cy + 1][cx] = true;
                            } else if (stepY !== 0) {
                                if (cx + 1 < gs) open[cy][cx + 1] = true;
                            }
                        }
                    }
                    open[ny][nx] = true;
                    stack.push({ x: nx, y: ny });
                    moved = true;
                    break;
                }
            }
            if (!moved) stack.pop();
        }

        // Ensure snake spawn area (center) is clear
        for (var cy = 8; cy <= 12; cy++)
            for (var cx = 8; cx <= 12; cx++)
                if (cy >= 0 && cy < gs && cx >= 0 && cx < gs)
                    open[cy][cx] = true;

        // Ensure the snake's starting row + adjacent rows are clear across
        // the full board width — snake starts at (10,10) heading right and
        // wraps around, so the entire row must be open for survival without
        // immediate player input.
        for (var cy = 9; cy <= 11; cy++)
            for (var cx = 0; cx < gs; cx++)
                if (cy >= 0 && cy < gs)
                    open[cy][cx] = true;

        // Build wall grid: wall where !open
        this._mazeGrid = [];
        for (var y = 0; y < gs; y++) {
            this._mazeGrid[y] = [];
            for (var x = 0; x < gs; x++) {
                var isWall = !open[y][x];
                this._mazeGrid[y][x] = isWall;
                if (isWall) sc.addObstacle(x, y);
            }
        }
    },

    /** Check if a grid position is blocked by a maze wall */
    isWall: function(gx, gy) {
        return this._mazeGrid && this._mazeGrid[gy] && this._mazeGrid[gy][gx];
    }
};
