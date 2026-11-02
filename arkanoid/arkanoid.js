/**
 * Arkanoid Mini-Game // Refyrd Games
 * Features 60 handcrafted/procedural levels, random mode, falling power-ups (+3, x3, Widen, Floor Barrier),
 * slower comfortable ball speed, and persistent level progression via localStorage.
 */
(function() {
  // DOM Elements - Navigation & Modes
  const linkToHub = document.getElementById('link-to-hub');
  const btnToLevels = document.getElementById('btn-to-levels');
  const pageTitle = document.getElementById('page-title');
  const levelIndicator = document.getElementById('level-indicator');
  const debugBadge = document.getElementById('debug-badge');
  const soundToggle = document.getElementById('sound-toggle');
  const soundStatus = document.getElementById('sound-status');

  const levelSelectView = document.getElementById('level-select-view');
  const gameView = document.getElementById('game-view');
  const tabCampaign = document.getElementById('tab-campaign');
  const tabRandom = document.getElementById('tab-random');
  const modeDesc = document.getElementById('mode-desc');
  const campaignPanel = document.getElementById('campaign-panel');
  const randomPanel = document.getElementById('random-panel');
  const levelsGrid = document.getElementById('levels-grid');
  const progressText = document.getElementById('progress-text');
  const starsText = document.getElementById('stars-text');
  const btnStartRandom = document.getElementById('btn-start-random');
  const btnPlayCampaign = document.getElementById('btn-play-campaign');
  const playCampaignText = document.getElementById('play-campaign-text');

  // DOM Elements - Gameplay HUD
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const screenBox = document.querySelector('.canvas-screen-box');
  const scoreDisplay = document.getElementById('score-display');
  const bestDisplay = document.getElementById('best-display');
  const multiplierBadge = document.getElementById('multiplier-badge');
  const livesDisplay = document.getElementById('lives-display');
  const btnPause = document.getElementById('btn-pause');
  const btnRestart = document.getElementById('btn-restart');
  const overlay = document.getElementById('game-overlay');
  const overlayHeading = document.getElementById('overlay-heading');
  const overlayDesc = document.getElementById('overlay-desc');
  const overlayBtn = document.getElementById('overlay-btn');
  const overlayNextBtn = document.getElementById('overlay-next-level-btn');
  const overlayLevelsBtn = document.getElementById('overlay-levels-btn');

  // Active Buff Chips
  const badgeBarrier = document.getElementById('badge-barrier');
  const timerBarrier = document.getElementById('timer-barrier');
  const badgeWiden = document.getElementById('badge-widen');
  const timerWiden = document.getElementById('timer-widen');
  const badgeMult = document.getElementById('badge-mult');
  const timerMult = document.getElementById('timer-mult');

  // Debug Modal Elements
  const debugModal = document.getElementById('debug-modal');
  const debugHandle = document.getElementById('debug-drag-handle');
  const dbgClose = document.getElementById('dbg-close');
  const dbgUnlockAll = document.getElementById('dbg-unlock-all');
  const dbgDropMultiball = document.getElementById('dbg-drop-multiball');
  const dbgDropBarrier = document.getElementById('dbg-drop-barrier');
  const dbgDropWiden = document.getElementById('dbg-drop-widen');
  const dbgDropX3 = document.getElementById('dbg-drop-x3');
  const dbgClearBricks = document.getElementById('dbg-clear-bricks');
  const dbgWin = document.getElementById('dbg-win');

  // Web Audio Synthesizer
  let audioCtx = null;
  let isSoundOn = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration, type = 'sine') {
    if (!isSoundOn || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function playSound(name) {
    if (name === 'paddle') {
      playTone(460, 0.05, 'triangle');
    } else if (name === 'wall') {
      playTone(620, 0.04, 'sine');
    } else if (name === 'hit') {
      playTone(740, 0.06, 'triangle');
    } else if (name === 'break') {
      playTone(880, 0.07, 'triangle');
      setTimeout(() => playTone(1100, 0.07, 'triangle'), 35);
    } else if (name === 'powerup') {
      playTone(523.25, 0.08, 'sine');
      setTimeout(() => playTone(783.99, 0.12, 'triangle'), 60);
    } else if (name === 'lose_life') {
      playTone(220, 0.14, 'sawtooth');
      setTimeout(() => playTone(140, 0.18, 'sawtooth'), 110);
    } else if (name === 'win') {
      playTone(523.25, 0.09, 'triangle');
      setTimeout(() => playTone(659.25, 0.09, 'triangle'), 80);
      setTimeout(() => playTone(783.99, 0.11, 'triangle'), 160);
      setTimeout(() => playTone(1046.5, 0.22, 'triangle'), 240);
    } else if (name === 'click') {
      playTone(880, 0.03, 'sine');
    }
  }

  soundToggle.addEventListener('click', () => {
    initAudio();
    isSoundOn = !isSoundOn;
    soundToggle.setAttribute('aria-pressed', isSoundOn ? 'true' : 'false');
    soundStatus.textContent = isSoundOn ? 'вкл' : 'выкл';
    if (isSoundOn) playSound('click');
  });

  // Persistent Progress Storage
  const TOTAL_LEVELS = 60;
  let unlockedLevel = parseInt(localStorage.getItem('refyrd_arkanoid_unlocked') || '1', 10);
  let completedLevels = new Set(JSON.parse(localStorage.getItem('refyrd_arkanoid_completed') || '[]'));
  let bestScore = parseInt(localStorage.getItem('refyrd_arkanoid_best') || '0', 10);
  bestDisplay.textContent = String(bestScore).padStart(3, '0');

  function saveProgress() {
    localStorage.setItem('refyrd_arkanoid_unlocked', unlockedLevel.toString());
    localStorage.setItem('refyrd_arkanoid_completed', JSON.stringify(Array.from(completedLevels)));
  }

  // Square Brick Layout Dimensions (18 cols x 14 rows)
  const brickRows = 14;
  const brickCols = 18;
  const brickWidth = 18;
  const brickHeight = 18;
  const brickGap = 2;
  const brickOffsetTop = 32;
  const brickOffsetLeft = 21; // (400 - (18*20 - 2)) / 2 = 21px centered

  // Brick Color & Type Definitions
  const BRICK_TYPES = {
    1: { fill: '#22C55E', border: '#4ADE80', maxHp: 1, points: 10 }, // 1-hit Emerald Green
    2: { fill: '#FF9F1C', border: '#FFAF3D', maxHp: 2, points: 25 }, // 2-hit Amber Gold
    3: { fill: '#FF4D36', border: '#FF6B57', maxHp: 3, points: 50 }, // 3-hit Crimson
    4: { fill: '#2E66FF', border: '#60A5FA', maxHp: 1, points: 15 }, // 1-hit Cobalt Blue
    5: { fill: '#FFE047', border: '#FDE047', maxHp: 1, points: 15 }, // 1-hit Lemon Yellow
    6: { fill: '#A855F7', border: '#C084FC', maxHp: 2, points: 35 }, // 2-hit Purple Amethyst
    9: { fill: '#475569', border: '#94A3B8', maxHp: Infinity, unbreakable: true, points: 0 } // Unbreakable Steel
  };

  // 60 Handcrafted / Algorithmic Levels (18 cols x 14 rows)
  function generateLevelData(lvlNum) {
    const grid = [];
    for (let r = 0; r < brickRows; r++) grid[r] = new Array(brickCols).fill(0);

    const arch = (lvlNum - 1) % 15;
    const tier = Math.floor((lvlNum - 1) / 10); // 0 to 5
    const hasSteel = lvlNum >= 11; // Steel blocks unlock from level 11

    const tArmored = tier >= 2 ? 3 : 2;
    const tHard = tier >= 3 ? 6 : 2;
    const tMid = lvlNum % 2 === 0 ? 4 : 5;
    const tEasy = 1;

    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        const symC = c < 9 ? c : 17 - c; // Horizontal symmetry (0..8)
        let val = 0;

        switch (arch) {
          case 0: // The Gate (Columns and arched top)
            if ((symC in [1, 2] || symC === 1 || symC === 2) && r <= 10) {
              val = r <= 2 ? tArmored : tEasy;
            } else if (r <= 2 && symC <= 7) {
              val = tMid;
            }
            break;

          case 1: // Butterfly Wings
            if ((symC + r) % 3 === 0 && r <= 11 && symC <= 7) {
              val = r < 5 ? tHard : tMid;
            } else if (symC === 0 && r >= 3 && r <= 9) {
              val = tArmored;
            }
            break;

          case 2: // Space Invader
            if (
              (r === 1 && (symC === 2 || symC === 3)) ||
              (r === 2 && symC >= 1 && symC <= 4) ||
              (r === 3 && symC !== 3 && symC <= 5) ||
              (r >= 4 && r <= 6 && symC <= 5) ||
              (r === 7 && (symC === 1 || symC === 3)) ||
              (r === 8 && (symC === 0 || symC === 4))
            ) {
              val = (r === 3 || r === 6) ? tArmored : tMid;
            }
            break;

          case 3: // Big Heart
            if (
              (r === 1 && symC >= 2 && symC <= 5) ||
              (r === 2 && symC >= 1 && symC <= 6) ||
              (r >= 3 && r <= 9 && symC <= Math.max(0, 8 - (r - 2)))
            ) {
              val = r <= 3 ? 3 : (r <= 6 ? 2 : 1);
            }
            break;

          case 4: // Pixel Skull
            if (r <= 8 && symC <= 6) {
              if (r >= 4 && r <= 5 && (symC === 2 || symC === 3)) {
                val = 0; // Eye socket
              } else if (r === 8 && (symC === 1 || symC === 3 || symC === 5)) {
                val = 0; // Teeth gap
              } else {
                val = r <= 3 ? tHard : tEasy;
              }
            }
            break;

          case 5: // Diamond Rings
            const distD = Math.abs(r - 5) + Math.abs(symC - 4);
            if (distD === 2 || distD === 4 || distD === 6) {
              val = distD === 2 ? tArmored : (distD === 4 ? tHard : tMid);
            }
            break;

          case 6: // Fortress with 1-block bottleneck
            if (hasSteel && (r === 3 || symC === 7) && !(r === 3 && symC === 0)) {
              val = 9; // Steel perimeter with a 1-block slit at center!
            } else if (r > 3 && r < 10 && symC < 7) {
              val = r < 6 ? tArmored : tEasy; // High value chamber inside
            } else if (r < 3 && symC <= 6) {
              val = tMid;
            }
            break;

          case 7: // Hourglass & Steel Pillars
            if ((symC === 0 || symC === 8) && r <= 11) {
              val = (hasSteel && r >= 4 && r <= 7) ? 9 : tHard;
            } else if (Math.abs(r - 5) >= symC && r <= 10) {
              val = r <= 2 || r >= 8 ? tMid : tEasy;
            }
            break;

          case 8: // Checkerboard Maze
            if ((r + symC) % 2 === 0 && r <= 11 && symC <= 7) {
              val = (hasSteel && (r === 5 || r === 6) && (symC === 2 || symC === 4)) ? 9 : tEasy;
            }
            break;

          case 9: // The Vault (Steel box with 1-block entrance at bottom)
            if (hasSteel) {
              const isVaultWall = (r === 4 || r === 10 || symC === 7) && !(r === 10 && symC === 0);
              if (isVaultWall) {
                val = 9; // Unbreakable wall
              } else if (r > 4 && r < 10 && symC < 7) {
                val = 3; // Crimson treasure inside vault!
              } else if (r < 4 && symC <= 7) {
                val = tMid;
              }
            } else {
              if (r <= 9 && symC <= 7) val = r < 4 ? tMid : tEasy;
            }
            break;

          case 10: // Shield and Blade
            if (symC === 0 && r <= 12) {
              val = tArmored;
            } else if (symC <= 6 && r >= 2 && r <= 8 && (symC + r) <= 10) {
              val = symC <= 3 ? tHard : tEasy;
            }
            break;

          case 11: // Twin Steel Bunkers (Heavy protective roofs)
            if (hasSteel && r === 2 && symC >= 2 && symC <= 6) {
              val = 9; // Steel roof
            } else if (r >= 3 && r <= 7 && symC >= 2 && symC <= 5) {
              val = r === 3 ? tArmored : tEasy;
            } else if (r >= 9 && r <= 11 && symC <= 7) {
              val = tMid;
            }
            break;

          case 12: // Spiral Coils
            const ring = Math.min(r, 13 - r, symC, 8 - symC);
            if (ring % 2 === 0 && r <= 11) {
              val = (hasSteel && ring === 2 && r > 3) ? 9 : tMid;
            } else if (ring === 1) {
              val = tEasy;
            }
            break;

          case 13: // Sun Mandala
            const distM = Math.abs(r - 6) + symC;
            if ((distM === 3 || distM === 5 || distM === 7) && r <= 12) {
              val = distM === 3 ? tArmored : tEasy;
            }
            break;

          case 14: // The Obsidian Citadel (Boss Fortress)
            if (hasSteel) {
              const outerWall = (r === 1 || r === 11 || symC === 8) && !(r === 11 && (symC === 3 || symC === 4));
              const innerWall = (r === 4 || r === 8 || symC === 4) && !(r === 4 && symC === 0);
              if (outerWall || innerWall) {
                val = 9; // Unbreakable fortress barriers
              } else if (r > 4 && r < 8 && symC < 4) {
                val = 3; // Dense 3-hit citadel core!
              } else {
                val = tHard;
              }
            } else {
              if (r <= 10 && symC <= 7) val = tMid;
            }
            break;
        }

        grid[r][c] = val;
      }
    }

    return grid;
  }

  // Random Mode Pattern Generator (18 cols x 14 rows, balanced difficulty 20-30 with distinct silhouettes)
  function generateRandomLevelData() {
    const grid = [];
    for (let r = 0; r < brickRows; r++) grid[r] = new Array(brickCols).fill(0);

    const archetype = Math.floor(Math.random() * 8);
    const theme = Math.floor(Math.random() * 5);

    // Cohesive color palettes matching levels 20-30 difficulty (mostly 1-hit and 2-hit, few 3-hit)
    const palettes = [
      { primary: 1, accent: 2, core: 3 }, // Emerald & Gold
      { primary: 4, accent: 2, core: 6 }, // Cobalt & Gold
      { primary: 5, accent: 6, core: 3 }, // Lemon & Amethyst
      { primary: 4, accent: 1, core: 2 }, // Neon Cyan & Green
      { primary: 1, accent: 5, core: 2 }  // Jade & Sun
    ];
    const pal = palettes[theme];
    const includeSteel = Math.random() < 0.30;

    for (let r = 1; r < 10; r++) {
      for (let symC = 0; symC < 9; symC++) {
        let filled = false;
        let isCore = false;
        let isAccent = false;
        let isSteel = false;

        switch (archetype) {
          case 0: // Castle / Bastion
            if (r === 1) {
              filled = (symC === 1 || symC === 3 || symC === 5);
            } else if (r === 2 || r === 3) {
              filled = symC <= 6;
              isAccent = (symC === 5 || symC === 6);
            } else if (r >= 4 && r <= 7) {
              if (symC === 0 && r >= 6) {
                filled = false; // Central gate entrance
              } else {
                filled = symC <= 5;
                isCore = symC <= 1 && r <= 5;
                isSteel = includeSteel && r === 4 && (symC === 3 || symC === 4);
              }
            } else if (r === 8) {
              filled = symC >= 1 && symC <= 4;
            }
            break;

          case 1: // Wings / Starfighter
            const wingSpan = Math.min(7, 7 - Math.abs(r - 5));
            if (symC <= wingSpan) {
              if ((r === 2 || r === 3) && symC <= 1) {
                filled = true;
                isCore = true;
              } else if (r >= 3 && r <= 7) {
                filled = ((r + symC) % 2 === 0) || symC === 0 || symC === wingSpan;
                isAccent = symC === wingSpan;
                isCore = symC === 0;
                isSteel = includeSteel && r === 5 && symC === wingSpan;
              } else if (r === 8) {
                filled = symC === 0 || symC === 2 || symC === 3;
              }
            }
            break;

          case 2: // Diamond Gem
            const distD = Math.abs(r - 5) + symC;
            if (distD <= 6 && r >= 2 && r <= 8) {
              filled = true;
              isCore = distD <= 2;
              isAccent = (distD === 4 || distD === 5);
              isSteel = includeSteel && distD === 6 && r === 5;
            }
            break;

          case 3: // Crown
            if (r === 1) {
              filled = (symC === 0 || symC === 3 || symC === 6);
            } else if (r === 2) {
              filled = (symC === 0 || symC === 1 || symC === 3 || symC === 4 || symC === 6);
            } else if (r >= 3 && r <= 5) {
              filled = symC <= 6;
              isCore = (symC === 0 || symC === 3);
              isAccent = (symC === 2 || symC === 5);
            } else if (r >= 6 && r <= 7) {
              filled = symC <= 5;
              isAccent = r === 7;
              isSteel = includeSteel && r === 6 && (symC === 1 || symC === 2);
            }
            break;

          case 4: // Heroic Shield
            if (r === 2) {
              filled = symC >= 1 && symC <= 5;
              isSteel = includeSteel && (symC === 1 || symC === 2);
            } else if (r >= 3 && r <= 5) {
              filled = symC <= 6;
              isCore = symC <= 1;
              isAccent = symC >= 4;
            } else if (r >= 6 && r <= 8) {
              const maxC = Math.max(0, 5 - (r - 5) * 2);
              filled = symC <= maxC;
              isAccent = symC === maxC;
            }
            break;

          case 5: // Archway / Stargate
            const isArch = (r === 2 && symC <= 5) || ((symC === 4 || symC === 5) && r >= 2 && r <= 8);
            const isInner = (r >= 3 && r <= 6 && symC <= 2);
            if (isArch) {
              filled = true;
              isSteel = includeSteel && r === 2 && (symC === 1 || symC === 2);
              isAccent = true;
            } else if (isInner) {
              filled = (r + symC) % 2 === 0;
              isCore = (r === 4 || r === 5);
            }
            break;

          case 6: // Ziggurat / Stepped Pyramid
            const maxP = Math.max(0, 6 - (r - 2));
            if (r >= 2 && r <= 8 && symC <= maxP) {
              filled = true;
              isCore = r <= 3 && symC <= 1;
              isAccent = symC === maxP || (r + symC) % 2 === 0;
            }
            break;

          case 7: // Honeycomb / Hexagon
            const distH = Math.max(Math.abs(r - 5), symC, Math.floor((Math.abs(r - 5) + symC) / 2));
            if (distH <= 4 && r >= 2 && r <= 8 && symC <= 6) {
              if ((r + symC) % 2 === 0) {
                filled = true;
                isCore = distH <= 1;
                isAccent = distH === 3;
                isSteel = includeSteel && (r === 4 || r === 5) && symC === 5;
              }
            }
            break;
        }

        if (filled) {
          let cellType = pal.primary;
          if (isSteel) cellType = 9;
          else if (isCore) cellType = pal.core;
          else if (isAccent) cellType = pal.accent;

          const cLeft = 8 - symC;
          const cRight = 9 + symC;
          grid[r][cLeft] = cellType;
          grid[r][cRight] = cellType;
        }
      }
    }

    return grid;
  }

  // Active Game State
  let currentLevelNumber = 1;
  let isRandomMode = false;
  let state = 'READY'; // READY, RUNNING, PAUSED, GAME_OVER, VICTORY
  let score = 0;
  let lives = 3;
  let isDebugSession = false;
  let pauseClicks = 0;
  let pauseClickTimer = null;

  // Slower, comfortable ball speed
  const BASE_BALL_SPEED = 3.6;

  // Paddle
  const paddle = {
    baseWidth: 76,
    width: 76,
    height: 10,
    x: 162,
    y: 425,
    speed: 7,
    radius: 4,
    color: '#2E66FF'
  };

  // Multi-Ball System
  let balls = [];

  function createBall(x, y, dx, dy) {
    return {
      x: x,
      y: y,
      radius: 5,
      speed: BASE_BALL_SPEED,
      dx: dx,
      dy: dy,
      color: '#F4F5F8'
    };
  }

  // Power-Ups System
  let powerups = [];
  let particles = [];
  let bricks = [];

  // Buff Timers
  let buffWidenTimer = 0;
  let buffMultiplierTimer = 0;
  let buffBarrierTimer = 0;

  // Power-Up Type Rarity & Specs
  // ~22% total drop chance: MULTIBALL (8%), WIDEN (6%), X3 (6%), BARRIER (2%)
  function trySpawnPowerup(x, y) {
    const roll = Math.random();
    if (roll > 0.22) return; // 78% no drop

    let type = 'MULTIBALL';
    let label = '+3';
    let color = '#22C55E';

    if (roll < 0.03) { // 3% Floor Barrier (rare!)
      type = 'BARRIER';
      label = 'ПОЛ';
      color = '#FF4D36';
    } else if (roll < 0.09) { // 6% Multiply all balls by 3!
      type = 'MULTIPLIER';
      label = '×3';
      color = '#FFD700';
    } else if (roll < 0.16) { // 7% Widen
      type = 'WIDEN';
      label = 'РАСШ';
      color = '#2E66FF';
    } else { // 6% Multiball (+3)
      type = 'MULTIBALL';
      label = '+3';
      color = '#22C55E';
    }

    powerups.push({
      x: x,
      y: y,
      width: 28,
      height: 14,
      dy: 1.8,
      type: type,
      label: label,
      color: color
    });
  }

  function activatePowerup(type) {
    playSound('powerup');
    if (type === 'MULTIBALL') {
      // Spawn 2 extra balls from the first existing ball
      if (balls.length > 0) {
        const ref = balls[0];
        balls.push(createBall(ref.x, ref.y, ref.dx * 0.85 + 1.2, -Math.abs(ref.dy)));
        balls.push(createBall(ref.x, ref.y, ref.dx * 0.85 - 1.2, -Math.abs(ref.dy)));
      }
    } else if (type === 'WIDEN') {
      buffWidenTimer = 18 * 60; // 18 seconds at 60fps
      paddle.width = 114;
      badgeWiden.classList.remove('hidden');
    } else if (type === 'MULTIPLIER') {
      // Multiply current ball count by 3 (capped at 36 for 60fps physics stability)
      const current = [...balls];
      const maxBalls = 36;
      current.forEach(b => {
        if (balls.length < maxBalls) {
          const speed = Math.hypot(b.dx, b.dy) || BASE_BALL_SPEED;
          const a1 = Math.atan2(b.dy, b.dx) + 0.38;
          const a2 = Math.atan2(b.dy, b.dx) - 0.38;
          balls.push(createBall(b.x, b.y, Math.cos(a1) * speed, Math.sin(a1) * speed));
          if (balls.length < maxBalls) {
            balls.push(createBall(b.x, b.y, Math.cos(a2) * speed, Math.sin(a2) * speed));
          }
        }
      });
      score += 25;
      scoreDisplay.textContent = String(score).padStart(3, '0');
      animateScoreBump();
    } else if (type === 'BARRIER') {
      buffBarrierTimer = 12 * 60; // 12 seconds
      badgeBarrier.classList.remove('hidden');
    }
  }

  function spawnParticles(x, y, color) {
    const count = 7;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const spd = Math.random() * 2.2 + 1.0;
      particles.push({
        x: x,
        y: y,
        dx: Math.cos(angle) * spd,
        dy: Math.sin(angle) * spd,
        life: 14,
        maxLife: 14,
        size: Math.random() * 2.2 + 1.2,
        color: color
      });
    }
  }

  function updateLivesDisplay() {
    const pips = livesDisplay.querySelectorAll('.life-pip');
    pips.forEach((pip, index) => {
      pip.classList.toggle('active', index < lives);
    });
  }

  function markDebugUsed() {
    if (!isDebugSession) {
      isDebugSession = true;
      debugBadge.classList.remove('hidden');
    }
  }

  function loadBricksForLevel() {
    const gridData = isRandomMode ? generateRandomLevelData() : generateLevelData(currentLevelNumber);
    bricks = [];

    for (let r = 0; r < brickRows; r++) {
      bricks[r] = [];
      for (let c = 0; c < brickCols; c++) {
        const typeId = gridData[r][c];
        if (typeId > 0 && BRICK_TYPES[typeId]) {
          const cfg = BRICK_TYPES[typeId];
          const bx = brickOffsetLeft + c * (brickWidth + brickGap);
          const by = brickOffsetTop + r * (brickHeight + brickGap);
          bricks[r][c] = {
            x: bx,
            y: by,
            hp: cfg.maxHp,
            maxHp: cfg.maxHp,
            unbreakable: Boolean(cfg.unbreakable),
            points: cfg.points,
            fill: cfg.fill,
            border: cfg.border
          };
        } else {
          bricks[r][c] = { hp: 0 };
        }
      }
    }
  }

  function resetLevel(keepScore = false) {
    if (!keepScore) score = 0;
    lives = 3;
    scoreDisplay.textContent = String(score).padStart(3, '0');
    updateLivesDisplay();

    // Reset buffs
    buffWidenTimer = 0;
    buffMultiplierTimer = 0;
    buffBarrierTimer = 0;
    paddle.width = paddle.baseWidth;
    multiplierBadge.classList.add('hidden');
    badgeBarrier.classList.add('hidden');
    badgeWiden.classList.add('hidden');
    badgeMult.classList.add('hidden');

    powerups = [];
    particles = [];

    loadBricksForLevel();
    resetBallOnPaddle();

    state = 'READY';
    hideOverlay();
    btnPause.textContent = 'Пауза';

    levelIndicator.textContent = isRandomMode ? 'РАНДОМ' : `УРОВЕНЬ ${currentLevelNumber} / ${TOTAL_LEVELS}`;
  }

  function resetBallOnPaddle() {
    paddle.x = (canvas.width - paddle.width) / 2;
    balls = [];
    const angle = (Math.random() * 0.4 + 0.3) * Math.PI; // Upwards
    const dx = Math.cos(angle) * BASE_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    const dy = -Math.abs(Math.sin(angle) * BASE_BALL_SPEED);
    balls.push(createBall(paddle.x + paddle.width / 2, paddle.y - 6, dx, dy));
  }

  function startGame() {
    if (state === 'READY' || state === 'PAUSED') {
      state = 'RUNNING';
      hideOverlay();
      btnPause.textContent = 'Пауза';
    } else if (state === 'GAME_OVER') {
      resetLevel(false);
      state = 'RUNNING';
      hideOverlay();
      btnPause.textContent = 'Пауза';
    } else if (state === 'VICTORY') {
      if (!isRandomMode && currentLevelNumber < TOTAL_LEVELS) {
        currentLevelNumber++;
        resetLevel(true);
        state = 'RUNNING';
        hideOverlay();
        btnPause.textContent = 'Пауза';
      } else {
        resetLevel(false);
        state = 'RUNNING';
        hideOverlay();
        btnPause.textContent = 'Пауза';
      }
    }
  }

  function pauseGame() {
    if (state === 'RUNNING') {
      state = 'PAUSED';
      showOverlay('Пауза', 'Игра приостановлена. Нажмите Пробел или кнопку ниже.', 'Продолжить', false);
      btnPause.textContent = 'Дальше';
    }
  }

  function resumeGame() {
    if (state === 'PAUSED') {
      state = 'RUNNING';
      hideOverlay();
      btnPause.textContent = 'Пауза';
    }
  }

  function togglePause() {
    if (state === 'RUNNING') pauseGame();
    else if (state === 'PAUSED') resumeGame();
    else if (state === 'READY') startGame();
  }

  function triggerLifeLost() {
    lives--;
    updateLivesDisplay();
    playSound('lose_life');

    screenBox.classList.remove('shake');
    void screenBox.offsetWidth;
    screenBox.classList.add('shake');
    setTimeout(() => screenBox.classList.remove('shake'), 200);

    if (lives <= 0) {
      triggerGameOver();
    } else {
      state = 'READY';
      resetBallOnPaddle();
      hideOverlay();
      btnPause.textContent = 'Пауза';
    }
  }

  function triggerGameOver() {
    state = 'GAME_OVER';
    showOverlay('Игра окончена', 'Вы исчерпали все жизни на этом уровне.', 'Сыграть снова', false, true);
    btnPause.textContent = 'Пауза';
  }

  function triggerVictory() {
    state = 'VICTORY';
    playSound('win');

    if (!isRandomMode) {
      completedLevels.add(currentLevelNumber);
      if (currentLevelNumber >= unlockedLevel && unlockedLevel < TOTAL_LEVELS) {
        unlockedLevel = currentLevelNumber + 1;
      }
      saveProgress();
      renderLevelsGrid();
    }

    const hasNext = !isRandomMode && currentLevelNumber < TOTAL_LEVELS;
    showOverlay(
      'Победа!',
      hasNext 
        ? `Уровень ${currentLevelNumber} успешно пройден! Готовы перейти к следующему?`
        : 'Поздравляем! Все кирпичи разбиты!',
      hasNext ? 'Следующий уровень' : 'Сыграть заново',
      hasNext,
      true
    );
    btnPause.textContent = 'Пауза';
  }

  function showOverlay(heading, desc, btnText, showNext = false, showLevels = false) {
    overlayHeading.textContent = heading;
    overlayDesc.textContent = desc;
    overlayBtn.textContent = btnText;
    overlayNextBtn.classList.toggle('hidden', !showNext);
    overlayLevelsBtn.classList.toggle('hidden', !showLevels);
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function animateScoreBump() {
    scoreDisplay.classList.remove('score-bump');
    void scoreDisplay.offsetWidth;
    scoreDisplay.classList.add('score-bump');
    setTimeout(() => scoreDisplay.classList.remove('score-bump'), 120);
  }

  function checkRemainingBricks() {
    if (!bricks || bricks.length === 0) return false;
    for (let r = 0; r < brickRows; r++) {
      if (!bricks[r]) continue;
      for (let c = 0; c < brickCols; c++) {
        const brk = bricks[r][c];
        if (brk && brk.hp > 0 && !brk.unbreakable) return false;
      }
    }
    return true;
  }

  // Update Game Logic
  function update() {
    if (state === 'READY') {
      if (balls.length > 0) {
        balls[0].x = paddle.x + paddle.width / 2;
        balls[0].y = paddle.y - balls[0].radius - 1;
      }
      return;
    }

    if (state !== 'RUNNING') return;

    // Buff Timers Update
    if (buffWidenTimer > 0) {
      buffWidenTimer--;
      timerWiden.textContent = Math.ceil(buffWidenTimer / 60) + 's';
      if (buffWidenTimer <= 0) {
        paddle.width = paddle.baseWidth;
        badgeWiden.classList.add('hidden');
      }
    }

    if (buffMultiplierTimer > 0) {
      buffMultiplierTimer--;
      timerMult.textContent = Math.ceil(buffMultiplierTimer / 60) + 's';
      if (buffMultiplierTimer <= 0) {
        multiplierBadge.classList.add('hidden');
        badgeMult.classList.add('hidden');
      }
    }

    if (buffBarrierTimer > 0) {
      buffBarrierTimer--;
      timerBarrier.textContent = Math.ceil(buffBarrierTimer / 60) + 's';
      if (buffBarrierTimer <= 0) {
        badgeBarrier.classList.add('hidden');
      }
    }

    // Move Powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.y += p.dy;

      // Check collision with paddle
      if (
        p.y + p.height >= paddle.y &&
        p.y <= paddle.y + paddle.height &&
        p.x + p.width >= paddle.x &&
        p.x <= paddle.x + paddle.width
      ) {
        activatePowerup(p.type);
        powerups.splice(i, 1);
        continue;
      }

      // Check out of bounds bottom
      if (p.y > canvas.height) {
        powerups.splice(i, 1);
      }
    }

    // Move and collide balls
    for (let bi = balls.length - 1; bi >= 0; bi--) {
      const b = balls[bi];
      b.x += b.dx;
      b.y += b.dy;

      // Left & Right walls
      if (b.x - b.radius <= 0) {
        b.x = b.radius;
        b.dx = Math.abs(b.dx);
        playSound('wall');
      } else if (b.x + b.radius >= canvas.width) {
        b.x = canvas.width - b.radius;
        b.dx = -Math.abs(b.dx);
        playSound('wall');
      }

      // Top wall
      if (b.y - b.radius <= 0) {
        b.y = b.radius;
        b.dy = Math.abs(b.dy);
        playSound('wall');
      }

      // Bottom barrier bounce
      if (buffBarrierTimer > 0 && b.y + b.radius >= canvas.height - 4 && b.dy > 0) {
        b.y = canvas.height - 4 - b.radius;
        b.dy = -Math.abs(b.dy);
        playSound('paddle');
      }

      // Paddle collision
      if (
        b.y + b.radius >= paddle.y &&
        b.y - b.radius <= paddle.y + paddle.height &&
        b.x >= paddle.x - b.radius &&
        b.x <= paddle.x + paddle.width + b.radius &&
        b.dy > 0
      ) {
        const hitOffset = (b.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        const clampedOffset = Math.max(-0.92, Math.min(0.92, hitOffset));

        const totalSpeed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        const maxBounceAngle = (70 * Math.PI) / 180;
        const bounceAngle = clampedOffset * maxBounceAngle;

        b.dx = totalSpeed * Math.sin(bounceAngle);
        b.dy = -totalSpeed * Math.cos(bounceAngle);
        b.y = paddle.y - b.radius - 1;

        playSound('paddle');
      }

      // Out of bounds bottom
      if (b.y - b.radius > canvas.height) {
        balls.splice(bi, 1);
        continue;
      }

      // Brick collision
      let hitBrick = false;
      if (bricks && bricks.length > 0) {
        for (let r = 0; r < brickRows; r++) {
          if (!bricks[r]) continue;
          for (let c = 0; c < brickCols; c++) {
            const brk = bricks[r][c];
            if (brk && brk.hp > 0) {
              if (
                b.x + b.radius > brk.x &&
                b.x - b.radius < brk.x + brickWidth &&
                b.y + b.radius > brk.y &&
                b.y - b.radius < brk.y + brickHeight
              ) {
                const overlapLeft = (b.x + b.radius) - brk.x;
                const overlapRight = (brk.x + brickWidth) - (b.x - b.radius);
                const overlapTop = (b.y + b.radius) - brk.y;
                const overlapBottom = (brk.y + brickHeight) - (b.y - b.radius);

                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);

                if (minOverlapX < minOverlapY) {
                  b.dx = -b.dx;
                } else {
                  b.dy = -b.dy;
                }

                if (brk.unbreakable) {
                  playSound('wall');
                  spawnParticles(b.x, b.y, '#94A3B8');
                  hitBrick = true;
                  break;
                }

                brk.hp--;
                spawnParticles(b.x, b.y, brk.fill);

                const multiplier = buffMultiplierTimer > 0 ? 3 : 1;
                if (brk.hp <= 0) {
                  score += brk.points * multiplier;
                  playSound('break');
                  trySpawnPowerup(brk.x + brickWidth / 2 - 14, brk.y);
                } else {
                  score += 5 * multiplier;
                  playSound('hit');
                }

                scoreDisplay.textContent = String(score).padStart(3, '0');
                animateScoreBump();

                if (!isDebugSession && score > bestScore) {
                  bestScore = score;
                  localStorage.setItem('refyrd_arkanoid_best', bestScore.toString());
                  bestDisplay.textContent = String(bestScore).padStart(3, '0');
                }

                hitBrick = true;
                break;
              }
            }
          }
          if (hitBrick) break;
        }
      }
    }

    // Check if all balls lost
    if (balls.length === 0) {
      triggerLifeLost();
      return;
    }

    // Check victory
    if (checkRemainingBricks()) {
      triggerVictory();
      return;
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // Render Game Scene
  function render() {
    ctx.fillStyle = '#0A0B0E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bottom barrier (if buff active)
    if (buffBarrierTimer > 0) {
      ctx.fillStyle = '#FF4D36';
      ctx.fillRect(0, canvas.height - 4, canvas.width, 4);
      ctx.shadowColor = '#FF4D36';
      ctx.shadowBlur = 8;
      ctx.fillRect(0, canvas.height - 3, canvas.width, 2);
      ctx.shadowBlur = 0;
    }

    // Render Bricks
    if (bricks && bricks.length > 0) {
      for (let r = 0; r < brickRows; r++) {
        if (!bricks[r]) continue;
        for (let c = 0; c < brickCols; c++) {
          const b = bricks[r][c];
          if (b && b.hp > 0) {
            if (b.unbreakable) {
              ctx.fillStyle = '#475569';
              drawRoundedRect(ctx, b.x, b.y, brickWidth, brickHeight, 2);
              ctx.fill();

              ctx.strokeStyle = '#94A3B8';
              ctx.lineWidth = 1;
              ctx.stroke();

              // Metal center rivet
              ctx.fillStyle = '#CBD5E1';
              ctx.fillRect(b.x + brickWidth / 2 - 1.5, b.y + brickHeight / 2 - 1.5, 3, 3);
            } else {
              ctx.fillStyle = b.fill;
              if (b.hp < b.maxHp) {
                ctx.globalAlpha = 0.55; // Damaged state
              } else {
                ctx.globalAlpha = 1.0;
              }

              drawRoundedRect(ctx, b.x, b.y, brickWidth, brickHeight, 3);
              ctx.fill();

              ctx.strokeStyle = b.border;
              ctx.lineWidth = 1;
              ctx.stroke();

              ctx.globalAlpha = 1.0;
            }
          }
        }
      }
    }

    // Render Powerups
    powerups.forEach(p => {
      ctx.fillStyle = p.color;
      drawRoundedRect(ctx, p.x, p.y, p.width, p.height, 4);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, p.x + p.width / 2, p.y + p.height / 2);
    });

    // Render Particles
    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Render Paddle
    ctx.fillStyle = paddle.color;
    drawRoundedRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, paddle.radius);
    ctx.fill();

    // Center indicator on paddle
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(paddle.x + paddle.width / 2 - 4, paddle.y + 2, 8, 2);

    // Render All Balls
    balls.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Specular shine
      ctx.fillStyle = '#FFE5B4';
      ctx.beginPath();
      ctx.arc(b.x - 1.5, b.y - 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ready launch hint
    if (state === 'READY') {
      ctx.fillStyle = 'rgba(244, 245, 248, 0.75)';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Нажмите Пробел или коснитесь экрана для запуска', canvas.width / 2, 290);
    }
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
  }

  // =========================================
  // LEVEL SELECT MENU LOGIC
  // =========================================
  function renderLevelsGrid() {
    levelsGrid.innerHTML = '';
    progressText.textContent = `Пройдено: ${completedLevels.size} / ${TOTAL_LEVELS}`;
    starsText.textContent = `Рекорд: ${bestScore}`;
    if (playCampaignText) {
      playCampaignText.textContent = `▶ Начать игру (Уровень ${unlockedLevel})`;
    }

    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-btn';
      btn.textContent = i;
      btn.setAttribute('aria-label', `Уровень ${i}`);

      const isCompleted = completedLevels.has(i);
      const isUnlocked = i <= unlockedLevel;

      if (isCompleted) {
        btn.classList.add('completed');
      } else if (i === unlockedLevel) {
        btn.classList.add('current');
      }

      if (!isUnlocked) {
        btn.disabled = true;
      }

      btn.addEventListener('click', () => {
        initAudio();
        playSound('click');
        openLevel(i);
      });

      levelsGrid.appendChild(btn);
    }
  }

  function openLevel(levelNum) {
    currentLevelNumber = levelNum;
    isRandomMode = false;
    switchToGameView();
    resetLevel(false);
  }

  function startRandomLevel() {
    isRandomMode = true;
    switchToGameView();
    resetLevel(false);
  }

  function switchToGameView() {
    levelSelectView.classList.add('hidden');
    gameView.classList.remove('hidden');
    linkToHub.classList.add('hidden');
    btnToLevels.classList.remove('hidden');
  }

  function switchToLevelSelect() {
    gameView.classList.add('hidden');
    levelSelectView.classList.remove('hidden');
    btnToLevels.classList.add('hidden');
    linkToHub.classList.remove('hidden');
    renderLevelsGrid();
    state = 'PAUSED';
  }

  btnToLevels.addEventListener('click', () => {
    initAudio();
    playSound('click');
    switchToLevelSelect();
  });

  overlayLevelsBtn.addEventListener('click', () => {
    initAudio();
    playSound('click');
    switchToLevelSelect();
  });

  overlayNextBtn.addEventListener('click', () => {
    initAudio();
    playSound('click');
    if (currentLevelNumber < TOTAL_LEVELS) {
      currentLevelNumber++;
      resetLevel(true);
      startGame();
    }
  });

  tabCampaign.addEventListener('click', () => {
    tabCampaign.classList.add('active');
    tabRandom.classList.remove('active');
    campaignPanel.classList.remove('hidden');
    randomPanel.classList.add('hidden');
    modeDesc.textContent = 'Выберите уровень для прохождения. Прогресс сохраняется автоматически на вашем устройстве.';
  });

  tabRandom.addEventListener('click', () => {
    tabRandom.classList.add('active');
    tabCampaign.classList.remove('active');
    campaignPanel.classList.add('hidden');
    randomPanel.classList.remove('hidden');
    modeDesc.textContent = 'Бесконечный режим с уникальными симметричными генерациями поля.';
  });

  btnStartRandom.addEventListener('click', () => {
    initAudio();
    playSound('click');
    startRandomLevel();
  });

  if (btnPlayCampaign) {
    btnPlayCampaign.addEventListener('click', () => {
      initAudio();
      playSound('click');
      openLevel(unlockedLevel || 1);
    });
  }

  // Input Handling: Pointer / Touch / Mouse on Canvas
  function updatePaddlePosition(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const canvasX = (clientX - rect.left) * scaleX;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, canvasX - paddle.width / 2));
  }

  screenBox.addEventListener('pointerdown', (e) => {
    initAudio();
    updatePaddlePosition(e.clientX);
    if (state === 'READY') {
      startGame();
    }
  });

  window.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.clientX >= rect.left - 40 && e.clientX <= rect.right + 40) {
      updatePaddlePosition(e.clientX);
    }
  });

  // Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A' || key === 'Ф' || key === 'ф') {
      e.preventDefault();
      paddle.x = Math.max(0, paddle.x - paddle.speed * 3.5);
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D' || key === 'В' || key === 'в') {
      e.preventDefault();
      paddle.x = Math.min(canvas.width - paddle.width, paddle.x + paddle.speed * 3.5);
    } else if (key === ' ' || key === 'Spacebar') {
      e.preventDefault();
      initAudio();
      if (state === 'READY') startGame();
      else togglePause();
    } else if (key === 'r' || key === 'R' || key === 'К' || key === 'к') {
      e.preventDefault();
      initAudio();
      resetLevel(false);
      startGame();
    }
  });

  // 10 Clicks on Pause to trigger Debug Menu
  btnPause.addEventListener('click', () => {
    initAudio();
    playSound('click');

    pauseClicks++;
    clearTimeout(pauseClickTimer);
    pauseClickTimer = setTimeout(() => {
      pauseClicks = 0;
    }, 2500);

    if (pauseClicks >= 10) {
      pauseClicks = 0;
      pauseGame();
      debugModal.classList.remove('hidden');
      return;
    }

    togglePause();
  });

  // Debug Actions
  dbgClose.addEventListener('click', () => {
    debugModal.classList.add('hidden');
  });

  dbgUnlockAll.addEventListener('click', () => {
    markDebugUsed();
    unlockedLevel = TOTAL_LEVELS;
    for (let i = 1; i <= TOTAL_LEVELS; i++) completedLevels.add(i);
    saveProgress();
    renderLevelsGrid();
    playSound('win');
  });

  dbgDropMultiball.addEventListener('click', () => {
    markDebugUsed();
    activatePowerup('MULTIBALL');
  });

  dbgDropBarrier.addEventListener('click', () => {
    markDebugUsed();
    activatePowerup('BARRIER');
  });

  dbgDropWiden.addEventListener('click', () => {
    markDebugUsed();
    activatePowerup('WIDEN');
  });

  dbgDropX3.addEventListener('click', () => {
    markDebugUsed();
    activatePowerup('MULTIPLIER');
  });

  dbgClearBricks.addEventListener('click', () => {
    markDebugUsed();
    let kept = 0;
    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        if (kept < 2 && bricks[r][c].hp > 0) {
          bricks[r][c].hp = 1;
          kept++;
        } else {
          bricks[r][c].hp = 0;
        }
      }
    }
    playSound('break');
  });

  dbgWin.addEventListener('click', () => {
    markDebugUsed();
    triggerVictory();
  });

  // Draggable Debug Window Controller
  let isDraggingDebug = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  debugHandle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#dbg-close')) return;
    isDraggingDebug = true;
    try { debugHandle.setPointerCapture(e.pointerId); } catch (err) {}
    const rect = debugModal.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
  });

  debugHandle.addEventListener('pointermove', (e) => {
    if (!isDraggingDebug) return;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const modalWidth = debugModal.offsetWidth;
    const modalHeight = debugModal.offsetHeight;

    const newX = Math.max(8, Math.min(winWidth - modalWidth - 8, e.clientX - dragOffsetX));
    const newY = Math.max(8, Math.min(winHeight - modalHeight - 8, e.clientY - dragOffsetY));

    debugModal.style.left = `${newX}px`;
    debugModal.style.top = `${newY}px`;
    debugModal.style.transform = 'none';
  });

  function stopDragDebug(e) {
    if (isDraggingDebug) {
      isDraggingDebug = false;
      try { debugHandle.releasePointerCapture(e.pointerId); } catch (err) {}
    }
  }

  debugHandle.addEventListener('pointerup', stopDragDebug);
  debugHandle.addEventListener('pointercancel', stopDragDebug);

  // Overlay Action Button
  overlayBtn.addEventListener('click', () => {
    initAudio();
    playSound('click');
    if (state === 'READY' || state === 'PAUSED') {
      startGame();
    } else if (state === 'GAME_OVER') {
      resetLevel(false);
      startGame();
    } else if (state === 'VICTORY') {
      if (!isRandomMode && currentLevelNumber < TOTAL_LEVELS) {
        currentLevelNumber++;
        resetLevel(true);
        startGame();
      } else {
        resetLevel(false);
        startGame();
      }
    }
  });

  btnRestart.addEventListener('click', () => {
    initAudio();
    playSound('click');
    resetLevel(false);
    startGame();
  });

  // Init Menu View & Game Loop
  renderLevelsGrid();
  loadBricksForLevel();
  resetBallOnPaddle();
  requestAnimationFrame(gameLoop);
})();
