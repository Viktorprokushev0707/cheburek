const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const gameContainer = document.getElementById('game-container');
const livesDisplay = document.getElementById('lives');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverMessage = document.getElementById('game-over-message');
const restartButton = document.getElementById('restart-button');

let heroImg, cheburekImg, starImg;
let imagesLoaded = 0;
const totalImages = 3;

// Load images
function loadImage(src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            console.log("All images loaded.");
        }
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
    };
    return img;
}

heroImg = loadImage('assets/hero.png');
cheburekImg = loadImage('assets/cheburek.png');
starImg = loadImage('assets/star.png');

// Game constants
const HERO_WIDTH = 50;
const HERO_HEIGHT = 50;
const GROUND_HEIGHT = 50; // Matches CSS
const ITEM_WIDTH = 30;
const ITEM_HEIGHT = 30;
const STAR_WIDTH = 35;
const STAR_HEIGHT = 35;
const WIN_SCORE = 100;
const MAX_LIVES = 10;
const CHEBUREK_SPAWN_INTERVAL = 800;

// Game state
let score = 0;
let lives = MAX_LIVES;
let heroX;
let heroTargetX = null; // Для плавного движения героя
let items = [];
let gameOver = false;
let lastCheburekSpawnTime = 0;

// Облака для анимации
let clouds = [];
const CLOUD_COUNT = 3;

function initClouds() {
    clouds = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: 30 + Math.random() * 80,
            speed: 0.2 + Math.random() * 0.2,
            size: 80 + Math.random() * 40
        });
    }
}

function drawClouds() {
    ctx.save();
    ctx.globalAlpha = 0.6;
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
    });
    ctx.restore();
}

function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x - cloud.size > canvas.width) {
            cloud.x = -cloud.size;
            cloud.y = 30 + Math.random() * 80;
        }
    });
}

// Canvas resize
function resizeCanvas() {
    canvas.width = gameContainer.clientWidth;
    canvas.height = gameContainer.clientHeight;
    heroX = canvas.width / 2 - HERO_WIDTH / 2;
    initClouds();
}

// Game reset
function resetGame() {
    score = 0;
    lives = MAX_LIVES;
    items = [];
    gameOver = false;
    heroX = canvas.width / 2 - HERO_WIDTH / 2;
    heroTargetX = null;
    lastCheburekSpawnTime = 0;
    updateScoreboard();
    gameOverScreen.style.display = 'none';
    initClouds();
    gameLoop();
}

function updateScoreboard() {
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Lives: ${lives}`;
}

// Спавн предметов
function spawnItem() {
    const currentTime = Date.now();
    if (currentTime - lastCheburekSpawnTime > CHEBUREK_SPAWN_INTERVAL) {
        lastCheburekSpawnTime = currentTime;

        const x = Math.random() * (canvas.width - ITEM_WIDTH);
        const speed = 2 + Math.random() * 3;
        let type = 'cheburek';

        if (Math.random() < 0.1) {
            type = 'star';
        }

        items.push({ x, y: 0, type, speed });
    }
}

// Обновление и проверка столкновений
function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;

        // Collision with hero
        if (
            item.y + ITEM_HEIGHT > canvas.height - GROUND_HEIGHT - HERO_HEIGHT &&
            item.y < canvas.height - GROUND_HEIGHT &&
            item.x < heroX + HERO_WIDTH &&
            item.x + ITEM_WIDTH > heroX
        ) {
            if (item.type === 'cheburek') {
                score += 1;
            } else if (item.type === 'star') {
                score += 10;
            }
            items.splice(i, 1);
            updateScoreboard();
            checkWinCondition();
            continue;
        }

        // Item missed (fell below screen)
        if (item.y > canvas.height) {
            if (item.type === 'cheburek') {
                lives -= 1;
                updateScoreboard();
                checkLoseCondition();
            }
            items.splice(i, 1);
        }
    }
}

// Win/Lose
function checkWinCondition() {
    if (score >= WIN_SCORE) {
        gameOver = true;
        gameOverMessage.textContent = 'You Win!';
        gameOverScreen.style.display = 'flex';
    }
}

function checkLoseCondition() {
    if (lives <= 0) {
        gameOver = true;
        gameOverMessage.textContent = 'Game Over!';
        gameOverScreen.style.display = 'flex';
    }
}

// Герой и предметы
function drawHero() {
    if (heroImg.complete && heroImg.naturalHeight !== 0) {
        ctx.drawImage(heroImg, heroX, canvas.height - GROUND_HEIGHT - HERO_HEIGHT, HERO_WIDTH, HERO_HEIGHT);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(heroX, canvas.height - GROUND_HEIGHT - HERO_HEIGHT, HERO_WIDTH, HERO_HEIGHT);
    }
}

function drawItems() {
    items.forEach(item => {
        let imgToDraw = item.type === 'cheburek' ? cheburekImg : starImg;
        if (imgToDraw.complete && imgToDraw.naturalHeight !== 0) {
            ctx.drawImage(imgToDraw, item.x, item.y, ITEM_WIDTH, ITEM_HEIGHT);
        } else {
            ctx.fillStyle = item.type === 'cheburek' ? 'brown' : 'green';
            ctx.fillRect(item.x, item.y, ITEM_WIDTH, ITEM_HEIGHT);
        }
    });
}

// Управление героем (клавиатура)
function handleKeyDown(e) {
    if (gameOver) return;
    const heroSpeed = 20;
    if (e.key === 'ArrowLeft') {
        heroX = Math.max(0, heroX - heroSpeed);
    } else if (e.key === 'ArrowRight') {
        heroX = Math.min(canvas.width - HERO_WIDTH, heroX + heroSpeed);
    }
}

// Управление героем (тач)
function handleTouchStart(e) {
    if (gameOver) return;
    const touchX = e.touches[0].clientX;
    const canvasRect = canvas.getBoundingClientRect();
    const relativeX = touchX - canvasRect.left;
    heroTargetX = Math.max(0, Math.min(canvas.width - HERO_WIDTH, relativeX - HERO_WIDTH / 2));
    e.preventDefault();
}

function updateHeroPosition() {
    if (heroTargetX !== null) {
        const dx = heroTargetX - heroX;
        if (Math.abs(dx) < 3) {
            heroX = heroTargetX;
            heroTargetX = null;
        } else {
            heroX += dx * 0.2;
        }
    }
}

// Очистка canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Главный цикл
function gameLoop() {
    if (gameOver) {
        return;
    }

    clearCanvas();
    drawClouds();
    updateClouds();
    spawnItem();
    updateItems();
    updateHeroPosition();
    drawHero();
    drawItems();

    requestAnimationFrame(gameLoop);
}

// Events
window.addEventListener('resize', resizeCanvas);
window.addEventListener('keydown', handleKeyDown);
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
restartButton.addEventListener('click', resetGame);

// Начальная инициализация
resizeCanvas();
resetGame();

const checkImagesAndStart = () => {
    if (imagesLoaded === totalImages) {
        resetGame();
    } else {
        setTimeout(checkImagesAndStart, 100);
    }
};

checkImagesAndStart();
