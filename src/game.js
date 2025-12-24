// ==========================================
// MINER MACHINE - GAME.JS (FINAL FIXED v8 - 32px SNAP)
// ==========================================
console.log("--- VERSION: FINAL FIXED v8 ---"); 

// --- ASETUKSET ---
const SCREEN_WIDTH = 512;
const SCREEN_HEIGHT = 384;
const TILE_SIZE = 16;  

// --- TILE ID:t ---
const TILE_EMPTY = 32; 
const TILE_WALL = 152; 
const TILE_EARTH = 136; 

// --- SPRITE INDEKSIT ---
const SPRITE_PLAYER = 0;
const SPRITE_ENEMY = 4;        
const SPRITE_EXPLOSION_1 = 5;

// --- MUUTTUJAT ---
let movingStones = []; 
let explosions = [];
let score = 0; 
const INITIAL_TIME = 1800; 
let gameTime = INITIAL_TIME;
let timeAccumulator = 0; 
let lives = 5;       
let goldRemaining = 0; 
let isGameOver = false; 
let playerDeathTimer = 0; 
let isLevelClearBonus = false; 
let bonusFrameCount = 0; 
let isLevelCompleted = false; 

// --- PELIN TILA ---
let map = [];
let keys = {}; 
let lastTime = 0; 
let globalFrame = 0; 

let player = {
    x: 112, y: 112, 
    direction: 0, 
    isMoving: false,
    targetX: 112, targetY: 112,
    speed: 4,
    moveLockTimer: 0 
};

let enemies = [];

const tileset = new Image();
const spriteset = new Image();
let imagesLoaded = 0;

window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    // Terävyys
    canvas.style.imageRendering = "pixelated"; 
    ctx.imageSmoothingEnabled = false;

    tileset.src = 'assets/tiles.png';
    spriteset.src = 'assets/sprites.png';

    const onImageLoad = () => {
        imagesLoaded++;
        if (imagesLoaded === 2) {
            initGame();
            requestAnimationFrame((timestamp) => gameLoop(timestamp, ctx));
        }
    };

    tileset.onload = onImageLoad;
    spriteset.onload = onImageLoad;

    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);
};

// --- KENTTÄDATA ---
const LEVEL_1_LAYOUT = [
    "................................", 
    "################################", 
    "#..............................#", 
    "################################", 
    "##......O.BB$.BBO.O.BBBB..O...##", 
    "##........BB..BB....BBBB......##", 
    "##....O.E.O...O.BB........BB..##", 
    "##..............BB........BB..##", 
    "##$.O.....BB..E.BB......BBBB..##", 
    "##........BB....BB......BBBB..##", 
    "##O.O.O.O.BBO.BBBB..O.O...BB..##", 
    "##........BB..BBBB........BB..##", 
    "##BBBBBBBB$.P...O.....BBBBBB..##", 
    "##BBBBBBBB............BBBBBB..##", 
    "##......BB..BBO.BBBB....O.E...##", 
    "##......BB..BB..BBBB..........##", 
    "##$...O...O.....BB..O...BB....##", 
    "##..............BB......BB....##", 
    "##....E.....BBBB........BB$.E.##", 
    "##..........BBBB........BB....##", 
    "##BBBB....$...O.BB....BBO.BBBB##", 
    "##BBBB..........BB....BB..BBBB##", 
    "################################", 
    "################################"
];

// --- ÄÄNIMOOTTORI ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    if (type === 'gold') {
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1); gain1.connect(audioCtx.destination);
        osc1.type = 'sine'; osc1.frequency.setValueAtTime(2000, now);
        gain1.gain.setValueAtTime(0.1, now); gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6); 
        osc1.start(now); osc1.stop(now + 0.6);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2); gain2.connect(audioCtx.destination);
        osc2.type = 'sine'; osc2.frequency.setValueAtTime(2600, now);
        gain2.gain.setValueAtTime(0, now); gain2.gain.linearRampToValueAtTime(0.1, now + 0.05); 
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc2.start(now); osc2.stop(now + 0.6);
    } 
    else if (type === 'score') {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode); gainNode.connect(audioCtx.destination);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(600, now); 
        gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); 
        osc.start(now); osc.stop(now + 0.1);
    }
    else if (type === 'dig') {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode); gainNode.connect(audioCtx.destination);
        osc.type = 'square'; osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
    } 
    else if (type === 'explosion') {
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1); gain1.connect(audioCtx.destination);
        osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(100, now);
        osc1.frequency.exponentialRampToValueAtTime(1, now + 0.5);
        gain1.gain.setValueAtTime(0.5, now); gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc1.start(now); osc1.stop(now + 0.5);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2); gain2.connect(audioCtx.destination);
        osc2.type = 'square'; osc2.frequency.setValueAtTime(200, now);
        osc2.frequency.exponentialRampToValueAtTime(1, now + 0.2); 
        gain2.gain.setValueAtTime(0.3, now); gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc2.start(now); osc2.stop(now + 0.2);
    }
}

