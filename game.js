// ── DOM refs ────────────────────────────────────
var scoreEl   = document.getElementById('score');
var highScoreEl = document.getElementById('highScore');
var overlay   = document.getElementById('overlay');
var overlayTitle   = document.getElementById('overlayTitle');
var overlayMessage = document.getElementById('overlayMessage');

// ── Debug overlay ───────────────────────────────
var debugEl = document.createElement('div');
debugEl.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:30;font:12px monospace;color:#0f0;background:rgba(0,0,0,0.7);padding:6px 10px;border-radius:6px;pointer-events:none;line-height:1.6';
document.body.appendChild(debugEl);

// ── Score popup container ───────────────────────
var popupContainer = document.createElement('div');
popupContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:12;pointer-events:none;';
document.body.appendChild(popupContainer);

function showScorePopup(worldPos, pts) {
    var popup = document.createElement('div');
    popup.textContent = '+' + pts;
    var isBonus = pts >= 30;
    popup.style.cssText = 'position:absolute;font-size:' + (isBonus ? '1.6rem' : '1.3rem') + ';font-weight:700;color:' + (isBonus ? '#ffcc00' : '#ff6644') + ';text-shadow:0 0 ' + (isBonus ? '16px' : '12px') + ' rgba(' + (isBonus ? '255,200,0' : '255,100,50') + ',0.8);pointer-events:none;animation:popupFloat 0.8s ease-out forwards;';
    var halfW = window.innerWidth / 2;
    var halfH = window.innerHeight / 2;
    var sx = halfW + (worldPos.x / 12) * halfW;
    var sy = halfH - (worldPos.z / 12) * halfH - 40;
    popup.style.left = sx + 'px';
    popup.style.top = sy + 'px';
    popupContainer.appendChild(popup);
    setTimeout(function() { popup.remove(); }, 800);
}

// ── Speed level display ─────────────────────────
var speedContainer = document.createElement('div');
speedContainer.style.cssText = 'position:fixed;bottom:40px;right:16px;z-index:30;display:flex;flex-direction:column;align-items:flex-end;gap:4px;pointer-events:none;';
var speedLabel = document.createElement('div');
speedLabel.style.cssText = 'font:10px monospace;color:#8899bb;background:rgba(0,0,0,0.5);padding:2px 8px;border-radius:4px;';
speedContainer.appendChild(speedLabel);
var speedBarBg = document.createElement('div');
speedBarBg.style.cssText = 'width:80px;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;';
var speedBarFill = document.createElement('div');
speedBarFill.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg, #00d2ff, #ff6644);border-radius:2px;transition:width 0.3s;';
speedBarBg.appendChild(speedBarFill);
speedContainer.appendChild(speedBarBg);
document.body.appendChild(speedContainer);

// ── Eat flash overlay ───────────────────────────
var flashEl = document.createElement('div');
flashEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:11;pointer-events:none;background:radial-gradient(circle, rgba(255,150,50,0.25) 0%, transparent 70%);opacity:0;transition:opacity 0.08s ease-out;';
document.body.appendChild(flashEl);

function triggerEatFlash() {
    flashEl.style.opacity = '1';
    flashEl.style.transition = 'none';
    requestAnimationFrame(function() {
        flashEl.style.transition = 'opacity 0.35s ease-out';
        flashEl.style.opacity = '0';
    });
}

// ── Game state ──────────────────────────────────
var snake = [], food = null;
var direction = { x: 1, y: 0 };
var nextDirection = { x: 1, y: 0 };
var score = 0, highScore = 0;
var isRunning = false, isPaused = false;
var lastTickTime = 0, animFrameId = null;

// ── Helpers ─────────────────────────────────────
function getInterval() { return Math.max(MIN_INTERVAL, BASE_INTERVAL - Math.floor(score / 20) * 5); }

function dirName(d) {
    if (d.x === 1 && d.y === 0) return '→ 右';
    if (d.x === -1 && d.y === 0) return '← 左';
    if (d.x === 0 && d.y === -1) return '↑ 上';
    if (d.x === 0 && d.y === 1) return '↓ 下';
    return '(' + d.x + ',' + d.y + ')';
}

function dirsOpposite(a, b) { return a.x + b.x === 0 && a.y + b.y === 0; }

