// ── Web Audio sound synthesis ──────────────────
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var audioCtx = null;

function ensureAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playEatSound() {
    ensureAudio();
    var t = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.2);
}

function playDeathSound() {
    ensureAudio();
    var t = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.5);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.6);

    var noise = audioCtx.createOscillator();
    var ng = audioCtx.createGain();
    noise.type = 'square';
    noise.frequency.setValueAtTime(50, t);
    noise.frequency.exponentialRampToValueAtTime(20, t + 0.4);
    ng.gain.setValueAtTime(0.08, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    noise.connect(ng); ng.connect(audioCtx.destination);
    noise.start(t); noise.stop(t + 0.4);
}

function playMoveSound() {
    ensureAudio();
    var t = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.05);
}