// --- PELIN LOGIIKKA ---

function initGame() {
    isLevelCompleted = false; 
    isLevelClearBonus = false; 
    enemies = [];
    goldRemaining = 0; 
    isGameOver = false;
    bonusFrameCount = 0;
    
    map = new Array(24).fill(0).map(() => new Array(32).fill(TILE_EMPTY));

    for (let y = 0; y < 24; y++) {
        if (!LEVEL_1_LAYOUT[y]) continue;
        const rowString = LEVEL_1_LAYOUT[y];
        
        for (let x = 0; x < 32; x++) {
            if (x >= rowString.length) break;
            const char = rowString[x];

            if (char === '#') map[y][x] = TILE_WALL;
            else if (char === 'B') map[y][x] = TILE_EARTH;
            else if (char === 'O') placeBigTileObject(x, y, 128);
            else if (char === '$') {
                placeBigTileObject(x, y, 160);
                goldRemaining++; 
            }
            else if (char === 'P') {
                player.x = x * TILE_SIZE;
                player.y = y * TILE_SIZE;
                player.isMoving = false;
                player.targetX = player.x;
                player.targetY = player.y;
            }
            else if (char === 'E') {
                const type = (enemies.length % 2 === 0) ? 'left' : 'right';
                enemies.push({
                    x: x * TILE_SIZE,
                    y: y * TILE_SIZE,
                    dir: 3,          
                    speed: 2,        
                    moveType: type,  
                    isMoving: true   
                });
            }
        }
    }
}

function gameLoop(timestamp, ctx) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (Math.floor(timestamp / 200) % 2 === 0) globalFrame = 0; else globalFrame = 1;

    update(deltaTime);
    draw(ctx);
    requestAnimationFrame((ts) => gameLoop(ts, ctx));
}

