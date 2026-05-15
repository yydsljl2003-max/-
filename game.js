const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const restartBtn = document.getElementById('restartBtn');

const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const BASE_INTERVAL = 150;
const MIN_INTERVAL = 60;

let snake, food, direction, nextDirection, score, highScore;
let isRunning = false, isPaused = false;
let lastTickTime = 0, animFrameId = null;
let prevSnake = [], prevDirection = { x: 1, y: 0 };
let drawT = 1;  // interpolation factor 0..1, 1 = no interpolation
function getInterval() {
    return Math.max(MIN_INTERVAL, BASE_INTERVAL - score);
}

function init() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
    ];
    direction = { x: 1, y: 0 };
    prevDirection = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    isRunning = false;
    isPaused = false;
    highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
    highScoreEl.textContent = highScore;
    scoreEl.textContent = '0';
    drawT = 1;
    spawnFood();
}

function spawnFood() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
}
function getInterpolatedPos(i, t) {
    const cur = snake[i];
    let prev;
    if (i === 0) {
        prev = prevSnake.length > 0 ? prevSnake[0] : cur;
    } else {
        prev = i - 1 < prevSnake.length ? prevSnake[i - 1] : cur;
    }
    if (prev.x === cur.x && prev.y === cur.y) return cur;
    if (Math.abs(cur.x - prev.x) > 1 || Math.abs(cur.y - prev.y) > 1) return cur;
    return {
        x: prev.x + (cur.x - prev.x) * t,
        y: prev.y + (cur.y - prev.y) * t,
    };
}

function drawSnakeSegment(idx, t) {
    const pos = getInterpolatedPos(idx, t);
    const x = pos.x * CELL_SIZE;
    const y = pos.y * CELL_SIZE;
    const padding = idx === 0 ? 1 : 2;
    const radius = 4;

    ctx.shadowColor = idx === 0 ? '#00d2ff' : '#3a7bd5';
    ctx.shadowBlur = idx === 0 ? 12 : 5;

    const gradient = ctx.createRadialGradient(
        x + CELL_SIZE / 2, y + CELL_SIZE / 2, 1,
        x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2
    );
    if (idx === 0) {
        gradient.addColorStop(0, '#00fff5');
        gradient.addColorStop(1, '#0088ff');
    } else {
        const ratio = 1 - idx / snake.length * 0.4;
        gradient.addColorStop(0, `rgba(58, 200, 255, ${ratio})`);
        gradient.addColorStop(1, `rgba(58, 123, 213, ${ratio})`);
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    roundRect(ctx, x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, radius);
    ctx.fill();

    if (idx === 0) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        const eyeSize = 3;
        const dir = direction;
        let ex1, ey1, ex2, ey2;
        if (dir.x === 1) {
            ex1 = x + 13; ey1 = y + 5; ex2 = x + 13; ey2 = y + 12;
        } else if (dir.x === -1) {
            ex1 = x + 5; ey1 = y + 5; ex2 = x + 5; ey2 = y + 12;
        } else if (dir.y === -1) {
            ex1 = x + 5; ey1 = y + 5; ex2 = x + 12; ey2 = y + 5;
        } else {
            ex1 = x + 5; ey1 = y + 13; ex2 = x + 12; ey2 = y + 13;
        }
        ctx.beginPath(); ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(ex1 + dir.x, ey1 + dir.y, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2 + dir.x, ey2 + dir.y, 1.5, 0, Math.PI * 2); ctx.fill();
    }
}
function draw(t) {
    drawT = t;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4757';
    ctx.fill();
    ctx.shadowBlur = 0;

    for (let i = snake.length - 1; i >= 0; i--) {
        drawSnakeSegment(i, t);
    }
    ctx.shadowBlur = 0;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function gameTick() {
    direction = { ...nextDirection };

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y,
    };

    if (head.x < 0) head.x = GRID_SIZE - 1;
    if (head.x >= GRID_SIZE) head.x = 0;
    if (head.y < 0) head.y = GRID_SIZE - 1;
    if (head.y >= GRID_SIZE) head.y = 0;

    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = score;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            highScoreEl.textContent = highScore;
        }
        spawnFood();
    } else {
        snake.pop();
    }
}
function gameLoop(timestamp) {
    if (!isRunning) return;
    if (lastTickTime === 0) {
        lastTickTime = timestamp;
        prevSnake = snake.map(s => ({ ...s }));
    }

    const interval = getInterval();


    while (timestamp - lastTickTime >= interval) {
        prevSnake = snake.map(s => ({ ...s }));
        lastTickTime += interval;
        gameTick();
        if (!isRunning) return;
    }

    const t = (timestamp - lastTickTime) / interval;
    draw(t);
    animFrameId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    isRunning = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = null;
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '游戏结束 💀';
    overlayMessage.textContent = `得分: ${score} | 最高分: ${highScore}`;
    restartBtn.textContent = '再来一局';
    draw(1);
}

function startGame() {
    init();
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '🐍 贪吃蛇';
    overlayMessage.textContent = '按任意方向键开始游戏';
    restartBtn.textContent = '开始游戏';
    draw(1);
}

function resumeGame() {
    isRunning = true;
    isPaused = false;
    lastTickTime = 0;
    overlay.classList.add('hidden');
    animFrameId = requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (!isRunning) return;
    if (isPaused) {
        isPaused = false;
        lastTickTime = 0;
        overlay.classList.add('hidden');
        animFrameId = requestAnimationFrame(gameLoop);
    } else {
        isPaused = true;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = null;
        overlay.classList.remove('hidden');
        overlayTitle.textContent = '⏸ 暂停';
        overlayMessage.textContent = '按空格继续游戏';
        restartBtn.textContent = '继续';
    }
}

function setDirection(newDir) {
    if (!isRunning) { resumeGame(); }
    if (isPaused) return;
    if (direction.x + newDir.x === 0 && direction.y + newDir.y === 0) return;
    nextDirection = newDir;
}

document.addEventListener('keydown', (e) => {
    const keyMap = {
        'ArrowUp': { x: 0, y: -1 },
        'ArrowDown': { x: 0, y: 1 },
        'ArrowLeft': { x: -1, y: 0 },
        'ArrowRight': { x: 1, y: 0 },
        'w': { x: 0, y: -1 }, 'W': { x: 0, y: -1 },
        's': { x: 0, y: 1 }, 'S': { x: 0, y: 1 },
        'a': { x: -1, y: 0 }, 'A': { x: -1, y: 0 },
        'd': { x: 1, y: 0 }, 'D': { x: 1, y: 0 },
    };
    if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (!isRunning && !isPaused) resumeGame();
        else togglePause();
        return;
    }
    const dir = keyMap[e.key];
    if (dir) { e.preventDefault(); setDirection(dir); }
});

document.querySelectorAll('.arrow-btn').forEach(btn => {
    const dirMap = {
        'up': { x: 0, y: -1 },
        'down': { x: 0, y: 1 },
        'left': { x: -1, y: 0 },
        'right': { x: 1, y: 0 },
    };
    const handler = () => {
        const dir = dirMap[btn.dataset.dir];
        if (dir) setDirection(dir);
    };
    btn.addEventListener('click', handler);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); handler(); });
});

restartBtn.addEventListener('click', () => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = null;
    startGame();
});

let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0]; touchStartX = touch.clientX; touchStartY = touch.clientY;
});
canvas.addEventListener('touchmove', (e) => e.preventDefault());
canvas.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX, dy = touch.clientY - touchStartY;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 20) return;
    if (absDx > absDy) setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    else setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
});

startGame();
