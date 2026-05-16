// ── Minimal input layer — just captures raw events, delegates to game ──
function bindInput(onKey, onMobile, onSwipe, onRestart) {

    document.addEventListener('keydown', function(e) {
        if (e.key === 'v' || e.key === 'V') { e.preventDefault(); onKey('camera'); return; }
        if (e.key === ' ' || e.key === 'Escape') { e.preventDefault(); onKey('pause'); return; }
        e.preventDefault();
        onKey(e.key);
    });

    document.querySelectorAll('.arrow-btn').forEach(function(btn) {
        function handler() { onMobile(btn.dataset.dir); }
        btn.addEventListener('click', handler);
        btn.addEventListener('touchstart', function(e) { e.preventDefault(); handler(); });
    });

    var tx = 0, ty = 0;
    renderer.domElement.addEventListener('touchstart', function(e) {
        var t = e.touches[0]; tx = t.clientX; ty = t.clientY;
    });
    renderer.domElement.addEventListener('touchmove', function(e) { e.preventDefault(); });
    renderer.domElement.addEventListener('touchend', function(e) {
        var t = e.changedTouches[0];
        var dx = t.clientX - tx, dy = t.clientY - ty;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
        onSwipe(dx, dy);
    });

    document.getElementById('restartBtn').addEventListener('click', function() { onRestart(); });
}
