// ── SNAKE.audio — Web Audio synthesis ───────────
SNAKE.audio = {
    ctx: null,
    masterGain: null,
    sfxGain: null,

    init: function() {
        if (this.ctx) return;
        var AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;
        this.masterGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.7;
        this.sfxGain.connect(this.masterGain);
    },

    ensure: function() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },

    setMasterVolume: function(v) {
        this.ensure();
        if (this.masterGain) this.masterGain.gain.value = v;
    },

    setSfxVolume: function(v) {
        if (this.sfxGain) this.sfxGain.gain.value = v;
    },

    playEat: function(comboLevel) {
        this.ensure();
        var t = this.ctx.currentTime;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        var cl = comboLevel || 0;
        var baseFreq = 600 + cl * 80;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, t + 0.15);
        gain.gain.setValueAtTime(0.18 + cl * 0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain); gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(t); osc.stop(t + 0.2);

        if (cl >= 3) {
            var osc2 = this.ctx.createOscillator();
            var g2 = this.ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(baseFreq * 1.5, t + 0.05);
            g2.gain.setValueAtTime(0.08, t + 0.05);
            g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc2.connect(g2); g2.connect(this.sfxGain || this.ctx.destination);
            osc2.start(t + 0.05); osc2.stop(t + 0.2);
        }
    },

    playDeath: function() {
        this.ensure();
        var t = this.ctx.currentTime;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.5);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain); gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(t); osc.stop(t + 0.6);

        var noise = this.ctx.createOscillator();
        var ng = this.ctx.createGain();
        noise.type = 'square';
        noise.frequency.setValueAtTime(50, t);
        noise.frequency.exponentialRampToValueAtTime(20, t + 0.4);
        ng.gain.setValueAtTime(0.08, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        noise.connect(ng); ng.connect(this.sfxGain || this.ctx.destination);
        noise.start(t); noise.stop(t + 0.4);
    },

    playMove: function() {
        this.ensure();
        var t = this.ctx.currentTime;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain); gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(t); osc.stop(t + 0.05);
    },

    playPowerUpCollect: function() {
        this.ensure();
        var t = this.ctx.currentTime;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(1600, t + 0.12);
        osc.frequency.setValueAtTime(2000, t + 0.15);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain); gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(t); osc.stop(t + 0.25);
    },

    playComboBreak: function() {
        this.ensure();
        var t = this.ctx.currentTime;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain); gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(t); osc.stop(t + 0.25);
    },

    playMenuClick: function() {
        this.ensure();
        var t = this.ctx.currentTime;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain); gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(t); osc.stop(t + 0.06);
    }
};
