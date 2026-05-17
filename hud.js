// ── SNAKE.hud — all DOM HUD elements ─────────────
SNAKE.hud = {
    init: function() {
        var doc = document;

        // Debug overlay
        this.debugEl = doc.createElement('div');
        this.debugEl.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:30;font:10px monospace;color:#33CCFF;background:rgba(5,5,21,0.8);padding:5px 10px;border-radius:4px;border:1px solid rgba(51,204,255,0.15);pointer-events:none;line-height:1.5;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);';
        doc.body.appendChild(this.debugEl);

        // Score popup container
        this.popupContainer = doc.createElement('div');
        this.popupContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:12;pointer-events:none;';
        doc.body.appendChild(this.popupContainer);

        // Speed level display
        this.speedContainer = doc.createElement('div');
        this.speedContainer.style.cssText = 'position:fixed;bottom:40px;right:16px;z-index:30;display:flex;flex-direction:column;align-items:flex-end;gap:4px;pointer-events:none;';
        this.speedLabel = doc.createElement('div');
        this.speedLabel.style.cssText = 'font:9px monospace;color:#33CCFF;background:rgba(5,5,21,0.6);padding:2px 8px;border-radius:3px;border:1px solid rgba(51,204,255,0.1);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);';
        this.speedContainer.appendChild(this.speedLabel);
        this.speedBarBg = doc.createElement('div');
        this.speedBarBg.style.cssText = 'width:80px;height:3px;background:rgba(51,204,255,0.1);border-radius:1px;overflow:hidden;';
        this.speedBarFill = doc.createElement('div');
        this.speedBarFill.style.cssText = 'height:100%;width:0%;background:#33CCFF;border-radius:1px;transition:width 0.3s;box-shadow:0 0 6px rgba(51,204,255,0.5);';
        this.speedBarBg.appendChild(this.speedBarFill);
        this.speedContainer.appendChild(this.speedBarBg);
        doc.body.appendChild(this.speedContainer);

        // Eat flash overlay
        this.flashEl = doc.createElement('div');
        this.flashEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:11;pointer-events:none;background:radial-gradient(circle, rgba(51,204,255,0.15) 0%, transparent 70%);opacity:0;transition:opacity 0.08s ease-out;';
        doc.body.appendChild(this.flashEl);

        // Combo display
        this.comboEl = doc.createElement('div');
        this.comboEl.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:25;font:bold 1.1rem "Segoe UI",sans-serif;color:#FFCC33;text-shadow:0 0 10px rgba(255,204,51,0.5);pointer-events:none;opacity:0;transition:all 0.3s ease;text-align:center;';
        doc.body.appendChild(this.comboEl);

        // Power-up indicators
        this.powerUpContainer = doc.createElement('div');
        this.powerUpContainer.style.cssText = 'position:fixed;top:80px;right:16px;z-index:25;display:flex;flex-direction:column;gap:6px;pointer-events:none;';
        doc.body.appendChild(this.powerUpContainer);

        // Mode / timer display
        this.modeEl = doc.createElement('div');
        this.modeEl.style.cssText = 'position:fixed;top:50px;left:50%;transform:translateX(-50%);z-index:20;font:0.78rem "Segoe UI",sans-serif;color:#4488CC;pointer-events:none;text-align:center;';
        doc.body.appendChild(this.modeEl);
    },

    updateScore: function(score, highScore) {
        document.getElementById('score').textContent = score;
        document.getElementById('highScore').textContent = highScore;
    },

    updateSpeed: function(interval, score) {
        var lvl = Math.floor(score / 20) + 1;
        var maxLvl = Math.floor((150 - 60) / 5) + 1;
        var pct = Math.min(100, ((150 - interval) / (150 - 60)) * 100);
        this.speedLabel.textContent = 'Lv.' + lvl + '/' + maxLvl + ' | ' + Math.round(interval) + 'ms';
        this.speedBarFill.style.width = pct + '%';
    },

    showScorePopup: function(worldPos, pts) {
        var popup = document.createElement('div');
        popup.textContent = '+' + pts;
        var isBonus = pts >= 30;
        popup.style.cssText = 'position:absolute;font-family:"Segoe UI",sans-serif;font-weight:700;font-size:' + (isBonus ? '1.5rem' : '1.1rem') + ';color:' + (isBonus ? '#FFCC00' : '#33CCFF') + ';text-shadow:0 0 10px ' + (isBonus ? 'rgba(255,204,0,0.6)' : 'rgba(51,204,255,0.5)') + ';pointer-events:none;animation:popupFloat 0.8s ease-out forwards;';
        var halfW = window.innerWidth / 2;
        var halfH = window.innerHeight / 2;
        popup.style.left = (halfW + (worldPos.x / 12) * halfW) + 'px';
        popup.style.top = (halfH - (worldPos.z / 12) * halfH - 40) + 'px';
        this.popupContainer.appendChild(popup);
        setTimeout(function() { popup.remove(); }, 800);
    },

    triggerEatFlash: function() {
        this.flashEl.style.opacity = '1';
        this.flashEl.style.transition = 'none';
        var self = this;
        requestAnimationFrame(function() {
            self.flashEl.style.transition = 'opacity 0.4s ease-out';
            self.flashEl.style.opacity = '0';
        });
    },

    showCombo: function(count, multiplier) {
        if (count < 2) { this.comboEl.style.opacity = '0'; return; }
        var tier = Math.min(count >= 20 ? 6 : count >= 16 ? 5 : count >= 12 ? 4 : count >= 8 ? 3 : count >= 5 ? 2 : 1, 6);
        var colors = ['#33CCFF','#66FFCC','#FFCC33','#FF8833','#FF3366','#CC33FF','#FF33CC'];
        this.comboEl.style.opacity = '1';
        this.comboEl.style.color = colors[tier] || '#FFCC33';
        this.comboEl.textContent = count + 'x COMBO · ×' + multiplier;
    },

    showComboBreak: function() {
        this.comboEl.style.opacity = '1';
        this.comboEl.style.color = '#FF3366';
        this.comboEl.textContent = 'COMBO BROKEN';
        var self = this;
        setTimeout(function() { self.comboEl.style.opacity = '0'; }, 800);
    },

    hideCombo: function() {
        this.comboEl.style.opacity = '0';
    },

    showPowerUp: function(type, remaining) {
        var names = { speedUp:'⚡加速', slowDown:'🐢减速', wallPass:'👻穿墙', magnet:'🧲磁铁', shield:'🛡护盾', shrink:'🔹缩小', doubleScore:'💎双倍' };
        var colors = { speedUp:'#33CCFF', slowDown:'#FF6600', wallPass:'#CC33FF', magnet:'#FF3366', shield:'#33FF99', shrink:'#FFCC00', doubleScore:'#FF33CC' };
        var existing = document.getElementById('pu-' + type);
        if (existing) { existing.textContent = names[type] + ' ' + remaining.toFixed(1) + 's'; return; }
        var el = document.createElement('div');
        el.id = 'pu-' + type;
        el.style.cssText = 'font:0.7rem "Segoe UI",sans-serif;font-weight:600;color:' + (colors[type] || '#33CCFF') + ';background:rgba(10,10,30,0.7);padding:3px 10px;border-radius:3px;border:1px solid rgba(51,204,255,0.15);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);';
        el.textContent = names[type] + ' ' + remaining.toFixed(1) + 's';
        this.powerUpContainer.appendChild(el);
    },

    updatePowerUpTimer: function(type, remaining) {
        var el = document.getElementById('pu-' + type);
        if (!el) return;
        var names = { speedUp:'⚡加速', slowDown:'🐢减速', wallPass:'👻穿墙', magnet:'🧲磁铁', shield:'🛡护盾', shrink:'🔹缩小', doubleScore:'💎双倍' };
        if (remaining <= 0) {
            el.style.opacity = '0';
            setTimeout(function() { if (el.parentNode) el.remove(); }, 300);
        } else {
            el.textContent = names[type] + ' ' + remaining.toFixed(1) + 's';
        }
    },

    hidePowerUp: function(type) {
        var el = document.getElementById('pu-' + type);
        if (el) { el.remove(); }
    },

    clearPowerUps: function() {
        while (this.powerUpContainer.firstChild) {
            this.powerUpContainer.removeChild(this.powerUpContainer.firstChild);
        }
    },

    showTimer: function(seconds) {
        this.modeEl.textContent = seconds > 0 ? '⏱ ' + Math.ceil(seconds) + 's' : '';
    },

    showMode: function(label) {
        this.modeEl.textContent = label;
    },

    updateDebug: function(text) {
        this.debugEl.textContent = text;
    }
};

SNAKE.hud.init();
