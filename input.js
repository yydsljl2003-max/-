// ── SNAKE.input — keyboard & touch binding ───────
SNAKE.input = {
    bind: function(onKey, onMobile, onSwipe, onRestart) {
        var self = this;

        document.addEventListener('keydown', function(e) {
            if (self._mode !== 'game') return;
            if (e.key === 'v' || e.key === 'V') { e.preventDefault(); onKey('camera'); return; }
            if (e.key === ' ' || e.key === 'Escape') { e.preventDefault(); onKey('pause'); return; }
            e.preventDefault();
            onKey(e.key);
        });

        document.querySelectorAll('.arrow-btn').forEach(function(btn) {
            function handler() { if (self._mode === 'game') onMobile(btn.dataset.dir); }
            btn.addEventListener('click', handler);
            btn.addEventListener('touchstart', function(e) { e.preventDefault(); handler(); });
        });

        var tx = 0, ty = 0;
        var rdom = SNAKE.scene.renderer.domElement;
        rdom.addEventListener('touchstart', function(e) {
            if (self._mode !== 'game') return;
            var t = e.touches[0]; tx = t.clientX; ty = t.clientY;
        });
        rdom.addEventListener('touchmove', function(e) { e.preventDefault(); });
        rdom.addEventListener('touchend', function(e) {
            if (self._mode !== 'game') return;
            var t = e.changedTouches[0];
            var dx = t.clientX - tx, dy = t.clientY - ty;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
            onSwipe(dx, dy);
        });

        document.getElementById('restartBtn').addEventListener('click', function() { onRestart(); });
    },

    _mode: 'game',

    setMode: function(mode) {
        this._mode = mode;
    }
};

