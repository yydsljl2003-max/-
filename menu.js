// ── SNAKE.menu — menu panels & navigation ─────────
SNAKE.menu = {
    selectedMode: 'classic',
    _root: null,
    _panels: {},

    init: function() {
        var self = this;
        var doc = document;

        // ── Build menu root ──────────────────────────
        var root = doc.createElement('div');
        root.id = 'menu-root';
        root.innerHTML =
            '<div id="menu-main" class="menu-panel">' +
                '<div class="menu-card">' +
                    '<h1 class="menu-title">🐍 贪吃蛇 3D</h1>' +
                    '<p class="menu-sub">选择游戏模式</p>' +
                    '<div class="mode-grid">' +
                        '<button class="mode-btn active" data-mode="classic">' +
                            '<span class="mode-icon">🟢</span>' +
                            '<span class="mode-name">经典模式</span>' +
                            '<span class="mode-desc">传统贪吃蛇，挑战高分</span>' +
                        '</button>' +
                        '<button class="mode-btn" data-mode="timed">' +
                            '<span class="mode-icon">⏱</span>' +
                            '<span class="mode-name">限时模式</span>' +
                            '<span class="mode-desc">90 秒内尽可能多得分</span>' +
                        '</button>' +
                        '<button class="mode-btn" data-mode="infinite">' +
                            '<span class="mode-icon">♾</span>' +
                            '<span class="mode-name">无限模式</span>' +
                            '<span class="mode-desc">无碰撞，吃食物续时间</span>' +
                        '</button>' +
                        '<button class="mode-btn" data-mode="maze">' +
                            '<span class="mode-icon">🧱</span>' +
                            '<span class="mode-name">迷宫模式</span>' +
                            '<span class="mode-desc">躲避障碍物，寻找食物</span>' +
                        '</button>' +
                    '</div>' +
                    '<button class="btn btn-start" id="btn-start">开始游戏</button>' +
                    '<div class="menu-links">' +
                        '<button class="link-btn" id="btn-open-settings">⚙ 设置</button>' +
                        '<button class="link-btn" id="btn-open-leaderboard">🏆 排行榜</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div id="menu-gameover" class="menu-panel hidden">' +
                '<div class="menu-card">' +
                    '<h1 class="menu-title gameover-title">游戏结束</h1>' +
                    '<div class="gameover-stats">' +
                        '<div class="stat-row"><span class="stat-label">最终得分</span><span class="stat-value" id="go-score">0</span></div>' +
                        '<div class="stat-row"><span class="stat-label">最高纪录</span><span class="stat-value" id="go-high">0</span></div>' +
                        '<div class="stat-row"><span class="stat-label">蛇身长度</span><span class="stat-value" id="go-length">0</span></div>' +
                        '<div class="stat-row"><span class="stat-label">游戏模式</span><span class="stat-value" id="go-mode">经典模式</span></div>' +
                    '</div>' +
                    '<div class="gameover-actions">' +
                        '<button class="btn" id="btn-retry">再来一局</button>' +
                        '<button class="btn btn-ghost" id="btn-back-menu">返回菜单</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div id="menu-settings" class="menu-panel hidden">' +
                '<div class="menu-card">' +
                    '<h1 class="menu-title">⚙ 设置</h1>' +
                    '<div id="settings-content"><p class="loading-hint">加载中…</p></div>' +
                    '<button class="btn btn-ghost" id="btn-close-settings">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="menu-leaderboard" class="menu-panel hidden">' +
                '<div class="menu-card">' +
                    '<h1 class="menu-title">🏆 排行榜</h1>' +
                    '<div id="leaderboard-content"><p class="loading-hint">加载中…</p></div>' +
                    '<button class="btn btn-ghost" id="btn-close-leaderboard">返回</button>' +
                '</div>' +
            '</div>';
        doc.body.appendChild(root);
        this._root = root;
        this._panels = {
            main: doc.getElementById('menu-main'),
            gameover: doc.getElementById('menu-gameover'),
            settings: doc.getElementById('menu-settings'),
            leaderboard: doc.getElementById('menu-leaderboard')
        };

        // ── Mode selection ──────────────────────────
        var modeBtns = doc.querySelectorAll('.mode-btn');
        modeBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                SNAKE.audio.playMenuClick();
                modeBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                self.selectedMode = btn.dataset.mode;
            });
        });

        // ── Start button ────────────────────────────
        doc.getElementById('btn-start').addEventListener('click', function() {
            SNAKE.audio.playMenuClick();
            self.hide();
            SNAKE.game.startGame(self.selectedMode);
            SNAKE.game.resumeGame();
        });

        // ── Game over buttons ───────────────────────
        doc.getElementById('btn-retry').addEventListener('click', function() {
            SNAKE.audio.playMenuClick();
            self.hide();
            SNAKE.game.startGame(SNAKE.state.mode);
            SNAKE.game.resumeGame();
        });
        doc.getElementById('btn-back-menu').addEventListener('click', function() {
            SNAKE.audio.playMenuClick();
            self.hide();
            self.showMain();
        });

        // ── Settings / Leaderboard toggles ──────────
        doc.getElementById('btn-open-settings').addEventListener('click', function() {
            SNAKE.audio.playMenuClick();
            if (SNAKE.settings && SNAKE.settings.refresh) SNAKE.settings.refresh();
            self.showPanel('settings');
        });
        doc.getElementById('btn-open-leaderboard').addEventListener('click', function() {
            SNAKE.audio.playMenuClick();
            if (SNAKE.leaderboard && SNAKE.leaderboard.renderTo) {
                SNAKE.leaderboard.renderTo(document.getElementById('leaderboard-content'), SNAKE.state.mode);
            }
            self.showPanel('leaderboard');
        });
        doc.getElementById('btn-close-settings').addEventListener('click', function() {
            SNAKE.audio.playMenuClick();
            self.showPanel('main');
        });
        doc.getElementById('btn-close-leaderboard').addEventListener('click', function() {
            SNAKE.audio.playMenuClick();
            self.showPanel('main');
        });

        // ── Keyboard: Enter to start ─────────────────
        var keyHandler = function(e) {
            if (e.key === 'Enter' && !self._root.classList.contains('hidden')) {
                var visible = null;
                for (var k in self._panels) {
                    if (!self._panels[k].classList.contains('hidden')) { visible = k; break; }
                }
                if (visible === 'main') {
                    doc.getElementById('btn-start').click();
                } else if (visible === 'gameover') {
                    doc.getElementById('btn-retry').click();
                }
            }
            if (e.key === 'Escape') {
                for (var k in self._panels) {
                    if (!self._panels[k].classList.contains('hidden') && (k === 'settings' || k === 'leaderboard')) {
                        self.showPanel('main');
                        return;
                    }
                }
            }
        };
        doc.addEventListener('keydown', keyHandler);
    },

    showPanel: function(name) {
        for (var k in this._panels) {
            this._panels[k].classList.toggle('hidden', k !== name);
        }
        this._root.classList.remove('hidden');
    },

    showMain: function() {
        SNAKE.game.startGame(this.selectedMode);
        this.showPanel('main');
    },

    showGameOver: function(score, highScore, mode) {
        var modeNames = { classic: '经典模式', timed: '限时模式', infinite: '无限模式', maze: '迷宫模式' };
        document.getElementById('go-score').textContent = score;
        document.getElementById('go-high').textContent = highScore;
        document.getElementById('go-length').textContent = SNAKE.state.snake.length;
        document.getElementById('go-mode').textContent = modeNames[mode] || mode;
        this.showPanel('gameover');

        if (SNAKE.leaderboard && SNAKE.leaderboard.renderTo) {
            SNAKE.leaderboard.renderTo(document.getElementById('leaderboard-content'), SNAKE.state.mode);
        }
    },

    hide: function() {
        this._root.classList.add('hidden');
    }
};

// ── Init ────────────────────────────────────────────
SNAKE.menu.init();