function update(deltaTime) {
    if (isGameOver || isLevelCompleted) {
        if (keys['Enter']) { 
             lives = 5; score = 0; gameTime = INITIAL_TIME; initGame();
        }
        return;
    }

    if (isLevelClearBonus) {
        if (gameTime > 0) {
            gameTime -= 5; 
            if (gameTime < 0) gameTime = 0;
            score += 10; 
            bonusFrameCount++;
            if (bonusFrameCount % 4 === 0) playSound('score'); 
        } else {
            isLevelClearBonus = false;
            isLevelCompleted = true; 
        }
        return; 
    }

    if (playerDeathTimer > 0) {
        playerDeathTimer--; 
        for (let i = explosions.length - 1; i >= 0; i--) {
            let exp = explosions[i];
            exp.timer++;
            if (exp.timer > 8) { 
                exp.timer = 0;
                exp.frame++;
                if (exp.frame > 2) explosions.splice(i, 1);
            }
        }
        if (playerDeathTimer === 0) {
            lives--;
            if (lives === 0) handleGameOver("NO MORE MEN");
            else initGame(); 
        }
        return; 
    }

    timeAccumulator += deltaTime;
    if (timeAccumulator >= 100) { 
        gameTime--;
        timeAccumulator -= 100;
        if (gameTime <= 0) {
            gameTime = 0;
            handleGameOver("TIME UP");
        }
    }

    // Räjähdykset
    for (let i = explosions.length - 1; i >= 0; i--) {
        let exp = explosions[i];
        exp.timer++;
        if (exp.timer > 8) { 
            exp.timer = 0;
            exp.frame++;
            if (exp.frame > 2) explosions.splice(i, 1);
        }
    }

    // Kivet
    for (let i = movingStones.length - 1; i >= 0; i--) {
        let stone = movingStones[i];
        stone.x += stone.vx;
        stone.y += stone.vy;
        let stoneStopped = false;

        for (let e = enemies.length - 1; e >= 0; e--) {
            let enemy = enemies[e];
            const HIT_MARGIN = 4;
            if (stone.x < enemy.x + 16 - HIT_MARGIN && stone.x + 16 > enemy.x + HIT_MARGIN &&
                stone.y < enemy.y + 16 - HIT_MARGIN && stone.y + 16 > enemy.y + HIT_MARGIN) {
                
                playSound('explosion');
                explosions.push({ x: enemy.x, y: enemy.y, frame: 0, timer: 0 });
                enemies.splice(e, 1); 
                
                stone.x = Math.round(stone.x / 32) * 32;
                stone.y = Math.round(stone.y / 32) * 32;

                placeBigTileObject(stone.x / TILE_SIZE, stone.y / TILE_SIZE, 128);
                movingStones.splice(i, 1);
                stoneStopped = true;
                break; 
            }
        }
        if (stoneStopped) continue;

        if (stone.x % 16 === 0 && stone.y % 16 === 0) {
            let tx = stone.x / TILE_SIZE;
            let ty = stone.y / TILE_SIZE;
            let nextTx = tx; let nextTy = ty;
            if (stone.vx > 0) nextTx += 2; else if (stone.vx < 0) nextTx -= 1;
            if (stone.vy > 0) nextTy += 2; else if (stone.vy < 0) nextTy -= 1;

            if (checkCollisionForStone(nextTx, nextTy)) {
                placeBigTileObject(tx, ty, 128);
                movingStones.splice(i, 1);
            }
        }
    }

    updateEnemies();

    if (player.moveLockTimer > 0) player.moveLockTimer--;

    // Törmäykset (Pelaaja vs Vihollinen)
    for (let enemy of enemies) {
        let dx = Math.abs(player.x - enemy.x);
        let dy = Math.abs(player.y - enemy.y);
        const ALIGN_TOLERANCE = 6; 
        const HIT_DIST = 20; 
        
        const hitSide = (dy < ALIGN_TOLERANCE && dx < HIT_DIST);
        const hitVertical = (dx < ALIGN_TOLERANCE && dy < HIT_DIST);
        if (hitSide || hitVertical) {
            playerDie(); return; 
        }
    }

    if (player.isMoving) {
        const distToTargetX = player.targetX - player.x;
        const distToTargetY = player.targetY - player.y;

        if (Math.abs(distToTargetX) <= player.speed && Math.abs(distToTargetY) <= player.speed) {
            player.x = player.targetX;
            player.y = player.targetY;
            player.isMoving = false;
            checkDigging(); 
            checkGold();    
            return;
        }
        player.x += Math.sign(distToTargetX) * player.speed;
        player.y += Math.sign(distToTargetY) * player.speed;
        return; 
    }

    if (player.moveLockTimer === 0) { 
        let nextX = player.x;
        let nextY = player.y;
        let dx = 0; let dy = 0;
        
        // KORJAUS: LIIKKEEN ASKEL ON NYT 32 (oli 16)
        const MOVE_STEP = 32; 

        if (keys['ArrowUp'] || keys['KeyW']) { dy = -MOVE_STEP; player.direction = 0; }
        else if (keys['ArrowDown'] || keys['KeyS']) { dy = MOVE_STEP; player.direction = 2; }
        else if (keys['ArrowLeft'] || keys['KeyA']) { dx = -MOVE_STEP; player.direction = 3; }
        else if (keys['ArrowRight'] || keys['KeyD']) { dx = MOVE_STEP; player.direction = 1; }

        if (dx !== 0 || dy !== 0) {
            nextX += dx;
            nextY += dy;
            if (canMoveTo(nextX, nextY)) {
                player.targetX = nextX;
                player.targetY = nextY;
                player.isMoving = true;
            } else {
                if (keys['Space']) {
                    tryPushStone(nextX, nextY, dx, dy);
                }
            }
        }
    }
}

// --- APUFUNKTIOT ---

