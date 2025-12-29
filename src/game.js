// ==========================================
// MINER MACHINE - GAME.JS (PERSONAL BEST EDITION)
// ==========================================
console.log("--- VERSION: PERSONAL BEST EDITION ---"); 

// --- ASETUKSET ---
const SCREEN_WIDTH = 512;
const SCREEN_HEIGHT = 384;
const TILE_SIZE = 16;  
const ROOMS_PER_CAVE = 10 
const MAX_LEVELS = 30
const HIGH_SCORE_KEY = 'minerMachineHighScores_v1'; 

// --- TILE ID:t ---
const TILE_EMPTY = 32; 
const TILE_WALL = 152; 
const TILE_EARTH = 136; 

// --- SPRITE INDEKSIT ---
const SPRITE_PLAYER = 0;
const SPRITE_ENEMY = 4;        
const SPRITE_EXPLOSION_1 = 5;

// --- MUUTTUJAT ---
let currentLevel = 0 //alusta alkaen 0
let movingStones = []; 
let explosions = [];
let score = 0; 
const INITIAL_TIME = 1800; 
let gameTime = INITIAL_TIME;
let timeAccumulator = 0; 
let lives = 5;       
let goldRemaining = 0; 

// Pelitilat
let isGameOver = false; 
let isGameWon = false;      
let isLevelCompleted = false; 
let isLevelClearBonus = false; 
let isHighScores = false;   

let playerDeathTimer = 0; 
let bonusFrameCount = 0; 

// --- KARTTA JA PELAAJA ---
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

// --- KUVIEN LATAUS ---
const tileset = new Image();
const spriteset = new Image();
let imagesLoaded = 0;

window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
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

// =============================================================
// KENTTÄDATA (16x10 FORMATTI)
// =============================================================
const LEVEL_HEADER = [
    "................................",
    "################################",
    "#..............................#",
    "################################"
];

