/**
 * Arkanoid Mini-Game // Refyrd Games
 * Features realistic angle deflection, multi-hit bricks, particle effects, and touch controls.
 */
(function() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const screenBox = document.querySelector('.canvas-screen-box');
  const scoreDisplay = document.getElementById('score-display');
  const bestDisplay = document.getElementById('best-display');
  const livesDisplay = document.getElementById('lives-display');
  const btnPause = document.getElementById('btn-pause');
  const btnRestart = document.getElementById('btn-restart');
  const overlay = document.getElementById('game-overlay');
  const overlayHeading = document.getElementById('overlay-heading');
  const overlayDesc = document.getElementById('overlay-desc');
  const overlayBtn = document.getElementById('overlay-btn');
  const soundToggle = document.getElementById('sound-toggle');
  const soundStatus = document.getElementById('sound-status');
  const debugBadge = document.getElementById('debug-badge');

  // Debug Modal Elements
  const debugModal = document.getElementById('debug-modal');
  const dbgAddLife = document.getElementById('dbg-add-life');
  const dbgClearBricks = document.getElementById('dbg-clear-bricks');
  const dbgSoundBounce = document.getElementById('dbg-sound-bounce');
  const dbgSoundBreak = document.getElementById('dbg-sound-break');
  const dbgWin = document.getElementById('dbg-win');
  const dbgGameover = document.getElementById('dbg-gameover');
  const dbgClose = document.getElementById('dbg-close');

  // Audio Synthesizer via Web Audio API
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
      playTone(480, 0.06, 'triangle');
    } else if (name === 'wall') {
      playTone(660, 0.04, 'sine');
    } else if (name === 'hit') {
      playTone(720, 0.07, 'triangle');
    } else if (name === 'break') {
      playTone(880, 0.08, 'triangle');
      setTimeout(() => playTone(1100, 0.08, 'triangle'), 40);
    } else if (name === 'lose_life') {
      playTone(220, 0.15, 'sawtooth');
      setTimeout(() => playTone(150, 0.2, 'sawtooth'), 120);
    } else if (name === 'win') {
      playTone(523.25, 0.1, 'triangle');
      setTimeout(() => playTone(659.25, 0.1, 'triangle'), 90);
      setTimeout(() => playTone(783.99, 0.12, 'triangle'), 180);
      setTimeout(() => playTone(1046.5, 0.25, 'triangle'), 270);
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

  // Game Engine & State
  let state = 'READY'; // READY, RUNNING, PAUSED, GAME_OVER, VICTORY
  let score = 0;
  let lives = 3;
  let bestScore = parseInt(localStorage.getItem('refyrd_arkanoid_best') || '0', 10);
  bestDisplay.textContent = String(bestScore).padStart(3, '0');

  let isDebugSession = false;
  let pauseClicks = 0;
  let pauseClickTimer = null;

  // Paddle
  const paddle = {
    width: 76,
    height: 10,
    x: 162,
    y: 425,
    speed: 7,
    radius: 4,
    color: '#2E66FF'
  };

  // Ball
  const ball = {
    x: 200,
    y: 416,
    radius: 5,
    speed: 4.8,
    dx: 3.2,
    dy: -3.8,
    color: '#F4F5F8'
  };

  // Bricks Setup
  const brickRows = 5;
  const brickCols = 8;
  const brickWidth = 42;
  const brickHeight = 15;
  const brickGap = 5;
  const brickOffsetTop = 45;
  const brickOffsetLeft = 14;

  const rowColors = [
    { fill: '#FF4D36', border: '#FF6B57', hp: 2, points: 30 }, // Row 0: Red (2 hits)
    { fill: '#FF9F1C', border: '#FFAF3D', hp: 1, points: 20 }, // Row 1: Orange
    { fill: '#FFE047', border: '#FFE970', hp: 1, points: 15 }, // Row 2: Yellow
    { fill: '#22C55E', border: '#4ADE80', hp: 1, points: 10 }, // Row 3: Green
    { fill: '#2E66FF', border: '#5B88FF', hp: 1, points: 10 }  // Row 4: Blue
  ];

  let bricks = [];
  let particles = [];

  function initBricks() {
    bricks = [];
    for (let r = 0; r < brickRows; r++) {
      bricks[r] = [];
      const config = rowColors[r];
      for (let c = 0; c < brickCols; c++) {
        const bx = brickOffsetLeft + c * (brickWidth + brickGap);
        const by = brickOffsetTop + r * (brickHeight + brickGap);
        bricks[r][c] = {
          x: bx,
          y: by,
          hp: config.hp,
          maxHp: config.hp,
          points: config.points,
          fill: config.fill,
          border: config.border
        };
      }
    }
  }

  function spawnParticles(x, y, color) {
    const count = 7;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const spd = Math.random() * 2.5 + 1.2;
      particles.push({
        x: x,
        y: y,
        dx: Math.cos(angle) * spd,
        dy: Math.sin(angle) * spd,
        life: 14,
        maxLife: 14,
        size: Math.random() * 2.5 + 1.5,
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

  function resetGame() {
    score = 0;
    lives = 3;
    scoreDisplay.textContent = '000';
    updateLivesDisplay();
    isDebugSession = false;
    debugBadge.classList.add('hidden');
    initBricks();
    particles = [];
    resetBallOnPaddle();
    state = 'READY';
    showOverlay('Арканоид', 'Ведите пальцем или мышью по экрану для управления ракеткой.', 'Запустить шар');
    btnPause.textContent = 'Пауза';
  }

  function resetBallOnPaddle() {
    paddle.x = (canvas.width - paddle.width) / 2;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius - 1;
    const angle = (Math.random() * 0.4 + 0.3) * Math.PI; // Upwards angle
    const speed = 4.8;
    ball.dx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -Math.abs(Math.sin(angle) * speed);
  }

  function startGame() {
    if (state === 'READY') {
      state = 'RUNNING';
      hideOverlay();
      btnPause.textContent = 'Пауза';
    } else if (state === 'PAUSED') {
      state = 'RUNNING';
      hideOverlay();
      btnPause.textContent = 'Пауза';
    } else if (state === 'GAME_OVER' || state === 'VICTORY') {
      resetGame();
      state = 'RUNNING';
      hideOverlay();
      btnPause.textContent = 'Пауза';
    }
  }

  function pauseGame() {
    if (state === 'RUNNING') {
      state = 'PAUSED';
      showOverlay('Пауза', 'Игра приостановлена. Нажмите Пробел или кнопку ниже.', 'Продолжить');
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
      showOverlay('Потеря шарика', `Осталось жизней: ${lives}. Нажмите кнопку для продолжения.`, 'Продолжить');
      btnPause.textContent = 'Пауза';
    }
  }

  function triggerGameOver() {
    state = 'GAME_OVER';
    showOverlay('Игра окончена', 'Вы исчерпали все жизни. Попробуйте еще раз!', 'Сыграть снова');
    btnPause.textContent = 'Пауза';
  }

  function triggerVictory() {
    state = 'VICTORY';
    playSound('win');
    showOverlay('Победа!', 'Поздравляем! Все кирпичи успешно разбиты!', 'Играть заново');
    btnPause.textContent = 'Пауза';
  }

  function showOverlay(heading, desc, btnText) {
    overlayHeading.textContent = heading;
    overlayDesc.textContent = desc;
    overlayBtn.textContent = btnText;
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

  // Check victory condition
  function checkRemainingBricks() {
    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        if (bricks[r][c].hp > 0) return false;
      }
    }
    return true;
  }

  // Update loop
  function update() {
    if (state === 'READY') {
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius - 1;
      return;
    }

    if (state !== 'RUNNING') return;

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions (left, right, top)
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.dx = Math.abs(ball.dx);
      playSound('wall');
    } else if (ball.x + ball.radius >= canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.dx = -Math.abs(ball.dx);
      playSound('wall');
    }

    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.dy = Math.abs(ball.dy);
      playSound('wall');
    }

    // Paddle collision
    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x - ball.radius &&
      ball.x <= paddle.x + paddle.width + ball.radius &&
      ball.dy > 0
    ) {
      // Calculate hit position relative to paddle center (-1.0 to 1.0)
      const hitOffset = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      const clampedOffset = Math.max(-0.92, Math.min(0.92, hitOffset));

      const totalSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      const maxBounceAngle = (70 * Math.PI) / 180;
      const bounceAngle = clampedOffset * maxBounceAngle;

      ball.dx = totalSpeed * Math.sin(bounceAngle);
      ball.dy = -totalSpeed * Math.cos(bounceAngle);
      ball.y = paddle.y - ball.radius - 1;

      playSound('paddle');
    }

    // Bottom out of bounds
    if (ball.y - ball.radius > canvas.height) {
      triggerLifeLost();
      return;
    }

    // Brick collisions
    let hitBrick = false;
    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        const b = bricks[r][c];
        if (b.hp > 0) {
          if (
            ball.x + ball.radius > b.x &&
            ball.x - ball.radius < b.x + brickWidth &&
            ball.y + ball.radius > b.y &&
            ball.y - ball.radius < b.y + brickHeight
          ) {
            // Determine bounce axis based on overlap
            const overlapLeft = (ball.x + ball.radius) - b.x;
            const overlapRight = (b.x + brickWidth) - (ball.x - ball.radius);
            const overlapTop = (ball.y + ball.radius) - b.y;
            const overlapBottom = (b.y + brickHeight) - (ball.y - ball.radius);

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
              ball.dx = -ball.dx;
            } else {
              ball.dy = -ball.dy;
            }

            b.hp--;
            spawnParticles(ball.x, ball.y, b.fill);

            if (b.hp <= 0) {
              score += b.points;
              playSound('break');
            } else {
              score += 5;
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

    if (hitBrick && checkRemainingBricks()) {
      triggerVictory();
      return;
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  // Render loop
  function render() {
    ctx.fillStyle = '#0A0B0E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render bricks
    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        const b = bricks[r][c];
        if (b.hp > 0) {
          ctx.fillStyle = b.hp === 2 ? b.fill : b.fill;
          if (b.hp === 1 && b.maxHp === 2) {
            ctx.globalAlpha = 0.6; // Damaged reinforced brick
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

    // Render particles
    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Render paddle
    ctx.fillStyle = paddle.color;
    drawRoundedRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, paddle.radius);
    ctx.fill();

    // Paddle center mark
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(paddle.x + paddle.width / 2 - 4, paddle.y + 2, 8, 2);

    // Render ball with subtle specular highlight
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFE5B4';
    ctx.beginPath();
    ctx.arc(ball.x - 1.5, ball.y - 1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
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

  // Keyboard navigation
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
      resetGame();
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

  dbgAddLife.addEventListener('click', () => {
    markDebugUsed();
    lives = Math.min(5, lives + 1);
    updateLivesDisplay();
    playSound('paddle');
  });

  dbgClearBricks.addEventListener('click', () => {
    markDebugUsed();
    let kept = 0;
    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        if (kept < 2) {
          bricks[r][c].hp = 1;
          kept++;
        } else {
          bricks[r][c].hp = 0;
        }
      }
    }
    playSound('break');
  });

  dbgSoundBounce.addEventListener('click', () => {
    initAudio();
    playSound('paddle');
  });

  dbgSoundBreak.addEventListener('click', () => {
    initAudio();
    playSound('break');
  });

  dbgWin.addEventListener('click', () => {
    markDebugUsed();
    triggerVictory();
  });

  dbgGameover.addEventListener('click', () => {
    markDebugUsed();
    triggerGameOver();
  });

  // Draggable Debug Window Controller
  const debugHandle = document.getElementById('debug-drag-handle');
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
    } else if (state === 'GAME_OVER' || state === 'VICTORY') {
      resetGame();
      startGame();
    }
  });

  btnRestart.addEventListener('click', () => {
    initAudio();
    playSound('click');
    resetGame();
    startGame();
  });

  // Start Game
  resetGame();
  requestAnimationFrame(gameLoop);
})();
