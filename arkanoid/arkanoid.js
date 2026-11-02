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

  // Brick Layout Dimensions
  const brickRows = 6;
  const brickCols = 8;
  const brickWidth = 42;
  const brickHeight = 15;
  const brickGap = 5;
  const brickOffsetTop = 40;
  const brickOffsetLeft = 14;

  // Brick Color Definitions
  const BRICK_TYPES = {
    1: { fill: '#22C55E', border: '#4ADE80', maxHp: 1, points: 10 }, // 1-hit Green
    2: { fill: '#FF9F1C', border: '#FFAF3D', maxHp: 2, points: 25 }, // 2-hit Amber Orange
    3: { fill: '#FF4D36', border: '#FF6B57', maxHp: 3, points: 50 }, // 3-hit Red Armored
    4: { fill: '#2E66FF', border: '#60A5FA', maxHp: 1, points: 15 }, // 1-hit Blue
    5: { fill: '#FFE047', border: '#FDE047', maxHp: 1, points: 15 }  // 1-hit Yellow
  };

  // 60 Procedural / Handcrafted Patterns Generator
  function generateLevelData(lvlNum) {
    const grid = [];
    for (let r = 0; r < brickRows; r++) grid[r] = new Array(brickCols).fill(0);

    // Archetype selection based on level index
    const archetype = (lvlNum - 1) % 10;
    const tier = Math.floor((lvlNum - 1) / 10); // 0 to 5 (difficulty ramp)

    const strongType = tier >= 3 ? 3 : (tier >= 1 ? 2 : 1);
    const midType = tier >= 2 ? 2 : (lvlNum % 2 === 0 ? 4 : 5);
    const regularType = lvlNum % 3 === 0 ? 1 : (lvlNum % 3 === 1 ? 4 : 5);

    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        const symC = c < 4 ? c : 7 - c; // Horizontal symmetry
        let place = 0;

        switch (archetype) {
          case 0: // Classic Stripes
            place = (r % 2 === 0) ? (r === 0 ? strongType : regularType) : midType;
            break;
          case 1: // Pyramid / Triangle
            if (symC >= 3 - r && r <= 4) place = r === 0 ? strongType : (r <= 2 ? midType : regularType);
            break;
          case 2: // Checkerboard
            if ((r + c) % 2 === 0) place = r < 2 ? strongType : regularType;
            break;
          case 3: // Castle Fortress / Pillars
            if (c === 0 || c === 7 || c === 3 || c === 4 || r === 0 || r === 4) {
              place = (r === 0 || c === 0 || c === 7) ? strongType : midType;
            }
            break;
          case 4: // Diamond Ring
            const dist = Math.abs(r - 2.5) + Math.abs(symC - 1.5);
            if (dist >= 1.5 && dist <= 3.5) place = dist > 2.5 ? strongType : regularType;
            break;
          case 5: // Space Invader
            if (r === 0 && (symC === 1 || symC === 2)) place = regularType;
            else if (r === 1 && symC >= 1) place = regularType;
            else if (r === 2) place = (symC === 1) ? 0 : strongType;
            else if (r === 3 && symC <= 2) place = midType;
            else if (r === 4 && (symC === 0 || symC === 2)) place = strongType;
            break;
          case 6: // Double Chevrons
            if ((symC === r % 3) || (symC === (r + 2) % 4)) place = r < 3 ? strongType : regularType;
            break;
          case 7: // Floating Islands / Clusters
            if ((symC >= 1 && symC <= 2 && (r === 1 || r === 4)) || (r === 0 && symC >= 2)) {
              place = strongType;
            } else if (r === 2 || r === 3) {
              place = regularType;
            }
            break;
          case 8: // Labyrinth / Mazed Corridors
            if (r === 0 || (r === 2 && c > 1) || (r === 4 && c < 6)) place = strongType;
            else if (c === 0 || c === 7) place = midType;
            break;
          case 9: // Hourglass / Symmetrical Core
            if (Math.abs(r - 2.5) >= symC * 0.7) place = r === 0 || r === 5 ? strongType : midType;
            break;
        }

        grid[r][c] = place;
      }
    }

    return grid;
  }

  // Random Mode Pattern Generator
  function generateRandomLevelData() {
    const grid = [];
    for (let r = 0; r < brickRows; r++) {
      grid[r] = new Array(brickCols).fill(0);
      for (let c = 0; c < 4; c++) {
        // Mirrored horizontally for aesthetic balance
        if (Math.random() > 0.28) {
          const randType = Math.random() < 0.2 ? 3 : (Math.random() < 0.4 ? 2 : (Math.random() < 0.7 ? 1 : 4));
          grid[r][c] = randType;
          grid[r][7 - c] = randType;
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

    if (roll < 0.02) { // 2% Barrier
      type = 'BARRIER';
      label = 'ПОЛ';
      color = '#FF4D36';
    } else if (roll < 0.08) { // 6% Multiplier
      type = 'MULTIPLIER';
      label = 'x3';
      color = '#FF9F1C';
    } else if (roll < 0.14) { // 6% Widen
      type = 'WIDEN';
      label = 'РАСШ';
      color = '#2E66FF';
    } else { // 8% Multiball
      type = 'MULTIBALL';
      label = '+3';
      color = '#4ADE80';
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
      buffMultiplierTimer = 15 * 60; // 15 seconds
      multiplierBadge.classList.remove('hidden');
      badgeMult.classList.remove('hidden');
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
        if (bricks[r][c] && bricks[r][c].hp > 0) return false;
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
