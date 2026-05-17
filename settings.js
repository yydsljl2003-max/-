// ── SNAKE.settings — settings panel & persistence ──
SNAKE.settings = {
    _defaults: {
        masterVolume: 0.8,
        sfxVolume: 0.7,
        graphicsQuality: 'high',
        cameraSensitivity: 0.5,
        showFPSCounter: false,
        difficulty: 'normal',
        solidWalls: false
    },

    init: function() {
        var self = this;
        // Load from storage
        var saved = SNAKE.storage.getJSON('snake_settings', null) || {};
        var cfg = SNAKE.state.settings;
        for (var k in this._defaults) {
            cfg[k] = (saved[k] !== undefined) ? saved[k] : this._defaults[k];
        }
        this._applyAll(cfg);
        this._render();
    },

    _save: function() {
        var cfg = SNAKE.state.settings;
        SNAKE.storage.setJSON('snake_settings', {
            masterVolume: cfg.masterVolume,
            sfxVolume: cfg.sfxVolume,
            graphicsQuality: cfg.graphicsQuality,
            cameraSensitivity: cfg.cameraSensitivity,
            showFPSCounter: cfg.showFPSCounter,
            difficulty: cfg.difficulty,
            solidWalls: cfg.solidWalls
        });
    },

    _applyAll: function(cfg) {
        if (SNAKE.audio.setMasterVolume) SNAKE.audio.setMasterVolume(cfg.masterVolume);
        if (SNAKE.audio.setSfxVolume) SNAKE.audio.setSfxVolume(cfg.sfxVolume);
        if (SNAKE.scene.setQuality) SNAKE.scene.setQuality(cfg.graphicsQuality);
        if (SNAKE.scene.setCameraSensitivity) SNAKE.scene.setCameraSensitivity(cfg.cameraSensitivity);
    },

    _render: function() {
        var container = document.getElementById('settings-content');
        if (!container) return;
        var cfg = SNAKE.state.settings;
        var self = this;

        container.innerHTML =
            '<div class="settings-section">' +
                '<h3 class="settings-heading">音频</h3>' +
                '<div class="setting-row">' +
                    '<label class="setting-label">主音量</label>' +
                    '<input type="range" min="0" max="100" value="' + Math.round(cfg.masterVolume * 100) + '" class="setting-slider" id="set-master-vol">' +
                    '<span class="setting-val" id="val-master-vol">' + Math.round(cfg.masterVolume * 100) + '%</span>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<label class="setting-label">音效音量</label>' +
                    '<input type="range" min="0" max="100" value="' + Math.round(cfg.sfxVolume * 100) + '" class="setting-slider" id="set-sfx-vol">' +
                    '<span class="setting-val" id="val-sfx-vol">' + Math.round(cfg.sfxVolume * 100) + '%</span>' +
                '</div>' +
            '</div>' +
            '<div class="settings-section">' +
                '<h3 class="settings-heading">游戏</h3>' +
                '<div class="setting-row">' +
                    '<label class="setting-label">难度</label>' +
                    '<select class="setting-select" id="set-difficulty">' +
                        '<option value="easy"' + (cfg.difficulty === 'easy' ? ' selected' : '') + '>简单</option>' +
                        '<option value="normal"' + (cfg.difficulty === 'normal' ? ' selected' : '') + '>普通</option>' +
                        '<option value="hard"' + (cfg.difficulty === 'hard' ? ' selected' : '') + '>困难</option>' +
                    '</select>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<label class="setting-label">实体墙壁</label>' +
                    '<select class="setting-select" id="set-solid-walls">' +
                        '<option value="false"' + (!cfg.solidWalls ? ' selected' : '') + '>穿墙（环绕）</option>' +
                        '<option value="true"' + (cfg.solidWalls ? ' selected' : '') + '>实体（撞墙即死）</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            '<div class="settings-section">' +
                '<h3 class="settings-heading">画面</h3>' +
                '<div class="setting-row">' +
                    '<label class="setting-label">画质</label>' +
                    '<select class="setting-select" id="set-quality">' +
                        '<option value="low"' + (cfg.graphicsQuality === 'low' ? ' selected' : '') + '>低</option>' +
                        '<option value="medium"' + (cfg.graphicsQuality === 'medium' ? ' selected' : '') + '>中</option>' +
                        '<option value="high"' + (cfg.graphicsQuality === 'high' ? ' selected' : '') + '>高</option>' +
                    '</select>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<label class="setting-label">镜头灵敏度</label>' +
                    '<input type="range" min="10" max="100" value="' + Math.round(cfg.cameraSensitivity * 100) + '" class="setting-slider" id="set-cam-sens">' +
                    '<span class="setting-val" id="val-cam-sens">' + Math.round(cfg.cameraSensitivity * 100) + '%</span>' +
                '</div>' +
            '</div>' +
            '<div class="settings-section">' +
                '<h3 class="settings-heading">按键操作</h3>' +
                '<table class="keys-table">' +
                    '<tr><td>方向键 / WASD</td><td>移动蛇</td></tr>' +
                    '<tr><td>空格</td><td>暂停 / 继续</td></tr>' +
                    '<tr><td>V</td><td>切换视角</td></tr>' +
                    '<tr><td>Enter</td><td>确认 / 开始</td></tr>' +
                    '<tr><td>Esc</td><td>返回菜单</td></tr>' +
                '</table>' +
            '</div>';

        // ── Event binding ──────────────────────────
        var masterVol = document.getElementById('set-master-vol');
        var sfxVol = document.getElementById('set-sfx-vol');
        var quality = document.getElementById('set-quality');
        var camSens = document.getElementById('set-cam-sens');
        var difficulty = document.getElementById('set-difficulty');

        masterVol.addEventListener('input', function() {
            var v = parseInt(this.value) / 100;
            document.getElementById('val-master-vol').textContent = Math.round(v * 100) + '%';
            cfg.masterVolume = v;
            SNAKE.audio.setMasterVolume(v);
            self._save();
        });

        sfxVol.addEventListener('input', function() {
            var v = parseInt(this.value) / 100;
            document.getElementById('val-sfx-vol').textContent = Math.round(v * 100) + '%';
            cfg.sfxVolume = v;
            SNAKE.audio.setSfxVolume(v);
            self._save();
        });

        quality.addEventListener('change', function() {
            cfg.graphicsQuality = this.value;
            SNAKE.scene.setQuality(this.value);
            self._save();
        });

        camSens.addEventListener('input', function() {
            var v = parseInt(this.value) / 100;
            document.getElementById('val-cam-sens').textContent = Math.round(v * 100) + '%';
            cfg.cameraSensitivity = v;
            if (SNAKE.scene.setCameraSensitivity) SNAKE.scene.setCameraSensitivity(v);
            self._save();
        });

        if (difficulty) difficulty.addEventListener('change', function() {
            cfg.difficulty = this.value;
            self._save();
        });

        var solidWalls = document.getElementById('set-solid-walls');
        if (solidWalls) solidWalls.addEventListener('change', function() {
            cfg.solidWalls = this.value === 'true';
            self._save();
        });
    },

    refresh: function() {
        this._render();
    }
};

// ── Init ────────────────────────────────────────────
SNAKE.settings.init();