// --- KENTTÄDATA (16x10) ---
const COMPACT_LEVELS = [
    // ==========================================
    // CAVE 1 (Huoneet 1 - 25)
    // ==========================================

    // ROOM 01
    [
        "#...OB$BOOBB.O.#",
        "#..OEO.OB....B.#",
        "#$O..B.EB...BB.#",
        "#OOOOBOBB.OO.B.#",
        "#BBBB$P.O..BBB.#",
        "#...B.BOBB..OE.#",
        "#$.O.O..B.O.B..#",
        "#..E..BB....B$E#",
        "#BB..$.OB..BOBB#",
        "################"
    ],
    // ROOM 02
    [
        "#$...BBOBBBB.E$#",
        "#.BEB.BBBO.B.B.#",
        "#EB.OOO....O.B.#",
        "#O$OBBOBBOBB.B.#",
        "#BBOBBBBPBBO.B.#",
        "#BBBBOBBBOBOBB.#",
        "#BBBOOBBBOBOOO.#",
        "#.EOO$OBBB..E..#",
        "#$EBBBBBOBEBE.$#",
        "################"
    ],

    // ROOM 03
    [
        "#.......OBBBE..#",
        "#OOOO.O.OOOO.O.#",
        "#..0.E0...E0.0.#",
        "#OEB..OOOO.O.O.#",
        "#.....B$$OEO.O.#",
        "#OBOOOO$$O.O.O.#",
        "#.BPB.O$$OE..O.#",
        "#.B.BOOEEOOBB..#",
        "#...BOO.....B..#",
        "################"
    ],
    // ROOM 04
    [
        "#........BBO...#",
        "#.EBEO.O.BO...E#",
        "#B......O..OOO.#",
        "#.OO.B..OBBO..E#",
        "#..PO....B...BO#",
        "#O..O.BBBB.OOO.#",
        "#..OOEOB.B.O$.E#",
        "#.B.B....BOB..E#",
        "#BO.B...E..O...#",
        "################"
    ],
    // ROOM 05
    [
        "#EE.EE.EB.OBBBB#",
        "#$OBBBBBB..O..B#",
        "#$O.OOOOO.OOO.B#",
        "#$O.O.O.B.....B#",
        "#$O.OEE.O.OO...#",
        "#$O.O.O.O.BB.O.#",
        "#$O...O.O.BB.O.#",
        "#$O.B...O.BB.O.#",
        "#$O.B.O.O.OO.OP#",
        "################"
    ],
    // ROOM 06
    [
        "#..BE....BBOBE$#",
        "#...BBBBBBO.B..#",
        "#...OOOOOO..BBB#",
        "#.$.O....OOO..B#",
        "#...O.$$.OBBBBB#",
        "#...O..EEOBBO..#",
        "#..EOOOOOO...OE#",
        "#.BB$BO..BBBOOO#",
        "#B......E...OOP#",
        "################"
    ],
    // ROOM 07
    [
        "#BBBBBO.B.E.$$$#",
        "#B.B.EB.OOOOOO.#",
        "#B.BOE.......OE#",
        "#BEBOBBBBBBB.O.#",
        "#B.BOBOBO..OBBB#",
        "#BBBO.BBBBBBBOO#",
        "#B.BOEBBBBBBBBE#",
        "#B.BO.BBE...BB.#",
        "#BPBO$BBBBBBBO$#",
        "################"
    ],
    // ROOM 08
    [
        "#BBOBBBOBBOOB.$#",
        "#..E...$B.$OB.B#",
        "#.BBBBBO..OOB.B#",
        "#.B...BB.BBBE.B#",
        "#.BPB...EBBBBBB#",
        "#.B.B.OOBOB...E#",
        "#$..B.$OBBB.BB.#",
        "#OOBB.OBBB..B..#",
        "#$....BBO$E...$#",
        "################"
    ],
    // ROOM 09
    [
        "#....O...BB...O#",
        "#.P..O.OEOB.B.O#",
        "#....B.OBBB.B.B#",
        "#.BB.B..B.B.B.O#",
        "#....BOBB.B.BEB#",
        "#BBBBBBBB.BEB.B#",
        "#OEB.....E.....#",
        "#BOBBBOBBBB.$$$#",
        "#OOOB...EE..$$$#",
        "################"
    ],
    // ROOM 10
    [
        "#O.EBO.O.O.O$$$#",
        "#BBOO.OEE.OBO..#",
        "#BOOBO.O...O.OE#",
        "#B...OOOOOO.O.B#",
        "#.EO.O..O.BOO.O#",
        "#OOO.O.POOO.OB.#",
        "#...OOOOOO.O..E#",
        "#.O.B...O.O..O.#",
        "#OOOOOO.OE.O..O#",
        "################"
    ],
    // ROOM 11
    [
        "#.....B..B.B..B#",
        "#.BBBBBBBBBBBB.#",
        "#.BOB...E..BOB.#",
        "#.BBBE$OO$.BBB.#",
        "#.....O$EO.BBB.#",
        "#EBBB.$OO$.BBB$#",
        "#.BPB...EE.BOB.#",
        "#.BBBBBBBBBBBB.#",
        "#.........BE..E#",
        "################"
    ],
    // ROOM 12
    [
        "#$B....EB..$...#",
        "#BBBBBBBB.BBOB.#",
        "#E..BE..BPB...E#",
        "#.BBBBBBB.OBBBB#",
        "#..$O..EB.B....#",
        "#BBBBBBBB.BBBO.#",
        "#E$$....B.B....#",
        "#EB..BBBB...BBB#",
        "#...B..OE......#",
        "################"
    ],
    // ROOM 13
    [
        "#EB.O...E......#",
        "#.OBBBBBBBBBBBB#",
        "#.OBE..O..EB.BO#",
        "#.OOBBBBBBBBEBB#",
        "#.OBEBEBBBOBBBB#",
        "#.OB........PBB#",
        "#.OBBBBBBBBBOBB#",
        "#$OBOBBBOBBBEBO#",
        "#$OBBBOBBBOB.BB#",
        "################"
    ],
    // ROOM 14
    [
        "#O..OOE.O.O...E#",
        "#....OEE......E#",
        "#OBOBOOBOOOPOOO#",
        "#....O....O....#",
        "#.OOBOO.OOOOOB.#",
        "#..............#",
        "#.O..O..O.O..O.#",
        "#OOOOOOOOOOOOO.#",
        "#$..EEE........#",
        "################"
    ],
    // ROOM 15
    [
        "#.B..BB......BO#",
        "#.E....B.O.B.BE#",
        "#B.B.BBOBB.EE..#",
        "#........B.BBB.#",
        "#.BOB.OO$..B...#",
        "#...E..EB.O..$B#",
        "#OBBBOOOB.B.BO$#",
        "#......B....$$$#",
        "#PBBOBBO.BB.$O$#",
        "################"
    ],
    // ROOM 16
    [
        "#B$OBBBOO$$E...#",
        "#$O.PB..BOOOOOB#",
        "#BO.OOO.BOOOBO$#",
        "#.O.OOO.....BO$#",
        "#.O.OO..BBO.OOB#",
        "#EOBOOEBB.O.BO$#",
        "#.O....BBB$.OO$#",
        "#BBBBBB...B.BB$#",
        "#BEEEE..BE.....#",
        "################"
    ],
    // ROOM 17
    [
        "#O......BBEB...#",
        "#.O.B.B.OBEB.O$#",
        "#.......OBEO.OB#",
        "#.B.O.B.BBEB.O$#",
        "#..P....OBEB.O$#",
        "#.B.O.B.BB.O.OB#",
        "#.......OBEB.O$#",
        "#.O.B.B.BBEB.OB#",
        "#O......O$EB.BB#",
        "################"
    ],
    // ROOM 18
    [
        "#......P......E#",
        "#.BOBO$OO$OBOB.#",
        "#......E.......#",
        "#.BBBBBBBBBBBB.#",
        "#B..........E.B#",
        "#.EOOOO..OOOO..#",
        "#.B.E.EBB.E.EB.#",
        "#..B$$BBBB$$B..#",
        "#B............B#",
        "################"
    ],
    // ROOM 19
    [
        "#$B..EB...B..B$#",
        "#OB.B...B.E.BBO#",
        "#BOBOBB$OBBOBOB#",
        "#.B.E..B...B.B.#",
        "#EBB.B.B.B.B.BE#",
        "#.BB.$...B..EB.#",
        "#BOBBOBBBO$BBOB#",
        "#OB...B...B.EBO#",
        "#PB.B...BE..BB$#",
        "################"
    ],
    // ROOM 20
    [
        "#$O.BB$.E.BB.O$#",
        "#...OOOOOOOO...#",
        "#EBO........OBE#",
        "#BO..BOBBOB..OB#",
        "#...OO$.E$OO..P#",
        "#BO..BOBBOB..OB#",
        "#EBO..E.....OBE#",
        "#...OOOOOOOO...#",
        "#$O.BB.E.$BB.O$#",
        "################"
    ],
    // ROOM 21
    [
        "#$E.BBB$P$B.BB$#",
        "#BBB....O.E....#",
        "#.....OE......B#",
        "#.BBOOOOOOOOB..#",
        "#E.O..E$$E..O..#",
        "#..BOOOOOOOOB.B#",
        "#.O............#",
        "#....$B.B.B..EB#",
        "#$BB.E.B....BB$#",
        "################"
    ],
    // ROOM 22
    [
        "#.....$B.......#",
        "#.BBBBBB.OBBBO.#",
        "#......B.B...B.#",
        "#BBOBB.B.BE$.B.#",
        "#.E..E.BPB.$.B.#",
        "#EBBBOBO.B.$.B.#",
        "#......B.BEEEB.#",
        "#BBOBB.B.OBBBO.#",
        "#$E....B.......#",
        "################"
    ],
    // ROOM 23
    [
        "#$O.O....OB..O$#",
        "#$O...OBBOBO.BB#",
        "#.O.OBO..O.B.O.#",
        "#EO.BBOO.O$B.OE#",
        "#.O.OBO..OBO.O.#",
        "#EO.B$OPOOBB.OE#",
        "#.OEB.O..OBO.O.#",
        "#B..OBOBBO.E.O$#",
        "#$OE.BOE...O.O$#",
        "################"
    ],
    // ROOM 24
    [
        "#BOB.BOBBOB.BOB#",
        "#$BBEBOBE.B.BB$#",
        "#BBB.BBBBBB.E..#",
        "#$BB.B....B.BB$#",
        "#OBO.B.OO.B.OBO#",
        "#$BB.BE$O4B.BB$#",
        "#BBB.BBBBBB.BBB#",
        "#$BBEB.EBPBEBB$#",
        "#BOB.BOBBOB.BOB#",
        "################"
    ],
    // ROOM 25
    [
        "#$.....P......$#",
        "#.$BBBBOOBBBB$.#",
        "#.BE....E....B.#",
        "#.B.OBBBBBBB.BE#",
        "#.B.BE.$$.EB.BE#",
        "#.B.OBBBBBBO.B.#",
        "#.B....$$....B.#",
        "#.OBBBOBBOBBBO.#",
        "#E..E..........#",
        "################"
    ],
    // ROOM 26 (ORIG CAVE2,ROOM1)
    [
        "#$OBOBBBBB.BE..#",
        "#.BBBBOOOO..BB.#",
        "#.BBBO...EO..B.#",
        "#EBBOE.$$.EOOB.#",
        "#BOBBOEOBO.OBB.#",
        "#EBBBO..OE.OBO.#",
        "#.BBBBO...BBBB.#",
        "#.OBOBBOOOBBOB.#",
        "#$OBBBP.OOBBBB.#",
        "################"
    ],
    // ROOM 27
    [
        "#BP..O.$$.O.BB.#",
        "#B.O.OE...O.BB.#",
        "#B.B.....E..BO.#",
        "#B.BEO.BO.B.BB.#",
        "#B.OEO.$O$B.BOE#",
        "#O.OOOOOOOOOOB.#",
        "#..............#",
        "#O.OOOOOOOOOOBO#",
        "#..B..E$...EBBB#",
        "################"
    ],
    // ROOM 28
    [
        "#.B$B$B$P$B$B$.#",
        "#BOOOOOOOOOOOOB#",
        "#$BE.........B$#",
        "#.O.OBBBBBBOEO.#",
        "#EB.BE.$$.EB.BE#",
        "#.O.OBBBBBBO.O.#",
        "#$BE.......E.B$#",
        "#BOOOOOOOOOOOOB#",
        "#.$B$B$B$B$B$B.#",
        "################"
    ],
    // ROOM 29
    [
        "#$BOB..BO$.BBBE#",
        "#.OBBB...E.BOBE#",
        "#.OBOBOOOOOBBB.#",
        "#EBBO$B$$BO....#",
        "#.BBO$.$E$OBBO.#",
        "#OBOOB..EBO$BB.#",
        "#BBBO$B$B$OOBB.#",
        "#BBBOOOOOBOBBBE#",
        "#BBPPB.E..BBBO$#",
        "################"
    ],
    // ROOM 30
    [
        "#$E...OBOE..O$O#",
        "#E.BB..BB.B..B.#",
        "#.O...$.....$..#",
        "#.B.B.BB.BB.EO.#",
        "#..E.......EBB.#",
        "#B.B.B.OB.B....#",
        "#.....BPO...BBB#",
        "#B.BEBOBB.B....#",
        "#$.B..$E..$B.B$#",
        "################"
    ],
    // ROOM 31
    [
        "#$$$$$$$...E.O$#",
        "#OOOOOOOOOOOB.$#",
        "#.BE.E........B#",
        "#.OEOBOBOBOBO..#",
        "#PO.BE..$..EB.O#",
        "#.O.OBOBOBOBO..#",
        "#.B.E.........B#",
        "#OOOOOOOOOOOB.$#",
        "#$$$$$$$..E..O$#",
        "################"
    ],
    // ROOM 32
    [
        "#EE..E.E.E.EBP$#",
        "#.BBBBBBBBBBBBB#",
        "#..............#",
        "#EOB$BOB$BOB$B.#",
        "#..............#",
        "#.$BOB$BOB$BOB.#",
        "#E.............#",
        "#BBBBBBBBBBBBB.#",
        "#$.............#",
        "################"
    ],
    // ROOM 33
    [
        "#...O...OE..O$$#",
        "#BO.B.B.B.B.O$.#",
        "#.$.B.B.BEBEO$.#",
        "#.B.$.B.B.$.O$.#",
        "#.B.O.O.O.O.OB.#",
        "#.B.BEB.B.B.OB.#",
        "#.B.B.B.B.B.OO.#",
        "#.B.O.OEO.B.B.E#",
        "#PB...E...O.BEO#",
        "################"
    ],
    // ROOM 34
    [
        "#$....B.PB....$#",
        "#..O.B$B$B$.O..#",
        "#.BB.$E..EB.BB.#",
        "#.B..B.$B.$..B.#",
        "#.OB.$EB$.B.BO.#",
        "#.B..B.E..$.EB.#",
        "#EBB.$B$B$B.BB.#",
        "#..O.B....B.OE.#",
        "#$..E..BB.....$#",
        "################"
    ],
    // ROOM 35
    [
        "#PBBBOBBBBBBOB$#",
        "#BBE........EB.#",
        "#.O.O$BBOB$O.BO#",
        "#BB.$E.....$.B$#",
        "#BO.B.O$$OEB.O.#",
        "#BB.B.E...E$.B.#",
        "#OBEO$BOBB$O.BO#",
        "#BB.........EB.#",
        "#BBOBBBBBBOBBB$#",
        "################"
    ],
    // ROOM 36
    [
        "#$E...OBOE..O$O#",
        "#E.BB..BB.B..B.#",
        "#.O...$.....$..#",
        "#.B.B.BB.BB.EO.#",
        "#..E.......EBB.#",
        "#B.B.B.OB.B....#",
        "#.....BPO...BBB#",
        "#B.BEBOBB.B....#",
        "#$.B..$E..$B.B$#",
        "################"
    ],
];