function canMoveTo(pixelX, pixelY) {
    const tx1 = Math.floor(pixelX / TILE_SIZE);
    const ty1 = Math.floor(pixelY / TILE_SIZE);
    const tx2 = Math.floor((pixelX + 28) / TILE_SIZE);
    const ty2 = Math.floor((pixelY + 28) / TILE_SIZE);

    const isWalkable = (tx, ty) => {
        if (tx < 0 || ty < 0 || tx >= 32 || ty >= 24) return false;
        const tile = map[ty][tx];
        if (tile === TILE_WALL) return false;
        if (tile >= 128 && tile <= 131) return false;
        return true; 
    };

    return isWalkable(tx1, ty1) && isWalkable(tx2, ty1) && isWalkable(tx1, ty2) && isWalkable(tx2, ty2);
}

function canEnemyMoveTo(pixelX, pixelY, excludeEnemy) {
    const tx1 = Math.floor(pixelX / TILE_SIZE);
    const ty1 = Math.floor(pixelY / TILE_SIZE);
    const tx2 = Math.floor((pixelX + 28) / TILE_SIZE);
    const ty2 = Math.floor((pixelY + 28) / TILE_SIZE);
    
    if (tx1 < 0 || ty1 < 0 || tx2 >= 32 || ty2 >= 24) return false;
    
    const isMapFree = (tx, ty) => { return map[ty][tx] === TILE_EMPTY; };
    if (!isMapFree(tx1, ty1) || !isMapFree(tx2, ty1) || !isMapFree(tx1, ty2) || !isMapFree(tx2, ty2)) return false;
    
    for (let other of enemies) {
        if (other === excludeEnemy) continue; 
        if (Math.abs(pixelX - other.x) < 32 && Math.abs(pixelY - other.y) < 32) return false; 
    }
    return true; 
}

function updateEnemies() {
    enemies.forEach(enemy => {
        const isAtGrid = (enemy.x % 16 === 0 && enemy.y % 16 === 0);
        if (isAtGrid) {
            const forward = enemy.dir;
            const left = (enemy.dir + 3) % 4; 
            const right = (enemy.dir + 1) % 4; 
            const back = (enemy.dir + 2) % 4; 
            let preferences = [];
            if (enemy.moveType === 'left') preferences = [left, forward, right, back];
            else preferences = [right, forward, left, back];

            for (let i = 0; i < preferences.length; i++) {
                const tryDir = preferences[i];
                let testX = enemy.x;
                let testY = enemy.y;
                if (tryDir === 0) testY -= 16;
                if (tryDir === 1) testX += 16;
                if (tryDir === 2) testY += 16;
                if (tryDir === 3) testX -= 16;
                if (canEnemyMoveTo(testX, testY, enemy)) {
                    enemy.dir = tryDir;
                    break; 
                }
            }
        }
        let nextX = enemy.x;
        let nextY = enemy.y;
        if (enemy.dir === 0) nextY -= enemy.speed;
        if (enemy.dir === 1) nextX += enemy.speed;
        if (enemy.dir === 2) nextY += enemy.speed;
        if (enemy.dir === 3) nextX -= enemy.speed;

        if (canEnemyMoveTo(nextX, nextY, enemy)) {
            enemy.x = nextX;
            enemy.y = nextY;
        } else {
            enemy.x = Math.round(enemy.x / 16) * 16;
            enemy.y = Math.round(enemy.y / 16) * 16;
        }
    });
}

function placeBigTileObject(x, y, startTileIndex) {
    if (x >= 31 || y >= 23) return;
    map[y][x]     = startTileIndex;
    map[y][x+1]   = startTileIndex + 1;
    map[y+1][x]   = startTileIndex + 2;
    map[y+1][x+1] = startTileIndex + 3;
}

// --- PIIRTOFUNKTIOT ---

function drawTile(ctx, tileIndex, x, y) {
    const tilesPerRow = 32; 
    const SOURCE_TILE_SIZE = 16; 
    
    const sourceX = (tileIndex % tilesPerRow) * SOURCE_TILE_SIZE;
    const sourceY = Math.floor(tileIndex / tilesPerRow) * SOURCE_TILE_SIZE;

    ctx.drawImage(
        tileset,
        sourceX, sourceY, SOURCE_TILE_SIZE, SOURCE_TILE_SIZE,
        parseInt(x), parseInt(y), TILE_SIZE, TILE_SIZE 
    );
}