// ── Direction (mutates nextDirection, reads direction directly) ──
function applyTurn(newDir) {
    if (dirsOpposite(direction, newDir)) return;
    if (!isRunning) {
        nextDirection.x = newDir.x;
        nextDirection.y = newDir.y;
        resumeGame();
        return;
    }
    if (isPaused) return;
    nextDirection.x = newDir.x;
    nextDirection.y = newDir.y;
}

// ── First-person: WASD = relative to snake heading ──
function fpForward()  { if (!isRunning) applyTurn({ x: direction.x, y: direction.y }); }
function fpLeft()     { applyTurn({ x: direction.y, y: -direction.x }); }  // CCW
function fpRight()    { applyTurn({ x: -direction.y, y: direction.x }); }  // CW
function fpBackward() { applyTurn({ x: -direction.x, y: -direction.y }); } // always blocked

// ── Absolute: for isometric / third-person ──
function absUp()    { applyTurn({ x: 0, y: -1 }); }
function absDown()  { applyTurn({ x: 0, y: 1 }); }
function absLeft()  { applyTurn({ x: -1, y: 0 }); }
function absRight() { applyTurn({ x: 1, y: 0 }); }

// ── Init ────────────────────────────────────────
function init() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direction.x = 1; direction.y = 0;
    nextDirection.x = 1; nextDirection.y = 0;
    score = 0; isRunning = false; isPaused = false;
    highScore = parseInt(localStorage.getItem('snakeHighScore3D') || '0');
    highScoreEl.textContent = highScore;
    scoreEl.textContent = '0';
    foodGroup.visible = false;
    headGlow.visible = false;
    shakeAmount = 0;
    trailHistory = [];
    while (snakeMeshes.length > 0) scene.remove(snakeMeshes.pop().group);
    food = spawnFood(snake);
    rebuildSnakeMeshes(snake);
    updateSnakeTargets(snake, direction);
    prevHeadLogical.set(0, -4.5, 0);
}

// ── Game tick ───────────────────────────────────
function gameTick() {
    storePrevPositions();
    direction.x = nextDirection.x;
    direction.y = nextDirection.y;

    var head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (head.x < 0) head.x = GRID_SIZE - 1;
    if (head.x >= GRID_SIZE) head.x = 0;
    if (head.y < 0) head.y = GRID_SIZE - 1;
    if (head.y >= GRID_SIZE) head.y = 0;

    if (snake.some(function(s) { return s.x === head.x && s.y === head.y; })) { gameOver(); return; }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        var pts = foodIsBonus ? 30 : 10;
        score += pts;
        scoreEl.textContent = score;
        if (score > highScore) { highScore = score; localStorage.setItem('snakeHighScore3D', highScore); highScoreEl.textContent = highScore; }
        playEatSound();
        triggerEatFlash();
        var fwp = gridToWorld(food.x, food.y);
        triggerEatBurst(new THREE.Vector3(fwp.x, -4.8, fwp.z));
        showScorePopup(new THREE.Vector3(fwp.x, -4.8, fwp.z), pts);
        food = spawnFood(snake);
    } else {
        snake.pop();
        playMoveSound();
    }
    rebuildSnakeMeshes(snake);
    updateSnakeTargets(snake, direction);
    headGlow.visible = isRunning;
}

