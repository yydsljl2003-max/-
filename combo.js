// ── SNAKE.combo — combo multiplier system ──────────
SNAKE.combo = {
    _justBroke: false,

    /** Called when snake eats food */
    onEat: function() {
        var s = SNAKE.state;
        s.comboCount++;
        this._recalcMultiplier();
        this._justBroke = false;

        // Visual feedback
        if (s.comboCount >= 3) {
            SNAKE.hud.showCombo(s.comboCount, s.comboMultiplier);
            var head = s.snake[0];
            var wp = SNAKE.gridToWorld(head.x, head.y);
            SNAKE.scene.triggerComboEffect(
                new THREE.Vector3(wp.x, -4.5, wp.z),
                s.comboCount
            );
        }
    },

    /** Called when snake moves without eating */
    onMiss: function() {
        var s = SNAKE.state;
        if (s.comboCount >= 2) {
            this._justBroke = true;
            SNAKE.scene.triggerComboBreakEffect();
        }
        s.comboCount = 0;
        s.comboMultiplier = 1;
    },

    /** Returns the score for a base-points food */
    getScore: function(basePoints) {
        var s = SNAKE.state;
        var multiplier = s.comboMultiplier * s.scoreMultiplier;
        return Math.round(basePoints * multiplier);
    },

    reset: function() {
        SNAKE.state.comboCount = 0;
        SNAKE.state.comboMultiplier = 1;
        this._justBroke = false;
        SNAKE.hud.hideCombo();
    },

    _recalcMultiplier: function() {
        var count = SNAKE.state.comboCount;
        var tiers = SNAKE.CONST.COMBO_TIERS;
        var mults = SNAKE.CONST.COMBO_MULTIPLIERS;
        var m = 1;
        for (var i = tiers.length - 1; i >= 0; i--) {
            if (count >= tiers[i]) { m = mults[i]; break; }
        }
        SNAKE.state.comboMultiplier = m;
    }
};
