// ── SNAKE.leaderboard — per-mode local Top 10 ──────
SNAKE.leaderboard = {
    _prefix: 'snake_lb_',

    _key: function(mode) {
        return this._prefix + mode;
    },

    /** Get scores array for a mode, sorted high→low */
    getScores: function(mode) {
        return SNAKE.storage.getJSON(this._key(mode), []);
    },

    /** Add a score to the leaderboard. Returns true if it made the top N */
    addScore: function(mode, score) {
        if (score <= 0) return false;
        var scores = this.getScores(mode);
        scores.push({
            score: score,
            date: new Date().toISOString().slice(0, 10),
            length: SNAKE.state.snake.length,
            time: Date.now()
        });
        scores.sort(function(a, b) { return b.score - a.score; });
        var max = SNAKE.CONST.LEADERBOARD_SIZE || 10;
        if (scores.length > max) scores.length = max;
        SNAKE.storage.setJSON(this._key(mode), scores);
        return true;
    },

    /** Render leaderboard into a container element */
    renderTo: function(container, activeMode) {
        if (!container) return;
        var modes = ['classic', 'timed', 'infinite', 'maze'];
        var modeNames = { classic: '经典', timed: '限时', infinite: '无限', maze: '迷宫' };
        var self = this;

        var html = '<div class="lb-tabs">';
        modes.forEach(function(m) {
            html += '<button class="lb-tab' + (m === activeMode ? ' active' : '') + '" data-mode="' + m + '">' + modeNames[m] + '</button>';
        });
        html += '</div><div class="lb-content" id="lb-scores"></div>';
        container.innerHTML = html;

        this._renderScores(activeMode);

        // Tab switching
        var tabs = container.querySelectorAll('.lb-tab');
        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                tabs.forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                self._renderScores(tab.dataset.mode);
            });
        });
    },

    _renderScores: function(mode) {
        var el = document.getElementById('lb-scores');
        if (!el) return;
        var scores = this.getScores(mode);
        if (scores.length === 0) {
            el.innerHTML = '<p class="lb-empty">暂无记录<br><small>快去创造高分吧！</small></p>';
            return;
        }
        var medals = ['🥇', '🥈', '🥉'];
        var html = '<div class="lb-list">';
        scores.forEach(function(entry, i) {
            var rank = i < 3 ? medals[i] : (i + 1);
            html += '<div class="lb-row">' +
                '<span class="lb-rank">' + rank + '</span>' +
                '<span class="lb-score">' + entry.score + '</span>' +
                '<span class="lb-meta">蛇长 ' + (entry.length || '?') + ' · ' + (entry.date || '') + '</span>' +
            '</div>';
        });
        html += '</div>';
        el.innerHTML = html;
    }
};