// ── Game loop ───────────────────────────────────
function gameLoop(timestamp) {
    if (!isRunning) return;
    if (lastTickTime === 0) lastTickTime = timestamp;
    var elapsed = timestamp - lastTickTime;
    if (elapsed > 500) { elapsed = 0; lastTickTime = timestamp; }
    var interval = getInterval();
    while (elapsed >= interval) {
        lastTickTime += interval;
        elapsed -= interval;
        gameTick();
        if (!isRunning) return;
    }
    var t = Math.min(elapsed / interval, 1);
    var now = Date.now() * 0.001;

    var dt = Math.min(elapsed, 100) / 1000;

    for (var i = 0; i < snakeMeshes.length; i++) {
        var ud = snakeMeshes[i].group.userData;
        var tx = ud.targetX, tz = ud.targetZ, px = ud.prevX, pz = ud.prevZ;
        if (tx === undefined) tx = snakeMeshes[i].group.position.x;
        if (tz === undefined) tz = snakeMeshes[i].group.position.z;
        if (px === undefined) px = tx; if (pz === undefined) pz = tz;
        snakeMeshes[i].group.position.x = px + (tx - px) * t;
        snakeMeshes[i].group.position.z = pz + (tz - pz) * t;
    }
    if (snakeMeshes.length > 0 && headGlow.visible) {
        headGlow.position.copy(snakeMeshes[0].group.position); headGlow.position.y = -4.15;
    }

    // Eat particles
    updateEatParticles(dt);

    // Screen shake decay
    if (shakeAmount > 0.001) shakeAmount *= Math.exp(-shakeDecay * dt);
    else shakeAmount = 0;

    // Trail
    trailTimer += dt;
    if (snakeMeshes.length > 0 && isRunning && trailTimer > 0.04) {
        trailTimer = 0;
        trailHistory.push(snakeMeshes[0].group.position.clone());
        if (trailHistory.length > MAX_TRAIL) trailHistory.shift();
    }
    for (var td = 0; td < trailDots.length; td++) {
        var tObj = trailDots[td];
        if (td < trailHistory.length) {
            tObj.mesh.visible = true;
            tObj.mesh.position.copy(trailHistory[td]);
            tObj.mesh.position.y += (Math.random() - 0.5) * 0.1;
            var alpha = (td / trailHistory.length) * 0.4;
            tObj.mesh.material.opacity = alpha;
            tObj.mesh.scale.setScalar(alpha * 2);
            tObj.age = 0.5;
        } else if (tObj.age > 0) {
            tObj.age -= dt;
            tObj.mesh.material.opacity *= 0.9;
            if (tObj.age <= 0) tObj.mesh.visible = false;
        }
    }

    // Food animation
    foodGem.rotation.y += 0.04;
    foodGem.rotation.x = Math.sin(now * 2.5) * 0.3;
    foodGem.position.y = 0.2 + Math.sin(now * 3) * 0.18;
    foodRing.rotation.z += 0.02;
    foodRing.scale.setScalar(1 + Math.sin(now * 4) * 0.08);
    foodGlow.intensity = 2.5 + Math.sin(now * 3.5) * 1.2;
    for (var fo = 0; fo < foodOrbiters.length; fo++) {
        var orb = foodOrbiters[fo];
        orb.angle += orb.speed * dt;
        orb.mesh.position.x = Math.cos(orb.angle) * orb.radius;
        orb.mesh.position.z = Math.sin(orb.angle) * orb.radius;
        orb.mesh.position.y = 0.2 + orb.yOff + Math.sin(now * 3 + fo) * 0.1;
    }

    // Ambient particles
    for (var p = 0; p < particleData.length; p++) {
        var pd = particleData[p]; pd.mesh.position.y = pd.baseY + Math.sin(now * pd.speed + pd.phase) * 0.7;
    }
    // Pillars
    for (var j = 0; j < pillars.length; j++) {
        pillars[j].orb.scale.setScalar(1 + Math.sin(now * 2 + j) * 0.12);
        pillars[j].glow.intensity = 1.3 + Math.sin(now * 2.5 + j) * 0.6;
    }
    updateCamera(now, snake, direction);

    // Speed display
    var lvl = Math.floor(score / 20) + 1;
    var maxLvl = Math.floor((BASE_INTERVAL - MIN_INTERVAL) / 5) + 1;
    var pct = Math.min(100, ((BASE_INTERVAL - getInterval()) / (BASE_INTERVAL - MIN_INTERVAL)) * 100);
    speedLabel.textContent = 'Lv.' + lvl + '/' + maxLvl + ' | ' + getInterval() + 'ms';
    speedBarFill.style.width = pct + '%';

    // Debug
    debugEl.textContent =
        '视角:' + CAM_NAMES[camMode] +
        ' | 蛇头朝向:' + dirName(direction) +
        ' | next:' + dirName(nextDirection) +
        ' | 蛇长:' + snake.length;

    renderer.render(scene, camera);
    animFrameId = requestAnimationFrame(gameLoop);
}

