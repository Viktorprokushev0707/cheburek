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

function loadImage(src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            // All images loaded, safe to start the game or initialize
            // For now, we'll just log it. Game start will be handled by a function.
            console.log("All images loaded.");
            // If you have an initGame function, call it here.
            // initGame(); 
        }
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
    };
    return img;
}

// Load images
heroImg = loadImage('assets/hero.png');
cheburekImg = loadImage('assets/cheburek.png');
starImg = loadImage('assets/star.png');


// Game constants
const HERO_WIDTH = 50;
const HERO_HEIGHT = 50;
const GROUND_HEIGHT = 50; // Matches CSS
const ITEM_WIDTH = 30;
const ITEM_HEIGHT = 30;
const STAR_WIDTH = 35; // Slightly larger for better visibility
const STAR_HEIGHT = 35;
const WIN_SCORE = 100;
const MAX_LIVES = 10;
const CHEBUREK_SPAWN_INTERVAL = 800; // ms, approx 0.8s

// Game state
let score = 0;
let lives = MAX_LIVES;
let heroX;
let items = []; // {x, y, type: 'cheburek' | 'star', speed}
let gameOver = false;
let lastCheburekSpawnTime = 0;

function resizeCanvas() {
    canvas.width = gameContainer.clientWidth;
    canvas.height = gameContainer.clientHeight;
    heroX = canvas.width / 2 - HERO_WIDTH / 2; // Center hero initially
}

function resetGame() {
    score = 0;
    lives = MAX_LIVES;
    items = [];
    gameOver = false;
    heroX = canvas.width / 2 - HERO_WIDTH / 2;
    lastCheburekSpawnTime = 0;
    updateScoreboard();
    gameOverScreen.style.display = 'none';
    gameLoop();
}

function updateScoreboard() {
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Lives: ${lives}`;
}

function spawnItem() {
    const currentTime = Date.now();
    if (currentTime - lastCheburekSpawnTime > CHEBUREK_SPAWN_INTERVAL) {
        lastCheburekSpawnTime = currentTime;

        const x = Math.random() * (canvas.width - ITEM_WIDTH);
        const speed = 2 + Math.random() * 3; // Random speed for cheburek
        let type = 'cheburek';

        // Spawn star logic (1 in 10 chance relative to chebureks)
        if (Math.random() < 0.1) {
            type = 'star';
        }

        items.push({ x, y: 0, type, speed });
    }
}

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
            items.splice(i, 1); // Remove collected item
            updateScoreboard();
            checkWinCondition();
            continue; // Continue to next item, skip miss check
        }

        // Item missed (fell below screen)
        if (item.y > canvas.height) {
            if (item.type === 'cheburek') {
                lives -= 1;
                updateScoreboard();
                checkLoseCondition();
            }
            items.splice(i, 1); // Remove missed item
        }
    }
}

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

function drawHero() {
    if (heroImg.complete && heroImg.naturalHeight !== 0) {
        ctx.drawImage(heroImg, heroX, canvas.height - GROUND_HEIGHT - HERO_HEIGHT, HERO_WIDTH, HERO_HEIGHT);
    } else {
        // Fallback drawing if image not loaded
        ctx.fillStyle = 'blue';
        ctx.fillRect(heroX, canvas.height - GROUND_HEIGHT - HERO_HEIGHT, HERO_WIDTH, HERO_HEIGHT);
    }
}

function drawItems() {
    items.forEach(item => {
        let imgToDraw;
        if (item.type === 'cheburek') {
            imgToDraw = cheburekImg;
        } else {
            imgToDraw = starImg;
        }

        if (imgToDraw.complete && imgToDraw.naturalHeight !== 0) {
            ctx.drawImage(imgToDraw, item.x, item.y, ITEM_WIDTH, ITEM_HEIGHT);
        } else {
            // Fallback drawing
            ctx.fillStyle = item.type === 'cheburek' ? 'brown' : 'green';
            ctx.fillRect(item.x, item.y, ITEM_WIDTH, ITEM_HEIGHT);
        }
    });
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    if (gameOver) {
        return;
    }

    clearCanvas();
    spawnItem();
    updateItems();

    drawHero();
    drawItems();

    requestAnimationFrame(gameLoop);
}

// Event Listeners
function handleKeyDown(e) {
    if (gameOver) return;
    const heroSpeed = 20;
    if (e.key === 'ArrowLeft') {
        heroX = Math.max(0, heroX - heroSpeed);
    } else if (e.key === 'ArrowRight') {
        heroX = Math.min(canvas.width - HERO_WIDTH, heroX + heroSpeed);
    }
}

let touchStartX = null;
const swipeThreshold = 30; // Minimum distance for a swipe

function handleTouchStart(e) {
    if (gameOver) return;
    touchStartX = e.touches[0].clientX;
}

function handleTouchMove(e) {
    if (gameOver || touchStartX === null) return;

    const touchCurrentX = e.touches[0].clientX;
    const diffX = touchCurrentX - touchStartX;
    const heroSpeedFactor = 1.5; // Adjust for touch sensitivity

    if (Math.abs(diffX) > swipeThreshold) { // Detect swipe
        if (diffX > 0) { // Swipe Right
            heroX = Math.min(canvas.width - HERO_WIDTH, heroX + Math.abs(diffX) * heroSpeedFactor);
        } else { // Swipe Left
            heroX = Math.max(0, heroX - Math.abs(diffX) * heroSpeedFactor);
        }
        touchStartX = touchCurrentX; // Update start for continuous swipe
    } else { // Handle as tap if not a swipe (or small movement)
        const touchX = e.touches[0].clientX;
        const gameAreaX = canvas.getBoundingClientRect().left;
        const relativeTouchX = touchX - gameAreaX;

        if (relativeTouchX < canvas.width / 2) {
             heroX = Math.max(0, heroX - 20); // Move left
        } else {
            heroX = Math.min(canvas.width - HERO_WIDTH, heroX + 20); // Move right
        }
    }
     e.preventDefault(); // Prevent scrolling
}

function handleTouchEnd(e) {
    touchStartX = null;
}

// Setup
window.addEventListener('resize', resizeCanvas);
window.addEventListener('keydown', handleKeyDown);
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd);

restartButton.addEventListener('click', resetGame);

// Initial setup
resizeCanvas();
resetGame(); // Start the game for the first time

// Ensure images are loaded before starting the game loop if they weren't ready initially
const checkImagesAndStart = () => {
    if (imagesLoaded === totalImages) {
        resetGame();
    } else {
        // If images are still loading, check again shortly
        setTimeout(checkImagesAndStart, 100);
    }
};

// Call this function to ensure game starts after images are loaded
checkImagesAndStart();