function expandLevelData(compactData) {
    let expandedMap = [...LEVEL_HEADER];
    for (let row of compactData) {
        if (row.length < 16) row = row.padEnd(16, '.');
        if (row.length > 16) row = row.substring(0, 16);

        let lineTop = "";
        let lineBottom = "";
        for (let char of row) {
            if (char === '#' || char === 'B') {
                lineTop    += char + char;
                lineBottom += char + char;
            } else if (['P', 'E', 'O', '$'].includes(char)) {
                lineTop    += char + ".";
                lineBottom += "..";
            } else {
                lineTop    += "..";
                lineBottom += "..";
            }
        }
        expandedMap.push(lineTop);
        expandedMap.push(lineBottom);
    }
    return expandedMap;
}

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
    } else if (type === 'score') {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode); gainNode.connect(audioCtx.destination);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(600, now); 
        gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); 
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'dig') {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode); gainNode.connect(audioCtx.destination);
        osc.type = 'square'; osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'explosion') {
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
    isHighScores = false; 
    enemies = [];
    goldRemaining = 0; 
    isGameOver = false;
    bonusFrameCount = 0;
    
    if (currentLevel >= MAX_LEVELS || currentLevel >= COMPACT_LEVELS.length) {
        handleGameWon();
        return;
    }

    map = new Array(24).fill(0).map(() => new Array(32).fill(TILE_EMPTY));
    const compactData = COMPACT_LEVELS[currentLevel];
    const currentLayout = expandLevelData(compactData);

    for (let y = 0; y < 24; y++) {
        if (!currentLayout[y]) continue;
        const rowString = currentLayout[y];
        
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

function handleGameWon() {
    isGameWon = true;
    score += 5000; 
    playSound('score'); 
    console.log("GAME WON! Bonus 5000 added.");
}

// --- HIGH SCORE LOGIIKKA ---

function checkAndSaveHighScore() {
    // 1. Haetaan vanhat pisteet muistista
    let savedScores = localStorage.getItem(HIGH_SCORE_KEY);
    let scores = savedScores ? JSON.parse(savedScores) : [];

    // 2. Tarkistetaan mahtuuko listalle (Top 10 tai lista on vajaa)
    if (scores.length < 10 || score > scores[scores.length - 1].score) {
        
        setTimeout(() => {
            let name = prompt("NEW PERSONAL BEST! Enter your name:", "PLAYER");
            
            if (!name) name = "UNKNOWN";
            name = name.substring(0, 10).toUpperCase();

            scores.push({ name: name, score: score });
            scores.sort((a, b) => b.score - a.score);
            scores = scores.slice(0, 10);

            localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
        }, 100);
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
    // TILAT: GAMEOVER, VOITTO tai LEVEL CLEAR
    if (isGameOver || isLevelCompleted || isGameWon || isHighScores) {
        if (keys['Enter']) { 
             keys['Enter'] = false; 
             
             if (isHighScores) {
                 lives = 5; score = 0; currentLevel = 0; 
                 isHighScores = false;
                 isGameOver = false;
                 isGameWon = false;
                 initGame();
                 return;
             }

             if (isGameOver || isGameWon) {
                 checkAndSaveHighScore(); 
                 isHighScores = true;     
                 return;
             }

             if (isLevelCompleted) {
                 // --- UUSI LOGIIKKA: TARKISTETAAN LUOLAN VAIHTUMINEN ---
                 // Jos seuraava taso aloittaa uuden luolan (eli nykyinen + 1 on jaollinen 25:llä)
                 // Esim. ollaan tasolla 24 (Room 25) -> 24+1 = 25 -> Jaollinen!
                 if ((currentLevel + 1) % ROOMS_PER_CAVE === 0) {
                     score += 5000;  // 5000 lisäpistettä
                     lives++;        // 1 lisäelämä
                     playSound('score'); // Äänimerkki palkinnosta
                     console.log("CAVE COMPLETED! Bonus 5000pts + 1 Life");
                 }

                 currentLevel++;
                 gameTime = INITIAL_TIME; 
                 initGame();
             }
        }
        return;
    }


    // BONUSLASKENTA
    if (isLevelClearBonus) {
        if (gameTime > 0) {
            gameTime -= 10; 
            if (gameTime < 0) gameTime = 0;
            score += 1;     
            bonusFrameCount++;
            if (bonusFrameCount % 4 === 0) playSound('score'); 
        } else {
            isLevelClearBonus = false;
            isLevelCompleted = true; 
        }
        return; 
    }

    // KUOLEMA
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

    // AIKA
    timeAccumulator += deltaTime;
    if (timeAccumulator >= 100) { 
        gameTime--;
        timeAccumulator -= 100;
        if (gameTime <= 0) {
            gameTime = 0;
            handleGameOver("TIME UP");
        }
    }

    // RÄJÄHDYKSET
    for (let i = explosions.length - 1; i >= 0; i--) {
        let exp = explosions[i];
        exp.timer++;
        if (exp.timer > 8) { 
            exp.timer = 0;
            exp.frame++;
            if (exp.frame > 2) explosions.splice(i, 1);
        }
    }

// KIVET
    for (let i = movingStones.length - 1; i >= 0; i--) {
        let stone = movingStones[i];
        stone.x += stone.vx;
        stone.y += stone.vy;
        let stoneStopped = false;

        // --- KORJATTU TÖRMÄYS: KESKIPISTE-ETÄISYYS (VARMIN TAPA) ---
        for (let e = enemies.length - 1; e >= 0; e--) {
            let enemy = enemies[e];

            // 1. Lasketaan molempien keskipisteet
            let sCX = stone.x + 16;
            let sCY = stone.y + 16;
            let eCX = enemy.x + 16;
            let eCY = enemy.y + 16;

            // 2. Lasketaan etäisyys (itseisarvo)
            let dx = Math.abs(sCX - eCX);
            let dy = Math.abs(sCY - eCY);

            // 3. OSUMAEHTO
            // HIT_DIST: Kuinka lähellä keskipisteiden pitää olla.
            // 32 tarkoittaa, että reunat koskettavat.
            // 28 tarkoittaa, että 4 pikselin päällekkäisyys riittää tappoon.
            // Tämä estää "jumiin jäämisen" reunalla.
            const HIT_DIST = 28; 

            if (dx < HIT_DIST && dy < HIT_DIST) {
                
                // OSUMA!
                playSound('explosion');
                explosions.push({ x: enemy.x, y: enemy.y, frame: 0, timer: 0 });
                enemies.splice(e, 1); 
                
                score += 4; // 4 PISTETTÄ
                
                // Pysäytetään kivi ja kohdistetaan ruudukkoon
                stone.x = Math.round(stone.x / 32) * 32;
                stone.y = Math.round(stone.y / 32) * 32;

                placeBigTileObject(stone.x / TILE_SIZE, stone.y / TILE_SIZE, 128);
                movingStones.splice(i, 1);
                stoneStopped = true;
                break; 
            }
        }
        
        if (stoneStopped) continue;

        // Kiven pysähtyminen seiniin/maahan (Pysyy samana)
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

    // TÖRMÄYKSET
    for (let enemy of enemies) {
        let pCX = player.x + 16;
        let pCY = player.y + 16;
        let eCX = enemy.x + 16;
        let eCY = enemy.y + 16;
        let dx = Math.abs(pCX - eCX);
        let dy = Math.abs(pCY - eCY);
        const KILL_DIST = 33;    
        const ALIGN_ZONE = 10;   
        let hitHorizontal = (dx < KILL_DIST && dy < ALIGN_ZONE);
        let hitVertical = (dy < KILL_DIST && dx < ALIGN_ZONE);
        if (hitHorizontal || hitVertical) {
            playerDie(); 
            return; 
        }
    }

    // PELAAJAN LIIKE
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
    ctx.drawImage(tileset, sourceX, sourceY, SOURCE_TILE_SIZE, SOURCE_TILE_SIZE, parseInt(x), parseInt(y), TILE_SIZE, TILE_SIZE);
}

function drawSprite(ctx, spriteIndex, x, y, size = TILE_SIZE, offset = 0) {
    const SOURCE_SPRITE_SIZE = 32; 
    const sourceX = spriteIndex * SOURCE_SPRITE_SIZE;
    const sourceY = 0; 
    ctx.drawImage(spriteset, sourceX, sourceY, SOURCE_SPRITE_SIZE, SOURCE_SPRITE_SIZE, parseInt(x) + offset, parseInt(y) + offset, size, size);
}

function draw(ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // KARTTA
    for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 32; x++) {
            const tileID = map[y][x];
            if (tileID !== TILE_EMPTY) {
                drawTile(ctx, tileID, x * TILE_SIZE, y * TILE_SIZE);
            }
        }
    }

    // VIHUT & KIVET
    enemies.forEach(enemy => {
        let baseTile = 144; 
        if (globalFrame === 1) baseTile = 148; 
        drawTile(ctx, baseTile, enemy.x, enemy.y);
        drawTile(ctx, baseTile + 1, enemy.x + 16, enemy.y);
        drawTile(ctx, baseTile + 2, enemy.x, enemy.y + 16);
        drawTile(ctx, baseTile + 3, enemy.x + 16, enemy.y + 16);
    });
    movingStones.forEach(stone => {
        drawTile(ctx, 128, stone.x, stone.y);
        drawTile(ctx, 129, stone.x + 16, stone.y);
        drawTile(ctx, 130, stone.x, stone.y + 16);
        drawTile(ctx, 131, stone.x + 16, stone.y + 16);
    });

    // PELAAJA
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

    // RÄJÄHDYKSET
    explosions.forEach(exp => {
        let spriteIndex = SPRITE_EXPLOSION_1 + exp.frame;
        drawSprite(ctx, spriteIndex, exp.x, exp.y, 32, 0);
    });

    // HUD
    ctx.font = "16px monospace"; 
    ctx.textBaseline = "top"; 
    let displayLevel = currentLevel;
    if (displayLevel >= MAX_LEVELS) displayLevel = MAX_LEVELS - 1;
    const currentCaveNum = Math.floor(displayLevel / ROOMS_PER_CAVE) + 1;
    const currentRoomNum = (displayLevel % ROOMS_PER_CAVE) + 1;

    ctx.fillStyle = "#00EEEE"; 
    ctx.fillText("CAVE:" + currentCaveNum, 32, 0); 
    ctx.fillStyle = "#00EE00"; 
    ctx.fillText("MINER MACHINE", 176, 0); 
    ctx.fillStyle = "#00EEEE"; 
    ctx.fillText("ROOM:" + currentRoomNum.toString().padStart(2, '0'), 400, 0); 
    const statY = 32; 
    ctx.fillText("SCORE:" + score.toString().padStart(5, '0'), 32, statY);
    ctx.fillText("MEN:" + lives, 208, statY); 
    ctx.fillText("TIME:" + gameTime.toString().padStart(5, '0'), 368, statY); 

    // --- RUUTUTILA: PERSONAL BEST SCORES ---
    if (isHighScores) {
        // Tumma tausta
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        ctx.fillStyle = "#FFFF00"; // Keltainen otsikko
        ctx.textAlign = "center";
        ctx.font = "32px monospace";
        // --- MUUTOS TÄSSÄ ---
        ctx.fillText("PERSONAL BEST SCORES", SCREEN_WIDTH / 2, 60);

        // Hae pisteet
        let savedScores = localStorage.getItem(HIGH_SCORE_KEY);
        let scores = savedScores ? JSON.parse(savedScores) : [];

        // Piirrä lista
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "20px monospace";
        let startY = 120;
        
        if (scores.length === 0) {
            ctx.fillText("NO SCORES YET", SCREEN_WIDTH / 2, startY);
        } else {
            for (let i = 0; i < scores.length; i++) {
                let s = scores[i];
                let rank = (i + 1) + ".";
                // Asemointi: Sija - Nimi - Pisteet
                ctx.textAlign = "right";
                ctx.fillText(rank, 160, startY + (i * 24));
                
                ctx.textAlign = "left";
                ctx.fillText(s.name, 180, startY + (i * 24));
                
                ctx.textAlign = "right";
                ctx.fillText(s.score.toString().padStart(6, '0'), 380, startY + (i * 24));
            }
        }

        ctx.textAlign = "center";
        ctx.fillStyle = "#00FF00";
        ctx.fillText("PRESS ENTER TO RESTART", SCREEN_WIDTH / 2, 360);
        ctx.textAlign = "start"; // Palauta oletus
        return; 
    }

    // GAME OVER -RUUTU
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

    // LEVEL CLEARED -RUUTU
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

    // VOITTORUUTU
    if (isGameWon) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; 
        ctx.fillRect(100, 100, 312, 160); 
        ctx.strokeStyle = "#FFD700"; 
        ctx.strokeRect(100, 100, 312, 160);
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFD700"; 
        ctx.font = "32px monospace"; 
        ctx.fillText("YOU WIN!", SCREEN_WIDTH / 2, 140);
        ctx.fillStyle = "#00FF00";
        ctx.fillText("BONUS 5000", SCREEN_WIDTH / 2, 180);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "16px monospace";
        ctx.fillText("PRESS ENTER", SCREEN_WIDTH / 2, 220);
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
    
    // Tarkistetaan onko kyseessä kivi (ID 128-131)
    if (tileID >= 128 && tileID <= 131) {
        let stoneTx = tx;
        let stoneTy = ty;
        
        // Säädetään koordinaatit kiven vasempaan yläkulmaan
        if (tileID === 129 || tileID === 131) stoneTx -= 1;
        if (tileID === 130 || tileID === 131) stoneTy -= 1;
        
        // Lasketaan kiven nykyinen pikselisijainti
        let currentStoneX = stoneTx * TILE_SIZE;
        let currentStoneY = stoneTy * TILE_SIZE;

        // Lasketaan MINNE kivi olisi menossa (32px suuntaan)
        let destX = currentStoneX;
        let destY = currentStoneY;
        
        if (pushDx > 0) destX += 32; 
        else if (pushDx < 0) destX -= 32;
        
        if (pushDy > 0) destY += 32; 
        else if (pushDy < 0) destY -= 32;

        // --- UUSI TARKISTUS: ONKO MÄÄRÄNPÄÄSSÄ VIHOLLINEN? ---
        for (let enemy of enemies) {
            // Jos vihollinen on kiven määränpäässä (tai hyvin lähellä sitä)
            if (Math.abs(enemy.x - destX) < 28 && Math.abs(enemy.y - destY) < 28) {
                return; // ESTÄ TYÖNTÖ! Kivi toimii kuin seinä.
            }
        }

        // --- TARKISTETAAN SEINÄT JA MAASTO ---
        let destTx = stoneTx;
        let destTy = stoneTy;
        if (pushDx > 0) destTx += 2; if (pushDx < 0) destTx -= 1;
        if (pushDy > 0) destTy += 2; if (pushDy < 0) destTy -= 1;

        // Jos tila on vapaa (ei seinää, ei toista kiveä), aloitetaan liike
        if (!checkCollisionForStone(destTx, destTy) && !checkCollisionForStone(destTx + (pushDx?0:1), destTy + (pushDy?0:1))) {
            
            // Tyhjennetään vanha paikka kartasta
            map[stoneTy][stoneTx] = TILE_EMPTY; map[stoneTy][stoneTx+1] = TILE_EMPTY;
            map[stoneTy+1][stoneTx] = TILE_EMPTY; map[stoneTy+1][stoneTx+1] = TILE_EMPTY;
            
            // Lisätään liikkuviin kiviin
            movingStones.push({ x: currentStoneX, y: currentStoneY, vx: Math.sign(pushDx) * 4, vy: Math.sign(pushDy) * 4 });
            
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
        // --- MUUTOS: PISTEET HUONEEN NUMERON MUKAAN ---
        // Lasketaan huoneen numero (1-25)
        const points = (currentLevel % ROOMS_PER_CAVE) + 1;
        
        score += points; // Lisätään huoneen numero pisteisiin
        
        playSound('gold'); 
        goldRemaining--;

        if (goldRemaining <= 0) isLevelClearBonus = true; 
        
        let goldTx = tx; let goldTy = ty;
        if (tileID === 161 || tileID === 163) goldTx -= 1; 
        if (tileID === 162 || tileID === 163) goldTy -= 1; 
        
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