// ── State transitions ───────────────────────────
function gameOver() {
    isRunning = false; headGlow.visible = false;
    playDeathSound();
    triggerScreenShake(1.5);
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '游戏结束';
    overlayMessage.textContent = '得分: ' + score + ' | 最高分: ' + highScore;
    document.getElementById('restartBtn').textContent = '再来一局';
    updateCamera(Date.now() * 0.001, snake, direction);
    debugEl.textContent = '视角:' + CAM_NAMES[camMode] + ' | 蛇头朝向:' + dirName(direction) + ' | GAME OVER';
    renderer.render(scene, camera);
}

function startGame() {
    init();
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '🐍 贪吃蛇 3D';
    overlayMessage.textContent = '按方向键开始游戏';
    document.getElementById('restartBtn').textContent = '开始游戏';
    updateCamera(Date.now() * 0.001, snake, direction);
    debugEl.textContent = '视角:' + CAM_NAMES[camMode] + ' | 蛇头朝向:' + dirName(direction) + ' | 等待开始';
    renderer.render(scene, camera);
}

function resumeGame() {
    isRunning = true; isPaused = false; lastTickTime = 0; headGlow.visible = true; foodGroup.visible = true;
    overlay.classList.add('hidden');
    animFrameId = requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (!isRunning) return;
    if (isPaused) { resumeGame(); }
    else {
        isPaused = true; headGlow.visible = false;
        if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
        overlay.classList.remove('hidden');
        overlayTitle.textContent = '⏸ 暂停';
        overlayMessage.textContent = '按空格继续游戏';
        document.getElementById('restartBtn').textContent = '继续';
    }
}

// ── Input (all in same scope, reads direction live) ──
function handleKey(key) {

    // Camera toggle (input.js sends 'camera')
    if (key === 'camera') {
        setCameraMode((camMode + 1) % 3);
        debugEl.textContent = '视角:' + CAM_NAMES[camMode] + ' | 蛇头朝向:' + dirName(direction);
        return;
    }

    // Pause (input.js sends 'pause')
    if (key === 'pause') {
        if (!isRunning && !isPaused) resumeGame();
        else togglePause();
        return;
    }

    if (camMode === 2 || camMode === 1) {
        // ── FIRST PERSON / THIRD PERSON: WASD relative to snake heading ──
        if (key === 'ArrowUp'    || key === 'w' || key === 'W') { fpForward();  return; }
        if (key === 'ArrowDown'  || key === 's' || key === 'S') { fpBackward(); return; }
        if (key === 'ArrowLeft'  || key === 'a' || key === 'A') { fpLeft();     return; }
        if (key === 'ArrowRight' || key === 'd' || key === 'D') { fpRight();    return; }
    } else {
        // ── ISO: absolute directions ──
        if (key === 'ArrowUp'    || key === 'w' || key === 'W') { absUp();    return; }
        if (key === 'ArrowDown'  || key === 's' || key === 'S') { absDown();  return; }
        if (key === 'ArrowLeft'  || key === 'a' || key === 'A') { absLeft();  return; }
        if (key === 'ArrowRight' || key === 'd' || key === 'D') { absRight(); return; }
    }
}

function handleMobile(label) {
    if (camMode === 2 || camMode === 1) {
        if (label === 'up')    { fpForward();  return; }
        if (label === 'down')  { fpBackward(); return; }
        if (label === 'left')  { fpLeft();     return; }
        if (label === 'right') { fpRight();    return; }
    } else {
        if (label === 'up')    { absUp();    return; }
        if (label === 'down')  { absDown();  return; }
        if (label === 'left')  { absLeft();  return; }
        if (label === 'right') { absRight(); return; }
    }
}

function handleSwipe(dx, dy) {
    var absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (camMode === 2 || camMode === 1) {
        if (absDx > absDy) { if (dx > 0) fpRight(); else fpLeft(); }
        else               { if (dy > 0) fpBackward(); else fpForward(); }
    } else {
        if (absDx > absDy) { if (dx > 0) absRight(); else absLeft(); }
        else               { if (dy > 0) absDown(); else absUp(); }
    }
}

function handleRestart() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    startGame();
}

// Wire
bindInput(handleKey, handleMobile, handleSwipe, handleRestart);

// ── Start ───────────────────────────────────────
startGame();