function drawSprite(ctx, spriteIndex, x, y, size = TILE_SIZE, offset = 0) {
    const SOURCE_SPRITE_SIZE = 32; 
    const sourceX = spriteIndex * SOURCE_SPRITE_SIZE;
    const sourceY = 0; 

    ctx.drawImage(
        spriteset,
        sourceX, sourceY, SOURCE_SPRITE_SIZE, SOURCE_SPRITE_SIZE,
        parseInt(x) + offset, parseInt(y) + offset, size, size
    );
}

function draw(ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Kartta
    for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 32; x++) {
            const tileID = map[y][x];
            if (tileID !== TILE_EMPTY) {
                drawTile(ctx, tileID, x * TILE_SIZE, y * TILE_SIZE);
            }
        }
    }

    // Viholliset (4 tiiltä)
    enemies.forEach(enemy => {
        let baseTile = 144; 
        if (globalFrame === 1) baseTile = 148; 
        
        drawTile(ctx, baseTile,     enemy.x,      enemy.y);
        drawTile(ctx, baseTile + 1, enemy.x + 16, enemy.y);
        drawTile(ctx, baseTile + 2, enemy.x,      enemy.y + 16);
        drawTile(ctx, baseTile + 3, enemy.x + 16, enemy.y + 16);
    });

    // Kivet
    movingStones.forEach(stone => {
        drawTile(ctx, 128, stone.x,      stone.y);
        drawTile(ctx, 129, stone.x + 16, stone.y);
        drawTile(ctx, 130, stone.x,      stone.y + 16);
        drawTile(ctx, 131, stone.x + 16, stone.y + 16);
    });

    // Pelaaja (ISONA Spritena 32x32)
    if (playerDeathTimer === 0) {
        let spriteIndex = 0;
        const isMoving = keys['ArrowUp'] || keys['KeyW'] || keys['ArrowDown'] || keys['KeyS'] || keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD'];
        if (keys['Space'] && isMoving) {
            if (player.direction === 0) spriteIndex = 1;
            if (player.direction === 1) spriteIndex = 2;
            if (player.direction === 2) spriteIndex = 3;
            if (player.direction === 3) spriteIndex = 4;
        }
        drawSprite(ctx, spriteIndex, player.x, player.y, 32, 0);
    }

    // Räjähdykset (KORJAUS: Piirretään ISONA 32x32)
    explosions.forEach(exp => {
        let spriteIndex = SPRITE_EXPLOSION_1 + exp.frame;
        drawSprite(ctx, spriteIndex, exp.x, exp.y, 32, 0);
    });

    // HUD
    ctx.font = "16px monospace"; 
    ctx.textBaseline = "top"; 
    
    ctx.fillStyle = "#00EEEE"; 
    ctx.fillText("CAVE:1", 32, 0); 
    ctx.fillStyle = "#00EE00"; 
    ctx.fillText("MINER MACHINE", 176, 0); 
    ctx.fillStyle = "#00EEEE"; 
    ctx.fillText("ROOM:01", 400, 0); 

    const statY = 32; 
    ctx.fillText("SCORE:" + score.toString().padStart(5, '0'), 32, statY);
    ctx.fillText("MEN:" + lives, 208, statY); 
    ctx.fillText("TIME:" + gameTime.toString().padStart(5, '0'), 368, statY); 

    if (isGameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; 
        ctx.fillRect(100, 120, 312, 120); 
        ctx.strokeStyle = "#FFFFFF";
        ctx.strokeRect(100, 120, 312, 120);
        ctx.fillStyle = "#FF0000";
        ctx.font = "32px monospace"; 
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", SCREEN_WIDTH / 2, 160); 
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "16px monospace";
        ctx.fillText("PRESS ENTER", SCREEN_WIDTH / 2, 200); 
        ctx.textAlign = "start"; 
    }

    if (isLevelCompleted) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; 
        ctx.fillRect(100, 120, 312, 120);
        ctx.strokeStyle = "#00FF00"; 
        ctx.strokeRect(100, 120, 312, 120);
        ctx.fillStyle = "#00FF00"; 
        ctx.font = "32px monospace";
        ctx.textAlign = "center";
        ctx.fillText("LEVEL CLEARED", SCREEN_WIDTH / 2, 160);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "16px monospace";
        ctx.fillText("PRESS ENTER", SCREEN_WIDTH / 2, 200);
        ctx.textAlign = "start"; 
    }
}

