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

  // Logical Game Dimensions & High-DPI Retina Scaler
  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 460;

  function resizeCanvas() {
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || GAME_WIDTH;
    const h = rect.height || GAME_HEIGHT;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
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
    soundStatus.textContent = isSoundOn ? 'on' : 'off';
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

  // Dense Square Brick Layout Dimensions (24 cols x 18 rows)
  const brickRows = 18;
  const brickCols = 24;
  const brickWidth = 14;
  const brickHeight = 12;
  const brickGap = 2;
  const brickOffsetTop = 28;
  const brickOffsetLeft = 9; // (400 - (24 * 16 - 2)) / 2 = 9px centered

  // Brick Color & Type Definitions (Apple System Palette)
  const BRICK_TYPES = {
    1: { fill: '#34C759', border: '#30B753', maxHp: 1, points: 10 }, // 1-hit Apple Green
    2: { fill: '#FF9500', border: '#E08500', maxHp: 2, points: 25 }, // 2-hit Apple Orange
    3: { fill: '#FF3B30', border: '#E03228', maxHp: 3, points: 50 }, // 3-hit Apple Red
    4: { fill: '#007AFF', border: '#0066CC', maxHp: 1, points: 15 }, // 1-hit Apple Blue
    5: { fill: '#FFCC00', border: '#E0B400', maxHp: 1, points: 15 }, // 1-hit Apple Yellow
    6: { fill: '#AF52DE', border: '#9B45C6', maxHp: 2, points: 35 }, // 2-hit Apple Purple
    9: { fill: '#3A3A3C', border: '#48484A', maxHp: Infinity, unbreakable: true, points: 0 } // Unbreakable Dark Steel
  };

  // 60 Handcrafted / Algorithmic Levels (24 cols x 18 rows)
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
        const symC = c < 12 ? c : 23 - c; // Horizontal symmetry (0..11)
        let val = 0;

        switch (arch) {
          case 0: // The Grand Gate
            if ((symC === 2 || symC === 3 || symC === 4 || symC === 10 || symC === 11) && r <= 14) {
              val = r <= 3 ? tArmored : tEasy;
            } else if (r <= 3 && symC <= 11) {
              val = tMid;
            }
            break;

          case 1: // Butterfly Wings
            if ((symC + r) % 3 === 0 && r <= 15 && symC <= 11) {
              val = r < 6 ? tHard : tMid;
            } else if ((symC === 0 || symC === 1) && r >= 3 && r <= 12) {
              val = tArmored;
            }
            break;

          case 2: // Space Invader
            if (
              (r === 1 && (symC === 3 || symC === 4)) ||
              (r === 2 && symC >= 2 && symC <= 6) ||
              (r === 3 && symC !== 4 && symC !== 5 && symC <= 8) ||
              (r >= 4 && r <= 8 && symC <= 8) ||
              (r === 9 && (symC === 2 || symC === 5)) ||
              (r === 10 && (symC === 1 || symC === 6))
            ) {
              val = (r === 4 || r === 8) ? tArmored : tMid;
            }
            break;

          case 3: // Pixel Heart
            if (
              (r >= 1 && r <= 2 && symC >= 2 && symC <= 8) ||
              (r === 3 && symC >= 1 && symC <= 10) ||
              (r >= 4 && r <= 13 && symC <= Math.max(0, 11 - (r - 3)))
            ) {
              val = r <= 5 ? 3 : (r <= 9 ? 2 : 1);
            }
            break;

          case 4: // Pixel Skull
            if (r <= 12 && symC <= 9) {
              if (r >= 5 && r <= 7 && (symC === 3 || symC === 4)) {
                val = 0; // Eye socket
              } else if (r === 12 && (symC === 1 || symC === 4 || symC === 7)) {
                val = 0; // Teeth gap
              } else {
                val = r <= 4 ? tHard : tEasy;
              }
            }
            break;

          case 5: // Diamond Rings
            const distD = Math.abs(r - 7) + Math.abs(symC - 6);
            if (distD === 2 || distD === 4 || distD === 6 || distD === 8) {
              val = distD === 2 ? tArmored : (distD === 4 ? tHard : tMid);
            }
            break;

          case 6: // Fortress with Bottleneck
            if (hasSteel && (r === 4 || symC === 10) && !(r === 4 && (symC === 0 || symC === 1))) {
              val = 9; // Steel outer perimeter with 2-block bottleneck
            } else if (r > 4 && r < 13 && symC < 10) {
              val = r < 8 ? tArmored : tEasy;
            } else if (r < 4 && symC <= 10) {
              val = tMid;
            }
            break;

          case 7: // Hourglass Pillars
            if ((symC === 0 || symC === 1 || symC === 10 || symC === 11) && r <= 14) {
              val = (hasSteel && r >= 5 && r <= 9) ? 9 : tHard;
            } else if (Math.abs(r - 7) >= Math.floor(symC / 2) && r <= 13) {
              val = (r <= 3 || r >= 11) ? tMid : tEasy;
            }
            break;

          case 8: // Checkerboard Maze
            if ((r + symC) % 2 === 0 && r <= 14 && symC <= 11) {
              val = (hasSteel && (r === 6 || r === 7) && (symC === 3 || symC === 6)) ? 9 : tEasy;
            }
            break;

          case 9: // Vault Bunker
            if (hasSteel) {
              const isVault = (r === 5 || r === 13 || symC === 10) && !(r === 13 && (symC === 0 || symC === 1));
              if (isVault) {
                val = 9;
              } else if (r > 5 && r < 13 && symC < 10) {
                val = 3; // Treasure
              } else if (r < 5 && symC <= 11) {
                val = tMid;
              }
            } else {
              if (r <= 12 && symC <= 11) {
                val = r < 5 ? tMid : tEasy;
              }
            }
            break;

          case 10: // Shield and Blade
            if ((symC === 0 || symC === 1) && r <= 15) {
              val = tArmored;
            } else if (symC <= 9 && r >= 3 && r <= 11 && (symC + r) <= 14) {
              val = symC <= 4 ? tHard : tEasy;
            }
            break;

          case 11: // Twin Steel Bunkers
            if (hasSteel && r === 3 && symC >= 3 && symC <= 9) {
              val = 9;
            } else if (r >= 4 && r <= 9 && symC >= 3 && symC <= 8) {
              val = r === 4 ? tArmored : tEasy;
            } else if (r >= 11 && r <= 14 && symC <= 10) {
              val = tMid;
            }
            break;

          case 12: // Spiral Concentric Coils
            const ring = Math.min(r, 17 - r, symC, 11 - symC);
            if (ring % 2 === 0 && r <= 15) {
              val = (hasSteel && ring === 2 && r > 4) ? 9 : tMid;
            } else if (ring === 1) {
              val = tEasy;
            }
            break;

          case 13: // Sun Mandala
            const distM = Math.abs(r - 8) + symC;
            if ((distM === 4 || distM === 6 || distM === 8 || distM === 10) && r <= 15) {
              val = distM === 4 ? tArmored : tEasy;
            }
            break;

          case 14: // Obsidian Citadel (Boss Fortress)
            if (hasSteel) {
              const outer = (r === 2 || r === 14 || symC === 11) && !(r === 14 && (symC === 4 || symC === 5));
              const inner = (r === 5 || r === 10 || symC === 5) && !(r === 5 && (symC === 0 || symC === 1));
              if (outer || inner) {
                val = 9;
              } else if (r > 5 && r < 10 && symC < 5) {
                val = 3;
              } else {
                val = tHard;
              }
            } else {
              if (r <= 13 && symC <= 10) val = tMid;
            }
            break;
        }

        grid[r][c] = val;
      }
    }

    return grid;
  }

  // Random Mode Pattern Generator (24 cols x 18 rows, 40 distinct architectural archetypes, corridors, vaults, chutes & full-width coverage)
  function generateRandomLevelData() {
    const grid = [];
    for (let r = 0; r < brickRows; r++) grid[r] = new Array(brickCols).fill(0);

    const archetype = Math.floor(Math.random() * 40);
    const theme = Math.floor(Math.random() * 12);
    const modifier = Math.floor(Math.random() * 3); // 0: Solid, 1: Lattice, 2: Windowed

    // 12 Curated Apple System Color Palettes
    const palettes = [
      { primary: 1, accent: 2, core: 3 }, // 0: Emerald & Gold
      { primary: 4, accent: 2, core: 6 }, // 1: Cobalt & Amber
      { primary: 5, accent: 6, core: 3 }, // 2: Lemon & Purple
      { primary: 4, accent: 1, core: 2 }, // 3: Cyber Neon
      { primary: 5, accent: 2, core: 3 }, // 4: Sunset Crimson & Gold
      { primary: 6, accent: 1, core: 3 }, // 5: Amethyst Royal
      { primary: 4, accent: 5, core: 1 }, // 6: Ice Crystal
      { primary: 1, accent: 5, core: 2 }, // 7: Toxic Glow
      { primary: 2, accent: 5, core: 3 }, // 8: Lava Forge
      { primary: 4, accent: 6, core: 1 }, // 9: High Contrast Arcade
      { primary: 2, accent: 4, core: 5 }, // 10: Neon Synthwave
      { primary: 1, accent: 3, core: 6 }  // 11: Rainbow Spectrum
    ];
    const pal = palettes[theme];
    const includeSteel = (theme % 3 !== 0);

    function isAny(val, arr) {
      return arr.indexOf(val) !== -1;
    }

    for (let r = 1; r < 14; r++) {
      for (let c = 0; c < brickCols; c++) {
        const symC = c < 12 ? c : 23 - c; // 0 (outer wall, c=0,23) to 11 (center, c=11,12)
        let filled = false;
        let isCore = false;
        let isAccent = false;
        let isSteel = false;

        switch (archetype) {
          case 0: // The Great Bastion (Full-width wall with 2 side slits and central gate)
            if (r === 2 || r === 8) {
              if (symC !== 2 && symC !== 11) {
                filled = true;
                isSteel = includeSteel && (symC === 0 || symC === 1 || symC === 5 || symC === 6);
              }
            } else if (r >= 3 && r <= 7) {
              if (symC === 0 || symC === 1 || symC === 10) {
                filled = true;
                isSteel = includeSteel && (symC === 0);
              } else if (symC >= 3 && symC <= 8) {
                filled = true;
                isCore = (symC >= 4 && symC <= 7 && r >= 4 && r <= 6);
              }
            } else if (r >= 9 && r <= 11) {
              filled = (symC === 3 || symC === 4 || symC === 7 || symC === 8);
            }
            break;

          case 1: // Twin Fortress Vaults (Steel-roofed vaults at edges, central bottleneck)
            if (r === 2 && symC <= 8) {
              filled = true;
              isSteel = includeSteel && (symC >= 3 && symC <= 7);
            } else if (symC === 8 && r >= 2 && r <= 9) {
              filled = true;
              isSteel = includeSteel && (r !== 6);
            } else if (symC < 8 && r >= 3 && r <= 8) {
              filled = true;
              isCore = (r + symC) % 2 === 0;
            } else if (symC >= 9 && r >= 5 && r <= 11) {
              filled = (r + symC) % 2 === 0;
              isAccent = true;
            }
            break;

          case 2: // Pachinko Layered Sandwich (Alternating horizontal shelves forcing ricochets)
            if (r === 2 || r === 5 || r === 8 || r === 11) {
              if (r === 2 && symC < 9) {
                filled = true;
                isSteel = includeSteel && (symC === 3 || symC === 4);
              } else if (r === 5 && symC > 2) {
                filled = true;
                isSteel = includeSteel && (symC === 7 || symC === 8);
              } else if (r === 8 && symC !== 5 && symC !== 6) {
                filled = true;
              } else if (r === 11 && symC >= 2 && symC <= 9) {
                filled = true;
                isAccent = true;
              }
            } else if ((r >= 3 && r <= 10) && (symC === 0 || symC === 11)) {
              filled = true; // Side retaining pillars
            }
            break;

          case 3: // The Colosseum (Concentric elliptical rings with narrow entrances)
            const distEll = Math.pow(symC - 11, 2) / 100.0 + Math.pow(r - 6, 2) / 25.0;
            if (distEll >= 0.8 && distEll <= 1.2) {
              const isEntrance = (isAny(r, [2, 10]) && (symC === 10 || symC === 11)) || (symC === 0 && (r === 5 || r === 6));
              if (!isEntrance) {
                filled = true;
                isSteel = includeSteel && (r === 4 || r === 8) && symC <= 2;
              }
            } else if (distEll >= 0.3 && distEll <= 0.6) {
              filled = true;
              isCore = distEll <= 0.4;
              isAccent = distEll > 0.4;
            } else if (distEll < 0.2) {
              filled = true;
              isCore = true;
            }
            break;

          case 4: // Temple of Pillars (5 vertical corridors from top to bottom)
            if (isAny(symC, [0, 3, 6, 9]) && r >= 2 && r <= 12) {
              filled = true;
              isSteel = includeSteel && isAny(r, [2, 7, 12]) && (symC === 0 || symC === 6);
              isAccent = (r % 2 === 0);
            } else if (r === 2 && symC <= 11) {
              filled = true;
              isCore = (symC === 10 || symC === 11);
            } else if (isAny(r, [6, 10]) && isAny(symC, [1, 4, 7, 10])) {
              filled = true;
              isCore = true;
            }
            break;

          case 5: // Diagonal Zig-Zag Chutes (Funneling balls into high-speed ramps)
            const diag1 = Math.abs(symC - (r - 1)) <= 1 && r >= 2 && r <= 10;
            const diag2 = Math.abs(symC - (11 - (r - 1))) <= 1 && r >= 2 && r <= 10;
            if (diag1 || diag2) {
              filled = true;
              isSteel = includeSteel && isAny(r, [2, 10]) && (symC === 0 || symC === 1);
              isAccent = symC >= 8;
            } else if (r >= 4 && r <= 8 && symC <= 3) {
              filled = true;
              isCore = true;
            }
            break;

          case 6: // The Obsidian Vault (Central impenetrable steel safe with 1-block bottom opening)
            const isVaultBox = ((r === 3 || r === 9) && symC >= 4 && symC <= 11) || (symC === 4 && r >= 3 && r <= 9);
            const isVaultEntrance = (r === 9 && (symC === 10 || symC === 11));
            if (isVaultBox && !isVaultEntrance) {
              filled = true;
              isSteel = true;
            } else if (r >= 4 && r <= 8 && symC >= 5 && symC <= 11) {
              filled = true;
              isCore = true;
            } else if ((r === 2 || r === 11 || r === 12 || symC === 0 || symC === 1) && r <= 12) {
              filled = true;
              isAccent = (symC === 0 || symC === 1);
            }
            break;

          case 7: // Honeycomb Lattice Maze (Full screen dense hexagonal mesh)
            if ((r + symC) % 2 === 0 && r >= 2 && r <= 12) {
              filled = true;
              isCore = (r >= 4 && r <= 8 && symC >= 8 && symC <= 11);
              isAccent = symC <= 2;
              isSteel = includeSteel && isAny(r, [4, 10]) && (symC === 0 || symC === 6);
            }
            break;

          case 8: // Hourglass Funnel (Wide top and bottom, narrow 2-block waist)
            const waist = Math.abs(r - 7) + 2;
            if (r >= 2 && r <= 12) {
              if (symC <= waist) {
                filled = true;
                isSteel = includeSteel && (r === 2 || r === 12) && symC === waist;
                isCore = (r === 7 && symC >= 9);
                isAccent = symC <= 2;
              } else if ((symC === 10 || symC === 11) && r >= 5 && r <= 9) {
                filled = true;
                isCore = true;
              }
            }
            break;

          case 9: // Pinball Bumper Field (Clusters of diamond bumpers with chutes)
            const dist1 = Math.abs(r - 4) + Math.abs(symC - 3);
            const dist2 = Math.abs(r - 9) + Math.abs(symC - 8);
            const dist3 = Math.abs(r - 4) + Math.abs(symC - 9);
            if (dist1 <= 2 || dist2 <= 2 || dist3 <= 2) {
              filled = true;
              isCore = (dist1 === 0 || dist2 === 0 || dist3 === 0);
              isSteel = includeSteel && (dist1 === 2 && r === 4 && symC === 1);
            } else if (symC === 0 && r >= 2 && r <= 11) {
              filled = true;
            }
            break;

          case 10: // Double Castle Battlements (Two fortified keeps on flanks, drawbridge center)
            if (symC <= 4 && r >= 2 && r <= 11) {
              if (r === 2) filled = (symC === 0 || symC === 2 || symC === 4);
              else if (r >= 3 && r <= 10) {
                filled = !(isAny(r, [6, 7]) && (symC === 1 || symC === 2));
                isSteel = includeSteel && (r === 3 || symC === 4);
                isCore = (symC === 1 || symC === 2);
              } else if (r === 11) filled = true;
            } else if ((r === 5 || r === 6) && symC >= 5) {
              filled = true;
              isAccent = true;
            } else if (r >= 8 && r <= 11 && symC >= 7) {
              filled = (r + symC) % 2 === 0;
              isCore = true;
            }
            break;

          case 11: // Cascade Waterfall (Descending staircase barriers)
            const step = (c % 6);
            if ((r - 2) === step || (r - 2) === (step + 1)) {
              filled = true;
              isSteel = includeSteel && step === 0 && r === 2;
              isAccent = step >= 4;
            } else if (isAny(r, [2, 8, 12]) && (symC === 0 || symC === 11)) {
              filled = true;
              isCore = true;
            }
            break;

          case 12: // Starfighter Wing Blades (Razor-thin full-width wing spans)
            const span = Math.min(11, Math.abs(r - 7) * 2);
            if (symC <= span && r >= 2 && r <= 12) {
              if ((r + symC) % 2 === 0 || symC === span) {
                filled = true;
                isAccent = symC === span;
                isSteel = includeSteel && r === 7 && symC === 0;
              }
            } else if (r >= 5 && r <= 9 && symC >= 8 && symC <= 11) {
              filled = true;
              isCore = true;
            }
            break;

          case 13: // Pyramid of Giza with Burial Chamber
            const maxW = Math.max(0, 11 - (r - 2));
            if (r >= 2 && r <= 12 && symC >= (11 - maxW)) {
              if (r >= 6 && r <= 8 && symC >= 9 && symC <= 11) {
                filled = (r === 7 && symC === 10);
                isCore = true;
              } else {
                filled = true;
                isSteel = includeSteel && r === 5 && symC === (11 - maxW);
                isAccent = (r % 2 === 0);
              }
            }
            break;

          case 14: // Checkerboard Prison (Tight 1x1 cells)
            if ((r + c) % 2 === 0 && r >= 2 && r <= 12) {
              filled = true;
              isSteel = includeSteel && isAny(r, [3, 7, 11]) && isAny(symC, [1, 5, 9]);
              isCore = (r >= 5 && r <= 8 && symC >= 7 && symC <= 10);
              isAccent = symC <= 2;
            }
            break;

          case 15: // Spiral Maze (Winding clockwise corridor from perimeter to core)
            const ring = Math.min(r - 1, 13 - r, symC, 11 - symC);
            if ((ring === 0 || ring === 2 || ring === 4) && r >= 2 && r <= 12) {
              const gap1 = (ring === 0 && r === 7 && symC === 0);
              const gap2 = (ring === 2 && r === 3 && symC === 6);
              const gap3 = (ring === 4 && r === 9 && symC === 9);
              if (!gap1 && !gap2 && !gap3) {
                filled = true;
                isSteel = includeSteel && ring === 2 && (r === 3 || r === 11);
                isCore = ring === 4;
                isAccent = ring === 0;
              }
            }
            break;

          case 16: // Trident Fortress (3 massive vertical prongs with guarded bays)
            if (isAny(symC, [0, 1, 5, 6, 10, 11]) && r >= 2 && r <= 10) {
              filled = true;
              isSteel = includeSteel && (r === 2 || r === 6) && (symC === 0 || symC === 5 || symC === 10);
              isCore = (symC === 10 || symC === 11);
            } else if ((r === 11 || r === 12) && symC <= 11) {
              filled = !(r === 12 && (symC === 3 || symC === 8));
              isAccent = true;
            }
            break;

          case 17: // The Diamond Matrix (Interlocking diamond grates)
            const distGrid = ((r - 2) % 4) + (symC % 4);
            if ((distGrid === 1 || distGrid === 2) && r >= 2 && r <= 12) {
              filled = true;
              isCore = (r >= 5 && r <= 8 && symC >= 7 && symC <= 11);
              isAccent = symC <= 2;
              isSteel = includeSteel && (r === 4 || r === 8) && symC === 0;
            }
            break;

          case 18: // Dual Crosses & Side Bunkers
            const isCross1 = (isAny(symC, [3, 4]) && r >= 2 && r <= 12) || (isAny(r, [6, 7]) && symC <= 7);
            const isCross2 = (isAny(symC, [9, 10]) && r >= 4 && r <= 11) || (r === 8 && symC >= 8);
            if (isCross1 || isCross2) {
              filled = true;
              isSteel = includeSteel && isAny(r, [2, 12]) && isAny(symC, [3, 4]);
              isCore = isAny(r, [6, 7]) && isAny(symC, [3, 4]);
              isAccent = symC <= 1;
            }
            break;

          case 19: // Fortress Gatehouse with Portcullis
            if (symC <= 3 && r >= 2 && r <= 12) {
              filled = true;
              isSteel = includeSteel && r === 2;
              isAccent = symC === 3;
            } else if ((r === 3 || r === 4) && symC >= 4) {
              filled = true;
              isSteel = includeSteel && (symC === 6 || symC === 7);
            } else if (r >= 5 && r <= 9 && isAny(symC, [5, 7, 9, 11])) {
              filled = true;
              isCore = (r === 7 || r === 8);
            } else if (r >= 10 && r <= 12 && symC >= 6) {
              filled = (r + symC) % 2 === 0;
              isCore = true;
            }
            break;

          case 20: // The Waffle Grid (Every 2nd block with narrow cross-alleys)
            if ((r % 2 === 0 || c % 3 === 0) && r >= 2 && r <= 12) {
              if (!(isAny(r, [6, 8]) && (symC === 4 || symC === 8))) {
                filled = true;
                isSteel = includeSteel && r === 6 && (symC === 0 || symC === 11);
                isCore = (r >= 5 && r <= 7 && symC >= 9 && symC <= 11);
                isAccent = symC <= 2;
              }
            }
            break;

          case 21: // Venetian Blinds (Slanted horizontal louvers)
            if ((r + Math.floor(c / 2)) % 3 === 0 && r >= 2 && r <= 12) {
              filled = true;
              isSteel = includeSteel && r === 2 && symC <= 3;
              isCore = (r >= 6 && r <= 8 && symC >= 7 && symC <= 10);
              isAccent = (symC === 0 || symC === 11);
            }
            break;

          case 22: // Ancient Monoliths (Ring arrangement)
            const distM = Math.abs(r - 7) * 1.5 + Math.abs(symC - 6);
            if (distM >= 5 && distM <= 9 && r >= 2 && r <= 12) {
              if ((r + symC) % 2 === 0 || symC === 0 || symC === 11) {
                filled = true;
                isSteel = includeSteel && isAny(r, [4, 10]) && symC === 6;
                isCore = distM <= 6;
              }
            } else if (r >= 6 && r <= 8 && symC >= 9 && symC <= 11) {
              filled = true;
              isCore = true;
            }
            break;

          case 23: // The Bunkered Slits (Alternating left and right firing slits)
            if (isAny(r, [2, 4, 6, 8, 10, 12])) {
              const isBlocked = (r % 4 === 2 && symC <= 8) || (r % 4 === 0 && symC >= 3);
              if (isBlocked) {
                filled = true;
                isSteel = includeSteel && (symC === 0 || symC === 11);
                isAccent = (symC === 4 || symC === 5);
              }
            }
            break;

          case 24: // Star of David / Hexagram
            const distTri1 = Math.max(r - 8, -(r - 4), symC - 8);
            const distTri2 = Math.max(-(r - 6), r - 10, symC - 8);
            if ((distTri1 <= 2 || distTri2 <= 2) && r >= 2 && r <= 12) {
              filled = true;
              isCore = (r >= 5 && r <= 8 && symC >= 9 && symC <= 11);
              isAccent = symC <= 2;
              isSteel = includeSteel && isAny(r, [3, 11]) && symC === 0;
            }
            break;

          case 25: // Twin Dragons (Sinuous S-curves across both halves)
            const wave = Math.floor(4 * Math.abs(Math.sin((r - 2) * 0.6)));
            if (Math.abs(symC - wave) <= 1 && r >= 2 && r <= 12) {
              filled = true;
              isSteel = includeSteel && r === 7 && symC === wave;
              isAccent = symC >= 8;
            } else if ((symC === 0 || symC === 1) && r >= 3 && r <= 11) {
              filled = true;
              isCore = true;
            }
            break;

          case 26: // The Great Citadel Gate (3 levels of ramparts)
            if (r === 2 || r === 3) {
              filled = (symC !== 5 && symC !== 6);
              isSteel = includeSteel && isAny(symC, [0, 1, 10, 11]);
            } else if (r === 6 || r === 7) {
              filled = (symC !== 2 && symC !== 9);
              isAccent = true;
            } else if (r === 10 || r === 11) {
              filled = (symC <= 7);
              isCore = (r >= 8 && r <= 11 && symC >= 9 && symC <= 11);
            } else if (r >= 4 && r <= 9 && (symC === 0 || symC === 11)) {
              filled = true;
            }
            break;

          case 27: // Fortress Moat & Island (Surrounded by steel ring with single side bridge)
            const isMoatWall = ((r === 3 || r === 11) && symC <= 9) || (symC === 9 && r >= 3 && r <= 11);
            const isBridge = (r === 7 && symC === 9);
            if (isMoatWall && !isBridge) {
              filled = true;
              isSteel = true;
            } else if (r >= 5 && r <= 9 && symC <= 7) {
              filled = (r + symC) % 2 === 0;
              isCore = true;
            } else if (r === 2 || r === 12 || symC === 0 || symC === 1) {
              filled = true;
              isAccent = true;
            }
            break;

          case 28: // Double Diamond Vaults (Flanking vaults with central pinball funnel)
            const distV = Math.abs(r - 7) + Math.abs(symC - 5);
            if (distV <= 3) {
              filled = true;
              isCore = distV <= 1;
              isSteel = includeSteel && distV === 3 && r === 7;
            } else if ((symC === 0 || symC === 11) && r >= 2 && r <= 12) {
              filled = true;
              isAccent = true;
            } else if ((r === 2 || r === 12) && symC >= 2 && symC <= 9) {
              filled = true;
            }
            break;

          case 29: // The Grand Arch & Vault Pillars
            if ((r === 2 && symC <= 10) || (symC === 10 && r >= 2 && r <= 12)) {
              filled = true;
              isSteel = includeSteel && r === 2 && (symC === 4 || symC === 5);
              isAccent = true;
            } else if (r >= 5 && r <= 10 && symC <= 7) {
              filled = (r + symC) % 2 === 0;
              isCore = (r >= 6 && r <= 8 && symC >= 3 && symC <= 5);
            }
            break;

          case 30: // Stepped Amphitheater
            const stepA = (r - 2);
            if (r >= 2 && r <= 12 && symC >= (11 - stepA)) {
              filled = true;
              isSteel = includeSteel && (r === 4 || r === 8) && symC === (11 - stepA);
              isAccent = (symC === 11);
            } else if (symC <= 1 && r >= 2 && r <= 10) {
              filled = true;
              isCore = true;
            }
            break;

          case 31: // Vertical Sieve Columns (6 columns with alternating 2-block gaps)
            if (isAny(symC, [1, 3, 5, 7, 9, 11]) && r >= 2 && r <= 12) {
              const isGap = (r % 4 === 0 && (symC === 1 || symC === 5 || symC === 9)) || (r % 4 === 2 && (symC === 3 || symC === 7 || symC === 11));
              if (!isGap) {
                filled = true;
                isSteel = includeSteel && (r === 2 || r === 12) && (symC === 1 || symC === 11);
                isCore = (r >= 5 && r <= 8 && (symC === 9 || symC === 11));
              }
            }
            break;

          case 32: // Chevron Forward Arrows (Full width V-shapes)
            if (Math.abs(symC - (r - 1)) <= 1 && r >= 2 && r <= 12) {
              filled = true;
              isSteel = includeSteel && r === 2 && symC === 1;
              isAccent = symC >= 9;
            } else if ((symC === 0 || symC === 11) && r >= 4 && r <= 10) {
              filled = true;
              isCore = true;
            }
            break;

          case 33: // Castle Courtyard with 4 Guard Towers
            const isTower1 = (symC <= 2 || symC >= 9) && isAny(r, [2, 3, 10, 11]);
            const isPerimeter = ((r === 4 || r === 9) && symC >= 2 && symC <= 9) || ((symC === 2 || symC === 9) && r >= 4 && r <= 9);
            if (isTower1) {
              filled = true;
              isSteel = includeSteel && (symC === 0 || symC === 11);
              isAccent = true;
            } else if (isPerimeter) {
              filled = !((r === 4 || r === 9) && (symC === 5 || symC === 6));
            } else if ((r === 6 || r === 7) && symC >= 4 && symC <= 7) {
              filled = true;
              isCore = true;
            }
            break;

          case 34: // Space Fleet Formations (3 heavy cruisers with side escorts)
            if ((symC === 2 || symC === 3) && r >= 3 && r <= 11) {
              filled = !(r === 6 || r === 7);
              isCore = (r === 4 || r === 5);
            } else if ((symC === 8 || symC === 9) && r >= 4 && r <= 10) {
              filled = (r !== 7);
              isAccent = true;
            } else if ((symC === 0 || symC === 11) && r >= 2 && r <= 12) {
              filled = (r % 2 === 0);
              isSteel = includeSteel && r === 2;
            }
            break;

          case 35: // Labyrinthine Swirl (Symmetric double meander)
            if ((r * 2 + symC) % 5 === 0 && r >= 2 && r <= 12) {
              filled = true;
              isSteel = includeSteel && (r === 4 || r === 9) && (symC === 0 || symC === 10);
              isCore = (r >= 5 && r <= 8 && symC >= 7 && symC <= 10);
              isAccent = symC <= 2;
            }
            break;

          case 36: // The Fortress Trench (Wide bunker with 2 narrow sniper slots)
            if (r >= 2 && r <= 4) {
              filled = (symC !== 3 && symC !== 8);
              isSteel = includeSteel && isAny(symC, [0, 1, 10, 11]);
            } else if (r >= 5 && r <= 8) {
              filled = (symC === 0 || symC === 1 || symC === 5 || symC === 6 || symC === 10 || symC === 11);
              isCore = (symC === 5 || symC === 6);
            } else if (r >= 9 && r <= 11) {
              filled = (symC <= 8);
              isAccent = true;
            }
            break;

          case 37: // Gothic Cathedral Rose Window & Transept
            const distRose = Math.abs(r - 6) + Math.abs(symC - 8);
            if ((distRose === 1 || distRose === 3 || distRose === 5) && r >= 2 && r <= 11) {
              filled = true;
              isCore = (distRose === 1);
              isSteel = includeSteel && distRose === 5 && r === 6;
            } else if (symC <= 2 && r >= 2 && r <= 12) {
              filled = (r % 2 === 0);
              isAccent = true;
            }
            break;

          case 38: // The Diagonal Crossfire (Two giant X-beams spanning full width)
            const beam1 = Math.abs(symC - (r - 1)) <= 1 && r >= 2 && r <= 12;
            const beam2 = Math.abs(symC - (12 - r)) <= 1 && r >= 2 && r <= 12;
            if (beam1 || beam2) {
              filled = true;
              isSteel = includeSteel && beam1 && beam2;
              isCore = (r >= 5 && r <= 8 && symC >= 4 && symC <= 7);
              isAccent = (symC === 0 || symC === 11);
            }
            break;

          case 39: // The Ultimate Boss Stronghold (Triple-tiered fortress with 1-block entrance)
            if (r === 2) {
              filled = (symC !== 5 && symC !== 6);
              isSteel = includeSteel && isAny(symC, [0, 1, 10, 11]);
            } else if (r === 3 || r === 4) {
              filled = isAny(symC, [0, 1, 4, 5, 6, 7, 10, 11]);
              isAccent = (symC === 4 || symC === 7);
            } else if (r === 5) {
              filled = (symC !== 2 && symC !== 9);
              isSteel = true;
            } else if (r >= 6 && r <= 9) {
              filled = (symC <= 8);
              isCore = (r >= 7 && r <= 8 && symC >= 3 && symC <= 6);
            } else if (r === 10 || r === 11) {
              filled = (symC === 0 || symC === 1 || symC === 8 || symC === 9 || symC === 10 || symC === 11);
            }
            break;
        }

        // Apply modifier filter
        if (filled) {
          if (modifier === 1) {
            if (!isSteel && !isCore && (r + symC) % 4 === 0 && archetype !== 0 && archetype !== 6 && archetype !== 27) {
              filled = false;
            }
          } else if (modifier === 2) {
            if (!isSteel && (r === 5 || r === 6) && (symC === 3 || symC === 4) && archetype !== 6 && archetype !== 27) {
              filled = false;
            }
          }
        }

        if (filled) {
          let cellType = pal.primary;
          if (isSteel) cellType = 9;
          else if (isCore) cellType = pal.core;
          else if (isAccent) cellType = pal.accent;

          grid[r][c] = cellType;
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

  // Snappy responsive arcade ball speed
  const BASE_BALL_SPEED = 4.0;

  // Paddle
  const paddle = {
    baseWidth: 76,
    width: 76,
    height: 10,
    x: 162,
    y: 425,
    speed: 7,
    radius: 4,
    color: '#0066CC'
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
      color: '#FFFFFF'
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
    let color = '#34C759';

    if (roll < 0.03) { // 3% Floor Barrier (rare!)
      type = 'BARRIER';
      label = 'FLOOR';
      color = '#FF3B30';
    } else if (roll < 0.09) { // 6% Multiply all balls by 3!
      type = 'MULTIPLIER';
      label = '×3';
      color = '#FF9500';
    } else if (roll < 0.16) { // 7% Widen
      type = 'WIDEN';
      label = 'WIDE';
      color = '#0066CC';
    } else { // 6% Multiball (+3)
      type = 'MULTIBALL';
      label = '+3';
      color = '#34C759';
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
    btnPause.textContent = 'Pause';

    levelIndicator.textContent = isRandomMode ? 'RANDOM' : `LEVEL ${currentLevelNumber} / ${TOTAL_LEVELS}`;
  }

  function resetBallOnPaddle() {
    paddle.x = (GAME_WIDTH - paddle.width) / 2;
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
      btnPause.textContent = 'Pause';
    } else if (state === 'GAME_OVER') {
      resetLevel(false);
      state = 'RUNNING';
      hideOverlay();
      btnPause.textContent = 'Pause';
    } else if (state === 'VICTORY') {
      if (!isRandomMode && currentLevelNumber < TOTAL_LEVELS) {
        currentLevelNumber++;
        resetLevel(true);
        state = 'RUNNING';
        hideOverlay();
        btnPause.textContent = 'Pause';
      } else {
        resetLevel(false);
        state = 'RUNNING';
        hideOverlay();
        btnPause.textContent = 'Pause';
      }
    }
  }

  function pauseGame() {
    if (state === 'RUNNING') {
      state = 'PAUSED';
      showOverlay('Paused', 'Game paused. Press Space or tap the button below to resume.', 'Resume', false);
      btnPause.textContent = 'Resume';
    }
  }

  function resumeGame() {
    if (state === 'PAUSED') {
      state = 'RUNNING';
      hideOverlay();
      btnPause.textContent = 'Pause';
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
      btnPause.textContent = 'Pause';
    }
  }

  function triggerGameOver() {
    state = 'GAME_OVER';
    showOverlay('Game Over', 'You ran out of lives on this level.', 'Play Again', false, true);
    btnPause.textContent = 'Pause';
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
      'Victory!',
      hasNext 
        ? `Level ${currentLevelNumber} cleared! Ready to proceed to the next?`
        : 'Congratulations! All bricks have been destroyed!',
      hasNext ? 'Next Level' : 'Play Again',
      hasNext,
      true
    );
    btnPause.textContent = 'Pause';
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
      if (p.y > GAME_HEIGHT) {
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
      } else if (b.x + b.radius >= GAME_WIDTH) {
        b.x = GAME_WIDTH - b.radius;
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
      if (buffBarrierTimer > 0 && b.y + b.radius >= GAME_HEIGHT - 4 && b.dy > 0) {
        b.y = GAME_HEIGHT - 4 - b.radius;
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
      if (b.y - b.radius > GAME_HEIGHT) {
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

  // Render Game Scene (Apple High-DPI Canvas Display)
  function render() {
    ctx.save();
    ctx.scale(canvas.width / GAME_WIDTH, canvas.height / GAME_HEIGHT);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Bottom barrier (if buff active)
    if (buffBarrierTimer > 0) {
      ctx.fillStyle = '#FF3B30';
      ctx.fillRect(0, GAME_HEIGHT - 4, GAME_WIDTH, 4);
      ctx.shadowColor = '#FF3B30';
      ctx.shadowBlur = 8;
      ctx.fillRect(0, GAME_HEIGHT - 3, GAME_WIDTH, 2);
      ctx.shadowBlur = 0;
    }

    // Render Bricks (Clean Apple Glass Tile Bevels)
    if (bricks && bricks.length > 0) {
      for (let r = 0; r < brickRows; r++) {
        if (!bricks[r]) continue;
        for (let c = 0; c < brickCols; c++) {
          const b = bricks[r][c];
          if (b && b.hp > 0) {
            if (b.unbreakable) {
              ctx.fillStyle = '#2C2C2E';
              drawRoundedRect(ctx, b.x, b.y, brickWidth, brickHeight, 2);
              ctx.fill();

              // Clean steel highlight
              ctx.fillStyle = '#48484A';
              ctx.fillRect(b.x + 1, b.y + 1, brickWidth - 2, 1);

              // Metal center rivet
              ctx.fillStyle = '#8E8E93';
              ctx.fillRect(b.x + Math.floor(brickWidth / 2) - 1, b.y + Math.floor(brickHeight / 2) - 1, 2, 2);
            } else {
              ctx.fillStyle = b.fill;
              if (b.hp < b.maxHp) {
                ctx.globalAlpha = 0.55; // Damaged state
              } else {
                ctx.globalAlpha = 1.0;
              }

              drawRoundedRect(ctx, b.x, b.y, brickWidth, brickHeight, 2);
              ctx.fill();

              // Top bevel highlight (crisp glossy Apple glass tile)
              ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
              ctx.fillRect(b.x + 1, b.y + 1, brickWidth - 2, 1);

              // Bottom bevel shadow
              ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
              ctx.fillRect(b.x + 1, b.y + brickHeight - 2, brickWidth - 2, 1);

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

      // Top capsule shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(p.x + 2, p.y + 1, p.width - 4, 1);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "SF Pro Text", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, p.x + p.width / 2, p.y + p.height / 2 + 0.5);
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

    // Top highlight on paddle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(paddle.x + 2, paddle.y + 1, paddle.width - 4, 1);

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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(b.x - 1.5, b.y - 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ready launch hint (Apple Frosted Capsule Pill)
    if (state === 'READY') {
      const promptText = 'Press Space or tap screen to launch ball';
      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';
      const textMetrics = ctx.measureText(promptText);
      const pillW = Math.round(textMetrics.width + 30);
      const pillH = 30;
      const pillX = Math.round((GAME_WIDTH - pillW) / 2);
      const pillY = 275;

      // Dark translucent capsule
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 15);
      ctx.fill();

      // Delicate Apple hairline outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Razor-sharp crisp white typography
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(promptText, GAME_WIDTH / 2, pillY + pillH / 2);
    }

    ctx.restore();
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
    progressText.textContent = `Completed: ${completedLevels.size} / ${TOTAL_LEVELS}`;
    starsText.textContent = `Best: ${bestScore}`;
    if (playCampaignText) {
      playCampaignText.textContent = `▶ Start Game (Level ${unlockedLevel})`;
    }

    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-btn';
      btn.textContent = i;
      btn.setAttribute('aria-label', `Level ${i}`);

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
    resizeCanvas();
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
    modeDesc.textContent = 'Select a level to play. Progress is saved automatically on your device.';
  });

  tabRandom.addEventListener('click', () => {
    tabRandom.classList.add('active');
    tabCampaign.classList.remove('active');
    campaignPanel.classList.add('hidden');
    randomPanel.classList.remove('hidden');
    modeDesc.textContent = 'Endless mode with unique symmetric field generations.';
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
    if (!rect.width) return;
    const canvasX = ((clientX - rect.left) / rect.width) * GAME_WIDTH;
    paddle.x = Math.max(0, Math.min(GAME_WIDTH - paddle.width, canvasX - paddle.width / 2));
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
      paddle.x = Math.min(GAME_WIDTH - paddle.width, paddle.x + paddle.speed * 3.5);
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
