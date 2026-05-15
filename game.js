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
const TICK_INTERVAL = 150;

let snake, food, direction, nextDirection, score, highScore, gameLoop, isRunning, isPaused;

function init() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    isRunning = false;
    isPaused = false;
    highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
    highScoreEl.textContent = highScore;
    scoreEl.textContent = '0';
    spawnFood();
    draw();
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

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
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

    // 绘制食物
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4757';
    ctx.fill();
    ctx.shadowBlur = 0;

    // 绘制蛇
    snake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const padding = index === 0 ? 1 : 2;
        const radius = 4;

        ctx.shadowColor = index === 0 ? '#00d2ff' : '#3a7bd5';
        ctx.shadowBlur = index === 0 ? 12 : 5;

        const gradient = ctx.createRadialGradient(
            x + CELL_SIZE / 2, y + CELL_SIZE / 2, 1,
            x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2
        );
        if (index === 0) {
            gradient.addColorStop(0, '#00fff5');
            gradient.addColorStop(1, '#0088ff');
        } else {
            const ratio = 1 - index / snake.length * 0.4;
            gradient.addColorStop(0, `rgba(58, 200, 255, ${ratio})`);
            gradient.addColorStop(1, `rgba(58, 123, 213, ${ratio})`);
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        roundRect(ctx, x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, radius);
        ctx.fill();

        // 蛇头眼睛
        if (index === 0) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            const eyeSize = 3;
            let ex1, ey1, ex2, ey2;
            if (direction.x === 1) {
                ex1 = x + 13; ey1 = y + 5; ex2 = x + 13; ey2 = y + 12;
            } else if (direction.x === -1) {
                ex1 = x + 5; ey1 = y + 5; ex2 = x + 5; ey2 = y + 12;
            } else if (direction.y === -1) {
                ex1 = x + 5; ey1 = y + 5; ex2 = x + 12; ey2 = y + 5;
            } else {
                ex1 = x + 5; ey1 = y + 13; ex2 = x + 12; ey2 = y + 13;
            }
            ctx.beginPath();
            ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(ex1 + direction.x, ey1 + direction.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex2 + direction.x, ey2 + direction.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });
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

function update() {
    direction = { ...nextDirection };

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y,
    };

    // 穿墙
    if (head.x < 0) head.x = GRID_SIZE - 1;
    if (head.x >= GRID_SIZE) head.x = 0;
    if (head.y < 0) head.y = GRID_SIZE - 1;
    if (head.y >= GRID_SIZE) head.y = 0;

    // 撞自身
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

    draw();
}

function gameOver() {
    isRunning = false;
    clearInterval(gameLoop);
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '游戏结束 💀';
    overlayMessage.textContent = `得分: ${score} | 最高分: ${highScore}`;
    restartBtn.textContent = '再来一局';
}

function startGame() {
    init();
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '🐍 贪吃蛇';
    overlayMessage.textContent = '按任意方向键开始游戏';
    restartBtn.textContent = '开始游戏';
}

function resumeGame() {
    isRunning = true;
    overlay.classList.add('hidden');
    gameLoop = setInterval(update, TICK_INTERVAL);
}

function togglePause() {
    if (!isRunning) return;
    if (isPaused) {
        isPaused = false;
        overlay.classList.add('hidden');
        gameLoop = setInterval(update, TICK_INTERVAL);
    } else {
        isPaused = true;
        clearInterval(gameLoop);
        overlay.classList.remove('hidden');
        overlayTitle.textContent = '⏸ 暂停';
        overlayMessage.textContent = '按空格继续游戏';
        restartBtn.textContent = '继续';
    }
}

function setDirection(newDir) {
    if (!isRunning) {
        resumeGame();
    }
    if (isPaused) return;
    if (direction.x + newDir.x === 0 && direction.y + newDir.y === 0) return;
    nextDirection = newDir;
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    const keyMap = {
        'ArrowUp': { x: 0, y: -1 },
        'ArrowDown': { x: 0, y: 1 },
        'ArrowLeft': { x: -1, y: 0 },
        'ArrowRight': { x: 1, y: 0 },
        'w': { x: 0, y: -1 },
        's': { x: 0, y: 1 },
        'a': { x: -1, y: 0 },
        'd': { x: 1, y: 0 },
        'W': { x: 0, y: -1 },
        'S': { x: 0, y: 1 },
        'A': { x: -1, y: 0 },
        'D': { x: 1, y: 0 },
    };

    if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (!isRunning && !isPaused) {
            resumeGame();
        } else {
            togglePause();
        }
        return;
    }

    const dir = keyMap[e.key];
    if (dir) {
        e.preventDefault();
        setDirection(dir);
    }
});

// 移动端按钮
document.querySelectorAll('.arrow-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const dirMap = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 },
        };
        const dir = dirMap[btn.dataset.dir];
        if (dir) setDirection(dir);
    });
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const dirMap = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 },
        };
        const dir = dirMap[btn.dataset.dir];
        if (dir) setDirection(dir);
    });
});

// 重启按钮
restartBtn.addEventListener('click', () => {
    if (isRunning || isPaused) {
        clearInterval(gameLoop);
    }
    startGame();
});

// 触摸滑动支持
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 20) return;

    if (absDx > absDy) {
        setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    } else {
        setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    }
});

// 启动游戏
startGame();