function checkDigging() {
    const checkAndDig = (pixelX, pixelY) => {
        const tx = Math.floor(pixelX / TILE_SIZE);
        const ty = Math.floor(pixelY / TILE_SIZE);
        if (map[ty][tx] === TILE_EARTH) {
            map[ty][tx] = TILE_EMPTY;
            playSound('dig'); 
        }
    };
    checkAndDig(player.x + 8, player.y + 8);   
    checkAndDig(player.x + 24, player.y + 8);  
    checkAndDig(player.x + 8, player.y + 24);  
    checkAndDig(player.x + 24, player.y + 24); 
}

function tryPushStone(targetPixelX, targetPixelY, pushDx, pushDy) {
    const tx = Math.floor((targetPixelX + 8) / TILE_SIZE);
    const ty = Math.floor((targetPixelY + 8) / TILE_SIZE);
    if (ty < 0 || ty >= 24 || tx < 0 || tx >= 32) return;
    if (!map[ty]) return;
    const tileID = map[ty][tx];
    if (tileID >= 128 && tileID <= 131) {
        let stoneTx = tx;
        let stoneTy = ty;
        if (tileID === 129 || tileID === 131) stoneTx -= 1;
        if (tileID === 130 || tileID === 131) stoneTy -= 1;
        let checkX = stoneTx * TILE_SIZE;
        let checkY = stoneTy * TILE_SIZE;
        if (pushDx > 0) checkX += 16; else if (pushDx < 0) checkX -= 16;
        if (pushDy > 0) checkY += 16; else if (pushDy < 0) checkY -= 16;
        for (let enemy of enemies) {
            if (Math.abs(enemy.x - checkX) < 12 && Math.abs(enemy.y - checkY) < 12) return; 
        }
        let destTx = stoneTx;
        let destTy = stoneTy;
        if (pushDx > 0) destTx += 2; if (pushDx < 0) destTx -= 1;
        if (pushDy > 0) destTy += 2; if (pushDy < 0) destTy -= 1;
        if (!checkCollisionForStone(destTx, destTy) && !checkCollisionForStone(destTx + (pushDx?0:1), destTy + (pushDy?0:1))) {
            map[stoneTy][stoneTx] = TILE_EMPTY; map[stoneTy][stoneTx+1] = TILE_EMPTY;
            map[stoneTy+1][stoneTx] = TILE_EMPTY; map[stoneTy+1][stoneTx+1] = TILE_EMPTY;
            movingStones.push({ x: stoneTx * TILE_SIZE, y: stoneTy * TILE_SIZE, vx: Math.sign(pushDx) * 4, vy: Math.sign(pushDy) * 4 });
            player.moveLockTimer = 10; 
        }
    }
}

function checkCollisionForStone(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= 32 || ty >= 24) return true;
    const tile = map[ty][tx];
    if (tile === TILE_WALL || (tile >= 128 && tile <= 131) || tile === TILE_EARTH || (tile >= 160 && tile <= 163)) return true;
    return false;
}

function checkGold() {
    const centerX = player.x + 8;
    const centerY = player.y + 8;
    const tx = Math.floor(centerX / TILE_SIZE);
    const ty = Math.floor(centerY / TILE_SIZE);
    const tileID = map[ty][tx];
    if (tileID >= 160 && tileID <= 163) {
        score++; playSound('gold'); goldRemaining--;
        if (goldRemaining <= 0) isLevelClearBonus = true; 
        let goldTx = tx; let goldTy = ty;
        if (tileID === 161 || tileID === 163) goldTx -= 1; if (tileID === 162 || tileID === 163) goldTy -= 1; 
        map[goldTy][goldTx] = TILE_EMPTY; map[goldTy][goldTx+1] = TILE_EMPTY;
        map[goldTy+1][goldTx] = TILE_EMPTY; map[goldTy+1][goldTx+1] = TILE_EMPTY;
    }
}

function playerDie() {
    if (playerDeathTimer > 0) return;
    playSound('explosion'); 
    explosions.push({ x: player.x, y: player.y, frame: 0, timer: 0 });
    playerDeathTimer = 60;
}

function handleGameOver(reason) {
    isGameOver = true;
    console.log("GAME OVER: " + reason);
}